import React, { useState } from 'react';
import { Sparkles, Zap, Image as ImageIcon, FileText, CheckCircle2 } from 'lucide-react';
import { UserStats, PaymentDetails } from '../types';
import CashfreeGateway from './CashfreeGateway';

interface AICreditsProps {
  stats: UserStats;
  userId: string;
  onUpdateStats: (stats: UserStats) => void;
  onBack: () => void;
}

export default function AICredits({ stats, userId, onUpdateStats, onBack }: AICreditsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plan: number; credits: number; tag: string } | null>(null);

  const handlePayClick = (plan: { plan: number; credits: number; tag: string }) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (payment: PaymentDetails) => {
    if (!selectedPlan) return;
    setShowPayment(false);
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/credits/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          packageId: selectedPlan.tag,
          amount: selectedPlan.plan,
          credits: selectedPlan.credits,
          txId: payment.txId
        })
      });
      const data = await res.json();
      
      if (data.success) {
        onUpdateStats({
          ...stats,
          aiCredits: stats.aiCredits + selectedPlan.credits
        });
        alert(`🎉 Successfully purchased ${selectedPlan.credits} Credits!`);
      } else {
        throw new Error(data.error || 'Failed to sync credits');
      }
    } catch (err: any) {
      alert("Error adding credits: " + err.message);
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <button onClick={onBack} className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition">
        ← Back to Profile
      </button>

      <div className="bg-white rounded-[32px] border border-zinc-200/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-zinc-150 pb-5">
          <div className="p-3 bg-[#FF4D00]/10 text-[#FF4D00] rounded-2xl border border-[#FF4D00]/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-heavy text-slate-900 uppercase tracking-tight">Design Credits</h3>
            <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase mt-0.5">Manage design and production tokens</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            
            <div className="bg-gradient-to-br from-[#0F172A] to-neutral-900 p-6 rounded-[28px] text-white border border-slate-800 shadow-xl space-y-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Zap className="w-24 h-24" /></div>
              
              <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Available Credits</span>
                <p className="text-5xl font-black text-[#FF4D00] tracking-tight">{stats.aiCredits} <span className="text-2xl text-zinc-500 font-heavy">🎇</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5 relative z-10">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="block text-[9px] uppercase font-bold text-zinc-400">Total Used</span>
                  <span className="block text-sm font-black mt-0.5">{stats.usedCredits}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="block text-[9px] uppercase font-bold text-zinc-400">Account Type</span>
                  <span className="block text-sm font-black mt-0.5 text-emerald-400">Standard</span>
                </div>
              </div>
            </div>

              <h4 className="text-[10px] font-black uppercase text-zinc-800">Usage Guide</h4>
              <ul className="space-y-2 text-[11px] font-medium text-zinc-600">
                <li className="flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5 text-blue-500" /> Background Removal (2 🎇)</li>
                <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-orange-500" /> Image Enhancement (5 🎇)</li>
                <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Personalized Templates (10 🎇)</li>
                <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-emerald-500" /> Professional Layouts (15 🎇)</li>
              </ul>

          </div>

          <div className="lg:col-span-2 space-y-5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Recharge Credits</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {[
                { plan: 99, credits: 100, tag: 'Starter' }, 
                { plan: 399, credits: 500, tag: 'Value' }, 
                { plan: 699, credits: 1000, tag: 'Popular' }, 
                { plan: 2499, credits: 5000, tag: 'Enterprise' }
              ].map((p, idx) => (
                <div key={idx} className="bg-white border-2 border-zinc-150 hover:border-[#FF4D00]' rounded-[24px] p-5 transition cursor-pointer hover:shadow-md relative overflow-hidden group">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#FF4D00] bg-[#FF4D00]/10 px-2.5 py-1 rounded-full">{p.tag}</span>
                  <div className="mt-4 space-y-1">
                    <p className="text-3xl font-heavy text-slate-900 tracking-tight">{p.credits} <span className="text-sm text-zinc-400 font-bold">Credits</span></p>
                    <p className="text-xs font-mono font-bold text-zinc-500">₹{p.plan} + GST</p>
                  </div>
                  <button 
                    disabled={isProcessing}
                    onClick={() => handlePayClick(p)}
                    className="w-full mt-5 py-2.5 bg-zinc-100 group-hover:bg-[#FF4D00] text-zinc-800 group-hover:text-white rounded-xl text-[10px] font-black uppercase transition flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" /> Buy Now
                  </button>
                </div>
              ))}

            </div>

            <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-[20px] p-4 flex gap-4 items-center">
              <div className="p-3 bg-white rounded-2xl shrink-0"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
              <div>
                <h5 className="text-[11px] font-bold text-slate-900 uppercase">Earn Free Credits</h5>
                <p className="text-[10px] text-zinc-600 mt-0.5 max-w-[300px]">Review an order or refer a friend to instantly receive 200 free Credits to your account.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showPayment && selectedPlan && (
        <CashfreeGateway
          amount={selectedPlan.plan}
          paymentTypeLabel={`Recharge: ${selectedPlan.credits} Credits`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => { setShowPayment(false); setSelectedPlan(null); }}
        />
      )}
    </div>
  );
}
