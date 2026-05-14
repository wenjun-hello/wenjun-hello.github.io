export default function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 mb-8 sm:mb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent via-[rgba(200,169,107,0.4)] to-transparent" />
        <span className="text-[8px]" style={{ color: "rgba(200,169,107,0.4)" }}>
          ◇
        </span>
        <div className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent via-[rgba(200,169,107,0.4)] to-transparent" />
      </div>

      <h1
        className="text-2xl sm:text-3xl md:text-4xl tracking-[0.2em] text-center"
        style={{
          fontFamily: "Cinzel, serif",
          fontWeight: 600,
          color: "#C8A96B",
          textShadow:
            "0 0 40px rgba(200,169,107,0.15), 0 0 80px rgba(200,169,107,0.06)",
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          className="text-xs sm:text-sm tracking-[0.25em] italic text-center max-w-md"
          style={{
            fontFamily: "Cormorant Garamond, serif",
            color: "rgba(184,188,198,0.5)",
          }}
        >
          {subtitle}
        </p>
      )}

      <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[rgba(200,169,107,0.2)] to-transparent mt-1" />
    </div>
  );
}
