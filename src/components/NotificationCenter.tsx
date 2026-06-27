/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Package, Tag, Info, AlertCircle, X, CheckCircle2, Zap } from 'lucide-react';
import { AppNotification } from '../types';
import { db, collection, query, where, orderBy, limit, onSnapshot } from '../firebase';
import { format } from 'date-fns';

interface NotificationCenterProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ userId, isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!userId || !isOpen) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification)));
    });
    return unsub;
  }, [userId, isOpen]);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order': return <Package className="text-blue-500" size={16} />;
      case 'promo': return <Tag className="text-[#FF4D00]" size={16} />;
      case 'system': return <Info className="text-zinc-400" size={16} />;
      case 'artwork': return <AlertCircle className="text-amber-500" size={16} />;
      default: return <Info className="text-zinc-400" size={16} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
          />
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[160] flex flex-col"
          >
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
               <div className="space-y-1">
                  <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                    <Bell className="text-[#FF4D00]" />
                    Notifications
                  </h2>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Stay updated on your orders</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {notifications.length === 0 ? (
                 <div className="py-20 text-center space-y-4">
                    <Zap size={48} className="mx-auto text-zinc-100" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">All clear in the cloud</p>
                 </div>
               ) : (
                 notifications.map(n => (
                   <div key={n.id} className={`p-5 rounded-3xl border transition-all cursor-pointer group ${n.isRead ? 'bg-zinc-50 border-zinc-100' : 'bg-white border-zinc-200 shadow-sm'}`}>
                      <div className="flex gap-4">
                         <div className={`p-3 rounded-2xl shrink-0 ${n.isRead ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-950 text-white shadow-lg'}`}>
                            {getIcon(n.type)}
                         </div>
                         <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                               <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{n.type} • {format(new Date(n.createdAt), 'p')}</span>
                               {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#FF4D00]" />}
                            </div>
                            <h4 className="text-[11px] font-black uppercase text-zinc-900 group-hover:text-[#FF4D00] transition leading-tight">{n.title}</h4>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed">{n.message}</p>
                         </div>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="p-6 bg-zinc-50 border-t border-zinc-100">
               <button className="w-full py-3.5 bg-zinc-900 hover:bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition">
                  Archive All Notifications
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
