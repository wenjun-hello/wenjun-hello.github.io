"use client";

type Props = {
  primaryImage: string;
  secondaryImage?: string;
  mode?: "day" | "night" | "mixed";
  intensity?: "soft" | "medium" | "strong";
  isPaused?: boolean;
  parallaxX?: number;
  parallaxY?: number;
};

export default function DynamicBallroomBackground({
  primaryImage,
  secondaryImage,
  mode = "day",
  intensity = "medium",
  isPaused = false,
  parallaxX = 0,
  parallaxY = 0,
}: Props) {
  const overlayOpacity =
    mode === "night" ? "rgba(18,15,13,0.45)" :
    mode === "mixed" ? "rgba(18,15,13,0.22)" :
    "rgba(247,240,230,0.28)";

  const glowColor =
    mode === "night" ? "rgba(199,165,111,0.32)" :
    "rgba(255,244,215,0.48)";

  const imgOpacity =
    intensity === "strong" ? 0.72 :
    intensity === "soft" ? 0.45 :
    0.62;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "#120f0d" }}>
      {/* Primary image — Ken Burns drift */}
      <div
        className={`absolute inset-0 ${isPaused ? "" : "animate-ballroom-drift"}`}
        style={{
          transform: `translate(${parallaxX * 10}px, ${parallaxY * 8}px) scale(${isPaused ? 1.02 : 1.04})`,
        }}
      >
        <img
          src={primaryImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: imgOpacity }}
        />

        {secondaryImage && (
          <img
            src={secondaryImage}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover ${isPaused ? "" : "animate-ballroom-crossfade"}`}
            style={{ opacity: 0 }}
          />
        )}
      </div>

      {/* Warm overlay for readability */}
      <div className="absolute inset-0" style={{ background: overlayOpacity }} />

      {/* Radial light glow — top chandelier + bottom floor */}
      <div
        className={`absolute inset-0 ${isPaused ? "" : "animate-ballroom-light-breath"}`}
        style={{
          background: `radial-gradient(circle at 50% 12%, ${glowColor}, transparent 34%), radial-gradient(circle at 50% 82%, rgba(199,165,111,0.18), transparent 38%)`,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(18,15,13,0.16), transparent 24%, transparent 70%, rgba(18,15,13,0.24))`,
        }}
      />

      {/* Floating dust layer */}
      <div className={`absolute inset-0 ballroom-dust-layer ${isPaused ? "" : "animate-ballroom-dust"}`} />

      {/* Shimmer — chandelier crystals catching light */}
      <div className={`absolute inset-0 ballroom-shimmer ${isPaused ? "" : "animate-ballroom-shimmer"}`} />
    </div>
  );
}
