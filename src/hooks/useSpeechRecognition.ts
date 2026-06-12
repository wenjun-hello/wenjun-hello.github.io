"use client";

import { useState, useRef, useCallback } from "react";

export type SpeechRecognitionStatus = "idle" | "listening" | "error";

const LOG = (msg: string) => console.log("[VoiceRecognition]", msg);

export function useSpeechRecognition() {
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notSupported, setNotSupported] = useState(false);

  const onResultRef = useRef<((text: string) => void) | null>(null);
  const recRef = useRef<any>(null);
  const listeningRef = useRef(false);

  const onResult = useCallback((fn: ((text: string) => void) | null) => {
    onResultRef.current = fn;
  }, []);

  const start = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    LOG("start called, SR=" + (SR ? "supported" : "unsupported"));

    if (!SR) {
      setNotSupported(true);
      setError("当前浏览器暂不支持语音识别，请使用文字追问。");
      setStatus("error");
      return;
    }

    // Clean up any stale instance before creating a new one
    if (recRef.current) {
      try { recRef.current.abort(); } catch (_) {}
      recRef.current = null;
    }

    const rec = new SR();
    rec.lang = "zh-CN";
    rec.continuous = false;
    rec.interimResults = true;

    let finalTranscript = "";

    rec.onstart = () => {
      LOG("recognition started — microphone should be active");
    };

    rec.onaudiostart = () => {
      LOG("audio capturing — sound detected");
    };

    rec.onspeechstart = () => {
      LOG("speech detected");
    };

    rec.onresult = (event: any) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalTranscript += r[0].transcript;
          LOG("final result: " + r[0].transcript);
        } else {
          interimText += r[0].transcript;
        }
      }
      setInterim(interimText);
      if (finalTranscript) {
        LOG("calling onResult callback with: " + finalTranscript);
        onResultRef.current?.(finalTranscript);
      }
    };

    rec.onerror = (event: any) => {
      LOG("error: " + event.error);
      if (!listeningRef.current) {
        LOG("error ignored — not listening");
        return;
      }
      listeningRef.current = false;
      if (event.error === "not-allowed") {
        setError("无法访问麦克风，你仍然可以使用文字追问。");
      } else if (event.error !== "aborted") {
        setError("没有听清楚，你可以再试一次，或直接输入文字。");
      }
      setStatus("error");
    };

    rec.onend = () => {
      LOG("recognition ended, hadTranscript=" + !!finalTranscript + ", wasListening=" + listeningRef.current);
      if (listeningRef.current) {
        listeningRef.current = false;
        if (!finalTranscript) {
          setError("没有听清楚，你可以再试一次，或直接输入文字。");
          setStatus("error");
        }
      }
      recRef.current = null;
    };

    recRef.current = rec;
    listeningRef.current = true;
    setStatus("listening");
    setInterim("");
    setError(null);

    LOG("calling rec.start()");
    rec.start();
  }, []);

  const stop = useCallback((reason?: string) => {
    LOG("stop called" + (reason ? ` (reason: ${reason})` : ""));
    listeningRef.current = false;
    if (recRef.current) {
      try { recRef.current.abort(); } catch (_) {}
      recRef.current = null;
    }
    setStatus("idle");
    setInterim("");
  }, []);

  const reset = useCallback(() => {
    LOG("reset called");
    setStatus("idle");
    setError(null);
    setInterim("");
    setNotSupported(false);
  }, []);

  return { status, interim, error, notSupported, start, stop, reset, onResult };
}
