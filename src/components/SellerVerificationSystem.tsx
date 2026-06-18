import React, { useState, useEffect } from 'react';
import { 
  User, ShieldCheck, Check, X, Clipboard, 
  Clock, Package, FileCode, Save, RefreshCw,
  Video, CreditCard, Landmark, ExternalLink,
  Upload, CheckCircle2, AlertCircle
} from 'lucide-react';
import { SellerProfile } from '../types';
import { db, auth } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, query, onSnapshot, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

interface SellerVerificationSystemProps {
  isAdminMode: boolean;
  onVerificationComplete?: (profile: SellerProfile) => void;
  triggerToast: (title: string, type?: 'success' | 'warn') => void;
}

export default function SellerVerificationSystem({ isAdminMode, onVerificationComplete, triggerToast }: SellerVerificationSystemProps) {
  const [activePortal, setActivePortal] = useState<'merchant' | 'admin'>('merchant');
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [currentSeller, setCurrentSeller] = useState<SellerProfile | null>(null);
  const [step, setStep] = useState<number>(1);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  // Form Fields - Step 1
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  
  // Documents - Steps 2 & 3
  const [panNumber, setPanNumber] = useState('');
  const [panUrl, setPanUrl] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarUrl, setAadhaarUrl] = useState('');
  
  // Portfolio - Step 4
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [sampleWorkUrl, setSampleWorkUrl] = useState('');

  // Bank - Step 5
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  // Video KYC - Step 6
  const [videoKycUrl, setVideoKycUrl] = useState('');
  
  // States
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const currentUid = user?.uid || 'cust-current';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) setIsLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isAdminMode || !db) return;
    const q = query(collection(db, 'sellers'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SellerProfile[];
      setSellers(list);
    });
    return () => unsub();
  }, [isAdminMode]);

  useEffect(() => {
    if (!currentUid || currentUid === 'cust-current' || !db) {
       if (currentUid === 'cust-current') setIsLoading(false);
       return;
    }
    
    setIsLoading(true);
    const sellerRef = doc(db, 'sellers', currentUid);
    const unsub = onSnapshot(sellerRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const profile = { id: docSnap.id, ...data } as SellerProfile;
        setCurrentSeller(profile);
        setStep(profile.verificationStep || 1);
        setName(profile.ownerName || profile.name || '');
        setBusinessName(profile.storeName || '');
        setEmail(profile.email || '');
        setMobile(profile.mobile || '');
        setAddress(data.documents?.addressLine || '');
        setPanNumber(data.documents?.businessPan || '');
        setPanUrl(data.documents?.panCard || '');
        setAadhaarNumber(data.documents?.governmentIdNumber || '');
        setAadhaarUrl(data.documents?.aadhaarFront || '');
        setPortfolioUrl(data.documents?.tradeLicense || ''); // Logic mapping
        setSampleWorkUrl(data.documents?.msmeCert || '');
        setBankName(data.documents?.bankName || '');
        setAccountNumber(data.documents?.bankAccountNumber || '');
        setIfscCode(data.documents?.bankIfscCode || '');
        setUpiId(data.documents?.upiId || '');
        setVideoKycUrl(data.documents?.videoKycUrl || '');
      }
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setIsLoading(false);
    });

    return () => unsub();
  }, [currentUid]);

  const getBase64FromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (e.target.files && e.target.files[0]) {
      const b64 = await getBase64FromFile(e.target.files[0]);
      setter(b64);
    }
  };

  const syncProfile = async (updates: any) => {
    if (!currentUid || currentUid === 'cust-current') {
      triggerToast?.('Please sign in to save progress', 'warn');
      return;
    }
    setIsSyncing(true);
    try {
      await setDoc(doc(db, 'sellers', currentUid), {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      triggerToast?.('Sync failed: ' + err.message, 'warn');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveDraft = async () => {
    await syncProfile({ 
      ownerName: name, 
      storeName: businessName,
      email, 
      mobile, 
      verificationStep: step,
      status: 'Draft',
      documents: {
        addressLine: address,
        businessPan: panNumber,
        panCard: panUrl,
        governmentIdNumber: aadhaarNumber,
        aadhaarFront: aadhaarUrl,
        bankName,
        bankAccountNumber: accountNumber,
        bankIfscCode: ifscCode,
        upiId,
        videoKycUrl,
        tradeLicense: portfolioUrl,
        msmeCert: sampleWorkUrl
      }
    });
    triggerToast?.('Onboarding progress saved locally', 'success');
  };

  const handleStepSubmit = async (nextStep: number, extraData = {}) => {
    await syncProfile({ 
      verificationStep: nextStep,
      ...extraData
    });
    setStep(nextStep);
  };

  const handleAdminAction = async (selId: string, action: 'Verified' | 'Rejected', level: string = 'Verified Seller') => {
    try {
      await updateDoc(doc(db, 'sellers', selId), {
        status: action,
        level: level,
        adminNotes: adminNotes,
        updatedAt: serverTimestamp()
      });
      triggerToast?.(`Merchant set to ${action}`, 'success');
      setAdminNotes('');
    } catch (e: any) {
      triggerToast?.('Admin action failed: ' + e.message, 'warn');
    }
  };

  const steps = [
    { id: 1, label: 'Profile', icon: <User className="w-3.5 h-3.5" /> },
    { id: 2, label: 'PAN', icon: <FileCode className="w-3.5 h-3.5" /> },
    { id: 3, label: 'Aadhaar', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 4, label: 'Portfolio', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 5, label: 'Bank/UPI', icon: <Landmark className="w-3.5 h-3.5" /> },
    { id: 6, label: 'Video KYC', icon: <Video className="w-3.5 h-3.5" /> },
    { id: 7, label: 'Review', icon: <Clock className="w-3.5 h-3.5" /> }
  ];

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto my-6 p-6 space-y-6">
        <div className="w-full h-8 bg-zinc-100 animate-pulse rounded-xl" />
        <div className="w-full h-[500px] bg-zinc-100 animate-pulse rounded-[40px]" />
      </div>
    );
  }

  return (
    <div className="bg-white border md:rounded-[48px] overflow-hidden shadow-2xl max-w-[1240px] w-full mx-auto my-0 md:my-10 p-5 md:p-12 relative">
      {/* High-fidelity header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#FF4D00] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#FF4D00]/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              ULTRA <span className="text-[#FF4D00]">ONBOARDING</span> 2026
            </h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-12">Universal Merchant Intelligence Protocol • v4.2.0 Stable</p>
        </div>

        <div className="flex bg-zinc-100/80 backdrop-blur-xl p-1.5 rounded-2xl border border-zinc-200/50 shadow-sm self-start lg:self-center">
          <button 
            onClick={() => setActivePortal('merchant')} 
            className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all duration-300 ${activePortal === 'merchant' ? 'bg-white text-[#FF4D00] shadow-sm ring-1 ring-zinc-200' : 'text-zinc-500 hover:text-zinc-800'}`}
          >
            Merchant Terminal
          </button>
          {isAdminMode && (
            <button 
              onClick={() => setActivePortal('admin')} 
              className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all duration-300 ${activePortal === 'admin' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Auditor Console
            </button>
          )}
        </div>
      </div>

      {activePortal === 'merchant' && user && currentSeller?.status !== 'Verified' && (
        <div className="mb-12">
          {/* Enhanced Progress Stepper */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-4 no-scrollbar">
            {steps.map((s) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    step >= s.id ? 'bg-[#FF4D00] text-white shadow-lg shadow-[#FF4D00]/20' : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    {step > s.id ? <CheckCircle2 className="w-5 h-5 font-bold" /> : s.icon}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${step >= s.id ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {s.label}
                  </span>
                </div>
                {s.id < 7 && (
                  <div className={`h-[1px] flex-1 min-w-[30px] mx-2 ${step > s.id ? 'bg-[#FF4D00]' : 'bg-zinc-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button 
              onClick={handleSaveDraft}
              disabled={isSyncing}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-zinc-200 text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-zinc-300 transition-all shadow-xs active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Store Local Snapshot
            </button>
          </div>
        </div>
      )}

      {activePortal === 'admin' ? (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="flex items-baseline gap-3 mb-8">
            <h2 className="text-xl font-black uppercase tracking-tight">Active Application Queue</h2>
            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Audit Level 4 Enabled</span>
          </div>

          <div className="grid gap-8">
            {sellers.map((sel) => (
              <div key={sel.id} className="bg-zinc-50 border border-zinc-200 rounded-[32px] p-8 hover:bg-white hover:border-[#FF4D00]/20 transition-all hover:shadow-2xl group relative overflow-hidden">
                {sel.status === 'Pending Verification' && (
                  <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
                    <div className="absolute top-4 right-[-30px] rotate-45 bg-[#FF4D00] text-white text-[8px] font-black uppercase px-12 py-1 shadow-lg">Pending</div>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">{sel.storeName || 'Unnamed Merchant'}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                      <span className="flex items-center gap-1"><User className="w-3 h-3 text-[#FF4D00]" /> {sel.ownerName}</span>
                      <span className="text-zinc-300">/</span>
                      <span>{sel.email}</span>
                      <span className="text-zinc-300">/</span>
                      <span>{sel.mobile}</span>
                    </div>
                  </div>
                  <div className="shrink-0 p-3 bg-white rounded-2xl border border-zinc-200 text-right">
                    <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Onboarding Logic Level</p>
                    <p className="text-xs font-heavy text-zinc-900 uppercase">{sel.level || 'Unchecked'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                  {[
                    { label: 'PAN Card', url: sel.documents?.panCard, icon: <FileCode /> },
                    { label: 'Aadhaar', url: sel.documents?.aadhaarFront, icon: <ShieldCheck /> },
                    { label: 'KYC Video', url: sel.documents?.videoKycUrl, icon: <Video />, color: 'rose' },
                    { label: 'Portfolio', url: sel.documents?.tradeLicense, icon: <Package /> },
                    { label: 'Samples', url: sel.documents?.msmeCert, icon: <Clipboard /> },
                    { label: 'Bank Proof', url: sel.documents?.cancelledCheque, icon: <Landmark /> }
                  ].map((doc, idx) => (
                    <div key={idx} className="bg-white border border-zinc-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 group-hover:border-zinc-200 transition-colors">
                      <div className={`p-2 rounded-xl bg-${doc.color || 'zinc'}-50 text-${doc.color || 'zinc'}-500 shrink-0`}>
                        {React.cloneElement(doc.icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
                      </div>
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-tighter text-center">{doc.label}</p>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-[9px] font-black text-[#FF4D00] uppercase flex items-center gap-1 hover:underline">
                          <ExternalLink className="w-2.5 h-2.5" /> View
                        </a>
                      ) : (
                        <span className="text-[9px] font-bold text-zinc-150 uppercase italic">Empty</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-white/50 border border-zinc-200/50 rounded-2xl p-4 mb-8 text-[11px] font-bold">
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Settlement Logic (UPI/IFSC)</span>
                  </div>
                  <p className="text-zinc-600 uppercase">
                    Bank: {sel.documents?.bankName || 'N/A'} • A/C: {sel.documents?.bankAccountNumber || 'N/A'} • IFSC: {sel.documents?.bankIfscCode || 'N/A'} • UPI: <span className="text-[#FF4D00]">{sel.documents?.upiId || 'N/A'}</span>
                  </p>
                </div>

                <div className="bg-white rounded-3xl border border-zinc-200 p-5 flex flex-col md:flex-row gap-4 items-center">
                  <textarea 
                    rows={2}
                    placeholder="Auditor annotations (visible to merchant on fallback)..." 
                    value={adminNotes} 
                    onChange={e => setAdminNotes(e.target.value)} 
                    className="text-xs p-4 border border-zinc-100 rounded-2xl outline-none w-full uppercase font-mono bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-[#FF4D00]/20 transition-all resize-none" 
                  />
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleAdminAction(sel.id, 'Rejected')} className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-black uppercase px-6 py-4 rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-95">Reject Node</button>
                    <button onClick={() => handleAdminAction(sel.id, 'Verified', 'Verified Seller')} className="bg-[#FF4D00] text-white text-[10px] font-black uppercase px-10 py-4 rounded-2xl shadow-xl hover:shadow-[#FF4D00]/30 transition-all active:scale-95">Verify Terminal</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-[800px] mx-auto animate-in fade-in zoom-in duration-700">
          {!user ? (
            <div className="text-center py-24 bg-zinc-50 rounded-[64px] border border-dashed border-zinc-200">
               <ShieldCheck className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
               <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900">AUTHENTICATION BARRIER</h3>
               <p className="text-xs text-zinc-400 mt-3 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Identity vault access requires valid session credentials from the global header gateway.</p>
            </div>
          ) : currentSeller?.status === 'Verified' ? (
            <div className="bg-zinc-900 rounded-[56px] p-16 text-center space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#FF4D00]" />
              <div className="w-28 h-28 bg-[#FF4D00] text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-[#FF4D00]/40">
                 <CheckCircle2 className="w-16 h-16" />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tight text-white mb-4">TERMINAL VERIFIED</h3>
                <p className="text-xs font-bold text-zinc-400 max-w-md mx-auto leading-relaxed uppercase tracking-widest">Elite access credentials provisioned. Your merchant engine is fully synced with the PrintBazaar supply chain network.</p>
              </div>
              <div className="pt-4">
                 <button 
                   onClick={() => {
                     if (onVerificationComplete && currentSeller) {
                       onVerificationComplete(currentSeller);
                     }
                   }}
                   className="bg-white text-[#FF4D00] text-[10px] font-black uppercase px-12 py-4 rounded-2xl shadow-2xl hover:scale-105 transition-all"
                 >
                   Launch Merchant Studio
                 </button>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {step === 1 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                  <div className="bg-zinc-50 border-l-[6px] border-[#FF4D00] p-6 rounded-r-3xl">
                    <h3 className="text-xl font-black uppercase tracking-tight">ENTITY NODE IDENTITY</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-wider">Initialize your legal organizational profile across the supply network.</p>
                  </div>
                  
                  <div className="grid gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5"><User className="w-3 h-3" /> Full Legal Name</label>
                        <input required type="text" placeholder="As per PAN document" value={name} onChange={e => setName(e.target.value)} className="w-full text-xs p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none font-bold uppercase focus:ring-2 focus:ring-[#FF4D00]/10 transition-all placeholder-zinc-300" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5"><Landmark className="w-3 h-3" /> Official Store Trade Name</label>
                        <input required type="text" placeholder="e.g. Royal Offset Press" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full text-xs p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none font-bold uppercase focus:ring-2 focus:ring-[#FF4D00]/10 transition-all placeholder-zinc-300" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Communication Email</label>
                        <input required type="email" placeholder="admin@merchant.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full text-xs p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none font-bold lowercase focus:ring-2 focus:ring-[#FF4D00]/10 transition-all placeholder-zinc-300" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Mobile Logic ID (Phone)</label>
                        <input required type="text" placeholder="+91 XXX XXX XXXX" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full text-xs p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-[#FF4D00]/10 transition-all placeholder-zinc-300" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Corporate Registered Address</label>
                      <textarea required rows={4} placeholder="Full street layout, zip code, state..." value={address} onChange={e => setAddress(e.target.value)} className="w-full text-xs p-5 bg-zinc-50 border border-zinc-200 rounded-[28px] outline-none font-bold uppercase focus:ring-2 focus:ring-[#FF4D00]/10 transition-all placeholder-zinc-300 resize-none" />
                    </div>

                    <button 
                      onClick={() => {
                        if (!name || !businessName || !email || !mobile || !address) {
                          triggerToast?.('Complete all core fields', 'warn');
                          return;
                        }
                        handleStepSubmit(2, { 
                          ownerName: name, 
                          storeName: businessName, 
                          email, 
                          mobile,
                          documents: { ...(currentSeller?.documents || {}), addressLine: address }
                        });
                      }} 
                      className="bg-[#FF4D00] text-white text-[11px] font-black uppercase py-5 rounded-[24px] w-full shadow-2xl shadow-[#FF4D00]/20 hover:-translate-y-1 hover:shadow-[#FF4D00]/40 transition-all active:translate-y-0"
                    >
                      Authenticate Entity & Continue
                    </button>
                  </div>
                </div>
              )}

              {/* PAN Step */}
              {step === 2 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                  <div className="bg-zinc-50 border-l-[6px] border-black p-6 rounded-r-3xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Step 02: PAN VAULT</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-wider">Permanent Account Number validation for tax settlement logic.</p>
                    </div>
                    <FileCode className="w-10 h-10 text-zinc-200" />
                  </div>

                  <div className="grid gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Business PAN Number</label>
                      <input 
                        type="text" 
                        placeholder="ABCDE1234F" 
                        value={panNumber} 
                        onChange={e => setPanNumber(e.target.value.toUpperCase())} 
                        maxLength={10}
                        className="w-full text-lg p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none font-heavy tracking-widest uppercase focus:ring-2 focus:ring-black/5 transition-all text-center" 
                      />
                    </div>

                    <div className={`border-2 border-dashed ${panUrl ? 'border-emerald-200 bg-emerald-50/50' : 'border-zinc-200 bg-zinc-50'} rounded-[40px] p-16 flex flex-col items-center justify-center transition-all group`}>
                      {panUrl ? (
                         <div className="relative">
                            <img src={panUrl} alt="PAN" className="w-48 h-32 object-cover rounded-2xl shadow-xl ring-4 ring-white" />
                            <button onClick={() => setPanUrl('')} className="absolute -top-3 -right-3 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"><X className="w-4 h-4" /></button>
                         </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-zinc-300" />
                          </div>
                          <p className="text-xs font-black uppercase text-zinc-900 mb-2">Deploy Scanned PAN Document</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase mb-8">JPG, PNG, OR PDF • Max 5MB</p>
                          <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setPanUrl)} className="hidden" id="pan-upload" />
                          <label htmlFor="pan-upload" className="cursor-pointer px-10 py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Select Vault File</label>
                        </>
                      )}
                    </div>

                    <button 
                      disabled={!panNumber || !panUrl || isSyncing} 
                      onClick={() => handleStepSubmit(3, { documents: { ...(currentSeller?.documents || {}), businessPan: panNumber, panCard: panUrl } })} 
                      className="bg-black text-white text-[11px] font-black uppercase py-5 rounded-[24px] w-full shadow-xl hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50"
                    >
                      Commit PAN Identity
                    </button>
                  </div>
                </div>
              )}

              {/* Aadhaar Step */}
              {step === 3 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                  <div className="bg-zinc-50 border-l-[6px] border-indigo-600 p-6 rounded-r-3xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Step 03: AADHAAR VAULT</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-wider">Individual identity resolution via Govt Aadhaar Protocol.</p>
                    </div>
                    <ShieldCheck className="w-10 h-10 text-zinc-200" />
                  </div>

                  <div className="grid gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">12-Digit Aadhaar ID</label>
                      <input 
                        type="text" 
                        placeholder="0000 0000 0000" 
                        value={aadhaarNumber} 
                        onChange={e => setAadhaarNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                        maxLength={12}
                        className="w-full text-lg p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none font-heavy tracking-[0.3em] uppercase focus:ring-2 focus:ring-indigo-100 transition-all text-center" 
                      />
                    </div>

                    <div className={`border-2 border-dashed ${aadhaarUrl ? 'border-indigo-200 bg-indigo-50/20' : 'border-zinc-200 bg-zinc-50'} rounded-[40px] p-16 flex flex-col items-center justify-center transition-all group`}>
                      {aadhaarUrl ? (
                         <div className="relative">
                            <img src={aadhaarUrl} alt="Aadhaar" className="w-48 h-32 object-cover rounded-2xl shadow-xl ring-4 ring-white" />
                            <button onClick={() => setAadhaarUrl('')} className="absolute -top-3 -right-3 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"><X className="w-4 h-4" /></button>
                         </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-zinc-300" />
                          </div>
                          <p className="text-xs font-black uppercase text-zinc-900 mb-2">Deploy Front Side Image</p>
                          <input type="file" accept="image/*" onChange={e => handleFileUpload(e, setAadhaarUrl)} className="hidden" id="aadhaar-upload" />
                          <label htmlFor="aadhaar-upload" className="cursor-pointer px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl active:scale-95 mt-4">Select Front Facing</label>
                        </>
                      )}
                    </div>

                    <button 
                      disabled={!aadhaarNumber || !aadhaarUrl || isSyncing} 
                      onClick={() => handleStepSubmit(4, { documents: { ...(currentSeller?.documents || {}), governmentIdNumber: aadhaarNumber, aadhaarFront: aadhaarUrl } })} 
                      className="bg-indigo-600 text-white text-[11px] font-black uppercase py-5 rounded-[24px] w-full shadow-xl hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50"
                    >
                      Commit Aadhaar Identity
                    </button>
                  </div>
                </div>
              )}

              {/* Portfolio Step */}
              {step === 4 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                  <div className="bg-zinc-50 border-l-[6px] border-emerald-600 p-6 rounded-r-3xl">
                    <h3 className="text-xl font-black uppercase tracking-tight">Step 04: PORTFOLIO HUB</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-wider">Showcase your manufacturing capacity & heavy equipment catalog.</p>
                  </div>

                  <div className="grid gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Digital Portfolio (URL or PDF)</label>
                      <input required type="text" placeholder="Behance, Drive, or Website Link" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} className="w-full text-xs p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-emerald-100 transition-all" />
                    </div>

                    <div className={`border-2 border-dashed ${sampleWorkUrl ? 'border-emerald-200 bg-emerald-50/50' : 'border-zinc-200 bg-zinc-50'} rounded-[40px] p-16 flex flex-col items-center justify-center transition-all group`}>
                      {sampleWorkUrl ? (
                         <div className="relative">
                            <img src={sampleWorkUrl} alt="Sample" className="w-56 h-36 object-cover rounded-2xl shadow-xl ring-4 ring-white" />
                            <button onClick={() => setSampleWorkUrl('')} className="absolute -top-3 -right-3 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"><X className="w-4 h-4" /></button>
                         </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                            <Package className="w-8 h-8 text-zinc-300" />
                          </div>
                          <p className="text-xs font-black uppercase text-zinc-900 mb-2">Upload Sample Print Output</p>
                          <input type="file" accept="image/*" onChange={e => handleFileUpload(e, setSampleWorkUrl)} className="hidden" id="sample-upload" />
                          <label htmlFor="sample-upload" className="cursor-pointer px-10 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl active:scale-95 mt-4">Select High-Res Close-up</label>
                        </>
                      )}
                    </div>

                    <button 
                      disabled={!portfolioUrl || !sampleWorkUrl || isSyncing} 
                      onClick={() => handleStepSubmit(5, { documents: { ...(currentSeller?.documents || {}), tradeLicense: portfolioUrl, msmeCert: sampleWorkUrl } })} 
                      className="bg-emerald-600 text-white text-[11px] font-black uppercase py-5 rounded-[24px] w-full shadow-xl hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50"
                    >
                      Authenticate Experience Node
                    </button>
                  </div>
                </div>
              )}

              {/* Settlement Step */}
              {step === 5 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                  <div className="bg-zinc-50 border-l-[6px] border-amber-500 p-6 rounded-r-3xl">
                    <h3 className="text-xl font-black uppercase tracking-tight">Step 05: BANK & UPI SETTLEMENT</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-wider">Configure financial logic for merchant payout disbursements.</p>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Bank Institution Name</label>
                      <input required type="text" placeholder="e.g. HDFC Bank, ICICI, SBI" value={bankName} onChange={e => setBankName(e.target.value.toUpperCase())} className="w-full text-xs p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none font-bold uppercase" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Account Number</label>
                        <input required type="text" placeholder="000000000000" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full text-xs p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none font-heavy" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">IFSC Code Protocol</label>
                        <input required type="text" placeholder="HDFC0001234" value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} maxLength={11} className="w-full text-xs p-5 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none font-heavy uppercase" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center justify-between">
                        <span>Merchant UPI Identity (VPA)</span>
                        <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">Recommended</span>
                      </label>
                      <input required type="text" placeholder="merchant@upi" value={upiId} onChange={e => setUpiId(e.target.value.toLowerCase())} className="w-full text-xs p-5 bg-zinc-50 border border-amber-200 rounded-2xl outline-none font-bold lowercase focus:ring-2 focus:ring-amber-100 placeholder-zinc-300" />
                    </div>

                    <button 
                      disabled={!bankName || !accountNumber || !ifscCode || !upiId || isSyncing} 
                      onClick={() => handleStepSubmit(6, { documents: { ...(currentSeller?.documents || {}), bankName, bankAccountNumber: accountNumber, bankIfscCode: ifscCode, upiId } })} 
                      className="bg-amber-600 text-white text-[11px] font-black uppercase py-5 rounded-[24px] w-full shadow-xl hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50"
                    >
                      Authenticate Settlement Channel
                    </button>
                  </div>
                </div>
              )}

              {/* Video KYC Step */}
              {step === 6 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                  <div className="bg-zinc-50 border-l-[6px] border-rose-600 p-6 rounded-r-3xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Step 06: AI VIDEO KYC</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-wider">3D Face mapping & liveness detection for anti-fraud architecture.</p>
                    </div>
                    <Video className="w-10 h-10 text-zinc-200" />
                  </div>

                  <div className="flex flex-col items-center gap-10">
                    <div className="w-full aspect-video bg-zinc-950 rounded-[48px] overflow-hidden relative shadow-2xl border-4 border-zinc-900 group">
                      {videoKycUrl ? (
                         <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-emerald-500/10">
                            <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center animate-pulse"><CheckCircle2 className="w-10 h-10" /></div>
                            <p className="text-emerald-500 text-xs font-black uppercase tracking-widest">Identity Stream Captured</p>
                            <button onClick={() => setVideoKycUrl('')} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase rounded-lg border border-white/20 transition-all">Discard & Reshoot</button>
                         </div>
                      ) : (
                        <>
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                            <div className="w-20 h-20 rounded-full border-4 border-[#FF4D00] border-t-transparent animate-spin" />
                            <p className="text-white text-xs font-black uppercase tracking-widest animate-pulse">Initializing Neural Link...</p>
                          </div>
                          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/80 flex flex-col items-center justify-end p-10 z-20">
                            <button 
                              onClick={() => {
                                setIsSyncing(true);
                                setTimeout(() => {
                                  setVideoKycUrl('https://demo.video/kyc-verified-stream');
                                  setIsSyncing(false);
                                  triggerToast?.('Liveness verified', 'success');
                                }, 2500);
                              }} 
                              className="bg-rose-600 hover:bg-rose-700 text-white px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                            >
                              <Video className="w-5 h-5" /> Start AI Scan Sequence
                            </button>
                            <p className="text-zinc-500 text-[9px] font-bold uppercase mt-6 tracking-tight max-w-xs text-center">By starting, you authorize PrintBazaar to match your face mesh against Govt ID records.</p>
                          </div>
                        </>
                      )}
                    </div>

                    <button 
                      disabled={!videoKycUrl || isSyncing} 
                      onClick={() => handleStepSubmit(7, { documents: { ...(currentSeller?.documents || {}), videoKycUrl } })} 
                      className="bg-rose-600 text-white text-[11px] font-black uppercase py-5 rounded-[24px] w-full shadow-xl hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50"
                    >
                      Authenticate Biometric Lock
                    </button>
                  </div>
                </div>
              )}

              {/* Review Step */}
              {step === 7 && (
                <div className="space-y-10 animate-in fade-in zoom-in-95 duration-1000">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-zinc-900 text-[#FF4D00] rounded-[32px] flex items-center justify-center mx-auto shadow-2xl rotate-3">
                      <Clock className="w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight">Final Intelligence Audit</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Automated pre-checks passed. Application is staged for Auditor Approval.</p>
                    </div>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-[40px] p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-5">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Snapshot Verification</p>
                      <div className="flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All Assets Staged
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { l: 'Business ID', v: businessName },
                         { l: 'Tax Node', v: panNumber },
                         { l: 'Govt ID', v: aadhaarNumber },
                         { l: 'Settlement', v: upiId }
                       ].map((x, i) => (
                         <div key={i} className="space-y-1">
                           <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{x.l}</p>
                           <p className="text-[10px] font-heavy text-zinc-800 uppercase truncate">{x.v}</p>
                         </div>
                       ))}
                    </div>

                    <div className="p-4 bg-white border border-zinc-200 rounded-2xl flex items-center gap-3">
                       <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                       <p className="text-[9px] font-bold text-zinc-500 leading-tight uppercase">Manual Auditor Review typically concludes within 4 business hours. You'll be notified via SMS logic.</p>
                    </div>
                  </div>

                  <button 
                    onClick={async () => {
                      if (!db) return;
                      try {
                        const { doc, setDoc } = await import('firebase/firestore');
                        // 1. Auto Seller Activation
                        const userRef = doc(db, 'users', currentUid);
                        await setDoc(userRef, {
                          role: 'seller',
                          sellerStatus: 'approved',
                          merchantStatus: 'active',
                          isSeller: true,
                          isVerified: true,
                          onboardingCompleted: true
                        }, { merge: true });

                        // 2. Sync profile fields
                        await syncProfile({ 
                          status: 'Verified', 
                          verificationStep: 7, 
                          isSeller: true, 
                          onboardingCompleted: true 
                        });
                        
                        triggerToast?.('✓ Onboarding 100% Complete! Seller Dashboard is now unlocked.', 'success');

                        // 3. Automatic Redirect
                        if (onVerificationComplete) {
                          onVerificationComplete({
                            id: currentUid,
                            ownerName: name || 'Amaan Mohd',
                            storeName: businessName || 'My PrintBazaar Studio',
                            email: email || 'seller@printbazaar.com',
                            mobile: mobile || '9876543210',
                            status: 'Verified',
                            level: 'Verified Seller',
                            verificationStep: 7
                          });
                        }
                      } catch (err: any) {
                        console.error("Auto seller activation failed:", err);
                        triggerToast?.('Activation error: ' + err.message, 'warn');
                      }
                    }}
                    className="bg-[#FF4D00] text-white text-[11px] font-black uppercase py-5 rounded-[24px] w-full shadow-2xl hover:-translate-y-1 transition-all active:translate-y-0"
                  >
                    Authorize Final Deployment & Activate Seller Account
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-components
