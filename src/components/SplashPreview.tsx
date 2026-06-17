import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Layers, 
  CreditCard,
  Image as ImageIcon,
  Box,
  Ticket,
  Mail
} from 'lucide-react';

interface SplashPreviewProps {
  onFinish: () => void;
  key?: string;
}

export default function SplashPreview({ onFinish }: SplashPreviewProps) {
  const [phase, setPhase] = useState<number>(0);
  const [transformIndex, setTransformIndex] = useState(0);

  const transformationSequence = [
    { text: 'WEDDING CARDS', icon: Mail },
    { text: 'BUSINESS CARDS', icon: CreditCard },
    { text: 'POSTERS', icon: ImageIcon },
    { text: 'PACKAGING BOXES', icon: Box },
    { text: 'BANNERS', icon: Ticket },
    { text: 'PRINTBAZAAR', icon: Layers }, // Final back to logo
  ];

  useEffect(() => {
    // Cinematic Timeline
    // 0ms - 800ms: Phase 0 - Energy Beam & Portal Opening
    // 800ms - 1800ms: Phase 1 - 3D Logo Emerges & Neural Network
    // 1800ms - 3200ms: Phase 2 - Transformation Sequence
    // 3200ms - 4200ms: Phase 3 - Final Zoom & "Powered by AI"
    // 4200ms+: Phase 4 - Smooth Egress to App
    
    let isMounted = true;

    setTimeout(() => { if(isMounted) setPhase(1) }, 800);
    
    // Start rapid transformations
    setTimeout(() => { 
      if(!isMounted) return;
      setPhase(2);
      
      // Cycle through transformations rapidly
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if(step >= transformationSequence.length) {
          clearInterval(interval);
          if (isMounted) setPhase(3);
        } else {
          if (isMounted) setTransformIndex(step);
        }
      }, 250); // 250ms per transform
    }, 1800);

    setTimeout(() => {
      if (isMounted) onFinish();
    }, 4500);

    return () => { isMounted = false; };
  }, [onFinish]);

  // Generate 3D Space Particles
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 500 - 250,
    size: Math.random() * 3 + 1,
    color: Math.random() > 0.5 ? '#FF6A00' : '#FFD700',
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3
  }));

  // Generate Neural Network Nodes
  const nodes = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
  }));

  const CurrentIcon = transformationSequence[transformIndex].icon;

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.1, // cinematic forward push out
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
      }}
      style={{ perspective: '1000px' }}
    >
      {/* 3D Background Space Particles */}
      <div className="absolute inset-0 pointer-events-none transform-style-3d">
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
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              z: p.z
            }}
            initial={{ opacity: 0, z: p.z - 500 }}
            animate={{ 
              opacity: [0, 0.8, 0], 
              z: p.z + 500
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Futuristic AI Neural Network (Appears in Phase 1+) */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.3, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg width="100%" height="100%" className="absolute inset-0">
               {nodes.map((n1, i) => 
                 nodes.slice(i + 1, i + 4).map((n2, j) => (
                   <motion.line 
                     key={`${i}-${j}`}
                     x1={`${n1.x}%`} y1={`${n1.y}%`}
                     x2={`${n2.x}%`} y2={`${n2.y}%`}
                     stroke="url(#aiGradient)" 
                     strokeWidth="0.5"
                     initial={{ pathLength: 0, opacity: 0 }}
                     animate={{ pathLength: 1, opacity: 0.5 }}
                     transition={{ duration: 2, delay: Math.random(), repeat: Infinity, repeatType: 'reverse' }}
                   />
                 ))
               )}
               <defs>
                 <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" stopColor="#FF6A00" />
                   <stop offset="100%" stopColor="#FFD700" />
                 </linearGradient>
               </defs>
            </svg>
            {nodes.map(n => (
              <motion.div 
                key={`node-${n.id}`}
                className="absolute w-1.5 h-1.5 bg-[#FFD700] rounded-full shadow-[0_0_10px_#FFD700]"
                style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)' }}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ duration: 1, delay: Math.random() * 1 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 0: Energy Beam / Portal Opening */}
      <AnimatePresence>
        {phase === 0 && (
          <motion.div
            className="absolute w-1 h-0 bg-[#FF6A00] shadow-[0_0_40px_20px_#FF6A00] rounded-full"
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: '100vh', 
              opacity: [0, 1, 1],
              scaleX: [1, 1, 150] 
            }}
            transition={{
              duration: 0.8,
              times: [0, 0.4, 1],
              ease: "circIn"
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Container - Depth & Transformations */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            className="relative z-20 flex flex-col items-center justify-center"
            initial={{ scale: 0, rotateX: 60, z: -1000, opacity: 0 }}
            animate={{ 
              scale: phase === 3 ? 1.2 : 1, 
              rotateX: 0, 
              z: phase === 3 ? 200 : 0,
              opacity: 1 
            }}
            transition={{ 
              type: 'spring', 
              stiffness: phase === 3 ? 50 : 80, 
              damping: 20 
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* AI Energy Ring Rotating Background */}
            <motion.div
              className="absolute w-64 h-64 border-2 border-dashed border-[#FFD700]/30 rounded-full shadow-[0_0_60px_#FF6A00_inset]"
              animate={{ rotateZ: 360, scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute w-80 h-80 border border-[#FF6A00]/20 rounded-full"
              animate={{ rotateZ: -360, scale: [1.1, 1, 1.1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            {/* Central Holographic Object */}
            <motion.div
              key={transformIndex}
              initial={{ scale: 0.5, rotateY: -90, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, rotateY: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 1.5, rotateY: 90, opacity: 0, filter: 'blur(10px)', position: 'absolute' }}
              transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 20 }}
              className="relative w-40 h-40 flex items-center justify-center mb-8"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {phase === 2 ? (
                // Floating Transformation Card
                <div className="w-full h-full bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,106,0,0.3)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6A00]/20 to-[#FFD700]/20 opacity-50" />
                  <div className="absolute inset-0 bg-black/40 z-0" />
                  <CurrentIcon className="w-16 h-16 text-[#FFD700] drop-shadow-[0_0_15px_#FFD700] z-10" />
                </div>
              ) : (
                // 3D Chrome Metal Logo
                <div className="relative flex items-center justify-center transform-style-3d group">
                  {/* Neon Glow Behind */}
                  <div className="absolute w-32 h-32 bg-[#FF6A00] rounded-full blur-[60px] opacity-80 animate-pulse" />
                  
                  {/* Layered Glass/Chrome Base */}
                  <div className="w-32 h-32 bg-gradient-to-b from-white/20 to-black/80 backdrop-blur-3xl rounded-[32px] border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_20px_rgba(255,255,255,0.5)] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://transparenttextures.com/patterns/brushed-alum.png')]" />
                    <Layers className="relative w-14 h-14 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter transition-all" />
                    
                    {/* Metal Sheen Sweep */}
                    <motion.div 
                      className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-45"
                      initial={{ left: '-200%' }}
                      animate={{ left: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Cinematic Typography */}
            <div className="text-center relative">
               <motion.div
                 className="absolute inset-0 bg-[#FF6A00] blur-xl opacity-30 w-full h-full scale-150"
                 animate={{ opacity: [0.2, 0.5, 0.2] }}
                 transition={{ duration: 2, repeat: Infinity }}
               />
               <h1 className="relative text-4xl md:text-5xl font-black tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] mb-2" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)'}}>
                  PRINT<span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#FF6A00]">BAZAAR</span>
               </h1>
               
               {/* Word transformation below the logo */}
               <div className="h-6 overflow-hidden relative flex justify-center mt-2">
                 <AnimatePresence mode="wait">
                   <motion.p
                     key={transformationSequence[transformIndex].text}
                     initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
                     animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                     exit={{ y: -20, opacity: 0, filter: 'blur(4px)' }}
                     transition={{ duration: 0.2 }}
                     className="absolute text-[10px] md:text-xs font-mono font-bold tracking-[0.4em] text-[#FFD700] uppercase shadow-[#FF6A00]"
                   >
                     {phase === 2 ? transformationSequence[transformIndex].text : 'THE FUTURE OF PRINTING'}
                   </motion.p>
                 </AnimatePresence>
               </div>
            </div>

            {/* "POWERED BY AI" final reveal */}
            <AnimatePresence>
              {phase >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="mt-12 flex items-center justify-center gap-3 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-[0_0_30px_rgba(255,106,0,0.15)]"
                >
                   <Sparkles className="w-4 h-4 text-[#FFD700] animate-pulse" />
                   <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Powered By AI</span>
                   <Sparkles className="w-4 h-4 text-[#FFD700] animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
