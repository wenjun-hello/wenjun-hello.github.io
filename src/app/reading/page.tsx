"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import SectionHeading from "@/components/SectionHeading";
import RoyalButton from "@/components/RoyalButton";
import TarotCard from "@/components/TarotCard";
import { tarotCards, TarotCard as TarotCardType } from "@/data/tarotCards";
import {
  questionTypes,
  drawSingleCard,
  drawMultipleCards,
  getSpreadPositions,
  getMeaningByQuestionType,
  type QuestionType,
  type SpreadType,
} from "@/lib/tarot";
/* ==============================
   READING PAGE STATE
   ============================== */
type Step = "question" | "spread" | "shuffle" | "draw" | "result";
/* ==============================
   QUESTION SELECTOR
   ============================== */
function QuestionSelector({
  selected,
  onSelect,
  freeQuestion,
  onFreeQuestionChange,
}: {
  selected: QuestionType | null;
  onSelect: (q: QuestionType) => void;
  freeQuestion: string;
  onFreeQuestionChange: (v: string) => void;
}) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <p
        className="text-center text-xs tracking-[0.2em] mb-6 italic"
        style={{
          fontFamily: "Cormorant Garamond, serif",
          color: "rgba(184,188,198,0.5)",
        }}
      >
        请自然地让问题停留在心里，然后选择一个适合你的方向
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {questionTypes.map((qt) => {
          const isSelected = selected === qt.id;
          return (
            <motion.button
              key={qt.id}
              onClick={() => onSelect(qt.id)}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className={`relative text-left p-4 sm:p-5 transition-all duration-500 ${
                isSelected ? "" : "hover:bg-[rgba(200,169,107,0.02)]"
              }`}
              style={{
                background: isSelected
                  ? "rgba(200,169,107,0.04)"
                  : "rgba(10,10,12,0.3)",
                border: isSelected
                  ? "1px solid rgba(200,169,107,0.35)"
                  : "1px solid rgba(200,169,107,0.1)",
              }}
            >
              {isSelected && (
                <div
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full"
                  style={{
                    background: "rgba(200,169,107,0.15)",
                    border: "1px solid rgba(200,169,107,0.4)",
                  }}
                >
                  <span className="text-[8px]" style={{ color: "#C8A96B" }}>
                    ✦
                  </span>
                </div>
              )}
              <h3
                className="text-xs sm:text-sm tracking-[0.15em] mb-1.5"
                style={{
                  fontFamily: "Cinzel, serif",
                  color: isSelected ? "#C8A96B" : "rgba(200,169,107,0.7)",
                }}
              >
                {qt.name}
              </h3>
              <p
                className="text-[0.65rem] leading-relaxed"
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  color: "rgba(184,188,198,0.4)",
                }}
              >
                {qt.description}
              </p>
            </motion.button>
          );
        })}
      </div>
      {/* Free Question Input */}
      <AnimatePresence>
        {selected === "free" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5"
          >
            <textarea
              value={freeQuestion}
              onChange={(e) => onFreeQuestionChange(e.target.value)}
              placeholder="写下你此刻想理解的问题……"
              rows={3}
              className="w-full p-4 text-sm resize-none transition-all duration-500 focus:outline-none"
              style={{
                background: "rgba(10,10,12,0.5)",
                border: "1px solid rgba(200,169,107,0.2)",
                color: "#F4E7CF",
                fontFamily: "Cormorant Garamond, serif",
                fontStyle: "italic",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
/* ==============================
   SPREAD SELECTOR
   ============================== */
function SpreadSelector({
  selected,
  onSelect,
}: {
  selected: SpreadType | null;
  onSelect: (s: SpreadType) => void;
}) {
  const spreads = [
    {
      id: "one" as const,
      name: "单张牌",
      desc: "适合快速获得一个当下提醒。",
    },
    {
      id: "three" as const,
      name: "三张牌",
      desc: "适合观察事情的背景、现状与下一步方向。",
    },
  ];
  return (
    <div className="w-full max-w-2xl mx-auto">
      <p
        className="text-center text-xs tracking-[0.2em] mb-6 italic"
        style={{
          fontFamily: "Cormorant Garamond, serif",
          color: "rgba(184,188,198,0.5)",
        }}
      >
        选择一种抽牌方式
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {spreads.map((s) => {
          const isSelected = selected === s.id;
          return (
            <motion.button
              key={s.id}
              onClick={() => onSelect(s.id)}
              whileHover={{ y: -2 }}
              className={`relative text-center p-6 sm:p-8 transition-all duration-500 ${
                isSelected ? "" : "hover:bg-[rgba(200,169,107,0.02)]"
              }`}
              style={{
                background: isSelected
                  ? "rgba(200,169,107,0.04)"
                  : "rgba(10,10,12,0.3)",
                border: isSelected
                  ? "1px solid rgba(200,169,107,0.35)"
                  : "1px solid rgba(200,169,107,0.1)",
              }}
            >
              <div className="text-2xl mb-3" style={{ color: "#C8A96B" }}>
                {s.id === "one" ? "✦" : "✦ ✦ ✦"}
              </div>
              <h3
                className="text-sm tracking-[0.15em] mb-2"
                style={{
                  fontFamily: "Cinzel, serif",
                  color: isSelected ? "#C8A96B" : "rgba(200,169,107,0.7)",
                }}
              >
                {s.name}
              </h3>
              <p
                className="text-[0.65rem] leading-relaxed"
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  color: "rgba(184,188,198,0.4)",
                }}
              >
                {s.desc}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
/* ==============================
   SHUFFLE ANIMATION
   ============================== */
function ShuffleDeck({ onComplete }: { onComplete: () => void }) {
  const [shuffling, setShuffling] = useState(false);
  const handleShuffle = () => {
    setShuffling(true);
    setTimeout(() => {
      setShuffling(false);
      onComplete();
    }, 2000);
  };
  return (
    <div className="flex flex-col items-center gap-8">
      {!shuffling ? (
        <RoyalButton onClick={handleShuffle}>
          洗牌
        </RoyalButton>
      ) : (
        <div className="relative w-72 h-72 flex items-center justify-center">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-12 h-[72px] overflow-hidden"
              style={{
                border: "1px solid rgba(200,169,107,0.3)",
              }}
              initial={{
                x: (Math.random() - 0.5) * 140,
                y: (Math.random() - 0.5) * 120,
                rotate: Math.random() * 180 - 90,
                opacity: 0,
              }}
              animate={{
                x: [
                  (Math.random() - 0.5) * 160,
                  (Math.random() - 0.5) * 180,
                  (Math.random() - 0.5) * 100,
                ],
                y: [
                  (Math.random() - 0.5) * 130,
                  (Math.random() - 0.5) * 140,
                  (Math.random() - 0.5) * 80,
                ],
                rotate: [
                  Math.random() * 180,
                  Math.random() * 360,
                  Math.random() * 90 - 45,
                ],
                opacity: [0.3, 0.7, 0],
                scale: [0.8, 1, 0.6],
              }}
              transition={{
                duration: 2,
                times: [0, 0.5, 1],
                ease: "easeInOut",
                delay: i * 0.06,
              }}
            >
              <img src="/cards/card-back.png" alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}
          <motion.p
            className="text-xs tracking-[0.2em] z-10"
            style={{
              fontFamily: "Cormorant Garamond, serif",
              color: "rgba(200,169,107,0.6)",
              fontStyle: "italic",
            }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            正在洗牌...
          </motion.p>
        </div>
      )}
    </div>
  );
}
/* ==============================
   DRAW CARDS
   ============================== */
function DrawCards({
  count,
  onReveal,
}: {
  count: number;
  onReveal: (cards: TarotCardType[]) => void;
}) {
  const spreadCount = count === 1 ? 7 : 10;
  const [selected, setSelected] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<TarotCardType[]>([]);
  const handleClick = useCallback(
    (idx: number) => {
      if (selected.includes(idx)) return;
      const card = drawSingleCard(tarotCards);
      const newSelected = [...selected, idx];
      const newDrawn = [...drawn, card];
      setSelected(newSelected);
      setDrawn(newDrawn);
      if (newSelected.length >= count) {
        setTimeout(() => onReveal(newDrawn), 800);
      }
    },
    [selected, drawn, count, onReveal]
  );
  return (
    <div className="flex flex-col items-center gap-6">
      <p
        className="text-xs sm:text-sm tracking-[0.15em] italic text-center"
        style={{
          fontFamily: "Cormorant Garamond, serif",
          color: "rgba(200,169,107,0.6)",
        }}
      >
        {count === 1
          ? "牌已经准备好了。请选择一张你最想翻开的牌。"
          : `请选择 ${count} 张牌 — ${selected.length} / ${count} 已翻开`}
      </p>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
        {Array.from({ length: spreadCount }).map((_, i) => {
          const isSelected = selected.includes(i);
          const card = isSelected ? drawn[selected.indexOf(i)] : undefined;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <TarotCard
                card={card}
                flipped={isSelected}
                width={100}
                height={160}
                onClick={() => handleClick(i)}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
/* ==============================
   READING RESULT
   ============================== */
function SectionTitle({ children }: { children: string }) {
  return (
    <h3
      className="text-[0.65rem] tracking-[0.25em] text-center mb-4 mt-8"
      style={{ fontFamily: "Cinzel, serif", color: "rgba(200,169,107,0.5)" }}
    >
      {children}
    </h3>
  );
}

function GoldDivider() {
  return <div className="w-16 h-[1px] mx-auto my-4 bg-gradient-to-r from-transparent via-[rgba(200,169,107,0.25)] to-transparent" />;
}

function ReadingResult({
  cards,
  questionType,
  spreadType,
  freeQuestion,
  onReset,
}: {
  cards: TarotCardType[];
  questionType: QuestionType;
  spreadType: SpreadType;
  freeQuestion: string;
  onReset: () => void;
}) {
  const positions = spreadType === "three" ? getSpreadPositions(questionType) : null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <SectionHeading title="抽牌结果" />

      {/* Question context */}
      <div className="text-center mb-8">
        <p className="text-xs tracking-[0.15em] italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(184,188,198,0.4)" }}>
          {questionTypes.find((q) => q.id === questionType)?.name}
          {freeQuestion && ` — "${freeQuestion}"`}
        </p>
      </div>

      {/* Each Card */}
      {cards.map((card, i) => {
        const meaning = getMeaningByQuestionType(card, questionType);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.3, duration: 0.8 }}
            className="mb-12"
          >
            {positions && (
              <p className="text-center text-xs tracking-[0.2em] mb-4" style={{ fontFamily: "Cinzel, serif", color: "rgba(200,169,107,0.55)" }}>
                {positions[i]}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-center sm:items-start">
              {/* Card Image */}
              <div className="flex-shrink-0">
                <TarotCard card={card} flipped width={160} height={256} />
              </div>

              {/* Reading Panel */}
              <div className="flex-1 min-w-0">
                {/* Name */}
                <h2 className="text-lg sm:text-xl tracking-[0.12em] mb-0.5" style={{ fontFamily: "Cinzel, serif", color: "#C8A96B" }}>
                  {card.name}
                </h2>
                <p className="text-xs italic tracking-[0.1em] mb-3" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(184,188,198,0.4)" }}>
                  {card.frenchName} · {card.roman}
                </p>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {card.keywords.map((kw) => (
                    <span key={kw} className="text-[0.58rem] px-2 py-0.5" style={{ border: "1px solid rgba(200,169,107,0.18)", color: "rgba(200,169,107,0.6)", fontFamily: "Cormorant Garamond, serif" }}>
                      {kw}
                    </span>
                  ))}
                </div>

                <GoldDivider />

                {/* Core Meaning */}
                <SectionTitle>核心象征</SectionTitle>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "EB Garamond, serif", color: "rgba(244,231,207,0.65)" }}>
                  {card.coreMeaning}
                </p>

                <GoldDivider />

                {/* The Message (context-specific) */}
                <SectionTitle>牌面提醒</SectionTitle>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "EB Garamond, serif", color: "rgba(244,231,207,0.7)" }}>
                  {meaning}
                </p>

                <GoldDivider />

                {/* Advice */}
                <SectionTitle>行动建议</SectionTitle>
                <p className="text-sm leading-relaxed italic" style={{ fontFamily: "EB Garamond, serif", color: "rgba(200,169,107,0.6)" }}>
                  {card.advice}
                </p>

                <GoldDivider />

                {/* Shadow */}
                <SectionTitle>需要留意的地方</SectionTitle>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "EB Garamond, serif", color: "rgba(184,188,198,0.5)" }}>
                  {card.shadow}
                </p>

                <GoldDivider />

                {/* Ritual Prompt */}
                <SectionTitle>给自己的问题</SectionTitle>
                <p className="text-sm leading-relaxed italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(200,169,107,0.55)" }}>
                  {card.reflectionQuestion}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Synthesis for 3-card */}
      {spreadType === "three" && cards.length >= 3 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
          className="max-w-2xl mx-auto p-6 sm:p-8 mb-10"
          style={{ background: "rgba(200,169,107,0.03)", border: "1px solid rgba(200,169,107,0.15)" }}
        >
          <h3 className="text-center text-sm tracking-[0.2em] mb-5" style={{ fontFamily: "Cinzel, serif", color: "#C8A96B" }}>
            综合解读
          </h3>
          <p className="text-sm leading-relaxed text-center" style={{ fontFamily: "EB Garamond, serif", color: "rgba(184,188,198,0.6)", fontStyle: "italic" }}>
            你的牌阵从 <strong style={{ color: "#C8A96B" }}>{cards[0].name}</strong> 开始，它提醒你关注 {cards[0].keywords.slice(0,2).join(" 与 ")}——{cards[0].coreMeaning.split("。")[0]}。
            在中间的是 <strong style={{ color: "#C8A96B" }}>{cards[1].name}</strong>，它指向 {cards[1].keywords.slice(0,2).join(" 与 ")}，照亮了你问题的核心。
            前方的路由 <strong style={{ color: "#C8A96B" }}>{cards[2].name}</strong> 指引，它邀请你：{cards[2].advice}
            这些牌并不代表一个固定的未来，更像是一面镜子。它们邀请你用更清醒的眼光、更柔和的节奏，去看待自己正在面对的事情。
          </p>
        </motion.div>
      )}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <RoyalButton onClick={onReset}>重新抽牌</RoyalButton>
        <RoyalButton variant="secondary" onClick={() => window.location.href = "/"}>
          返回首页
        </RoyalButton>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[0.6rem] mt-10 tracking-[0.1em] max-w-md mx-auto" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(184,188,198,0.25)", fontStyle: "italic" }}>
        塔罗结果只是一种象征性的自我观察工具。它不能替你做决定，也不代表确定的未来。真正重要的，仍然是你的感受、判断和行动。
      </p>
    </div>
  );
}
/* ==============================
   READING PAGE
   ============================== */
export default function ReadingPage() {
  const [step, setStep] = useState<Step>("question");
  const [questionType, setQuestionType] = useState<QuestionType | null>(null);
  const [freeQuestion, setFreeQuestion] = useState("");
  const [spreadType, setSpreadType] = useState<SpreadType | null>(null);
  const [error, setError] = useState("");
  const [drawnCards, setDrawnCards] = useState<TarotCardType[]>([]);
  const canProceed =
    questionType && spreadType && (questionType !== "free" || true);
  const handleNext = () => {
    setError("");
    if (!questionType) {
      setError("Please choose the chamber of inquiry first.");
      return;
    }
    if (!spreadType) {
      setError("Please select a royal spread before the deck is prepared.");
      return;
    }
    setStep("shuffle");
  };
  const handleReset = () => {
    setStep("question");
    setQuestionType(null);
    setFreeQuestion("");
    setSpreadType(null);
    setError("");
    setDrawnCards([]);
  };
  const handleReveal = (cards: TarotCardType[]) => {
    setDrawnCards(cards);
    setStep("result");
  };
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-20 px-4 sm:px-8" style={{ background: "#0D1424" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            title="抽一张牌，看见当下"
            subtitle="在开始之前，可以先想一想：你现在最想理解的，是一段关系、一个选择，还是自己的某种状态？"
          />
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
            {(["question", "spread", "shuffle", "draw", "result"] as Step[]).map(
              (s, i) => {
                const isActive =
                  step === s ||
                  (step === "draw" && s === "shuffle") ||
                  (step === "result" && (s === "draw" || s === "shuffle"));
                const isPast =
                  (step === "spread" && s === "question") ||
                  (step === "shuffle" && (s === "question" || s === "spread")) ||
                  (step === "draw" && s === "question") ||
                  (step === "result" && s !== "result");
                return (
                  <div key={s} className="flex items-center gap-2 sm:gap-4">
                    <div
                      className="w-2 h-2 rounded-full transition-all duration-500"
                      style={{
                        background: isActive || isPast ? "#C8A96B" : "rgba(200,169,107,0.2)",
                        boxShadow:
                          isActive || isPast
                            ? "0 0 8px rgba(200,169,107,0.4)"
                            : "none",
                      }}
                    />
                    {i < 4 && (
                      <div
                        className="w-6 sm:w-10 h-[1px]"
                        style={{
                          background: isPast
                            ? "rgba(200,169,107,0.3)"
                            : "rgba(200,169,107,0.1)",
                        }}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>
          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === "question" && (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5 }}
              >
                <QuestionSelector
                  selected={questionType}
                  onSelect={setQuestionType}
                  freeQuestion={freeQuestion}
                  onFreeQuestionChange={setFreeQuestion}
                />
              </motion.div>
            )}
            {step === "spread" && (
              <motion.div
                key="spread"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5 }}
              >
                <SpreadSelector
                  selected={spreadType}
                  onSelect={setSpreadType}
                />
              </motion.div>
            )}
            {step === "shuffle" && (
              <motion.div
                key="shuffle"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <ShuffleDeck onComplete={() => setStep("draw")} />
              </motion.div>
            )}
            {step === "draw" && (
              <motion.div
                key="draw"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <DrawCards
                  count={spreadType === "one" ? 1 : 3}
                  onReveal={handleReveal}
                />
              </motion.div>
            )}
            {step === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ReadingResult
                  cards={drawnCards}
                  questionType={questionType!}
                  spreadType={spreadType!}
                  freeQuestion={freeQuestion}
                  onReset={handleReset}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Navigation buttons */}
          {(step === "question" || step === "spread") && (
            <div className="flex flex-col items-center gap-3 mt-10">
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs italic"
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    color: "rgba(200,169,107,0.6)",
                  }}
                >
                  {error}
                </motion.p>
              )}
              <div className="flex gap-4">
                {step === "question" && (
                  <RoyalButton onClick={() => setStep("spread")} disabled={!questionType}>
                    继续选择牌阵
                  </RoyalButton>
                )}
                {step === "spread" && (
                  <>
                    <RoyalButton variant="secondary" onClick={() => setStep("question")}>
                      返回
                    </RoyalButton>
                    <RoyalButton onClick={handleNext} disabled={!canProceed}>
                      准备洗牌
                    </RoyalButton>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
