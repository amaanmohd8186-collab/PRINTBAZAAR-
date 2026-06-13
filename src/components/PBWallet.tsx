import React, { useState } from 'react';
import { Wallet, History, ArrowDownLeft, ArrowUpRight, Plus, IndianRupee } from 'lucide-react';
import { UserStats, PaymentDetails } from '../types';
import CashfreeGateway from './CashfreeGateway';

interface PBWalletProps {
  stats: UserStats;
  userId: string;
  onUpdateStats: (stats: UserStats) => void;
  onBack: () => void;
}

export default function PBWallet({ stats, userId, onUpdateStats, onBack }: PBWalletProps) {
  const [addAmount, setAddAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleAddFunds = () => {
    const amt = parseFloat(addAmount);
    if (!amt || amt <= 0) return alert('Enter a valid amount to add.');
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (payment: PaymentDetails) => {
    setShowPayment(false);
    setIsProcessing(true);
    
    try {
      const amt = parseFloat(addAmount);
      const res = await fetch('/api/wallet/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: amt,
          txId: payment.txId
        })
      });
      const data = await res.json();
      
      if (data.success) {
        onUpdateStats({
          ...stats,
          walletBalance: stats.walletBalance + amt
        });
        setAddAmount('');
        alert(`₹${amt} added successfully to PB Wallet via Cashfree!`);
      } else {
        throw new Error(data.error || 'Failed to sync wallet');
      }
    } catch (err: any) {
      alert("Error adding funds: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = () => {
    if (stats.walletBalance < 100) return alert('Minimum ₹100 required for withdrawal to bank.');
    alert(`Withdrawal request of ₹${stats.walletBalance} sent to administrator. Amount will be credited to bank in 24-48 hours.`);
    onUpdateStats({
      ...stats,
      walletBalance: 0,
      pendingBalance: stats.pendingBalance + stats.walletBalance
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <button onClick={onBack} className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition">
        ← Back to Profile
      </button>

      <div className="bg-white rounded-[32px] border border-zinc-200/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-zinc-150 pb-5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-heavy text-slate-900 uppercase tracking-tight">PrintBazaar Wallet</h3>
            <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase mt-0.5">Manage balances & payouts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0F172A] p-5 rounded-[24px] text-white border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="w-16 h-16" /></div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Available Balance</span>
                <p className="text-3xl font-heavy text-emerald-400 font-mono mt-1 tracking-tight">₹{stats.walletBalance.toLocaleString('en-IN')}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={handleWithdraw} className="py-2 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase transition cursor-pointer">
                    Withdraw
                  </button>
                </div>
              </div>

              <div className="bg-zinc-50 p-5 rounded-[24px] border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Pending / Hold</span>
                <p className="text-2xl font-heavy text-zinc-800 font-mono mt-1 tracking-tight">₹{stats.pendingBalance.toLocaleString('en-IN')}</p>
                <span className="inline-block bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-2">
                  Processing
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-zinc-200 rounded-[20px] p-4 text-center">
                <span className="text-[9px] font-bold text-zinc-400 uppercase">Cashback</span>
                <p className="text-sm font-black text-slate-800 mt-1">₹{stats.cashback}</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-[20px] p-4 text-center">
                <span className="text-[9px] font-bold text-zinc-400 uppercase">Refunds</span>
                <p className="text-sm font-black text-slate-800 mt-1">₹{stats.refundBalance}</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-[20px] p-4 text-center">
                <span className="text-[9px] font-bold text-zinc-400 uppercase">Referrals</span>
                <p className="text-sm font-black text-slate-800 mt-1">₹{stats.referralEarnings}</p>
              </div>
            </div>

            {/* Top Up Section */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-[24px] p-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">Add Money to Wallet</h4>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <IndianRupee className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="number" 
                    value={addAmount} 
                    onChange={e => setAddAmount(e.target.value)}
                    placeholder="Amount to add"
                    className="w-full pl-9 pr-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm font-bold text-zinc-800 focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleAddFunds}
                  className="py-3 px-6 bg-[#FF4D00] hover:bg-[#E03E00] text-white rounded-xl text-xs font-black uppercase transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  {isProcessing ? 'Syncing...' : 'Add Funds'}
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                {[1000, 5000, 10000].map(amt => (
                  <button key={amt} onClick={() => setAddAmount(amt.toString())} className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold text-zinc-600 hover:border-[#FF4D00] hover:text-[#FF4D00] transition">
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-400" />
              Recent Transactions
            </h4>
            <div className="space-y-3">
              {[
                { type: 'Credit', desc: 'Added from Bank', amt: 5000, date: 'Today, 2:30 PM' },
                { type: 'Debit', desc: 'Order #PB-4451 (Business Cards)', amt: -1450, date: 'Yesterday, 11:20 AM' },
                { type: 'Credit', desc: 'Cashback - Mega Sale', amt: 120, date: 'Jun 10, 4:00 PM' }
              ].map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${tx.type === 'Credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {tx.type === 'Credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-800">{tx.desc}</p>
                      <p className="text-[9px] font-mono text-zinc-400">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-black font-mono ${tx.type === 'Credit' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {tx.type === 'Credit' ? '+' : ''}₹{Math.abs(tx.amt)}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full py-2.5 border border-zinc-200 rounded-xl text-[10px] font-bold uppercase text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition cursor-pointer">
              View All History
            </button>
          </div>
        </div>
      </div>

      {showPayment && (
        <CashfreeGateway
          amount={parseFloat(addAmount)}
          paymentTypeLabel="Wallet Recharge"
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}
