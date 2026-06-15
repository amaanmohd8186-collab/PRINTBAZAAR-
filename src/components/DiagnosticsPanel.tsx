/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Zap, 
  Server, 
  Lock, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search
} from 'lucide-react';
import { getAuthHeaders } from '../firebase';

interface DiagnosticResult {
  firebase: { status: string; details: string };
  firestore: { read: string; write: string; delete: string; latency: number; error?: string };
  cashfree: { auth: string; details?: string; error?: string };
  storage: { bucket: string };
  env: Record<string, boolean>;
  system: { nodeVersion: string; timestamp: string };
  apiVersion: string;
}

export default function DiagnosticsPanel() {
  const [data, setData] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/diagnostics', { headers });
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="w-8 h-8 text-[#FF4D00] animate-spin" />
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono italic">Running Forensic Audit...</p>
      </div>
    );
  }

  const StatusItem = ({ label, status, icon: Icon, details, highlight }: { label: string, status: string, icon: any, details?: string, highlight?: boolean }) => {
    const isPass = status === 'Connected' || status === 'PASS' || status === 'true' || !status.includes('FAIL');
    return (
      <div className={`bg-white border rounded-2xl p-4 flex items-start gap-4 transition-all ${highlight ? 'ring-2 ring-[#FF4D00]/20 border-[#FF4D00]/30' : 'border-zinc-150'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPass ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider truncate">{label}</h4>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {status}
            </span>
          </div>
          {details && <p className="text-[10px] text-zinc-400 font-mono mt-1 leading-relaxed line-clamp-2">{details}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heavy text-slate-900 tracking-tighter uppercase">System Diagnostics</h2>
          <p className="text-xs font-medium text-zinc-500 mt-1">Real-time status of backend services and environment variables.</p>
        </div>
        <button 
          onClick={fetchDiagnostics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase transition hover:bg-black disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-700">
           <AlertCircle className="w-5 h-5 shrink-0" />
           <p className="text-xs font-bold uppercase tracking-tight">API Error: {error}</p>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatusItem 
            label="Firebase Connection" 
            status={data.firebase.status} 
            icon={ShieldCheck} 
            details={data.firebase.details}
            highlight={data.firebase.status === 'Connected'}
          />
          <StatusItem 
            label="Firestore R/W/D" 
            status={`${data.firestore.read}/${data.firestore.write}/${data.firestore.delete}`} 
            icon={Database} 
            details={data.firestore.error || `Latency: ${data.firestore.latency}ms`}
          />
          <StatusItem 
            label="Cashfree PG" 
            status={data.cashfree.auth} 
            icon={Zap} 
            details={data.cashfree.details || data.cashfree.error}
          />
          <StatusItem 
            label="Firebase Storage" 
            status={data.storage.bucket !== 'Missing' ? 'Active' : 'FAIL'} 
            icon={Server} 
            details={data.storage.bucket}
          />
          <StatusItem 
            label="Node Runtime" 
            status={data.system.nodeVersion} 
            icon={Server} 
            details={`Synced at ${new Date(data.system.timestamp).toLocaleTimeString()}`}
          />
          <StatusItem 
            label="API Gateway" 
            status="Online" 
            icon={Lock} 
            details={`Version: ${data.apiVersion}`}
          />
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-zinc-100">
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Environment Verification
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data && Object.entries(data.env).map(([key, isSet]) => (
            <div key={key} className={`p-3 rounded-xl border flex items-center justify-between gap-2 shadow-sm ${isSet ? 'bg-emerald-50/30 border-emerald-100' : 'bg-rose-50/30 border-rose-100'}`}>
              <span className="text-[9px] font-bold text-zinc-600 truncate uppercase tracking-tight" title={key}>{key.replace('CASHFREE_', 'CF ').replace('TWILIO_', 'TW ')}</span>
              {isSet ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-white shrink-0 shadow-lg">
             <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-heavy text-slate-900 uppercase">Verification Logs</h4>
            <p className="text-[10px] text-zinc-500 font-medium mt-1 leading-relaxed">
              All system metrics are being periodically synchronized with the PrintBazaar Financial Ledger. 
              Unauthorized credential rotations or environment drifts are automatically logged for forensic escalation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
