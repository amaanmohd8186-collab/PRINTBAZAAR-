import React, { useState } from 'react';
import { User, MapPin, Edit, Trash2, Plus, Phone, Mail, Calendar, Save, Copy, Check, ExternalLink } from 'lucide-react';
import { UserStats, Address } from '../types';

interface ProfileAddressesProps {
  stats: UserStats;
  userName: string;
  userEmail: string;
  onUpdateStats: (stats: UserStats) => void;
  onUpdateSession: (name: string, email: string) => void;
  onBack: () => void;
}

export default function ProfileAddresses({ stats, userName, userEmail, onUpdateStats, onUpdateSession, onBack }: ProfileAddressesProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [mobile, setMobile] = useState(stats.mobile || '');
  const [dob, setDob] = useState(stats.dob || '');

  const [addresses, setAddresses] = useState<Address[]>(stats.addresses || []);

  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newAddr, setNewAddr] = useState<Partial<Address>>({ label: 'Home', line1: '', city: '', state: '', pincode: '', isDefault: false });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSaveProfile = () => {
    onUpdateSession(name, email);
    onUpdateStats({ ...stats, mobile, dob, addresses });
    alert('Personal details saved successfully!');
  };

  const handleAddAddress = () => {
    if (!newAddr.line1 || !newAddr.city || !newAddr.pincode) return alert('Please fill required address fields.');
    const newA: Address = {
      id: 'addr-' + Date.now(),
      label: newAddr.label || 'Other',
      name: name,
      phone: mobile,
      addressLine1: newAddr.line1 || '',
      line1: newAddr.line1 || '',
      city: newAddr.city || '',
      state: newAddr.state || '',
      pincode: newAddr.pincode || '',
      isDefault: newAddr.isDefault || addresses.length === 0
    };

    let updatedList = [...addresses, newA];
    if (newA.isDefault) {
      updatedList = updatedList.map(a => ({ ...a, isDefault: a.id === newA.id }));
    }
    
    setAddresses(updatedList);
    onUpdateStats({ ...stats, addresses: updatedList });
    setShowAddAddr(false);
    setNewAddr({ label: 'Home', line1: '', city: '', state: '', pincode: '', isDefault: false });
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    onUpdateStats({ ...stats, addresses: updated });
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    onUpdateStats({ ...stats, addresses: updated });
  };

  const handleCopyAddress = (addr: Address) => {
    const fullAddr = `${addr.line1}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
    navigator.clipboard.writeText(fullAddr);
    setCopiedId(addr.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <button onClick={onBack} className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition">
        ← Back to Profile
      </button>

      <div className="bg-white rounded-[32px] border border-zinc-200/80 p-6 shadow-sm space-y-8">
        <div className="flex items-center gap-4 border-b border-zinc-150 pb-5">
          <div className="p-3 bg-zinc-100 text-zinc-600 rounded-2xl border border-zinc-200">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-heavy text-slate-900 uppercase tracking-tight">My Profile & Addresses</h3>
            <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase mt-0.5">Manage identity and delivery targets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Profile Details */}
          <div className="space-y-5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Personal Details</h4>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#FF4D00]" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#FF4D00]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Mobile</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91 999999999" className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#FF4D00]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#FF4D00]" />
                  </div>
                </div>
              </div>

              <button onClick={handleSaveProfile} className="mt-2 py-2.5 px-6 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Profile
              </button>
            </div>
          </div>

          {/* Address Management */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Delivery Addresses</h4>
              <button onClick={() => setShowAddAddr(!showAddAddr)} className="p-1.5 bg-zinc-100 text-zinc-600 hover:text-white hover:bg-[#FF4D00] rounded-lg transition cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showAddAddr && (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-[20px] space-y-3 animate-fadeIn">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#FF4D00] font-mono">Add New Address</h5>
                <div className="grid grid-cols-2 gap-2">
                  <select value={newAddr.label} onChange={e => setNewAddr({...newAddr, label: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:outline-hidden">
                    <option>Home</option>
                    <option>Office</option>
                    <option>Warehouse</option>
                    <option>Other</option>
                  </select>
                  <input type="text" value={newAddr.pincode} onChange={e => setNewAddr({...newAddr, pincode: e.target.value})} placeholder="Pincode" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:outline-hidden" />
                </div>
                <input type="text" value={newAddr.line1} onChange={e => setNewAddr({...newAddr, line1: e.target.value})} placeholder="Street Address / Building" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:outline-hidden" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} placeholder="City" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:outline-hidden" />
                  <input type="text" value={newAddr.state} onChange={e => setNewAddr({...newAddr, state: e.target.value})} placeholder="State" className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold focus:outline-hidden" />
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 mt-2">
                  <input type="checkbox" checked={newAddr.isDefault} onChange={e => setNewAddr({...newAddr, isDefault: e.target.checked})} className="accent-[#FF4D00]" /> Set as default address
                </label>
                <button onClick={handleAddAddress} className="w-full py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-neutral-800 transition cursor-pointer">
                  Save Address
                </button>
              </div>
            )}

            <div className="space-y-3">
              {addresses.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-zinc-200 rounded-[20px] text-zinc-500 text-xs">
                  No addresses saved yet.
                </div>
              ) : (
                addresses.map(a => (
                  <div key={a.id} className={`p-4 rounded-[28px] border ${a.isDefault ? 'border-[#FF4D00] bg-orange-50/20 shadow-sm' : 'border-zinc-200 bg-white'} relative flex items-start gap-4 transition-all duration-300 group`}>
                    <div className={`p-3 rounded-2xl shrink-0 mt-0.5 transition-colors ${a.isDefault ? 'bg-[#FF4D00] text-white shadow-lg shadow-[#FF4D00]/20' : 'bg-zinc-100 text-zinc-500'}`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black uppercase text-slate-900 tracking-tight">{a.label}</span>
                          {a.isDefault && <span className="bg-[#FF4D00] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">Default</span>}
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleCopyAddress(a)}
                            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                            title="Copy Address"
                          >
                            {copiedId === a.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.line1}, ${a.city}, ${a.state} ${a.pincode}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                            title="View on Map"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-zinc-600 font-medium mt-1.5 leading-relaxed break-words">
                        {a.line1}, {a.city}, {a.state} - {a.pincode}
                      </p>
                      
                      <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-zinc-100/60">
                        <div className="flex gap-4">
                          <button onClick={() => handleDeleteAddress(a.id)} className="text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-wider transition cursor-pointer">Delete</button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${a.isDefault ? 'text-[#FF4D00]' : 'text-zinc-400'}`}>
                            {a.isDefault ? 'Primary' : 'Secondary'}
                          </span>
                          <button 
                            onClick={() => handleSetDefault(a.id)}
                            className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${a.isDefault ? 'bg-[#FF4D00]' : 'bg-zinc-200'}`}
                          >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all duration-200 ${a.isDefault ? 'left-4.75 shadow-xs' : 'left-0.75'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
