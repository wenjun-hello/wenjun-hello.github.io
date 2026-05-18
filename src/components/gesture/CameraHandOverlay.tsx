"use client";

import type { HandGesture } from "@/hooks/useHandGesture";

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  gesture: HandGesture;
  stableGesture: HandGesture;
  gestureAction: string;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  onEnable: () => void;
  onDisable: () => void;
  cooldown: boolean;
  hoveredCardIndex: number | null;
  debug?: {
    mediapipeReady: boolean;
    cameraRunning: boolean;
    handsDetected: number;
    videoSize: string;
    lastSwipeRaw?: string;
  };
};

const GESTURE_LABELS: Partial<Record<HandGesture, string>> = {
  none: "正在识别手势",
  fist: "握拳 — 确认选择",
  open_palm: "张开手掌 — 洗牌",
  swipe_left: "左滑 — 切换 / 翻开牌",
  swipe_right: "右滑 — 切换 / 翻开牌",
};

export default function CameraHandOverlay({
  videoRef, canvasRef, gesture, stableGesture, gestureAction,
  isEnabled, isLoading, error, onEnable, onDisable,
  cooldown, hoveredCardIndex, debug,
}: Props) {
  return (
    <div
      className="fixed top-20 right-3 sm:right-6 z-40"
      style={{
        width: "min(280px, 38vw)",
        borderRadius: 22,
        border: "1px solid rgba(199,165,111,0.3)",
        background: "rgba(15,12,10,0.82)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}
    >
      {/* Camera feed + skeleton — always mounted so ref is available */}
      <div
        className="relative overflow-hidden transition-all duration-500"
        style={{
          aspectRatio: isEnabled ? "4/3" : "0",
          maxHeight: isEnabled ? "999px" : "0px",
          opacity: isEnabled ? 1 : 0,
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)", opacity: 0.82 }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: "scaleX(-1)" }}
        />
      </div>

      {/* Status bar */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Status dot */}
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: isEnabled ? "#C7A56F" : error ? "#C4705C" : "rgba(255,255,255,0.2)",
              boxShadow: isEnabled ? "0 0 6px rgba(199,165,111,0.5)" : "none",
            }}
          />

          {/* Status text */}
          <span
            className="text-[0.6rem] tracking-[0.06em] truncate"
            style={{
              fontFamily: "Cormorant Garamond, serif",
              color: isEnabled ? "rgba(255,249,239,0.8)" : "rgba(255,255,255,0.4)",
            }}
          >
            {isLoading ? "正在启动摄像头..." : error ? "摄像头不可用" : GESTURE_LABELS[gesture]}
          </span>
        </div>

        {/* Toggle button */}
        {isEnabled ? (
          <button
            onClick={onDisable}
            className="text-[0.55rem] tracking-[0.08em] px-2 py-0.5 rounded-full transition-all duration-300 hover:opacity-70 flex-shrink-0"
            style={{
              border: "1px solid rgba(199,165,111,0.3)",
              color: "rgba(199,165,111,0.8)",
              fontFamily: "Cormorant Garamond, serif",
            }}
          >
            关闭
          </button>
        ) : (
          <button
            onClick={onEnable}
            disabled={isLoading}
            className="text-[0.55rem] tracking-[0.08em] px-2 py-0.5 rounded-full transition-all duration-300 hover:opacity-70 flex-shrink-0 disabled:opacity-40"
            style={{
              border: "1px solid rgba(199,165,111,0.4)",
              color: "#C7A56F",
              fontFamily: "Cormorant Garamond, serif",
            }}
          >
            {isLoading ? "启动中..." : "启用手势"}
          </button>
        )}
      </div>

      {/* Debug panel */}
      {isEnabled && debug && (
        <div className="px-3 pb-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
          {[
            ["MediaPipe", debug.mediapipeReady ? "ready" : "not ready"],
            ["Camera", debug.cameraRunning ? "running" : "stopped"],
            ["Hands", String(debug.handsDetected)],
            ["Raw Gesture", gesture],
            ["Stable", stableGesture],
            ["State", gestureAction],
            ["Cooldown", cooldown ? "yes" : "no"],
            ["Hover Card", hoveredCardIndex !== null ? String(hoveredCardIndex) : "none"],
            ["Video", debug.videoSize],
            ["Swipe", debug.lastSwipeRaw || "-"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-[0.5rem] tracking-[0.04em]" style={{ color: "rgba(255,255,255,0.35)" }}>
              <span>{label}</span>
              <span style={{ color: "rgba(199,165,111,0.7)" }}>{value}</span>
            </div>
          ))}
          {debug.handsDetected === 0 && isEnabled && (
            <div className="col-span-2 text-[0.5rem] mt-1 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
              未检测到手部，请把手完整放到摄像头前，保持光线充足
            </div>
          )}
        </div>
      )}

      {/* Privacy notice */}
      {isEnabled && (
        <div
          className="text-[0.5rem] text-center pb-2 px-3 tracking-[0.05em]"
          style={{ color: "rgba(255,255,255,0.2)", fontFamily: "Cormorant Garamond, serif" }}
        >
          摄像头画面仅用于本地手势识别，不会上传
        </div>
      )}
    </div>
  );
}
