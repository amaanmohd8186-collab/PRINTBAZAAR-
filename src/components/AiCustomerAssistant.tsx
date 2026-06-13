import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, MessageCircle, X, HelpCircle, RefreshCw } from 'lucide-react';

interface Msg {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

const PRESET_FAQS = [
  { q: "What is your return & refund policy?", a: "PrintBazaar is an offset B2B print aggregator. Given the nature of custom configurations (plates setup, color registrations), we strictly enforce a NO COD and NO RE-DELIVERY/RE-FUND policy. All transactions are 100% upfront." },
  { q: "How fast is delivery?", a: "Standard runs deliver in 3-4 working days. Bulk shipments (over 5,000 units) route via express surface container logistics and complete in 5-7 working days. Real-time tracks are on the pipeline tracker!" },
  { q: "What file formats do you accept?", a: "We accept press-ready vector PDFs, EPS, AI designs, and ultra high resolution PNGs/JPGs (at least 300 DPI) with correct bleeding offsets." }
];

export default function AiCustomerAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: '1', sender: 'gemini', text: "Namaste! I am the PrintBazaar Gemini-powered Customer Assistant. Ask me anything about offset specifications, paper stocks, or your delivery stages!", timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const prompt = textToSend || input;
    if (!prompt.trim()) return;

    // Add user message
    const userMsg: Msg = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Call simulated Gemini server endpoint or instant responses
    setTimeout(async () => {
      let replyText = "Fascinating query! I suggest checking our core Terminology guidelines in the footer. To fetch deeper custom plate advice, ask me about paper thickness options or bleed offsets.";
      
      // Match key triggers in user query
      const lower = prompt.toLowerCase();
      if (lower.includes('discount') || lower.includes('coupon') || lower.includes('price')) {
        replyText = "Wholesale bulk runs are configured with automatic slab rates. Ordering over 5,000 Visiting Cards instantly unlocks 35% base discount offsets! Use our Bulk Quote Generator for direct price structures.";
      } else if (lower.includes('bleed') || lower.includes('size') || lower.includes('margin')) {
        replyText = "Always configure a 3mm Bleed area on all margins when rendering corporate artboards (PDF/AI formats). This shields designs from getting trimmed incorrectly on bulk shearing runs.";
      } else if (lower.includes('paper') || lower.includes('thick') || lower.includes('gsm')) {
        replyText = "Mainstream business cards default to Premium Matte Art Card 350 GSM or 400 GSM. Booklets operate on 120-170 GSM, whilst posters utilize durable 220 GSM gloss finishes.";
      } else if (lower.includes('delivery') || lower.includes('status') || lower.includes('track')) {
        replyText = "Track order cycles inside the 'Track Orders' panel. Cycles progress from: Pending plate layout → Alignment verified → In Offset Press → Shearing & Packing → Delivered. Standard courier dispatch takes 48h.";
      }

      const geminiMsg: Msg = {
        id: 'gem-' + Date.now(),
        sender: 'gemini',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      setMessages(prev => [...prev, geminiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating launcher trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-40 md:bottom-24 right-6 p-4 rounded-full bg-black text-[#FF4D00] shadow-xl border border-zinc-800 hover:scale-105 transition hover:bg-[#FF4D00] hover:text-white z-[90] cursor-pointer flex items-center gap-2 group"
          id="ai-assistant-btn"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider font-mono">Consult Gemini</span>
        </button>
      )}

      {/* Expanded chat panel */}
      {isOpen && (
        <div className="fixed bottom-40 md:bottom-24 right-6 w-80 md:w-96 rounded-3xl bg-white border border-zinc-250 shadow-2xl overflow-hidden z-[90] flex flex-col max-h-[500px] border-zinc-300 animate-fadeIn text-left">
          {/* Header */}
          <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between border-b pb-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#FF4D00]/10 text-[#FF4D00] rounded-xl border border-[#FF4D00]/30 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight">PrintBazaar Gemini Agent</h4>
                <p className="text-[8px] text-zinc-400 font-mono">B2B OFFSET SYSTEMS COPILOT • ONLINE</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1.5 hover:bg-white/10 rounded-xl transition text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50 min-h-[250px]">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed font-sans ${
                  m.sender === 'user' 
                    ? 'bg-black text-white rounded-br-none' 
                    : 'bg-white text-zinc-800 border border-zinc-200 shadow-xs rounded-bl-none'
                }`}>
                  <p>{m.text}</p>
                </div>
                <span className="text-[8px] text-zinc-400 font-mono mt-1 font-bold">{m.timestamp}</span>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-mono animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF4D00]" />
                <span>Gemini drafting press guidance...</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Preset FAQ buttons */}
          <div className="p-2 border-t border-zinc-150 bg-white flex gap-1.5 overflow-x-auto shrink-0">
            {PRESET_FAQS.map((faq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(faq.q)}
                className="py-1 px-2.5 bg-zinc-50 hover:bg-zinc-100 text-[9px] text-[#FF4D00] font-black uppercase tracking-tight rounded-lg border border-zinc-200 shrink-0 cursor-pointer"
              >
                {faq.q}
              </button>
            ))}
          </div>

          {/* Input form */}
          <div className="p-3 border-t border-zinc-150 bg-zinc-50 flex gap-2 shrink-0">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about bleed offsets, GSM, timing..."
              className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-800 focus:outline-hidden"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="p-2 rounded-xl bg-black hover:bg-[#FF4D00] text-white disabled:opacity-40 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
