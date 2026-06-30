"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import type { RTMClient } from "agora-rtm";
import {
  fetchAgoraToken,
  inviteAgent,
  stopAgent,
  type AgoraTokenData,
  type AgentResponse,
} from "@/lib/agoraApi";

// ── Dynamic imports (browser-only) ──

const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } = await import("agora-rtc-react");
    return {
      default: function AgoraProviders({ children }: { children: React.ReactNode }) {
        const clientRef = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null);
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
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

const ConversationComponent = dynamic(() => import("./conversation-component"), {
  ssr: false,
});

// ── Status types ──

type SessionState =
  | "idle"
  | "fetchingToken"
  | "joining"
  | "connected"
  | "error";

// ── Main content ──

export default function VoiceAgentContent() {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);
  const [agentJoinFailed, setAgentJoinFailed] = useState(false);

  // Preload heavy modules
  useEffect(() => {
    import("agora-rtc-react").catch(() => {});
    import("agora-rtm").catch(() => {});
  }, []);

  const handleStart = useCallback(async () => {
    setSessionState("fetchingToken");
    setErrorMessage(null);
    setAgentJoinFailed(false);

    try {
      // 1. Fetch RTC + RTM token
      const tokenData = await fetchAgoraToken();
      if (!tokenData.token || !tokenData.channel || !tokenData.uid) {
        throw new Error("Invalid token response");
      }

      // 2. Invite agent + setup RTM in parallel
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!appId) {
        throw new Error("NEXT_PUBLIC_AGORA_APP_ID is not set");
      }

      const [agentData, rtm] = await Promise.all([
        // 2a. Invite agent (non-fatal on failure)
        inviteAgent(tokenData.channel, tokenData.uid)
          .then((data) => data)
          .catch((err) => {
            console.error("Agent invite failed:", err);
            setAgentJoinFailed(true);
            return null;
          }),

        // 2b. Setup RTM
        (async () => {
          const { default: AgoraRTM } = await import("agora-rtm");
          const rtmClient: RTMClient = new AgoraRTM.RTM(appId, tokenData.uid);
          await rtmClient.login({ token: tokenData.token });
          await rtmClient.subscribe(tokenData.channel);
          return rtmClient;
        })(),
      ]);

      setRtmClient(rtm);
      setAgoraData({ ...tokenData, agentId: agentData?.agent_id });
      setSessionState("connected");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setSessionState("error");
    }
  }, []);

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

  const handleEnd = useCallback(async () => {
    // Stop agent
    if (agoraData?.agentId) {
      try {
        await stopAgent(agoraData.agentId);
      } catch (err) {
        console.error("Error stopping agent:", err);
      }
    }

    // RTM logout
    rtmClient?.logout().catch((err) => console.error("RTM logout error:", err));

    setRtmClient(null);
    setAgoraData(null);
    setSessionState("idle");
    setAgentJoinFailed(false);
  }, [agoraData, rtmClient]);

  // ── Render: idle / loading / error ──

  if (sessionState !== "connected") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#1a1a2e",
          color: "#eee",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center", padding: "0 20px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            Voice Agent Test
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 32 }}>
            Quickstart-based Agora Conversational AI Agent
          </p>

          {errorMessage && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "rgba(200,80,80,0.15)",
                border: "1px solid rgba(200,80,80,0.3)",
                color: "#e88",
                fontSize: 13,
                marginBottom: 20,
                wordBreak: "break-word",
              }}
            >
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={sessionState === "fetchingToken"}
            style={{
              padding: "12px 32px",
              fontSize: 15,
              borderRadius: 8,
              border: "none",
              background:
                sessionState === "fetchingToken" ? "#555" : "#4a6cf7",
              color: "#fff",
              cursor:
                sessionState === "fetchingToken" ? "not-allowed" : "pointer",
              opacity: sessionState === "fetchingToken" ? 0.6 : 1,
            }}
          >
            {sessionState === "fetchingToken" ? "Starting..." : "Start Voice Agent"}
          </button>

          {sessionState === "error" && (
            <button
              onClick={() => {
                setSessionState("idle");
                setErrorMessage(null);
              }}
              style={{
                display: "block",
                margin: "16px auto 0",
                padding: "8px 16px",
                fontSize: 13,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent",
                color: "#aaa",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Render: connected (conversation) ──

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f1a",
        color: "#eee",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Agent join warning */}
      {agentJoinFailed && (
        <div
          style={{
            padding: "10px 16px",
            background: "rgba(200,150,50,0.15)",
            borderBottom: "1px solid rgba(200,150,50,0.3)",
            color: "#ea0",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          Agent failed to join — voice AI may not respond.
        </div>
      )}

      {/* Conversation */}
      {agoraData && rtmClient && (
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "80vh",
                color: "#888",
              }}
            >
              Loading conversation...
            </div>
          }
        >
          <AgoraProvider>
            <ConversationComponent
              agoraData={agoraData}
              rtmClient={rtmClient}
              onTokenWillExpire={handleTokenWillExpire}
              onEndConversation={handleEnd}
            />
          </AgoraProvider>
        </Suspense>
      )}
    </div>
  );
}
