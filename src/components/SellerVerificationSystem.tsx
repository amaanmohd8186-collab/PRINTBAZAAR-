import React, { useState, useEffect } from 'react';
import { 
  User, ShieldCheck, Check, X, Clipboard, 
  Clock, Package, FileCode
} from 'lucide-react';
import { SellerProfile } from '../types';
import { db, auth } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, query, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

interface SellerVerificationSystemProps {
  isAdminMode: boolean;
  onVerificationComplete?: (profile: SellerProfile) => void;
}

export default function SellerVerificationSystem({ isAdminMode, onVerificationComplete }: SellerVerificationSystemProps) {
  const [activePortal, setActivePortal] = useState<'merchant' | 'admin'>('merchant');
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [currentSeller, setCurrentSeller] = useState<SellerProfile | null>(null);
  const [step, setStep] = useState<number>(1);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  
  // Documents (Base64)
  const [aadhaarUrl, setAadhaarUrl] = useState('');
  const [panUrl, setPanUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [sampleWorkUrl, setSampleWorkUrl] = useState('');
  
  // Admin only
  const [adminNotes, setAdminNotes] = useState('');
  
  const currentUid = user?.uid || 'cust-current';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
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
    if (!currentUid || currentUid === 'cust-current' || !db) return;
    
    const sellerRef = doc(db, 'sellers', currentUid);
    const unsub = onSnapshot(sellerRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as SellerProfile & {
          documents?: any; verificationStep?: number;
        };
        setCurrentSeller(data);
        setStep(data.verificationStep || 1);
        setName(data.name || '');
        setEmail(data.email || '');
        setMobile(data.mobile || '');
        if (data.documents) {
          setAadhaarUrl(data.documents.aadhaar || '');
          setPanUrl(data.documents.pan || '');
          setPortfolioUrl(data.documents.portfolio || '');
          setSampleWorkUrl(data.documents.sampleWork || '');
        }
      }
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

  const syncProfile = async (updates: Partial<SellerProfile> & { documents?: any, verificationStep?: number }) => {
    setIsSyncing(true);
    try {
      await setDoc(doc(db, 'sellers', currentUid), {
        ...currentSeller,
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !mobile) return alert('Name, Email, and Mobile required.');
    await syncProfile({ name, email, mobile, status: 'Draft', verificationStep: 2, level: 'Basic Seller' as any });
    setStep(2);
  };

  const handleDocumentSubmit = async (type: 'Aadhaar' | 'PAN' | 'Portfolio' | 'SampleWork', url: string, nextStep: number) => {
    if (!url) return alert(`Please upload ${type}`);
    const documents = { ...(currentSeller as any)?.documents, [type.toLowerCase()]: url };
    await syncProfile({ documents, verificationStep: nextStep });
    setStep(nextStep);
  };

  const submitForReview = async () => {
    await syncProfile({ status: 'Pending Verification', verificationStep: 6 });
    setStep(6);
    alert('Submitted for review successfully!');
  };

  const handleAdminAction = async (selId: string, action: 'Verified' | 'Rejected', level: 'Basic Seller' | 'Verified Seller' | 'Premium Seller' = 'Verified Seller') => {
    try {
      await setDoc(doc(db, 'sellers', selId), {
        status: action,
        level: level,
        adminNotes: adminNotes,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert(`Seller marked as ${action}`);
      setAdminNotes('');
    } catch (e: any) {
      alert('Error updating status: ' + e.message);
    }
  };

  return (
    <div className="bg-white border rounded-[30px] overflow-hidden shadow-xl max-w-5xl mx-auto my-6 p-6">
      <div className="flex bg-zinc-100 p-2 rounded-xl w-fit mb-6">
        <button onClick={() => setActivePortal('merchant')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg ${activePortal === 'merchant' ? 'bg-[#FF4D00] text-white' : 'text-zinc-500'}`}>Merchant Register</button>
        {isAdminMode && (
          <button onClick={() => setActivePortal('admin')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg ${activePortal === 'admin' ? 'bg-[#FF4D00] text-white' : 'text-zinc-500'}`}>Auditor Console</button>
        )}
      </div>

      {activePortal === 'admin' ? (
        <div className="space-y-6">
          <h2 className="text-xl font-black uppercase"><Clipboard className="inline w-6 h-6 mr-2 text-[#FF4D00]"/> Seller Audits</h2>
           {sellers.length === 0 && <p className="text-zinc-500 text-sm">No sellers found.</p>}
           {sellers.map((sel: any) => (
             <div key={sel.id} className="border border-zinc-200 p-4 rounded-[20px] bg-zinc-50">
               <div className="flex justify-between items-center border-b pb-3 mb-3">
                 <div>
                   <h3 className="font-bold uppercase text-sm">{sel.name} &bull; {sel.mobile}</h3>
                   <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-md mt-1 inline-block ${sel.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : sel.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{sel.status} | {sel.level || 'Basic Seller'}</span>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-zinc-500">
                 <div className="space-y-1 text-center">
                   <p className="uppercase text-[9px]">Aadhaar Card</p>
                   {sel.documents?.aadhaar ? <a href={sel.documents.aadhaar} target="_blank" rel="noreferrer" className="block text-indigo-500 underline">View Aadhaar</a> : 'None'}
                 </div>
                 <div className="space-y-1 text-center">
                   <p className="uppercase text-[9px]">PAN Card</p>
                   {sel.documents?.pan ? <a href={sel.documents.pan} target="_blank" rel="noreferrer" className="block text-indigo-500 underline">View PAN</a> : 'None'}
                 </div>
                 <div className="space-y-1 text-center">
                   <p className="uppercase text-[9px]">Portfolio</p>
                   {sel.documents?.portfolio ? <a href={sel.documents.portfolio} target="_blank" rel="noreferrer" className="block text-indigo-500 underline">View Portfolio</a> : 'None'}
                 </div>
                 <div className="space-y-1 text-center">
                   <p className="uppercase text-[9px]">Sample Work</p>
                   {sel.documents?.samplework ? <a href={sel.documents.samplework} target="_blank" rel="noreferrer" className="block text-indigo-500 underline">View Samples</a> : 'None'}
                 </div>
               </div>
               
               {sel.status === 'Pending Verification' && (
                 <div className="mt-4 border-t pt-3 flex flex-wrap gap-2 items-center justify-end">
                   <input type="text" placeholder="Add verification notes..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="text-xs p-2 border rounded-lg mr-auto outline-none w-64 uppercase font-mono" />
                   
                   <button onClick={() => handleAdminAction(sel.id, 'Rejected', 'Basic Seller')} className="bg-rose-600 text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg">Reject</button>
                   <button onClick={() => handleAdminAction(sel.id, 'Verified', 'Verified Seller')} className="bg-emerald-600 text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg">Approve Verified</button>
                   <button onClick={() => handleAdminAction(sel.id, 'Verified', 'Premium Seller')} className="bg-purple-600 text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg">Approve Premium</button>
                 </div>
               )}
             </div>
           ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="mb-4">
            <h2 className="text-xl font-black uppercase">{currentSeller?.status === 'Verified' ? 'Welcome to PrintBazaar' : 'Complete Merchant Onboarding'}</h2>
            {currentSeller && <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Badge: {currentSeller.level || 'Basic Seller'} &bull; Status: {currentSeller.status}</p>}
          </div>

          {!user ? (
            <p className="text-sm font-bold text-rose-500">Please sign in from the top header before continuing.</p>
          ) : currentSeller?.status === 'Verified' ? (
            <div className="text-center p-10 space-y-4">
              <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-black uppercase text-emerald-700">Account Approved!</h3>
              <p className="text-sm font-bold text-zinc-600">Your seller profile is active. You can now access your dashboard.</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-lg">
              {step === 1 && (
                <form onSubmit={handleStep1Submit} className="space-y-4">
                   <h3 className="text-sm font-black uppercase">Step 1: Profile Details</h3>
                   <input required type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full text-sm p-3 border rounded-xl" />
                   <input required type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full text-sm p-3 border rounded-xl" />
                   <input required type="text" placeholder="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full text-sm p-3 border rounded-xl" />
                   <button disabled={isSyncing} type="submit" className="bg-[#FF4D00] text-white text-xs font-black uppercase px-6 py-3 rounded-xl w-full">Save & Continue</button>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase">Step 2: Upload Aadhaar Card</h3>
                   <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setAadhaarUrl)} className="w-full text-sm p-3 border rounded-xl" />
                   {aadhaarUrl && <p className="text-xs text-emerald-600 font-bold uppercase">File attached ✓</p>}
                   <button disabled={isSyncing} onClick={() => handleDocumentSubmit('Aadhaar', aadhaarUrl, 3)} className="bg-[#FF4D00] text-white text-xs font-black uppercase px-6 py-3 rounded-xl w-full">Upload & Continue</button>
                </div>
              )}

              {step === 3 && (
                 <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase">Step 3: Upload PAN Card</h3>
                   <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setPanUrl)} className="w-full text-sm p-3 border rounded-xl" />
                   {panUrl && <p className="text-xs text-emerald-600 font-bold uppercase">File attached ✓</p>}
                   <button disabled={isSyncing} onClick={() => handleDocumentSubmit('PAN', panUrl, 4)} className="bg-[#FF4D00] text-white text-xs font-black uppercase px-6 py-3 rounded-xl w-full">Upload & Continue</button>
                </div>
              )}

              {step === 4 && (
                 <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase">Step 4: Upload Portfolio</h3>
                   <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setPortfolioUrl)} className="w-full text-sm p-3 border rounded-xl" />
                   {portfolioUrl && <p className="text-xs text-emerald-600 font-bold uppercase">File attached ✓</p>}
                   <button disabled={isSyncing} onClick={() => handleDocumentSubmit('Portfolio', portfolioUrl, 5)} className="bg-[#FF4D00] text-white text-xs font-black uppercase px-6 py-3 rounded-xl w-full">Upload & Continue</button>
                </div>
              )}

              {step === 5 && (
                 <div className="space-y-4">
                   <h3 className="text-sm font-black uppercase">Step 5: Upload Sample Work</h3>
                   <input type="file" accept="image/*,.pdf" onChange={e => handleFileUpload(e, setSampleWorkUrl)} className="w-full text-sm p-3 border rounded-xl" />
                   {sampleWorkUrl && <p className="text-xs text-emerald-600 font-bold uppercase">File attached ✓</p>}
                   <button disabled={isSyncing} onClick={() => {
                     if (!sampleWorkUrl) return alert('Please upload sample work');
                     const docs = { ...(currentSeller as any)?.documents, samplework: sampleWorkUrl };
                     syncProfile({ documents: docs }).then(() => submitForReview());
                   }} className="bg-black text-white text-xs font-black uppercase px-6 py-3 rounded-xl w-full">Submit For Admin Review</button>
                </div>
              )}

              {step === 6 && (
                <div className="text-center p-8">
                  <Clock className="w-12 h-12 text-[#FF4D00] mx-auto mb-4" />
                  <h3 className="text-lg font-black uppercase">Under Review</h3>
                  <p className="text-xs font-bold text-zinc-500 uppercase mt-2">Your profile and documents are being reviewed by the PrintBazaar administration team.</p>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
