import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Grid, 
  Heart, 
  Copy, 
  Eye, 
  Star, 
  Filter,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ProductCategory } from '../types';

const CATEGORIES: string[] = [
  'All', 'Business', 'Wedding', 'Invitation', 'Islamic', 'School', 'College', 
  'Restaurant', 'Medical', 'Political', 'Real Estate', 'Corporate', 'Festival', 
  'YouTube', 'Instagram', 'Facebook', 'Packaging', 'Labels', 'Certificates', 
  'ID Cards', 'Books', 'Magazines', 'Brochures', 'Flyers', 'Posters', 
  'Banners', 'Flex', 'Visiting Cards', 'Notebook Covers', 'Folders', 
  'Letterheads', 'Resume', 'Invoices', 'Menus', 'Gift Cards'
];

interface Template {
  id: string;
  name: string;
  category: string;
  preview: string;
  premium: boolean;
  rating: number;
  uses: number;
}

const MOCK_TEMPLATES: Template[] = [
  { id: '1', name: 'Premium Corporate Card', category: 'Corporate', preview: 'https://images.unsplash.com/photo-1572044162444-ad60f128bde7?auto=format&fit=crop&q=80&w=400', premium: true, rating: 4.9, uses: 1200 },
  { id: '2', name: 'Royal Wedding Invite', category: 'Wedding', preview: 'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&q=80&w=400', premium: true, rating: 4.8, uses: 850 },
  { id: '3', name: 'Minimalist Menu', category: 'Restaurant', preview: 'https://images.unsplash.com/photo-1546197147-36e7884c0628?auto=format&fit=crop&q=80&w=400', premium: false, rating: 4.7, uses: 2300 },
  { id: '4', name: 'Social Media Banner', category: 'Instagram', preview: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=400', premium: false, rating: 4.5, uses: 4500 },
  { id: '5', name: 'Medical Conference Poster', category: 'Medical', preview: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400', premium: true, rating: 4.9, uses: 320 },
  { id: '6', name: 'Real Estate Flyer', category: 'Real Estate', preview: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400', premium: false, rating: 4.6, uses: 1500 },
];

interface Props {
  onSelect: (template: any) => void;
  onPreview: (template: any) => void;
}

const TemplateMarketplace: React.FC<Props> = ({ onSelect, onPreview }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredTemplates = MOCK_TEMPLATES.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-zinc-100 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-heavy text-slate-950 uppercase tracking-tighter">Template Marketplace</h2>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Enterprise Design Library</p>
          </div>
          <div className="flex items-center gap-2">
             <button className="p-2 hover:bg-zinc-100 rounded-lg transition text-zinc-500">
               <Filter className="w-4 h-4" />
             </button>
             <button className="p-2 hover:bg-zinc-100 rounded-lg transition text-zinc-500">
               <Grid className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-[#FF4D00] transition-colors" />
          <input 
            type="text"
            placeholder="Search 5,000+ templates..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categories Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? 'bg-slate-950 text-white border-slate-950 shadow-md' 
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide no-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template, idx) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="group relative bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-[#FF4D00]/5 hover:-translate-y-1 transition-all cursor-pointer"
                onClick={() => onSelect(template)}
              >
                {/* Image Container */}
                <div className="relative aspect-[4/5] bg-zinc-100 overflow-hidden">
                  <img 
                    src={template.preview} 
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                    <button 
                      className="bg-white text-slate-950 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-[#FF4D00] hover:text-white transition-colors"
                      onClick={(e) => { e.stopPropagation(); onPreview(template); }}
                    >
                      Quick View
                    </button>
                    <button className="bg-[#FF4D00] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-white hover:text-[#FF4D00] transition-colors">
                      Edit Design
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {template.premium && (
                      <div className="bg-[#FF4D00] text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-2.5 h-2.5" />
                        PRO
                      </div>
                    )}
                  </div>

                  {/* Fav Button */}
                  <button 
                    onClick={(e) => toggleFavorite(template.id, e)}
                    className={`absolute top-3 right-3 p-1.5 rounded-full shadow-lg transition-all ${
                      favorites.includes(template.id) 
                        ? 'bg-[#FF4D00] text-white' 
                        : 'bg-white/90 text-zinc-400 hover:text-[#FF4D00]'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${favorites.includes(template.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 border-t border-zinc-100 bg-white">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate flex-1">
                      {template.name}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{template.category}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-current" />
                      <span className="text-[10px] font-black text-slate-950">{template.rating}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-zinc-50">
                     <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">
                       {template.uses.toLocaleString()} uses
                     </span>
                     <button className="text-zinc-400 hover:text-slate-950 transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                     </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-zinc-200" />
             </div>
             <h3 className="text-sm font-black text-slate-900 uppercase">No templates found</h3>
             <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Try adjusting your search or category</p>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              All templates are print-ready
            </span>
         </div>
         <button className="text-[10px] font-black text-[#FF4D00] uppercase tracking-tighter hover:underline">
            Request Custom Template
         </button>
      </div>
    </div>
  );
};

export default TemplateMarketplace;
