import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  CheckCircle2, 
  Sparkles, 
  UserPlus, 
  ExternalLink,
  ShoppingBag,
  MoreVertical,
  Flag,
  Play,
  Award
} from 'lucide-react';
import { SocialPost, SocialComment, UserSession } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  where, 
  addDoc, 
  serverTimestamp, 
  increment,
  updateDoc,
  doc
} from 'firebase/firestore';

interface CommunityFeedProps {
  session: UserSession;
  isAdmin: boolean;
  onPostClick?: (post: SocialPost) => void;
  onCreatorClick?: (creatorId: string) => void;
  onBuyClick?: (productId: string) => void;
  triggerToast: (title: string, type?: 'success' | 'warn') => void;
}

import { DEMO_SOCIAL_POSTS } from '../data';

export default function CommunityFeed({ 
  session, 
  isAdmin, 
  onPostClick, 
  onCreatorClick, 
  onBuyClick,
  triggerToast 
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'following' | 'trending' | 'reels'>('trending');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Hardcoded super admins from requirements
  const isSuperAdmin = session.email === 'musagraphics75@gmail.com' || session.email === 'gazisiddiqui01@gmail.com';

  useEffect(() => {
    setLoading(true);
    setErrorStatus(null);
    let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    
    if (activeTab === 'trending') {
      q = query(collection(db, 'posts'), orderBy('likesCount', 'desc'), limit(20));
    }

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as SocialPost));
      setPosts(docs);
      setLoading(false);
      setErrorStatus(null);
    }, (error) => {
      console.error("Community Feed Firestore Error:", error);
      setErrorStatus(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const displayPosts = (posts.length === 0 || errorStatus) 
    ? DEMO_SOCIAL_POSTS.filter((p: any) => activeTab === 'reels' ? p.media[0]?.type === 'video' : p.media[0]?.type !== 'video') 
    : posts;

  return (
    <div className="max-w-xl mx-auto pb-24 px-4 relative">
      <div className="flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-30 pt-4 pb-2 border-b border-zinc-100 mb-4 px-2">
         <h1 className="text-xl font-black uppercase tracking-tighter text-zinc-900">Community</h1>
         <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button 
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Admin
              </button>
            )}
            <button 
              onClick={() => setShowCreatePost(true)}
              className="px-4 py-2 bg-[#FF4D00] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#FF4D00]/20 hover:shadow-[#FF4D00]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Create
            </button>
         </div>
      </div>

      {showAdminPanel && isSuperAdmin && (
        <div className="mb-6 p-4 rounded-3xl bg-zinc-900 text-white border border-zinc-800 shadow-2xl">
           <h3 className="text-xs font-black uppercase tracking-widest text-[#FF4D00] flex items-center gap-2 mb-4">
             <Flag className="w-4 h-4" />
             Content Admin Panel
           </h3>
           <div className="grid grid-cols-2 gap-3">
             <button className="py-2.5 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all">Manage Posts</button>
             <button className="py-2.5 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all">Verify Creators</button>
             <button className="py-2.5 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all">Add Challenge</button>
             <button className="py-2.5 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all text-rose-400">Ban / Timeout</button>
             <button className="py-2.5 col-span-2 bg-[#FF4D00] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FF4D00]/80 transition-all">Upload Featured Reel</button>
           </div>
        </div>
      )}

      {/* Diagnostic Panel */}
      <AnimatePresence>
        {errorStatus && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden rounded-2xl bg-rose-50 border border-rose-200"
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-widest">
                <Flag className="w-4 h-4" />
                Firestore Diagnostic Report
              </div>
              <p className="text-[10px] font-mono text-rose-800 break-words">{errorStatus}</p>
              <div className="text-[10px] text-rose-600 mt-2 p-2 bg-rose-100/50 rounded-xl flex items-center justify-between">
                 <span>Applying Fallback Demo Content...</span>
                 <span className="font-bold">STATUS: OK</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed Tabs */}
      <div className="sticky top-14 bg-white/95 backdrop-blur-xl z-20 flex flex-col justify-center gap-4 py-3 border-b border-zinc-100">
        <div className="flex justify-center gap-8">
          {(['trending', 'following', 'reels'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab ? 'text-[#FF4D00]' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTabSocial"
                  className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#FF4D00] rounded-full"
                />
              )}
            </button>
          ))}
        </div>
        
        {activeTab === 'trending' && (
           <div className="flex overflow-x-auto pb-2 px-2 gap-2 hide-scrollbar w-full max-w-full">
              {['Trending Today', 'Top Wedding Cards', 'Top Visiting Cards', 'Most Liked', 'Most Shared', "Editor's Choice", 'AI Picks'].map((cat, i) => (
                 <button key={i} className="whitespace-nowrap px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm transition-all border border-zinc-200/50">
                    {cat}
                 </button>
              ))}
           </div>
        )}
      </div>

      {/* Promotional / Challenge Banner if not Reels */}
      {activeTab === 'trending' && (
        <div className="mt-4 mx-4 p-5 bg-linear-to-br from-[#FF4D00] to-rose-600 rounded-3xl text-white shadow-xl shadow-[#FF4D00]/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Award className="w-24 h-24" />
           </div>
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-white border border-white/20">Active Challenge</span>
                <span className="text-[10px] font-bold text-white/80">Ends in 3 days</span>
             </div>
             <h3 className="text-lg font-black uppercase tracking-tight mb-1">Best Wedding Card</h3>
             <p className="text-xs font-medium text-white/90 max-w-[80%] leading-snug mb-4">Design a minimalist wedding card with spot UV finishing. Winner gets 5,000 PB Credits and Featured Creator badge.</p>
             <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-white text-[#FF4D00] rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Submit Entry</button>
                <div className="flex -space-x-2">
                   <img src="https://i.pravatar.cc/150?u=a1" className="w-6 h-6 rounded-full border-2 border-[#FF4D00]" alt="" />
                   <img src="https://i.pravatar.cc/150?u=a2" className="w-6 h-6 rounded-full border-2 border-[#FF4D00]" alt="" />
                   <img src="https://i.pravatar.cc/150?u=a3" className="w-6 h-6 rounded-full border-2 border-[#FF4D00]" alt="" />
                   <div className="w-6 h-6 rounded-full bg-black/20 border-2 border-white flex items-center justify-center text-[8px] font-bold">+42</div>
                </div>
             </div>
           </div>
        </div>
      )}

      <div className="mt-6 space-y-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => <SocialPostSkeleton key={i} />)}
            </div>
          ) : (
            <>
              {(posts.length === 0 || errorStatus) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-4 px-4 bg-amber-50 border border-amber-200 rounded-2xl mb-6 flex gap-3 text-amber-900"
                >
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest mb-1.5 leading-tight">Live Mode Empty - Demo Mode Active</h3>
                    <p className="text-[10px] font-medium opacity-80 leading-relaxed">No real data found yet. Showing hyper-realistic demo content. Create a real post to overwrite demo mode automatically.</p>
                  </div>
                </motion.div>
              )}

              {displayPosts.length === 0 && activeTab === 'reels' ? (
                <div className="py-12 bg-zinc-50 border border-dashed border-zinc-200 rounded-[32px] text-center p-6 mt-8">
                  <div className="mx-auto w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                    <Play className="w-8 h-8 text-zinc-300 ml-1" />
                  </div>
                  <h3 className="text-zinc-900 font-black uppercase tracking-widest text-sm mb-2">🎬 No Reels Available</h3>
                  <p className="text-zinc-400 font-medium text-xs mb-6">Create the first design reel today.</p>
                  <button onClick={() => setShowCreatePost(true)} className="px-6 py-3 bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#FF4D00]/20">
                    Upload Reel
                  </button>
                </div>
              ) : (
                displayPosts.map((post: SocialPost, idx: number) => (
                  <SocialPostCard 
                    key={post.id || `demo-${idx}`} 
                    post={post} 
                    currentUserId={session.id}
                    onCreatorClick={onCreatorClick}
                    onPostClick={onPostClick}
                    onBuyClick={onBuyClick}
                    triggerToast={triggerToast}
                  />
                ))
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Create Post Modal Overlay */}
      {showCreatePost && (
        <CreatePostModal 
          session={session}
          onClose={() => setShowCreatePost(false)}
          triggerToast={triggerToast}
        />
      )}
    </div>
  );
}

function SocialPostCard({ 
  post, 
  currentUserId,
  onCreatorClick, 
  onPostClick,
  onBuyClick,
  triggerToast
}: { 
  post: SocialPost; 
  currentUserId: string;
  onCreatorClick?: (id: string) => void;
  onPostClick?: (p: SocialPost) => void;
  onBuyClick?: (id: string) => void;
  triggerToast: (t: string, type?: 'success' | 'warn') => void;
  key?: any;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    setIsLiked(!isLiked);
    // In real app, update firestore
    const postRef = doc(db, 'posts', post.id);
    await updateDoc(postRef, {
      likesCount: increment(isLiked ? -1 : 1)
    }).catch(e => console.error(e));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-zinc-100 rounded-[32px] overflow-hidden shadow-sm"
    >
      {/* Card Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onCreatorClick?.(post.creatorId)}>
          <div className="w-10 h-10 rounded-full bg-zinc-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            {post.creatorAvatar ? (
              <img src={post.creatorAvatar} className="w-full h-full object-cover" alt="" />
            ) : (
              <Sparkles className="w-5 h-5 text-zinc-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-tight text-zinc-900">{post.creatorName}</span>
              {post.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />}
              {post.isAiGenerated && (
                <span className="px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 text-[7px] font-black uppercase tracking-widest">AI</span>
              )}
            </div>
            <p className="text-[9px] font-mono text-zinc-400 font-bold uppercase">{post.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-zinc-50 rounded-full transition text-zinc-400">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Card Media (Instagram style carousel) */}
      <div className="relative aspect-square bg-zinc-50 group overflow-hidden">
        {post.media[0]?.type === 'video' ? (
          <video 
            src={post.media[0]?.url} 
            poster={post.media[0]?.thumbnail}
            className="w-full h-full object-cover cursor-pointer"
            loop
            autoPlay
            muted
            playsInline
            onClick={() => onPostClick?.(post)}
          />
        ) : (
          <img 
            src={post.media[0]?.url || 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop'} 
            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
            alt={post.caption}
            onClick={() => onPostClick?.(post)}
          />
        )}
        
        {/* Quick Action Overlay */}
        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
           {post.linkedProductId && (
             <button 
               onClick={() => onBuyClick?.(post.linkedProductId!)}
               className="flex-1 bg-white/90 backdrop-blur-md text-zinc-900 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-white shadow-xl hover:bg-white active:scale-95 transition-all"
             >
               <ShoppingBag className="w-3.5 h-3.5 text-[#FF4D00]" />
               Shop this print
             </button>
           )}
           <button 
             className="w-12 bg-white/90 backdrop-blur-md text-zinc-900 rounded-2xl flex items-center justify-center border border-white shadow-xl hover:bg-white transition-all active:scale-95"
             onClick={() => triggerToast('Design shared to clipboard!', 'success')}
           >
             <Share2 className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition ${isLiked ? 'text-rose-500' : 'text-zinc-600 hover:text-rose-500'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-black font-mono">{post.likesCount + (isLiked ? 1 : 0)}</span>
            </button>
            <button className="flex items-center gap-1.5 text-zinc-600 hover:text-[#FF4D00] transition">
              <MessageCircle className="w-5 h-5" />
              <span className="text-[10px] font-black font-mono">{post.commentCount}</span>
            </button>
            <button className="text-zinc-600 hover:text-[#FF4D00] transition">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <button className="text-zinc-600 hover:text-[#FF4D00] transition">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        <div>
          <p className="text-[11px] text-zinc-800 leading-relaxed">
            <span className="font-black mr-2 uppercase tracking-tight">{post.creatorName}</span>
            {post.caption}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {post.tags.map(tag => (
              <span key={tag} className="text-[10px] font-mono font-bold text-[#FF4D00] hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {post.commentCount > 0 && (
          <button className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition">
            View all {post.commentCount} comments
          </button>
        )}
      </div>
    </motion.div>
  );
}

function SocialPostSkeleton() {
  return (
    <div className="bg-white border border-zinc-100 rounded-[32px] overflow-hidden animate-pulse">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-100" />
        <div className="space-y-1.5">
          <div className="h-2.5 w-24 bg-zinc-100 rounded" />
          <div className="h-2 w-16 bg-zinc-50 rounded" />
        </div>
      </div>
      <div className="aspect-square bg-zinc-50" />
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          <div className="w-5 h-5 bg-zinc-100 rounded" />
          <div className="w-5 h-5 bg-zinc-100 rounded" />
          <div className="w-5 h-5 bg-zinc-100 rounded" />
        </div>
        <div className="h-2.5 w-full bg-zinc-50 rounded" />
        <div className="h-2.5 w-2/3 bg-zinc-50 rounded" />
      </div>
    </div>
  );
}

function CreatePostModal({ session, onClose, triggerToast }: { session: UserSession, onClose: () => void, triggerToast: (t: string, typ?: 'success'|'warn') => void }) {
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!caption.trim()) {
      triggerToast('Caption cannot be empty', 'warn');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        creatorId: session.id,
        creatorName: session.name,
        // creatorAvatar: session.avatar, // Add if available
        creatorBadges: [],
        caption: caption,
        media: [], // Real uploads would go here
        tags: caption.match(/#[a-zA-Z0-9_]+/g)?.map(t => t.replace('#', '')) || [],
        likesCount: 0,
        commentCount: 0,
        shareCount: 0,
        saveCount: 0,
        isAiGenerated: false,
        isVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      triggerToast('Post created successfully!', 'success');
      onClose();
    } catch (error) {
      console.error(error);
      triggerToast('Failed to create post. Check console.', 'warn');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900">Create New Post</h2>
          <button onClick={onClose} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors">
             <CloseIcon className="w-4 h-4 text-zinc-900" />
          </button>
        </div>

        <div className="space-y-4">
           {/* Mock File Uploader */}
           <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF4D00] hover:bg-orange-50/50 transition-colors">
              <div className="w-12 h-12 bg-orange-100 text-[#FF4D00] rounded-full flex items-center justify-center mb-3">
                 <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-zinc-600">Click to upload Media</p>
              <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold text-center">Supports 5 Images or 2 Videos<br/>Max size 50MB</p>
           </div>

           <textarea 
             className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:border-[#FF4D00] transition-colors"
             rows={4}
             placeholder="Write a caption... add #hashtags"
             value={caption}
             onChange={e => setCaption(e.target.value)}
           />

           <div className="grid grid-cols-2 gap-3">
              <select className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-bold text-zinc-600 focus:outline-none focus:border-[#FF4D00]">
                 <option value="">Select Category</option>
                 <option value="business_cards">Business Cards</option>
                 <option value="wedding_cards">Wedding Cards</option>
                 <option value="posters">Posters & Banners</option>
              </select>
              <input type="text" placeholder="Location" className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-[#FF4D00]" />
           </div>

           <button 
             onClick={handlePost} 
             disabled={loading}
             className="w-full bg-[#FF4D00] text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#E64600] active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
           >
             {loading ? 'Posting...' : 'Share to Community'}
           </button>
        </div>
      </motion.div>
    </div>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
