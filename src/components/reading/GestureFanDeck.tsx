"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TarotCard from "@/components/TarotCard";
import RoyalButton from "@/components/RoyalButton";
import { tarotCards, TarotCard as TarotCardType } from "@/data/tarotCards";
import { drawSingleCard, drawMultipleCards } from "@/lib/tarot";
import type { GestureState } from "@/hooks/useHandGesture";

type Props = {
  count: 1 | 3;
  onReveal: (cards: TarotCardType[]) => void;
  handGesture: GestureState;
  isGestureEnabled: boolean;
};

type DeckState = "stacked" | "shuffling" | "spread" | "navigating" | "selected" | "revealing" | "revealed";

const FAN_SIZE = 9;

export default function GestureFanDeck({ count, onReveal, handGesture, isGestureEnabled }: Props) {
  const [deckState, setDeckState] = useState<DeckState>("stacked");
  const [fanCards, setFanCards] = useState<TarotCardType[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(Math.floor(FAN_SIZE / 2));
  const [selectedCards, setSelectedCards] = useState<TarotCardType[]>([]);
  const [selectedIdxs, setSelectedIdxs] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  // Shuffle: pick random cards and spread
  const doShuffle = useCallback(() => {
    setDeckState("shuffling");
    const drawn = drawMultipleCards(tarotCards, FAN_SIZE);
    setFanCards(drawn);
    setHighlightIdx(Math.floor(FAN_SIZE / 2));
    setSelectedCards([]);
    setSelectedIdxs([]);
    setRevealed(false);
    setTimeout(() => setDeckState("spread"), 1200);
  }, []);

  // Select highlighted card
  const doSelect = useCallback(() => {
    if (deckState !== "spread" && deckState !== "navigating") return;
    if (selectedIdxs.includes(highlightIdx)) return;
    const card = fanCards[highlightIdx];
    const newSelected = [...selectedCards, card];
    const newIdxs = [...selectedIdxs, highlightIdx];
    setSelectedCards(newSelected);
    setSelectedIdxs(newIdxs);
    if (count === 1 || newSelected.length >= count) {
      setDeckState("selected");
    }
  }, [deckState, highlightIdx, fanCards, selectedCards, selectedIdxs, count]);

  // Reveal
  const doReveal = useCallback(() => {
    if (deckState !== "selected" || revealed) return;
    setDeckState("revealing");
    setRevealed(true);
    setTimeout(() => {
      setDeckState("revealed");
      onReveal(selectedCards.length > 0 ? selectedCards : [fanCards[highlightIdx]]);
    }, 900);
  }, [deckState, revealed, selectedCards, fanCards, highlightIdx, onReveal]);

  // Swipe navigation
  const moveLeft = useCallback(() => {
    if (deckState !== "spread" && deckState !== "navigating") return;
    setDeckState("navigating");
    setHighlightIdx((prev) => Math.max(0, prev - 1));
  }, [deckState]);

  const moveRight = useCallback(() => {
    if (deckState !== "spread" && deckState !== "navigating") return;
    setDeckState("navigating");
    setHighlightIdx((prev) => Math.min(FAN_SIZE - 1, prev + 1));
  }, [deckState]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLeft();
      if (e.key === "ArrowRight") moveRight();
      if (e.key === "Enter") { if (deckState === "spread" || deckState === "navigating") doSelect(); else if (deckState === "selected") doReveal(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deckState, moveLeft, moveRight, doSelect, doReveal]);

  // Connect gesture state to fan deck
  useEffect(() => {
    handGesture.setOnOpenPalm(() => {
      if (deckState === "stacked") doShuffle();
    });
  }, [handGesture.setOnOpenPalm, deckState, doShuffle]);

  useEffect(() => {
    handGesture.setOnFist(() => {
      if (deckState === "spread" || deckState === "navigating") doSelect();
    });
  }, [handGesture.setOnFist, deckState, doSelect]);

  useEffect(() => {
    handGesture.setOnSwipeLeft(() => {
      if (deckState === "spread" || deckState === "navigating") moveLeft();
      else if (deckState === "selected") doReveal();
    });
  }, [handGesture.setOnSwipeLeft, deckState, moveLeft, doReveal]);

  useEffect(() => {
    handGesture.setOnSwipeRight(() => {
      if (deckState === "spread" || deckState === "navigating") moveRight();
      else if (deckState === "selected") doReveal();
    });
  }, [handGesture.setOnSwipeRight, deckState, moveRight, doReveal]);

  // Fan position calculation
  const getCardStyle = (index: number) => {
    const center = (FAN_SIZE - 1) / 2;
    const offset = index - center;
    const isHighlighted = index === highlightIdx && (deckState === "spread" || deckState === "navigating");
    const isSelected = selectedIdxs.includes(index);
    return {
      x: offset * 48 + (isHighlighted ? 0 : 0),
      y: Math.abs(offset) * 8 + (isHighlighted ? -18 : 0),
      rot: offset * 4.5,
      scale: isHighlighted ? 1.08 : isSelected ? 0.75 : 0.92,
      zIndex: isHighlighted ? 50 : isSelected ? 5 : 10 - Math.abs(offset),
      opacity: isSelected ? 0.4 : 1,
    };
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Stacked state */}
      {deckState === "stacked" && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-[140px] h-[224px]">
            {[0.92, 0.94, 0.96, 0.98, 1].map((s, i) => (
              <motion.div
                key={i}
                className="absolute inset-0"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                style={{ scale: s, zIndex: 5 - i }}
              >
                <img src="/cards-webp/card-back.webp" alt="" className="w-full h-full object-contain rounded-sm"
                  onError={(e) => { e.currentTarget.src = "/cards/card-back.png"; }} />
              </motion.div>
            ))}
          </div>
          <p className="text-xs tracking-[0.1em] italic text-center" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>
            {isGestureEnabled ? "张开手掌，洗开牌组" : "点击下方按钮开始洗牌"}
          </p>
          <RoyalButton onClick={doShuffle}>洗牌</RoyalButton>
        </div>
      )}

      {/* Shuffling */}
      {deckState === "shuffling" && (
        <div className="relative w-72 h-72 flex items-center justify-center">
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.div
              key={i} className="absolute w-12 h-[72px] rounded-sm overflow-hidden"
              style={{ border: "1px solid rgba(199,165,111,0.22)" }}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
              animate={{
                x: [(Math.random() - 0.5) * 160, (Math.random() - 0.5) * 180, (Math.random() - 0.5) * 100],
                y: [(Math.random() - 0.5) * 130, (Math.random() - 0.5) * 140, (Math.random() - 0.5) * 80],
                rotate: [Math.random() * 180, Math.random() * 360, Math.random() * 90 - 45],
                opacity: [0.3, 0.7, 0],
              }}
              transition={{ duration: 1.4, times: [0, 0.5, 1], delay: i * 0.05, ease: "easeInOut" }}
            >
              <img src="/cards-webp/card-back.webp" alt="" className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = "/cards/card-back.png"; }} />
            </motion.div>
          ))}
          <motion.p className="text-xs tracking-[0.15em] z-10" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(199,165,111,0.6)", fontStyle: "italic" }}
            animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
            正在洗牌...
          </motion.p>
        </div>
      )}

      {/* Spread / Navigating / Selected */}
      {(deckState === "spread" || deckState === "navigating" || deckState === "selected") && (
        <div className="flex flex-col items-center gap-5">
          {/* Fan */}
          <div className="relative w-full max-w-[640px] h-[300px] sm:h-[360px] mx-auto">
            {fanCards.map((card, i) => {
              const s = getCardStyle(i);
              const isHL = i === highlightIdx && (deckState === "spread" || deckState === "navigating");
              const isSel = selectedIdxs.includes(i);
              return (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2"
                  animate={{
                    x: s.x, y: s.y, rotate: s.rot, scale: s.scale, opacity: s.opacity, zIndex: s.zIndex,
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 24 }}
                  style={{ marginLeft: -45, marginTop: -72 }}
                >
                  <div className={`relative ${isHL ? "ring-2 ring-[#C7A56F]/60 rounded-sm" : ""}`}
                    style={{ boxShadow: isHL ? "0 0 30px rgba(199,165,111,0.35)" : "0 2px 8px rgba(0,0,0,0.1)" }}>
                    <TarotCard card={isSel ? card : undefined} flipped={isSel} width={90} height={144} />
                    {isHL && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-[0.5rem] tracking-[0.1em] px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(199,165,111,0.15)", color: "#C7A56F", fontFamily: "Cormorant Garamond, serif" }}>
                          当前选择
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs tracking-[0.08em] italic text-center" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>
              {deckState === "selected"
                ? "左右挥手，翻开这张牌"
                : isGestureEnabled
                  ? "左右挥手切换牌，握拳确认选择"
                  : "点击左右箭头切换牌，点击按钮确认选择"}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={moveLeft} className="text-sm px-3 py-1 rounded-full transition-all hover:opacity-70"
                style={{ border: "1px solid rgba(199,165,111,0.3)", color: "#C7A56F", fontFamily: "Cormorant Garamond, serif" }}>
                ◀
              </button>
              {deckState !== "selected" ? (
                <RoyalButton onClick={doSelect}>选择这张牌</RoyalButton>
              ) : (
                <RoyalButton onClick={doReveal}>翻开这张牌</RoyalButton>
              )}
              <button onClick={moveRight} className="text-sm px-3 py-1 rounded-full transition-all hover:opacity-70"
                style={{ border: "1px solid rgba(199,165,111,0.3)", color: "#C7A56F", fontFamily: "Cormorant Garamond, serif" }}>
                ▶
              </button>
            </div>
            {count === 3 && (
              <p className="text-[0.6rem] tracking-[0.06em]" style={{ color: "#8A7760", fontFamily: "Cormorant Garamond, serif" }}>
                已选 {selectedCards.length} / {count} 张
              </p>
            )}
          </div>
        </div>
      )}

      {/* Revealing */}
      {deckState === "revealing" && (
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotateY: 180 }} transition={{ duration: 0.8, ease: [0.4, 0, 0.1, 1] }}
            style={{ perspective: 1000, width: 160, height: 256 }}>
            <div className="w-full h-full">
              {selectedCards[0] ? (
                <TarotCard card={selectedCards[0]} flipped width={160} height={256} />
              ) : (
                <TarotCard card={fanCards[highlightIdx]} flipped width={160} height={256} />
              )}
            </div>
          </motion.div>
          <p className="text-xs tracking-[0.1em] italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "#C7A56F" }}>
            正在翻开...
          </p>
        </div>
      )}
    </div>
  );
}
