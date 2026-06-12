"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TarotCard } from "@/data/tarotCards";
import ArcanaNodeGraphBackground from "./ArcanaNodeGraphBackground";
import type { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

type RoomState = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "readyForNext" | "error";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "local";
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  card: TarotCard;
  onSendTranscript: (text: string) => void;
  recognition: ReturnType<typeof useSpeechRecognition>;
  synth: ReturnType<typeof useSpeechSynthesis>;
  loading: boolean;
  messages: ChatMessage[];
};

export default function ArcanaVoiceRoom({
  isOpen, onClose, card,
  onSendTranscript, recognition, synth,
  loading, messages,
}: Props) {
  const [roomState, setRoomState] = useState<RoomState>("idle");
  const [transcript, setTranscript] = useState("");
  const cancelRef = useRef(false);

  const recognitionRef = useRef(recognition);
  recognitionRef.current = recognition;
  const synthRef = useRef(synth);
  synthRef.current = synth;

  const graphState = roomState === "listening" ? "listening" : roomState === "thinking" ? "thinking" : "ready";

  // Wire recognition result
  recognition.onResult((text: string) => {
    setTranscript(text);
    setRoomState("transcribing");
    recognition.stop("transcript received");
  });

  // Sync recognition errors
  useEffect(() => {
    if (recognition.status === "error") setRoomState("error");
  }, [recognition.status]);

  // Auto-send after a short delay in transcribing state
  useEffect(() => {
    if (roomState !== "transcribing") return;
    cancelRef.current = false;
    const timer = setTimeout(() => {
      if (!cancelRef.current) {
        setRoomState("thinking");
        onSendTranscript(transcript);
      }
    }, 1200);
    return () => { clearTimeout(timer); };
  }, [roomState, transcript, onSendTranscript]);

  // Detect AI response: loading went true→false while in thinking state
  const wasLoadingRef = useRef(false);
  useEffect(() => {
    if (roomState === "thinking") wasLoadingRef.current = true;
  }, [roomState]);

  useEffect(() => {
    if (!loading && wasLoadingRef.current && roomState === "thinking") {
      wasLoadingRef.current = false;
      // Auto-speak the latest assistant message
      const assistantMsgs = messages.filter((m) => m.role === "assistant");
      if (assistantMsgs.length > 0) {
        const latest = assistantMsgs[assistantMsgs.length - 1];
        setRoomState("speaking");
        synth.speak(latest.content);
      } else {
        setRoomState("readyForNext");
      }
    }
  }, [loading, roomState, messages, synth]);

  // Speech finished → readyForNext
  useEffect(() => {
    if (!synth.isSpeaking && roomState === "speaking") {
      setRoomState("readyForNext");
    }
  }, [synth.isSpeaking, roomState]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setRoomState("idle");
      setTranscript("");
      wasLoadingRef.current = false;
      cancelRef.current = false;
      recognition.stop("room opened");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current.stop("room unmount");
      synthRef.current.stop();
    };
  }, []);

  // Handlers
  const handleStartSpeaking = () => {
    setTranscript("");
    setRoomState("listening");
    recognition.start();
  };

  const handleStopSpeaking = () => {
    recognition.stop("user stopped speaking");
    // If we have interim results, we might lose them. Go to idle.
    setRoomState("idle");
  };

  const handleCancelSend = () => {
    cancelRef.current = true;
    setRoomState("idle");
    setTranscript("");
  };

  const handleContinue = () => {
    handleStartSpeaking();
  };

  const handleStopReading = () => {
    synth.stop();
    setRoomState("readyForNext");
  };

  const handleRetry = () => {
    recognition.stop("retry");
    setRoomState("listening");
    recognition.start();
  };

  const handleLeave = () => {
    recognition.stop("user left room");
    synth.stop();
    onClose();
  };

  // Recent messages for subtitle display
  const recentTurns = messages.slice(-6);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col"
          style={{
            background: "rgba(15,12,9,0.92)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Node graph background */}
          <ArcanaNodeGraphBackground state={graphState} className="absolute inset-0" />

          {/* Top bar */}
          <div className="relative z-10 pt-8 pb-2 px-6 text-center">
            <h2 className="text-lg tracking-[0.15em]" style={{ fontFamily: "Cinzel, serif", color: "#C7A56F" }}>
              牌面语音房
            </h2>
            <p className="text-[0.6rem] tracking-[0.06em] mt-1 italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.35)" }}>
              你正在和这次抽到的牌面进行语音对话。
            </p>
          </div>

          {/* Center — card + ambiance */}
          <div className="relative z-10 flex-1 flex items-center justify-center">
            {/* Floating card */}
            <motion.div
              className="absolute"
              style={{ width: 110 }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <img
                src={card.webpImage || card.image}
                alt={card.chineseName}
                className="w-full h-auto rounded-sm opacity-40"
                style={{ filter: "brightness(1.1)" }}
              />
            </motion.div>

            {/* Center glow */}
            <motion.div
              className="rounded-full"
              style={{
                width: 180,
                height: 180,
                background: "radial-gradient(circle, rgba(217,195,154,0.1) 0%, transparent 70%)",
              }}
              animate={{
                scale: roomState === "listening" || roomState === "speaking" ? [1, 1.12, 1] : 1,
                opacity: roomState === "listening" || roomState === "speaking" ? [0.6, 0.9, 0.6] : 0.3,
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Conversation subtitles */}
          <div className="relative z-10 px-6 pb-4 space-y-2 max-w-lg mx-auto w-full">
            <AnimatePresence>
              {recentTurns.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p className="text-[0.62rem] leading-5" style={{ fontFamily: "Cormorant Garamond, serif" }}>
                    <span style={{ color: "rgba(199,165,111,0.55)" }}>
                      {msg.role === "user" ? "你" : "牌面的回应"}
                    </span>
                    <span style={{ color: "rgba(255,249,239,0.55)", fontStyle: "italic" }}>
                      ：{msg.content.length > 60 ? msg.content.slice(0, 60) + "……" : msg.content}
                    </span>
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Transcribing preview */}
            {roomState === "transcribing" && transcript && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <p className="text-[0.65rem] italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.7)" }}>
                  「{transcript}」
                </p>
              </motion.div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="relative z-10 pb-10 px-6">
            <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
              {/* ---- State: idle ---- */}
              {roomState === "idle" && (
                <>
                  <p className="text-[0.65rem] italic text-center" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.35)" }}>
                    点击“开始说话”，向牌面提出你的追问。
                  </p>
                  <div className="flex gap-3">
                    <button onClick={handleStartSpeaking}
                      className="text-[0.72rem] tracking-[0.1em] px-7 py-3 rounded-full transition-all duration-300"
                      style={{ fontFamily: "Cinzel, serif", background: "#C7A56F", color: "#FFF9EF", border: "1px solid rgba(199,165,111,0.5)", boxShadow: "0 8px 32px rgba(199,165,111,0.15)" }}>
                      开始说话
                    </button>
                    <button onClick={handleLeave}
                      className="text-[0.6rem] tracking-[0.08em] px-4 py-3 rounded-full transition-all duration-300 opacity-45 hover:opacity-70"
                      style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.5)", border: "1px solid rgba(255,249,239,0.12)" }}>
                      结束语音房
                    </button>
                  </div>
                </>
              )}

              {/* ---- State: listening ---- */}
              {roomState === "listening" && (
                <>
                  <p className="text-[0.72rem] italic text-center" style={{ fontFamily: "Cormorant Garamond, serif", color: "#C7A56F" }}>
                    牌面正在听你说……
                  </p>
                  {recognition.interim && (
                    <p className="text-[0.65rem] italic opacity-50" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.4)" }}>
                      {recognition.interim}
                    </p>
                  )}
                  <div className="flex justify-center gap-2 mb-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="rounded-full" style={{ width: 6, height: 6, background: "#C7A56F" }}
                        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.6, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />
                    ))}
                  </div>
                  <button onClick={handleStopSpeaking}
                    className="text-[0.62rem] tracking-[0.08em] px-5 py-2 rounded-full transition-all duration-300"
                    style={{ fontFamily: "Cinzel, serif", background: "rgba(255,249,239,0.06)", color: "rgba(255,249,239,0.45)", border: "1px solid rgba(255,249,239,0.1)" }}>
                    停止说话
                  </button>
                </>
              )}

              {/* ---- State: transcribing ---- */}
              {roomState === "transcribing" && (
                <>
                  <p className="text-[0.65rem] italic text-center" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.4)" }}>
                    正在整理你的声音……
                  </p>
                  <button onClick={handleCancelSend}
                    className="text-[0.6rem] tracking-[0.08em] px-4 py-1.5 rounded-full transition-all duration-300 opacity-45 hover:opacity-70"
                    style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.4)", border: "1px solid rgba(255,249,239,0.1)" }}>
                    取消发送
                  </button>
                </>
              )}

              {/* ---- State: thinking ---- */}
              {roomState === "thinking" && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[0.65rem] italic" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.4)" }}>
                    牌面正在回应……
                  </p>
                  <motion.div className="w-5 h-5 rounded-full"
                    style={{ border: "2px solid rgba(199,165,111,0.25)", borderTopColor: "#C7A56F" }}
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                </div>
              )}

              {/* ---- State: speaking ---- */}
              {roomState === "speaking" && (
                <>
                  <p className="text-[0.72rem] italic text-center" style={{ fontFamily: "Cormorant Garamond, serif", color: "#C7A56F" }}>
                    牌面正在回应你……
                  </p>
                  <button onClick={handleStopReading}
                    className="text-[0.62rem] tracking-[0.08em] px-5 py-2 rounded-full transition-all duration-300"
                    style={{ fontFamily: "Cinzel, serif", background: "rgba(255,249,239,0.06)", color: "rgba(255,249,239,0.45)", border: "1px solid rgba(255,249,239,0.1)" }}>
                    停止朗读
                  </button>
                </>
              )}

              {/* ---- State: readyForNext ---- */}
              {roomState === "readyForNext" && (
                <>
                  <p className="text-[0.65rem] italic text-center" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.35)" }}>
                    你可以继续说下一句，或者结束语音房。
                  </p>
                  <div className="flex gap-3">
                    <button onClick={handleContinue}
                      className="text-[0.68rem] tracking-[0.1em] px-6 py-2.5 rounded-full transition-all duration-300"
                      style={{ fontFamily: "Cinzel, serif", background: "#C7A56F", color: "#FFF9EF", border: "1px solid rgba(199,165,111,0.5)", boxShadow: "0 6px 24px rgba(199,165,111,0.12)" }}>
                      继续说话
                    </button>
                    <button onClick={handleLeave}
                      className="text-[0.6rem] tracking-[0.08em] px-4 py-2.5 rounded-full transition-all duration-300 opacity-45 hover:opacity-70"
                      style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.5)", border: "1px solid rgba(255,249,239,0.1)" }}>
                      结束语音房
                    </button>
                  </div>
                </>
              )}

              {/* ---- State: error ---- */}
              {roomState === "error" && (
                <>
                  <p className="text-[0.68rem] italic text-center" style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.5)" }}>
                    {recognition.error || "没有听清楚，你可以再说一次。"}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={handleRetry}
                      className="text-[0.65rem] tracking-[0.08em] px-5 py-2 rounded-full transition-all duration-300"
                      style={{ fontFamily: "Cinzel, serif", background: "rgba(199,165,111,0.15)", color: "#C7A56F", border: "1px solid rgba(199,165,111,0.3)" }}>
                      重试
                    </button>
                    <button onClick={handleLeave}
                      className="text-[0.6rem] tracking-[0.08em] px-4 py-2 rounded-full transition-all duration-300 opacity-45 hover:opacity-70"
                      style={{ fontFamily: "Cormorant Garamond, serif", color: "rgba(255,249,239,0.5)", border: "1px solid rgba(255,249,239,0.1)" }}>
                      结束语音房
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
