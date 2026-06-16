import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashPreviewProps {
  onFinish: () => void;
  key?: string;
}

export default function SplashPreview({ onFinish }: SplashPreviewProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; color: string; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate subtle, premium, high-fidelity floating CMYK print dots & paper sheet particles
    const colors = [
      '#FF6A00', // PrintBazaar Brand Orange
      '#00E5FF', // Cyan
      '#FF007F', // Magenta
      '#FFD600', // Yellow
      '#1A1A1A', // Dark Charcoal
    ];

    const generated = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: 10 + Math.random() * 80, // keep within safe bounds
      y: 20 + Math.random() * 60,
      size: Math.random() * 5 + 3,
      color: colors[i % colors.length],
      delay: 1.0 + Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
    }));
    setParticles(generated);

    // Precise timed trigger matching the specified Android animation timeline
    // 0ms - 500ms: Background & glow appear
    // 500ms - 1200ms: Logo scales 80% to 100% and fades in
    // 1200ms - 1800ms: Thin progress line animates, particles appear
    // 1800ms - 2200ms: Brand tagline fades in
    // 2200ms - 2500ms: Logo gently lifts, segue transitions seamlessly
    const fallbackTimer = setTimeout(() => {
      onFinish();
    }, 2600); // 2.5s with a tiny 100ms grace period for ultimate smooth egress

    return () => clearTimeout(fallbackTimer);
  }, [onFinish]);

  return (
    <motion.div 
      className="fixed inset-0 bg-[#FFFFFF] z-[9999] flex flex-col items-center justify-between py-12 px-6 overflow-hidden select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        y: -30,
        scale: 0.98,
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } 
      }}
    >
      {/* Soft, premium radial brand orange glow in center (0 - 500ms fade-in) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, rgba(255, 106, 0, 0.04) 0%, rgba(255, 255, 255, 0) 65%)'
        }}
      />

      {/* Subtle background paper texture or layout lines for high-end print look */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(#1A1A1A 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Spacer to push content to middle */}
      <div className="flex-1" />

      {/* Central Brand Frame Wrapper */}
      <div className="relative flex flex-col items-center justify-center text-center">
        
        {/* Floating print dot/paper particles (Subtly appearing between 1200ms - 1800ms) */}
        <div className="absolute inset-0 w-[320px] h-[320px] -translate-x-12 -translate-y-20 pointer-events-none overflow-visible">
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 2px 6px ${p.color}33`,
                }}
                initial={{ opacity: 0, scale: 0, y: 15 }}
                animate={{ 
                  opacity: [0, 0.6, 0.6, 0], 
                  scale: [0.5, 1, 1.2, 0.8], 
                  y: [15, -40],
                  x: [0, Math.sin(p.id) * 15]
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  times: [0, 0.2, 0.8, 1],
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Brand Logo & Text Group */}
        <motion.div
          className="relative flex flex-col items-center justify-center"
          // Timeline 2200-2500ms: Logo gently lifts upward
          animate={{
            y: [0, 0, -22],
            transition: {
              times: [0, 0.88, 1],
              duration: 2.5,
              ease: [0.25, 1, 0.5, 1]
            }
          }}
        >
          {/* Vector Insignia (CMYK precision register mark with customized PB ligature) */}
          <motion.div
            // Timeline 500-1200ms: Scales from 80% to 100% with ease-out, slight fade in
            initial={{ scale: 0.78, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.45,
              duration: 0.75,
              ease: [0.16, 1, 0.3, 1] // premium bezier curve
            }}
            className="relative w-24 h-24 mb-6 flex items-center justify-center"
          >
            {/* outer offset mechanical press calibration crosshair graphic */}
            <motion.div 
              className="absolute inset-0 border border-dashed border-[#FF6A00]/25 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Outer brand circle shadow frame */}
            <div className="absolute inset-2 bg-gradient-to-[#1A1A1A] from-[#2d2d2d] to-[#121212] rounded-3xl shadow-[0_16px_36px_rgba(26,26,26,0.18)]" />

            {/* Glowing neon orange target dots inside */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FF6A00]" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FF007F]" />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#FFD600]" />

            {/* Elegant vector paper stack with embedded printer head cutouts */}
            <svg 
              className="relative w-11 h-11 text-white filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {/* Layer 1 back paper sheet */}
              <path d="M4 18H18" stroke="#FF6A00" strokeWidth="1.5" />
              {/* Layer 2 primary offset machine bed */}
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H18c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2z" />
              {/* Live paper output strip */}
              <rect x="9" y="14" width="6" height="4" fill="#FF6A00" stroke="#FF6A00" strokeWidth="1.2" />
            </svg>
          </motion.div>

          {/* PRINTBAZAAR Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6, ease: "easeOut" }}
            className="text-3xl font-black tracking-[0.14em] text-[#1A1A1A] font-sans uppercase flex items-center justify-center gap-0.5"
          >
            PRINT<span className="text-[#FF6A00]">BAZAAR</span>
          </motion.h1>

          {/* Expert brand subtitle ("Powered by AI Printing Technology") */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="text-[10px] text-[#1A1A1A] font-mono uppercase tracking-[0.2em] font-extrabold mt-2.5"
          >
            Powered by AI Printing Technology
          </motion.p>

          {/* Live Tagline (Fading in between 1800ms - 2200ms) */}
          <div className="h-6 mt-6 overflow-hidden">
            <AnimatePresence>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 1.75, // perfectly matches the 1800ms mark
                  duration: 0.55, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="text-xs font-bold font-sans text-zinc-500 tracking-[0.28em] uppercase whitespace-nowrap bg-zinc-50 border border-zinc-100 rounded-full px-5 py-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              >
                Print • Design • Deliver
              </motion.p>
            </AnimatePresence>
          </div>

        </motion.div>
      </div>

      {/* Lower loading progress experience */}
      <div className="w-full max-w-[220px] flex flex-col items-center gap-3">
        {/* Progress Line Track (Animates from left-to-right between 1200ms - 1800ms) */}
        <div className="relative w-full h-[3px] bg-zinc-100 rounded-full overflow-hidden shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]">
          <motion.div
            initial={{ left: "-100%", width: "100%" }}
            animate={{ left: "100%" }}
            transition={{ 
              delay: 1.15, // triggered exactly around 1200ms
              duration: 1.1, // sweeps smoothly ending near 2200ms
              ease: "easeInOut" 
            }}
            className="absolute top-0 bottom-0 bg-[#FF6A00] rounded-full shadow-[0_0_8px_rgba(255,106,0,0.5)]"
          />
        </div>
        
        {/* Subtle, reassuring status caption */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          className="text-[9px] text-zinc-450 font-mono tracking-widest font-bold uppercase"
        >
          Initializing Digital Press...
        </motion.span>
      </div>
    </motion.div>
  );
}
