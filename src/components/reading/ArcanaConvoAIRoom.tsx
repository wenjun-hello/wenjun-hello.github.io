"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import type { RTMClient } from "agora-rtm";
import {
  fetchAgoraToken,
  inviteAgent,
  stopAgent,
  type AgoraTokenData,
  type InviteAgentContext,
} from "@/lib/agoraApi";
import type { CardWithOrientation } from "@/components/reading/GestureFanDeck";
import type { ReadingContext } from "./ConvoAIContent";

// ── Dynamic imports (browser-only) ──

const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } = await import(
      "agora-rtc-react"
    );
    return {
      default: function AgoraProviders({
        children,
      }: {
        children: React.ReactNode;
      }) {
        const clientRef = useRef<ReturnType<
          typeof AgoraRTC.createClient
        > | null>(null);
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({
            mode: "rtc",
            codec: "vp8",
          });
        }
        return (
          <AgoraRTCProvider client={clientRef.current}>
            {children}
          </AgoraRTCProvider>
        );
      },
    };
  },
  { ssr: false },
);

const ConvoAIContent = dynamic(() => import("./ConvoAIContent"), {
  ssr: false,
});

// ── Types ──

type SessionState =
  | "idle"
  | "fetchingToken"
  | "joining"
  | "connected"
  | "error";

interface ArcanaConvoAIRoomProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CardWithOrientation[];
  questionType: string;
  spreadType: string;
  originalQuestion: string;
  positions?: string[];
  interpretation?: string;
}

// ── Component ──

export default function ArcanaConvoAIRoom({
  isOpen,
  onClose,
  cards,
  questionType,
  spreadType,
  originalQuestion,
  positions,
  interpretation,
}: ArcanaConvoAIRoomProps) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);
  const [agentJoinFailed, setAgentJoinFailed] = useState(false);
  const cleanupRef = useRef<boolean>(false);

  // Build reading context
  const readingContext: ReadingContext = {
    cards,
    questionType,
    spreadType,
    originalQuestion,
    positions,
  };

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSessionState("idle");
      setErrorMessage(null);
      setAgoraData(null);
      setRtmClient(null);
      setAgentJoinFailed(false);
      cleanupRef.current = false;
    }
  }, [isOpen]);

  // ── Start: fetch token → invite agent → setup RTM ──

  const handleStart = useCallback(async () => {
    setSessionState("fetchingToken");
    setErrorMessage(null);
    setAgentJoinFailed(false);
    cleanupRef.current = false;

    try {
      // 1. Fetch RTC + RTM token
      const tokenData = await fetchAgoraToken();
      if (!tokenData.token || !tokenData.channel || !tokenData.uid) {
        throw new Error("Invalid token response from backend");
      }

      // 2. Invite agent + setup RTM in parallel
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!appId) {
        throw new Error("NEXT_PUBLIC_AGORA_APP_ID is not set");
      }

      // 2a. Build invite context from reading data
      const inviteContext: InviteAgentContext = {
        originalQuestion: originalQuestion || undefined,
        questionType: questionType || undefined,
        spreadType: spreadType || undefined,
        cards: cards.map((c) => ({
          name: c.name,
          chineseName: c.chineseName,
          orientation: c.orientation,
          isReversed: c.isReversed,
          keywords: c.keywords,
          coreMeaning: c.coreMeaning,
          upright: c.upright,
          reversed: c.reversed,
          advice: c.advice,
          shadow: c.shadow,
        })),
        interpretation: interpretation || undefined,
        positions: positions || undefined,
        greetingMessage:
          "你好，我已经看过你的牌面了。你想先聊哪一张牌？",
        systemPrompt: [
          "你是专业塔罗解读师，用中文与用户语音对话。",
          "规则：",
          "1. 每次回答最多2句话，总长度不超过80个汉字。",
          "2. 先直接回答用户当前问题，不做冗长铺垫。",
          "3. 除非用户要求，不要重复牌面背景信息。",
          "4. 一次只讨论一个重点，保持对话节奏。",
          "5. 不要连续追问多个问题，每次至多一个。",
          "6. 语气温暖、简洁、有洞察力。",
        ].join("\n"),
      };

      const [agentData, rtm] = await Promise.all([
        // 2b. Invite agent (non-fatal on failure)
        inviteAgent(tokenData.channel, tokenData.uid, inviteContext)
          .then((data) => data)
          .catch((err) => {
            console.error("Agent invite failed:", err);
            setAgentJoinFailed(true);
            return null;
          }),

        // 2b. Setup RTM
        (async () => {
          const { default: AgoraRTM } = await import("agora-rtm");
          const client: RTMClient = new AgoraRTM.RTM(appId, tokenData.uid);
          await client.login({ token: tokenData.token });
          await client.subscribe(tokenData.channel);
          return client;
        })(),
      ]);

      if (cleanupRef.current) {
        // Cleanup was triggered during async operations
        rtm.logout().catch(() => {});
        return;
      }

      setRtmClient(rtm);
      setAgoraData({ ...tokenData, agentId: agentData?.agent_id });
      setSessionState("connected");
    } catch (err: unknown) {
      if (cleanupRef.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setSessionState("error");
    }
  }, []);

  // ── Token renewal ──

  const handleTokenWillExpire = useCallback(
    async (uid: string) => {
      if (!agoraData?.channel) throw new Error("Missing channel for renewal");

      const [rtcRes, rtmRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://tarot-ai-backend.vercel.app"}/api/voice/token?channel=${agoraData.channel}&uid=${uid}`,
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://tarot-ai-backend.vercel.app"}/api/voice/token?channel=${agoraData.channel}&uid=${agoraData.uid}`,
        ),
      ]);

      const [rtcData, rtmData] = await Promise.all([
        rtcRes.json(),
        rtmRes.json(),
      ]);

      if (!rtcRes.ok || !rtmRes.ok) {
        throw new Error("Failed to generate renewal tokens");
      }

      return { rtcToken: rtcData.token, rtmToken: rtmData.token };
    },
    [agoraData],
  );

  // ── End: stop agent + RTM logout ──

  const handleEnd = useCallback(async () => {
    cleanupRef.current = true;

    if (agoraData?.agentId) {
      try {
        await stopAgent(agoraData.agentId);
      } catch (err) {
        console.error("Error stopping agent:", err);
      }
    }

    rtmClient?.logout().catch((err) => console.error("RTM logout error:", err));

    setRtmClient(null);
    setAgoraData(null);
    setSessionState("idle");
    setAgentJoinFailed(false);
    onClose();
  }, [agoraData, rtmClient, onClose]);

  // ── Cleanup on unmount while connected ──

  useEffect(() => {
    return () => {
      if (agoraData?.agentId) {
        stopAgent(agoraData.agentId).catch(() => {});
      }
      rtmClient?.logout().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Preload heavy modules ──

  useEffect(() => {
    if (!isOpen) return;
    import("agora-rtc-react").catch(() => {});
    import("agora-rtm").catch(() => {});
  }, [isOpen]);

  // ── Card summary ──

  const cardSummary = cards
    .map((c) => `${c.chineseName}${c.isReversed ? " 逆位" : ""}`)
    .join(" · ");

  // ── Render ──

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(15,12,9,0.94)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Idle / loading / error states */}
          {sessionState !== "connected" && (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 20px",
              }}
            >
              {/* Title */}
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  marginBottom: 8,
                  fontFamily: "Cinzel, serif",
                  color: "#C7A56F",
                  letterSpacing: "0.15em",
                  textAlign: "center",
                }}
              >
                塔罗语音房
              </h1>
              <p
                style={{
                  fontSize: 13,
                  marginBottom: 6,
                  fontFamily: "Cormorant Garamond, serif",
                  color: "rgba(255,249,239,0.4)",
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                与塔罗师进行实时语音对话
              </p>
              <p
                style={{
                  fontSize: 11,
                  marginBottom: 36,
                  fontFamily: "Cormorant Garamond, serif",
                  color: "rgba(199,165,111,0.5)",
                  textAlign: "center",
                }}
              >
                {cardSummary}
              </p>

              {/* Error message */}
              {errorMessage && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: "rgba(200,80,80,0.12)",
                    border: "1px solid rgba(200,80,80,0.25)",
                    color: "#e88",
                    fontSize: 13,
                    marginBottom: 20,
                    maxWidth: 380,
                    textAlign: "center",
                    wordBreak: "break-word",
                    fontFamily: "Cormorant Garamond, serif",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* Start button */}
              {sessionState !== "error" && (
                <button
                  onClick={handleStart}
                  disabled={sessionState === "fetchingToken"}
                  style={{
                    padding: "12px 32px",
                    fontSize: 14,
                    borderRadius: 40,
                    border: "1px solid rgba(199,165,111,0.4)",
                    background:
                      sessionState === "fetchingToken"
                        ? "rgba(199,165,111,0.15)"
                        : "#C7A56F",
                    color:
                      sessionState === "fetchingToken"
                        ? "rgba(255,249,239,0.5)"
                        : "#FFF9EF",
                    cursor:
                      sessionState === "fetchingToken"
                        ? "not-allowed"
                        : "pointer",
                    fontFamily: "Cinzel, serif",
                    letterSpacing: "0.1em",
                    boxShadow:
                      sessionState === "fetchingToken"
                        ? "none"
                        : "0 8px 32px rgba(199,165,111,0.18)",
                  }}
                >
                  {sessionState === "fetchingToken"
                    ? "正在连接……"
                    : "进入语音房"}
                </button>
              )}

              {/* Error actions */}
              {sessionState === "error" && (
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => {
                      setSessionState("idle");
                      setErrorMessage(null);
                    }}
                    style={{
                      padding: "10px 24px",
                      fontSize: 13,
                      borderRadius: 40,
                      border: "1px solid rgba(199,165,111,0.3)",
                      background: "rgba(199,165,111,0.1)",
                      color: "#C7A56F",
                      cursor: "pointer",
                      fontFamily: "Cinzel, serif",
                      letterSpacing: "0.08em",
                    }}
                  >
                    重试
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      padding: "10px 24px",
                      fontSize: 13,
                      borderRadius: 40,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent",
                      color: "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      fontFamily: "Cinzel, serif",
                      letterSpacing: "0.08em",
                    }}
                  >
                    返回
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Agent join warning banner */}
          {agentJoinFailed && sessionState === "connected" && (
            <div
              style={{
                padding: "10px 16px",
                background: "rgba(200,150,50,0.15)",
                borderBottom: "1px solid rgba(200,150,50,0.3)",
                color: "#ea0",
                fontSize: 13,
                textAlign: "center",
                fontFamily: "Cormorant Garamond, serif",
              }}
            >
              AI 塔罗师加入失败 — 可能无法正常对话。
            </div>
          )}

          {/* Connected: render ConvoAIContent */}
          {sessionState === "connected" && agoraData && rtmClient && (
            <Suspense
              fallback={
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#888",
                    fontFamily: "Cormorant Garamond, serif",
                    fontStyle: "italic",
                  }}
                >
                  加载语音房……
                </div>
              }
            >
              <AgoraProvider>
                <ConvoAIContent
                  agoraData={agoraData}
                  rtmClient={rtmClient}
                  readingContext={readingContext}
                  onTokenWillExpire={handleTokenWillExpire}
                  onEnd={handleEnd}
                />
              </AgoraProvider>
            </Suspense>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
