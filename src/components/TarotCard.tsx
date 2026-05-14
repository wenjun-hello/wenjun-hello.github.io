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
          border: "2px solid rgba(200,169,107,0.35)",
          boxShadow: "inset 0 0 0 1px rgba(200,169,107,0.08)",
        }}
      />
      {/* Inner border */}
      <div
        className="absolute inset-[7px] z-10 pointer-events-none"
        style={{ border: "1px solid rgba(200,169,107,0.12)" }}
      />
      {/* Corner ornaments */}
      {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map(
        (pos, i) => (
          <div
            key={i}
            className={`absolute z-10 w-3 h-3 ${pos}`}
            style={{
              borderColor: "rgba(200,169,107,0.2)",
              borderStyle: "solid",
              borderWidth: i < 2 ? "1px 0 0 1px" : "0 1px 1px 0",
            }}
          />
        )
      )}
      {/* Image */}
      <img
        src="/cards/card-back.png"
        alt="Royal Arcana card back"
        className="w-full h-full object-contain"
        style={{ background: "#0D1424" }}
      />
    </div>
  );
}

/* ==============================
   CARD FACE (image)
   ============================== */
function CardFace({ card }: { card: TarotCardType }) {
  return (
    <div
      className="relative overflow-hidden flex flex-col"
      style={{
        width: 200,
        height: 320,
        background: "#0D1424",
        border: "2px solid rgba(200,169,107,0.35)",
        boxShadow: "inset 0 0 0 1px rgba(200,169,107,0.08)",
      }}
    >
      {/* Image area */}
      <div className="flex-1 relative overflow-hidden">
        <img
          src={card.image}
          alt={card.name}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Info overlay */}
      <div
        className="px-2.5 py-2 flex flex-col items-center"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(10,10,12,0.85) 25%, rgba(10,10,12,0.95) 100%)",
        }}
      >
        <span
          className="text-[0.5rem] tracking-[0.2em]"
          style={{ fontFamily: "Cinzel, serif", color: "rgba(200,169,107,0.55)" }}
        >
          {[
            "O", "I", "II", "III", "IV", "V", "VI", "VII",
            "VIII", "IX", "X", "XI", "XII", "XIII", "XIV",
            "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
          ][card.id] || card.id}
        </span>
        <h3
          className="text-xs sm:text-sm font-semibold mt-0.5 tracking-[0.06em]"
          style={{ fontFamily: "Cormorant Garamond, serif", color: "#C8A96B" }}
        >
          {card.chineseName}
        </h3>
        <p
          className="text-[0.45rem] italic tracking-[0.08em]"
          style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(184,188,198,0.45)" }}
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
}: {
  card?: TarotCardType;
  flipped: boolean;
  width?: number;
  height?: number;
  onClick?: () => void;
  className?: string;
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
            <CardFace card={card} />
          ) : (
            <div
              className="flex items-center justify-center"
              style={{
                width,
                height,
                background: "#0D1424",
                border: "2px solid rgba(200,169,107,0.2)",
              }}
            >
              <span style={{ color: "rgba(200,169,107,0.3)" }}>✦</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export { CardBack, CardFace };
