/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  ChevronRight, 
  Headphones, 
  FileText, 
  HelpCircle, 
  Mail, 
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { db, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from '../firebase';
import { SupportTicket } from '../types';
import { format } from 'date-fns';

interface SupportCenterProps {
  userId: string;
  userEmail: string;
  onClose?: () => void;
}

export default function SupportCenter({ userId, userEmail, onClose }: SupportCenterProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('General');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'tickets'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket)));
    });
    return unsub;
  }, [userId]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'tickets'), {
        userId,
        subject,
        category,
        status: 'Open',
        priority: 'Medium',
        messages: [{
          sender: 'user',
          text: message,
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowNewTicket(false);
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error("Failed to create ticket", err);
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    { q: "What is the standard turnaround time?", a: "Standard turnaround is 2-3 business days plus shipping." },
    { q: "Can I cancel my order after design approval?", a: "Once approved and sent to production, cancellation is not possible." },
    { q: "Do you offer GST invoices?", a: "Yes, all professional orders generate a compliant GST invoice." },
    { q: "How do I check my order status?", a: "Visit the Order Tracker or check your email for status updates." }
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-5xl h-[85vh] bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-500 z-10 transition"
        >
          <X size={20} />
        </button>

        {/* Sidebar - Quick Help */}
        <div className="w-full md:w-80 bg-zinc-50 border-r border-zinc-100 p-10 flex flex-col gap-8">
           <div className="space-y-4">
              <div className="w-16 h-16 bg-zinc-900 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-zinc-200">
                <Headphones size={32} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 leading-tight">Help Center</h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">How can we help?</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-3">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Direct Channels</h3>
                 <div className="space-y-2">
                    <button className="w-full flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-2xl hover:shadow-lg transition">
                       <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                          <MessageSquare size={16} />
                       </div>
                       <div className="text-left">
                          <p className="text-[10px] font-black uppercase text-zinc-900">WhatsApp</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Live Chat 24/7</p>
                       </div>
                    </button>
                    <button className="w-full flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-2xl hover:shadow-lg transition">
                       <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                          <Mail size={16} />
                       </div>
                       <div className="text-left">
                          <p className="text-[10px] font-black uppercase text-zinc-900">Email Hub</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">Response &lt; 2h</p>
                       </div>
                    </button>
                 </div>
              </div>

              <div className="space-y-3">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Guides & FAQs</h3>
                 <div className="space-y-1">
                    {['Artwork Guides', 'Billing & Invoices', 'Shipping Info'].map((item, i) => (
                      <button key={i} className="w-full text-left p-3 hover:bg-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-600 transition flex items-center justify-between">
                         {item}
                         <ChevronRight size={14} className="opacity-30" />
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="mt-auto p-4 bg-zinc-900 rounded-3xl text-white text-center space-y-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Emergency Contact</p>
              <p className="text-lg font-black tracking-tighter italic">+91 98765 43210</p>
           </div>
        </div>

        {/* Main Interaction Area */}
        <div className="flex-1 p-10 overflow-y-auto bg-white">
           {!showNewTicket ? (
             <div className="space-y-10">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900">My Support Tickets</h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ongoing and resolved support tickets</p>
                   </div>
                   <button 
                     onClick={() => setShowNewTicket(true)}
                     className="flex items-center gap-2 px-6 py-3.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition shadow-xl shadow-black/10"
                   >
                     <Plus size={16} />
                     Create Ticket
                   </button>
                </div>

                {tickets.length === 0 ? (
                  <div className="py-20 text-center space-y-6">
                     <HelpCircle size={64} className="mx-auto text-zinc-100" />
                     <div className="space-y-1">
                        <h4 className="text-sm font-black uppercase text-zinc-900">No active tickets found</h4>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">If you need help with an order, create a ticket above</p>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                     {tickets.map(ticket => (
                       <div key={ticket.id} className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl hover:border-zinc-300 transition-all cursor-pointer group">
                          <div className="flex items-start justify-between gap-4">
                             <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-2xl ${
                                  ticket.status === 'Open' ? 'bg-amber-50 text-amber-600' :
                                  ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' :
                                  'bg-zinc-200 text-zinc-500'
                                }`}>
                                   <Clock size={20} />
                                </div>
                                <div className="space-y-1">
                                   <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">#{ticket.id.slice(0,8)}</span>
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        ticket.status === 'Open' ? 'bg-amber-100 text-amber-700' :
                                        ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-zinc-200 text-zinc-600'
                                      }`}>
                                        {ticket.status}
                                      </span>
                                   </div>
                                   <h4 className="text-sm font-black uppercase text-zinc-900 group-hover:text-[#FF4D00] transition">{ticket.subject}</h4>
                                   <p className="text-[10px] font-bold text-zinc-400 uppercase">{ticket.category} • Updated {format(new Date(ticket.updatedAt), 'PP')}</p>
                                </div>
                             </div>
                             <ChevronRight size={20} className="text-zinc-200 group-hover:text-zinc-900 transition" />
                          </div>
                       </div>
                     ))}
                  </div>
                )}

                {/* FAQ Section */}
                <div className="pt-10 border-t border-zinc-100 space-y-6">
                   <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Popular Questions (FAQs)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {faqs.map((faq, i) => (
                        <div key={i} className="p-6 bg-white border border-zinc-100 rounded-3xl space-y-2">
                           <h4 className="text-[11px] font-black uppercase text-zinc-900">{faq.q}</h4>
                           <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase">{faq.a}</p>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           ) : (
             <div className="space-y-10">
                <div className="flex items-center justify-between">
                   <button 
                     onClick={() => setShowNewTicket(false)}
                     className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition"
                   >
                     <ChevronRight size={16} className="rotate-180" />
                     Back to Tickets
                   </button>
                   <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">New Support Ticket</h3>
                </div>

                <form onSubmit={handleSubmitTicket} className="max-w-2xl space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Query Category</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                         {['Order Issue', 'App Help', 'Payment', 'Design Help', 'General'].map(cat => (
                           <button
                             key={cat}
                             type="button"
                             onClick={() => setCategory(cat as any)}
                             className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition border ${
                               category === cat ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-100 hover:border-zinc-300'
                             }`}
                           >
                             {cat}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Subject</label>
                      <input 
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Briefly describe the issue"
                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-[11px] font-black uppercase focus:ring-2 ring-zinc-200 outline-none transition"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Detailed Message</label>
                      <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Provide all necessary details (Order ID, issue description, etc.)"
                        className="w-full h-40 px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-[11px] font-black uppercase focus:ring-2 ring-zinc-200 outline-none transition resize-none"
                      />
                   </div>

                   <button 
                     disabled={loading || !subject || !message}
                     className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition disabled:opacity-50"
                   >
                     {loading ? 'Submitting...' : 'Send Ticket'}
                   </button>
                </form>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}
