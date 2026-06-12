"use client";

import { useState, useRef, useCallback } from "react";

export function useSpeechSynthesis() {
  const [status, setStatus] = useState<"idle" | "speaking">("idle");
  const cancelledRef = useRef(false);

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    cancelledRef.current = false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onend = () => {
      if (!cancelledRef.current) {
        setStatus("idle");
      }
    };

    utterance.onerror = () => {
      setStatus("idle");
    };

    setStatus("speaking");
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, []);

  return { status, speak, stop, isSpeaking: status === "speaking" };
}
