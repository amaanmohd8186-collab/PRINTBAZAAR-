import React, { useState } from 'react';
import { FileText, Send, Sparkles, RefreshCw, Layers, HardDrive, ShieldCheck, Mail, MapPin } from 'lucide-react';

export default function BulkQuoteGenerator() {
  const [category, setCategory] = useState('Visiting Cards');
  const [quantity, setQuantity] = useState(1000);
  const [material, setMaterial] = useState('Premium Art Card 350 GSM');
  const [pincode, setPincode] = useState('110001');
  const [customReq, setCustomReq] = useState('');
  
  const [isAssembling, setIsAssembling] = useState(false);
  const [quoteResults, setQuoteResults] = useState<any | null>(null);

  const calculateEstimate = async () => {
    setIsAssembling(true);
    setQuoteResults(null);

    try {
      const res = await fetch('/api/quotes/bulk-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: category,
          quantity,
          specifications: customReq,
          location: pincode
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setQuoteResults({
          unitPrice: (data.total / quantity).toFixed(2),
          subtotal: data.total - data.tax - data.shipping,
          gst: data.tax,
          total: data.total,
          timeline: quantity > 5000 ? '5-7 Working Days' : '3-4 Working Days',
          productionNotes: [
            `Price lock active for ${category} @ ${quantity} units.`,
            `Integrated shipping calculation to ${pincode} included in total.`,
            `Verified specifications: ${customReq || 'Standard configurations applied'}.`
          ]
        });
      }
    } catch (err) {
      console.error("Quotation failed:", err);
    } finally {
      setIsAssembling(false);
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-zinc-200/60 p-6 shadow-sm text-left space-y-6">
      <div className="border-b border-zinc-100 pb-5">
        <h3 className="text-xl font-heavy text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#FF4D00]" />
          <span>Bulk Order Pricing</span>
        </h3>
        <p className="text-xs text-zinc-500 font-mono mt-1 font-bold">Configure large volume orders and get instant pricing with automatic quantity discounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 bg-zinc-50 border border-zinc-200/80 p-5 rounded-[24px]">
          <h4 className="text-xs font-black uppercase tracking-widest text-[#FF4D00] font-mono">Project Details</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold block">Print Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden text-zinc-800"
              >
                <option>Visiting Cards</option>
                <option>Wedding Cards</option>
                <option>Banners & Flex</option>
                <option>Books & Brochures</option>
                <option>Posters & Flyers</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold block">Target Quantity</label>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden text-zinc-805"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold block">Paper Density / GSM</label>
              <select 
                value={material} 
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden text-zinc-800"
              >
                <option>Premium Art Card 350 GSM</option>
                <option>Heavy Matte 400 GSM</option>
                <option>Textured Laid Paper 280 GSM</option>
                <option>Eco Bond Recycled 120 GSM</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold block">Delivery Pincode</label>
              <input 
                type="text" 
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="110001"
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden text-zinc-805"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold block">Custom Layout or finishing Notes</label>
            <textarea 
              value={customReq}
              onChange={(e) => setCustomReq(e.target.value)}
              placeholder="e.g. Need gold foil stamp highlights on the corporate seal, single fold, high glossy binding." 
              rows={3}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-hidden text-zinc-800"
            />
          </div>

          <button
            type="button"
            onClick={calculateEstimate}
            disabled={isAssembling}
            className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-[18px] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isAssembling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#FF4D00]" />}
            <span>{isAssembling ? 'Calculating...' : 'Get Pricing'}</span>
          </button>
        </div>

        {/* Results column */}
        <div className="space-y-4">
          {quoteResults ? (
            <div className="border border-zinc-200 rounded-[28px] p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-[10px] font-mono text-emerald-600 font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pricing Updated</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase">{quoteResults.timeline}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 font-bold">Wholesale Unit Cost</span>
                  <span className="font-mono font-black text-slate-800">₹{quoteResults.unitPrice} / pcs</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 font-bold">Standard Subtotal</span>
                  <span className="font-mono font-black text-slate-800">₹{quoteResults.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-dashed">
                  <span className="text-zinc-500 font-bold">Taxes</span>
                  <span className="font-mono font-black text-slate-800">₹{quoteResults.gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-slate-900 font-heavy uppercase tracking-tight">Est. Net Total Cost</span>
                  <span className="font-mono font-black text-[#FF4D00] text-base">₹{quoteResults.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {quoteResults.productionNotes && (
                <div className="bg-gradient-to-br from-zinc-900 to-[#0F172A] text-white rounded-[20px] p-4 space-y-2.5">
                  <span className="text-[9px] font-mono text-[#FF4D00] font-black uppercase tracking-widest block">Specifications & Summary</span>
                  <ul className="space-y-2">
                    {quoteResults.productionNotes.map((rec: string, idx: number) => (
                      <li key={idx} className="text-[10.5px] leading-relaxed text-zinc-300 font-medium">✨ {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-zinc-200 rounded-[28px] bg-zinc-50 flex flex-col items-center justify-center p-6 text-zinc-400 space-y-3">
              <FileText className="w-10 h-10 text-zinc-300 animate-bounce" />
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase">Awaiting Specifications Input</p>
                <p className="text-[10px] text-zinc-400 mt-1 max-w-[280px]">Adjust quantities and tap Request to generate a quotation immediately.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
