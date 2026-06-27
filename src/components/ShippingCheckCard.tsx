/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Truck, MapPin, CheckCircle2, XCircle, Loader2, RefreshCcw, ChevronRight, ShieldCheck, Box, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { checkServiceability, isValidIndianPincode, getCachedPincode } from '../lib/shipping';
import { ShippingServiceability } from '../types';

interface ShippingCheckCardProps {
  className?: string;
  settings?: any;
}

export default function ShippingCheckCard({ className, settings }: ShippingCheckCardProps) {
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShippingServiceability | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize from cache
  useEffect(() => {
    const cached = getCachedPincode();
    if (cached) {
      setPincode(cached);
    }
  }, []);

  // Auto-check when pincode reaches 6 digits
  useEffect(() => {
    if (pincode.length === 6) {
      if (isValidIndianPincode(pincode)) {
        handleCheck();
      } else {
        setError('Invalid Indian PIN format');
      }
    } else {
      setError(null);
      if (result) setResult(null);
    }
  }, [pincode]);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Use passed settings or default
      const data = await checkServiceability(pincode, settings);
      setResult(data);
    } catch (err) {
      setError('Connection failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPincode('');
    setResult(null);
    setError(null);
  };

  return (
    <div className={`bg-white border border-zinc-200 rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${className}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight text-zinc-900">Shipment Logistics</h4>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global Pincode Serviceability</p>
            </div>
          </div>
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Input Area */}
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors">
            <MapPin className="w-5 h-5" />
          </div>
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 6) setPincode(val);
            }}
            placeholder="Enter Delivery PIN Code"
            className={`w-full h-16 pl-14 pr-4 bg-zinc-50 border-2 rounded-2xl text-base font-black tracking-[0.2em] focus:outline-hidden transition-all duration-300 ${
              error ? 'border-rose-100 focus:border-rose-500 text-rose-600' : 
              result?.isServiceable ? 'border-emerald-100 focus:border-emerald-500 text-emerald-600' :
              result?.isServiceable === false ? 'border-rose-100 focus:border-rose-500 text-rose-600' :
              'border-zinc-100 focus:border-zinc-900 text-zinc-900'
            }`}
          />
          {loading && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <Loader2 className="w-6 h-6 text-[#FF4D00] animate-spin" />
            </div>
          )}
        </div>

        {/* Result Area */}
        <AnimatePresence mode="wait">
          {result && result.isServiceable && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Status Banner */}
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-800">✓ Delivery Available</h5>
                  <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mt-0.5">
                    Serviceable to {result.city}, {result.state}
                  </p>
                </div>
                <button onClick={handleReset} className="p-2 hover:bg-white/50 rounded-lg text-emerald-400">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Delivery Timeline Card */}
              <div className="bg-zinc-50 rounded-[24px] border border-zinc-100 p-5 space-y-5">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Estimated Delivery Date</p>
                    <p className="text-sm font-black text-zinc-900">{result.deliveryDate}</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-zinc-900 shadow-sm border border-zinc-100">
                    <Zap className="w-5 h-5 text-[#FF4D00]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-3 bg-white rounded-xl border border-zinc-100">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-wider">Printing Time</span>
                    </div>
                    <p className="text-[11px] font-bold text-zinc-900">{result.printingTime}</p>
                  </div>
                  <div className="space-y-1.5 p-3 bg-white rounded-xl border border-zinc-100">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Truck className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-wider">Shipping Time</span>
                    </div>
                    <p className="text-[11px] font-bold text-zinc-900">{result.shippingTime}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-emerald-600">
                    <Box className="w-3.5 h-3.5" />
                    <span className="text-[7px] font-black uppercase tracking-tighter text-center">Secure Packing</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-emerald-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="text-[7px] font-black uppercase tracking-tighter text-center">Protected</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-zinc-900 text-white rounded-lg shadow-lg">
                    <Zap className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span className="text-[7px] font-black uppercase tracking-tighter text-center">
                      {result.expressAvailable ? 'Express' : 'Standard'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {result && !result.isServiceable && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col items-center text-center gap-3"
            >
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500">
                <XCircle className="w-7 h-7" />
              </div>
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-wider text-rose-900">✕ Delivery Not Available</h5>
                <p className="text-[9px] font-bold text-rose-600 mt-1 uppercase tracking-widest max-w-[200px]">
                  We currently do not serve PIN {pincode}.
                </p>
              </div>
              <button 
                onClick={handleReset}
                className="mt-2 px-6 py-2 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
              >
                Try Another Area
              </button>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-zinc-900 text-rose-400 rounded-2xl flex items-center gap-3 border border-zinc-800"
            >
              <XCircle className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
            </motion.div>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-6"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-zinc-100 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-[#FF4D00] border-t-transparent rounded-full animate-spin" />
                <Truck className="absolute inset-0 m-auto w-6 h-6 text-zinc-900 animate-pulse" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 animate-pulse">Syncing with Shiprocket...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Future Track Alert */}
        <div className="pt-4 flex items-center justify-between border-t border-zinc-100 group cursor-help">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-zinc-300" />
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-600 transition-colors">
              Live Tracking (Coming Soon)
            </span>
          </div>
          <ChevronRight className="w-3 h-3 text-zinc-300 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

// Separate Mini Version for small slots
export function MiniShippingCheck({ className }: { className?: string }) {
  return (
    <div className={`p-4 bg-zinc-50 border border-zinc-100 rounded-2xl ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="w-4 h-4 text-zinc-400" />
          <p className="text-[10px] font-black uppercase text-zinc-500">Shipping Estimate</p>
        </div>
        <button className="text-[9px] font-black uppercase text-[#FF4D00] hover:underline">Check</button>
      </div>
    </div>
  );
}

function Activity({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}
