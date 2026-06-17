import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShoppingBag, 
  Share2, 
  Heart, 
  Download, 
  Printer, 
  Info, 
  Layers,
  ChevronRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { SocialPost, Product, ProductCategory } from '../types';

interface DesignShowcaseModalProps {
  post: SocialPost;
  product?: Product;
  onClose: () => void;
  onBuy: (productId: string) => void;
  triggerToast: (t: string) => void;
}

export default function DesignShowcaseModal({ 
  post, 
  product, 
  onClose, 
  onBuy,
  triggerToast 
}: DesignShowcaseModalProps) {
  const [activeView, setActiveView] = useState<'preview' | 'mockup' | 'specs'>('preview');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[40px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2 bg-black/5 hover:bg-black/10 rounded-full transition"
        >
          <X className="w-5 h-5 text-zinc-900" />
        </button>

        {/* Left: Media Area */}
        <div className="md:flex-1 bg-zinc-50 relative group">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full"
            >
              <img 
                src={activeView === 'mockup' ? 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?q=80&w=1200&auto=format&fit=crop' : post.media[0]?.url} 
                className="w-full h-full object-cover" 
                alt="Design preview"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 shadow-xl">
             <ViewToggle active={activeView === 'preview'} onClick={() => setActiveView('preview')} label="HD Preview" />
             <ViewToggle active={activeView === 'mockup'} onClick={() => setActiveView('mockup')} label="Mockup" />
             <ViewToggle active={activeView === 'specs'} onClick={() => setActiveView('specs')} label="Specs" />
          </div>
        </div>

        {/* Right: Info Area */}
        <div className="w-full md:w-[400px] bg-white border-l border-zinc-100 flex flex-col h-full">
          <div className="p-8 flex-1 overflow-y-auto space-y-8 no-scrollbar">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-100 shadow-sm overflow-hidden flex items-center justify-center">
                  {post.creatorAvatar ? <img src={post.creatorAvatar} className="w-full h-full object-cover" alt="" /> : <Sparkles className="w-6 h-6 text-zinc-300" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black uppercase text-zinc-900">{post.creatorName}</span>
                    {post.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />}
                  </div>
                  <p className="text-[9px] font-mono text-zinc-400 font-bold uppercase">Professional Designer</p>
                </div>
                <button className="ml-auto px-4 py-2 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all">
                  Follow
                </button>
              </div>

              <h2 className="text-xl font-black uppercase leading-tight text-zinc-900">{post.caption.split('#')[0]}</h2>
              
              <div className="flex items-center gap-6">
                <Stat icon={<Heart />} label="Likes" value={post.likesCount} />
                <Stat icon={<Download />} label="Prints" value={post.saveCount * 2} />
                <Stat icon={<Printer />} label="Orders" value={post.shareCount + 10} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FF4D00]">Print Configuration</h3>
              <div className="space-y-3">
                 <ConfigItem label="Paper Type" value={product?.materials[0]?.name || 'Premium Matt 350gsm'} />
                 <ConfigItem label="Standard Size" value={product?.sizes[0]?.name || 'Standard (3.5" x 2.0")'} />
                 <ConfigItem label="Color Mode" value="CMYK / 300 DPI" />
                 <ConfigItem label="Finishing" value="Laminated / Die-cut" />
              </div>
            </div>

            <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-zinc-400">Est. Price</span>
                 <span className="text-lg font-black text-[#FF4D00]">₹{product?.quantitySlabs[0]?.unitPrice ? product.quantitySlabs[0].unitPrice * product.quantitySlabs[0].quantity : '1,950'}*</span>
               </div>
               <p className="text-[8px] text-zinc-400 font-medium">*Starting price for standard configuration with bulk slabs.</p>
            </div>
          </div>

          <div className="p-8 border-t border-zinc-100 bg-white space-y-3">
             <button 
               onClick={() => post.linkedProductId && onBuy(post.linkedProductId)}
               className="w-full bg-[#FF4D00] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-[#FF4D00]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
             >
               <ShoppingBag className="w-4 h-4" />
               Configure & Purchase
             </button>
             <div className="grid grid-cols-2 gap-3">
                <button className="py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
                <button className="py-3 bg-zinc-100 text-zinc-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  Remix AI
                </button>
             </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ViewToggle({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
        active ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-100 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-zinc-400">{icon}</div>
      <div>
        <p className="text-[11px] font-black text-zinc-900">{value}</p>
        <p className="text-[8px] font-mono text-zinc-400 font-bold uppercase">{label}</p>
      </div>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-zinc-50 pb-2">
      <span className="text-[10px] font-bold text-zinc-500 uppercase">{label}</span>
      <span className="text-[10px] font-black text-zinc-900 uppercase">{value}</span>
    </div>
  );
}
