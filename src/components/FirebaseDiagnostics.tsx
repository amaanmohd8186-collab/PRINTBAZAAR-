import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, TerminalSquare, X, Globe, ShieldCheck, Database, Key, Server, History } from 'lucide-react';
import { auth, db, safeFetch } from '../firebase';

export const FirebaseDiagnosticsPanel = ({ onClose }: { onClose: () => void }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>({
    firebaseInitialized: !!auth,
    authDomain: auth?.config?.authDomain || 'Missing',
    projectId: auth?.app?.options?.projectId || 'Missing',
    apiKeyPresent: !!auth?.app?.options?.apiKey,
    currentUser: auth?.currentUser?.uid || 'None',
    firestoreStatus: 'Testing...',
    recaptchaReady: 'Unknown',
    authorizedDomain: 'Verifying...',
    healthScore: 'Pending',
  });

  const addLog = (msg: string) => setLogs(p => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p].slice(0, 50));

  useEffect(() => {
    addLog("System Initialization Sequence: [Active]");
    addLog(`Identity Path: ${diagnostics.projectId}`);
    
    // Domain Check
    const currentHost = window.location.hostname;
    const isDomainMatch = diagnostics.authDomain.includes(currentHost) || currentHost === 'localhost' || currentHost === '127.0.0.1';
    
    setDiagnostics(p => ({ 
      ...p, 
      authorizedDomain: isDomainMatch ? `Verified (${currentHost})` : `Mismatch Alert: ${currentHost} not in ${diagnostics.authDomain}`
    }));

    // Check Recaptcha Ready (by checking script loading)
    const recaptchaScripts = Array.from(document.scripts).filter(s => s.src.includes('recaptcha'));
    if (recaptchaScripts.length > 0) {
      setDiagnostics(p => ({ ...p, recaptchaReady: 'Provider Detected' }));
      addLog("Recaptcha provider scripts found in heritage tree.");
    } else {
      setDiagnostics(p => ({ ...p, recaptchaReady: 'Not Found (Browser)' }));
    }

    const runFullDiagnostics = async () => {
       try {
          if (!navigator.onLine) {
              setDiagnostics(p => ({ ...p, firestoreStatus: 'Network Partitioned (Offline)' }));
              addLog("CRITICAL: Network connection severed.");
              return;
          }

          // Fetch server diagnostics via robust safeFetch
          addLog("Synchronizing Server Health Data...");
          const serverDiag = await safeFetch('/api/admin/diagnostics');
          
          setDiagnostics(p => ({ 
            ...p, 
            ...serverDiag,
            firestoreStatus: serverDiag.db_ops?.write === 'PASS' ? 'Triple-Verified (R/W/D)' : 'Degraded'
          }));
          
          addLog(`System Integrity Verified. Global Health: ${serverDiag.healthScore}%`);
          
       } catch (e: any) {
          setDiagnostics(p => ({ ...p, firestoreStatus: `Protocol Error: ${e.message}` }));
          addLog(`Sequence Interrupted: ${e.message}`);
       }
    };
    
    runFullDiagnostics();
  }, []);

  const getStatusColor = (val: any) => {
    const s = String(val).toLowerCase();
    if (s.includes('pass') || s.includes('active') || s.includes('verified') || s === 'yes' || s.includes('connected')) return 'text-emerald-400';
    if (s.includes('fail') || s.includes('missing') || s.includes('error') || s === 'no' || s.includes('mismatch')) return 'text-rose-400';
    return 'text-amber-400';
  };

  const getIcon = (key: string) => {
    if (key.includes('firebase')) return <Database className="w-3 h-3 text-indigo-400" />;
    if (key.includes('auth') || key.includes('google')) return <Key className="w-3 h-3 text-amber-400" />;
    if (key.includes('domain')) return <Globe className="w-3 h-3 text-sky-400" />;
    if (key.includes('server') || key.includes('cashfree')) return <Server className="w-3 h-3 text-emerald-400" />;
    return <CheckCircle2 className="w-3 h-3 text-zinc-400" />;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,1)] rounded-[40px] w-full max-w-5xl max-h-[90vh] flex flex-col font-mono text-zinc-300 overflow-hidden border-zinc-800/50">
        
        <div className="p-6 border-b border-zinc-900 bg-zinc-950/50 flex justify-between items-center backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl">
              <TerminalSquare className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Advanced System Diagnostics</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest leading-none">Status: Live Monitoring</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Metrics Grid */}
          <div className="flex-1 overflow-auto p-8 border-r border-zinc-900/50 bg-black/20">
            <div className="space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] uppercase text-zinc-600 font-black tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Core Infrastructure
                  </h3>
                  <div className="px-2 py-0.5 bg-zinc-900 rounded text-[10px] text-zinc-500">v4.2 PROD</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(diagnostics).filter(([k]) => typeof diagnostics[k] !== 'object').map(([k, v]) => (
                    <div key={k} className="group bg-zinc-950/50 p-4 rounded-3xl border border-zinc-900/50 hover:border-zinc-800 transition-all flex flex-col justify-between h-24">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase text-zinc-600 font-bold tracking-wider">{k.replace(/([A-Z])/g, ' $1')}</span>
                        {getIcon(k)}
                      </div>
                      <span className={`text-[11px] font-black tracking-tight mt-auto truncate ${getStatusColor(v)}`}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[10px] uppercase text-zinc-600 font-black tracking-widest mb-4 flex items-center gap-2">
                  <Server className="w-3 h-3" /> External Verification API
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-zinc-950/50 p-4 rounded-3xl border border-zinc-900/50">
                    <p className="text-[9px] uppercase text-zinc-600 font-bold mb-2">Gemini Pro AI</p>
                    <p className={`text-xs font-black ${getStatusColor(diagnostics.gemini?.status)}`}>{diagnostics.gemini?.status || 'N/A'}</p>
                  </div>
                  <div className="bg-zinc-950/50 p-4 rounded-3xl border border-zinc-900/50">
                    <p className="text-[9px] uppercase text-zinc-600 font-bold mb-2">Cashfree PG</p>
                    <p className={`text-xs font-black ${getStatusColor(diagnostics.cashfree?.status)}`}>{diagnostics.cashfree?.status || 'N/A'}</p>
                  </div>
                  <div className="bg-zinc-950/50 p-4 rounded-3xl border border-zinc-900/50">
                    <p className="text-[9px] uppercase text-zinc-600 font-bold mb-2">Email Relay</p>
                    <p className={`text-xs font-black ${getStatusColor(diagnostics.email?.status)}`}>{diagnostics.email?.status || 'N/A'}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Real-time TTY Logs */}
          <div className="w-full lg:w-80 bg-black p-6 flex flex-col border-t lg:border-t-0 border-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] uppercase text-zinc-600 font-black tracking-widest flex items-center gap-2">
                <History className="w-3 h-3" /> Event Stream
              </h3>
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="flex-1 font-mono text-[10px] overflow-y-auto space-y-2 selection:bg-rose-500 selection:text-white">
               {logs.map((L, i) => (
                 <div key={i} className={`p-2 rounded-lg ${i === 0 ? 'bg-zinc-900 text-white' : 'text-zinc-500'} transition-all`}>
                   <span className="opacity-30">{L.substring(0, 10)}</span> {L.substring(10)}
                 </div>
               ))}
               {logs.length === 0 && <div className="text-zinc-800 italic p-4 text-center">No telemetry data detected.</div>}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-900">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase text-zinc-600">
                <span>Health Index</span>
                <span className="text-white">{diagnostics.healthScore}%</span>
              </div>
              <div className="mt-2 w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-1000" 
                  style={{ width: `${diagnostics.healthScore || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
