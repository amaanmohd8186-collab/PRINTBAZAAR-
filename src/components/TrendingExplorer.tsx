import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  TrendingUp, 
  Hash, 
  MapPin, 
  Sparkles, 
  Layers, 
  Clock,
  ChevronRight,
  Filter,
  Mic,
  Camera,
  Heart,
  MessageCircle,
  Play
} from 'lucide-react';
import { SocialPost, ProductCategory } from '../types';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';

interface TrendingExplorerProps {
  onPostClick: (post: SocialPost) => void;
  onHashtagClick: (tag: string) => void;
  onCategoryClick: (cat: ProductCategory) => void;
}

export default function TrendingExplorer({ onPostClick, onHashtagClick, onCategoryClick }: TrendingExplorerProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'trending' | 'new' | 'nearby' | 'recommended'>('trending');
  const [hashtags, setHashtags] = useState(['WeddingCard', 'VisitingCard', 'Logo', 'Poster', 'PrintBazaar', 'AIArt']);

  useEffect(() => {
    let q = query(collection(db, 'posts'), orderBy('likesCount', 'desc'), limit(15));
    
    if (activeFilter === 'new') {
      q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(15));
    }

    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialPost)));
    });
    return () => unsub();
  }, [activeFilter]);

  return (
    <div className="pb-24 px-4 pt-4 space-y-8 max-w-2xl mx-auto">
      {/* Smart Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-[#FF4D00] transition" />
        </div>
        <input 
          type="text"
          placeholder="Search by keyword, style, hashtag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-100 focus:bg-white focus:border-[#FF4D00] focus:ring-4 focus:ring-[#FF4D00]/5 py-4 pl-12 pr-24 rounded-3xl text-sm font-medium transition-all shadow-sm"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          <button className="p-2.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-2xl transition">
            <Mic className="w-4 h-4" />
          </button>
          <button className="p-2.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-2xl transition">
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        <FilterChip active={activeFilter === 'trending'} onClick={() => setActiveFilter('trending')} icon={<TrendingUp />} label="Trending" />
        <FilterChip active={activeFilter === 'new'} onClick={() => setActiveFilter('new')} icon={<Clock />} label="New" />
        <FilterChip active={activeFilter === 'nearby'} onClick={() => setActiveFilter('nearby')} icon={<MapPin />} label="Nearby" />
        <FilterChip active={activeFilter === 'recommended'} onClick={() => setActiveFilter('recommended')} icon={<Sparkles />} label="AI Picks" />
      </div>

      {/* Trending Hashtags */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-800 flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#FF4D00]" />
            Trending Hashtags
          </h3>
          <button className="text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-600">See All</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {hashtags.map((tag) => (
            <button 
              key={tag}
              onClick={() => onHashtagClick(tag)}
              className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 hover:border-[#FF4D00] hover:bg-white rounded-2xl transition-all group"
            >
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-black text-zinc-800">#{tag}</span>
                <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase">1.2K Posts</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:translate-x-1 transition" />
            </button>
          ))}
        </div>
      </section>

      {/* Explorer Grid (Bento Style) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-800">Visual Discovery</h3>
          <button className="p-2 bg-zinc-100 text-zinc-400 rounded-xl">
             <Layers className="w-4 h-4" />
          </button>
        </div>
        
        <div className="columns-2 gap-3 space-y-3">
          {posts.map((post, idx) => (
            <motion.div 
               key={post.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.05 }}
               onClick={() => onPostClick(post)}
               className="relative overflow-hidden rounded-2xl border border-zinc-100 shadow-sm cursor-pointer group"
            >
              <div className={idx % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'}>
                 <img src={post.media[0]?.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                 <div className="flex items-center gap-3 text-white">
                    <span className="flex items-center gap-1 text-[9px] font-black"><Heart className="w-3 h-3 fill-current" /> {post.likesCount}</span>
                    <span className="flex items-center gap-1 text-[9px] font-black"><MessageCircle className="w-3 h-3 fill-current" /> {post.commentCount}</span>
                    {post.media[0]?.type === 'video' && <Play className="w-3 h-3 fill-current ml-auto" />}
                 </div>
              </div>
              {post.isAiGenerated && (
                <div className="absolute top-2 right-2 bg-white/40 backdrop-blur-md rounded-full p-1 border border-white/50">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FilterChip({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all ${
        active 
          ? 'bg-[#FF4D00] text-white border-[#FF4D00] shadow-lg shadow-[#FF4D00]/20' 
          : 'bg-zinc-50 text-zinc-400 border-zinc-100 hover:border-zinc-200'
      }`}
    >
      {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
