/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { 
  Loader2, 
  FileText, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt,
  ChevronLeft,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { WalletTransaction } from '../types';

interface PaymentHistoryProps {
  userId: string;
  onBack: () => void;
}

export default function PaymentHistory({ userId, onBack }: PaymentHistoryProps) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!userId || !db) return;

    const q = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as WalletTransaction[];
      setTransactions(txList);
      setLoading(false);
    }, (error) => {
      console.error("Wallet transactions fetch failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.type === filter;
    const matchesSearch = tx.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-[32px] border border-zinc-200/80 shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="bg-zinc-950 p-6 text-white shrink-0">
        <div className="flex items-center gap-4 mb-6">
          <button 
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-heavy uppercase tracking-tight">Transaction History</h2>
            <p className="text-[10px] font-mono text-zinc-400 font-bold uppercase mt-0.5">Real-time Financial Ledger</p>
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search by purpose or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF4D00] transition-all"
            />
          </div>
          <select 
            value={filter}
            onChange={(e: any) => setFilter(e.target.value)}
            className="bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-zinc-900">All</option>
            <option value="credit" className="bg-zinc-900">Credit</option>
            <option value="debit" className="bg-zinc-900">Debit</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#FF4D00] animate-spin" />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Syncing Ledger...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-300">
              <Receipt className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-heavy text-slate-800 uppercase tracking-tight">No transactions found</p>
              <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase">Perform settlements to populate history</p>
            </div>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div key={tx.id} className="bg-white rounded-2xl p-4 border border-zinc-150 hover:border-zinc-300 transition-colors shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-900 leading-tight">{tx.purpose.replace(/_/g, ' ')}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tx.timestamp)}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-300 select-none">•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase font-mono">ID: {tx.id.substring(0, 8)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(tx.txId || tx.id);
                            // Temporary feedback
                            const target = e.currentTarget;
                            const originalHtml = target.innerHTML;
                            target.innerHTML = 'COPIED';
                            target.classList.add('text-emerald-500');
                            setTimeout(() => {
                              target.innerHTML = originalHtml;
                              target.classList.remove('text-emerald-500');
                            }, 2000);
                          }}
                          className="p-1 hover:bg-zinc-100 rounded-md transition-colors group/copy relative"
                          title="Copy Full Transaction ID"
                        >
                          <Copy className="w-2.5 h-2.5 text-zinc-400 group-hover/copy:text-zinc-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-black font-mono ${tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                  </p>
                  <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                    tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 
                    tx.status === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {tx.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {tx.status === 'failed' && <AlertCircle className="w-2.5 h-2.5" />}
                    {tx.status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                    {tx.status}
                  </div>
                </div>
              </div>

              {/* Action for Receipt */}
              <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Status: Settlement {tx.status}</p>
                <button 
                  type="button"
                  onClick={() => alert('Generating receipt for ID: ' + tx.txId || tx.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-900 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  PDF Receipt
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-zinc-100 border-t border-zinc-200 flex items-center gap-3">
         <div className="w-8 h-8 rounded-full bg-[#FF4D00]/10 flex items-center justify-center text-[#FF4D00] shrink-0">
            <ShieldCheck className="w-4 h-4" />
         </div>
         <p className="text-[9px] text-zinc-500 font-bold uppercase leading-tight font-mono">
           All transactions are secured by PrintBazaar Financial Vault. End-to-end encrypted ledger audits maintained for 7 years.
         </p>
      </div>
    </div>
  );
}

import { ShieldCheck } from 'lucide-react';
