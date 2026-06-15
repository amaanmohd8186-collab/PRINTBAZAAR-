import React, { useState } from 'react';
import { Mail, Lock, User, X, Smartphone, ArrowRight, ShieldAlert, Key } from 'lucide-react';
import { auth, safeFetch } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';

export const AuthModal = ({ onClose, triggerToast }: { onClose: () => void, triggerToast: (msg: string, type?: 'success' | 'warn' | 'error') => void }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mobile: ''
  });

  const validatePassword = (password: string) => {
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter (A-Z).";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number (0-9).";
    return null;
  };

  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      triggerToast('Google Sign-In successful!', 'success');
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Google Auth Failed');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, form.email);
      triggerToast('Password reset email sent! Check your inbox.', 'success');
      setView('login');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (view === 'register') {
      if (!form.email || !form.password) {
        setErrorMsg("Please fill in email and password.");
        return;
      }
      if (!form.name) {
        setErrorMsg("Full legal name is required.");
        return;
      }

      // Strong password validation
      const passError = validatePassword(form.password);
      if (passError) {
        setErrorMsg(passError);
        return;
      }

      setLoading(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name });
        
        // Dispatch email verification link
        await sendEmailVerification(cred.user);
        
        triggerToast("Registration successful! Please check your email inbox to verify your account.", "success");
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Authentication Failed');
      } finally {
        setLoading(false);
      }
    } else {
      if (!form.email || !form.password) {
        setErrorMsg("Please fill in email and password.");
        return;
      }
      setLoading(true);
      try {
        const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
        if (!cred.user.emailVerified) {
          setErrorMsg("Please verify your email address before logging in. Check your inbox.");
          await auth.signOut(); // Restrict login
          setLoading(false);
          return;
        }
        triggerToast("Login successful!", "success");
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Authentication Failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-m" id="auth-modal-overlay">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200" id="auth-modal-card">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-black hover:bg-zinc-100 p-2 rounded-full transition"
          id="auth-modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 pt-8 pb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900" id="auth-modal-title">
            {view === 'login' && 'Welcome Back'}
            {view === 'register' && 'Create Account'}
            {view === 'forgot_password' && 'Reset Password'}
          </h2>
          <p className="text-xs font-mono text-zinc-500 mt-2" id="auth-modal-subtitle">
            Secure offline-free enterprise authentication system node.
          </p>

          {errorMsg && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-600 font-bold uppercase" id="auth-modal-error">
              {errorMsg}
            </div>
          )}

          {view === 'forgot_password' ? (
            <form onSubmit={handleForgotPassword} className="mt-6 space-y-4" id="forgot-password-form">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-black outline-none transition"
                  id="forgot-email-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 bg-black hover:bg-[#FF4D00] text-white text-xs font-black uppercase tracking-wider rounded-2xl transition disabled:opacity-50 cursor-pointer"
                id="forgot-submit-btn"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" id="password-login-form">
              {view === 'register' && (
                <div className="space-y-4 animate-in slide-in-from-top-2" id="register-name-field">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="Full Legal Name"
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-black outline-none transition"
                      id="register-name-input"
                    />
                  </div>
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-black outline-none transition"
                  id="login-email-input"
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-black outline-none transition"
                  id="login-password-input"
                />
              </div>

              {view === 'register' && (
                <p className="text-[10px] text-zinc-450 text-zinc-400 font-mono leading-normal pt-1" id="pass-hints">
                  💡 Must contain min 8 chars, 1 uppercase letter and 1 number.
                </p>
              )}

              {view === 'login' && (
                <div className="flex items-center justify-between pt-1 text-[11px] font-bold uppercase tracking-wider text-zinc-405 text-zinc-400">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-black transition">
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded accent-black" 
                    />
                    <span>Remember Me</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setView('forgot_password')}
                    className="hover:text-black font-bold uppercase transition"
                    id="forgot-pwd-trigger"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 bg-[#FF4D00] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-2xl transition disabled:opacity-50 cursor-pointer"
                id="submit-auth-btn"
              >
                {loading ? 'Processing...' : (view === 'login' ? 'Sign In Security Node' : 'Initialize Account')}
              </button>
            </form>
          )}

          {view !== 'forgot_password' && (
            <>
              <div className="relative mt-8 mb-6 text-center" id="social-divider">
                <span className="bg-white px-4 text-[10px] font-bold uppercase text-zinc-400 relative z-10">Or continue with</span>
                <div className="absolute top-1/2 left-0 w-full h-px bg-zinc-100 -translate-y-1/2" />
              </div>
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full relative py-3.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border border-zinc-200 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-3 cursor-pointer"
                id="google-sso-btn"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                <span>Google Single Sign-On</span>
              </button>
            </>
          )}
        </div>

        <div className="bg-zinc-50 border-t border-zinc-100 p-6 text-center" id="auth-modal-footer">
          <p className="text-[11px] font-medium text-zinc-500">
            {view === 'login' ? "Don't have an account? " : "Already established? "}
            <button 
              onClick={() => setView(view === 'login' ? 'register' : 'login')}
              className="text-black font-black hover:underline"
              id="auth-toggle-view"
            >
              {view === 'login' ? 'Register Now' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
