/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  Heart, 
  Wallet, 
  Gift, 
  MessageSquare, 
  Bell, 
  Download, 
  RefreshCcw, 
  Settings, 
  LogOut, 
  ChevronRight, 
  FileText, 
  CreditCard, 
  Package, 
  Plus, 
  Search,
  Layout,
  Star,
  Users,
  ShieldCheck,
  Headphones,
  Trash2,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { db, auth, collection, onSnapshot, query, where, orderBy, doc, updateDoc, setDoc } from '../firebase';
import { Order, UserStats, Address, SavedDesign, AppNotification, SupportTicket, Coupon, BrandKit } from '../types';
import { format } from 'date-fns';
import BrandKitManager from './BrandKitManager';

interface CustomerDashboardProps {
  user: { id: string; name: string; email: string };
  stats: UserStats;
  onLogout: () => void;
  onNavigateToOrder: (orderId: string) => void;
  onEditAddress: (address: Address) => void;
  onAddAddress: () => void;
}

export default function CustomerDashboard({ 
  user, 
  stats, 
  onLogout, 
  onNavigateToOrder,
  onEditAddress,
  onAddAddress
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'designs' | 'addresses' | 'wallet' | 'support' | 'notifications' | 'wishlist' | 'brandkit'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);

  useEffect(() => {
    if (!user.id) return;

    // Listen to Brand Kit
    const brandKitRef = doc(db, 'brandKits', user.id);
    const unsubBrandKit = onSnapshot(brandKitRef, (snap) => {
      if (snap.exists()) {
        setBrandKit(snap.data() as BrandKit);
      }
    });

    // Listen to orders
    const ordersRef = collection(db, 'orders');
    const qOrders = query(ordersRef, where('customerId', '==', user.id), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    // Listen to notifications
    const notifyRef = collection(db, 'notifications');
    const qNotify = query(notifyRef, where('userId', '==', user.id), orderBy('createdAt', 'desc'));
    const unsubNotify = onSnapshot(qNotify, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification)));
    });

    // Listen to designs
    const designsRef = collection(db, 'designs');
    const qDesigns = query(designsRef, where('userId', '==', user.id), orderBy('createdAt', 'desc'));
    const unsubDesigns = onSnapshot(qDesigns, (snap) => {
      setSavedDesigns(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedDesign)));
    });

    // Listen to wishlist
    const wishlistRef = collection(db, 'wishlist');
    const qWishlist = query(wishlistRef, where('userId', '==', user.id));
    const unsubWishlist = onSnapshot(qWishlist, (snap) => {
      setWishlist(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubOrders();
      unsubNotify();
      unsubDesigns();
      unsubWishlist();
      unsubBrandKit();
    };
  }, [user.id]);

  const handleUpdateBrandKit = async (kit: BrandKit) => {
    if (!user.id) return;
    try {
      await setDoc(doc(db, 'brandKits', user.id), {
        ...kit,
        userId: user.id,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating brand kit:', error);
    }
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'brandkit', label: 'Brand Kit', icon: Briefcase },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'designs', label: 'My Designs', icon: Layout },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'wallet', label: 'Wallet & Rewards', icon: Wallet },
    { id: 'support', label: 'Help Center', icon: Headphones },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: notifications.filter(n => !n.isRead).length },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <div className="w-full md:w-80 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-8 border-b border-zinc-100">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest">{user.name}</h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stats.subscriptionTier} Member</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Loyalty</span>
                <span className="text-xs font-black text-zinc-900 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  {stats.loyaltyPoints || 0}
                </span>
              </div>
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Wallet</span>
                <span className="text-xs font-black text-zinc-900">₹{stats.walletBalance || 0}</span>
              </div>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' 
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </div>
              {tab.badge ? (
                <span className="bg-[#FF4D00] text-white text-[8px] px-1.5 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              ) : (
                <ChevronRight className="w-3.5 h-3.5 opacity-30" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-zinc-100">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">My Account</h1>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Manage your personal details and security settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#FF4D00]/5 rounded-2xl">
                        <Briefcase className="w-5 h-5 text-[#FF4D00]" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest">Enterprise Identity</h3>
                   </div>
                   <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase">
                     Setup your Brand Kit to automatically apply logos, colors, and business details to all your future designs.
                   </p>
                   <button 
                    onClick={() => setActiveTab('brandkit')}
                    className="w-full py-3.5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FF4D00] transition shadow-lg"
                   >
                     Manage Brand Kit
                   </button>
                </div>

                <div className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-zinc-100 rounded-2xl">
                        <User className="w-5 h-5 text-zinc-900" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest">Personal Details</h3>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Full Name</label>
                        <p className="text-sm font-black text-zinc-900">{user.name}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
                        <p className="text-sm font-black text-zinc-900">{user.email}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Mobile Number</label>
                        <p className="text-sm font-black text-zinc-900">{stats.mobile || 'Not Linked'}</p>
                      </div>
                   </div>

                   <button className="w-full py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition">
                     Update Profile
                   </button>
                </div>

                <div className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-50 rounded-2xl">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-widest">Membership</h3>
                   </div>

                   <div className="p-6 bg-zinc-900 rounded-3xl text-white relative overflow-hidden">
                      <div className="relative z-10 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Status</p>
                        <h4 className="text-2xl font-black uppercase italic tracking-tighter">{stats.subscriptionTier}</h4>
                        <div className="flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-emerald-500" />
                           <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Verified Account</span>
                        </div>
                      </div>
                      <div className="absolute -right-8 -bottom-8 opacity-10">
                        <Star className="w-32 h-32 text-white" />
                      </div>
                   </div>

                   <button className="w-full py-3.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg shadow-black/10">
                     View Benefits
                   </button>
                </div>
              </div>

              {/* Referral Section */}
              <div className="bg-zinc-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-zinc-200">
                 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 max-w-md">
                       <h3 className="text-2xl font-black uppercase tracking-tight">PrintBazaar Referral Program</h3>
                       <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
                         Invite your network to PrintBazaar. Get ₹500 in your wallet for every professional order placed.
                       </p>
                       <div className="flex items-center gap-4">
                          <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl">
                            <span className="text-[10px] font-black tracking-[0.3em]">{stats.referralCode || 'PBZ-XXXX'}</span>
                          </div>
                          <button className="text-[10px] font-black uppercase tracking-widest text-[#FF4D00] hover:underline transition">
                            Copy Link
                          </button>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-center">
                          <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Earnings</p>
                          <p className="text-3xl font-black">₹{stats.referralEarnings || 0}</p>
                       </div>
                       <div className="w-px h-12 bg-white/10" />
                       <div className="text-center">
                          <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Invites</p>
                          <p className="text-3xl font-black">0</p>
                       </div>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 p-4">
                    <Users className="w-32 h-32 text-white/5" />
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'brandkit' && (
            <motion.div
              key="brandkit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl"
            >
              <BrandKitManager brandKit={brandKit} onUpdate={handleUpdateBrandKit} />
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">My Orders</h1>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Track your current orders and previous history</p>
                </div>
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                   <input 
                     type="text" 
                     placeholder="Search Order ID..."
                     className="bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-black uppercase focus:ring-2 ring-zinc-100 outline-none transition"
                   />
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-[40px] p-20 text-center space-y-4">
                   <div className="w-20 h-20 bg-zinc-50 rounded-[32px] flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-10 h-10 text-zinc-100" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">No Orders</h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Start your first high-fidelity print project today</p>
                   </div>
                   <button className="px-8 py-3.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition">
                     Browse Products
                   </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div 
                      key={order.id}
                      className="bg-white border border-zinc-200 rounded-[32px] p-6 hover:shadow-xl hover:shadow-zinc-100 transition-all group"
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 flex items-center justify-center">
                             {order.items[0]?.productImage ? (
                               <img src={order.items[0].productImage} alt="" className="w-full h-full object-cover" />
                             ) : (
                               <Package className="w-6 h-6 text-zinc-200" />
                             )}
                          </div>
                          <div className="space-y-1">
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-mono font-black text-zinc-400">#{order.id.toUpperCase().slice(0, 8)}</span>
                               <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                 order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                               }`}>
                                 {order.status}
                               </span>
                             </div>
                             <h3 className="text-xs font-black text-zinc-900 uppercase truncate max-w-[200px]">
                               {order.items[0]?.productName} {order.items.length > 1 ? `+${order.items.length - 1} more` : ''}
                             </h3>
                             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">₹{order.totalAmount.toLocaleString('en-IN')} • {format(new Date(order.createdAt), 'PP')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                           <button 
                             onClick={() => onNavigateToOrder(order.id)}
                             className="flex-1 md:flex-none px-6 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition"
                           >
                             Track Order
                           </button>
                           <button className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl text-zinc-400 hover:text-zinc-900 transition">
                             <FileText className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'wishlist' && (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">My Wishlist</h1>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Products you've saved for later</p>
              </div>

              {wishlist.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-[40px] p-20 text-center space-y-4">
                  <Heart className="w-16 h-16 text-zinc-100 mx-auto" />
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Your wishlist is empty</p>
                  <button className="px-8 py-3.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition">
                    Explore Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {wishlist.map(item => (
                    <div key={item.id} className="bg-white border border-zinc-200 rounded-[32px] overflow-hidden group hover:shadow-2xl transition-all p-4">
                      <div className="aspect-square bg-zinc-50 rounded-2xl overflow-hidden mb-4">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="text-[11px] font-black uppercase truncate">{item.name}</h4>
                      <p className="text-[9px] font-bold text-zinc-400 mt-1">₹{item.price}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'addresses' && (
            <motion.div
              key="addresses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Addresses</h1>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Manage your shipping destinations and billing addresses</p>
                </div>
                <button 
                  onClick={onAddAddress}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-lg shadow-black/10"
                >
                  <Plus className="w-4 h-4" />
                  Add Address
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(stats.addresses || []).map((addr) => (
                  <div key={addr.id} className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-6 relative overflow-hidden group">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="p-2.5 bg-zinc-50 rounded-2xl">
                             <MapPin className="w-5 h-5 text-zinc-900" />
                           </div>
                           <h3 className="text-xs font-black uppercase tracking-widest">{addr.label}</h3>
                        </div>
                        {addr.isDefault && (
                          <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-150 px-2.5 py-0.5 rounded-full uppercase">Default</span>
                        )}
                     </div>

                     <div className="space-y-1 text-sm font-bold text-zinc-700 leading-relaxed">
                        <p className="text-zinc-900 font-black">{addr.name}</p>
                        <p>{addr.addressLine1}</p>
                        {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                        <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-[10px] text-zinc-400 mt-2">PHONE: {addr.phone}</p>
                     </div>

                     <div className="pt-4 flex items-center gap-3">
                        <button 
                          onClick={() => onEditAddress(addr)}
                          className="text-[10px] font-black uppercase tracking-widest text-[#FF4D00] hover:underline"
                        >
                          Modify Address
                        </button>
                        <span className="text-zinc-200">|</span>
                        <button className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-rose-500">
                          Remove
                        </button>
                     </div>
                  </div>
                ))}

                {(stats.addresses || []).length === 0 && (
                   <div className="md:col-span-2 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[40px] p-20 text-center space-y-4">
                      <MapPin className="w-12 h-12 text-zinc-200 mx-auto" />
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">No saved addresses</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Your saved addresses will appear here for faster checkout</p>
                      </div>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Wallet & Rewards</h1>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Manage your digital wallet, rewards points, and active coupons</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-zinc-900 rounded-[32px] p-8 text-white space-y-6 shadow-2xl shadow-zinc-200">
                    <div className="flex items-center gap-3">
                       <Wallet className="w-5 h-5 text-[#FF4D00]" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Digital Wallet</span>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase text-zinc-500">Current Balance</p>
                       <p className="text-4xl font-black">₹{stats.walletBalance || 0}</p>
                    </div>
                    <button className="w-full py-3.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition">
                      Add Credits
                    </button>
                 </div>

                 <div className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-6">
                    <div className="flex items-center gap-3 text-amber-500">
                       <Star className="w-5 h-5 fill-amber-500" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Loyalty Points</span>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase text-zinc-400">Redeemable Points</p>
                       <p className="text-4xl font-black text-zinc-900">{stats.loyaltyPoints || 0}</p>
                    </div>
                    <button className="w-full py-3.5 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition">
                      Redeem Now
                    </button>
                 </div>

                 <div className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-6">
                    <div className="flex items-center gap-3 text-emerald-500">
                       <Gift className="w-5 h-5" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Active Coupons</span>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase text-zinc-400">Available Offers</p>
                       <p className="text-4xl font-black text-zinc-900">3</p>
                    </div>
                    <button className="w-full py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition">
                      View Offers
                    </button>
                 </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white border border-zinc-200 rounded-[40px] overflow-hidden shadow-sm">
                 <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Transaction History</h3>
                    <button className="text-[10px] font-black uppercase text-[#FF4D00] hover:underline">Download Statement</button>
                 </div>
                 <div className="p-4 text-center py-20 text-zinc-400 space-y-3">
                    <RefreshCcw className="w-10 h-10 mx-auto opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No recent transactions to display</p>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'designs' && (
            <motion.div
              key="designs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">My Designs</h1>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Your saved design files and custom creations</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition">
                  <Layout className="w-4 h-4" />
                  Design Now
                </button>
              </div>

              {savedDesigns.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-[40px] p-20 text-center space-y-4">
                   <div className="w-20 h-20 bg-zinc-50 rounded-[32px] flex items-center justify-center mx-auto">
                      <Layout className="w-10 h-10 text-zinc-100" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">No designs found</h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Save your designs from the studio to access them later</p>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {savedDesigns.map(design => (
                    <div key={design.id} className="bg-white border border-zinc-200 rounded-[32px] overflow-hidden group hover:shadow-2xl transition-all">
                       <div className="aspect-[4/5] bg-zinc-50 relative overflow-hidden">
                          {design.preview ? (
                            <img src={design.preview} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                               <FileText className="w-12 h-12 text-zinc-100" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                             <button className="p-3 bg-white text-black rounded-full hover:bg-zinc-100 transition">
                                <Search className="w-5 h-5" />
                             </button>
                             <button className="p-3 bg-[#FF4D00] text-white rounded-full hover:bg-[#e64500] transition">
                                <ShoppingBag className="w-5 h-5" />
                             </button>
                          </div>
                       </div>
                       <div className="p-5 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="text-[11px] font-black uppercase tracking-wide truncate max-w-[120px]">{design.name}</h4>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{format(new Date(design.createdAt), 'PP')}</p>
                          </div>
                          <button className="p-2 text-zinc-300 hover:text-rose-500 transition">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Notifications</h1>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Real-time status updates on your orders and account</p>
                </div>
                <button className="text-[10px] font-black uppercase text-[#FF4D00] hover:underline">Mark all as read</button>
              </div>

              {notifications.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-[40px] p-20 text-center space-y-4">
                   <div className="w-20 h-20 bg-zinc-50 rounded-[32px] flex items-center justify-center mx-auto">
                      <Bell className="w-10 h-10 text-zinc-100" />
                   </div>
                   <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">All Clear</h3>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">You have no pending notifications at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notify => (
                    <div 
                      key={notify.id} 
                      className={`p-6 rounded-[28px] border transition-all flex items-start gap-5 ${
                        notify.isRead ? 'bg-white border-zinc-100 text-zinc-500' : 'bg-white border-zinc-900 shadow-xl shadow-zinc-100 text-zinc-900'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl shrink-0 ${
                        notify.type === 'order' ? 'bg-blue-50 text-blue-600' :
                        notify.type === 'artwork' ? 'bg-amber-50 text-amber-600' :
                        'bg-zinc-100 text-zinc-600'
                      }`}>
                         {notify.type === 'order' ? <ShoppingBag className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-black uppercase tracking-widest">{notify.title}</h4>
                          <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">{format(new Date(notify.createdAt), 'PPp')}</span>
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed">{notify.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Help & Support</h1>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">How can we help with your projects?</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-6 py-3 bg-[#25D366] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp Support
                  </button>
                    <button className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Inquiry
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-zinc-900 rounded-2xl">
                         <MessageSquare className="w-5 h-5 text-white" />
                       </div>
                       <h3 className="text-xs font-black uppercase tracking-widest">Open Inquiries</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {tickets.length === 0 ? (
                        <div className="text-center py-10 text-zinc-300">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em]">No Open Issues</p>
                        </div>
                      ) : (
                        tickets.map(ticket => (
                          <div key={ticket.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-zinc-900 uppercase">{ticket.subject}</p>
                              <p className="text-[8px] font-bold text-zinc-400 uppercase">{ticket.status} • {ticket.id}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-300" />
                          </div>
                        ))
                      )}
                    </div>
                 </div>

                 <div className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-blue-50 rounded-2xl">
                         <FileText className="w-5 h-5 text-blue-600" />
                       </div>
                       <h3 className="text-xs font-black uppercase tracking-widest">Guides & FAQs</h3>
                    </div>

                    <div className="space-y-2">
                       {[
                         'Artwork Guides',
                         'Billing & Invoicing',
                         'Shipping Info',
                         'Returns & Refunds'
                       ].map((item, i) => (
                         <button key={i} className="w-full text-left p-4 bg-zinc-50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition flex items-center justify-between group">
                           {item}
                           <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition" />
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
