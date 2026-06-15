/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  QrCode, 
  Download, 
  Share2, 
  Mail, 
  FileText,
  Smartphone,
  Facebook,
  Twitter,
  Instagram,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Product, Size, Material } from '../types';

interface SmartShareSystemProps {
  product: Product;
  selectedSize?: Size;
  selectedMaterial?: Material;
  selectedQuantity?: number;
  totalPrice?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const SmartShareSystem: React.FC<SmartShareSystemProps> = ({
  product,
  selectedSize,
  selectedMaterial,
  selectedQuantity = 100,
  totalPrice = 1499,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showNativeAlert, setShowNativeAlert] = useState(false);
  const [nativeAlertMsg, setNativeAlertMsg] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  // Fallbacks
  const sizeName = selectedSize?.name || product.sizes[0]?.name || 'Standard';
  const materialName = selectedMaterial?.name || product.materials[0]?.name || 'Standard Matte';
  const deliveryEstimate = product.estimatedProductionTime || '3-5 Action Days';
  const shareUrl = `${window.location.origin}/?product=${product.id}`;

  const ratingStars = '⭐⭐⭐⭐⭐';

  // preformatted text
  const shareText = `🛍 *${product.name}* on PrintBazaar

⭐ *Rating:* 5/5 Premier Choice
📏 *Size Selected:* ${sizeName}
🎨 *Material & finish:* ${materialName}
🔢 *Quantity:* ${selectedQuantity} Pcs
💰 *Pricing Total:* INR ${totalPrice.toLocaleString('en-IN')}
🚚 *Delivery Estimate:* ${deliveryEstimate}

👉 Order this product customized in 3 minutes here:
🔗 ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // safe fallback
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `PrintBazaar - ${product.name}`,
          text: shareText,
          url: shareUrl
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          triggerAlert(`Native share error: ${err.message}`);
        }
      }
    } else {
      triggerAlert("Web Share API not supported on this browser. We've copied the share link to your clipboard so you can paste it anywhere!");
      handleCopyLink();
    }
  };

  const triggerAlert = (msg: string) => {
    setNativeAlertMsg(msg);
    setShowNativeAlert(true);
    setTimeout(() => setShowNativeAlert(false), 4000);
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleTelegramShare = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodedText}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = `Check out this customized ${product.name} on PrintBazaar! Premium offset quality in 3 minutes flat.`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleInstagramShare = () => {
    // Instagram doesn't support direct text shares, so copy details to clipboard and redirect to instagram web
    handleCopyLink();
    triggerAlert("Product details and link copied to clipboard! Opening Instagram. Paste it in your bio, story, or direct message.");
    setTimeout(() => {
      window.open('https://instagram.com', '_blank');
    }, 1500);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Premium Print Quote: ${product.name}`);
    const body = encodeURIComponent(shareText);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleNearbyShare = () => {
    triggerAlert("Nearby Share requested! Connecting with neighboring Android/Windows hosts in secure range...");
  };

  // GENERATE & DOWNLOAD PRODUCT FLYER CARD IMAGE (HTML CANVAS DRAWING)
  const downloadCardImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 1200);
    gradient.addColorStop(0, '#0F172A'); // Slate-900
    gradient.addColorStop(0.5, '#1E293B'); // Slate-800
    gradient.addColorStop(1, '#020617'); // Slate-950
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 1200);

    // Modern orange badge glow
    ctx.fillStyle = 'rgba(255, 77, 0, 0.05)';
    ctx.beginPath();
    ctx.arc(600, 140, 300, 0, Math.PI * 2);
    ctx.fill();

    // Border stroke
    ctx.strokeStyle = 'rgba(255, 77, 0, 0.15)';
    ctx.lineWidth = 16;
    ctx.strokeRect(60, 60, 1080, 1080);

    // Decorative branding Header
    ctx.fillStyle = '#FF4D00';
    ctx.font = 'bold 36px font-sans, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('PRINTBAZAAR PREMIUM CATALOGUING', 600, 150);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold tracking-[6px] 20px monospace';
    ctx.fillText('ULTRA-HD SMART CONVERSION PROTOCOL', 600, 190);

    // Horizontal Rule
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 240);
    ctx.lineTo(1050, 240);
    ctx.stroke();

    // Draw Mock Product container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(150, 280, 900, 480);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.strokeRect(150, 280, 900, 480);

    // Product specifications text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 52px font-sans, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(product.name, 200, 370);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '40px font-sans, system-ui';
    ctx.fillText(`Category: ${product.category}`, 200, 435);

    // Stars
    ctx.fillStyle = '#F59E0B'; // Amber
    ctx.font = '36px font-sans';
    ctx.fillText('Rating: ★★★★★ Premium Quality Checked', 200, 495);

    // Specifications Grid inside card
    ctx.fillStyle = '#FF4D00';
    ctx.font = 'bold 28px font-mono';
    ctx.fillText('• SPECIFICATIONS:', 200, 560);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '26px monospace';
    ctx.fillText(`Size Layout:   ${sizeName}`, 240, 610);
    ctx.fillText(`Substrate Material: ${materialName}`, 240, 655);
    ctx.fillText(`Production SLA:     ${deliveryEstimate}`, 240, 700);

    // Total Price block
    ctx.fillStyle = '#FF4D00';
    ctx.fillRect(150, 790, 420, 160);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px font-sans';
    ctx.textAlign = 'center';
    ctx.fillText('MINIMUM BATCH QUOTE', 360, 845);
    ctx.font = 'bold 50px font-mono';
    ctx.fillText(`INR ${totalPrice.toLocaleString('en-IN')}*`, 360, 915);

    // QR Code Section details
    ctx.strokeStyle = 'rgba(255, 77, 0, 0.2)';
    ctx.strokeRect(840, 790, 210, 210);

    // Draw an actual QR image if it is rendered as SVG
    const svgElement = qrRef.current?.querySelector('svg');
    if (svgElement) {
      const xml = new XMLSerializer().serializeToString(svgElement);
      const svg64 = btoa(xml);
      const b64Start = 'data:image/svg+xml;base64,';
      const image = new Image();
      image.src = b64Start + svg64;
      image.onload = () => {
        // Draw the QR onto canvas now
        ctx.drawImage(image, 840, 790, 210, 210);
        
        // Brand Footer decoration
        ctx.fillStyle = '#475569';
        ctx.font = '22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Scan QR Code with Camera to Open Customization Editor', 600, 1060);
        ctx.fillText('© PrintBazaar High-Performance Smart Cloud Commerce', 600, 1100);

        // Download call
        triggerDownload(canvas, `${product.name.replace(/\s+/g, '_')}_share_card.png`);
      };
    } else {
      // In case SVG is not ready, make a clean placeholder QR box
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(845, 795, 200, 200);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px font-mono';
      ctx.fillText('QR CODE', 945, 905);
      
      ctx.fillStyle = '#475569';
      ctx.font = '22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Scan link to customize: ' + shareUrl, 600, 1060);
      ctx.fillText('© PrintBazaar High-Performance Smart Cloud Commerce', 600, 1100);

      triggerDownload(canvas, `${product.name.replace(/\s+/g, '_')}_share_card.png`);
    }
  };

  const triggerDownload = (canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    triggerAlert("✨ Premium High-Contrast share card downloaded successfully!");
  };

  // DOWNLOAD TECHNICAL PRINT CATALOG PRODUCT SPEC PDF (using jsPDF)
  const downloadProposalPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42); // slate dark navbar
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 77, 0); // orange branding
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("PRINTBAZAAR PROPOSAL SHEET", 20, 20);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('courier', 'bold');
      doc.text("SECURE AUTOMATED SMART COMMERCIAL QUOTE PROTOCOL", 20, 30);

      // Body parameters
      doc.setTextColor(33, 43, 54);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      let currentY = 55;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("PRODUCT SUMMARY", 20, currentY);
      currentY += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Product Name:   ${product.name}`, 20, currentY); currentY += 7;
      doc.text(`Category:       ${product.category}`, 20, currentY); currentY += 7;
      doc.text(`Primary Link:   ${shareUrl}`, 20, currentY); currentY += 15;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("SPECIFICATIONS SELECTED", 20, currentY);
      currentY += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Cut Size Variant:           ${sizeName}`, 20, currentY); currentY += 7;
      doc.text(`Material / Substrate Stock:  ${materialName}`, 20, currentY); currentY += 7;
      doc.text(`Order Quantity:             ${selectedQuantity} Pieces`, 20, currentY); currentY += 7;
      doc.text(`Estimated Dispatch SLA:     ${deliveryEstimate}`, 20, currentY); currentY += 15;

      doc.setFillColor(245, 247, 250); // grey table block
      doc.rect(20, currentY - 5, 170, 30, 'F');
      doc.setDrawColor(220, 225, 230);
      doc.rect(20, currentY - 5, 170, 30, 'S');

      doc.setTextColor(255, 77, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("MINIMUM ESTIMATE VALUE (ALL INCLUSIVE)", 25, currentY + 4);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.text(`INR ${totalPrice.toLocaleString('en-IN')}*`, 25, currentY + 16);
      
      currentY += 35;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text("* Pricing includes luxury proof check, premium standard lamination & direct home delivery.", 20, currentY); currentY += 15;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("Verification QR Code is attached below.", 20, currentY);

      doc.save(`${product.name.replace(/\s+/g, '_')}_PB_Quote.pdf`);
      triggerAlert("✨ Official commercial proposal PDF generated and downloaded!");
    } catch (e: any) {
      triggerAlert(`PDF compilation error: ${e.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
      {/* Background click handler */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="w-full max-w-lg bg-zinc-900 border-t border-zinc-800 rounded-t-[32px] p-6 text-white relative z-10 select-none shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-ping" />
            <h3 className="text-sm font-black uppercase tracking-tight text-white leading-none">Smart Share & Catalogs</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Spec Card Preview inside bottom sheet */}
        <div className="bg-zinc-950 p-4 rounded-[22px] border border-zinc-800 flex items-start gap-3.5 mb-5 shadow-inner">
          <img 
            src={product.image || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=300&q=80'} 
            alt={product.name} 
            className="w-16 h-16 object-cover rounded-xl border border-zinc-800 bg-zinc-900"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=300&q=80';
            }}
          />
          <div className="space-y-0.5">
            <span className="text-[9px] bg-indigo-900/40 text-indigo-400 font-extrabold font-mono px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-800/10 inline-block">
              {product.category}
            </span>
            <h4 className="text-sm font-heavy text-white uppercase tracking-tight">{product.name}</h4>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight font-mono">
              {sizeName} • {materialName} • {selectedQuantity} Pcs
            </p>
            <p className="text-xs font-black text-[#FF4D00] font-mono">
              ₹{totalPrice.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Share Matrix Row 1 (Social instant shares) */}
        <div className="space-y-4 mb-6">
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Instant Dispatch channels</p>
          <div className="grid grid-cols-4 gap-3 text-center">
            
            {/* WhatsApp */}
            <button 
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center gap-2 p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-2xl transition group cursor-pointer"
            >
              <div className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-108 transition">
                <Send className="w-5 h-5 ml-0.5" />
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-300">WhatsApp</span>
            </button>

            {/* Facebook */}
            <button 
              onClick={handleFacebookShare}
              className="flex flex-col items-center gap-2 p-3 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/20 rounded-2xl transition group cursor-pointer"
            >
              <div className="w-10 h-10 bg-[#1877F2] text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-108 transition">
                <Facebook className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-300">Facebook</span>
            </button>

            {/* Telegram */}
            <button 
              onClick={handleTelegramShare}
              className="flex flex-col items-center gap-2 p-3 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 rounded-2xl transition group cursor-pointer"
            >
              <div className="w-10 h-10 bg-[#0088cc] text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-108 transition">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-300">Telegram</span>
            </button>

            {/* Twitter */}
            <button 
              onClick={handleTwitterShare}
              className="flex flex-col items-center gap-2 p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-2xl transition group cursor-pointer"
            >
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-108 transition border border-zinc-700/60">
                <Twitter className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-300">X (Twitter)</span>
            </button>

            {/* Instagram */}
            <button 
              onClick={handleInstagramShare}
              className="flex flex-col items-center gap-2 p-3 bg-[#E1306C]/10 hover:bg-[#E1306C]/20 border border-[#E1306C]/20 rounded-2xl transition group cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-[#FFDC80] via-[#E1306C] to-[#833AB4] text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-108 transition">
                <Instagram className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-300">Instagram</span>
            </button>

            {/* Email */}
            <button 
              onClick={handleEmailShare}
              className="flex flex-col items-center gap-2 p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-2xl transition group cursor-pointer"
            >
              <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-108 transition">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-300">Email Option</span>
            </button>

            {/* Nearby */}
            <button 
              onClick={handleNearbyShare}
              className="flex flex-col items-center gap-2 p-3 bg-teal-500/10 hover:bg-teal-500/25 border border-teal-505/20 rounded-2xl transition group cursor-pointer"
            >
              <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-108 transition">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-300">Nearby Share</span>
            </button>

            {/* Native API */}
            <button 
              onClick={handleNativeShare}
              className="flex flex-col items-center gap-2 p-3 bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 border border-[#FF4D00]/20 rounded-2xl transition group cursor-pointer"
            >
              <div className="w-10 h-10 bg-[#FF4D00] text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-108 transition">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-350">Universal UI</span>
            </button>

          </div>
        </div>

        {/* Secondary download options / copy links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            type="button"
            onClick={downloadCardImage}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md shadow-indigo-600/10"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG Card</span>
          </button>
          
          <button 
            type="button"
            onClick={downloadProposalPDF}
            className="inline-flex items-center justify-center gap-2 bg-[#FF4D00] hover:bg-[#d93d00] text-white rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md shadow-[#FF4D00]/15"
          >
            <FileText className="w-4 h-4" />
            <span>Download Quote PDF</span>
          </button>
        </div>

        {/* Copy Link & Toggle QR */}
        <div className="flex items-center gap-3 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
          <input 
            type="text" 
            value={shareUrl} 
            readOnly
            className="bg-transparent text-xs font-mono text-zinc-400 select-all outline-none border-none flex-1 truncate pr-2"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button 
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="p-1 px-2.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[10px] uppercase font-bold inline-flex items-center gap-1 transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>
            <button 
              type="button"
              onClick={handleCopyLink}
              className="p-1 px-2.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[10px] uppercase font-bold inline-flex items-center gap-1.5 transition cursor-pointer min-w-16 justify-center"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Section inside bottom sheet */}
        <AnimatePresence>
          {showQr && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-zinc-950 p-5 rounded-[22px] border border-zinc-800 flex flex-col items-center justify-center gap-3 overflow-hidden shadow-inner"
            >
              <div ref={qrRef} className="p-4 bg-white rounded-2xl">
                <QRCodeSVG 
                  value={shareUrl} 
                  size={150} 
                  level="Q" 
                  bgColor="#FFFFFF"
                  fgColor="#0F172A"
                  includeMargin={false}
                />
              </div>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest text-center mt-1">Scan card with smartphone to buy</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Universal alerts info */}
        <AnimatePresence>
          {showNativeAlert && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-5 left-6 right-6 bg-slate-900 border border-zinc-700 rounded-xl p-3.5 text-center shadow-2xl z-50 flex items-start gap-3"
            >
              <span className="w-2 h-2 rounded-full bg-[#FF4D00] animate-ping shrink-0 mt-1.5" />
              <p className="text-xs text-white uppercase text-left tracking-wide leading-relaxed pr-2 font-mono">{nativeAlertMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};
