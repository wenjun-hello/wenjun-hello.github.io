"use client";

export type GraphState = "ready" | "listening" | "thinking" | "answered";

// Pre-generated node positions — a gentle constellation layout
const NODE_COUNT = 18;
const SEED = 42; // fixed seed for deterministic positions

function pseudoRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = pseudoRandom(SEED);
const NODES = Array.from({ length: NODE_COUNT }, (_, i) => ({
  id: i,
  cx: 10 + rand() * 80, // percentage x
  cy: 10 + rand() * 80, // percentage y
  r: 1.2 + rand() * 2.2, // radius
  speed: 2 + rand() * 4,
  delay: rand() * 6,
  amplitude: 0.3 + rand() * 0.7,
}));

// Pre-compute connections: link nodes within ~40% distance
const CONNECTIONS: [number, number][] = [];
for (let i = 0; i < NODES.length; i++) {
  for (let j = i + 1; j < NODES.length; j++) {
    const dx = NODES[i].cx - NODES[j].cx;
    const dy = NODES[i].cy - NODES[j].cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 28) {
      CONNECTIONS.push([i, j]);
    }
  }
}

type Props = {
  state?: GraphState;
  className?: string;
};

export default function ArcanaNodeGraphBackground({ state = "ready", className }: Props) {
  const intensity = state === "listening" ? 1.5 : state === "thinking" ? 0.7 : 1;
  const glowOpacity = state === "listening" ? 0.22 : state === "thinking" ? 0.12 : 0.08;
  const lineOpacity = state === "listening" ? 0.16 : state === "thinking" ? 0.10 : 0.06;

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
      }}
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(217,195,154,0.6)" />
          <stop offset="100%" stopColor="rgba(217,195,154,0)" />
        </radialGradient>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background pulse — center */}
      <circle
        cx="50" cy="50" r="18"
        fill="url(#nodeGlow)"
        opacity={glowOpacity}
        style={{
          transformOrigin: "center",
          animation:
            state === "listening"
              ? "centerPulseListening 2.5s ease-in-out infinite"
              : state === "thinking"
                ? "centerPulseThinking 3s ease-in-out infinite"
                : "centerPulseReady 5s ease-in-out infinite",
        }}
      />

      {/* Connecting lines */}
      {CONNECTIONS.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={NODES[a].cx} y1={NODES[a].cy}
          x2={NODES[b].cx} y2={NODES[b].cy}
          stroke="rgba(199,165,111,0.5)"
          strokeWidth={0.15}
          opacity={lineOpacity}
          style={{
            transition: "opacity 0.8s ease",
          }}
        />
      ))}

      {/* Nodes */}
      {NODES.map((n) => (
        <circle
          key={n.id}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          fill="rgba(217,195,154,0.55)"
          filter="url(#softGlow)"
          style={{
            animationName: `nodeFloat${n.id % 4}`,
            animationDuration: `${n.speed * (1 / intensity)}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${n.delay}s`,
            transformOrigin: `${n.cx}px ${n.cy}px`,
            transition: "animation-duration 0.8s ease",
          }}
        />
      ))}

      {/* CSS keyframes injected via style tag */}
      <style>{`
        @keyframes nodeFloat0 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(0.4px, -0.6px) scale(1.08); }
          50% { transform: translate(-0.3px, 0.5px) scale(0.94); }
          75% { transform: translate(0.5px, 0.3px) scale(1.05); }
        }
        @keyframes nodeFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-0.5px, -0.4px) scale(0.93); }
          50% { transform: translate(0.4px, -0.5px) scale(1.06); }
          75% { transform: translate(-0.3px, 0.6px) scale(0.96); }
        }
        @keyframes nodeFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(0.6px, 0.3px) scale(1.04); }
          50% { transform: translate(-0.5px, -0.4px) scale(0.95); }
          75% { transform: translate(0.2px, -0.5px) scale(1.07); }
        }
        @keyframes nodeFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-0.4px, 0.5px) scale(1.06); }
          50% { transform: translate(0.3px, -0.3px) scale(0.92); }
          75% { transform: translate(-0.5px, -0.3px) scale(1.03); }
        }
        @keyframes centerPulseReady {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.12; transform: scale(1.08); }
        }
        @keyframes centerPulseListening {
          0%, 100% { opacity: 0.16; transform: scale(1.05); }
          50% { opacity: 0.26; transform: scale(1.14); }
        }
        @keyframes centerPulseThinking {
          0%, 100% { opacity: 0.1; transform: scale(0.96); }
          50% { opacity: 0.18; transform: scale(1.06); }
        }
      `}</style>
    </svg>
  );
}
