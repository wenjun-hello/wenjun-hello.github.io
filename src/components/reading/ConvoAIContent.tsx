"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import AgoraRTC, {
  useRTCClient,
  useLocalMicrophoneTrack,
  useRemoteUsers,
  useClientEvent,
  useJoin,
  usePublish,
  RemoteUser,
  type UID,
} from "agora-rtc-react";
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  type AgentState,
  TranscriptHelperMode,
  TurnStatus,
  type TranscriptHelperItem,
  type UserTranscription,
  type AgentTranscription,
} from "agora-agent-client-toolkit";
import { AgentVisualizer } from "agora-agent-uikit";
import { MicButtonWithVisualizer } from "agora-agent-uikit/rtc";
import type { RTMClient } from "agora-rtm";
import type { CardWithOrientation } from "@/components/reading/GestureFanDeck";

// ── Types ──

interface AgoraTokenData {
  token: string;
  uid: string;
  channel: string;
  agentId?: string;
}

export interface ReadingContext {
  cards: CardWithOrientation[];
  questionType: string;
  spreadType: string;
  originalQuestion: string;
  positions?: string[];
}

interface ConvoAIContentProps {
  agoraData: AgoraTokenData;
  rtmClient: RTMClient;
  readingContext: ReadingContext;
  onTokenWillExpire: (uid: string) => Promise<{ rtcToken: string; rtmToken: string }>;
  onEnd: () => void;
}

const DEFAULT_AGENT_UID = "123456";

// ── Helpers ──

function normalizeTimestampMs(timestamp: number): number {
  return timestamp > 1e12 ? timestamp : timestamp * 1000;
}

// ── Component ──

export default function ConvoAIContent({
  agoraData,
  rtmClient,
  readingContext,
  onTokenWillExpire,
  onEnd,
}: ConvoAIContentProps) {
  const client = useRTCClient();
  const remoteUsers = useRemoteUsers();
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("CONNECTING");
  const [joinedUID, setJoinedUID] = useState<UID>(0);

  // Transcript + agent state
  const [rawTranscript, setRawTranscript] = useState<
    TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[]
  >([]);
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [ttsRateLimited, setTtsRateLimited] = useState(false);

  const agentUID = process.env.NEXT_PUBLIC_AGENT_UID ?? DEFAULT_AGENT_UID;

  // ── StrictMode guard ──

  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (!cancelled) setIsReady(true);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
      setIsReady(false);
    };
  }, []);

  // ── RTC Join ──

  const { isConnected: joinSuccess } = useJoin(
    {
      appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      channel: agoraData.channel,
      token: agoraData.token,
      uid: parseInt(agoraData.uid, 10),
    },
    isReady,
  );

  // ── Mic track ──

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isReady);

  // ── ENABLE_AUDIO_PTS ──

  useEffect(() => {
    if (!client) return;
    try {
      (
        AgoraRTC as typeof AgoraRTC & {
          setParameter?: (k: string, v: unknown) => void;
        }
      ).setParameter?.("ENABLE_AUDIO_PTS", true);
    } catch (error) {
      console.warn("Could not set ENABLE_AUDIO_PTS:", error);
    }
  }, [client]);

  // ── Track assigned UID ──

  useEffect(() => {
    if (joinSuccess && client) {
      const uid = client.uid;
      if (uid !== null && uid !== undefined) {
        setJoinedUID(uid);
      }
    }
  }, [joinSuccess, client]);

  // ── AgoraVoiceAI init ──

  useEffect(() => {
    if (!isReady || !joinSuccess) return;

    let cancelled = false;

    (async () => {
      try {
        const ai = await AgoraVoiceAI.init({
          rtcEngine: client,
          rtmConfig: { rtmEngine: rtmClient },
          renderMode: TranscriptHelperMode.TEXT,
          enableLog: true,
        });

        if (cancelled) {
          try {
            if (AgoraVoiceAI.getInstance() === ai) {
              ai.unsubscribe();
              ai.destroy();
            }
          } catch {
            /* ignore */
          }
          return;
        }

        ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (t) => {
          setRawTranscript([...t]);
        });

        ai.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (_, event) => {
          setAgentState(event.state);
        });

        ai.on(AgoraVoiceAIEvents.AGENT_ERROR, (_, error) => {
          // TTS rate limit: stop retries, keep text results
          if (error.code === 1002) {
            console.warn(
              "[ConvoAIContent] TTS rate limited (code 1002), keeping text only.",
            );
            setTtsRateLimited(true);
          }
        });

        ai.subscribeMessage(agoraData.channel);
      } catch (error) {
        if (!cancelled) {
          console.error("[ConvoAIContent] AgoraVoiceAI init failed:", error);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        const ai = AgoraVoiceAI.getInstance();
        if (ai) {
          ai.unsubscribe();
          ai.destroy();
        }
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, joinSuccess]);

  // ── Publish mic ──

  usePublish([localMicrophoneTrack]);

  // ── Agent presence tracking ──

  useClientEvent(client, "user-joined", (user) => {
    if (user.uid.toString() === agentUID) setIsAgentConnected(true);
  });

  useClientEvent(client, "user-left", (user) => {
    if (user.uid.toString() === agentUID) setIsAgentConnected(false);
  });

  useEffect(() => {
    const isAgentInRemoteUsers = remoteUsers.some(
      (user) => user.uid.toString() === agentUID,
    );
    setIsAgentConnected(isAgentInRemoteUsers);
  }, [remoteUsers, agentUID]);

  // ── Connection state ──

  useClientEvent(client, "connection-state-change", (curState) => {
    setConnectionState(curState);
  });

  // ── Mic toggle ──

  const handleMicToggle = useCallback(async () => {
    const next = !isMicEnabled;
    const track = localMicrophoneTrack;
    if (!track) {
      setIsMicEnabled(next);
      return;
    }
    try {
      await track.setEnabled(next);
      setIsMicEnabled(next);
    } catch (error) {
      console.error("Failed to toggle microphone:", error);
    }
  }, [isMicEnabled, localMicrophoneTrack]);

  // ── Token renewal ──

  const handleTokenWillExpire = useCallback(async () => {
    if (!onTokenWillExpire || !joinedUID) return;
    try {
      const { rtcToken, rtmToken } = await onTokenWillExpire(
        joinedUID.toString(),
      );
      await client?.renewToken(rtcToken);
      await rtmClient.renewToken(rtmToken);
    } catch (error) {
      console.error("Failed to renew Agora token:", error);
    }
  }, [client, onTokenWillExpire, joinedUID, rtmClient]);

  useClientEvent(client, "token-privilege-will-expire", handleTokenWillExpire);

  // ── Transcript processing ──

  const transcript = useMemo(() => {
    return rawTranscript.map((item) => {
      const remappedUID =
        item.uid === "0" ? String(client.uid) : item.uid;
      return { ...item, uid: remappedUID };
    });
  }, [rawTranscript, client.uid]);

  const messageList = useMemo(() => {
    return transcript
      .filter((item) => {
        return String(item.status) !== String(TurnStatus.IN_PROGRESS);
      })
      .map((item) => ({
        turn_id: item.turn_id,
        uid: Number(item.uid) || 0,
        text: typeof item.text === "string" ? item.text : "",
        status: item.status,
        createdAt:
          typeof item._time === "number"
            ? normalizeTimestampMs(item._time)
            : undefined,
      }));
  }, [transcript]);

  // ── UI State mapping ──

  const connectionStatusLabel = useMemo(() => {
    if (connectionState === "DISCONNECTED") return "Disconnected";
    if (connectionState === "RECONNECTING") return "Reconnecting";
    if (connectionState === "CONNECTING") return "Connecting...";
    if (!isAgentConnected) return "Waiting for agent...";
    return "Connected";
  }, [connectionState, isAgentConnected]);

  const connectionColor = useMemo(() => {
    if (connectionState === "DISCONNECTED") return "#e55";
    if (
      connectionState === "RECONNECTING" ||
      connectionState === "CONNECTING"
    )
      return "#ea0";
    if (!isAgentConnected) return "#ea0";
    return "#4a4";
  }, [connectionState, isAgentConnected]);

  const agentStateLabel = useMemo(() => {
    if (!isAgentConnected) return "Not joined";
    switch (agentState) {
      case "listening":
        return "Listening";
      case "thinking":
        return "Thinking";
      case "speaking":
        return "Speaking";
      case "idle":
        return "Idle";
      default:
        return agentState ?? "—";
    }
  }, [agentState, isAgentConnected]);

  // ── Cleanup on unmount ──

  useEffect(() => {
    return () => {
      try {
        const ai = AgoraVoiceAI.getInstance();
        if (ai) {
          ai.unsubscribe();
          ai.destroy();
        }
      } catch {
        /* ignore */
      }
    };
  }, []);

  // ── Card summary for the overlay ──

  const cardSummary = useMemo(() => {
    return readingContext.cards
      .map((c) => `${c.chineseName}${c.isReversed ? " 逆位" : ""}`)
      .join(" · ");
  }, [readingContext.cards]);

  // ── Render ──

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0f0f1a",
        color: "#eee",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.3)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "Cinzel, serif",
                color: "#C7A56F",
                letterSpacing: "0.1em",
              }}
            >
              塔罗语音房
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,249,239,0.4)",
                fontFamily: "Cormorant Garamond, serif",
                fontStyle: "italic",
                marginTop: 2,
              }}
            >
              {cardSummary}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Connection status */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: connectionColor,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 11, color: "#888" }}>
              {connectionStatusLabel}
            </span>
          </div>

          {/* Agent state */}
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(255,255,255,0.06)",
              color: "#aaa",
              fontFamily: "Cormorant Garamond, serif",
            }}
          >
            {agentStateLabel}
          </span>

          {/* End button */}
          <button
            onClick={onEnd}
            style={{
              padding: "6px 16px",
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid rgba(200,100,100,0.4)",
              background: "transparent",
              color: "#e66",
              cursor: "pointer",
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.05em",
            }}
          >
            结束
          </button>
        </div>
      </header>

      {/* TTS rate limit warning */}
      {ttsRateLimited && (
        <div
          style={{
            padding: "8px 16px",
            background: "rgba(200,150,50,0.12)",
            borderBottom: "1px solid rgba(200,150,50,0.25)",
            color: "#ea0",
            fontSize: 12,
            textAlign: "center",
            fontFamily: "Cormorant Garamond, serif",
            flexShrink: 0,
          }}
        >
          TTS 请求过于频繁，文字回复已保留。请稍等片刻再继续对话。
        </div>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Visualizer + controls */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AgentVisualizer
              state={
                !isAgentConnected
                  ? "not-joined"
                  : connectionState === "DISCONNECTED"
                    ? "disconnected"
                    : agentState === "listening"
                      ? "listening"
                      : agentState === "thinking"
                        ? "analyzing"
                        : agentState === "speaking"
                          ? "talking"
                          : "ambient"
              }
              size="lg"
            />
            {remoteUsers.map((user) => (
              <div key={user.uid} style={{ display: "none" }}>
                <RemoteUser user={user} />
              </div>
            ))}
          </div>

          {/* Mic controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 20,
              padding: "8px 20px",
              borderRadius: 40,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ transform: "scale(0.9)" }}>
              <MicButtonWithVisualizer
                isEnabled={isMicEnabled}
                setIsEnabled={setIsMicEnabled}
                track={localMicrophoneTrack}
                onToggle={handleMicToggle}
                enabledColor="#C7A56F"
                disabledColor="#e55"
              />
            </div>
            <span
              style={{
                fontSize: 12,
                color: "#888",
                fontFamily: "Cormorant Garamond, serif",
              }}
            >
              {isMicEnabled ? "麦克风已开启" : "已静音"}
            </span>
          </div>
        </div>

        {/* Transcript panel */}
        <aside
          style={{
            width: 320,
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "Cinzel, serif",
              color: "#C7A56F",
              letterSpacing: "0.08em",
            }}
          >
            对话记录
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
            }}
          >
            {messageList.length === 0 ? (
              <div
                style={{
                  color: "#555",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 40,
                  fontFamily: "Cormorant Garamond, serif",
                  fontStyle: "italic",
                }}
              >
                {isAgentConnected
                  ? "开始和塔罗师对话吧……"
                  : "等待塔罗师加入……"}
              </div>
            ) : (
              messageList.map((msg, i) => {
                const isAgent = String(msg.uid) === agentUID;
                return (
                  <div
                    key={`${msg.turn_id ?? msg.uid}-${i}`}
                    style={{
                      marginBottom: 12,
                      textAlign: isAgent ? "left" : "right",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "#666",
                        marginBottom: 2,
                      }}
                    >
                      {isAgent ? "塔罗师" : "你"}
                    </div>
                    <div
                      style={{
                        display: "inline-block",
                        maxWidth: "90%",
                        padding: "6px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                        background: isAgent
                          ? "rgba(80,80,120,0.3)"
                          : "rgba(199,165,111,0.15)",
                        color: "#ddd",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.text || "..."}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
