"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  HandLandmarker, FilesetResolver, type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export type HandGesture = "none" | "fist" | "open_palm" | "swipe_left" | "swipe_right";

export type DeckState = "stacked" | "shuffling" | "spread" | "navigating" | "selected" | "revealing" | "revealed";

export type GestureState = {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  gesture: HandGesture;
  stableGesture: HandGesture;
  deckState: DeckState;
  cooldown: boolean;
  enable: () => Promise<void>;
  disable: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  debug: { mediapipeReady: boolean; cameraRunning: boolean; handsDetected: number; videoSize: string; };
  // Action callbacks
  onOpenPalm: (() => void) | null;
  onFist: (() => void) | null;
  onSwipeLeft: (() => void) | null;
  onSwipeRight: (() => void) | null;
  setOnOpenPalm: (fn: () => void) => void;
  setOnFist: (fn: () => void) => void;
  setOnSwipeLeft: (fn: () => void) => void;
  setOnSwipeRight: (fn: () => void) => void;
};

/* ==============================
   GESTURE CLASSIFICATION
   ============================== */
function classifyGesture(lm: NormalizedLandmark[]): HandGesture {
  if (!lm || lm.length === 0) return "none";
  const tips = [8, 12, 16, 20]; const pips = [6, 10, 14, 18];
  let ext = 0;
  for (let i = 0; i < tips.length; i++) {
    if (lm[tips[i]].y < lm[pips[i]].y - 0.018) ext++;
  }
  if (ext === 0) return "fist";
  if (ext >= 4) return "open_palm";
  return "none";
}

/* ==============================
   SKELETON DRAWING
   ============================== */
const CONNS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
function drawSkel(ctx: CanvasRenderingContext2D, lm: NormalizedLandmark[], w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(199,165,111,0.8)"; ctx.lineWidth = 2; ctx.lineCap = "round";
  for (const [a,b] of CONNS) { ctx.beginPath(); ctx.moveTo(lm[a].x*w, lm[a].y*h); ctx.lineTo(lm[b].x*w, lm[b].y*h); ctx.stroke(); }
  for (const l of lm) { ctx.fillStyle = "rgba(255,249,239,0.9)"; ctx.beginPath(); ctx.arc(l.x*w, l.y*h, 2.8, 0, Math.PI*2); ctx.fill(); }
  for (const i of [4,8,12,16,20]) { ctx.fillStyle = "rgba(217,195,154,0.8)"; ctx.beginPath(); ctx.arc(lm[i].x*w, lm[i].y*h, 3.5, 0, Math.PI*2); ctx.fill(); }
  ctx.restore();
}

/* ==============================
   HOOK
   ============================== */
export function useHandGesture(): GestureState {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gesture, setGesture] = useState<HandGesture>("none");
  const [stableGesture, setStableGesture] = useState<HandGesture>("none");
  const [deckState, setDeckState] = useState<DeckState>("stacked");
  const [cooldown, setCooldown] = useState(false);
  const [debug, setDebug] = useState({ mediapipeReady: false, cameraRunning: false, handsDetected: 0, videoSize: "0x0", lastSwipeRaw: "" });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hlRef = useRef<HandLandmarker | null>(null);
  const afRef = useRef<number>(0);
  const enRef = useRef(false);
  const lastDbgRef = useRef(0);

  // Action callbacks
  const onOpenPalmRef = useRef<(() => void) | null>(null);
  const onFistRef = useRef<(() => void) | null>(null);
  const onSwipeLeftRef = useRef<(() => void) | null>(null);
  const onSwipeRightRef = useRef<(() => void) | null>(null);

  // Stability / cooldown tracking
  const gsRef = useRef({ gesture: "none" as HandGesture, since: 0 });
  const cdRef = useRef(0);
  const posHistRef = useRef<{ x: number; t: number }[]>([]);

  const STABLE_MS = 500;
  const OPEN_PALM_MS = 800;
  const FIST_MS = 450;
  const COOLDOWN_MS = 400;
  const SWIPE_COOLDOWN_MS = 250;
  const SWIPE_WINDOW_MS = 700;
  const SWIPE_DX = 0.05;
  const SWIPE_MIN_VELOCITY = 0.00025;
  const SWIPE_MIRROR = true; // flip direction: camera is mirrored

  function detectSwipe(handX: number): HandGesture | null {
    const now = Date.now();
    posHistRef.current.push({ x: handX, t: now });
    // Keep up to SWIPE_WINDOW_MS of history
    posHistRef.current = posHistRef.current.filter((p) => now - p.t < SWIPE_WINDOW_MS);
    if (posHistRef.current.length < 3) return null;
    const first = posHistRef.current[0];
    const last = posHistRef.current[posHistRef.current.length - 1];
    const dx = last.x - first.x;
    const dt = last.t - first.t;
    if (dt < 80) return null;
    const velocity = Math.abs(dx) / dt;
    if (Math.abs(dx) > SWIPE_DX || velocity > SWIPE_MIN_VELOCITY) {
      posHistRef.current = [];
      // Apply mirror correction: camera is mirrored, so flip direction
      const rawRight = dx > 0;
      const goRight = SWIPE_MIRROR ? !rawRight : rawRight;
      setDebug((d) => ({ ...d, lastSwipeRaw: `dx=${dx.toFixed(3)} raw=${rawRight?"R":"L"}→${goRight?"R":"L"}` }));
      return goRight ? "swipe_right" : "swipe_left";
    }
    return null;
  }

  const process = useCallback(async () => {
    if (!enRef.current) return;
    const video = videoRef.current, hl = hlRef.current, canvas = canvasRef.current;
    if (!video || !hl) { afRef.current = requestAnimationFrame(process); return; }
    if (video.readyState >= 2 && video.videoWidth > 0) {
      try {
        const now = Date.now();
        const results = hl.detectForVideo(video, now);
        const hands = results.landmarks?.length || 0;
        if (now - lastDbgRef.current > 600) {
          lastDbgRef.current = now;
          setDebug((d) => ({ ...d, mediapipeReady: true, cameraRunning: true, handsDetected: hands, videoSize: `${video.videoWidth}x${video.videoHeight}` }));
        }
        if (canvas) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; }
          const ctx = canvas.getContext("2d");
          if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); if (results.landmarks?.length) for (const lm of results.landmarks) drawSkel(ctx, lm, canvas.width, canvas.height); }
        }
        if (hands > 0 && results.landmarks) {
          const lm = results.landmarks[0];
          const raw = classifyGesture(lm);
          setGesture(raw);
          const gs = gsRef.current;
          if (gs.gesture === raw) { /* same */ } else { gs.gesture = raw; gs.since = now; }
          const stableMs = now - gs.since;
          if (stableMs > STABLE_MS) setStableGesture(raw);

          const inCd = now < cdRef.current;
          if (inCd !== cooldown) setCooldown(inCd);

          // Use wrist (landmark 0) for swipe — more stable than fingertip
          const swipe = detectSwipe(lm[0].x);

          if (!inCd) {
            // Open palm → shuffle
            if (raw === "open_palm" && stableMs > OPEN_PALM_MS) {
              gs.since = now; cdRef.current = now + COOLDOWN_MS; setCooldown(true);
              onOpenPalmRef.current?.();
            }
            // Fist → select / reset
            if (raw === "fist" && stableMs > FIST_MS) {
              gs.since = now; cdRef.current = now + COOLDOWN_MS; setCooldown(true);
              onFistRef.current?.();
            }
            // Swipe — shorter cooldown for responsive navigation
            if (swipe === "swipe_left") {
              cdRef.current = now + SWIPE_COOLDOWN_MS; setCooldown(true);
              onSwipeLeftRef.current?.();
            }
            if (swipe === "swipe_right") {
              cdRef.current = now + SWIPE_COOLDOWN_MS; setCooldown(true);
              onSwipeRightRef.current?.();
            }
          }
        } else {
          setGesture("none");
        }
      } catch { /* transient */ }
    }
    afRef.current = requestAnimationFrame(process);
  }, [cooldown]);

  const enable = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Browser does not support camera.");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
      streamRef.current = stream;
      const video = videoRef.current; if (!video) throw new Error("Video element not found");
      video.srcObject = stream; await video.play();
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
      const hl = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task", delegate: "GPU" },
        runningMode: "VIDEO", numHands: 1, minHandDetectionConfidence: 0.4, minTrackingConfidence: 0.3,
      });
      hlRef.current = hl;
      setDebug((d) => ({ ...d, mediapipeReady: true, cameraRunning: true, lastSwipeRaw: "" }));
      enRef.current = true; setIsEnabled(true); process();
    } catch (err: any) {
      const m = err?.message || String(err);
      if (m.includes("Permission")) setError("摄像头权限被拒绝。");
      else if (m.includes("device")) setError("未检测到摄像头设备。");
      else setError(`启动失败: ${m}`);
      setIsEnabled(false);
    } finally { setIsLoading(false); }
  }, [process]);

  const disable = useCallback(() => {
    enRef.current = false; setIsEnabled(false); setGesture("none"); setStableGesture("none");
    setDebug((d) => ({ ...d, cameraRunning: false, handsDetected: 0, lastSwipeRaw: "" }));
    cancelAnimationFrame(afRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    hlRef.current = null;
  }, []);

  useEffect(() => { return () => { cancelAnimationFrame(afRef.current); if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); }; }, []);

  return {
    isEnabled, isLoading, error, gesture, stableGesture, deckState, cooldown,
    enable, disable, videoRef, canvasRef, debug,
    onOpenPalm: onOpenPalmRef.current, onFist: onFistRef.current,
    onSwipeLeft: onSwipeLeftRef.current, onSwipeRight: onSwipeRightRef.current,
    setOnOpenPalm: (fn) => { onOpenPalmRef.current = fn; },
    setOnFist: (fn) => { onFistRef.current = fn; },
    setOnSwipeLeft: (fn) => { onSwipeLeftRef.current = fn; },
    setOnSwipeRight: (fn) => { onSwipeRightRef.current = fn; },
  };
}
