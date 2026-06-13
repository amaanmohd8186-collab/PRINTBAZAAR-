import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashPreviewProps {
  onFinish: () => void;
  key?: string;
}

export default function SplashPreview({ onFinish }: SplashPreviewProps) {
  const [showSkip, setShowSkip] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate organic 3D floating particles
    const generated = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1.2,
      delay: Math.random() * 2,
      duration: Math.random() * 4 + 3.5,
    }));
    setParticles(generated);

    // Show skip after 2 seconds
    const skipTimer = setTimeout(() => setShowSkip(true), 2000);

    // Auto finish after 4.5 seconds
    const finishTimer = setTimeout(() => onFinish(), 4500);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  const logoLetters = "PRINTBAZAAR AI".split("");

  return (
    <div className="fixed inset-0 bg-[#070402] z-9999 flex flex-col items-center justify-center overflow-hidden select-none pointer-events-auto">
      {/* Golden cinematic ambient light glow in center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,100,0,0.18)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
      
      {/* 3D Grid ground perspective effect */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/2 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,100,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,100,0,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          perspective: '500px',
          transform: 'rotateX(60deg) scale(2.0) translateY(-60px)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
        }}
      />

      {/* Skipping rail */}
      <AnimatePresence>
        {showSkip && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={onFinish}
            className="absolute top-10 right-10 z-1002 px-5 py-2.5 bg-white/5 border border-white/10 backdrop-blur-md rounded-full text-zinc-300 text-xs font-mono font-bold tracking-widest uppercase hover:bg-white/15 hover:text-white transition duration-200 cursor-pointer flex items-center gap-2"
          >
            <span>Skip Intro</span>
            <span className="text-[10px] text-zinc-550 font-normal">✕</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Star Dust Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-amber-400 rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              boxShadow: '0 0 10px rgba(251, 191, 36, 0.6)',
            }}
            animate={{
              y: [0, -120, 0],
              x: [0, Math.sin(p.id) * 40, 0],
              opacity: [0, 0.8, 0],
              scale: [1, 1.5, 0.8],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Cinematic Logo assembly */}
      <div className="relative flex flex-col items-center gap-4 z-50">
        {/* Dynamic Glowing Logo Icon above text */}
        <motion.div 
          initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
          animate={{ scale: 1.0, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-24 h-24 bg-[#FF4D00] text-black font-black text-3xl flex items-center justify-center rounded-[28px] shadow-[0_0_50px_rgba(255,77,0,0.5)] border border-amber-400/30"
        >
          {/* Internal rotating light ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-1.5 border border-dashed border-amber-300/40 rounded-[22px]"
          />
          <span className="font-sans font-black tracking-tighter">PB</span>
        </motion.div>

        {/* Cinematic logo lettering assembly */}
        <div className="flex gap-1 overflow-hidden h-14 mt-4">
          {logoLetters.map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 1.2,
                delay: 0.5 + index * 0.08,
                ease: [0.16, 1, 0.3, 1]
              }}
              className={`text-3xl md:text-5xl font-black tracking-tight uppercase ${
                char === "A" || char === "I" ? "text-[#FF4D00] drop-shadow-[0_0_20px_rgba(255,77,0,0.6)]" : "text-[#FFFBF2]"
              }`}
              style={{
                textShadow: char !== " " ? '0px 0px 30px rgba(255,255,255,0.1)' : 'none',
                marginRight: char === " " ? '12px' : '0px'
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Subtitles fading in after logo is assembled */}
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.1em" }}
          animate={{ opacity: 0.70, letterSpacing: "0.22em" }}
          transition={{ duration: 1.5, delay: 1.8 }}
          className="text-[10px] text-amber-400 font-mono font-semibold tracking-widest uppercase mt-2 text-center"
        >
          HIGH-FIDELITY AUTOMATED PRINTING SERVICE
        </motion.p>
      </div>

      {/* Progress ticker at extreme bottom */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 140 }}
          transition={{ duration: 4.2, ease: "linear" }}
          className="h-[2px] bg-gradient-to-r from-transparent via-[#FF4D00] to-transparent"
        />
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-[9px] text-[#FF4D00] font-mono tracking-widest font-extrabold uppercase mt-1 whitespace-nowrap"
        >
          INITIALIZING VECTOR ENGINES...
        </motion.span>
      </div>
    </div>
  );
}
