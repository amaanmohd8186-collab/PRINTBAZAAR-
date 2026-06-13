import React from 'react';
import { Gift, Zap, TrendingUp, Sparkles, Check } from 'lucide-react';
import { UserStats } from '../types';

interface LoyaltyRewardsProps {
  stats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
  onBack: () => void;
}

export default function LoyaltyRewards({ stats, onBack }: LoyaltyRewardsProps) {
  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <button onClick={onBack} className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition">
        ← Back to Profile
      </button>

      <div className="bg-white rounded-[32px] border border-zinc-200/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-zinc-150 pb-5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-heavy text-slate-900 uppercase tracking-tight">PrintBazaar Loyalty & Rewards</h3>
            <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase mt-0.5">Redeem points for discounts & perks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 rounded-[28px] text-white border border-indigo-800 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="w-24 h-24" /></div>
              
              <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest font-mono">Current Reward Points</span>
                <p className="text-5xl font-heavy text-white tracking-tight">{stats.rewardPoints} <span className="text-2xl text-indigo-400">Pts</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5 mt-5 relative z-10">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-indigo-300">Lifetime Points</span>
                  <span className="block text-sm font-black mt-0.5">{stats.lifetimePoints}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-indigo-300">Redeemed</span>
                  <span className="block text-sm font-black mt-0.5">{stats.redeemedPoints}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-[24px]">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">How to Earn Points</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 bg-white p-3 rounded-xl border border-zinc-150">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-900">Make Purchases</p>
                    <p className="text-[9px] text-zinc-500">Earn 10 pts per ₹100 spent</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 bg-white p-3 rounded-xl border border-zinc-150">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Zap className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-900">Refer a Friend</p>
                    <p className="text-[9px] text-zinc-500">Earn 500 pts per signup</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Available Rewards</h4>
            
            <div className="space-y-3">
              {[
                { pts: 500, desc: '₹50 Off next order', color: 'emerald' },
                { pts: 1000, desc: 'Free Delivery Voucher', color: 'blue' },
                { pts: 2500, desc: '₹300 Cash to Wallet', color: 'amber' },
                { pts: 5000, desc: 'Free Premium Upgrade (1 Month)', color: 'violet' }
              ].map((r, idx) => (
                <div key={idx} className={`p-4 rounded-[20px] border border-zinc-200 flex items-center justify-between transition cursor-pointer hover:border-zinc-400 ${stats.rewardPoints >= r.pts ? 'bg-white' : 'bg-zinc-50 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border border-zinc-200 bg-white shadow-xs`}>
                      {r.pts}
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-slate-900">{r.desc}</p>
                      {stats.rewardPoints < r.pts && (
                        <p className="text-[9px] text-zinc-500 mt-0.5">Need {r.pts - stats.rewardPoints} more points</p>
                      )}
                    </div>
                  </div>
                  <button 
                    disabled={stats.rewardPoints < r.pts}
                    className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${stats.rewardPoints >= r.pts ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-zinc-200 text-zinc-400'}`}
                  >
                    Redeem
                  </button>
                </div>
              ))}
            </div>
            
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-[20px] flex items-start gap-3">
              <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">Points can also be redeemed directly at the checkout page. 100 points = ₹10 value.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
