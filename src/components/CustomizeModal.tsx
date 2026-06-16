/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Sparkles, HelpCircle, FileText, Loader2, Share2, Download, Layers } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Product, SizeOption, MaterialOption, CartItem, CustomFile } from '../types';
import { calculateItemPrice, CATEGORY_DEFAULT_IMAGES } from '../data';
import ProductPersonalization from './ProductPersonalization';

interface CustomizeModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export default function CustomizeModal({
  product,
  onClose,
  onAddToCart
}: CustomizeModalProps) {
  const allImages = [
    product.image || CATEGORY_DEFAULT_IMAGES[product.category] || CATEGORY_DEFAULT_IMAGES['Business Cards'],
    ...(product.galleryImages || [])
  ].filter(Boolean);

  const [activeImage, setActiveImage] = useState<string>(allImages[0] || CATEGORY_DEFAULT_IMAGES[product.category] || CATEGORY_DEFAULT_IMAGES['Business Cards']);
  const [imgError, setImgError] = useState(false);

  const [selectedSize, setSelectedSize] = useState<SizeOption>(product.sizes[0]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption>(product.materials[0]);
  const [quantity, setQuantity] = useState<number>(
    product.quantitySlabs[0]?.quantity || 100
  );
  const [customQtyInput, setCustomQtyInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [designFile, setDesignFile] = useState<CustomFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gemini suggestions states
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  
  // Custom QR Share State
  const [showQr, setShowQr] = useState<boolean>(false);
  const [proofToggle, setProofToggle] = useState<'mockup' | 'bleed'>('mockup');

  // Query server side Gemini recommendations proxy
  const generateAiSuggestions = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    setAiResponse('');
    try {
      const response = await fetch('/api/gemini/generate-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          productName: product.name,
          currentOptions: {
            size: selectedSize.name,
            sizeDimensions: selectedSize.dimensions,
            material: selectedMaterial.name,
            materialMultiplier: selectedMaterial.priceMultiplier,
            quantity: quantity
          }
        })
      });
      
      const text = await response.text();
      let data: any = {};
      
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error("Non-JSON response from Gemini advice:", text);
          throw new Error(`Server returned non-JSON response (${response.status})`);
        }
      }
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `Advisory service error (${response.status})`);
      }
      
      if (data.success && data.text) {
        setAiResponse(data.text);
      } else {
        setAiResponse(data.error || 'Failed to retrieve advice. Please try again or verify your settings.');
      }
    } catch (err: any) {
      console.error("Gemini advice request error:", err);
      setAiResponse(`Advisory Error: ${err.message || 'Unable to reach Gemini print advisory desk.'}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Synchronize dynamic lists when product swaps / Recover draft if exists
  useEffect(() => {
    const draftJson = localStorage.getItem(`pb_customization_draft_${product.id}`);
    let recovered = false;
    if (draftJson) {
      try {
        const draft = JSON.parse(draftJson);
        const matchedSize = product.sizes.find(s => s.name === draft.selectedSize?.name);
        if (matchedSize) setSelectedSize(matchedSize);
        else setSelectedSize(product.sizes[0]);

        const matchedMat = product.materials.find(m => m.name === draft.selectedMaterial?.name);
        if (matchedMat) setSelectedMaterial(matchedMat);
        else setSelectedMaterial(product.materials[0]);

        if (draft.quantity) {
          setQuantity(draft.quantity);
          setCustomQtyInput(draft.quantity.toString());
        } else {
          const dQty = product.quantitySlabs[0]?.quantity || 100;
          setQuantity(dQty);
          setCustomQtyInput(dQty.toString());
        }

        if (draft.designFile) {
          setDesignFile(draft.designFile);
        } else {
          setDesignFile(null);
        }

        setFileError(null);
        setUploadProgress(null);
        setAiPrompt(draft.aiPrompt || '');
        setAiResponse(draft.aiResponse || '');
        recovered = true;
      } catch (e) {
        console.warn("Failed recovery processing draft parse, resetting to defaults", e);
      }
    }
    
    if (!recovered) {
      setSelectedSize(product.sizes[0]);
      setSelectedMaterial(product.materials[0]);
      const dQty = product.quantitySlabs[0]?.quantity || 100;
      setQuantity(dQty);
      setCustomQtyInput(dQty.toString());
      setDesignFile(null);
      setFileError(null);
      setUploadProgress(null);
      setAiPrompt('');
      setAiResponse('');
    }
  }, [product]);

  // Periodic Auto-saver every 30 seconds
  useEffect(() => {
    const interval = setTimeout(() => {
      const draftObj = {
        selectedSize,
        selectedMaterial,
        quantity,
        designFile,
        aiPrompt,
        aiResponse
      };
      localStorage.setItem(`pb_customization_draft_${product.id}`, JSON.stringify(draftObj));
    }, 30000);

    return () => clearTimeout(interval);
  }, [product.id, selectedSize, selectedMaterial, quantity, designFile, aiPrompt, aiResponse]);

  // Calculate dynamic pricing parameters
  const getDynamicQtyStep = () => {
    if (product.quantitySlabs.length >= 2) {
      return product.quantitySlabs[1].quantity - product.quantitySlabs[0].quantity;
    }
    return product.quantitySlabs[0]?.quantity || 50;
  };
  const qtyStep = getDynamicQtyStep();
  const minQty = product.quantitySlabs[0]?.quantity || 100;

  const finalPrice = calculateItemPrice(product, selectedSize, selectedMaterial, quantity);
  const halfAdvance = finalPrice;
  const halfBalance = 0;

  // Handle direct custom volume typing
  const handleQtyChange = (valStr: string) => {
    setCustomQtyInput(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setQuantity(parsed);
    }
  };

  // Drag and Drop files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [printWarnings, setPrintWarnings] = useState<string[]>([]);
  const [activeAITool, setActiveAITool] = useState<string | null>(null);
  const [isProofApproved, setIsProofApproved] = useState<boolean>(false);

  const applyAITool = (toolName: string) => {
    setActiveAITool(toolName);
    setIsEnhancing(true);
    setTimeout(() => {
      setIsEnhancing(false);
      setActiveAITool(null);
      setPrintWarnings([]); // Clearing warnings if AI tool enhanced it
    }, 2500);
  };

  const validateAndUploadMultipleFiles = async (files: File[]) => {
    setFileError(null);
    setPrintWarnings([]);
    
    if (files.length === 0) return;

    const allowedExtensions = ['ai', 'pdf', 'png', 'jpg', 'jpeg'];
    const invalidFiles = files.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return !allowedExtensions.includes(ext);
    });

    if (invalidFiles.length > 0) {
      setFileError(`Some files have invalid print formats (${invalidFiles.map(i => i.name).join(', ')}). Allowed: .AI, .PDF, .PNG, .JPG`);
      return;
    }

    const overSizedFiles = files.filter(f => f.size > 50 * 1024 * 1024);
    if (overSizedFiles.length > 0) {
      setFileError('Design file dimension exceeds limit. Maximum file weight limit is 50MB per file.');
      return;
    }

    setUploadProgress(0);
    
    // Simulate batch progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 15;
      });
    }, 100);

    const parseDimensions = (sizeName: string): { width: number, height: number } | null => {
      const match = sizeName.match(/\((\d+\.?\d*)["']?\s*[xX*]\s*(\d+\.?\d*)["']?\)/);
      if (match) return { width: parseFloat(match[1]), height: parseFloat(match[2]) };
      if (sizeName.includes('A4')) return { width: 8.27, height: 11.69 };
      if (sizeName.includes('A3')) return { width: 11.69, height: 16.54 };
      if (sizeName.includes('A2')) return { width: 16.54, height: 23.39 };
      if (sizeName.includes('A1')) return { width: 23.39, height: 33.11 };
      if (sizeName.includes('A5')) return { width: 5.83, height: 8.27 };
      return null;
    };

    const dimensions = parseDimensions(selectedSize.name);
    const warnings: string[] = [];

    // Process all files
    const processedFiles: any[] = await Promise.all(files.map(async (file, idx) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const isProfessionalOffset = selectedMaterial.name.includes('Professional Offset');
      const bleedMeta = isProfessionalOffset ? ' + 3mm Bleed Applied' : '';

      if (idx === 0) {
        if (isProfessionalOffset) {
          warnings.push('✨ Professional Offset: 3mm Bleed Margin automatically calculated.');
        }
      }

      if (['png', 'jpg', 'jpeg'].includes(fileExt)) {
        return new Promise<any>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const srcData = e.target?.result as string;
            const img = new Image();
            img.onload = () => {
              let width = img.width;
              let height = img.height;
              
              if (idx === 0 && dimensions) {
                const dpiX = width / dimensions.width;
                const dpiY = height / dimensions.height;
                const minDpi = Math.min(dpiX, dpiY);
                if (minDpi < 300) {
                  warnings.push(`⚠️ Primary File Resolution: ${Math.round(minDpi)} DPI. 300 DPI is optimal.`);
                }
              }

              const canvas = document.createElement('canvas');
              const MAX_DIM = 1200;
              if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) {
                  height = Math.round((height * MAX_DIM) / width);
                  width = MAX_DIM;
                } else {
                  width = Math.round((width * MAX_DIM) / height);
                  height = MAX_DIM;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve({
                  name: file.name + bleedMeta,
                  size: file.size,
                  type: file.type,
                  fileData: canvas.toDataURL('image/jpeg', 0.8)
                });
              } else {
                resolve({
                  name: file.name + bleedMeta,
                  size: file.size,
                  type: file.type,
                  fileData: srcData
                });
              }
            };
            img.src = srcData;
          };
          reader.readAsDataURL(file);
        });
      } else {
        if (idx === 0 && isProfessionalOffset) {
          warnings.push('✨ Professional Offset: 3mm Bleed Margin suggested for vector formats.');
        }
        return {
          name: file.name + (isProfessionalOffset ? ' (Bleed Applied)' : ''),
          size: file.size,
          type: file.type
        };
      }
    }));

    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(null);
      setPrintWarnings(warnings);

      const primary = processedFiles[0];
      const variations = processedFiles.slice(1);
      
      setDesignFile({
        ...primary,
        variations: variations.length > 0 ? variations : undefined
      });
      setProofToggle('bleed');
    }, 850);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUploadMultipleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUploadMultipleFiles(Array.from(e.target.files));
    }
  };

  const submitToCart = () => {
    if (quantity < minQty) {
      setFileError(`⚠️ Minimum order quantity for ${product.name} is ${minQty} Pcs.`);
      return;
    }

    if (!designFile) {
      setFileError('⚠️ Design file is mandatory to request production print runs.');
      return;
    }
    
    if (isReviewMode && !isProofApproved) {
      setFileError('⚠️ You must approve the digital proof before continuing.');
      return;
    }

    const cartItem: CartItem = {
      id: 'cart-item-' + Date.now(),
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      selectedSize,
      selectedMaterial,
      selectedQuantity: quantity,
      designFile,
      itemTotal: finalPrice,
      advanceAmount: finalPrice,
      balanceAmount: 0,
      productImage: product.image
    };

    onAddToCart(cartItem);
    localStorage.removeItem(`pb_customization_draft_${product.id}`);
  };

  // Unit pricing slab info to render helper badges
  const currentSlabInfo = [...product.quantitySlabs]
    .sort((a,b) => b.quantity - a.quantity)
    .find(s => quantity >= s.quantity) || product.quantitySlabs[0];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] md:max-h-[85vh] border border-gray-100">
        
        {/* Left Side Product Visuals and Info */}
        <div className="w-full md:w-5/12 bg-[#0F172A] text-white relative flex flex-col justify-between p-8">
          <button
            type="button"
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <div className="flex justify-between items-start">
              <span className="bg-[#FF4D00] text-white font-micro px-3.5 py-1.5 rounded-full">
                {product.category}
              </span>
              <div className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center font-heavy text-[8px] text-[#FF4D00] rotate-12 uppercase shrink-0">
                PRINT<br/>CERT
              </div>
            </div>

            <h2 className="text-3xl font-heavy mt-6 uppercase leading-none tracking-tight text-white">{product.name}</h2>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed font-normal">{product.description}</p>
          </div>

          <div className="my-6 hidden md:block">
            {/* View Mode Toggle when custom design vector asset is active */}
            {designFile && (
              <div className="flex bg-neutral-900 border border-slate-800 p-1.5 rounded-2xl gap-2 mb-4 w-full">
                <button
                  type="button"
                  onClick={() => setProofToggle('mockup')}
                  className={`flex-1 py-2 text-center text-[10px] uppercase tracking-wider font-extrabold rounded-xl transition cursor-pointer ${
                    proofToggle === 'mockup' 
                      ? 'bg-black text-white border border-slate-800 shadow-xs' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  📷 Mockup View
                </button>
                <button
                  type="button"
                  onClick={() => setProofToggle('bleed')}
                  className={`flex-1 py-1.5 text-center text-[10px] uppercase tracking-wider font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    proofToggle === 'bleed' 
                      ? 'bg-[#FF4D00]' : 'text-zinc-405'
                  } text-white shadow-xs`}
                >
                  📐 2D Digital Bleed Proof (Live)
                </button>
              </div>
            )}

            {proofToggle === 'bleed' && designFile ? (
              /* Dynamic 2D Bleed Proof Visualizer Overlay */
              <div className="w-full bg-[#0a0a0c] border border-slate-800 rounded-[28px] p-6 flex flex-col justify-between aspect-4/3 relative overflow-hidden shadow-2xl">
                {/* Visual Grid Sheet Lines Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                
                {/* Visual Bounding Layout Card Substrate Sheet representation */}
                <div className="w-full flex-1 flex flex-col items-center justify-center max-h-[160px] relative z-10 mt-1">
                  <div className="relative w-full max-w-[230px] aspect-[1.58] bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center shadow-lg">
                    {/* Rendered Design Asset */}
                    {designFile.fileData && (
                      <img 
                        src={designFile.fileData} 
                        alt="Bleed Visual Layer Preview Frame" 
                        className="absolute inset-0 w-full h-full object-cover opacity-85"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* Outer Bleed Margin Bounds: dashed rose contour */}
                    <div className="absolute inset-0 border-2 border-dashed border-rose-500/80 pointer-events-none flex items-start justify-start p-1.5">
                      <span className="text-[7.5px] font-mono text-rose-300 bg-black/85 px-1 rounded-sm leading-none uppercase font-extrabold tracking-widest scale-90 origin-left">Bleed Area (+3mm)</span>
                    </div>

                    {/* Trim Line cutout Contour: solid cyan rectangle */}
                    <div className="absolute inset-1.5 border border-cyan-500 pointer-events-none flex items-end justify-start p-1 flex-wrap content-end">
                      <span className="text-[7.5px] font-mono text-cyan-300 bg-black/85 px-1 rounded-sm leading-none uppercase font-extrabold tracking-widest scale-90 origin-left">Trim Line (Finished Cut)</span>
                    </div>

                    {/* Safety Margin Contour: dashed emerald zone */}
                    <div className="absolute inset-3 border border-dashed border-emerald-500/90 pointer-events-none flex items-start justify-end p-1">
                      <span className="text-[7.5px] font-mono text-emerald-300 bg-black/85 px-1 rounded-sm leading-none uppercase font-extrabold tracking-widest scale-90 origin-right">Text Safe zone</span>
                    </div>
                  </div>
                </div>

                {/* Substrate Legend Specs details */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 space-y-1 mt-auto relative z-10">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase text-[#FF4D00] tracking-widest font-mono">
                    <span>BLEED SPECIFICATION METADATA</span>
                    <span className="text-emerald-400">STATUS: APPROVED FOR RUNS</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                    <div className="space-y-0.5 text-left">
                      <span className="text-[7.5px] font-mono text-zinc-400 font-extrabold uppercase block">• Outer Bleed</span>
                      <p className="text-[10px] text-zinc-200 font-bold font-mono">3.00 mm Standard</p>
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[7.5px] font-mono text-zinc-400 font-extrabold uppercase block">• Finished Cut Size</span>
                      <p className="text-[10px] text-zinc-200 font-bold font-mono">{selectedSize.name.split(' ')[0]}</p>
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[7.5px] font-mono text-zinc-400 font-extrabold uppercase block">• Safe Zone Inner</span>
                      <p className="text-[10px] text-zinc-200 font-bold font-mono">2.50 mm Inward</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] overflow-hidden border border-slate-800 shadow-lg aspect-4/3 relative bg-slate-900 group">
                {product.video ? (
                  <video 
                    src={product.video} 
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover grayscale-0 hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-cover grayscale-0 hover:scale-105 transition-all duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      console.warn(`[CustomizeModal Image Error] Broken URL fallback active: ${activeImage}`);
                      e.currentTarget.src = CATEGORY_DEFAULT_IMAGES[product.category] || CATEGORY_DEFAULT_IMAGES['Business Cards'];
                    }}
                  />
                )}
                {product.video && (
                  <span className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md text-white font-micro px-3 py-1.5 rounded-full shadow-sm z-10 pointer-events-none flex items-center gap-1">
                    ▶ MEDIA PLAYING
                  </span>
                )}
              </div>
            )}
            
            {/* Gallery Thumbnails List */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 mt-3 overflow-x-auto py-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImage(img);
                      setImgError(false);
                    }}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImage === img ? 'border-[#FF4D00]' : 'border-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`preview-${idx}`} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.src = CATEGORY_DEFAULT_IMAGES[product.category] || CATEGORY_DEFAULT_IMAGES['Business Cards'];
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
            
            {/* Share / QR Code Toggle Action */}
            <div className="mt-4 flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/10">
               <div>
                  <span className="font-micro text-blue-400">Share Product</span>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight mt-0.5">Generate direct QR code link</p>
               </div>
               <button
                 type="button"
                 onClick={() => setShowQr(!showQr)}
                 className="p-2.5 rounded-xl bg-white/10 hover:bg-[#FF4D00] text-white transition-colors border border-white/20"
               >
                 <Share2 className="w-4 h-4" />
               </button>
            </div>
            
            {showQr && (
              <div className="mt-4 bg-white rounded-3xl p-6 flex flex-col items-center justify-center border border-zinc-200">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-zinc-100">
                   <QRCodeSVG 
                     id="product-qr-code"
                     value={window.location.origin + '?product=' + product.id} 
                     size={160} 
                     level={"H"}
                     includeMargin={true}
                     fgColor="#0F172A"
                   />
                </div>
                <h4 className="text-sm font-heavy text-slate-900 uppercase mt-4">{product.name}</h4>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">SCAN TO VIEW COLLATERAL</p>
                <button
                  type="button"
                  onClick={() => {
                    const canvas = document.getElementById("product-qr-code") as any;
                    if (canvas && canvas.tagName === 'svg') {
                      const svgData = new XMLSerializer().serializeToString(canvas);
                      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `QR_${product.name.replace(/\s+/g, '_')}.svg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="mt-4 w-full py-2.5 bg-slate-900 text-white hover:bg-[#FF4D00] text-[10px] font-heavy tracking-wider uppercase rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Code
                </button>
              </div>
            )}
          </div>

          {/* Guidelines notes */}
          <div className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-2.5">
            <h4 className="text-xs font-black text-[#FF4D00] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
              PRESS BLUEPRINT RULES
            </h4>
            <ul className="text-[10px] text-zinc-300 space-y-1 font-bold uppercase tracking-wide">
              <li>• STRICTLY NO CASH ON DELIVERY (COD)</li>
              <li>• 100% SECURE UPFRONT PAYMENT RUNS</li>
              <li>• NO REFUNDS OR PRODUCT EXCHANGES</li>
            </ul>
          </div>
        </div>
        {/* Right Side Customization Configuration Form */}
        <div className="w-full md:w-7/12 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-full">
          <div className="p-6 md:p-8 space-y-6">
            
            <div className="hidden md:flex justify-between items-center pb-4 border-b border-gray-150">
              <h3 className="font-heavy text-lg uppercase tracking-tight text-[#0F172A]">
                {isReviewMode ? 'Order Summary Review' : 'Configure Print Order'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 px-3 text-gray-450 hover:text-[#FF4D00] hover:bg-zinc-100 rounded-xl transition text-[10px] uppercase font-bold"
              >
                Close (ESC)
              </button>
            </div>

            {!isReviewMode ? (
              <>
            {/* 1. Dimensions/Size Selector */}
            <div>
              <span className="font-micro text-gray-500 block mb-2.5">1. Choose Size Dimension</span>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz.name}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      selectedSize.name === sz.name
                        ? 'border-black bg-black text-white shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-55'
                    }`}
                  >
                    <p className="text-xs font-black uppercase leading-tight">{sz.name}</p>
                    <p className={`text-[9px] mt-1 font-bold ${selectedSize.name === sz.name ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {sz.priceMultiplier === 1.0 ? 'Base Price' : `x${sz.priceMultiplier} mult`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Paper/Material Selector */}
            <div>
              <span className="font-micro text-gray-500 block mb-2.5">2. Paper Type & Finishing</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {product.materials.map((mat) => (
                  <button
                    key={mat.name}
                    type="button"
                    onClick={() => setSelectedMaterial(mat)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      selectedMaterial.name === mat.name
                        ? "border-black bg-black text-white shadow"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-55"
                    }`}
                  >
                    <p className="text-xs font-black uppercase leading-tight">{mat.name}</p>
                    <p className={`text-[9px] mt-1 font-bold ${selectedMaterial.name === mat.name ? 'text-zinc-300' : 'text-zinc-505'}`}>
                      {mat.priceMultiplier === 1.0 ? 'Base Color' : `+${Math.round((mat.priceMultiplier - 1) * 100)}% Prem`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Printing Quantity volume config */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-micro text-gray-500 block">3. Set Printing Qty Slabs</span>
                {currentSlabInfo && (
                  <span className="text-[9px] font-bold bg-[#fff5f0] text-[#FF4D00] border border-[#FF4D00]/20 px-2.5 py-0.5 rounded-full uppercase">
                    UNIT PRICE: ₹{currentSlabInfo.unitPrice} / PC
                  </span>
                )}
              </div>

              {/* Slider / Preset Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3">
                {product.quantitySlabs.map((slab) => (
                  <button
                    key={slab.quantity}
                    type="button"
                    onClick={() => {
                       setQuantity(slab.quantity);
                       setCustomQtyInput(slab.quantity.toString());
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center transition font-mono text-xs font-bold ${
                      quantity === slab.quantity
                        ? 'bg-[#FF4D00]/10 border-[#FF4D00] text-[#FF4D00]'
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-250 text-zinc-700'
                    }`}
                  >
                    {slab.quantity} <span className="text-[9px] text-zinc-400 font-light">pcs</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-1.5 w-max">
                <button 
                  type="button"
                  onClick={() => handleQtyChange(Math.max(minQty, quantity - qtyStep).toString())}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 rounded-lg text-zinc-500 hover:text-black hover:border-black transition cursor-pointer font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min={minQty}
                  value={customQtyInput}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  className="w-16 text-center py-1 bg-transparent text-xs font-mono font-black focus:outline-hidden"
                />
                <button 
                  type="button"
                  onClick={() => handleQtyChange((quantity + qtyStep).toString())}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 rounded-lg text-zinc-500 hover:text-black hover:border-black transition cursor-pointer font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* 4. DESIGN FILE UPLOADER (PDF, PNG, JPG, AI formats up to 50MB) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-micro text-gray-500 block">4. Upload Print-Ready Design File</span>
                <span className="text-[10px] uppercase font-bold text-[#FF4D00] font-mono">Max: 50MB (.AI .PDF .PNG .JPG)</span>
              </div>

              {/* Drag Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[24px] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-[#FF4D00] bg-[#fff5f0]'
                    : designFile
                    ? 'border-emerald-500 bg-emerald-50/10'
                    : 'border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef as any}
                  onChange={handleFileSelect}
                  accept=".ai,.pdf,.png,.jpg,.jpeg"
                  multiple
                  className="hidden"
                />

                {uploadProgress !== null ? (
                  <div className="space-y-2 py-2">
                    <Loader2 className="w-8 h-8 text-[#FF4D00] animate-spin mx-auto" />
                    <p className="text-xs font-black text-zinc-700 font-mono text-center">PROCESSING FILES: {uploadProgress}%</p>
                    <div className="w-48 h-1.5 bg-zinc-100 rounded-full overflow-hidden mx-auto">
                      <div className="bg-[#FF4D00] h-full transition-all duration-155" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : designFile ? (
                  <div className="space-y-3.5 w-full text-left py-1">
                    {/* Primary File details */}
                    <div className="flex items-center gap-3 bg-zinc-50/50 p-2.5 rounded-2xl border border-zinc-150/60 w-full">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 shadow-3xs">
                        {designFile.fileData ? (
                          <img src={designFile.fileData} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <FileText className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-[11px] font-extrabold text-zinc-805 truncate font-mono uppercase tracking-wide">
                          PRIMARY: {designFile.name}
                        </p>
                        <p className="text-[9px] text-zinc-450 font-mono font-bold">
                          {(designFile.size / (1024 * 1024)).toFixed(2)} MB • MAIN ASSEMBLY FILE
                        </p>
                      </div>
                      <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-150 px-2.5 py-0.5 rounded-full uppercase shrink-0">
                        Primary OK
                      </span>
                    </div>

                    {/* Variations list */}
                    {designFile.variations && designFile.variations.length > 0 && (
                      <div className="space-y-2 pl-3 border-l-2 border-dashed border-[#FF4D00]/30 mt-2">
                        <p className="text-[9px] font-black text-[#FF4D00] tracking-widest uppercase font-mono mb-1.5 flex items-center gap-1">
                          <Layers className="w-3 h-3 animate-pulse" />
                          Design Variations Added ({designFile.variations.length})
                        </p>
                        <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {designFile.variations.map((v: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-zinc-150/80 shadow-3xs" onClick={(e) => e.stopPropagation()}>
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                {v.fileData ? (
                                  <img src={v.fileData} alt="" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  <FileText className="w-4 h-4 text-indigo-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-zinc-700 truncate font-mono">Var #{idx+1}: {v.name}</p>
                               <p className="text-[9px] text-zinc-400 font-mono uppercase font-semibold">{(v.size / (1024 * 1024)).toFixed(2)} MB • Batch asset</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 py-3">
                    <Upload className="w-8 h-8 text-zinc-450 mx-auto" />
                    <div>
                      <p className="text-xs font-heavy uppercase tracking-tight text-slate-800">Drag & drop design file here, or click to browse</p>
                      <p className="text-[10px] text-zinc-400 mt-1 uppercase">Please ensure bleed guidelines are followed for best print result</p>
                    </div>
                  </div>
                )}
              </div>

              {fileError && (
                <div className="mt-2.5 p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold uppercase flex items-center gap-1.5 leading-snug">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {!fileError && designFile && (
                <div className={`mt-4 p-4 rounded-[24px] border ${printWarnings.length > 0 ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'}`}>
                  <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 flex-wrap">
                      <Sparkles className={`w-3.5 h-3.5 ${printWarnings.length > 0 ? 'text-[#FF4D00]' : 'text-emerald-500'}`} />
                      AI Print Score
                    </h4>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 text-right w-24 leading-tight">Resolution & Safety Check</span>
                       <div className={`text-2xl font-black ${printWarnings.length > 0 ? 'text-[#FF4D00]' : 'text-emerald-500'}`}>{Math.max(10, 100 - (printWarnings.length * 15))}/100</div>
                    </div>
                  </div>
                  
                  {printWarnings.length > 0 ? (
                    <>
                      <ul className="space-y-2 mb-4">
                        {printWarnings.map((w, idx) => (
                          <li key={idx} className="text-[11px] font-semibold flex items-start gap-1.5 leading-tight">
                            <span className="text-[#FF4D00] mt-0.5">•</span> {w}
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          type="button" 
                          onClick={() => applyAITool('Upscale')} 
                          disabled={isEnhancing}
                          className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-100 transition disabled:opacity-50"
                        >
                          {isEnhancing && activeAITool === 'Upscale' ? '✨ Enhancing...' : 'AI Upscale Image'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => applyAITool('FixColors')} 
                          disabled={isEnhancing}
                          className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-100 transition disabled:opacity-50"
                        >
                          {isEnhancing && activeAITool === 'FixColors' ? '✨ Fixing Colors...' : 'AI Auto-Fix Colors'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => applyAITool('RemoveBG')} 
                          disabled={isEnhancing}
                          className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-100 transition disabled:opacity-50"
                        >
                          {isEnhancing && activeAITool === 'RemoveBG' ? '✨ Removing...' : 'AI Background Removal'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] font-semibold flex items-start gap-1.5 leading-tight text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      Design file is perfect for printing. High resolution, correct color profile, and safe margins detected.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4.5. PRE-PRESS INTERACTIVE CUSTOMIZER */}
            <ProductPersonalization 
              productName={product.name} 
              category={product.category} 
            />

            {/* 5. GEMINI AI PRINT SPECIALIST ASSISTANT */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 rounded-[32px] text-white border border-white/5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF4D00] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4D00] font-mono">Gemini Press Advisor</span>
                </div>
                <span className="text-[9px] uppercase font-bold text-neutral-400 font-mono">AI Creative Companion</span>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-neutral-300 leading-normal text-left">
                  Type a prompt to ask Gemini for advice on paper stocks, creative layouts, laminations, or print coating suggestions tailored specifically for this luxury catalog item!
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        generateAiSuggestions();
                      }
                    }}
                    placeholder="e.g. recommend a heavy paper stock and protective lamination for premium cards"
                    className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] transition-all"
                  />
                  <button
                    type="button"
                    onClick={generateAiSuggestions}
                    disabled={isGeneratingAi || !aiPrompt.trim()}
                    className="px-4.5 bg-[#FF4D00] hover:bg-[#FF4D00]/90 text-white font-heavy text-[11px] uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
                  >
                    {isGeneratingAi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Consult'
                    )}
                  </button>
                </div>
              </div>

              {aiResponse && (
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1 animate-fade-in text-left">
                  <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest font-mono">★ GEMINI RECOMMENDATION:</span>
                  <p className="text-xs text-neutral-200 leading-relaxed font-sans">{aiResponse}</p>
                </div>
              )}
            </div>
            </>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl flex items-start gap-2 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold mt-0.5">Please review your final print parameters before continuing to checkout. 100% Upfront payment is required.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 p-4 rounded-[20px] border border-zinc-200">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Size</p>
                    <p className="text-xs font-black uppercase text-slate-800 mt-1">{selectedSize.name}</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-[20px] border border-zinc-200">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Material</p>
                    <p className="text-xs font-black uppercase text-slate-800 mt-1">{selectedMaterial.name}</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-[20px] border border-zinc-200">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Quantity</p>
                    <p className="text-xs font-black uppercase text-slate-800 mt-1">{quantity} Units</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-[20px] border border-zinc-200">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Design File</p>
                    <p className="text-xs font-black uppercase text-slate-800 mt-1 truncate">{designFile?.name || 'Not provided'}</p>
                  </div>
                </div>

                <div className="rounded-[24px] overflow-hidden border border-slate-800 shadow-lg relative bg-slate-900 mt-4 md:hidden">
                  <img src={activeImage} alt="preview" className="w-full aspect-video object-cover" />
                </div>

                <div className="mt-4 bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex items-start gap-3 cursor-pointer" onClick={() => setIsProofApproved(!isProofApproved)}>
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${isProofApproved ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 bg-white'}`}>
                    {isProofApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase cursor-pointer select-none">
                      Digitally Approve Proof
                    </label>
                    <p className="text-[10px] text-zinc-500 mt-0.5">I verify that the uploaded design is final, layout is correct, and I approve it for final production print. No further modifications will be supported.</p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Pricing Calculation Sticky Widget and Checkout Action buttons */}
          <div className="bg-zinc-50 border-t border-gray-150 p-6 space-y-4">
            <div className="bg-white rounded-[28px] p-5 border border-gray-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              <div className="space-y-1">
                <span className="font-micro text-gray-400 block">Dynamic Valuation</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-heavy text-slate-900">₹{finalPrice.toLocaleString('en-IN')}</span>
                  <span className="text-xs font-mono font-bold text-zinc-400">({quantity} PCS)</span>
                </div>
                <div className="text-[10px] uppercase font-bold text-emerald-600 font-mono tracking-wider">
                  Est. ₹{(finalPrice / quantity).toFixed(2)} per unit
                </div>
              </div>

              {/* 100% Upfront Secure indicator */}
              <div className="bg-[#fff5f0] border border-[#FF4D00]/15 p-3.5 rounded-2xl flex-1 md:max-w-xs text-center space-y-0.5">
                <p className="text-[9px] text-[#FF4D00] font-black uppercase tracking-wider font-mono">SECURED TRANSACT PROTOCOL</p>
                <p className="text-[11px] text-zinc-700 font-extrabold uppercase leading-tight">100% Full Payment Upfront</p>
              </div>

            </div>

            {/* CTA action buttons */}
            <div className="flex items-center gap-3">
              {!isReviewMode ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/3 py-4 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-heavy uppercase tracking-wider rounded-2xl transition cursor-pointer"
                  >
                    Close Window
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!designFile) {
                        setFileError('⚠️ Design file is mandatory to request production print runs.');
                        return;
                      }
                      setIsReviewMode(true);
                    }}
                    className="w-2/3 py-4 rounded-2xl bg-black hover:bg-slate-800 text-white text-xs font-heavy uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    Review & Continue
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsReviewMode(false)}
                    className="w-1/3 py-4 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-heavy uppercase tracking-wider rounded-2xl transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={submitToCart}
                    className="w-2/3 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heavy uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    Add Custom Print to Cart
                  </button>
                </>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
