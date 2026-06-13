import React, { useState } from 'react';
import { User, MapPin, Edit, Trash2, Plus, Phone, Mail, Calendar, Save } from 'lucide-react';
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
                  <div key={a.id} className={`p-4 rounded-[20px] border ${a.isDefault ? 'border-[#FF4D00] bg-orange-50/30' : 'border-zinc-200 bg-white'} relative flex items-start gap-3 transition`}>
                    <div className="p-2 bg-zinc-100 rounded-xl text-zinc-500 shrink-0 mt-0.5"><MapPin className="w-4 h-4" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase text-slate-900">{a.label}</span>
                        {a.isDefault && <span className="bg-[#FF4D00] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">Default</span>}
                      </div>
                      <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{a.line1}, <br/>{a.city}, {a.state} - {a.pincode}</p>
                      
                      <div className="flex gap-3 mt-3 pt-3 border-t border-zinc-100">
                        <button onClick={() => handleDeleteAddress(a.id)} className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase cursor-pointer">Delete</button>
                        {!a.isDefault && (
                          <button onClick={() => handleSetDefault(a.id)} className="text-[10px] font-bold text-zinc-500 hover:text-slate-900 uppercase cursor-pointer">Make Default</button>
                        )}
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
