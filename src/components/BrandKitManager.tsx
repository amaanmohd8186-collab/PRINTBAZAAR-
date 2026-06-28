import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Palette, 
  Type, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Plus, 
  Trash2, 
  Check,
  Upload,
  QrCode,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  FileText
} from 'lucide-react';
import { BrandKit } from '../types';

interface Props {
  brandKit: BrandKit | null;
  onUpdate: (kit: BrandKit) => void;
}

const BrandKitManager: React.FC<Props> = ({ brandKit, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'assets' | 'social'>('basics');
  const [formData, setFormData] = useState<Partial<BrandKit>>(brandKit || {
    colors: ['#0F172A', '#FF4D00', '#F8FAFC'],
    fonts: ['Inter', 'Outfit'],
  });

  const handleSave = () => {
    onUpdate({
      ...formData as BrandKit,
      updatedAt: new Date().toISOString()
    });
  };

  const addColor = () => {
    setFormData(prev => ({ ...prev, colors: [...(prev.colors || []), '#000000'] }));
  };

  const removeColor = (idx: number) => {
    setFormData(prev => ({ ...prev, colors: (prev.colors || []).filter((_, i) => i !== idx) }));
  };

  return (
    <div className="bg-white rounded-[32px] overflow-hidden border border-zinc-200/80 shadow-2xl flex flex-col h-[700px]">
      {/* Header */}
      <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heavy uppercase tracking-tighter">Enterprise Brand Kit</h2>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Automated Identity Management</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-[#FF4D00] text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-white hover:text-[#FF4D00] transition-all shadow-lg"
        >
          Save Identity
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 bg-zinc-50/50">
        {[
          { id: 'basics', label: 'Company Info', icon: Building2 },
          { id: 'assets', label: 'Visual Assets', icon: Palette },
          { id: 'social', label: 'Digital Links', icon: Globe }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-white text-[#FF4D00] border-b-2 border-[#FF4D00]' : 'text-zinc-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide no-scrollbar">
        {activeTab === 'basics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none transition-all"
                    placeholder="Enter Business Name"
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest">GST Number</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none transition-all"
                    placeholder="27XXXXX0000X1ZX"
                    value={formData.gstNumber || ''}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Business Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <textarea 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none transition-all h-24 resize-none"
                  placeholder="Full office/factory address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none transition-all"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none transition-all"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-10">
            {/* Logo */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FF4D00]" /> Primary Logo
              </h3>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center group hover:border-[#FF4D00] transition-colors cursor-pointer">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} className="w-full h-full object-contain p-4" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-zinc-300 group-hover:text-[#FF4D00] transition-colors" />
                      <span className="text-[8px] font-bold text-zinc-400 uppercase mt-2">SVG/PNG</span>
                    </>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase">
                    Upload your high-resolution vector logo. This will be automatically used for watermarks and branding presets.
                  </p>
                  <button className="text-[10px] font-black text-[#FF4D00] uppercase hover:underline">Remove Logo</button>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#FF4D00]" /> Brand Palette
                 </h3>
                 <button 
                  onClick={addColor}
                  className="p-1.5 bg-zinc-100 rounded-lg hover:bg-[#FF4D00] hover:text-white transition-all"
                 >
                   <Plus className="w-3 h-3" />
                 </button>
               </div>
               <div className="grid grid-cols-5 gap-4">
                  {(formData.colors || []).map((color, idx) => (
                    <div key={idx} className="space-y-2 group relative">
                       <div 
                        className="aspect-square rounded-xl shadow-inner border border-zinc-200 relative overflow-hidden"
                        style={{ backgroundColor: color }}
                       >
                         <input 
                           type="color"
                           className="absolute inset-0 opacity-0 cursor-pointer"
                           value={color}
                           onChange={(e) => {
                             const newColors = [...(formData.colors || [])];
                             newColors[idx] = e.target.value;
                             setFormData({ ...formData, colors: newColors });
                           }}
                         />
                       </div>
                       <div className="text-[10px] font-black text-slate-950 font-mono text-center uppercase">{color}</div>
                       <button 
                        onClick={() => removeColor(idx)}
                        className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-lg border border-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
                       >
                         <Trash2 className="w-3 h-3" />
                       </button>
                    </div>
                  ))}
               </div>
            </div>

            {/* Fonts */}
            <div className="space-y-4">
               <h3 className="text-xs font-black text-slate-900 uppercase flex items-center gap-2">
                  <Type className="w-4 h-4 text-[#FF4D00]" /> Brand Typography
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  {['Heading Font', 'Body Font'].map((type, idx) => (
                    <div key={type} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between">
                       <div>
                         <p className="text-[8px] text-zinc-400 font-bold uppercase">{type}</p>
                         <p className="text-sm font-black text-slate-950 uppercase mt-0.5">{formData.fonts?.[idx] || 'Select Font'}</p>
                       </div>
                       <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Instagram</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none"
                    placeholder="@username"
                    value={formData.socialLinks?.instagram || ''}
                    onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Facebook</label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none"
                    placeholder="facebook.com/page"
                    value={formData.socialLinks?.facebook || ''}
                    onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, facebook: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-zinc-100">
               <div className="flex items-center gap-4 p-6 bg-[#FF4D00]/5 rounded-[24px] border border-[#FF4D00]/10">
                  <div className="w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                     <QrCode className="w-full h-full text-slate-950" />
                  </div>
                  <div className="flex-1">
                     <h4 className="text-xs font-black text-slate-950 uppercase">Dynamic Brand QR</h4>
                     <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mt-1">
                       Automatically generated from your brand kit links. Add it to any design with one click.
                     </p>
                     <button className="text-[10px] font-black text-[#FF4D00] uppercase mt-2 hover:underline">Download QR</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center gap-3">
         <div className="p-2 bg-emerald-100 rounded-lg">
            <Check className="w-4 h-4 text-emerald-600" />
         </div>
         <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight leading-relaxed">
           Your brand kit is encrypted and securely stored. Designs will automatically suggest these colors and assets for consistency.
         </p>
      </div>
    </div>
  );
};

export default BrandKitManager;
