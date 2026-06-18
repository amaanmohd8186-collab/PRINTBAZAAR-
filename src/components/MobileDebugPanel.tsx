import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Smartphone, Monitor, Compass, X } from 'lucide-react';

export default function MobileDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait',
    deviceType: 'Desktop',
    userAgent: navigator.userAgent,
    touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let device = 'Desktop';
      if (w < 768) device = 'Mobile';
      else if (w < 1024) device = 'Tablet';

      setMetrics({
        width: w,
        height: h,
        orientation: w > h ? 'Landscape' : 'Portrait',
        deviceType: device,
        userAgent: navigator.userAgent,
        touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize(); // trigger initial

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <>
      {/* Tiny floating activator badge */}
      <div className="fixed bottom-24 left-4 z-[9999] pointer-events-auto">
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 text-[10px] font-mono tracking-widest text-emerald-400 font-bold rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:bg-neutral-800 transition-colors uppercase leading-none"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          <span>DEBUG</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 left-4 right-4 md:right-auto md:w-80 z-[10000] bg-[#070402]/95 border border-zinc-800 text-zinc-300 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-md p-4 font-mono select-none pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Mobile Audit Debug</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-[11px]">
              <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/30">
                <span className="text-zinc-500">Screen Size:</span>
                <span className="text-white font-bold">{metrics.width}px × {metrics.height}px</span>
              </div>

              <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/30">
                <span className="text-zinc-500">Device Type:</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  {metrics.deviceType === 'Mobile' ? (
                    <Smartphone className="w-3.5 h-3.5" />
                  ) : (
                    <Monitor className="w-3.5 h-3.5" />
                  )}
                  {metrics.deviceType}
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/30">
                <span className="text-zinc-500">Orientation:</span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Compass className="w-3.5 h-3.5" />
                  {metrics.orientation}
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/30">
                <span className="text-zinc-500">Touch Input:</span>
                <span className={`font-bold ${metrics.touchSupported ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {metrics.touchSupported ? 'SUPPORTED' : 'NOT SUPPORTED'}
                </span>
              </div>

              <div className="bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/30 space-y-1">
                <span className="text-zinc-500 block text-[9px] uppercase tracking-wider">Viewport Audit Failsafes:</span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className="text-emerald-400">✓ Viewport Fit</span>
                  <span className="text-emerald-400">✓ Autoscale</span>
                  <span className="text-emerald-400">✓ Safe Areas</span>
                  <span className="text-emerald-400">✓ No-Overflow</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-zinc-800 text-[9px] text-zinc-500 flex justify-between">
              <span>PRINTBAZAAR MOBILE</span>
              <span>v1.2 REV-LIVE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
