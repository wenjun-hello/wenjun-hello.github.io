"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import type { RTMClient } from "agora-rtm";
import {
  fetchAgoraToken,
  inviteAgent,
  stopAgent,
  beaconStopAgent,
  type AgoraTokenData,
  type InviteAgentContext,
  type VoiceInviteResponse,
  type VoiceStopResponse,
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
  | "preparing"
  | "inviting"
  | "rtmConnecting"
  | "connected"
  | "error";

type EndReason =
  | "user_end"
  | "overlay_close"
  | "timeout"
  | "component_unmount"
  | "page_unload"
  | "route_change"
  | "agent_error"
  | "init_failure";

interface VoiceSessionInfo {
  sessionId: string;
  sessionExpiresAt: string;
  maxSessionSeconds: number;
  dailyLimitSeconds: number;
  usedSeconds: number;
  remainingSeconds: number;
}

interface ArcanaConvoAIRoomProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CardWithOrientation[];
  questionType: string;
  spreadType: string;
  originalQuestion: string;
  positions?: string[];
  interpretation?: string;
  deviceId: string;
  serverRemainingSeconds: number;
}

// ── Helpers ──

function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function calcSecondsLeft(sessionExpiresAt: string): number {
  const now = Date.now();
  const end = new Date(sessionExpiresAt).getTime();
  return Math.max(0, (end - now) / 1000);
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
  deviceId,
  serverRemainingSeconds,
}: ArcanaConvoAIRoomProps) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);
  const [agentJoinFailed, setAgentJoinFailed] = useState(false);

  // ── Session & timer state ──
  const [sessionInfo, setSessionInfo] = useState<VoiceSessionInfo | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);
  const [dailyTimeLeft, setDailyTimeLeft] = useState<number>(serverRemainingSeconds);
  const [timeWarning, setTimeWarning] = useState<"none" | "30s" | "10s" | "expired">("none");
  const [finalStopResult, setFinalStopResult] = useState<VoiceStopResponse | null>(null);

  // ── Refs for idempotent ending ──
  const isEndingRef = useRef(false);
  const sessionInfoRef = useRef<VoiceSessionInfo | null>(null);
  const agoraDataRef = useRef<AgoraTokenData | null>(null);
  const rtmClientRef = useRef<RTMClient | null>(null);
  const cleanupRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startingRef = useRef(false);
  const rtmInitRef = useRef(false); // prevent double RTM init in StrictMode

  // Keep refs in sync
  useEffect(() => { sessionInfoRef.current = sessionInfo; }, [sessionInfo]);
  useEffect(() => { agoraDataRef.current = agoraData; }, [agoraData]);
  useEffect(() => { rtmClientRef.current = rtmClient; }, [rtmClient]);

  // Build reading context
  const readingContext: ReadingContext = {
    cards,
    questionType,
    spreadType,
    originalQuestion,
    positions,
  };

  // ── Countdown timer ──

  useEffect(() => {
    if (!sessionInfo?.sessionExpiresAt) return;

    const tick = () => {
      const left = calcSecondsLeft(sessionInfo.sessionExpiresAt!);
      setSessionTimeLeft(left);

      // Update daily estimate
      setDailyTimeLeft((prev) => Math.max(0, prev - 1));

      if (left <= 0) {
        setTimeWarning("expired");
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        endVoiceSession("timeout");
      } else if (left <= 10) {
        setTimeWarning("10s");
      } else if (left <= 30) {
        setTimeWarning("30s");
      }
    };

    tick(); // immediate
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionInfo?.sessionExpiresAt]);

  // ── Unified end function (idempotent) ──

  const endVoiceSession = useCallback(
    async (reason: EndReason) => {
      if (isEndingRef.current) return;
      isEndingRef.current = true;

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const sInfo = sessionInfoRef.current;
      const aData = agoraDataRef.current;
      const rtm = rtmClientRef.current;

      // Stop RTM
      rtm?.logout().catch(() => {});

      // Stop backend agent (only if we have session info)
      if (sInfo?.sessionId && aData?.agentId && aData?.channel) {
        try {
          const result = await stopAgent({
            deviceId,
            sessionId: sInfo.sessionId,
            agentId: aData.agentId,
            channel: aData.channel,
          });
          if (result.success) {
            setFinalStopResult(result);
            if (typeof result.remainingSeconds === "number") {
              setDailyTimeLeft(result.remainingSeconds);
            }
          }
        } catch (err) {
          console.error("Error stopping agent:", err);
        }
      } else if (aData?.agentId) {
        // Fallback: old-style stop without session info
        try {
          await stopAgent({
            deviceId,
            sessionId: "",
            agentId: aData.agentId,
            channel: aData.channel || "",
          });
        } catch {
          // ignore
        }
      }

      // Cleanup state
      setRtmClient(null);
      setAgoraData(null);
      setSessionInfo(null);
      setSessionState("idle");
      setAgentJoinFailed(false);
      setTimeWarning("none");

      if (reason !== "component_unmount" && reason !== "page_unload") {
        onClose();
      }
    },
    [deviceId, onClose],
  );

  // ── beforeunload / pagehide ──

  useEffect(() => {
    const handlePageHide = () => {
      const sInfo = sessionInfoRef.current;
      const aData = agoraDataRef.current;
      if (sInfo?.sessionId && aData?.agentId && aData?.channel && !isEndingRef.current) {
        isEndingRef.current = true;
        beaconStopAgent({
          deviceId,
          sessionId: sInfo.sessionId,
          agentId: aData.agentId,
          channel: aData.channel,
        });
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [deviceId]);

  // ── Reset state when opened ──

  useEffect(() => {
    if (isOpen) {
      setSessionState("idle");
      setErrorMessage(null);
      setErrorCode(null);
      setAgoraData(null);
      setRtmClient(null);
      setAgentJoinFailed(false);
      setSessionInfo(null);
      setSessionTimeLeft(0);
      setDailyTimeLeft(serverRemainingSeconds);
      setTimeWarning("none");
      setFinalStopResult(null);
      cleanupRef.current = false;
      isEndingRef.current = false;
      startingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Component unmount ──

  useEffect(() => {
    return () => {
      cleanupRef.current = true;
      endVoiceSession("component_unmount");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start: sequential — guard deviceId → token → invite → RTM → connected ──

  const handleStart = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;

    // 0. Guard: deviceId must be ready
    if (!deviceId) {
      setErrorMessage("正在准备语音会话，请稍后重试。");
      setSessionState("error");
      startingRef.current = false;
      return;
    }

    setSessionState("preparing");
    setErrorMessage(null);
    setErrorCode(null);
    setAgentJoinFailed(false);
    cleanupRef.current = false;
    isEndingRef.current = false;
    rtmInitRef.current = false;

    try {
      // 1. Fetch token
      const tokenData = await fetchAgoraToken();
      if (!tokenData.token || !tokenData.channel || !tokenData.uid) {
        throw new Error("Invalid token response from backend");
      }

      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!appId) {
        throw new Error("NEXT_PUBLIC_AGORA_APP_ID is not set");
      }

      // 2. Build invite context
      const inviteContext: InviteAgentContext = {
        deviceId,
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

      // 3. Invite agent (must succeed to proceed)
      setSessionState("inviting");
      let agentData: VoiceInviteResponse;
      try {
        agentData = await inviteAgent(
          tokenData.channel,
          tokenData.uid,
          inviteContext,
        );
      } catch (err: unknown) {
        const code = (err as Error & { code?: string }).code;
        // VOICE_DAILY_TIME_LIMIT is fatal
        if (code === "VOICE_DAILY_TIME_LIMIT") throw err;
        // Other invite errors: non-fatal, proceed without agent
        console.error("Agent invite failed:", err);
        setAgentJoinFailed(true);
        agentData = {
          agent_id: "",
          create_ts: 0,
          state: "FAILED",
        } as VoiceInviteResponse;
      }

      if (cleanupRef.current) {
        startingRef.current = false;
        return;
      }

      // 4. Setup RTM (only after invite succeeds or is non-fatally handled)
      setSessionState("rtmConnecting");
      if (rtmInitRef.current) {
        // Already initialised (StrictMode guard)
        startingRef.current = false;
        return;
      }
      rtmInitRef.current = true;

      const { default: AgoraRTM } = await import("agora-rtm");
      const rtm: RTMClient = new AgoraRTM.RTM(appId, tokenData.uid);
      await rtm.login({ token: tokenData.token });
      await rtm.subscribe(tokenData.channel);

      if (cleanupRef.current) {
        rtm.logout().catch(() => {});
        if (agentData?.agent_id) {
          stopAgent({
            deviceId,
            sessionId: agentData.sessionId || "",
            agentId: agentData.agent_id,
            channel: tokenData.channel,
          }).catch(() => {});
        }
        startingRef.current = false;
        return;
      }

      // 5. Save session info from invite response
      if (agentData && agentData.sessionId) {
        const newSessionInfo: VoiceSessionInfo = {
          sessionId: agentData.sessionId,
          sessionExpiresAt:
            agentData.sessionExpiresAt ||
            new Date(
              Date.now() + (agentData.maxSessionSeconds || 180) * 1000,
            ).toISOString(),
          maxSessionSeconds: agentData.maxSessionSeconds || 180,
          dailyLimitSeconds: agentData.dailyLimitSeconds || 180,
          usedSeconds: agentData.usedSeconds || 0,
          remainingSeconds:
            agentData.remainingSeconds ?? serverRemainingSeconds,
        };

        setSessionInfo(newSessionInfo);
        setSessionTimeLeft(
          calcSecondsLeft(newSessionInfo.sessionExpiresAt),
        );
        if (typeof agentData.remainingSeconds === "number") {
          setDailyTimeLeft(agentData.remainingSeconds);
        }
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          "[ArcanaConvoAIRoom] session ready:",
          JSON.stringify({
            hasDeviceId: !!deviceId,
            hasSessionId: !!agentData?.sessionId,
            channel: tokenData.channel.slice(0, 8) + "...",
          }),
        );
      }

      setRtmClient(rtm);
      setAgoraData({ ...tokenData, agentId: agentData?.agent_id });
      setSessionState("connected");
      startingRef.current = false;
    } catch (err: unknown) {
      if (cleanupRef.current) {
        startingRef.current = false;
        return;
      }

      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as Error & { code?: string }).code || null;
      const remaining = (err as Error & { remainingSeconds?: number })
        .remainingSeconds;

      setErrorMessage(translateError(msg, code));
      setErrorCode(code);
      setSessionState("error");

      if (code === "VOICE_DAILY_TIME_LIMIT") {
        setDailyTimeLeft(0);
        if (typeof remaining === "number") setDailyTimeLeft(remaining);
        onClose();
      }

      startingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle close (overlay_close) ──

  const handleClose = useCallback(() => {
    if (sessionState === "connected" || sessionState === "rtmConnecting") {
      endVoiceSession("overlay_close");
    } else {
      cleanupRef.current = true;
      onClose();
    }
  }, [sessionState, endVoiceSession, onClose]);

  // ── Handle user end ──

  const handleEnd = useCallback(() => {
    endVoiceSession("user_end");
  }, [endVoiceSession]);

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
                  marginBottom: 24,
                  fontFamily: "Cormorant Garamond, serif",
                  color: "rgba(199,165,111,0.5)",
                  textAlign: "center",
                }}
              >
                {cardSummary}
              </p>

              {/* Daily time display */}
              <p
                style={{
                  fontSize: 12,
                  marginBottom: 24,
                  fontFamily: "Cormorant Garamond, serif",
                  color: "rgba(199,165,111,0.6)",
                  textAlign: "center",
                }}
              >
                今日剩余语音时间：{fmtTime(serverRemainingSeconds)}
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
                  disabled={sessionState !== "idle"}
                  style={{
                    padding: "12px 32px",
                    fontSize: 14,
                    borderRadius: 40,
                    border: "1px solid rgba(199,165,111,0.4)",
                    background:
                      sessionState !== "idle"
                        ? "rgba(199,165,111,0.15)"
                        : "#C7A56F",
                    color:
                      sessionState !== "idle"
                        ? "rgba(255,249,239,0.5)"
                        : "#FFF9EF",
                    cursor:
                      sessionState !== "idle" ? "not-allowed" : "pointer",
                    fontFamily: "Cinzel, serif",
                    letterSpacing: "0.1em",
                    boxShadow:
                      sessionState !== "idle"
                        ? "none"
                        : "0 8px 32px rgba(199,165,111,0.18)",
                  }}
                >
                  {sessionState === "preparing"
                    ? "正在准备……"
                    : sessionState === "inviting"
                      ? "正在邀请塔罗师……"
                      : sessionState === "rtmConnecting"
                        ? "正在连接频道……"
                        : "进入语音房"}
                </button>
              )}

              {/* Error actions */}
              {sessionState === "error" && (
                <div style={{ display: "flex", gap: 12 }}>
                  {errorCode !== "VOICE_DAILY_TIME_LIMIT" && (
                    <button
                      onClick={() => {
                        setSessionState("idle");
                        setErrorMessage(null);
                        setErrorCode(null);
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
                  )}
                  <button
                    onClick={handleClose}
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

          {/* Time warnings */}
          {timeWarning === "30s" && sessionState === "connected" && (
            <div
              style={{
                padding: "8px 16px",
                background: "rgba(200,150,50,0.12)",
                borderBottom: "1px solid rgba(200,150,50,0.25)",
                color: "#ea0",
                fontSize: 12,
                textAlign: "center",
                fontFamily: "Cormorant Garamond, serif",
              }}
            >
              本次语音解读还剩 30 秒。
            </div>
          )}
          {timeWarning === "10s" && sessionState === "connected" && (
            <div
              style={{
                padding: "8px 16px",
                background: "rgba(200,80,50,0.18)",
                borderBottom: "1px solid rgba(200,80,50,0.35)",
                color: "#e64",
                fontSize: 13,
                textAlign: "center",
                fontFamily: "Cormorant Garamond, serif",
                fontWeight: 600,
              }}
            >
              语音时间即将结束！
            </div>
          )}

          {/* Time expired message */}
          {timeWarning === "expired" && sessionState === "connected" && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(200,80,50,0.2)",
                borderBottom: "1px solid rgba(200,80,50,0.4)",
                color: "#e64",
                fontSize: 13,
                textAlign: "center",
                fontFamily: "Cormorant Garamond, serif",
              }}
            >
              今日语音解读时间已用完，明天再来吧。
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
                  sessionTimeLeft={sessionTimeLeft}
                  dailyTimeLeft={dailyTimeLeft}
                />
              </AgoraProvider>
            </Suspense>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Error translation ──

function translateError(message: string, code: string | null): string {
  switch (code) {
    case "VOICE_DAILY_TIME_LIMIT":
      return "今日语音解读时间已用完，明天再来吧。";
    case "VOICE_SESSION_ACTIVE":
      return "你已有一个正在进行的语音会话。";
    case "VOICE_SESSION_NOT_FOUND":
      return "语音会话未找到，请重新进入。";
    case "VOICE_SESSION_EXPIRED":
      return "语音会话已到期，请重新进入。";
    case "VOICE_LIMIT_SERVICE_UNAVAILABLE":
      return "语音额度服务暂时不可用，请稍后重试。";
    case "INVALID_DEVICE_ID":
      return "设备标识无效，正在重新生成……";
    default:
      if (message.includes("fetch")) return "网络连接失败，请稍后重试。";
      return message;
  }
}
