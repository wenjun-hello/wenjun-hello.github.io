"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TarotCard } from "@/data/tarotCards";
import type { QuestionType } from "@/lib/tarot";
import { getSuggestedQuestions } from "@/lib/generateFollowUpInterpretation";
import { generateFollowUpResponse, type FollowUpResponse } from "@/services/followUpService";

type Props = {
  card: TarotCard;
  questionType?: QuestionType;
};

export default function FollowUpInterpretation({ card, questionType }: Props) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ question: string; answer: string; source: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  const suggestions = getSuggestedQuestions(questionType);

  const handleGenerate = async () => {
    const q = input.trim();
    if (!q) {
      setError("请先写下你想继续追问的问题。");
      return;
    }
    setError("");
    setLoading(true);
    setSelectedChip(null);

    const response: FollowUpResponse = await generateFollowUpResponse({
      card,
      questionType,
      followUpQuestion: q,
    });

    setHistory((prev) => [{ question: q, answer: response.answer, source: response.source }, ...prev].slice(0, 3));
    setInput("");
    setLoading(false);
  };

  const handleSuggestionClick = (q: string) => {
    setInput(q);
    setSelectedChip(q);
    setError("");
  };

  const handleClear = () => {
    setHistory([]);
    setInput("");
    setError("");
    setSelectedChip(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="glass-panel p-6 sm:p-8 mt-8"
    >
      {/* Title */}
      <h3 className="text-center text-sm tracking-[0.15em] mb-2" style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}>
        继续追问
      </h3>
      <p className="text-center text-[0.65rem] tracking-[0.06em] mb-6 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>
        如果你仍然想知道更多，可以继续问这张牌。它不会替你决定答案，只会帮你更清楚地看见当下。
      </p>

      {/* Empty hint — only when no history and no loading */}
      {history.length === 0 && !loading && (
        <p className="text-center text-[0.65rem] mb-5" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(138,119,96,0.5)", fontStyle: "italic" }}>
          你可以选择一个问题，也可以写下此刻真正想问的那一句。
        </p>
      )}

      {/* Suggested questions */}
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {suggestions.map((q, i) => {
          const isSelected = selectedChip === q;
          return (
            <button
              key={i}
              onClick={() => handleSuggestionClick(q)}
              className="text-[0.68rem] px-3 py-1.5 rounded-full transition-all duration-300"
              style={{
                border: isSelected
                  ? "1px solid rgba(199,165,111,0.65)"
                  : "1px solid rgba(199,165,111,0.28)",
                background: isSelected
                  ? "rgba(255,243,216,0.8)"
                  : "rgba(255,249,239,0.65)",
                color: isSelected ? "#C7A56F" : "#6F5A3E",
                fontFamily: "Cormorant Garamond, serif",
              }}
            >
              {q}
            </button>
          );
        })}
      </div>

      {/* Input + button */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); setSelectedChip(null); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleGenerate(); }}
          placeholder="写下你想继续追问的问题……"
          disabled={loading}
          className="flex-1 text-sm px-4 py-2.5 rounded-2xl transition-all duration-300 focus:outline-none disabled:opacity-50"
          style={{
            border: "1px solid rgba(199,165,111,0.28)",
            background: "rgba(255,249,239,0.75)",
            color: "#4A3A2A",
            fontFamily: "Cormorant Garamond, serif",
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="text-[0.7rem] px-5 py-2.5 rounded-full transition-all duration-300 whitespace-nowrap disabled:opacity-60"
          style={{
            border: "1px solid rgba(199,165,111,0.45)",
            background: "#C7A56F",
            color: "#FFF9EF",
            fontFamily: "Cinzel, serif",
            letterSpacing: "0.12em",
            boxShadow: "0 8px 24px rgba(111,90,62,0.12)",
          }}
        >
          {loading ? "正在整理……" : "继续解读"}
        </button>
      </div>

      {error && (
        <p className="text-[0.65rem] text-center mb-3 italic" style={{ color: "#C7A56F", fontFamily: "Cormorant Garamond, serif" }}>
          {error}
        </p>
      )}

      {/* Loading state */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <motion.div
              className="w-8 h-8 rounded-full"
              style={{ border: "2px solid rgba(199,165,111,0.3)", borderTopColor: "#C7A56F" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-[0.7rem] italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "#C7A56F" }}>
              正在整理牌面的回应……
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <AnimatePresence>
        {history.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-5 pt-5"
            style={{ borderTop: "1px solid rgba(199,165,111,0.22)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[0.62rem] tracking-[0.12em]" style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}>
                追问记录
              </span>
              <button
                onClick={handleClear}
                className="text-[0.6rem] tracking-[0.08em] hover:opacity-55 transition-opacity"
                style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}
              >
                清空追问
              </button>
            </div>
            {history.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-5 last:mb-0"
              >
                {/* Question */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs mt-[2px]" style={{ color: "#C7A56F" }}>✦</span>
                  <p className="text-[0.72rem] italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "#C7A56F" }}>
                    {item.question}
                  </p>
                </div>
                {/* Answer */}
                <div
                  className="ml-5 p-4 rounded-2xl relative"
                  style={{
                    background: "rgba(255,249,239,0.5)",
                    border: "1px solid rgba(199,165,111,0.14)",
                  }}
                >
                  <p className="text-sm leading-7" style={{ fontFamily: "EB Garamond, serif", color: "#6F5A3E", whiteSpace: "pre-line" }}>
                    {item.answer}
                  </p>
                  {/* Source label */}
                  <span
                    className="absolute bottom-2 right-3 text-[0.5rem] tracking-[0.06em]"
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      color: item.source === "ai" ? "rgba(199,165,111,0.6)" : "rgba(138,119,96,0.3)",
                      fontStyle: "italic",
                    }}
                  >
                    {item.source === "ai" ? "AI 深度解读" : "本地解读"}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
