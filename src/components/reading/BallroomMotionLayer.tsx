"use client";

/* ==============================
   BALLROOM MOTION LAYER
   Layers 1–4: breathing, haze, silhouettes, dance floor
   All pointer-events: none, behind content
   ============================== */
export default function BallroomMotionLayer() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Layer 1: Breathing camera — subtle zoom + drift on a pseudo-overlay */}
      <div
        className="absolute inset-0"
        style={{
          animation: "ballroomBreathe 22s ease-in-out infinite",
          background: "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(20,14,10,0.12) 100%)",
        }}
      />

      {/* Layer 2: Light haze beam — slow horizontal sweep */}
      <div
        className="absolute top-0 bottom-0 w-[60%]"
        style={{
          left: "20%",
          background: "linear-gradient(105deg, transparent 0%, rgba(255,238,200,0.06) 30%, rgba(255,244,215,0.10) 50%, rgba(255,238,200,0.06) 70%, transparent 100%)",
          animation: "hazeSweep 14s ease-in-out infinite",
        }}
      />

      {/* Layer 2: Secondary haze — opposite direction, slower */}
      <div
        className="absolute top-[10%] bottom-[10%] w-[50%]"
        style={{
          left: "25%",
          background: "linear-gradient(95deg, transparent 0%, rgba(255,244,215,0.04) 40%, rgba(255,238,200,0.07) 50%, rgba(255,244,215,0.04) 60%, transparent 100%)",
          animation: "hazeSweep2 18s ease-in-out infinite",
        }}
      />

      {/* Layer 2: Floating dust — subtle golden particles */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 12% 45%, rgba(217,195,154,0.18) 0%, transparent 100%)," +
            "radial-gradient(0.8px 0.8px at 35% 62%, rgba(255,238,200,0.14) 0%, transparent 100%)," +
            "radial-gradient(1.2px 1.2px at 58% 38%, rgba(217,195,154,0.16) 0%, transparent 100%)," +
            "radial-gradient(0.6px 0.6px at 78% 55%, rgba(255,244,215,0.12) 0%, transparent 100%)," +
            "radial-gradient(1px 1px at 22% 72%, rgba(217,195,154,0.15) 0%, transparent 100%)," +
            "radial-gradient(0.7px 0.7px at 68% 25%, rgba(255,238,200,0.13) 0%, transparent 100%)",
          animation: "dustFloat 16s ease-in-out infinite",
        }}
      />

      {/* Layer 3: Left dancer silhouette — abstract blurred shape */}
      <div
        className="absolute left-0 top-[15%] w-[180px] h-[420px]"
        style={{
          background: "radial-gradient(ellipse at 40% 50%, rgba(60,40,25,0.18) 0%, rgba(40,25,15,0.08) 40%, transparent 70%)",
          filter: "blur(24px)",
          borderRadius: "40% 60% 50% 50%",
          animation: "dancerLeft 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-[60px] top-[22%] w-[100px] h-[300px]"
        style={{
          background: "radial-gradient(ellipse at 35% 45%, rgba(80,55,35,0.12) 0%, rgba(50,30,18,0.05) 45%, transparent 70%)",
          filter: "blur(18px)",
          borderRadius: "35% 55% 45% 55%",
          animation: "dancerLeft2 11s ease-in-out infinite",
        }}
      />

      {/* Layer 3: Right dancer silhouette — abstract blurred shape */}
      <div
        className="absolute right-0 top-[18%] w-[160px] h-[400px]"
        style={{
          background: "radial-gradient(ellipse at 60% 48%, rgba(60,40,25,0.16) 0%, rgba(40,25,15,0.07) 40%, transparent 70%)",
          filter: "blur(22px)",
          borderRadius: "55% 40% 50% 55%",
          animation: "dancerRight 9s ease-in-out infinite",
        }}
      />
      <div
        className="absolute right-[40px] top-[25%] w-[90px] h-[280px]"
        style={{
          background: "radial-gradient(ellipse at 65% 50%, rgba(70,45,30,0.11) 0%, rgba(45,28,16,0.05) 45%, transparent 70%)",
          filter: "blur(16px)",
          borderRadius: "50% 40% 50% 45%",
          animation: "dancerRight2 10s ease-in-out infinite",
        }}
      />

      {/* Layer 4: Dance floor oval spotlight — behind cards */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%]"
        style={{ width: "min(600px, 80vw)", height: "380px" }}>
        {/* Main spotlight */}
        <div
          className="absolute inset-0 rounded-[50%]"
          style={{
            background: "radial-gradient(ellipse at 50% 45%, rgba(255,238,190,0.16) 0%, rgba(217,195,154,0.08) 35%, transparent 65%)",
            animation: "spotlightPulse 5s ease-in-out infinite",
          }}
        />
        {/* Floor reflection shimmer */}
        <div
          className="absolute bottom-0 left-[10%] right-[10%] h-[60px] rounded-[50%]"
          style={{
            background: "radial-gradient(ellipse at 50% 100%, rgba(255,238,190,0.10) 0%, transparent 70%)",
            animation: "floorShimmer 8s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
