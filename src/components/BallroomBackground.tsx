export default function BallroomBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base cream gradient */}
      <div className="absolute inset-0 ballroom-base" />

      {/* Chandelier glow — top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] ballroom-chandelier" />

      {/* Left curtain — pale blue drapery */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[160px] sm:w-[220px] opacity-25"
        style={{
          background:
            "linear-gradient(90deg, rgba(201,216,232,0.55) 0%, rgba(221,232,239,0.25) 45%, transparent 100%)",
          clipPath: "polygon(0 0, 100% 8%, 95% 92%, 0 100%)",
        }}
      />

      {/* Right curtain — pale blue drapery */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[160px] sm:w-[220px] opacity-25"
        style={{
          background:
            "linear-gradient(270deg, rgba(201,216,232,0.55) 0%, rgba(221,232,239,0.25) 45%, transparent 100%)",
          clipPath: "polygon(100% 0, 0 8%, 5% 92%, 100% 100%)",
        }}
      />

      {/* Soft blush floral accents — bottom corners */}
      <div
        className="absolute left-0 bottom-0 w-[280px] h-[280px] opacity-18"
        style={{
          background:
            "radial-gradient(circle at 30% 70%, rgba(233,210,203,0.5) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute right-0 bottom-0 w-[280px] h-[280px] opacity-18"
        style={{
          background:
            "radial-gradient(circle at 70% 70%, rgba(233,210,203,0.5) 0%, transparent 60%)",
        }}
      />

      {/* European arches — subtle outline */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-8 w-[700px] h-[480px] rounded-t-full border opacity-[0.10]"
        style={{ borderColor: "rgba(199,165,111,0.5)", borderWidth: "1px" }}
      />
      <div
        className="absolute left-[12%] top-[14%] w-[200px] h-[380px] rounded-t-full border opacity-[0.07]"
        style={{ borderColor: "rgba(199,165,111,0.5)", borderWidth: "1px" }}
      />
      <div
        className="absolute right-[12%] top-[14%] w-[200px] h-[380px] rounded-t-full border opacity-[0.07]"
        style={{ borderColor: "rgba(199,165,111,0.5)", borderWidth: "1px" }}
      />

      {/* Floor glow — bottom center */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[120px]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(217,195,154,0.16) 0%, transparent 65%)",
        }}
      />

      {/* Soft golden sparkles */}
      <div className="absolute inset-0 bg-stars opacity-60" />
    </div>
  );
}
