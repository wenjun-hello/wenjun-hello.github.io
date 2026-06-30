"use client";

import dynamic from "next/dynamic";

const VoiceAgentContent = dynamic(() => import("./voice-agent-content"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1a2e",
        color: "#888",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Loading voice agent...
    </div>
  ),
});

export default function VoiceAgentTestPage() {
  return <VoiceAgentContent />;
}
