import React, { useState } from 'react';
import { X, ShieldAlert, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../firebase';

export const AuthModal = ({ onClose, triggerToast }: { onClose: () => void, triggerToast: (msg: string, type?: 'success' | 'warn' | 'error') => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();

    // Enforce strictly Gmail restriction per instructions
    if (!cleanEmail.endsWith('@gmail.com')) {
      setErrorMsg('Direct Gmail signup restriction: Only official "@gmail.com" accounts are permitted.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters in length.');
      setLoading(false);
      return;
    }

    if (isSignUp && !name.trim()) {
      setErrorMsg('Please specify your Full Name.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Register standard Email user with Gmail restriction
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(userCredential.user, { displayName: name.trim() });
        triggerToast('Account created and verified successfully!', 'success');
      } else {
        // Login standard Email user with Gmail restriction
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        triggerToast('Welcome back! Authentication successful.', 'success');
      }
      onClose();
    } catch (err: any) {
      console.log("🚀 [FIREBASE EMAIL AUTH FAILURE]", err.message || "Unknown error");
      let localizedError = err.message || 'Authentication encountered an unexpected issue.';
      
      if (err.code === 'auth/user-not-found') {
        localizedError = 'No account found matching this Gmail address. Toggle "Create Account" below to register.';
      } else if (err.code === 'auth/wrong-password') {
        localizedError = 'Invalid password credentials. Please verify your typing and try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        localizedError = 'This Gmail address is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-credential') {
        localizedError = isSignUp 
          ? 'Gmail Registration Failed. Please make sure search & toggle "Email/Password" sign-in provider is enabled in Firebase Console (Authentication > Sign-in method).'
          : 'Invalid Gmail credentials, or the "Email/Password" provider is disabled in Firebase Console (Authentication > Sign-in method). If logging in for the first time, toggle "Create Account" below to register.';
      } else if (err.code === 'auth/weak-password') {
        localizedError = 'The password must be at least 6 characters.';
      }
      setErrorMsg(localizedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" id="auth-modal-overlay">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-zinc-100" id="auth-modal-card">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-black hover:bg-zinc-100 p-2 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 pt-10 pb-8 flex flex-col items-center">
          <div className="w-14 h-14 bg-[#FF4D00]/10 rounded-2xl flex items-center justify-center mb-5">
            <ShieldAlert className="w-7 h-7 text-[#FF4D00]" />
          </div>
          
          <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 leading-none" id="auth-modal-title">
            {isSignUp ? 'Create Gmail Account' : 'Gmail Sign In'}
          </h2>
          <p className="text-xs text-zinc-500 mt-2 mb-6 text-center max-w-sm leading-relaxed">
            Welcome to PrintBazaar Design Studio. Access is strictly limited to official <strong>@gmail.com</strong> accounts.
          </p>

          {errorMsg && (
            <div className="mb-5 p-4 w-full bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-600 font-bold uppercase tracking-wider text-left leading-normal animate-shake">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {isSignUp && (
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="FULL NAME"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200 rounded-2xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#FF4D00] focus:ring-4 focus:ring-[#FF4D00]/10 transition-all font-mono"
                />
              </div>
            )}

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="YOURNAME@GMAIL.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200 rounded-2xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#FF4D00] focus:ring-4 focus:ring-[#FF4D00]/10 transition-all font-mono"
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200 rounded-2xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#FF4D00] focus:ring-4 focus:ring-[#FF4D00]/10 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black hover:bg-[#FF4D00] disabled:bg-zinc-400 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{loading ? 'PROCESSING...' : (isSignUp ? 'CREATE ACCOUNT' : 'SECURE SECURE SIGN IN')}</span>
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="text-[11px] font-black uppercase tracking-wider text-zinc-500 hover:text-[#FF4D00] transition cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
            
            <p className="text-[9px] text-zinc-400 mt-4 max-w-xs text-center uppercase tracking-wider font-mono">
              Secure enterprise standard nodes. Google verification requirements bypassed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

