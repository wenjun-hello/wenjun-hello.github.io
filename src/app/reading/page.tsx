"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import DynamicBallroomBackground from "@/components/DynamicBallroomBackground";
import { useHandGesture } from "@/hooks/useHandGesture";
import CameraHandOverlay from "@/components/gesture/CameraHandOverlay";
import GestureFanDeck from "@/components/reading/GestureFanDeck";
import FollowUpInterpretation from "@/components/reading/FollowUpInterpretation";
import SectionHeading from "@/components/SectionHeading";
import RoyalButton from "@/components/RoyalButton";
import TarotCard from "@/components/TarotCard";
import { TarotCard as TarotCardType } from "@/data/tarotCards";
import {
  questionTypes, getSpreadPositions, getMeaningByQuestionType,
  type QuestionType, type SpreadType,
} from "@/lib/tarot";

type Step = "question" | "spread" | "shuffle" | "draw" | "result";

/* ==============================
   QUESTION CARDS — 2×3 ballroom grid
   ============================== */
const Q_ICONS: Record<string, string> = {
  love: "♡", career: "♢", fortune: "☽", growth: "❧", yesno: "◈", free: "✧",
};

function QuestionSelector({
  selected, onSelect, freeQuestion, onFreeQuestionChange,
}: { selected: QuestionType | null; onSelect: (q: QuestionType) => void; freeQuestion: string; onFreeQuestionChange: (v: string) => void }) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <p className="text-center text-xs tracking-[0.15em] mb-6 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>
        请自然地让问题停留在心里，然后选择一个适合你的方向
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {questionTypes.map((qt) => {
          const isSel = selected === qt.id;
          return (
            <motion.button
              key={qt.id} onClick={() => onSelect(qt.id)} whileHover={{ y: -2 }} whileTap={{ y: 0 }}
              className="relative text-left p-4 sm:p-5 transition-all duration-400 rounded-[24px]"
              style={{
                background: isSel ? "rgba(255,249,239,0.88)" : "rgba(255,249,239,0.55)",
                border: isSel ? "1px solid rgba(199,165,111,0.6)" : "1px solid rgba(199,165,111,0.22)",
                boxShadow: isSel ? "0 18px 50px rgba(111,90,62,0.13)" : "0 6px 24px rgba(111,90,62,0.05)",
              }}
            >
              {isSel && (
                <div className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full" style={{ background: "rgba(199,165,111,0.18)", border: "1px solid rgba(199,165,111,0.45)" }}>
                  <span className="text-[9px]" style={{ color: "#C7A56F" }}>✦</span>
                </div>
              )}
              <span className="text-lg mb-1.5 block" style={{ color: isSel ? "#C7A56F" : "rgba(199,165,111,0.45)" }}>{Q_ICONS[qt.id] || "◇"}</span>
              <h3 className="text-sm tracking-[0.12em] mb-1.5" style={{ fontFamily: "Cinzel, serif", color: isSel ? "#4A3A2A" : "#6F5A3E", fontWeight: isSel ? 600 : 400 }}>
                {qt.name}
              </h3>
              <p className="text-[0.65rem] leading-relaxed" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>{qt.description}</p>
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {selected === "free" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5">
            <textarea value={freeQuestion} onChange={(e) => onFreeQuestionChange(e.target.value)}
              placeholder="写下你此刻想理解的问题……" rows={3}
              className="w-full p-4 text-sm resize-none transition-all duration-400 focus:outline-none rounded-[18px]"
              style={{ background: "rgba(255,249,239,0.6)", border: "1px solid rgba(199,165,111,0.22)", color: "#4A3A2A", fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ==============================
   SPREAD SELECTOR — two wide panels
   ============================== */
function SpreadSelector({ selected, onSelect }: { selected: SpreadType | null; onSelect: (s: SpreadType) => void }) {
  const spreads = [
    { id: "one" as const, name: "单张牌", desc: "适合快速获得一个当下提醒", icon: "✦" },
    { id: "three" as const, name: "三张牌", desc: "适合观察事情的背景、现状与下一步方向", icon: "✦ ✦ ✦" },
  ];
  return (
    <div className="w-full max-w-2xl mx-auto">
      <p className="text-center text-xs tracking-[0.15em] mb-6 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>选择一种抽牌方式</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {spreads.map((s) => {
          const isSel = selected === s.id;
          return (
            <motion.button key={s.id} onClick={() => onSelect(s.id)} whileHover={{ y: -2 }}
              className="relative text-center p-6 sm:p-8 transition-all duration-400 rounded-[28px]"
              style={{
                background: isSel ? "rgba(255,249,239,0.88)" : "rgba(255,249,239,0.55)",
                border: isSel ? "1px solid rgba(199,165,111,0.6)" : "1px solid rgba(199,165,111,0.22)",
                boxShadow: isSel ? "0 18px 50px rgba(111,90,62,0.13)" : "0 6px 24px rgba(111,90,62,0.05)",
              }}
            >
              <div className="text-xl mb-3" style={{ color: "#C7A56F" }}>{s.icon}</div>
              <h3 className="text-sm tracking-[0.12em] mb-2" style={{ fontFamily: "Cinzel, serif", color: isSel ? "#4A3A2A" : "#6F5A3E", fontWeight: isSel ? 600 : 400 }}>{s.name}</h3>
              <p className="text-[0.65rem] leading-relaxed" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>{s.desc}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ==============================
   SHUFFLE
   ============================== */
function ShuffleDeck({ onComplete }: { onComplete: () => void }) {
  const [shuffling, setShuffling] = useState(false);
  const handleShuffle = () => { setShuffling(true); setTimeout(() => { setShuffling(false); onComplete(); }, 2000); };
  return (
    <div className="flex flex-col items-center gap-8">
      {!shuffling ? (
        <RoyalButton onClick={handleShuffle}>洗牌</RoyalButton>
      ) : (
        <div className="relative w-72 h-72 flex items-center justify-center">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div key={i} className="absolute w-12 h-[72px] overflow-hidden" style={{ border: "1px solid rgba(199,165,111,0.25)", borderRadius: 4 }}>
              <img src="/cards-webp/card-back.webp" alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "/cards/card-back.png"; }} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==============================
   READING RESULT — two-column
   ============================== */
function GoldIcon({ children }: { children: string }) {
  return <span className="text-xs mr-2" style={{ color: "#C7A56F" }}>{children}</span>;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-[0.62rem] tracking-[0.2em] mb-3 mt-7 flex items-center" style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}>
      <GoldIcon>✦</GoldIcon>{children}
    </h3>
  );
}

function ReadingResult({
  cards, questionType, spreadType, freeQuestion, onReset,
}: { cards: TarotCardType[]; questionType: QuestionType; spreadType: SpreadType; freeQuestion: string; onReset: () => void }) {
  const positions = spreadType === "three" ? getSpreadPositions(questionType) : null;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <SectionHeading title="抽牌结果" />

      {cards.map((card, i) => {
        const meaning = getMeaningByQuestionType(card, questionType);
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.3, duration: 0.7 }} className="mb-14">
            {positions && (
              <p className="text-center text-xs tracking-[0.15em] mb-4" style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}>{positions[i]}</p>
            )}

            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">
              {/* Left — Card in display frame */}
              <div className="flex-shrink-0">
                <div className="card-frame">
                  <TarotCard card={card} flipped width={180} height={288} />
                </div>
              </div>

              {/* Right — Interpretation panel */}
              <div className="flex-1 min-w-0 panel-base p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl tracking-[0.1em] mb-1" style={{ fontFamily: "Cinzel, serif", color: "#4A3A2A", fontWeight: 600 }}>
                  {card.chineseName}
                </h2>
                <p className="text-xs italic tracking-[0.08em] mb-4" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>
                  {card.name} · {card.frenchName}
                </p>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {card.keywords.map((kw) => (
                    <span key={kw} className="tag-soft">{kw}</span>
                  ))}
                </div>

                <div className="divider-gold my-4" />

                <SectionTitle>核心象征</SectionTitle>
                <p className="text-sm leading-8" style={{ fontFamily: "EB Garamond, serif", color: "#6F5A3E" }}>{card.coreMeaning}</p>

                <div className="divider-gold my-4" />

                <SectionTitle>牌面提醒</SectionTitle>
                <p className="text-sm leading-8" style={{ fontFamily: "EB Garamond, serif", color: "#6F5A3E" }}>{meaning}</p>

                <div className="divider-gold my-4" />

                <SectionTitle>行动建议</SectionTitle>
                <p className="text-sm leading-8 italic" style={{ fontFamily: "EB Garamond, serif", color: "#C7A56F" }}>{card.advice}</p>

                <div className="divider-gold my-4" />

                <SectionTitle>需要留意的地方</SectionTitle>
                <p className="text-sm leading-8" style={{ fontFamily: "EB Garamond, serif", color: "#8A7760" }}>{card.shadow}</p>

                <div className="divider-gold my-4" />

                <SectionTitle>给自己的问题</SectionTitle>
                <p className="text-sm leading-8 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(199,165,111,0.7)" }}>{card.reflectionQuestion}</p>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Follow-up interpretation */}
      <FollowUpInterpretation card={cards[0]} questionType={questionType} />

      {/* Synthesis for 3-card */}
      {spreadType === "three" && cards.length >= 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.7 }}
          className="panel-base p-6 sm:p-8 mb-10 max-w-3xl mx-auto text-center">
          <h3 className="text-sm tracking-[0.15em] mb-4" style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}>综合解读</h3>
          <p className="text-sm leading-8" style={{ fontFamily: "EB Garamond, serif", color: "#6F5A3E", fontStyle: "italic" }}>
            你的牌阵从 <strong style={{ color: "#C7A56F" }}>{cards[0].chineseName}</strong> 开始，它提醒你关注 {cards[0].keywords.slice(0, 2).join(" 与 ")}——{cards[0].coreMeaning.split("。")[0]}。
            在中间的是 <strong style={{ color: "#C7A56F" }}>{cards[1].chineseName}</strong>，指向 {cards[1].keywords.slice(0, 2).join(" 与 ")}，照亮了你问题的核心。
            前方的路由 <strong style={{ color: "#C7A56F" }}>{cards[2].chineseName}</strong> 指引：{cards[2].advice}
            这些牌并不代表一个固定的未来，更像是一面镜子，邀请你用更清醒的眼光、更柔和的节奏去看待自己正在面对的事情。
          </p>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <RoyalButton onClick={onReset}>重新抽牌</RoyalButton>
        <RoyalButton variant="secondary" onClick={() => window.location.href = "/"}>返回首页</RoyalButton>
      </div>

      <p className="text-center text-[0.6rem] mt-10 tracking-[0.08em] max-w-md mx-auto" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760", fontStyle: "italic" }}>
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
  // Atmosphere state — connected to gestures
  const [bgPaused, setBgPaused] = useState(false);
  const [bgIntensity, setBgIntensity] = useState<"soft" | "medium" | "strong">("strong");

  // Hand gesture hook
  const handGesture = useHandGesture();

  const canProceed = questionType && spreadType;

  const handleNext = () => {
    setError("");
    if (!questionType) { setError("请先选择你想探索的方向。"); return; }
    if (!spreadType) { setError("请先选择抽牌方式。"); return; }
    setBgIntensity("strong"); setStep("shuffle");
  };

  const handleReset = () => {
    setStep("question"); setQuestionType(null); setFreeQuestion(""); setSpreadType(null); setError(""); setDrawnCards([]);
    setBgPaused(false); setBgIntensity("strong");
  };

  const handleReveal = (cards: TarotCardType[]) => { setDrawnCards(cards); setBgPaused(true); setBgIntensity("soft"); setStep("result"); };

  return (
    <>
      <Navbar />
      {/* Day ballroom — pre-result phases */}
      <div className="transition-opacity duration-[2s]" style={{ opacity: step === "result" ? 0 : 1 }}>
        <DynamicBallroomBackground primaryImage="/design-assets/ballroom-day.png" secondaryImage="/design-assets/ballroom-night.png" mode="mixed" intensity={bgIntensity} isPaused={bgPaused} />
      </div>
      {/* Night ballroom — result phase */}
      <div className="transition-opacity duration-[2s]" style={{ opacity: step === "result" ? 1 : 0 }}>
        <DynamicBallroomBackground primaryImage="/design-assets/ballroom-night.png" mode="night" intensity="soft" isPaused={false} />
      </div>

      {/* Camera hand gesture overlay */}
      <CameraHandOverlay
        videoRef={handGesture.videoRef}
        canvasRef={handGesture.canvasRef}
        gesture={handGesture.gesture}
        stableGesture={handGesture.stableGesture}
        gestureAction={"idle"}
        isEnabled={handGesture.isEnabled}
        isLoading={handGesture.isLoading}
        error={handGesture.error}
        onEnable={handGesture.enable}
        onDisable={handGesture.disable}
        cooldown={handGesture.cooldown}
        hoveredCardIndex={null}
        debug={handGesture.debug}
      />

      <div className="min-h-screen pt-20 pb-20 px-4 sm:px-8" style={{ background: "transparent" }}>
        <div className="max-w-6xl mx-auto relative z-10">
          <SectionHeading title="抽一张牌，看见当下"
            subtitle="在开始之前，可以先想一想：你现在最想理解的，是一段关系、一个选择，还是自己的某种状态？" />

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
            {(["question", "spread", "shuffle", "draw", "result"] as Step[]).map((s, i) => {
              const isActive = step === s || (step === "draw" && s === "shuffle") || (step === "result" && (s === "draw" || s === "shuffle"));
              const isPast = (step === "spread" && s === "question") || (step === "shuffle" && (s === "question" || s === "spread")) || (step === "draw" && s === "question") || (step === "result" && s !== "result");
              return (
                <div key={s} className="flex items-center gap-2 sm:gap-4">
                  <div className="w-2 h-2 rounded-full transition-all duration-400" style={{ background: isActive || isPast ? "#C7A56F" : "rgba(199,165,111,0.2)", boxShadow: (isActive || isPast) ? "0 0 6px rgba(199,165,111,0.3)" : "none" }} />
                  {i < 4 && <div className="w-6 sm:w-10 h-[1px]" style={{ background: isPast ? "rgba(199,165,111,0.3)" : "rgba(199,165,111,0.1)" }} />}
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {step === "question" && (
              <motion.div key="q" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <QuestionSelector selected={questionType} onSelect={setQuestionType} freeQuestion={freeQuestion} onFreeQuestionChange={setFreeQuestion} />
              </motion.div>
            )}
            {step === "spread" && (
              <motion.div key="sp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <SpreadSelector selected={spreadType} onSelect={setSpreadType} />
              </motion.div>
            )}
            {step === "shuffle" && (
              <motion.div key="sh" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="flex flex-col items-center">
                <ShuffleDeck onComplete={() => setStep("draw")} />
              </motion.div>
            )}
            {step === "draw" && (
              <motion.div key="dr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <GestureFanDeck count={(spreadType === "one" ? 1 : 3) as 1 | 3} onReveal={handleReveal} handGesture={handGesture} isGestureEnabled={handGesture.isEnabled} />
              </motion.div>
            )}
            {step === "result" && (
              <motion.div key="rv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <ReadingResult cards={drawnCards} questionType={questionType!} spreadType={spreadType!} freeQuestion={freeQuestion} onReset={handleReset} />
              </motion.div>
            )}
          </AnimatePresence>

          {(step === "question" || step === "spread") && (
            <div className="flex flex-col items-center gap-3 mt-10">
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "#C7A56F" }}>{error}</motion.p>
              )}
              <div className="flex gap-4">
                {step === "question" && <RoyalButton onClick={() => setStep("spread")} disabled={!questionType}>继续选择牌阵</RoyalButton>}
                {step === "spread" && (
                  <>
                    <RoyalButton variant="secondary" onClick={() => setStep("question")}>返回</RoyalButton>
                    <RoyalButton onClick={handleNext} disabled={!canProceed}>准备洗牌</RoyalButton>
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
