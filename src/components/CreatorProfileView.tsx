import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Sparkles, 
  Settings, 
  UserPlus, 
  MessageCircle, 
  Grid, 
  Bookmark, 
  Award,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Package,
  Heart,
  Share2
} from 'lucide-react';
import { UserStats, UserSession, SocialPost, Achievement } from '../types';
import { db, collection, query, where, orderBy, onSnapshot, limit } from '../firebase';

interface CreatorProfileViewProps {
  stats: UserStats;
  session: UserSession;
  isOwnProfile: boolean;
  onBack: () => void;
  onEditProfile?: () => void;
  onMessage?: () => void;
  onFollow?: () => void;
  triggerToast: (t: string) => void;
}

import { DEMO_SOCIAL_POSTS } from '../data';

export default function CreatorProfileView({ 
  stats, 
  session, 
  isOwnProfile, 
  onBack,
  onEditProfile,
  onMessage,
  onFollow,
  triggerToast
}: CreatorProfileViewProps) {
  const [activeView, setActiveView] = useState<'portfolio' | 'saved' | 'achievements'>('portfolio');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const targetCreatorId = stats.userName || session.id;

  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, 'posts'), 
      where('creatorId', '==', targetCreatorId),
      orderBy('createdAt', 'desc'),
      limit(24)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ ...d.data(), id: d.id } as SocialPost)));
    });
    return () => unsub();
  }, [targetCreatorId]);

  const displayPosts = posts.length === 0 ? DEMO_SOCIAL_POSTS.filter(p => p.creatorId === targetCreatorId) : posts;
  
  // Extract mockup data
  const isDemo = posts.length === 0 && displayPosts.length > 0;
  const demoCreatorName = isDemo ? displayPosts[0].creatorName : stats.userName;
  const demoAvatar = isDemo ? displayPosts[0].creatorAvatar : null;
  const demoBadges = isDemo ? displayPosts[0].creatorBadges : stats.badges;
  const demoFollowers = isDemo ? Math.floor(displayPosts.reduce((acc, p) => acc + p.likesCount, 0) * 1.5) : stats.followersCount;
  const demoFollowing = isDemo ? Math.floor(demoFollowers * 0.1) : stats.followingCount;
  const demoLikes = isDemo ? displayPosts.reduce((acc, p) => acc + p.likesCount, 0) : stats.likesReceived;
  const demoTotalDesigns = isDemo ? displayPosts.length : stats.totalDesignsCount;

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden bg-zinc-900 group">
        {stats.coverBanner ? (
          <img src={stats.coverBanner} className="w-full h-full object-cover" alt="Cover" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#FF4D00]/20 to-purple-900/40 relative">
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        
        {/* Profile Avatar */}
        <div className="absolute -bottom-10 left-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] bg-white p-1 shadow-2xl border-4 border-white overflow-hidden z-10 relative">
            <div className="w-full h-full rounded-[28px] bg-zinc-100 flex items-center justify-center overflow-hidden">
               {demoAvatar ? (
                 <img src={demoAvatar} className="w-full h-full object-cover" alt={demoCreatorName} />
               ) : (
                 <Sparkles className="w-8 h-8 text-zinc-300" />
               )}
            </div>
          </div>
        </div>
        
        <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all z-20">
           <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="mt-14 px-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900">
                {demoCreatorName || session.name}
              </h1>
              {demoBadges?.includes('verified') && <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />}
              {demoBadges?.includes('premium') && <Award className="w-4 h-4 text-amber-500" />}
              {demoBadges?.includes('ai_creator') && <span className="px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 text-[7px] font-black uppercase tracking-widest">AI AI</span>}
            </div>
            <p className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
              @{targetCreatorId || stats.referralCode || 'creator'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <button 
                onClick={onEditProfile}
                className="p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl transition"
              >
                <Settings className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button 
                  onClick={onMessage}
                  className="p-3 bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 text-[#FF4D00] rounded-2xl transition"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button 
                  onClick={onFollow}
                  className="px-6 py-3 bg-[#FF4D00] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#FF4D00]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Follow
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-600 leading-relaxed max-w-lg">
          {isDemo ? `Specialized in premium offset prints and high-quality designs. Showcasing my latest work and exploring modern aesthetics. DM for collaborations and orders.` : (stats.bio || 'Architecting the future of Indian Print. Design with pixel-perfection and industrial offset grade durability.')}
        </p>

        {/* Stats Row */}
        <div className="flex gap-8 border-b border-zinc-100 pb-6 pt-2 overflow-x-auto no-scrollbar">
          <StatItem label="Followers" value={demoFollowers || 0} />
          <StatItem label="Following" value={demoFollowing || 0} />
          <StatItem label="Likes" value={demoLikes || 0} />
          <StatItem label="Prints" value={demoTotalDesigns || 0} />
        </div>

        {/* Action Tabs */}
        <div className="flex gap-4 pt-2">
          <TabButton 
            active={activeView === 'portfolio'} 
            onClick={() => setActiveView('portfolio')}
            icon={<Grid className="w-4 h-4" />}
            label="Portfolio"
          />
          <TabButton 
            active={activeView === 'saved'} 
            onClick={() => setActiveView('saved')}
            icon={<Bookmark className="w-4 h-4" />}
            label="Collections"
          />
          <TabButton 
            active={activeView === 'achievements'} 
            onClick={() => setActiveView('achievements')}
            icon={<Award className="w-4 h-4" />}
            label="Badges"
          />
        </div>

        {/* Profile Content View */}
        <div className="py-6">
          <AnimatePresence mode="wait">
            {activeView === 'portfolio' && (
              <motion.div 
                key="portfolio"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-2"
              >
                {displayPosts.length > 0 ? displayPosts.map((post) => (
                  <div key={post.id} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-zinc-100 shadow-sm">
                    <img src={post.media[0]?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-[10px] font-black">
                       <span className="flex items-center gap-1"><Heart className="w-3 h-3 fill-current" /> {post.likesCount}</span>
                       <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3 fill-current" /> {post.commentCount}</span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-12 text-center text-zinc-400 font-mono text-[9px] uppercase font-bold border-2 border-dashed border-zinc-100 rounded-3xl">
                    No portfolio pieces uploaded yet
                  </div>
                )}
              </motion.div>
            )}

            {activeView === 'achievements' && (
              <motion.div 
                key="achievements"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-4"
              >
                {(stats.achievements || []).map((achievement) => (
                  <div key={achievement.id} className="flex gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200/50">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#FF4D00]">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase text-zinc-900">{achievement.title}</h4>
                      <p className="text-[9px] text-zinc-500">{achievement.description}</p>
                      <p className="text-[8px] font-mono text-zinc-400 mt-1 uppercase font-bold">Unlocked {achievement.unlockedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</p>
                    </div>
                  </div>
                ))}
                {(stats.achievements || []).length === 0 && (
                  <div className="py-12 text-center text-zinc-400 font-mono text-[9px] uppercase font-bold border-2 border-dashed border-zinc-100 rounded-3xl">
                     Begin your social printing journey to unlock badges
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex flex-col items-center min-w-[60px]">
      <span className="text-sm font-black text-zinc-900">{value > 999 ? (value/1000).toFixed(1) + 'K' : value}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
        active 
          ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-900/10' 
          : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200'
      }`}
    >
      {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}
