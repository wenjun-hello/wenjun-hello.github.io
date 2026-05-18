"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import DynamicBallroomBackground from "@/components/DynamicBallroomBackground";

/* ==============================
   GOLD PARTICLE CANVAS
   ============================== */
function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    interface Particle { x: number; y: number; vx: number; vy: number; size: number; opacity: number; life: number; maxLife: number; }
    const particles: Particle[] = [];
    const maxParticles = 40;
    function createParticle(): Particle {
      return { x: Math.random() * w, y: h + 20, vx: (Math.random() - 0.5) * 0.15, vy: -(0.12 + Math.random() * 0.28), size: 0.2 + Math.random() * 1.2, opacity: 0.10 + Math.random() * 0.3, life: 0, maxLife: 300 + Math.random() * 500 };
    }
    for (let i = 0; i < maxParticles; i++) { const p = createParticle(); p.y = Math.random() * h; p.life = Math.random() * p.maxLife; particles.push(p); }
    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.life++; p.x += p.vx; p.y += p.vy; p.vx += (Math.random() - 0.5) * 0.004;
        if (p.life > p.maxLife || p.y < -30 || p.x < -30 || p.x > w + 30) { particles[i] = createParticle(); continue; }
        const alpha = p.opacity * (1 - p.life / p.maxLife);
        if (p.size > 0.8) { ctx!.fillStyle = `hsla(40, 40%, 70%, ${alpha * 0.15})`; ctx!.beginPath(); ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2); ctx!.fill(); }
        ctx!.fillStyle = `hsla(40, 35%, 65%, ${alpha})`; ctx!.beginPath(); ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx!.fill();
      }
      while (particles.length < maxParticles) particles.push(createParticle());
      requestAnimationFrame(draw);
    }
    const handleResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", handleResize); draw();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => { const cleanup = animate(); return () => { if (cleanup) cleanup(); }; }, [animate]);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} />;
}

/* ==============================
   FLOATING CARD
   ============================== */
function FloatingCard() {
  return (
    <motion.div className="relative" animate={{ y: [0, -8, 3, -4, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
      <motion.div className="absolute -inset-10 rounded-full" animate={{ opacity: [0.10, 0.24, 0.14, 0.10] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "radial-gradient(ellipse at center, rgba(217,195,154,0.30) 0%, transparent 70%)" }} />
      <div className="relative w-[170px] h-[272px] sm:w-[210px] sm:h-[336px] overflow-hidden rounded-[4px]"
        style={{ border: "2px solid rgba(199,165,111,0.35)", boxShadow: "0 0 0 1px rgba(199,165,111,0.10), 0 0 40px rgba(199,165,111,0.08), 0 18px 55px rgba(74,58,42,0.18)" }}>
        <img src="/cards-webp/card-back.webp" alt="塔罗牌背面" loading="eager" decoding="async" className="w-full h-full object-contain" style={{ background: "transparent" }}
          onError={(e) => { e.currentTarget.src = "/cards/card-back.png"; }} />
        <div className="absolute inset-[6px] pointer-events-none" style={{ border: "1px solid rgba(199,165,111,0.12)" }} />
        {["top-2 left-2","top-2 right-2","bottom-2 left-2","bottom-2 right-2"].map((pos,i) => (
          <div key={i} className={`absolute ${pos} w-3 h-3 pointer-events-none`} style={{ borderColor: "rgba(199,165,111,0.22)", borderStyle: "solid", borderWidth: i<2?"1px 0 0 1px":"0 1px 1px 0" }} />
        ))}
      </div>
    </motion.div>
  );
}

/* ==============================
   HERO PAGE — Ballroom Layout
   ============================== */
export default function Home() {
  return (
    <>
      <Navbar />
      <div className="relative min-h-screen overflow-hidden" style={{ background: "transparent" }}>
        <DynamicBallroomBackground primaryImage="/design-assets/ballroom-day.png" secondaryImage="/design-assets/ballroom-night.png" mode="mixed" intensity="strong" />
        <GoldParticles />

        {/* Hero — left text, right card */}
        <div className="relative z-10 max-w-6xl mx-auto min-h-screen flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 sm:px-12 pt-20 pb-12">
          {/* Left text */}
          <motion.div className="flex-1 flex flex-col items-start gap-5 max-w-lg" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base" style={{ color: "rgba(199,165,111,0.55)" }}>✦</span>
              <span className="text-[0.55rem] tracking-[0.3em]" style={{ fontFamily: "Cinzel, serif", color: "rgba(199,165,111,0.5)" }}>ROYAL ARCANA</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl leading-tight tracking-[0.05em]" style={{ fontFamily: "Cinzel, serif", fontWeight: 600, color: "#4A3A2A" }}>
              在一张牌里，<br />重新看见此刻的自己
            </h1>
            <p className="text-sm sm:text-base leading-8 max-w-md" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760", fontStyle: "italic" }}>
              塔罗不替你决定未来，它只是提供一个安静的角度，帮助你整理情绪、理解选择，并找回内在的力量。
            </p>
            <div className="flex items-center gap-4 mt-3">
              <Link href="/reading">
                <motion.button whileHover={{ y: -1 }} className="rounded-full cursor-pointer transition-all duration-300"
                  style={{ border: "1px solid rgba(199,165,111,0.5)", background: "#C7A56F", padding: "0.7rem 2rem", fontFamily: "Cinzel, serif", fontSize: "0.68rem", letterSpacing: "0.18em", color: "#FFF9EF", boxShadow: "0 14px 38px rgba(111,90,62,0.14)" }}>
                  开始抽牌
                </motion.button>
              </Link>
              <Link href="/archive">
                <motion.button whileHover={{ y: -1 }} className="rounded-full cursor-pointer transition-all duration-300"
                  style={{ border: "1px solid rgba(199,165,111,0.32)", background: "rgba(255,249,239,0.7)", padding: "0.7rem 2rem", fontFamily: "Cinzel, serif", fontSize: "0.68rem", letterSpacing: "0.18em", color: "#6F5A3E", boxShadow: "0 8px 26px rgba(111,90,62,0.07)" }}>
                  浏览牌库
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Right card */}
          <motion.div className="flex-shrink-0 relative" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[280px] h-[100px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(217,195,154,0.18)" }} />
            <FloatingCard />
          </motion.div>
        </div>

        {/* Bottom Feature Panel */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-12 pb-20">
          <motion.div className="panel-base p-8 sm:p-12" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {[
                { icon: "◇", title: "安静自我对话", desc: "在纷扰中为自己留一段专属的安静时光" },
                { icon: "✦", title: "更清晰的选择", desc: "梳理内心真实的需求，看见更多可能性" },
                { icon: "❧", title: "理解当下处境", desc: "从新的角度理解情绪，温柔接纳正在发生的一切" },
                { icon: "⊕", title: "找回内在力量", desc: "记得你本就拥有智慧，并值得被温柔对待" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-3">
                  <span className="text-xl" style={{ color: "rgba(199,165,111,0.55)" }}>{item.icon}</span>
                  <h3 className="text-sm tracking-[0.1em]" style={{ fontFamily: "Cinzel, serif", color: "#4A3A2A", fontWeight: 600 }}>{item.title}</h3>
                  <p className="text-xs leading-6" style={{ fontFamily: "Cormorant Garamond, serif", color: "#8A7760" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
