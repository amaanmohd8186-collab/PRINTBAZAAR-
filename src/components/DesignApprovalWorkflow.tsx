/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  Paperclip, 
  Trash2, 
  Lock, 
  Users, 
  FileText,
  User, 
  Clock,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, OrderStatus } from '../types';

interface DesignPin {
  id: string;
  x: number; // percentage width
  y: number; // percentage height
  comment: string;
  authorName: string;
  authorRole: 'customer' | 'seller' | 'admin';
  timestamp: number;
}

interface DesignMessage {
  id: string;
  authorName: string;
  authorRole: 'customer' | 'seller' | 'admin';
  text: string;
  timestamp: number;
  attachment?: {
    name: string;
    data: string; // base64 payload
    type: string;
  } | null;
}

interface DesignApprovalWorkflowProps {
  order: Order;
  userRole: 'customer' | 'seller' | 'admin';
  userEmail: string;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus, updatedOrderObj?: any) => void;
}

export const DesignApprovalWorkflow: React.FC<DesignApprovalWorkflowProps> = ({
  order,
  userRole,
  userEmail,
  onStatusUpdate
}) => {
  const [pins, setPins] = useState<DesignPin[]>([]);
  const [messages, setMessages] = useState<DesignMessage[]>([]);
  const [dbStatus, setDbStatus] = useState<OrderStatus>(order.status);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Input states
  const [selectedPin, setSelectedPin] = useState<{ x: number; y: number } | null>(null);
  const [pinComment, setPinComment] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [msgAttachment, setMsgAttachment] = useState<{ name: string; data: string; type: string } | null>(null);
  const [activePinDetail, setActivePinDetail] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Load preview image from the order's first item
  const orderItem = order.items[0];
  const activeImage = orderItem?.productImage || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80';

  // Real-time listener for current order design annotations & chat messages
  useEffect(() => {
    if (!order.id || !db) return;
    setIsSyncing(true);
    const orderDocRef = doc(db, 'orders', order.id);

    const unsubscribe = onSnapshot(orderDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPins(data.designPins || []);
        setMessages(data.designMessages || []);
        setDbStatus(data.status || order.status);
        onStatusUpdate(order.id, data.status || order.status, data);
      }
      setIsSyncing(false);
    }, (error) => {
      console.error("Real-time listener failed inside DesignApproval:", error);
      setErrorText("Failed to establish real-time connection. Falling back to local state.");
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, [order.id]);

  // Scroll to bottom when messaging updates
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle direct image click to drop annotation pins
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (dbStatus === 'Customer Approval') return; // Locked on final approval
    if (!imageContainerRef.current) return;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else {
      return;
    }

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setSelectedPin({ x, y });
    setPinComment('');
  };

  // Save Pin to Firebase
  const saveAnnotationPin = async () => {
    if (!selectedPin || !pinComment.trim()) return;

    const newPin: DesignPin = {
      id: `pin_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      x: selectedPin.x,
      y: selectedPin.y,
      comment: pinComment.trim(),
      authorName: userEmail.split('@')[0],
      authorRole: userRole,
      timestamp: Date.now()
    };

    const updatedPins = [...pins, newPin];
    setIsSyncing(true);

    try {
      const orderDocRef = doc(db, 'orders', order.id);
      await updateDoc(orderDocRef, {
        designPins: updatedPins,
        updatedAt: new Date().toISOString()
      });
      setSelectedPin(null);
      setPinComment('');
    } catch (err: any) {
      console.error("Failed to save annotation pin:", err);
      setErrorText(`Failed to save feedback pin: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete pin
  const deletePin = async (pinId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dbStatus === 'Customer Approval') return;

    const updatedPins = pins.filter(p => p.id !== pinId);
    setIsSyncing(true);

    try {
      const orderDocRef = doc(db, 'orders', order.id);
      await updateDoc(orderDocRef, {
        designPins: updatedPins,
        updatedAt: new Date().toISOString()
      });
      if (activePinDetail === pinId) setActivePinDetail(null);
    } catch (err: any) {
      console.error("Failed to delete pin:", err);
      setErrorText(`Failed to remove pin: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Attachment Upload (base64)
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setMsgAttachment({
        name: file.name,
        data: reader.result as string,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  // Send Chat message to Firestore
  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() && !msgAttachment) return;

    const newMessage: DesignMessage = {
      id: `msg_${Date.now()}`,
      authorName: userEmail.split('@')[0],
      authorRole: userRole,
      text: msgInput.trim(),
      timestamp: Date.now(),
      attachment: msgAttachment
    };

    const updatedMessages = [...messages, newMessage];
    setIsSyncing(true);

    try {
      const orderDocRef = doc(db, 'orders', order.id);
      await updateDoc(orderDocRef, {
        designMessages: updatedMessages,
        // Automatically switch status to Design Review if customer sends a message detailing review requests
        status: userRole === 'customer' ? 'Design Review' : dbStatus,
        updatedAt: new Date().toISOString()
      });

      setMsgInput('');
      setMsgAttachment(null);
    } catch (err: any) {
      console.error("Failed to send chat message:", err);
      setErrorText(`Failed to dispatch message: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle final customer Approval or Reject status change
  const setApprovalStatus = async (approved: boolean) => {
    const finalStatus: OrderStatus = approved ? 'Customer Approval' : 'Design Review';
    setIsSyncing(true);

    try {
      const orderDocRef = doc(db, 'orders', order.id);

      // Append system message
      const systemMsg: DesignMessage = {
        id: `sys_${Date.now()}`,
        authorName: 'SYSTEM ADVISORY',
        authorRole: 'admin',
        text: approved 
          ? `✓ CLIENT DESIGN APPROVED. The blueprint has been officially matched & locked inside our offset factory catalog. Production starts now.`
          : `⚠️ CLIENT REQUESTED REVISIONS. Seller has been notified to edit the draft layout promptly.`,
        timestamp: Date.now(),
        attachment: null
      };

      await updateDoc(orderDocRef, {
        status: finalStatus,
        designMessages: [...messages, systemMsg],
        updatedAt: new Date().toISOString()
      });

      onStatusUpdate(order.id, finalStatus);
    } catch (err: any) {
      console.error("Failed to update design approval status:", err);
      setErrorText(`Failed to modify status: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-gray-150 p-6 space-y-6 shadow-xs select-none">
      
      {/* Header section with indicators */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Users className="w-4 h-4 text-[#FF4D00]" />
            <h4 className="text-xs font-black uppercase tracking-tight text-zinc-900 leading-none">Smart Design Approval Workspace</h4>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
            Direct real-time consultation with production manager
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSyncing && (
            <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-500 font-mono text-[9px] font-black px-2.5 py-1 rounded-lg uppercase">
              <Loader2 className="w-3 h-3 animate-spin text-[#FF4D00]" />
              <span>SYNCING CLOUD</span>
            </span>
          )}
          <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border font-mono ${
            dbStatus === 'Customer Approval' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            BLUEPRINT: {dbStatus === 'Customer Approval' ? 'LOCKED & VERIFIED' : 'PENDING APPROVAL'}
          </span>
        </div>
      </div>

      {errorText && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-xs font-heavy uppercase tracking-tight leading-none">{errorText}</p>
          <button onClick={() => setErrorText(null)} className="ml-auto text-xs font-black bg-white hover:bg-zinc-100 p-1 px-2.5 rounded-lg border border-rose-200 cursor-pointer">X</button>
        </div>
      )}

      {/* Main feedback Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: Annotation Board Image layout (span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-zinc-50 border border-zinc-150 p-3 rounded-2xl">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">
              {dbStatus === 'Customer Approval' 
                ? '🔒 Canvas locked - Design approved' 
                : '🎯 Click any target point on the proof image to pin annotations'}
            </p>
            {pins.length > 0 && (
              <span className="text-[9px] bg-[#FF4D00] text-white font-heavy px-2 py-0.5 rounded-md font-mono uppercase">
                {pins.length} active pins
              </span>
            )}
          </div>

          {/* proof image block */}
          <div className="relative border border-zinc-200 rounded-[24px] overflow-hidden bg-zinc-100 shadow-inner group">
            <div 
              ref={imageContainerRef}
              onClick={handleImageClick}
              onTouchStart={(e) => {
                e.preventDefault();
                handleImageClick(e);
              }}
              className={`w-full relative transition ${dbStatus === 'Customer Approval' ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
            >
              <img 
                src={activeImage} 
                alt="Digital Proof Sheet" 
                className="w-full h-auto object-contain max-h-[500px] select-none pointer-events-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80';
                }}
              />

              {/* Render annotation pins onto the image */}
              {pins.map((pin) => (
                <div 
                  key={pin.id}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePinDetail(activePinDetail === pin.id ? null : pin.id);
                  }}
                  className={`absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-transform hover:scale-115 cursor-pointer border ${
                    pin.authorRole === 'customer' 
                      ? 'bg-[#FF4D00] text-white border-white' 
                      : 'bg-[#0F172A] text-white border-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />

                  {/* Inside Pin Hover Box */}
                  <AnimatePresence>
                    {activePinDetail === pin.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-9 left-1/2 -translate-x-1/2 w-48 bg-zinc-900 text-white rounded-xl p-3 border border-zinc-700/60 shadow-2xl z-40 text-left cursor-default"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-1.5 border-b border-zinc-805 pb-1">
                          <span className="text-[9px] font-black uppercase text-[#FF4D00] tracking-wider">
                            {pin.authorRole.toUpperCase()}: {pin.authorName}
                          </span>
                          {dbStatus !== 'Customer Approval' && (
                            <button 
                              onClick={(e) => deletePin(pin.id, e)}
                              className="text-zinc-500 hover:text-rose-500 transition cursor-pointer"
                            >
                              <Lock className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-100 font-medium leading-normal">{pin.comment}</p>
                        <span className="text-[8px] font-mono text-zinc-500 block text-right mt-1.5">
                          {new Date(pin.timestamp).toLocaleTimeString()}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Rendering Selected Pin Formulation Card */}
              {selectedPin && (
                <div 
                  style={{ left: `${selectedPin.x}%`, top: `${selectedPin.y}%` }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-3.5 border border-zinc-200 shadow-2xl z-30 w-52"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 mb-2">
                    <span className="text-[9px] font-extrabold text-[#FF4D00] uppercase font-mono">Pin Annotation Point</span>
                    <button onClick={() => setSelectedPin(null)} className="text-zinc-400 hover:text-zinc-800 transition cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={pinComment}
                    onChange={(e) => setPinComment(e.target.value)}
                    placeholder="e.g. Center this text, edit logo..."
                    className="w-full text-[11px] bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-zinc-800 outline-none placeholder-zinc-400 font-medium mb-2.5"
                    autoFocus
                  />
                  <button 
                    type="button"
                    onClick={saveAnnotationPin}
                    className="w-full bg-[#FF4D00] text-white text-[10px] font-black uppercase py-1.5 rounded-lg tracking-wider hover:bg-[#d93d00] transition cursor-pointer"
                  >
                    Set Pin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: Real-time Live Consultation Chat Box (span 5) */}
        <div className="lg:col-span-5 flex flex-col h-[500px] border border-zinc-200 rounded-[28px] overflow-hidden bg-zinc-50 relative">
          
          {/* Chat box header */}
          <div className="bg-white border-b border-zinc-150 p-4 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-700" />
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-tight text-zinc-950">Draft Consultation</h5>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Instant Dispatch Sync</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>

          {/* Chat logs feed area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <MessageSquare className="w-8 h-8 text-zinc-300 mb-2.5" />
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider font-mono">No Consultation Records</p>
                <p className="text-[10px] text-zinc-400 mt-1">Submit revisions or request edits to update progress.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.authorRole === userRole;
                const isSys = msg.authorName === 'SYSTEM ADVISORY';
                
                if (isSys) {
                  return (
                    <div key={msg.id} className="bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-2xl p-3.5 text-center my-2">
                      <p className="text-[10px] font-bold text-zinc-800 leading-relaxed uppercase">{msg.text}</p>
                      <span className="text-[8px] font-mono text-zinc-400 mt-1 block">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest font-mono">
                        {msg.authorName} ({msg.authorRole.toUpperCase()})
                      </span>
                    </div>

                    <div className={`p-3 max-w-[85%] rounded-[20px] shadow-sm ${
                      isMe 
                        ? 'bg-zinc-900 text-white rounded-tr-none' 
                        : 'bg-white text-zinc-800 border border-zinc-200/60 rounded-tl-none'
                    }`}>
                      <p className="text-xs font-semibold leading-relaxed break-words">{msg.text}</p>
                      
                      {msg.attachment && (
                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2 bg-black/10 p-2 rounded-xl border border-dashed border-white/5">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                          <div className="flex-1 truncate">
                            <span className="text-[9px] font-mono block text-zinc-300 truncate">{msg.attachment.name}</span>
                          </div>
                          {msg.attachment.type.startsWith('image/') ? (
                            <img 
                              src={msg.attachment.data} 
                              alt="attached mockup" 
                              className="w-10 h-10 object-cover rounded-lg border border-white/15"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <a 
                              href={msg.attachment.data} 
                              download={msg.attachment.name}
                              className="text-[9px] bg-indigo-600 text-white font-extrabold p-1 px-2.5 rounded-lg leading-tight uppercase"
                            >
                              Get
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-zinc-400 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>

          {/* Form write area */}
          <form onSubmit={sendChatMessage} className="bg-white border-t border-zinc-150 p-3 shrink-0 flex flex-col gap-2">
            
            {/* Display active file attachment choice */}
            {msgAttachment && (
              <div className="bg-indigo-50/50 border border-indigo-150 p-2 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-mono font-bold text-indigo-805 truncate max-w-xs">{msgAttachment.name}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setMsgAttachment(null)}
                  className="text-zinc-400 hover:text-rose-500 cursor-pointer p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileAttach} 
                className="hidden"
                accept="image/*,application/pdf,.ai,.psd,.cdr"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={dbStatus === 'Customer Approval'}
                className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input 
                type="text"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                disabled={dbStatus === 'Customer Approval'}
                placeholder={dbStatus === 'Customer Approval' ? '🔓 Consultation locked on final approval' : 'Ask manager for changes, upload raw edit sheets...'}
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs outline-none placeholder-zinc-400 text-zinc-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              />

              <button 
                type="submit"
                disabled={dbStatus === 'Customer Approval' || (!msgInput.trim() && !msgAttachment)}
                className="p-2.5 bg-[#FF4D00] hover:bg-[#d93d00] text-white rounded-xl transition cursor-pointer disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

        </div>

      </div>

      {/* Dynamic client-seller authorization action bar */}
      {userRole === 'customer' && dbStatus !== 'Customer Approval' && (
        <div className="bg-[#fff5f0] border border-[#FF4D00]/20 rounded-[28px] p-5 flex flex-col sm:flex-row items-center justify-between gap-5 mt-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-[10px] text-[#FF4D00] font-black uppercase tracking-widest font-mono">Verify Design & Start Printing</p>
            <p className="text-xs text-[#0F172A] font-bold leading-normal">
              Does the draft look correct? Once approved, the layout will immediately dispatch to press.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button 
              type="button"
              onClick={() => setApprovalStatus(false)}
              className="px-4.5 py-2.5 bg-zinc-100 font-mono text-[10px] font-black uppercase text-zinc-800 hover:bg-zinc-200 tracking-wider rounded-xl transition border border-zinc-200 cursor-pointer select-none"
            >
              Request Edits
            </button>
            <button 
              type="button"
              onClick={() => setApprovalStatus(true)}
              className="px-5 py-2.5 bg-emerald-600 font-mono text-[10px] font-black uppercase text-white hover:bg-emerald-700 tracking-wider rounded-xl transition flex items-center gap-2 cursor-pointer select-none shadow-md shadow-emerald-600/10"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve & Lock Blueprint</span>
            </button>
          </div>
        </div>
      )}

      {userRole !== 'customer' && dbStatus === 'Customer Approval' && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-[28px] p-5 text-center mt-4">
          <p className="text-xs font-black uppercase tracking-tight leading-relaxed">
            ✓ Client has approved this blueprint layout. Proceed to offsets with confidence. No updates authorized.
          </p>
        </div>
      )}

    </div>
  );
};
