export default function SectionHeading({
  title, subtitle,
}: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-8 sm:mb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent via-[rgba(199,165,111,0.5)] to-transparent" />
        <span className="text-[8px]" style={{ color: "rgba(199,165,111,0.6)" }}>◇</span>
        <div className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent via-[rgba(199,165,111,0.5)] to-transparent" />
      </div>
      <h1
        className="text-2xl sm:text-3xl md:text-4xl tracking-[0.2em] text-center"
        style={{ fontFamily: "Cinzel, serif", fontWeight: 600, color: "#C7A56F" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="text-xs sm:text-sm tracking-[0.15em] italic text-center max-w-md"
          style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}
        >
          {subtitle}
        </p>
      )}
      <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[rgba(199,165,111,0.32)] to-transparent mt-1" />
    </div>
  );
}
