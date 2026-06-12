"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TarotCard } from "@/data/tarotCards";
import ArcanaNodeGraphBackground from "./ArcanaNodeGraphBackground";
import type { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

type OverlayState = "ready" | "listening" | "transcribed" | "thinking" | "answered" | "error";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  card: TarotCard;
  onSendTranscript: (text: string) => void;
  onEditTranscript: (text: string) => void;
  recognition: ReturnType<typeof useSpeechRecognition>;
  synth: ReturnType<typeof useSpeechSynthesis>;
  loading: boolean;
  latestAnswer?: string;
};

export default function VoiceOverlay({
  isOpen, onClose, card,
  onSendTranscript, onEditTranscript,
  recognition, synth, loading, latestAnswer,
}: Props) {
  const [state, setState] = useState<OverlayState>("ready");
  const [transcript, setTranscript] = useState("");

  const graphState = state === "listening" ? "listening" : state === "thinking" ? "thinking" : "ready";

  // Stable refs to avoid effect re-run on every render
  const recognitionRef = useRef(recognition);
  recognitionRef.current = recognition;
  const synthRef = useRef(synth);
  synthRef.current = synth;

  // Wire recognition result
  recognition.onResult((text: string) => {
    console.log("[VoiceRecognition] overlay received transcript:", text);
    setTranscript(text);
    setState("transcribed");
    recognition.stop("transcript received");
  });

  // Sync recognition errors
  useEffect(() => {
    if (recognition.status === "error") setState("error");
  }, [recognition.status]);

  // Watch loading to enter thinking state
  useEffect(() => {
    if (loading && state === "transcribed") setState("thinking");
  }, [loading, state]);

  // Watch loading finish to enter answered state
  useEffect(() => {
    if (!loading && state === "thinking") setState("answered");
  }, [loading, state]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setState("ready");
      setTranscript("");
      recognition.stop("overlay opened");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Cleanup only on real unmount (not on re-renders)
  useEffect(() => {
    return () => {
      recognitionRef.current.stop("component unmount");
      synthRef.current.stop();
    };
  }, []);

  const handleStartListening = () => {
    console.log("[VoiceRecognition] start listening clicked");
    setTranscript("");
    setState("listening");
    recognition.start();
  };

  const handleStopListening = () => {
    recognition.stop("user clicked stop");
    setState("ready");
  };

  const handleConfirm = () => {
    setState("thinking");
    onSendTranscript(transcript);
  };

  const handleRetry = () => {
    setTranscript("");
    setState("listening");
    recognition.start();
  };

  const handleReturnToText = () => {
    onEditTranscript(transcript);
    onClose();
  };

  const handleReadAnswer = () => {
    if (latestAnswer) synth.speak(latestAnswer);
  };

  const handleRetryMic = () => {
    setTranscript("");
    setState("listening");
    recognition.start();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(15,12,9,0.88)",
            backdropFilter: "blur(18px)",
          }}
        >
          {/* Node graph background */}
          <ArcanaNodeGraphBackground state={graphState} className="absolute inset-0" />

          {/* Central card glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              className="rounded-full"
              style={{
                width: 200,
                height: 200,
                background: "radial-gradient(circle, rgba(217,195,154,0.12) 0%, transparent 70%)",
              }}
              animate={{
                scale: state === "listening" ? [1, 1.15, 1] : state === "thinking" ? [0.95, 1.05, 0.95] : 1,
                opacity: state === "listening" ? [0.5, 0.8, 0.5] : state === "thinking" ? [0.4, 0.7, 0.4] : 0.3,
              }}
              transition={{
                duration: state === "listening" ? 2.5 : state === "thinking" ? 3 : 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Card image — subtle floating in center */}
          <motion.div
            className="absolute opacity-30"
            style={{ width: 100, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            animate={{ y: [0, -6, 0], rotate: [0, 1, 0, -1, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <img
              src={card.webpImage || card.image}
              alt={card.chineseName}
              className="w-full h-auto rounded-sm"
              style={{ filter: "brightness(1.2) saturate(0.6)" }}
            />
          </motion.div>

          {/* Content panel */}
          <div className="relative z-10 max-w-md w-full mx-6">
            {/* Title */}
            <motion.h2
              key={`title-${state}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-lg tracking-[0.15em] mb-6"
              style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}
            >
              牌面语音空间
            </motion.h2>

            {/* ---- State: ready ---- */}
            {state === "ready" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-sm leading-8 mb-8 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.55)" }}>
                  靠近牌面，轻声说出你的追问。
                </p>
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={handleStartListening}
                    className="text-[0.75rem] tracking-[0.12em] px-8 py-3 rounded-full transition-all duration-300"
                    style={{
                      fontFamily: "Cinzel, serif",
                      background: "#C7A56F",
                      color: "#FFF9EF",
                      border: "1px solid rgba(199,165,111,0.5)",
                      boxShadow: "0 8px 32px rgba(199,165,111,0.18)",
                    }}
                  >
                    开始聆听
                  </button>
                  <button
                    onClick={onClose}
                    className="text-[0.6rem] tracking-[0.08em] opacity-50 hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.5)" }}
                  >
                    返回文字输入
                  </button>
                </div>
              </motion.div>
            )}

            {/* ---- State: listening ---- */}
            {state === "listening" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-sm leading-8 mb-4 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.55)" }}>
                  正在聆听你的声音……
                </p>
                {recognition.interim && (
                  <p className="text-sm mb-6 italic opacity-60" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.4)" }}>
                    {recognition.interim}
                  </p>
                )}
                {/* Ripple rings */}
                <div className="flex justify-center gap-1.5 mb-8">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="rounded-full"
                      style={{ width: 6, height: 6, background: "#C7A56F" }}
                      animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.6, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleStopListening}
                  className="text-[0.65rem] tracking-[0.08em] px-5 py-2 rounded-full transition-all duration-300"
                  style={{
                    fontFamily: "Cinzel, serif",
                    background: "rgba(255,249,239,0.08)",
                    color: "rgba(255,249,239,0.5)",
                    border: "1px solid rgba(255,249,239,0.12)",
                  }}
                >
                  停止聆听
                </button>
              </motion.div>
            )}

            {/* ---- State: transcribed ---- */}
            {state === "transcribed" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-[0.6rem] tracking-[0.1em] mb-3" style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}>
                  我听见了：
                </p>
                <div
                  className="p-4 rounded-2xl mb-6"
                  style={{ background: "rgba(255,249,239,0.08)", border: "1px solid rgba(199,165,111,0.18)" }}
                >
                  <p className="text-sm leading-7 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.8)" }}>
                    「{transcript}」
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2.5">
                  <button
                    onClick={handleConfirm}
                    className="text-[0.7rem] tracking-[0.1em] px-6 py-2.5 rounded-full transition-all duration-300"
                    style={{
                      fontFamily: "Cinzel, serif",
                      background: "#C7A56F",
                      color: "#FFF9EF",
                      border: "1px solid rgba(199,165,111,0.5)",
                      boxShadow: "0 8px 24px rgba(199,165,111,0.15)",
                    }}
                  >
                    发送给牌面
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetry}
                      className="text-[0.6rem] tracking-[0.08em] px-4 py-1.5 rounded-full transition-all duration-300"
                      style={{
                        fontFamily: "Cinzel, serif",
                        background: "rgba(255,249,239,0.06)",
                        color: "rgba(255,249,239,0.5)",
                        border: "1px solid rgba(255,249,239,0.1)",
                      }}
                    >
                      重新说一次
                    </button>
                    <button
                      onClick={handleReturnToText}
                      className="text-[0.6rem] tracking-[0.08em] px-4 py-1.5 rounded-full transition-all duration-300"
                      style={{
                        fontFamily: "Cinzel, serif",
                        background: "rgba(255,249,239,0.06)",
                        color: "rgba(255,249,239,0.5)",
                        border: "1px solid rgba(255,249,239,0.1)",
                      }}
                    >
                      返回修改文字
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ---- State: thinking ---- */}
            {state === "thinking" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-sm italic mb-6" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.5)" }}>
                  牌面正在回应……
                </p>
                <motion.div
                  className="w-6 h-6 rounded-full mx-auto"
                  style={{ border: "2px solid rgba(199,165,111,0.3)", borderTopColor: "#C7A56F" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            )}

            {/* ---- State: answered ---- */}
            {state === "answered" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.p
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-sm mb-2" style={{ fontFamily: "Cormorant Garamond, serif", color: "#C7A56F" }}
                >
                  ✦
                </motion.p>
                <p className="text-sm leading-8 mb-8 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.55)" }}>
                  回应已经回到对话里。
                </p>
                <div className="flex flex-col items-center gap-2.5">
                  <button
                    onClick={onClose}
                    className="text-[0.7rem] tracking-[0.1em] px-6 py-2.5 rounded-full transition-all duration-300"
                    style={{
                      fontFamily: "Cinzel, serif",
                      background: "#C7A56F",
                      color: "#FFF9EF",
                      border: "1px solid rgba(199,165,111,0.5)",
                      boxShadow: "0 8px 24px rgba(199,165,111,0.15)",
                    }}
                  >
                    回到对话
                  </button>
                  {latestAnswer && (
                    <button
                      onClick={handleReadAnswer}
                      disabled={synth.isSpeaking}
                      className="text-[0.6rem] tracking-[0.08em] px-4 py-1.5 rounded-full transition-all duration-300 disabled:opacity-40"
                      style={{
                        fontFamily: "Cinzel, serif",
                        background: "rgba(255,249,239,0.06)",
                        color: "rgba(255,249,239,0.5)",
                        border: "1px solid rgba(255,249,239,0.1)",
                      }}
                    >
                      {synth.isSpeaking ? "朗读中……" : "朗读回应"}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ---- State: error ---- */}
            {state === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-sm leading-8 mb-6 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.5)" }}>
                  {recognition.error || "无法访问麦克风，你仍然可以使用文字和牌面聊聊。"}
                </p>
                <div className="flex flex-col items-center gap-2.5">
                  <button
                    onClick={handleRetryMic}
                    className="text-[0.68rem] tracking-[0.1em] px-6 py-2.5 rounded-full transition-all duration-300"
                    style={{
                      fontFamily: "Cinzel, serif",
                      background: "rgba(199,165,111,0.15)",
                      color: "#C7A56F",
                      border: "1px solid rgba(199,165,111,0.3)",
                    }}
                  >
                    重试
                  </button>
                  <button
                    onClick={onClose}
                    className="text-[0.6rem] tracking-[0.08em] opacity-50 hover:opacity-80 transition-opacity"
                    style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.5)" }}
                  >
                    返回文字输入
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
