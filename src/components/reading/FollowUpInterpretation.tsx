"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TarotCard } from "@/data/tarotCards";
import type { CardWithOrientation } from "@/components/reading/GestureFanDeck";
import type { QuestionType } from "@/lib/tarot";
import { getSuggestedQuestions } from "@/lib/generateFollowUpInterpretation";
import { generateFollowUpResponse, type FollowUpResponse } from "@/services/followUpService";
import { getRemainingAI, canUseAI } from "@/lib/usageLimit";
import { trackEvent } from "@/lib/analytics";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import VoiceOverlay from "@/components/voice/VoiceOverlay";

type Props = {
  card: TarotCard;
  questionType?: QuestionType;
  originalQuestion?: string;
  spreadType?: string;
  allCards?: CardWithOrientation[];
  positions?: string[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "local";
};

function msgId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function FollowUpInterpretation({ card, questionType, originalQuestion, spreadType, allCards, positions }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(!canUseAI());
  const [remaining, setRemaining] = useState(getRemainingAI());

  // Voice overlay
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState<string | undefined>();

  // Per-message reading
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const recognition = useSpeechRecognition();
  const synth = useSpeechSynthesis();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = getSuggestedQuestions(questionType);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Track when synth finishes naturally
  useEffect(() => {
    if (!synth.isSpeaking && speakingMsgId) {
      setSpeakingMsgId(null);
    }
  }, [synth.isSpeaking, speakingMsgId]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => { synth.stop(); };
  }, [synth]);

  // ---- Submit logic ----
  const submitQuestion = async (q: string) => {
    if (!q.trim() || loading || limitReached) return;

    setLoading(true);
    setInput("");

    const userMsg: ChatMessage = { id: msgId(), role: "user", content: q.trim() };
    setMessages((prev) => [...prev, userMsg]);

    const cardSummaries = (allCards || [card]).map((c: any, i) => ({
      chineseName: c.chineseName, name: c.name, keywords: c.keywords,
      position: positions?.[i] || (allCards && allCards.length > 1 ? `第${i + 1}张牌` : undefined),
      orientation: c.orientation || "upright",
      isReversed: c.isReversed || false,
    }));
    const recentHistory = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-6)
      .map((m) => ({ question: m.role === "user" ? m.content : "", answer: m.role === "assistant" ? m.content : "", source: m.source || "local" }));

    const response: FollowUpResponse = await generateFollowUpResponse({
      card, questionType, followUpQuestion: q.trim(),
      readingContext: {
        originalQuestion, spreadType,
        cards: cardSummaries,
        followUpHistory: recentHistory,
      },
    });

    if (response.source === "ai") {
      setRemaining(getRemainingAI());
      trackEvent("followup_chat_ai_success");
    }
    if (response.error === "daily-limit-reached") {
      setLimitReached(true);
      setRemaining(0);
      trackEvent("followup_chat_limit_reached");
    }

    const assistantMsg: ChatMessage = { id: msgId(), role: "assistant", content: response.answer, source: response.source };
    setMessages((prev) => [...prev, assistantMsg]);
    setLatestAnswer(response.answer);
    setLoading(false);
  };

  // ---- Handlers ----
  const handleTextSend = () => {
    if (!input.trim() || loading || limitReached) return;
    trackEvent("followup_text_message_submitted");
    submitQuestion(input);
  };

  const handleChipClick = (q: string) => {
    if (limitReached) return;
    setInput(q);
    inputRef.current?.focus();
  };

  const handleSendTranscript = (text: string) => {
    trackEvent("followup_voice_confirmed");
    setVoiceOverlayOpen(false);
    submitQuestion(text);
  };

  const handleEditTranscript = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const handleReadMessage = (msg: ChatMessage) => {
    synth.stop();
    setSpeakingMsgId(msg.id);
    synth.speak(msg.content);
  };

  const handleStopReading = () => {
    synth.stop();
    setSpeakingMsgId(null);
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
    synth.stop();
    setSpeakingMsgId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="glass-panel p-6 sm:p-8 mt-8"
    >
      {/* Title */}
      <h3 className="text-center text-sm tracking-[0.15em] mb-1" style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}>
        和牌面聊聊
      </h3>
      <p className="text-center text-[0.62rem] tracking-[0.05em] mb-5 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>
        你可以继续和这次牌面聊下去，文字或语音都可以。
      </p>

      {/* Suggested question chips */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-5">
        {suggestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleChipClick(q)}
            disabled={limitReached}
            className="text-[0.65rem] px-2.5 py-1.5 rounded-full transition-all duration-300 hover:opacity-70 disabled:opacity-35"
            style={{
              border: "1px solid rgba(199,165,111,0.22)",
              background: "rgba(255,249,239,0.55)",
              color: "#6F5A3E",
              fontFamily: "Cormorant Garamond, serif",
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Limit reached */}
      {limitReached && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center mb-4 p-4 rounded-2xl"
          style={{ background: "rgba(255,249,239,0.5)", border: "1px solid rgba(199,165,111,0.18)" }}
        >
          <p className="text-[0.72rem] leading-6 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>
            今天的 AI 对话次数已经用完啦。你可以先把想法写下来，明天再继续和牌面聊聊。
          </p>
        </motion.div>
      )}

      {/* ---- Chat History ---- */}
      {messages.length > 0 && !loading && (
        <div
          ref={listRef}
          className="mb-5 space-y-4 px-1"
          style={{ maxHeight: "44vh", overflowY: "auto" }}
        >
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[88%]">
                  <div
                    className="px-4 py-3"
                    style={{
                      borderRadius: msg.role === "user" ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
                      background: msg.role === "user" ? "rgba(199,165,111,0.1)" : "rgba(255,249,239,0.75)",
                      border: msg.role === "user" ? "1px solid rgba(199,165,111,0.2)" : "1px solid rgba(199,165,111,0.12)",
                      boxShadow: msg.role === "user" ? "none" : "0 4px 18px rgba(111,90,62,0.04)",
                    }}
                  >
                    {/* Label */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className="text-[0.55rem] tracking-[0.1em]"
                        style={{
                          fontFamily: "Cinzel, serif",
                          color: msg.role === "user" ? "rgba(138,119,96,0.5)" : "#C7A56F",
                        }}
                      >
                        {msg.role === "user" ? "你" : "✦ 牌面的回应"}
                      </span>
                      {/* Read button for assistant messages */}
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => {
                            if (speakingMsgId === msg.id) handleStopReading();
                            else handleReadMessage(msg);
                          }}
                          className="text-[0.5rem] tracking-[0.06em] px-1.5 py-0.5 rounded-full transition-all duration-200 hover:opacity-70"
                          style={{
                            fontFamily: "Cormorant Garamond, serif",
                            color: speakingMsgId === msg.id ? "#C7A56F" : "rgba(138,119,96,0.4)",
                            background: speakingMsgId === msg.id ? "rgba(199,165,111,0.12)" : "transparent",
                          }}
                        >
                          {speakingMsgId === msg.id ? "停止" : "朗读"}
                        </button>
                      )}
                    </div>
                    {/* Content */}
                    <p
                      className="text-sm leading-7"
                      style={{
                        fontFamily: "EB Garamond, serif",
                        color: "#4A3A2A",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {msg.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ---- Loading ---- */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex justify-start mb-5"
          >
            <div
              className="px-4 py-3"
              style={{
                borderRadius: "18px 18px 18px 5px",
                background: "rgba(255,249,239,0.75)",
                border: "1px solid rgba(199,165,111,0.12)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "#C7A56F" }}>
                  牌面正在回应……
                </span>
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ color: "#C7A56F", fontSize: 6 }}
                >
                  ●
                </motion.span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Input Bar ---- */}
      {!limitReached && (
        <div className="flex gap-2 sm:gap-3 items-end">
          {/* Microphone button */}
          <button
            onClick={() => {
              trackEvent("followup_voice_started");
              setVoiceOverlayOpen(true);
            }}
            disabled={loading || recognition.notSupported}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-35 hover:opacity-75"
            style={{
              background: "rgba(199,165,111,0.1)",
              border: "1px solid rgba(199,165,111,0.25)",
            }}
            title={recognition.notSupported ? "当前浏览器不支持语音识别" : "语音输入"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7A56F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSend(); } }}
            placeholder="继续和牌面聊聊……"
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
            onClick={handleTextSend}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 text-[0.65rem] tracking-[0.1em] px-4 py-2.5 rounded-full transition-all duration-300 whitespace-nowrap disabled:opacity-45"
            style={{
              fontFamily: "Cinzel, serif",
              background: input.trim() ? "#C7A56F" : "rgba(199,165,111,0.25)",
              color: "#FFF9EF",
              border: "1px solid rgba(199,165,111,0.35)",
              boxShadow: input.trim() ? "0 6px 18px rgba(111,90,62,0.1)" : "none",
            }}
          >
            发送
          </button>
        </div>
      )}

      {/* ---- Bottom bar ---- */}
      <div className="flex items-center justify-between mt-4 px-1">
        {messages.length > 0 ? (
          <button
            onClick={handleClear}
            className="text-[0.6rem] tracking-[0.08em] hover:opacity-55 transition-opacity"
            style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}
          >
            清空对话
          </button>
        ) : <div />}
        {!limitReached && (
          <p className="text-[0.6rem] tracking-[0.05em] italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(138,119,96,0.4)" }}>
            今日 AI 对话剩余：{remaining} 次
          </p>
        )}
      </div>

      {/* ---- Voice Overlay ---- */}
      <VoiceOverlay
        isOpen={voiceOverlayOpen}
        onClose={() => { setVoiceOverlayOpen(false); recognition.stop(); }}
        card={card}
        onSendTranscript={handleSendTranscript}
        onEditTranscript={handleEditTranscript}
        recognition={recognition}
        synth={synth}
        loading={loading}
        latestAnswer={latestAnswer}
      />
    </motion.div>
  );
}
