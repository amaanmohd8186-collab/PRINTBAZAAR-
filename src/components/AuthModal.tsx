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
      setErrorMsg('Please use a valid @gmail.com account for secure access.');
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
        triggerToast('Welcome! Your account is ready.', 'success');
      } else {
        // Login standard Email user with Gmail restriction
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        triggerToast('Welcome back!', 'success');
      }
      onClose();
    } catch (err: any) {
      console.log("🚀 [AUTH FAILURE]", err.message || "Unknown error");
      let localizedError = 'Something went wrong. Please try again.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        localizedError = 'Invalid login details. Please check and try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        localizedError = 'This account already exists. Please sign in instead.';
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
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-zinc-500 mt-2 mb-6 text-center max-w-sm leading-relaxed">
              Experience the future of personalized printing with PrintBazaar.
            </p>

          {errorMsg && (
            <div className="mb-5 p-4 w-full bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-600 font-bold uppercase tracking-wider text-left leading-normal animate-shake">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Divider */}
            <div className="relative flex items-center gap-4 my-6">
              <div className="h-[1px] flex-1 bg-zinc-100" />
              <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">or continue with</span>
              <div className="h-[1px] flex-1 bg-zinc-100" />
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  setLoading(true);
                  const { signInWithGoogle } = await import('../firebase');
                  await signInWithGoogle();
                  triggerToast('Signed in successfully!', 'success');
                  onClose();
                } catch (err: any) {
                  setErrorMsg(err.message || 'Google sign-in failed.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-3 hover:border-zinc-300"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale opacity-70" alt="Google" />
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center gap-4 my-6">
              <div className="h-[1px] flex-1 bg-zinc-100" />
              <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Email Access</span>
              <div className="h-[1px] flex-1 bg-zinc-100" />
            </div>

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
              <span>{loading ? 'Signing You In...' : (isSignUp ? 'Create Account' : 'Sign In')}</span>
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
              Privacy protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

