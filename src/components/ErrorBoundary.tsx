// @ts-nocheck
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleClearStorageAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-6 sm:p-12 font-sans select-none">
          {/* Top subtle grid or element */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,77,0,0.08)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto w-full my-auto space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FF4D00] text-black flex items-center justify-center font-black text-xl shadow-[0_0_30px_rgba(255,77,0,0.3)]">
                PB
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight leading-none text-zinc-100">
                  PRINT<span className="text-[#FF4D00]">BAZAAR</span> DIAGNOSTICS
                </h1>
                <p className="text-[10px] font-mono mt-1 text-zinc-500 uppercase tracking-widest">Pre-press Application Guard</p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-[#FF4D00] to-amber-500" />
              
              <div className="space-y-2">
                <span className="text-[9px] font-black bg-red-950/40 text-red-400 border border-red-900/35 px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider font-mono">
                  Runtime Crash Intercepted
                </span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-zinc-100 font-sans">
                  The UI encountered an unexpected rendering logic error
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  To ensure 50:50 offset press operations are transparent, our safety net caught this failure. Clear cache/storage or review stacktrace below to proceed.
                </p>
              </div>

              {/* Stacktrace wrapper */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">System Error Details</span>
                <div className="bg-black/40 border border-zinc-850 p-4 rounded-2xl overflow-x-auto text-left max-h-[220px] font-mono text-[10.5px] leading-relaxed text-red-300 whitespace-pre">
                  <p className="font-bold text-red-400 filter drop-shadow-[0_0_5px_rgba(239,68,68,0.2)]">
                    {this.state.error?.toString() || "Unknown Error"}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <p className="mt-2 text-zinc-400 leading-normal text-[10px]">
                      {this.state.errorInfo.componentStack}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions panel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={this.handleClearStorageAndReload}
                  className="w-full py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-extrabold uppercase tracking-widest text-[11px] rounded-2xl cursor-pointer shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  🧹 Clear App Settings &amp; Reload
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full py-3.5 bg-neutral-850 hover:bg-[#FF4D00] text-white font-extrabold uppercase tracking-widest text-[11px] rounded-2xl cursor-pointer transition active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  🔄 Simple Page Reload
                </button>
              </div>
            </div>
          </div>

          {/* Meticulous copyright lines at bottom */}
          <div className="relative z-10 w-full text-center mt-8 text-[9px] font-mono tracking-widest text-zinc-650 uppercase">
            PrintBazaar Secure Sandboxed Workspace Context &bull; Build 2026
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
