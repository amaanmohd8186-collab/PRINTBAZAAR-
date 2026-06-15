import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, Trash2, ShieldAlert, Key, Mail, Clock, AlertTriangle } from 'lucide-react';

interface PrivacySecurityProps {
  stats: any;
  session: any;
  onUpdateStats: (stats: any) => void;
  onBack: () => void;
  onSignOut: () => void;
  triggerToast: (msg: string) => void;
}

export const PrivacySecurity: React.FC<PrivacySecurityProps> = ({
  session,
  onBack,
  triggerToast
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const initiateDelete = async () => {
    if (!password) return alert('Enter your current password to authorize deletion.');
    
    setLoading(true);
    try {
      const response = await fetch('/api/user/delete-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.email, password })
      });
      const data = await response.json();
      if (data.success) {
        alert('Verification link sent to your email. Click it to schedule 30-day deletion.');
        setShowConfirmDelete(false);
      } else {
        alert(data.error || 'Failed to initiate deletion.');
      }
    } catch (err) {
      alert('Network failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-[32px] border border-zinc-200/80 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="p-6 border-b border-zinc-150 flex items-center justify-between bg-zinc-50/50">
        <button onClick={onBack} className="p-2.5 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-zinc-600" />
        </button>
        <h3 className="text-sm font-heavy text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          Privacy & Data Protection Room
        </h3>
        <div className="w-10"></div>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security Overview */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black font-mono text-zinc-400 uppercase tracking-widest text-left">Security Safeguards</h4>
            
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
              <div className="p-2.5 bg-white rounded-xl text-emerald-600 border border-emerald-200 shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-tight">Active Encryption</p>
                <p className="text-[10px] text-emerald-700 leading-relaxed mt-0.5">Your sessions are protected with industry-standard 256-bit encryption. Multi-device sign-in is tracked for safety.</p>
              </div>
            </div>

            <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4">
              <div className="p-2.5 bg-white rounded-xl text-indigo-600 border border-indigo-200 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-indigo-900 uppercase tracking-tight">Verified Identity</p>
                <p className="text-[10px] text-indigo-700 leading-relaxed mt-0.5">Connected to: <b>{session.email}</b>. Critical changes will require email confirmation links.</p>
              </div>
            </div>
          </div>

          {/* Dangerous Actions */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black font-mono text-zinc-400 uppercase tracking-widest text-left">Advanced Controls</h4>
            
            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl text-rose-600 border border-rose-200">
                  <Trash2 className="w-4 h-4" />
                </div>
                <p className="text-xs font-black text-rose-900 uppercase tracking-tight">Erase Identity</p>
              </div>
              <p className="text-[10px] text-rose-700 leading-relaxed text-left">Permanent deletion includes the removal of all designs, order history, wallet balances, and AI usage credits. This action is critical.</p>
              
              {!showConfirmDelete ? (
                <button 
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full py-3 bg-white hover:bg-rose-600 hover:text-white border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Initiate Deletion Flow
                </button>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-400" />
                    <input 
                      type="password"
                      placeholder="Current Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-white border border-rose-200 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      disabled={loading}
                      onClick={initiateDelete}
                      className="flex-1 py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-rose-700 transition disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Confirming...' : 'Confirm'}
                    </button>
                    <button 
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-4 py-2.5 bg-white text-zinc-600 text-[10px] font-black uppercase tracking-wider rounded-xl border border-zinc-200 hover:bg-zinc-50 transition cursor-pointer"
                    >
                      Wait
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Deletion FAQ info */}
        <div className="pt-4 border-t border-zinc-150">
          <div className="flex items-start gap-4 text-left">
            <div className="p-3 bg-zinc-50 rounded-2xl text-zinc-400 border border-zinc-200">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">30-Day Recovery Buffer</p>
              <h5 className="text-sm font-heavy text-slate-800 uppercase tracking-tight mt-0.5">Peace of Mind Integrity</h5>
              <p className="text-[11px] text-zinc-500 leading-relaxed max-w-2xl mt-1">
                PrintBazaar implements a strict <b>30-day cool-off period</b>. After you confirm deletion via email, your account is suspended but not erased. Logging back in within 30 days will instantly restore your entire profile environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
