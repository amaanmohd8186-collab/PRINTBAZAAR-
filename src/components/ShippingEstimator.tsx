/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, MapPin, Search, ChevronRight, Package, ShieldCheck, Clock } from 'lucide-react';

import { checkServiceability } from '../lib/shipping';

export default function ShippingEstimator() {
  const [pincode, setPincode] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEstimate = async () => {
    if (pincode.length !== 6) return;
    setEstimating(true);
    setEstimate(null);
    setError(null);
    
    try {
      const res = await checkServiceability(pincode);
      if (res.isServiceable) {
        setEstimate({
          courier: res.courierName || 'Partner Courier',
          estimatedDays: res.estimatedDays,
          cost: 0,
          status: 'Servicable',
          tracking: 'Real-time via SMS'
        });
      } else {
        setError(res.estimatedDays || res.error || "Delivery estimate unavailable.");
      }
    } catch (err: any) {
       setError(err.message || "Delivery estimate unavailable.");
    } finally {
      setEstimating(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-zinc-950 text-white rounded-2xl shadow-xl shadow-zinc-200">
           <Truck size={24} />
        </div>
        <div>
           <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900">Delivery Availability</h3>
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Secure Delivery Partners</p>
        </div>
      </div>

      <div className="flex gap-2">
         <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input 
              type="text" 
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter Pincode (e.g. 110001)"
              className="w-full pl-11 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-[11px] font-black uppercase focus:ring-2 ring-zinc-200 outline-none transition"
            />
         </div>
         <button 
           onClick={handleEstimate}
           disabled={pincode.length !== 6 || estimating}
           className="px-6 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition disabled:opacity-50"
         >
           {estimating ? 'Checking...' : 'Check Availability'}
         </button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-rose-50 border border-rose-100 rounded-3xl space-y-4"
        >
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-rose-600">Delivery Unavailable</span>
              </div>
           </div>
           <p className="text-[10px] font-bold text-zinc-600 uppercase leading-relaxed">
              {error}
           </p>
        </motion.div>
      )}

      {estimate && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl space-y-4"
        >
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Delivery Available</span>
              </div>
              <span className="text-[8px] font-bold text-zinc-400 uppercase">Estimated Delivery</span>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <p className="text-[8px] font-black uppercase text-zinc-400">Delivery Window</p>
                 <p className="text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
                    <Clock size={14} className="text-[#FF4D00]" />
                    {estimate.estimatedDays} Business Days
                 </p>
              </div>
              <div className="space-y-1">
                 <p className="text-[8px] font-black uppercase text-zinc-400">Carrier Partners</p>
                 <p className="text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-blue-500" />
                    {estimate.courier}
                 </p>
              </div>
           </div>

           <div className="pt-4 border-t border-zinc-150">
              <div className="flex items-center gap-3">
                 <Package className="w-10 h-10 text-zinc-200" />
                 <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed">
                    Orders from this zone qualify for <span className="text-zinc-900 font-black">Insurance Protection</span> and <span className="text-zinc-900 font-black">Standard Packing</span>.
                 </p>
              </div>
           </div>
        </motion.div>
      )}
    </div>
  );
}
