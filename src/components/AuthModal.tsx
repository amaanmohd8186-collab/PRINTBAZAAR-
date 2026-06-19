import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';

export const AuthModal = ({ onClose, triggerToast }: { onClose: () => void, triggerToast: (msg: string, type?: 'success' | 'warn' | 'error') => void }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogle = async () => {
    setLoading(true);
    setErrorMsg('');
    
    // 15-second safety redirect timeout to prevent hanging the user
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setErrorMsg('Google Sign-In handshake took too long. Please verify your internet or tap "Open Google Sign In Again" below.');
    }, 15000);

    try {
      const provider = new GoogleAuthProvider();
      
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isInstagram = /Instagram/i.test(navigator.userAgent);
      const useRedirect = isMobileDevice || isInstagram;
      
      if (useRedirect) {
        console.log("Mobile/Embedded device detected. Initiating secure redirect auth flow.");
        await signInWithRedirect(auth, provider);
        clearTimeout(timeoutId);
        // The page will redirect away from here
      } else {
        console.log("Desktop device detected. Initiating popup auth flow.");
        await signInWithPopup(auth, provider);
        clearTimeout(timeoutId);
        triggerToast('Google Sign-In successful!', 'success');
        onClose();
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.error("🚀 [FIREBASE GOOGLE AUTH FAILURE]", e);
      setLoading(false);
      setErrorMsg(e.message || 'Google Auth Failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" id="auth-modal-overlay">
      <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200" id="auth-modal-card">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-black hover:bg-zinc-100 p-2 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 pt-10 pb-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-blue-500" />
          </div>
          
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900" id="auth-modal-title">
            Sign In Now
          </h2>
          <p className="text-sm text-zinc-500 mt-2 mb-8 leading-relaxed">
            Welcome to PrintBazaar Design Studio. Continue securely with your Google account.
          </p>

          {errorMsg && (
            <div className="mb-4 p-4 w-full bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-600 font-bold uppercase tracking-wider text-left">
              {errorMsg}
            </div>
          )}

          {errorMsg && (
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full mb-4 py-4 bg-[#FF4D00] hover:bg-[#ff5b14] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              id="fallback-auth-btn"
            >
              Open Google Sign In Again
            </button>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full relative py-4 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-50 text-zinc-900 border border-zinc-200 text-sm font-black uppercase tracking-widest rounded-2xl transition flex items-center justify-center gap-3 cursor-pointer shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <span>{loading ? 'Processing...' : 'Continue with Google'}</span>
          </button>
          
          <p className="text-[10px] text-zinc-400 mt-6 max-w-xs uppercase tracking-wider font-mono">
            Secure offline-free enterprise authentication system node.
          </p>
        </div>
      </div>
    </div>
  );
};
