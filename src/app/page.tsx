"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";

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

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; life: number; maxLife: number;
    }

    const particles: Particle[] = [];
    const maxParticles = 50;

    function createParticle(): Particle {
      return {
        x: Math.random() * w, y: h + 20,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(0.15 + Math.random() * 0.35),
        size: 0.3 + Math.random() * 1.8,
        opacity: 0.15 + Math.random() * 0.45,
        life: 0, maxLife: 300 + Math.random() * 500,
      };
    }

    for (let i = 0; i < maxParticles; i++) {
      const p = createParticle();
      p.y = Math.random() * h;
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++; p.x += p.vx; p.y += p.vy;
        p.vx += (Math.random() - 0.5) * 0.005;
        if (p.life > p.maxLife || p.y < -30 || p.x < -30 || p.x > w + 30) {
          particles[i] = createParticle(); continue;
        }
        const alpha = p.opacity * (1 - p.life / p.maxLife);
        if (p.size > 1) {
          ctx!.fillStyle = `hsla(38, 50%, 70%, ${alpha * 0.2})`;
          ctx!.beginPath(); ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2); ctx!.fill();
        }
        ctx!.fillStyle = `hsla(38, 45%, 68%, ${alpha})`;
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx!.fill();
      }
      while (particles.length < maxParticles) particles.push(createParticle());
      requestAnimationFrame(draw);
    }

    const handleResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", handleResize);
    draw();
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
    <motion.div
      className="relative"
      animate={{ y: [0, -10, 3, -5, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute -inset-8 rounded-sm"
        animate={{ opacity: [0.12, 0.28, 0.18, 0.12] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "radial-gradient(ellipse at center, rgba(200,169,107,0.25) 0%, transparent 70%)" }}
      />
      {/* Card image with ornate frame */}
      <div
        className="relative w-[180px] h-[288px] sm:w-[220px] sm:h-[352px] overflow-hidden"
        style={{
          border: "2px solid rgba(200,169,107,0.4)",
          boxShadow: "0 0 0 1px rgba(200,169,107,0.12), 0 0 40px rgba(200,169,107,0.1), 0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <img
          src="/cards/card-back.png"
          alt="Royal Arcana"
          className="w-full h-full object-contain"
          style={{ background: "#0D1424" }}
        />
        {/* Inner border */}
        <div className="absolute inset-[7px] pointer-events-none" style={{ border: "1px solid rgba(200,169,107,0.14)" }} />
        {/* Corner ornaments */}
        {["top-2 left-2","top-2 right-2","bottom-2 left-2","bottom-2 right-2"].map((pos,i) => (
          <div key={i} className={`absolute ${pos} w-3 h-3 pointer-events-none`} style={{ borderColor: "rgba(200,169,107,0.3)", borderStyle: "solid", borderWidth: i<2?"1px 0 0 1px":"0 1px 1px 0" }} />
        ))}
      </div>
    </motion.div>
  );
}

/* ==============================
   HERO PAGE
   ============================== */
export default function Home() {
  return (
    <>
      <Navbar />
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: "#0D1424" }}>
        {/* Stars */}
        <div className="absolute inset-0 bg-stars" />
        {/* Candle glow */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(201,161,91,0.08) 0%, rgba(201,161,91,0.04) 30%, transparent 60%)" }} />
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 200px 60px rgba(0,0,0,0.4)" }} />
        {/* Astrolabe circle behind card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] rounded-full pointer-events-none" style={{ border: "1px solid rgba(200,169,107,0.04)", boxShadow: "inset 0 0 0 1px rgba(200,169,107,0.03)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] sm:w-[540px] sm:h-[540px] rounded-full pointer-events-none" style={{ border: "1px solid rgba(200,169,107,0.03)" }} />

        <GoldParticles />

        {/* Ornament frame */}
        <div className="fixed inset-5 pointer-events-none" style={{ zIndex: 2 }}>
          <div className="absolute inset-0" style={{ border: "1px solid rgba(200,169,107,0.12)", boxShadow: "inset 0 0 0 1px rgba(200,169,107,0.05)" }} />
        </div>
        {["top-3 left-3","top-3 right-3","bottom-3 left-3","bottom-3 right-3"].map((pos,i) => (
          <div key={i} className={`fixed ${pos} pointer-events-none`} style={{ zIndex:3, fontFamily:"Cinzel,serif", fontSize:"20px", color:"rgba(200,169,107,0.3)" }}>❧</div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 pt-16">
          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:1.8, ease:[0.25,0.1,0.25,1], delay:0.3 }}>
            <FloatingCard />
          </motion.div>

          <div className="flex flex-col items-center gap-3">
            <motion.div className="flex items-center gap-3" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:1.2, delay:1 }}>
              <div className="w-10 sm:w-16 h-[1px]" style={{ background:"linear-gradient(90deg,transparent,rgba(200,169,107,0.4),transparent)" }} />
              <span className="text-[8px]" style={{ color:"rgba(200,169,107,0.4)" }}>◇</span>
              <div className="w-10 sm:w-16 h-[1px]" style={{ background:"linear-gradient(90deg,transparent,rgba(200,169,107,0.4),transparent)" }} />
            </motion.div>

            <motion.h1
              className="text-2xl sm:text-4xl md:text-5xl tracking-[0.25em] text-center"
              initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:1.2, delay:1.2, ease:[0.25,0.1,0.25,1] }}
              style={{ fontFamily:"Cinzel,serif", fontWeight:600, color:"#C8A96B", textShadow:"0 0 60px rgba(200,169,107,0.2), 0 0 120px rgba(200,169,107,0.08)" }}
            >
              ROYAL ARCANA
            </motion.h1>

            <motion.p
              className="text-xs sm:text-sm tracking-[0.35em] italic"
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ duration:1, delay:1.6 }}
              style={{ fontFamily:"Cormorant Garamond,serif", color:"rgba(200,169,107,0.55)" }}
            >
              塔罗自我觉察
            </motion.p>

            <motion.p
              className="text-[0.65rem] tracking-[0.15em] text-center max-w-xs mt-1"
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              transition={{ duration:1, delay:1.7 }}
              style={{ fontFamily:"Cormorant Garamond,serif", color:"rgba(184,188,198,0.4)", fontStyle:"italic" }}
            >
              在一张牌里，重新看见此刻的自己。
            </motion.p>

            <motion.div className="flex items-center gap-4 mt-1" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:1, delay:1.8 }}>
              <div className="w-14 sm:w-20 h-[1px]" style={{ background:"linear-gradient(90deg,transparent,rgba(200,169,107,0.25),transparent)" }} />
              <span className="text-[6px] tracking-[0.4em]" style={{ color:"rgba(200,169,107,0.3)" }}>◆</span>
              <div className="w-14 sm:w-20 h-[1px]" style={{ background:"linear-gradient(90deg,transparent,rgba(200,169,107,0.25),transparent)" }} />
            </motion.div>
          </div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-3 mt-2"
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:1.2, delay:2, ease:[0.25,0.1,0.25,1] }}
          >
            <Link href="/reading">
              <motion.button
                className="relative px-8 sm:px-10 py-3 sm:py-4 cursor-pointer group"
                whileHover={{ y: -1 }}
                style={{ background:"transparent", border:"1px solid rgba(200,169,107,0.4)", fontFamily:"Cinzel,serif", fontSize:"0.7rem", letterSpacing:"0.22em", color:"#C8A96B", textTransform:"uppercase" }}
              >
                <span className="absolute inset-[3px] transition-all duration-700" style={{ border:"1px solid rgba(200,169,107,0.1)" }} />
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-1000" style={{ background:"radial-gradient(ellipse at center, rgba(200,169,107,0.06) 0%, transparent 70%)", boxShadow:"0 0 30px rgba(200,169,107,0.1)" }} />
                <span className="relative z-10">开始抽牌</span>
              </motion.button>
            </Link>
            <Link href="/archive">
              <motion.button
                className="relative px-8 sm:px-10 py-3 sm:py-4 cursor-pointer group"
                whileHover={{ y: -1 }}
                style={{ background:"rgba(200,169,107,0.04)", border:"1px solid rgba(200,169,107,0.2)", fontFamily:"Cinzel,serif", fontSize:"0.7rem", letterSpacing:"0.22em", color:"rgba(200,169,107,0.7)", textTransform:"uppercase" }}
              >
                <span className="relative z-10">浏览牌库</span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}
