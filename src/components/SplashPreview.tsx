import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, PenTool, Truck, BadgeCheck, Bot, CloudUpload, Wand2, Layout, Award } from 'lucide-react';

interface SplashPreviewProps {
  onFinish: () => void;
  isAppReady: boolean;
  startupLogs: string[];
}

// 3D Floating Card Component
const FloatingCard = ({ delay, image, title, subtitle, className, style }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0, z: -500 }}
    animate={{ 
      opacity: 1, 
      scale: 1, 
      z: 0,
      y: [0, -15, 0],
      rotateX: [0, 5, 0],
      rotateY: [0, 10, 0]
    }}
    transition={{ 
      opacity: { duration: 0.8, delay },
      scale: { duration: 0.8, delay, type: "spring", bounce: 0.4 },
      y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.8 },
      rotateX: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: delay + 0.8 },
      rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: delay + 0.8 }
    }}
    className={`absolute hidden md:flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-black/60 shadow-[0_0_30px_rgba(255,106,0,0.2)] backdrop-blur-md overflow-hidden ${className}`}
    style={{ transformStyle: 'preserve-3d', ...style }}
  >
    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />
    <div className="text-[#FFD700] mb-1 font-serif text-lg tracking-wider drop-shadow-md">{title}</div>
    <div className="text-white/60 text-[8px] uppercase tracking-widest">{subtitle}</div>
  </motion.div>
);

// Holographic Icon Component
const HoloIcon = ({ Icon, top, left, delay, color = "#00F0FF" }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0.3, 0.8, 0.3], 
      scale: [0.9, 1.1, 0.9],
      y: [0, -10, 0]
    }}
    transition={{
      opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay },
      scale: { duration: 3, repeat: Infinity, ease: "easeInOut", delay },
      y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }
    }}
    className="absolute hidden lg:flex items-center justify-center p-3 rounded-xl border border-white/10 backdrop-blur-sm"
    style={{ top, left, boxShadow: `0 0 20px ${color}40`, borderColor: `${color}40` }}
  >
    <Icon className="w-6 h-6" style={{ color, filter: `drop-shadow(0 0 8px ${color})` }} />
  </motion.div>
);

export default function SplashPreview({ onFinish, isAppReady, startupLogs }: SplashPreviewProps) {
  const [phase, setPhase] = useState<number>(0);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    // Failsafe if not ready within 5s
    let retryTimer: ReturnType<typeof setTimeout>;
    
    if (!isAppReady) {
      retryTimer = setTimeout(() => {
        setShowRetry(true);
      }, 5000);
    } else {
      setShowRetry(false);
    }
    
    return () => clearTimeout(retryTimer);
  }, [isAppReady]);

  useEffect(() => {
    if (isAppReady) {
      const t = setTimeout(() => {
        setPhase(2); 
        setTimeout(onFinish, 1200);
      }, 2000); // Wait 2s to show off the premium 3D scene before exiting
      return () => clearTimeout(t);
    }
  }, [isAppReady, onFinish]);

  // Prevent early unmount / flashes
  return (
    <motion.div 
      className="fixed inset-0 z-[10000] bg-[#020202] flex flex-col items-center justify-center overflow-hidden touch-none select-none perspective-[1200px] min-h-screen-dynamic"
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.1,
        filter: "blur(10px) brightness(1.5)",
        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
      }}
    >
      {/* Dynamic Background FX */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Core glow */}
        <div className="absolute w-[150vw] md:w-[100vw] aspect-square bg-[#FF3D00] rounded-full blur-[150px] opacity-[0.06] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
        <div className="absolute w-[100vw] md:w-[60vw] aspect-square bg-[#FFD700] rounded-full blur-[120px] opacity-[0.05] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
        
        {/* Particle stars (simulated with CSS grid/radial gradients for performance) */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_100%)] bg-[length:20px_20px]" />
      </div>

      {/* 3D Scene Container */}
      <motion.div 
        className="relative z-10 w-full h-full flex flex-col items-center justify-center transform-style-3d"
        initial={{ rotateX: 20, rotateY: -10, translateZ: -200 }}
        animate={{ rotateX: 0, rotateY: 0, translateZ: 0 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      >
        
        {/* Neon Energy Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full border-[2px] border-[#FF6A00]/50 shadow-[0_0_50px_#FF6A00,inset_0_0_50px_#FF6A00] opacity-80 pointer-events-none">
          <motion.div 
            className="absolute inset-[-4px] rounded-full border-[8px] border-transparent border-t-[#FFD700] border-r-[#FFD700] opacity-60"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Floating Holographic Tech Icons */}
        <HoloIcon Icon={Bot} top="20%" left="25%" delay={0} color="#00F0FF" />
        <HoloIcon Icon={CloudUpload} top="25%" left="70%" delay={0.3} color="#FFD700" />
        <HoloIcon Icon={Wand2} top="65%" left="20%" delay={0.6} color="#FF00F5" />
        <HoloIcon Icon={Layout} top="60%" left="75%" delay={0.9} color="#00FF3C" />

        {/* Floating Product Cards (Desktop only for performance) */}
        <FloatingCard delay={0.2} title="ROYAL" subtitle="BUSINESS LUXURY" className="w-32 h-20 -top-[10%] -left-[10%] md:-top-[5%] md:-left-[20%] -rotate-12 bg-gradient-to-br from-black to-[#2a2010] border-[#FFD700]/30" />
        <FloatingCard delay={0.4} title="Wedding" subtitle="INVITATION" className="w-40 h-24 top-[-25%] rotate-3 bg-gradient-to-br from-[#1a1515] to-[#0a0a0a] border-[#c0a060]/30" />
        <FloatingCard delay={0.6} title="COMPANY" subtitle="SLOGAN HERE" className="w-32 h-24 -top-[10%] -right-[10%] md:-top-[5%] md:-right-[20%] rotate-12 bg-gradient-to-bl from-[#fff2] to-black border-white/20" />
        <FloatingCard delay={0.5} title="BIG SALE" subtitle="50% OFF" className="w-28 h-40 top-[20%] -left-[20%] md:-left-[35%] -rotate-6 bg-gradient-to-br from-[#4a1060] to-[#E53935] border-white/20" />
        <FloatingCard delay={0.7} title="BRAND" subtitle="LOGO" className="w-28 h-40 top-[20%] -right-[20%] md:-right-[35%] rotate-6 bg-gradient-to-bl from-black to-[#302000] border-[#FFD700]/30" />
        <FloatingCard delay={0.3} title="Save Date" subtitle="FLORAL" className="w-32 h-32 top-[60%] -left-[10%] md:-left-[25%] -rotate-12 bg-gradient-to-br from-black to-[#2a1010] border-rose-500/30" />
        <FloatingCard delay={0.8} title="PREMIUM" subtitle="PACKAGING" className="w-32 h-40 top-[60%] -right-[10%] md:-right-[25%] rotate-12 bg-gradient-to-b from-[#2a2520] to-black border-[#FFd700]/20" />

        {/* Central Logo Group */}
        <div className="relative flex flex-col items-center justify-center translate-y-[-10vh]">
          {/* Printer Icon above */}
          <motion.div 
            layoutId="app-logo-icon-morph"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, type: "spring" }}
            className="mb-2 z-20 flex items-center justify-center p-3 rounded-2xl bg-black/50 backdrop-blur-sm border border-[#FF6A00]/30"
          >
             <Printer className="w-16 h-16 md:w-20 md:h-20 text-[#FF6A00] drop-shadow-[0_0_20px_#FF6A00]" />
          </motion.div>

          {/* Massive PB Logo */}
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="flex items-center justify-center z-20 mb-4"
          >
            <span className="text-6xl md:text-[140px] font-black leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              P
            </span>
            <span className="text-6xl md:text-[140px] font-black leading-none text-[#FF6A00] drop-shadow-[0_0_30px_rgba(255,106,0,0.5)]">
              B
            </span>
          </motion.div>

          {/* Branding Typography */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-center z-20"
          >
            <motion.div layoutId="app-logo-text-morph">
              <h1 className="text-3xl md:text-5xl font-black tracking-[0.1em] uppercase text-white drop-shadow-xl flex items-center justify-center mb-2">
                PRINT<span className="text-[#FF6A00]">BAZAAR</span>
              </h1>
            </motion.div>
            <p className="mt-1 text-[12px] md:text-sm font-medium tracking-[0.2em] text-white opacity-90 uppercase flex items-center justify-center gap-2">
              Create <span className="text-[#FF6A00]">•</span> Print <span className="text-[#FF6A00]">•</span> Impress
            </p>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-[8px] md:text-[10px] font-mono tracking-widest text-white/50 uppercase">
              <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#FFD700]/50" />
              Powered by <span className="text-[#FFD700] font-bold">AI</span> Printing Technology
              <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#FFD700]/50" />
            </div>
          </motion.div>
        </div>

        {/* 3D Floor Platform (Holographic) */}
        <motion.div 
           initial={{ rotateX: 90, opacity: 0 }}
           animate={{ rotateX: 75, opacity: 1 }}
           transition={{ duration: 1.5, delay: 0.4 }}
           className="absolute bottom-[20%] md:bottom-[15%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full border-[2px] border-[#FF6A00]/30 z-0 pointer-events-none"
           style={{ transformStyle: 'preserve-3d', boxShadow: 'inset 0 0 100px rgba(255,106,0,0.2), 0 0 100px rgba(255,106,0,0.2)' }}
        >
          <div className="absolute inset-4 rounded-full border-[1px] border-[#FFD700]/20" />
          <div className="absolute inset-12 rounded-full border-[1px] border-[#FFD700]/10 border-dashed" />
          {/* Volumetric light beam down */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-[800px] bg-gradient-to-b from-[#FF6A00]/0 via-[#FF6A00]/20 to-[#FFD700]/40 blur-[30px] rounded-full" style={{ transform: 'rotateX(-75deg) translateZ(200px)' }} />
        </motion.div>

        {/* Loading / Status Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-6 md:bottom-12 w-[90%] md:w-[600px] flex flex-col items-center gap-6 z-30"
        >
          {showRetry ? (
             <div className="text-xs font-mono text-[#FF6A00] tracking-widest text-center flex flex-col items-center gap-4">
               <span>Preparing PrintBazaar...</span>
               <span className="opacity-60 text-[10px]">Connecting to servers</span>
               <button
                 type="button"
                 onClick={onFinish}
                 className="mt-2 px-6 py-2.5 bg-[#FF6A00] hover:bg-white hover:text-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#FF6A00]/20 transition-all cursor-pointer pointer-events-auto z-50 hover:scale-105 active:scale-95"
               >
                 Skip & Enter Local Mode
               </button>
             </div>
           ) : (
             <div className="w-full flex flex-col items-center gap-4">
               <div className="text-[10px] md:text-xs font-mono tracking-widest text-white/80 uppercase">
                 Loading...
               </div>
               
               {/* Animated Gold Loading Bar */}
               <div className="w-full md:w-[400px] h-[2px] bg-white/10 rounded-full relative overflow-hidden">
                 <motion.div 
                   className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent shadow-[0_0_10px_#FFD700]"
                   animate={{ 
                     left: ["-100%", "100%"] 
                   }}
                   transition={{ 
                     duration: 1.5, 
                     repeat: Infinity, 
                     ease: "linear" 
                   }}
                   style={{ width: "100%" }}
                 />
                 <motion.div 
                   className="absolute top-0 left-0 bottom-0 bg-[#FF6A00]"
                   initial={{ width: "0%" }}
                   animate={{ width: "100%" }}
                   transition={{ duration: 4, ease: "easeInOut" }}
                 />
               </div>

               {/* Step Icons */}
               <div className="flex w-full md:w-[400px] justify-between px-2">
                 {[
                   { icon: PenTool, label: 'DESIGN' },
                   { icon: Printer, label: 'PRINT' },
                   { icon: Truck, label: 'DELIVER' },
                   { icon: BadgeCheck, label: 'QUALITY' }
                 ].map((step, i) => (
                   <div key={i} className="flex flex-col items-center gap-2 opacity-70">
                     <step.icon className="w-5 h-5 md:w-6 md:h-6 text-[#FF6A00]" />
                     <span className="text-[8px] md:text-[10px] font-bold tracking-widest text-white uppercase">{step.label}</span>
                   </div>
                 ))}
               </div>
               
               {/* Diagnostic Logs */}
               <div className="h-4 overflow-hidden w-full text-center mt-2">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={startupLogs[startupLogs.length - 1] || 'init'}
                     initial={{ y: 10, opacity: 0 }}
                     animate={{ y: 0, opacity: 0.5 }}
                     exit={{ y: -10, opacity: 0 }}
                     className="text-[8px] md:text-[9px] font-mono tracking-widest text-white/40 uppercase"
                   >
                     {startupLogs[startupLogs.length - 1] || 'INITIALIZING SECURE ENVIRONMENT...'}
                   </motion.div>
                 </AnimatePresence>
               </div>
             </div>
           )}
        </motion.div>

      </motion.div>
    </motion.div>
  );
}

