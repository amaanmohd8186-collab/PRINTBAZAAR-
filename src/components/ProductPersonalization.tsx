import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, Image as ImageIcon, QrCode, Clipboard, Gift, Check, Sparkles, Sliders, Minimize, RefreshCw, ZoomIn
} from 'lucide-react';

interface ProductPersonalizationProps {
  productName: string;
  category: string;
  onUpdatePersonalization?: (data: any) => void;
}

export default function ProductPersonalization({ productName, category, onUpdatePersonalization }: ProductPersonalizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Custom states
  const [customText, setCustomText] = useState('My Brand Corp');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [textColor, setTextColor] = useState('#FF4D00');
  const [textSize, setTextSize] = useState(24);
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(40);

  // Logo / Photo states
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1563986768609-322da13575f3?w=100');
  const [logoX, setLogoX] = useState(50);
  const [logoY, setLogoY] = useState(70);
  const [logoScale, setLogoScale] = useState(40);

  // QR Code details
  const [qrText, setQrText] = useState('https://printbazaar.ai/scan');
  const [includeQr, setIncludeQr] = useState(false);
  const [qrX, setQrX] = useState(80);
  const [qrY, setQrY] = useState(75);
  const [qrScale, setQrScale] = useState(30);

  // Signature
  const [signatureText, setSignatureText] = useState('');
  const [includeSignature, setIncludeSignature] = useState(false);

  // Gift options
  const [giftWrap, setGiftWrap] = useState(false);
  const [premiumBox, setPremiumBox] = useState(false);
  const [greetingCard, setGreetingCard] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

  // Draw simulated dynamic mockup on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas with subtle luxury background mock 
    ctx.fillStyle = '#060402';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Inner card alignment grid borders
    ctx.strokeStyle = 'rgba(255, 77, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Dynamic gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(15, 15, canvas.width - 30, canvas.height - 30);

    // Draw offset branding lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 4;
    for (let i = 0; i < canvas.width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 100, canvas.height);
      ctx.stroke();
    }

    // Draw customized logo if available
    if (logoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoUrl;
      img.onload = () => {
        const lx = (logoX / 100) * canvas.width;
        const ly = (logoY / 100) * canvas.height;
        const size = (logoScale / 100) * 80;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(lx, ly, size / 2 + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(img, lx - size/2, ly - size/2, size, size);
      };
    }

    // Draw Custom Text 
    ctx.font = `${textSize}px ${fontFamily}, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    const tx = (textX / 100) * canvas.width;
    const ty = (textY / 100) * canvas.height;
    ctx.fillText(customText, tx, ty);

    // QR Code Simulation
    if (includeQr) {
      const qx = (qrX / 100) * canvas.width;
      const qy = (qrY / 100) * canvas.height;
      const size = (qrScale / 100) * 80;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qx - size/2, qy - size/2, size, size);
      
      // Draw simulated QR segments
      ctx.fillStyle = '#000000';
      ctx.fillRect(qx - size/2 + 2, qy - size/2 + 2, size/3, size/3);
      ctx.fillRect(qx + size/2 - size/3 - 2, qy - size/2 + 2, size/3, size/3);
      ctx.fillRect(qx - size/2 + 2, qy + size/2 - size/3 - 2, size/3, size/3);
      ctx.fillRect(qx - 2, qy - 2, 4, 4);
    }

    // Capture personalization state
    if (onUpdatePersonalization) {
      onUpdatePersonalization({
        customText,
        textColor,
        textSize,
        logoX,
        logoY,
        includeQr,
        qrText,
        giftWrap,
        premiumBox,
        greetingCard,
        giftMessage
      });
    }
  }, [
    customText, fontFamily, textColor, textSize, textX, textY,
    logoUrl, logoX, logoY, logoScale,
    qrText, includeQr, qrX, qrY, qrScale,
    giftWrap, premiumBox, greetingCard, giftMessage
  ]);

  return (
    <div className="bg-zinc-950 text-white rounded-[32px] p-6 border border-zinc-800 space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-[#FF4D00]/10 text-[#FF4D00] rounded-2xl border border-[#FF4D00]/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-black uppercase tracking-tight">Product Personalization</h4>
            <p className="text-[10px] text-zinc-400 font-mono">Live preview. Adjust text, fonts, and branding assets.</p>
          </div>
        </div>
        <div className="p-1 px-3 bg-zinc-900 text-xs text-zinc-400 rounded-full font-mono border border-zinc-800">
          Category: {category}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Live Vector Canvas Preview */}
        <div className="space-y-4">
          <div className="border border-zinc-850 rounded-[28px] overflow-hidden bg-[#060402] relative p-4 flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={260}
              className="max-w-full rounded-2xl shadow-2xl border border-zinc-800"
            />
            
            <div className="absolute top-6 right-6 bg-emerald-500 text-black text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
              <ZoomIn className="w-3 h-3" />
              <span>PREMIUM QUALITY</span>
            </div>
          </div>

          {/* Interactive Gift Printing Options */}
          <div className="bg-zinc-900/40 border border-zinc-850/60 p-5 rounded-[24px] space-y-3.5">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold flex items-center gap-1">
              <Gift className="w-4 h-4 text-[#FF4D00]" />
              <span>Exclusive Gifting & Box Customization</span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGiftWrap(!giftWrap)}
                className={`py-2 px-3 rounded-xl text-left border text-xs font-bold font-sans transition cursor-pointer ${
                  giftWrap 
                    ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-[#FF4D00]' 
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                }`}
              >
                Gift Wrapping
              </button>
              <button
                type="button"
                onClick={() => setPremiumBox(!premiumBox)}
                className={`py-2 px-3 rounded-xl text-left border text-xs font-bold font-sans transition cursor-pointer ${
                  premiumBox 
                    ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-[#FF4D00]' 
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                }`}
              >
                Premium Box
              </button>
              <button
                type="button"
                onClick={() => setGreetingCard(!greetingCard)}
                className={`py-2 px-3 rounded-xl text-left border text-xs font-bold font-sans transition cursor-pointer ${
                  greetingCard 
                    ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-[#FF4D00]' 
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                }`}
              >
                Greeting Card
              </button>
            </div>

            {(giftWrap || premiumBox || greetingCard) && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-[10px] uppercase font-mono text-zinc-400 block font-bold">Personalized Greeting Card Message</label>
                <textarea 
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="e.g. Happy Anniversary Corporate Team! Best regards from PrintBazaar."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium focus:outline-hidden text-zinc-300"
                />
              </div>
            )}
          </div>
        </div>

        {/* Configurations Controls tab */}
        <div className="space-y-4">
          <div className="space-y-3.5 bg-zinc-900 border border-zinc-850 p-5 rounded-[24px]">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span>Brand Title Personalization</span>
            </span>
            
            <div className="space-y-3">
              <input 
                type="text" 
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold focus:outline-hidden text-white placeholder-zinc-650"
                placeholder="Enter company/personal text"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Font Face</label>
                  <select 
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs"
                  >
                    <option>Inter</option>
                    <option>Space Grotesk</option>
                    <option>JetBrains Mono</option>
                    <option>Playfair Display</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Ink Tone / Color</label>
                  <input 
                    type="color" 
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-8 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer p-0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Base Size ({textSize}px)</label>
                  <input 
                    type="range" 
                    min={12} 
                    max={48} 
                    value={textSize}
                    onChange={(e) => setTextSize(parseInt(e.target.value))}
                    className="w-full accent-[#FF4D00]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Grid X ({textX}%)</label>
                  <input 
                    type="range" 
                    min={10} 
                    max={90} 
                    value={textX}
                    onChange={(e) => setTextX(parseInt(e.target.value))}
                    className="w-full accent-[#FF4D00]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Grid Y ({textY}%)</label>
                  <input 
                    type="range" 
                    min={10} 
                    max={90} 
                    value={textY}
                    onChange={(e) => setTextY(parseInt(e.target.value))}
                    className="w-full accent-[#FF4D00]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 bg-zinc-900 border border-zinc-850 p-5 rounded-[24px]">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Branding Logo Placement Coordinates</span>
            </span>

            <div className="space-y-3">
              <input 
                type="text" 
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold focus:outline-hidden text-white"
                placeholder="Logo image direct secure URL"
              />

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Logo Scale</label>
                  <input 
                    type="range" 
                    min={10} 
                    max={120} 
                    value={logoScale}
                    onChange={(e) => setLogoScale(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Logo X ({logoX}%)</label>
                  <input 
                    type="range" 
                    min={10} 
                    max={90} 
                    value={logoX}
                    onChange={(e) => setLogoX(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">Logo Y ({logoY}%)</label>
                  <input 
                    type="range" 
                    min={10} 
                    max={90} 
                    value={logoY}
                    onChange={(e) => setLogoY(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 bg-zinc-900 border border-zinc-850 p-5 rounded-[24px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-emerald-500" />
                <span>Integrated Smart QR Codes</span>
              </span>
              <input 
                type="checkbox" 
                checked={includeQr}
                onChange={(e) => setIncludeQr(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>

            {includeQr && (
              <div className="space-y-3 animate-fadeIn">
                <input 
                  type="text" 
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold focus:outline-hidden text-white"
                  placeholder="QR redirection link (e.g. UPI pay address)"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">QR X ({qrX}%)</label>
                    <input 
                      type="range" 
                      min={10} 
                      max={90} 
                      value={qrX}
                      onChange={(e) => setQrX(parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block">QR Y ({qrY}%)</label>
                    <input 
                      type="range" 
                      min={10} 
                      max={90} 
                      value={qrY}
                      onChange={(e) => setQrY(parseInt(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
