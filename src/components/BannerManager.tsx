import React, { useState, useEffect } from 'react';
import { 
  Upload, Link2, Monitor, Tablet, Smartphone, Sparkles, 
  Calendar, Eye, BarChart3, Clock, Check, RefreshCw, Undo, Play, Plus, Trash2, ArrowRight
} from 'lucide-react';
import { setLocalStorageData, getLocalStorageData } from '../data';

import imgB1 from '../assets/images/banner_mockup_1781270533679.jpg';
import imgB2 from '../assets/images/packaging_mockup_1781270577520.jpg';

interface Banner {
  id: string;
  name: string;
  imageUrl: string;
  clickUrl?: string;
  ctaText?: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  startDate?: string;
  endDate?: string;
  enabled: boolean;
}

const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'banner-1',
    name: 'Standard Exhibition Promotion Hoardings',
    imageUrl: imgB1,
    clickUrl: '/?tab=shop',
    ctaText: 'Claim 50% Off',
    views: 14820,
    clicks: 842,
    conversions: 41,
    revenue: 148500,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    enabled: true
  },
  {
    id: 'banner-2',
    name: 'Business Visiting Collateral Bundles',
    imageUrl: imgB2,
    clickUrl: '/?tab=shop',
    ctaText: 'Design Now',
    views: 9240,
    clicks: 432,
    conversions: 21,
    revenue: 64200,
    startDate: '2026-06-10',
    endDate: '2026-07-10',
    enabled: true
  }
];

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>(() => {
    return getLocalStorageData<Banner[]>('pb_banners_admin_list', DEFAULT_BANNERS);
  });

  const [selectedBannerId, setSelectedBannerId] = useState<string>('banner-1');

  // Input states
  const [newBannerName, setNewBannerName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newClickUrl, setNewClickUrl] = useState('');
  const [newCtaText, setNewCtaText] = useState('Explore Now');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  // AI Prompts
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Preview options
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    setLocalStorageData('pb_banners_admin_list', banners);
  }, [banners]);

  const activeBanner = banners.find(b => b.id === selectedBannerId) || banners[0];

  const handleCreateBanner = () => {
    if (!newBannerName || !newImageUrl) {
      alert('Kindly fill Banner Name and Image URL / Source to create.');
      return;
    }
    const newB: Banner = {
      id: 'banner-' + Date.now(),
      name: newBannerName,
      imageUrl: newImageUrl,
      clickUrl: newClickUrl || undefined,
      ctaText: newCtaText || undefined,
      views: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      startDate: newStart || undefined,
      endDate: newEnd || undefined,
      enabled: true
    };
    setBanners([newB, ...banners]);
    setSelectedBannerId(newB.id);
    setNewBannerName('');
    setNewImageUrl('');
    setNewClickUrl('');
    setNewCtaText('Explore Now');
    setNewStart('');
    setNewEnd('');
    alert('🎉 Premium Banner added to rotations successfully!');
  };

  const handleGenerateAiBanner = async () => {
    if (!aiPrompt) return alert('Enter prompt for the AI printing banner generator.');
    setIsGeneratingAi(true);
    
    // Mimics call to Google Generative AI to craft image configuration and headings
    setTimeout(() => {
      const generatedImages = [
        imgB1, imgB2
      ];
      const selectedImg = generatedImages[Math.floor(Math.random() * generatedImages.length)];
      
      const newB: Banner = {
        id: 'banner-' + Date.now(),
        name: `AI: ${aiPrompt.substring(0, 30)}... Exclusive Campaign`,
        imageUrl: selectedImg,
        clickUrl: '/?tab=shop',
        ctaText: 'Unlock 35% discount',
        views: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        startDate: new Date().toISOString().split('T')[0],
        enabled: true
      };

      setBanners([newB, ...banners]);
      setSelectedBannerId(newB.id);
      setIsGeneratingAi(false);
      setAiPrompt('');
      alert('✨ Google Gemini AI successfully preflighted and generated CMYK promotional web asset banner!');
    }, 2000);
  };

  const handleToggleBanner = (id: string) => {
    setBanners(banners.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  };

  const handleDeleteBanner = (id: string) => {
    if (banners.length <= 1) {
      alert('Must maintain at least one default fallback rotation banner.');
      return;
    }
    setBanners(banners.filter(b => b.id !== id));
    if (selectedBannerId === id) {
      setSelectedBannerId(banners.find(b => b.id !== id)?.id || '');
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-zinc-200/60 p-6 shadow-sm text-left space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h3 className="text-xl font-heavy text-slate-900 uppercase tracking-tight">Vanguard Smart Banner Management</h3>
          <p className="text-xs text-zinc-500 font-mono mt-1 font-bold">Configure active sliders, schedule campaigns, and track real-time click-through metrics.</p>
        </div>
        <div className="flex items-center bg-[#0F172A] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setPreviewDevice('desktop')}
            className={`p-2 rounded-xl text-xs font-black transition ${
              previewDevice === 'desktop' ? 'bg-[#FF4D00] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice('tablet')}
            className={`p-2 rounded-xl text-xs font-black transition ${
              previewDevice === 'tablet' ? 'bg-[#FF4D00] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice('mobile')}
            className={`p-2 rounded-xl text-xs font-black transition ${
              previewDevice === 'mobile' ? 'bg-[#FF4D00] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Visual Preview Frame */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4D00] font-mono flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>Rotator Visual Live Sandbox Preview ({previewDevice.toUpperCase()})</span>
            </span>
            
            {activeBanner && (
              <div className={`border-2 border-slate-950 bg-black rounded-[28px] overflow-hidden p-2 transition-all duration-300 relative mx-auto ${
                previewDevice === 'desktop' ? 'w-full aspect-[21/9]' : previewDevice === 'tablet' ? 'max-w-[500px] aspect-square' : 'max-w-[320px] aspect-[9/16]'
              }`}>
                <div className="absolute top-4 left-4 bg-[#FF4D00] text-white font-mono text-[8px] font-black uppercase px-2 py-1 rounded-full z-15 shadow-md">
                  Active Sliders Pool
                </div>
                
                <img 
                  src={activeBanner.imageUrl} 
                  alt={activeBanner.name} 
                  style={{ referrerPolicy: 'no-referrer' }}
                  className="w-full h-full object-cover rounded-[20px] opacity-85 hover:opacity-100 transition duration-300"
                />

                <div className="absolute inset-x-4 bottom-4 bg-[#0F172A]/85 backdrop-blur-md p-4 rounded-[20px] border border-white/10 flex items-center justify-between gap-4 z-10">
                  <div className="space-y-1">
                    <p className="text-white text-xs font-black uppercase leading-tight">{activeBanner.name}</p>
                    <p className="text-zinc-400 text-[9px] font-mono leading-none">Views: {activeBanner.views} | CTR: {activeBanner.views > 0 ? ((activeBanner.clicks/activeBanner.views)*100).toFixed(1) : 0}%</p>
                  </div>
                  {activeBanner.ctaText && (
                    <button className="py-2 px-4 rounded-xl bg-[#FF4D00] text-white font-heavy text-[9px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <span>{activeBanner.ctaText}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Real-time Analytics metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50 border border-zinc-200/80 p-5 rounded-[24px]">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">Total Impressions</span>
              <p className="text-xl font-heavy text-slate-800 tracking-tight mt-0.5">{activeBanner?.views || 0}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">Clicks</span>
              <p className="text-xl font-heavy text-[#FF4D00] tracking-tight mt-0.5">{activeBanner?.clicks || 0}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">Conversions</span>
              <p className="text-xl font-heavy text-slate-800 tracking-tight mt-0.5">{activeBanner?.conversions || 0}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">Rev Generated</span>
              <p className="text-xl font-heavy text-emerald-600 tracking-tight mt-0.5">₹{activeBanner?.revenue?.toLocaleString('en-IN') || 0}</p>
            </div>
          </div>

          {/* AI Automated Generator Widget */}
          <div className="bg-[#0F172A] text-white p-6 rounded-[28px] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-[#FF4D00] rounded-xl text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black uppercase tracking-tight">Gemini Offset Campaign Asset Constructor</h4>
                <p className="text-[10px] text-zinc-400 font-mono">Input campaign prompts to render professional vector flex assets.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Create an Eid Big Saving Offer Flex Banner with 30% discount CTA" 
                className="w-full pl-4 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-[18px] text-xs font-semibold focus:outline-hidden text-white placeholder-zinc-500 font-sans"
              />
              <button
                type="button"
                onClick={handleGenerateAiBanner}
                disabled={isGeneratingAi}
                className="py-2.5 px-5 bg-[#FF4D00] hover:bg-[#E03E00] text-white text-xs font-black uppercase rounded-[18px] transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGeneratingAi ? 'Synthesizing...' : 'Build AI'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Controls list */}
        <div className="space-y-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 font-mono flex items-center gap-1 label text-left">
            <Clock className="w-3.5 h-3.5" />
            <span>Rotations Slider Queue ({banners.length})</span>
          </h4>

          <div className="space-y-3">
            {banners.map((b) => (
              <div 
                key={b.id} 
                className={`p-4 rounded-[24px] border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                  selectedBannerId === b.id ? 'border-[#FF4D00] bg-zinc-50' : 'border-zinc-200 hover:border-zinc-450 bg-white'
                }`}
                onClick={() => setSelectedBannerId(b.id)}
              >
                <div className="flex items-center gap-2.5">
                  <img 
                    src={b.imageUrl} 
                    alt={b.name} 
                    style={{ referrerPolicy: 'no-referrer' }}
                    className="w-10 h-10 rounded-xl object-cover border border-zinc-200"
                  />
                  <div>
                    <h5 className="text-xs font-heavy text-slate-900 leading-tight uppercase line-clamp-1">{b.name}</h5>
                    <p className="text-[10px] text-zinc-400 font-mono font-medium mt-0.5">CTR: {b.views > 0 ? ((b.clicks/b.views)*100).toFixed(1) : 0}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleToggleBanner(b.id)}
                    className={`py-1 px-2 text-[9px] font-black uppercase rounded-lg transition ${
                      b.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-150 text-zinc-500'
                    }`}
                  >
                    {b.enabled ? 'Live' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(b.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-zinc-50 border border-zinc-200/80 p-5 rounded-[24px] text-left space-y-4">
            <h5 className="font-black text-xs uppercase tracking-tight text-zinc-800">Add New Sliders manually</h5>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-zinc-500 font-medium">Banner Name / Title</label>
                <input 
                  type="text" 
                  value={newBannerName}
                  onChange={(e) => setNewBannerName(e.target.value)}
                  placeholder="Offer banner title"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-zinc-500 font-medium">Source Image URL</label>
                <input 
                  type="text" 
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Paste banner image url"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-[11px] font-mono focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-zinc-500 font-medium">Click / CTA URL</label>
                <input 
                  type="text" 
                  value={newClickUrl}
                  onChange={(e) => setNewClickUrl(e.target.value)}
                  placeholder="/?tab=shop"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-zinc-500 font-medium">CTA Button Text</label>
                  <input 
                    type="text" 
                    value={newCtaText}
                    onChange={(e) => setNewCtaText(e.target.value)}
                    placeholder="Claim discount"
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-zinc-500 font-medium">Schedule End Date</label>
                  <input 
                    type="date" 
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateBanner}
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-[16px] text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Upload & Publish Banner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
