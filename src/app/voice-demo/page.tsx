"use client";

import dynamic from "next/dynamic";

const VoiceDemoContent = dynamic(() => import("./voice-demo-content"), {
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
      Loading...
    </div>
  ),
});

export default function VoiceDemoPage() {
  return <VoiceDemoContent />;
}
