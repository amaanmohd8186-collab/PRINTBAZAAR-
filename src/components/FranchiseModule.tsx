import React, { useState } from 'react';
import { Landmark, TrendingUp, ShoppingBag, HardDrive, MapPin, Check, X, ShieldCheck, User } from 'lucide-react';
import { setLocalStorageData, getLocalStorageData } from '../data';

interface Franchise {
  id: string;
  name: string;
  owner: string;
  city: string;
  state: string;
  pincode: string;
  totalOrders: number;
  totalRevenue: number;
  walletBalance: number;
  inventoryStatus: 'Optimal' | 'Low stock' | 'Re-route';
}

const DEFAULT_FRANCHISES: Franchise[] = [
  {
    id: 'fran-01',
    name: 'PrintBazaar Noida Sector 62',
    owner: 'Vijay Pratap Singh',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    totalOrders: 342,
    totalRevenue: 482900,
    walletBalance: 24200,
    inventoryStatus: 'Optimal'
  },
  {
    id: 'fran-02',
    name: 'Metropress Kolkata Salt Lake',
    owner: 'Sujata Banerjee',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700091',
    totalOrders: 182,
    totalRevenue: 224050,
    walletBalance: 11000,
    inventoryStatus: 'Optimal'
  }
];

export default function FranchiseModule() {
  const [franchises, setFranchises] = useState<Franchise[]>(() => {
    return getLocalStorageData<Franchise[]>('pb_franchise_registrations', DEFAULT_FRANCHISES);
  });

  // Partners submit states
  const [shopName, setShopName] = useState('');
  const [owner, setOwner] = useState('');
  const [city, setCity] = useState('');
  const [stateStr, setStateStr] = useState('');
  const [pincode, setPincode] = useState('');

  const handleRegisterFranchise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !owner || !city || !pincode) {
      alert('Kindly fill in all franchise application parameters.');
      return;
    }
    const newFran: Franchise = {
      id: 'fran-' + Date.now(),
      name: shopName,
      owner,
      city,
      state: stateStr || 'Delhi',
      pincode,
      totalOrders: 0,
      totalRevenue: 0,
      walletBalance: 0,
      inventoryStatus: 'Optimal'
    };
    const updated = [newFran, ...franchises];
    setFranchises(updated);
    setLocalStorageData('pb_franchise_registrations', updated);
    setShopName('');
    setOwner('');
    setCity('');
    setStateStr('');
    setPincode('');
    alert('🎉 Franchise Partnership requested successfully! Core network alignment pending admin review.');
  };

  return (
    <div className="bg-white rounded-[32px] border border-zinc-200/60 p-6 shadow-sm text-left space-y-6">
      <div className="border-b border-zinc-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-heavy text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#FF4D00]" />
            <span>Local Franchise Partnership Module</span>
          </h3>
          <p className="text-xs text-zinc-500 font-mono mt-1 font-bold">Register local printing partners to route physical delivery orders, map earnings splits, and balance local stocks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-[#FF4D00] font-mono flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Active Affiliate Partners ({franchises.length})</span>
          </h4>

          <div className="space-y-4">
            {franchises.map((f) => (
              <div key={f.id} className="bg-zinc-50 border border-zinc-200 rounded-[28px] p-5 hover:border-[#FF4D00] transition duration-350">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-[#FF4D00]/10 text-[#FF4D00] rounded-2xl border border-[#FF4D00]/20">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-heavy text-slate-900 text-sm uppercase">{f.name}</h5>
                      <p className="text-xs text-zinc-500 font-mono font-bold mt-0.5">Partner: {f.owner} | ID: {f.id}</p>
                      <span className="text-[10px] text-zinc-400 font-bold font-mono mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Location: {f.city}, {f.state} - {f.pincode}</span>
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 font-black uppercase">
                    Inventory: {f.inventoryStatus}
                  </span>
                </div>

                <div className="border-t border-dashed border-zinc-200 pt-4 grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-mono text-zinc-400 block font-bold">Processed Volumes</span>
                    <span className="font-black text-slate-800">{f.totalOrders} Orders</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-zinc-400 block font-bold">Cumulative Earnings</span>
                    <span className="font-black text-[#FF4D00]">₹{f.totalRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-zinc-400 block font-bold">Unsettled Wallet</span>
                    <span className="font-black text-emerald-600">₹{f.walletBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Registration column */}
        <div className="space-y-4">
          <form onSubmit={handleRegisterFranchise} className="bg-zinc-50 border border-zinc-200 p-5 rounded-[28px] space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#FF4D00] font-mono">Join as Local Print franchise</h4>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Shop Name</label>
                <input 
                  type="text" 
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Apex Offset Printers Ltd" 
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden text-zinc-805"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Proprietor / Representative Name</label>
                <input 
                  type="text" 
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Enter legal representative" 
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden text-zinc-805"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">City Address</label>
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Noida" 
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Pincode Coordinate</label>
                  <input 
                    type="text" 
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="201301" 
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#FF4D00] hover:bg-[#E03E00] text-white rounded-[16px] text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Submit Franchise Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
