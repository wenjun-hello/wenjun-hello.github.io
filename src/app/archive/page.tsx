"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import DynamicBallroomBackground from "@/components/DynamicBallroomBackground";
import SectionHeading from "@/components/SectionHeading";
import TarotCard from "@/components/TarotCard";
import { tarotCards, TarotCard as TarotCardType } from "@/data/tarotCards";

const FILTERS = ["全部大阿卡那", "按主题筛选", "按关键词筛选"];

/* ==============================
   DETAIL PANEL (right side)
   ============================== */
function DetailPanel({ card, onClose }: { card: TarotCardType; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="panel-base p-6 sm:p-8 flex flex-col items-center text-center"
    >
      <button onClick={onClose} className="self-end text-sm hover:opacity-60 transition-opacity" style={{ color: "rgba(199,165,111,0.6)" }}>✕</button>

      <div className="w-[140px] h-[224px] mb-4">
        <TarotCard card={card} flipped width={140} height={224} />
      </div>

      <h2 className="text-lg tracking-[0.1em] mb-0.5" style={{ fontFamily: "Cinzel, serif", color: "#4A3A2A", fontWeight: 600 }}>{card.chineseName}</h2>
      <p className="text-xs italic tracking-[0.08em] mb-4" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>{card.name} · {card.frenchName}</p>

      <div className="flex flex-wrap justify-center gap-1.5 mb-4">
        {card.keywords.map((kw) => (<span key={kw} className="tag-soft">{kw}</span>))}
      </div>

      <div className="divider-gold my-2" />

      <div className="text-left w-full">
        <h4 className="text-[0.6rem] tracking-[0.18em] mb-2" style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}>✦ 正位含义</h4>
        <p className="text-xs leading-7 mb-4" style={{ fontFamily: "EB Garamond, serif", color: "#6F5A3E" }}>{card.upright}</p>

        <h4 className="text-[0.6rem] tracking-[0.18em] mb-2" style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}>✦ 行动建议</h4>
        <p className="text-xs leading-7 italic" style={{ fontFamily: "EB Garamond, serif", color: "#C7A56F" }}>{card.advice}</p>
      </div>
    </motion.div>
  );
}

/* ==============================
   GALLERY PAGE
   ============================== */
export default function ArchivePage() {
  const [selectedCard, setSelectedCard] = useState<TarotCardType | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <>
      <Navbar />
      <DynamicBallroomBackground primaryImage="/design-assets/ballroom-day.png" mode="day" intensity="medium" />
      <div className="min-h-screen pt-20 pb-20 px-4 sm:px-8" style={{ background: "transparent" }}>
        <div className="max-w-6xl mx-auto relative z-10">
          <SectionHeading title="塔罗牌库"
            subtitle="每一张牌，都是一种状态、一段经历，或一种内在力量的映照。" />

          {/* Filter pills */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
            {FILTERS.map((f, i) => (
              <button key={i} onClick={() => setActiveFilter(i)}
                className={`text-[0.65rem] px-3 py-1.5 rounded-full transition-all duration-300 tracking-[0.06em] ${i === activeFilter ? "" : "hover:border-[#C7A56F]/40"}`}
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  background: i === activeFilter ? "rgba(199,165,111,0.12)" : "rgba(255,249,239,0.5)",
                  border: i === activeFilter ? "1px solid rgba(199,165,111,0.5)" : "1px solid rgba(199,165,111,0.2)",
                  color: i === activeFilter ? "#C7A56F" : "#8A7760",
                }}
              >{f}</button>
            ))}
          </div>

          {/* Layout: grid left + detail right on desktop */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Card Grid */}
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 ${selectedCard ? "lg:grid-cols-3 flex-1" : "lg:grid-cols-4 w-full"}`}>
              {tarotCards.map((card, i) => {
                const isSel = selectedCard?.id === card.id;
                return (
                  <motion.button
                    key={card.id} onClick={() => setSelectedCard(isSel ? null : card)}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.4 }}
                    whileHover={{ y: -3 }}
                    className="flex flex-col items-center gap-2 p-3 transition-all duration-300 rounded-[22px]"
                    style={{
                      background: isSel ? "rgba(255,249,239,0.88)" : "rgba(255,249,239,0.5)",
                      border: isSel ? "1px solid rgba(199,165,111,0.55)" : "1px solid rgba(199,165,111,0.18)",
                      boxShadow: isSel ? "0 16px 50px rgba(111,90,62,0.14)" : "0 4px 18px rgba(111,90,62,0.04)",
                    }}
                  >
                    <TarotCard card={card} flipped useThumbnail width={110} height={176} />
                    <div className="text-center">
                      <h3 className="text-xs tracking-[0.08em]" style={{ fontFamily: "Cormorant Garamond, serif", color: "#4A3A2A", fontWeight: 600 }}>{card.chineseName}</h3>
                      <p className="text-[0.55rem] italic tracking-[0.06em]" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>{card.name}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Detail Panel (desktop: right side) */}
            <AnimatePresence>
              {selectedCard && (
                <div className="hidden lg:block w-[320px] flex-shrink-0">
                  <DetailPanel card={selectedCard} onClose={() => setSelectedCard(null)} />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile/tablet modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedCard(null)}
            style={{ background: "rgba(74,58,42,0.3)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              className="max-w-md w-full max-h-[85vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <DetailPanel card={selectedCard} onClose={() => setSelectedCard(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
