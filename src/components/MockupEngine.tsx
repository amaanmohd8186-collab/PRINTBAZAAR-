/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Layout, Monitor, Smartphone, Tablet, Layers, Camera, Sparkles } from 'lucide-react';
import { ProductCategory } from '../types';

interface MockupEngineProps {
  designUrl: string;
  category: ProductCategory;
}

export default function MockupEngine({ designUrl, category }: MockupEngineProps) {
  // Map category to a specific mockup style
  const getMockupStyle = () => {
    switch(category) {
      case 'Business Cards':
      case 'Visiting Cards':
        return 'stacked-cards';
      case 'T-Shirts':
        return 'tshirt';
      case 'Mugs':
        return 'mug';
      case 'Posters':
      case 'Banners':
        return 'wall-frame';
      default:
        return 'basic-flat';
    }
  };

  const style = getMockupStyle();

  return (
    <div className="bg-zinc-100 rounded-[32px] p-8 border border-zinc-200 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
      <div className="absolute top-6 left-6 flex items-center gap-2">
         <div className="p-2 bg-white rounded-xl border border-zinc-200 shadow-sm">
            <Camera className="w-4 h-4 text-zinc-900" />
         </div>
         <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pro Mockup Engine 2026</span>
      </div>

      <div className="absolute top-6 right-6 flex items-center gap-1.5">
         <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-zinc-100 flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/50?u=${i}`} alt="" />
              </div>
            ))}
         </div>
         <span className="text-[8px] font-bold text-zinc-400 uppercase">Trusted by 10k+</span>
      </div>

      {/* Dynamic Mockup Container */}
      <div className="relative z-10 w-full max-w-md perspective-[1000px]">
        {style === 'stacked-cards' && (
          <div className="relative h-64 flex items-center justify-center">
            {/* Background card */}
            <motion.div 
              initial={{ rotateY: -20, rotateX: 10, translateZ: -40, opacity: 0 }}
              animate={{ rotateY: -15, rotateX: 5, translateZ: -20, opacity: 0.4 }}
              className="absolute w-64 h-40 bg-white rounded-lg shadow-2xl border border-zinc-100 overflow-hidden"
            >
              <img src={designUrl} alt="" className="w-full h-full object-cover opacity-50 blur-[1px]" />
            </motion.div>
            {/* Middle card */}
            <motion.div 
              initial={{ rotateY: -10, rotateX: 5, translateZ: -20, opacity: 0 }}
              animate={{ rotateY: -5, rotateX: 2, translateZ: -10, opacity: 0.7 }}
              className="absolute w-64 h-40 bg-white rounded-lg shadow-2xl border border-zinc-100 overflow-hidden"
            >
              <img src={designUrl} alt="" className="w-full h-full object-cover" />
            </motion.div>
            {/* Front card */}
            <motion.div 
              initial={{ rotateY: 0, rotateX: 0, translateZ: 0, opacity: 0 }}
              animate={{ rotateY: 10, rotateX: -5, translateZ: 10, opacity: 1 }}
              whileHover={{ rotateY: 15, rotateX: -10, scale: 1.05 }}
              className="absolute w-64 h-40 bg-white rounded-lg shadow-2xl border border-zinc-100 overflow-hidden cursor-move ring-1 ring-zinc-100"
            >
              <img src={designUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30" />
            </motion.div>
          </div>
        )}

        {style === 'tshirt' && (
          <div className="relative flex items-center justify-center">
             <div className="relative w-80 h-80">
                <img 
                  src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop" 
                  className="w-full h-full object-contain grayscale brightness-110 opacity-40" 
                  alt="" 
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-32 h-32 mt-[-20px] ml-[-10px] relative">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-full overflow-hidden rounded-md shadow-sm mix-blend-multiply"
                      >
                         <img src={designUrl} alt="" className="w-full h-full object-contain" />
                      </motion.div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {style === 'mug' && (
          <div className="relative flex items-center justify-center">
             <div className="relative w-80 h-80">
                <img 
                  src="https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop" 
                  className="w-full h-full object-contain grayscale contrast-125 opacity-30" 
                  alt="" 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-24 h-24 ml-[-30px] rounded-sm overflow-hidden rotate-1 bg-white p-1 shadow-sm">
                      <img src={designUrl} alt="" className="w-full h-full object-cover" />
                   </div>
                </div>
             </div>
          </div>
        )}

        {style === 'wall-frame' && (
          <div className="relative flex items-center justify-center p-10 bg-zinc-200 rounded-3xl border border-zinc-300">
             <motion.div 
               whileHover={{ scale: 1.02 }}
               className="bg-black p-4 rounded-sm shadow-2xl border-[12px] border-zinc-900 ring-1 ring-white/10"
             >
                <div className="w-64 h-96 bg-white overflow-hidden relative">
                   <img src={designUrl} alt="" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 shadow-inner" />
                </div>
             </motion.div>
          </div>
        )}

        {style === 'basic-flat' && (
          <div className="relative flex items-center justify-center">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white p-2 rounded-2xl shadow-2xl border border-zinc-100 max-w-xs"
             >
                <img src={designUrl} alt="" className="w-full h-full object-contain rounded-xl" />
             </motion.div>
          </div>
        )}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
        {[
          { label: 'Matte Finish', color: 'bg-zinc-300' },
          { label: 'Glossy Coat', color: 'bg-zinc-900' },
          { label: 'Velvet Soft', color: 'bg-rose-900' },
          { label: 'Metallic Ink', color: 'bg-amber-500' }
        ].map((opt, i) => (
          <button key={i} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-zinc-200 text-[9px] font-black uppercase tracking-widest hover:border-zinc-900 transition">
            <div className={`w-2 h-2 rounded-full ${opt.color}`} />
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-4">
         <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
            <Sparkles className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-widest">Ray-traced Previews</span>
         </div>
         <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
            <Layers className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-widest">Material Accurate</span>
         </div>
      </div>
    </div>
  );
}
