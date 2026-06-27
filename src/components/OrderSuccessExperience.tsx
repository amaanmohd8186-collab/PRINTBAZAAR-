/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Package, Truck, Calendar, ShoppingBag, ArrowRight, ShieldCheck, Sparkles, Award } from 'lucide-react';
import { Order } from '../types';

interface OrderSuccessExperienceProps {
  order: Order;
  onContinueShopping: () => void;
  onTrackOrder: () => void;
}

export default function OrderSuccessExperience({
  order,
  onContinueShopping,
  onTrackOrder,
}: OrderSuccessExperienceProps) {
  const [animationStage, setAnimationStage] = useState<number>(0);
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; color: string; scale: number; rotation: number }[]>([]);

  // Generate confetti coordinates
  useEffect(() => {
    const colors = ['#FF4D00', '#FF007F', '#00DF89', '#3B82F6', '#F59E0B', '#10B981', '#A855F7'];
    const particles = Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage width
      y: Math.random() * -40 - 10, // above screen
      color: colors[Math.floor(Math.random() * colors.length)],
      scale: Math.random() * 0.6 + 0.4,
      rotation: Math.random() * 360,
    }));
    setConfetti(particles);
  }, []);

  // Sequence the animation steps
  useEffect(() => {
    // Stage 0: Payment Success Checkmark (0s)
    // Stage 1: Package Box 3D Assembly (1.2s)
    // Stage 2: Box enters Truck & Truck starts driving (2.4s)
    // Stage 3: Loading Progress Bar (3.6s)
    // Stage 4: Order Placed Card Reveal (4.8s)

    const timers = [
      setTimeout(() => setAnimationStage(1), 1200),
      setTimeout(() => setAnimationStage(2), 2400),
      setTimeout(() => setAnimationStage(3), 3600),
      setTimeout(() => setAnimationStage(4), 4800),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  // Format delivery date (3-5 days from now)
  const getEstimatedDelivery = () => {
    const date = new Date();
    date.setDate(date.getDate() + 4); // Average 4 days
    return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-150 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md overflow-y-auto px-4 py-8">
      
      {/* Background Ambience Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#FF4D00]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Confetti celebration stream */}
      {animationStage >= 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confetti.map((c) => (
            <motion.div
              key={c.id}
              initial={{ y: '-10%', x: `${c.x}%`, rotate: c.rotation, opacity: 1 }}
              animate={
                animationStage >= 1
                  ? {
                      y: '110%',
                      x: `${c.x + (Math.sin(c.id) * 10)}%`,
                      rotate: c.rotation + 720,
                      opacity: [1, 1, 0],
                    }
                  : {}
              }
              transition={{
                duration: Math.random() * 2.5 + 2.5,
                ease: 'easeOut',
                delay: Math.random() * 0.5,
              }}
              style={{
                position: 'absolute',
                width: `${10 * c.scale}px`,
                height: `${24 * c.scale}px`,
                backgroundColor: c.color,
                borderRadius: '4px',
              }}
            />
          ))}
        </div>
      )}

      {/* PRIMARY SUCCESS SEQUENCE CANVAS */}
      <div className="w-full max-w-xl flex flex-col items-center justify-center text-center relative z-10">
        
        {/* ANIMATION STAGE CONTAINER */}
        <div className="h-[220px] w-full flex items-center justify-center mb-6 relative">
          
          <AnimatePresence mode="wait">
            
            {/* STAGE 0: PAYMENT SUCCESS & CHECKMARK */}
            {animationStage === 0 && (
              <motion.div
                key="stage-checkmark"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="flex flex-col items-center justify-center"
              >
                <div className="relative">
                  {/* Outer pulse rings */}
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                    className="absolute inset-0 bg-emerald-500/20 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                    className="absolute inset-0 bg-emerald-500/30 rounded-full"
                  />
                  
                  {/* Core Checkmark badge */}
                  <div className="relative w-28 h-28 bg-emerald-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                    <Check className="w-14 h-14 text-white stroke-[4.5]" />
                  </div>
                </div>
                
                <motion.h3 
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white text-xl font-black uppercase tracking-widest mt-6 font-mono text-emerald-400"
                >
                  Payment Success
                </motion.h3>
              </motion.div>
            )}

            {/* STAGE 1: 3D ISOMETRIC BOX ASSEMBLY */}
            {animationStage === 1 && (
              <motion.div
                key="stage-box"
                initial={{ y: -100, scale: 0.3, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                className="flex flex-col items-center justify-center"
              >
                <div className="relative w-36 h-36 flex items-center justify-center">
                  
                  {/* Isometric Box Graphic using premium styled SVG */}
                  <svg className="w-28 h-28 drop-shadow-2xl overflow-visible" viewBox="0 0 100 100">
                    {/* Left Face */}
                    <motion.polygon
                      points="10,40 50,60 50,90 10,70"
                      fill="#D97706"
                      stroke="#78350F"
                      strokeWidth="1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    />
                    {/* Right Face */}
                    <motion.polygon
                      points="50,60 90,40 90,70 50,90"
                      fill="#B45309"
                      stroke="#78350F"
                      strokeWidth="1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                    {/* Left Top Flap */}
                    <motion.polygon
                      points="10,40 50,20 50,60 10,40"
                      fill="#F59E0B"
                      stroke="#78350F"
                      strokeWidth="1.5"
                      style={{ transformOrigin: '50px 20px' }}
                      initial={{ rotateX: 90 }}
                      animate={{ rotateX: 0 }}
                      transition={{ type: 'spring', delay: 0.4 }}
                    />
                    {/* Right Top Flap */}
                    <motion.polygon
                      points="50,20 90,40 50,60 50,20"
                      fill="#D97706"
                      stroke="#78350F"
                      strokeWidth="1.5"
                      style={{ transformOrigin: '50px 20px' }}
                      initial={{ rotateX: 90 }}
                      animate={{ rotateX: 0 }}
                      transition={{ type: 'spring', delay: 0.5 }}
                    />

                    {/* Industrial Tape Layer */}
                    <motion.path
                      d="M 50,20 L 50,90"
                      stroke="#000000"
                      strokeWidth="3.5"
                      strokeDasharray="20"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.7, duration: 0.4 }}
                    />
                  </svg>
                  
                  {/* Little Sparks */}
                  <motion.div 
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute top-2 right-4 text-amber-400"
                  >
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </motion.div>
                </div>

                <h3 className="text-white text-md font-black uppercase tracking-widest mt-4 font-mono">
                  Packing Premium Custom Stock
                </h3>
              </motion.div>
            )}

            {/* STAGE 2: TRUCK STARTS MOVING */}
            {animationStage === 2 && (
              <motion.div
                key="stage-truck"
                initial={{ x: -250, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 80 }}
                className="flex flex-col items-center justify-center w-full"
              >
                <div className="relative flex items-center justify-center h-28 w-60">
                  
                  {/* Animated Road Lane Path */}
                  <div className="absolute bottom-1 left-0 right-0 h-[3px] bg-zinc-800 flex justify-between overflow-hidden">
                    <motion.div
                      animate={{ x: [-100, 0] }}
                      transition={{ ease: 'linear', repeat: Infinity, duration: 0.5 }}
                      className="w-[200%] flex gap-4 font-mono select-none"
                    >
                      {Array.from({ length: 15 }).map((_, i) => (
                        <span key={i} className="h-[3px] w-6 bg-zinc-600 block shrink-0" />
                      ))}
                    </motion.div>
                  </div>

                  {/* Delivery Truck Body */}
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 0.15, ease: 'easeInOut' }}
                    className="relative w-44 flex items-end justify-center z-10 select-none"
                  >
                    {/* SVG Truck illustration */}
                    <svg viewBox="0 0 120 60" className="w-36 h-20 fill-zinc-200">
                      {/* Truck container back */}
                      <rect x="5" y="10" width="70" height="38" rx="2" fill="#FF4D00" />
                      {/* Custom brand signature logo inside truck container */}
                      <text x="12" y="32" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">PRINTBAZAAR</text>
                      {/* Cab */}
                      <path d="M 75,20 L 95,20 Q 105,20 108,28 L 115,35 Q 117,38 117,42 L 117,48 L 75,48 Z" fill="#0F172A" />
                      {/* Window */}
                      <path d="M 82,24 L 94,24 L 102,32 L 82,32 Z" fill="#94A3B8" />
                      {/* Bumper */}
                      <rect x="110" y="44" width="8" height="4" fill="#64748B" />
                      
                      {/* Rear Wheel */}
                      <circle cx="25" cy="48" r="8" fill="#1E293B" stroke="#F1F5F9" strokeWidth="1.5" />
                      <circle cx="25" cy="48" r="3" fill="#94A3B8" />
                      {/* Middle Wheel */}
                      <circle cx="60" cy="48" r="8" fill="#1E293B" stroke="#F1F5F9" strokeWidth="1.5" />
                      <circle cx="60" cy="48" r="3" fill="#94A3B8" />
                      {/* Front Wheel */}
                      <circle cx="95" cy="48" r="8" fill="#1E293B" stroke="#F1F5F9" strokeWidth="1.5" />
                      <circle cx="95" cy="48" r="3" fill="#94A3B8" />
                    </svg>

                    {/* Smoke exhaust animation */}
                    <div className="absolute bottom-3 -left-4 flex gap-1.5 items-center">
                      <motion.div
                        animate={{ scale: [0, 1.5, 0], opacity: [0.8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.4, delay: 0 }}
                        className="w-3 h-3 bg-zinc-600 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [0, 1.8, 0], opacity: [0.8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.4, delay: 0.15 }}
                        className="w-4 h-4 bg-zinc-500 rounded-full"
                      />
                    </div>
                  </motion.div>
                </div>

                <h3 className="text-white text-md font-black uppercase tracking-widest mt-4 font-mono">
                  Dispatching to Noida/Delhi Logistics Hub
                </h3>
              </motion.div>
            )}

            {/* STAGE 3: PROGRESS BAR ANIMATION */}
            {animationStage === 3 && (
              <motion.div
                key="stage-progress"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center w-full px-6"
              >
                <div className="w-full bg-zinc-900 border-2 border-black rounded-full h-5 overflow-hidden p-0.5 relative">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.1, ease: 'easeInOut' }}
                    className="h-full bg-linear-to-r from-[#FF4D00] to-emerald-500 rounded-full flex items-center justify-end pr-2 font-mono text-[9px] text-white font-bold"
                  >
                    <span>100%</span>
                  </motion.div>
                </div>

                <h3 className="text-white text-md font-black uppercase tracking-widest mt-5 font-mono animate-pulse flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  Securing Carrier Slot Waybills...
                </h3>
              </motion.div>
            )}

            {/* STAGE 4: FINAL REVEAL (GLASSMORPHISM CARD) */}
            {animationStage === 4 && (
              <motion.div
                key="stage-final"
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="w-full"
              >
                {/* Premium Glassmorphism Container */}
                <div className="w-full bg-white/10 backdrop-blur-xl border border-white/15 p-8 rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-left relative overflow-hidden">
                  
                  {/* Decorative Ribbon Seal */}
                  <div className="absolute -top-3 -right-3 w-20 h-20 overflow-hidden pointer-events-none">
                    <div className="absolute top-4 -right-5 w-24 bg-emerald-500 text-white font-mono text-[8px] font-black uppercase tracking-widest text-center py-1 rotate-45 border-y border-white/20 shadow-md">
                      CONFIRMED
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 mb-6 border-b border-white/10 pb-5">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                      <Award className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-heavy text-white uppercase tracking-tight">Order Placed Successfully!</h2>
                      <p className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider mt-0.5">Your production slots have been fully booked</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Order ID and Total */}
                    <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <div>
                        <span className="text-[9px] font-bold text-zinc-400 block uppercase font-mono">Order Reference ID:</span>
                        <span className="text-white text-xs font-mono font-black">{order.id}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-400 block uppercase font-mono">Invoice Total Paid:</span>
                        <span className="text-[#FF4D00] text-sm font-black">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Estimated Delivery Date with animated truck */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-start gap-3.5">
                      <div className="p-2.5 bg-[#FF4D00]/10 text-[#FF4D00] rounded-xl shrink-0 mt-0.5">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-zinc-400 block uppercase font-mono">Guaranteed Dispatch & Estimated Arrival:</span>
                        <span className="text-white text-xs font-black block mt-0.5">{getEstimatedDelivery()}</span>
                        <span className="text-[10px] text-emerald-400 font-medium block mt-1">✓ Fast Delhi/NCR express carrier delivery routes enabled</span>
                      </div>
                    </div>

                    {/* Verification and Quality Promise badge */}
                    <div className="flex items-center gap-2 px-1 text-[10px] font-mono text-zinc-400 uppercase">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Standard 300 DPI Pre-Press Calibration verified by Admin</span>
                    </div>

                    {/* ACTION BUTTONS WITH GLASSMORPHISM STYLING */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                      <button
                        type="button"
                        onClick={onContinueShopping}
                        className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:-translate-y-0.5"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Continue Shopping</span>
                      </button>

                      <button
                        type="button"
                        onClick={onTrackOrder}
                        className="py-3 px-4 rounded-2xl bg-linear-to-r from-[#FF4D00] to-[#E04400] hover:scale-103 active:scale-97 text-white text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(255,77,0,0.3)] hover:-translate-y-0.5"
                      >
                        <span>Track Order Status</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
