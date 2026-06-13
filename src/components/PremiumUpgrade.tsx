import React, { useState } from 'react';
import { Sparkle, ShieldCheck, Zap, Rocket, Star, CheckCircle2 } from 'lucide-react';
import { UserStats, PaymentDetails } from '../types';
import CashfreeGateway from './CashfreeGateway';

interface PremiumUpgradeProps {
  stats: UserStats;
  userId: string;
  onUpdateStats: (stats: UserStats) => void;
  onBack: () => void;
}

export default function PremiumUpgrade({ stats, userId, onUpdateStats, onBack }: PremiumUpgradeProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: 'silver' | 'gold' | 'platinum'; name: string; price: number } | null>(null);

  const handleUpgradeClick = (id: 'silver' | 'gold' | 'platinum', name: string, price: number) => {
    setSelectedPlan({ id, name, price });
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (payment: PaymentDetails) => {
    if (!selectedPlan) return;
    setShowPayment(false);
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/premium/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          plan: selectedPlan.id,
          amount: selectedPlan.price,
          txId: payment.txId
        })
      });
      const data = await res.json();
      
      if (data.success) {
        onUpdateStats({
          ...stats,
          premiumStatus: selectedPlan.id,
          premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        alert(`🎉 Payment Successful! You are now a PrintBazaar ${selectedPlan.name} Member via Cashfree.`);
      } else {
        throw new Error(data.error || 'Failed to update membership');
      }
    } catch (err: any) {
      alert("Error upgrading membership: " + err.message);
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  if (stats.premiumStatus !== 'none') {
    return (
      <div className="space-y-6 animate-fadeIn text-left">
        <button onClick={onBack} className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition">
          ← Back to Profile
        </button>
        <div className="bg-[#0F172A] p-8 rounded-[32px] border border-slate-800 text-center text-white space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-[#FF4D00] rounded-2xl flex items-center justify-center border-4 border-slate-800 shadow-xl shadow-amber-500/20">
            <Sparkle className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-heavy uppercase tracking-tight text-white">
               Premium "{stats.premiumStatus.charAt(0).toUpperCase() + stats.premiumStatus.slice(1)}" Active
            </h3>
            <p className="text-sm text-zinc-400 font-mono mt-2 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Subscription validates till {new Date(stats.premiumExpiry || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <button onClick={onBack} className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition">
        ← Back to Profile
      </button>

      <div className="bg-white rounded-[32px] border border-zinc-200/80 p-6 xl:p-10 shadow-sm space-y-8">
        <div className="text-center space-y-2 max-w-sm mx-auto">
          <h3 className="text-2xl font-heavy text-slate-900 uppercase tracking-tight">PrintBazaar Premium</h3>
          <p className="text-[11px] font-mono text-zinc-500 font-bold uppercase mt-0.5">Elevate your brand's print experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Silver */}
          <div className="border border-zinc-200 rounded-[28px] p-6 hover:border-zinc-400 transition bg-zinc-50 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-zinc-200 rounded-xl flex items-center justify-center mb-4">
                <Star className="w-5 h-5 text-zinc-600" />
              </div>
              <h4 className="text-lg font-heavy uppercase tracking-tight text-slate-900">Silver Tier</h4>
              <p className="text-[10px] uppercase font-mono text-zinc-500 mt-1">₹499 / month</p>
              
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2 text-xs font-medium text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" /> 5% Order Discount
                </li>
                <li className="flex items-start gap-2 text-xs font-medium text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" /> Priority Ticket Support
                </li>
              </ul>
            </div>
            <button disabled={isProcessing} onClick={() => handleUpgradeClick('silver', 'Silver', 499)} className="w-full mt-8 py-3 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 rounded-[14px] text-xs font-black uppercase tracking-wider transition cursor-pointer">
              Choose Silver
            </button>
          </div>

          {/* Gold */}
          <div className="border-2 border-amber-400 rounded-[28px] p-6 bg-gradient-to-br from-amber-50 to-white shadow-xl relative flex flex-col justify-between scale-105 z-10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
              Most Popular
            </span>
            <div>
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-4 border border-amber-200">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="text-lg font-heavy uppercase tracking-tight text-slate-900">Gold Tier</h4>
              <p className="text-[10px] uppercase font-mono text-zinc-500 mt-1">₹1,499 / month</p>
              
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2 text-xs font-black text-amber-900">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> Unlimited AI Generations
                </li>
                <li className="flex items-start gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> Free Express Delivery
                </li>
                <li className="flex items-start gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> Access Premium Templates
                </li>
                <li className="flex items-start gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> 15% Flat Discount
                </li>
              </ul>
            </div>
            <button disabled={isProcessing} onClick={() => handleUpgradeClick('gold', 'Gold', 1499)} className="w-full mt-8 py-3 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-[14px] text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md">
              Upgrade to Gold
            </button>
          </div>

          {/* Platinum */}
          <div className="border border-slate-800 rounded-[28px] p-6 bg-[#0F172A] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-4">
                <Rocket className="w-5 h-5 text-[#FF4D00]" />
              </div>
              <h4 className="text-lg font-heavy uppercase tracking-tight text-white">Platinum B2B</h4>
              <p className="text-[10px] uppercase font-mono text-zinc-400 mt-1">₹4,999 / month</p>
              
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2 text-xs font-medium text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" /> Dedicated Account Manager
                </li>
                <li className="flex items-start gap-2 text-xs font-medium text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" /> Highest Slab Discounts (35%)
                </li>
                <li className="flex items-start gap-2 text-xs font-medium text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" /> API Webhook Access
                </li>
                <li className="flex items-start gap-2 text-xs font-medium text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-[#FF4D00] shrink-0 mt-0.5" /> White-label Shipping Dropship
                </li>
              </ul>
            </div>
            <button disabled={isProcessing} onClick={() => handleUpgradeClick('platinum', 'Platinum', 4999)} className="w-full mt-8 py-3 bg-white hover:bg-zinc-200 text-slate-900 rounded-[14px] text-xs font-black uppercase tracking-wider transition cursor-pointer">
              Go Platinum
            </button>
          </div>
        </div>

      </div>

      {showPayment && selectedPlan && (
        <CashfreeGateway
          amount={selectedPlan.price}
          paymentTypeLabel={`Membership Upgrade: ${selectedPlan.name}`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => { setShowPayment(false); setSelectedPlan(null); }}
        />
      )}
    </div>
  );
}
