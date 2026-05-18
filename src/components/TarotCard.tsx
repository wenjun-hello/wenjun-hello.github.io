"use client";

import { motion } from "framer-motion";
import type { TarotCard as TarotCardType } from "@/data/tarotCards";

/* ==============================
   CARD BACK (image)
   ============================== */
function CardBack({ width = 200, height = 320 }: { width?: number; height?: number }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ width, height }}
    >
      {/* Ornate border frame */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          border: "2px solid rgba(199,165,111,0.35)",
          boxShadow: "inset 0 0 0 1px rgba(199,165,111,0.08)",
        }}
      />
      {/* Inner border */}
      <div
        className="absolute inset-[7px] z-10 pointer-events-none"
        style={{ border: "1px solid rgba(199,165,111,0.12)" }}
      />
      {/* Corner ornaments */}
      {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map(
        (pos, i) => (
          <div
            key={i}
            className={`absolute z-10 w-3 h-3 ${pos}`}
            style={{
              borderColor: "rgba(199,165,111,0.2)",
              borderStyle: "solid",
              borderWidth: i < 2 ? "1px 0 0 1px" : "0 1px 1px 0",
            }}
          />
        )
      )}
      {/* Image — WebP first, PNG fallback */}
      <img
        src="/cards-webp/card-back.webp"
        alt="塔罗牌背面"
        loading="eager"
        decoding="async"
        className="w-full h-full object-contain"
        style={{ background: "#F7F0E6" }}
        onError={(e) => { e.currentTarget.src = "/cards/card-back.png"; }}
      />
    </div>
  );
}

/* ==============================
   CARD FACE (image)
   ============================== */
function CardFace({ card, useThumbnail = false }: { card: TarotCardType; useThumbnail?: boolean }) {
  const imgSrc = useThumbnail
    ? (card.thumbnail || card.webpImage || card.image)
    : (card.webpImage || card.image);
  return (
    <div
      className="relative overflow-hidden flex flex-col"
      style={{
        width: 200,
        height: 320,
        background: "#FFF9EF",
        border: "2px solid rgba(199,165,111,0.35)",
        boxShadow: "inset 0 0 0 1px rgba(199,165,111,0.09), 0 16px 50px rgba(111,90,62,0.15)",
      }}
    >
      {/* Image area — WebP first, PNG fallback */}
      <div className="flex-1 relative overflow-hidden">
        <img
          src={imgSrc}
          alt={card.chineseName || card.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain"
          onError={(e) => { e.currentTarget.src = card.image; }}
        />
      </div>

      {/* Info overlay */}
      <div
        className="px-2.5 py-2 flex flex-col items-center"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(251,244,234,0.82) 25%, rgba(251,244,234,0.95) 100%)",
        }}
      >
        <span
          className="text-[0.5rem] tracking-[0.2em]"
          style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}
        >
          {[
            "O", "I", "II", "III", "IV", "V", "VI", "VII",
            "VIII", "IX", "X", "XI", "XII", "XIII", "XIV",
            "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
          ][card.id] || card.id}
        </span>
        <h3
          className="text-xs sm:text-sm font-semibold mt-0.5 tracking-[0.06em]"
          style={{ fontFamily: "Cormorant Garamond, serif", color: "#4A3A2A", fontWeight: 600 }}
        >
          {card.chineseName}
        </h3>
        <p
          className="text-[0.45rem] italic tracking-[0.08em]"
          style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}
        >
          {card.name} · {card.frenchName}
        </p>
      </div>
    </div>
  );
}

/* ==============================
   TAROT CARD (with 3D flip)
   ============================== */
export default function TarotCard({
  card,
  flipped,
  width = 200,
  height = 320,
  onClick,
  className = "",
  useThumbnail = false,
}: {
  card?: TarotCardType;
  flipped: boolean;
  width?: number;
  height?: number;
  onClick?: () => void;
  className?: string;
  useThumbnail?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer ${className}`}
      style={{ perspective: 1000, width, height }}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.1, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT = Card Back */}
        <div
          style={{
            backfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
          }}
        >
          <CardBack width={width} height={height} />
        </div>

        {/* BACK = Card Face */}
        <div
          style={{
            backfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            transform: "rotateY(180deg)",
          }}
        >
          {card ? (
            <CardFace card={card} useThumbnail={useThumbnail} />
          ) : (
            <div
              className="flex items-center justify-center"
              style={{
                width,
                height,
                background: "#0D1424",
                border: "2px solid rgba(199,165,111,0.2)",
              }}
            >
              <span style={{ color: "rgba(199,165,111,0.3)" }}>✦</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export { CardBack, CardFace };
