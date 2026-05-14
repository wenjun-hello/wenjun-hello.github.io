"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import SectionHeading from "@/components/SectionHeading";
import TarotCard from "@/components/TarotCard";
import { tarotCards, TarotCard as TarotCardType } from "@/data/tarotCards";

/* ==============================
   CARD DETAIL MODAL
   ============================== */
function CardDetailModal({
  card,
  onClose,
}: {
  card: TarotCardType;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-10"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0D1424",
          border: "1px solid rgba(200,169,107,0.25)",
          boxShadow: "0 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl hover:opacity-70 transition-opacity"
          style={{ color: "rgba(200,169,107,0.5)" }}
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
          {/* Card */}
          <div className="flex-shrink-0 flex justify-center">
            <TarotCard card={card} flipped width={180} height={288} />
          </div>

          {/* Info */}
          <div className="flex-1">
            <span
              className="text-[0.6rem] tracking-[0.2em]"
              style={{
                fontFamily: "Cinzel, serif",
                color: "rgba(200,169,107,0.5)",
              }}
            >
              {["O", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][card.id]}
            </span>
            <h2
              className="text-xl sm:text-2xl tracking-[0.15em] mt-1 mb-1"
              style={{ fontFamily: "Cinzel, serif", color: "#C8A96B" }}
            >
              {card.name}
            </h2>
            <p
              className="text-xs italic tracking-[0.15em] mb-4"
              style={{
                fontFamily: "Cormorant Garamond, serif",
                color: "rgba(184,188,198,0.4)",
              }}
            >
              {card.chineseName}
            </p>

            {/* Keywords */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {card.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[0.6rem] px-2 py-0.5"
                  style={{
                    border: "1px solid rgba(200,169,107,0.15)",
                    color: "rgba(200,169,107,0.6)",
                    fontFamily: "Cormorant Garamond, serif",
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>

            {/* Upright */}
            <div className="mb-4">
              <span
                className="text-[0.6rem] tracking-[0.2em]"
                style={{
                  fontFamily: "Cinzel, serif",
                  color: "rgba(200,169,107,0.5)",
                }}
              >
                正位含义
              </span>
              <p
                className="text-sm leading-relaxed mt-1"
                style={{
                  fontFamily: "EB Garamond, serif",
                  color: "rgba(244,231,207,0.7)",
                }}
              >
                {card.upright}
              </p>
            </div>

            {/* Reversed */}
            <div className="mb-4">
              <span
                className="text-[0.6rem] tracking-[0.2em]"
                style={{
                  fontFamily: "Cinzel, serif",
                  color: "rgba(200,169,107,0.4)",
                }}
              >
                逆位含义
              </span>
              <p
                className="text-sm leading-relaxed mt-1"
                style={{
                  fontFamily: "EB Garamond, serif",
                  color: "rgba(184,188,198,0.5)",
                }}
              >
                {card.reversed}
              </p>
            </div>

            {/* Advice */}
            <div
              className="p-4"
              style={{
                background: "rgba(200,169,107,0.04)",
                borderLeft: "2px solid rgba(200,169,107,0.3)",
              }}
            >
              <span
                className="text-[0.6rem] tracking-[0.2em]"
                style={{
                  fontFamily: "Cinzel, serif",
                  color: "rgba(200,169,107,0.6)",
                }}
              >
                行动建议
              </span>
              <p
                className="text-sm leading-relaxed mt-1"
                style={{
                  fontFamily: "EB Garamond, serif",
                  color: "rgba(244,231,207,0.65)",
                  fontStyle: "italic",
                }}
              >
                {card.advice}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ==============================
   ARCHIVE PAGE
   ============================== */
export default function ArchivePage() {
  const [selectedCard, setSelectedCard] = useState<TarotCardType | null>(null);

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen pt-20 pb-20 px-4 sm:px-8"
        style={{ background: "#0D1424" }}
      >
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            title="塔罗牌库"
            subtitle="这里收录了大阿卡那的二十二张牌。每一张牌都代表一种状态、一段经验，或一种值得被看见的内在力量。"
          />

          {/* Card Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {tarotCards.map((card, i) => (
              <motion.button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center gap-2 p-3 transition-all duration-500"
                style={{
                  background: "rgba(10,10,12,0.3)",
                  border: "1px solid rgba(200,169,107,0.1)",
                }}
              >
                <TarotCard card={card} flipped width={120} height={192} />
                <div className="text-center">
                  <h3
                    className="text-xs tracking-[0.1em]"
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      color: "#C8A96B",
                    }}
                  >
                    {card.name}
                  </h3>
                  <p
                    className="text-[0.55rem] italic tracking-[0.08em]"
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      color: "rgba(184,188,198,0.35)",
                    }}
                  >
                    {card.chineseName}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedCard && (
          <CardDetailModal
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
