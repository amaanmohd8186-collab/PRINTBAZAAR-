import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Activity, 
  UserCheck, 
  UserX, 
  RefreshCcw, 
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Fingerprint
} from 'lucide-react';
import { motion } from 'motion/react';
import { VerificationAudit } from '../types';
import { getAuthHeaders } from '../firebase';

interface VerificationAuditDashboardProps {
  onBack: () => void;
}

export const VerificationAuditDashboard: React.FC<VerificationAuditDashboardProps> = ({ onBack }) => {
  const [audits, setAudits] = useState<VerificationAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudits();
    const interval = setInterval(fetchAudits, 30000); // Polling for real-time updates
    return () => clearInterval(interval);
  }, []);

  const fetchAudits = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/verification/audits', { headers });
      const data = await res.json();
      if (data.success) setAudits(data.audits);
    } catch (err) {
      console.error("Audit fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <ShieldCheck className="text-emerald-500" size={18} />;
      case 'failure': return <ShieldAlert className="text-rose-500" size={18} />;
      case 'blocked': return <UserX className="text-slate-900" size={18} />;
      default: return <Activity size={18} />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'request': return 'OTP REQUEST';
      case 'verify': return 'LOGIN ATTEMPT';
      case 'block': return 'SECURITY LOCK';
      case 'resend': return 'RE-DISPATCH';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[700px]">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Shield className="text-orange-500" size={28} />
              Verification Intelligence
            </h2>
            <p className="text-slate-500 text-sm mt-1">Real-time seller KYC & fraud prevention audit logs</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-xs font-bold text-slate-700">SYSTEM LIVE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/30">
        {loading ? (
          <div className="h-full flex items-center justify-center">
             <RefreshCcw className="animate-spin text-slate-300" size={40} />
          </div>
        ) : audits.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
             <Fingerprint size={60} strokeWidth={1.5} />
             <p className="font-medium">No security events recorded yet.</p>
          </div>
        ) : (
          audits.map((audit, idx) => (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={audit.id}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  audit.status === 'success' ? 'bg-emerald-50' : 
                  audit.status === 'failure' ? 'bg-rose-50' : 'bg-slate-100'
                }`}>
                  {getStatusIcon(audit.status)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-tighter text-slate-400 uppercase">
                      {getEventLabel(audit.type)}
                    </span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(audit.timestamp?.seconds * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-900 font-bold text-sm truncate max-w-[200px]">
                    {audit.identifier}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provider</p>
                   <p className="text-xs font-medium text-slate-600">{audit.provider}</p>
                </div>
                <div className="h-8 w-px bg-slate-100" />
                <button className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all">
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="p-4 bg-slate-900 flex items-center justify-between">
         <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-white/60 text-xs">
             <UserCheck size={14} />
             <span>324 Verifications</span>
           </div>
           <div className="flex items-center gap-2 text-white/60 text-xs">
             <UserX size={14} />
             <span>8 Fraud Blocks</span>
           </div>
         </div>
         <p className="text-[10px] text-white/30 font-mono">NODE_ENV: PRODUCTION_ENGINE v4.0.2</p>
      </div>
    </div>
  );
};
