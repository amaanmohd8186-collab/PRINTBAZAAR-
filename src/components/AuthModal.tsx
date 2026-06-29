import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  signInWithCustomToken
} from '../firebase';

export const AuthModal = ({ onClose, triggerToast }: { onClose: () => void, triggerToast: (msg: string, type?: 'success' | 'warn' | 'error') => void }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMsg('Please specify both your Email and Password.');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      triggerToast('Signed in successfully!', 'success');
      onClose();
    } catch (err: any) {
      console.error("[AUTH FAILURE]", err);
      let localizedError = 'Invalid credentials. Please verify your details and try again.';
      if (err.code === 'auth/user-not-found') {
        localizedError = 'No account exists with this email address.';
      } else if (err.code === 'auth/wrong-password') {
        localizedError = 'Incorrect password. Please try again.';
      }
      setErrorMsg(localizedError);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password || !name.trim()) {
      setErrorMsg('All registration fields are mandatory.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(userCredential.user, { displayName: name.trim() });
      
      // If user specified phone, sync phone to Firestore user profile
      try {
        const { db, doc, setDoc, serverTimestamp } = await import('../firebase');
        if (db && phone.trim()) {
          const userRef = doc(db, 'users', userCredential.user.uid);
          await setDoc(userRef, {
            phoneNumber: phone.trim(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      } catch (err) {
        console.warn("Could not sync phone detail:", err);
      }

      triggerToast('Account registered successfully!', 'success');
      onClose();
    } catch (err: any) {
      console.error("[AUTH FAILURE]", err);
      let localizedError = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        localizedError = 'An account already exists with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        localizedError = 'Please specify a valid email address.';
      }
      setErrorMsg(localizedError);
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please specify your registered email address.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(cleanEmail);
      setSuccessMsg('A password reset link has been dispatched to your email address.');
      triggerToast('Password reset link sent!', 'success');
    } catch (err: any) {
      console.error("[FORGOT PASSWORD FAIL]", err);
      let localizedError = 'Failed to request password reset. Please verify your email.';
      if (err.code === 'auth/user-not-found') {
        localizedError = 'No account is registered under this email address.';
      }
      setErrorMsg(localizedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md" id="auth-modal-overlay">
      <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-zinc-100 flex flex-col" id="auth-modal-card">
        
        {/* Decorative Top Accent */}
        <div className="h-2 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 w-full" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-black hover:bg-zinc-100 p-2 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-8 pt-8 pb-8 flex flex-col">
          
          {/* Header section */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 leading-none">
              {activeTab === 'login' && 'Sign In'}
              {activeTab === 'register' && 'Create Account'}
              {activeTab === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-xs text-zinc-500 mt-2 text-center leading-relaxed">
              {activeTab === 'login' && 'Access PrintBazaar Canva-style Creative Studio'}
              {activeTab === 'register' && 'Join India’s premium commercial printing destination'}
              {activeTab === 'forgot' && 'Enter your email to receive recovery instructions'}
            </p>
          </div>

          {/* Quick tab switchers for Login/Register (only visible in those states) */}
          {(activeTab === 'login' || activeTab === 'register') && (
            <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'login' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'register' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                Register
              </button>
            </div>
          )}

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-xs text-rose-600 font-medium">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* LOGIN FLOW */}
          {activeTab === 'login' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="EMAIL ADDRESS"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono"
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
                  className="w-full pl-11 pr-12 py-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs mt-2">
                <label className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-wider select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500 h-4 w-4"
                  />
                  <span>Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-orange-500 font-bold uppercase tracking-wider hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-zinc-900 hover:bg-orange-600 disabled:bg-zinc-400 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

            </form>
          )}

          {/* REGISTER FLOW */}
          {activeTab === 'register' && (
            <form onSubmit={handleEmailRegister} className="space-y-4">
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
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="EMAIL ADDRESS"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  placeholder="MOBILE NUMBER (OPTIONAL)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="PASSWORD (MIN 6 CHARACTERS)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono"
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
                className="w-full py-3.5 bg-zinc-900 hover:bg-orange-600 disabled:bg-zinc-400 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </form>
          )}



          {/* FORGOT PASSWORD FLOW */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="ENTER REGISTERED EMAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-zinc-900 hover:bg-orange-600 disabled:bg-zinc-400 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'Sending Request...' : 'Send Recovery Instructions'}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className="w-full py-2.5 mt-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-900 flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* Secure watermark */}
          <p className="text-[9px] text-zinc-400 mt-6 text-center uppercase tracking-wider font-mono">
            🛡️ PRINTBAZAAR ULTRA ENCRYPTED 2026
          </p>

        </div>
      </div>
    </div>
  );
};
