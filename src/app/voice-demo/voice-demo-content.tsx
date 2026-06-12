"use client";

import { useState, useRef, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import type { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

type Status = "idle" | "connecting" | "connected" | "error";
type LogEntry = { time: string; text: string };

const STATUS_LABELS: Record<Status, string> = {
  idle: "未连接",
  connecting: "正在连接...",
  connected: "已连接",
  error: "连接失败",
};

const STATUS_COLORS: Record<Status, string> = {
  idle: "#999",
  connecting: "#C7A56F",
  connected: "#4CAF50",
  error: "#C4705C",
};

const TOKEN_ENDPOINT =
  process.env.NEXT_PUBLIC_AGORA_TOKEN_ENDPOINT ||
  "https://tarot-ai-backend.vercel.app/api/agora-token";

function nowStr() {
  const d = new Date();
  return (
    d.getHours().toString().padStart(2, "0") +
    ":" +
    d.getMinutes().toString().padStart(2, "0") +
    ":" +
    d.getSeconds().toString().padStart(2, "0")
  );
}

export default function VoiceDemoPage() {
  const [channelName, setChannelName] = useState("tarot-agent-test");
  const [uid, setUid] = useState("12345");
  const [status, setStatus] = useState<Status>("idle");
  const [muted, setMuted] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const trackRef = useRef<IMicrophoneAudioTrack | null>(null);

  const addLog = useCallback((text: string) => {
    setLogs((prev) => [...prev.slice(-50), { time: nowStr(), text }]);
  }, []);

  const handleJoin = useCallback(async () => {
    if (!channelName.trim()) return;

    setStatus("connecting");
    addLog("channelName: " + channelName);

    try {
      // 1. Fetch token from backend
      const uidNum = parseInt(uid, 10) || 1;
      addLog("token requested (channelName=" + channelName + ", uid=" + uidNum + ")");

      const res = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelName: channelName.trim(), uid: uidNum }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error("token endpoint returned " + res.status + ": " + errText);
      }

      const { appId, token, channelName: cn, uid: returnedUid } =
        await res.json();
      addLog(
        "token received (appId=" +
          (appId ? appId.slice(0, 6) + "..." : "none") +
          ", channel=" +
          cn +
          ", uid=" +
          returnedUid +
          ")"
      );

      // 2. Create Agora RTC client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // 3. Join channel
      addLog("joining channel...");
      await client.join(appId, cn, token, returnedUid);
      addLog("joined channel");

      // 4. Create microphone track
      addLog("microphone permission requested");
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      trackRef.current = audioTrack;

      // 5. Publish
      addLog("microphone published");
      await client.publish(audioTrack);

      setStatus("connected");
    } catch (err: any) {
      const msg = err?.message || String(err);
      addLog("error: " + msg);
      setStatus("error");
    }
  }, [channelName, uid, addLog]);

  const handleLeave = useCallback(async () => {
    try {
      if (trackRef.current) {
        trackRef.current.close();
        trackRef.current = null;
        addLog("audio track closed");
      }

      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
        addLog("left channel");
      }
    } catch (err: any) {
      addLog("leave error: " + (err?.message || String(err)));
    }

    setStatus("idle");
    setMuted(false);
  }, [addLog]);

  const handleToggleMute = useCallback(() => {
    if (!trackRef.current) return;
    const newMuted = !muted;
    trackRef.current.setEnabled(!newMuted);
    setMuted(newMuted);
    addLog(newMuted ? "muted" : "unmuted");
  }, [muted, addLog]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1a2e",
        color: "#eee",
        fontFamily: "system-ui, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 8,
            color: "#fff",
          }}
        >
          Agora 语音 Demo
        </h1>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 32 }}>
          仅用于验证 Agora RTC 语音连接
        </p>

        {/* Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: STATUS_COLORS[status],
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 14 }}>{STATUS_LABELS[status]}</span>
        </div>

        {/* Channel input */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#888",
              marginBottom: 6,
            }}
          >
            channelName
          </label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            disabled={status === "connected" || status === "connecting"}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 14,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#eee",
              outline: "none",
            }}
          />
        </div>

        {/* UID input */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#888",
              marginBottom: 6,
            }}
          >
            uid (numeric)
          </label>
          <input
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            disabled={status === "connected" || status === "connecting"}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 14,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#eee",
              outline: "none",
            }}
          />
        </div>

        {/* Connected info */}
        {status === "connected" && (
          <div
            style={{
              marginBottom: 20,
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(76,175,80,0.1)",
              border: "1px solid rgba(76,175,80,0.2)",
              fontSize: 13,
              color: "#aaa",
              fontFamily: "monospace",
            }}
          >
            connected: channel=<span style={{ color: "#4CAF50" }}>{channelName}</span>, uid=<span style={{ color: "#4CAF50" }}>{uid}</span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {status !== "connected" ? (
            <button
              onClick={handleJoin}
              disabled={status === "connecting"}
              style={{
                padding: "10px 24px",
                fontSize: 14,
                borderRadius: 8,
                border: "none",
                background: "#4a6cf7",
                color: "#fff",
                cursor:
                  status === "connecting" ? "not-allowed" : "pointer",
                opacity: status === "connecting" ? 0.6 : 1,
              }}
            >
              加入语音频道
            </button>
          ) : (
            <>
              <button
                onClick={handleLeave}
                style={{
                  padding: "10px 24px",
                  fontSize: 14,
                  borderRadius: 8,
                  border: "none",
                  background: "#C4705C",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                离开频道
              </button>
              <button
                onClick={handleToggleMute}
                style={{
                  padding: "10px 24px",
                  fontSize: 14,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: muted
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                  color: "#eee",
                  cursor: "pointer",
                }}
              >
                {muted ? "取消静音" : "静音"}
              </button>
            </>
          )}
        </div>

        {/* Logs */}
        <div>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#888",
              marginBottom: 8,
            }}
          >
            日志
          </h2>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: 8,
              padding: "12px 14px",
              maxHeight: 240,
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: 1.7,
            }}
          >
            {logs.length === 0 ? (
              <span style={{ color: "#555" }}>等待操作...</span>
            ) : (
              logs.map((entry, i) => (
                <div key={i} style={{ color: "#aaa" }}>
                  <span style={{ color: "#666" }}>[{entry.time}]</span>{" "}
                  {entry.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
