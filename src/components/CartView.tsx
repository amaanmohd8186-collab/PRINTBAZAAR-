/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Trash2, FileCode, Landmark, ShieldCheck, ArrowRight, Wallet, CheckCircle2, AlertTriangle, AlertCircle, Truck, Sparkles, Loader2 } from 'lucide-react';
import { CartItem, PaymentDetails, Order } from '../types';
import CashfreeGateway from './CashfreeGateway';

// Dynamic print validation audit rules
export function getItemValidationWarnings(item: CartItem): string[] {
  const warnings: string[] = [];
  
  // 1. Missing design file check
  if (!item.designFile || !item.designFile.name) {
    warnings.push("Missing technical print design: No active PDF, AI or PNG vector file is attached to this item.");
  }
  
  // 2. Specialty finish & Low quantity check
  const matName = (item.selectedMaterial?.name || '').toLowerCase();
  const qty = item.selectedQuantity;
  
  if ((matName.includes('premium') || matName.includes('velvet') || matName.includes('metallic') || matName.includes('textured') || matName.includes('gold')) && qty < 100) {
    warnings.push(`Specialty finish limit: '${item.selectedMaterial.name}' requires a minimum of 100 units due to custom offset block/plate calibration overheads.`);
  }
  
  // 3. Basic materials & High quantity check
  if ((matName.includes('regular') || matName.includes('standard') || matName.includes('basic') || matName.includes('eco')) && qty > 2000) {
    warnings.push(`Substrate advisory: Standard/eco paper substrates can curl under extreme continuous offset press run speeds (>2000 PCS). We recommend professional offset boards.`);
  }
  
  return warnings;
}

interface CartViewProps {
  cartItems: CartItem[];
  customerName: string;
  customerEmail: string;
  onRemoveItem: (id: string) => void;
  onCheckoutSuccess: (placedOrder: Order) => void;
  onClearCart: () => void;
  onBulkAddItems?: (items: CartItem[]) => void;
}

export default function CartView({
  cartItems,
  customerName,
  customerEmail,
  onRemoveItem,
  onCheckoutSuccess,
  onClearCart,
  onBulkAddItems
}: CartViewProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Order Details State
  const [checkoutName, setCheckoutName] = useState(customerName || '');
  const [checkoutEmail, setCheckoutEmail] = useState(customerEmail || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isWarningsAcknowledged, setIsWarningsAcknowledged] = useState(false);

  const [shippingError, setShippingError] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  // Dynamic Shipping weight estimation based on actual product category units
  const getProductItemWeightInKg = (category: string, quantity: number): number => {
    const norm = (category || '').toLowerCase();
    let weightPerUnitGrams = 10;
    if (norm.includes('card') || norm.includes('visiting')) {
      weightPerUnitGrams = 3;
    } else if (norm.includes('brochure') || norm.includes('flyer') || norm.includes('leaflet') || norm.includes('pamphlet')) {
      weightPerUnitGrams = 8;
    } else if (norm.includes('banner') || norm.includes('flex') || norm.includes('standee') || norm.includes('hoarding')) {
      weightPerUnitGrams = 1200;
    } else if (norm.includes('sticker') || norm.includes('label')) {
      weightPerUnitGrams = 1.5;
    } else if (norm.includes('box') || norm.includes('packaging') || norm.includes('carton')) {
      weightPerUnitGrams = 20;
    } else if (norm.includes('notebook') || norm.includes('diary') || norm.includes('book')) {
      weightPerUnitGrams = 180;
    } else if (norm.includes('letterhead') || norm.includes('envelope')) {
      weightPerUnitGrams = 6;
    } else if (norm.includes('poster') || norm.includes('sheet')) {
      weightPerUnitGrams = 30;
    }
    return (weightPerUnitGrams * quantity) / 1000;
  };

  const totalCartWeightKg = cartItems.reduce((acc, item) => {
    return acc + getProductItemWeightInKg(item.productCategory, item.selectedQuantity);
  }, 0);

  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingLogisticsMsg, setShippingLogisticsMsg] = useState('');
  const [logisticsZone, setLogisticsZone] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);

  // Auto-calculated carrier lookups when 6-digit pincode is entered
  useEffect(() => {
    if (pincode.length === 6) {
      setIsCalculatingShipping(true);
      setShippingLogisticsMsg('Connecting to BlueDart & Delhivery dispatch grid...');
      
      const timer = setTimeout(() => {
        setIsCalculatingShipping(false);
        const firstDigit = pincode[0];
        let zone = 'Zone C - South India Logistics Hub';
        let distance = 650;
        
        switch (firstDigit) {
          case '1':
          case '2':
            zone = 'Zone A - North India Hub (Delhi NCR Direct)';
            distance = 280;
            break;
          case '3':
          case '4':
            zone = 'Zone B - West India Hub (Mumbai/Maharashtra)';
            distance = 820;
            break;
          case '5':
          case '6':
            zone = 'Zone C - South India Hub (Karnataka/Tamil Nadu)';
            distance = 740;
            break;
          case '7':
          case '8':
            zone = 'Zone D - East India Hub (Kolkata/West Bengal)';
            distance = 1150;
            break;
          case '9':
            zone = 'Zone E - Central & Northeast India Logistics Range';
            distance = 1580;
            break;
        }

        setLogisticsZone(zone);
        setEstimatedDistance(distance);
        setShippingLogisticsMsg(`Linked successfully! Carrier Route: NCR Production ➜ ${zone}. Approx Distance: ${distance} km.`);
      }, 950);

      return () => clearTimeout(timer);
    } else {
      setShippingLogisticsMsg('');
      setLogisticsZone('');
      setEstimatedDistance(0);
    }
  }, [pincode]);

  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.itemTotal, 0);
  
  // Custom live formulas integrating distance, total weight, and carrier options
  const distanceMultiplier = estimatedDistance ? (estimatedDistance / 350) : 1;
  const standardPincodeBaseRate = Math.round(95 + (totalCartWeightKg * 45 * distanceMultiplier));
  const expressPincodeBaseRate = Math.round(290 + (totalCartWeightKg * 95 * distanceMultiplier));

  // Maintain previous free premium logic over ₹5000 subtotal for standard courier dispatch
  const isFreeStandard = cartSubtotal >= 5000;
  
  const shippingCharge = pincode.length === 6
    ? (shippingMethod === 'standard'
        ? (isFreeStandard ? 0 : standardPincodeBaseRate)
        : expressPincodeBaseRate)
    : (shippingMethod === 'standard'
        ? (isFreeStandard ? 0 : 150)
        : 450);

  const grandTotal = cartSubtotal + shippingCharge;

  const validateCheckout = (): string | null => {
    // 1. Name Validation
    if (!checkoutName || checkoutName.length < 3 || checkoutName.length > 100) return 'Name must be between 3 and 100 characters.';
    if (!/^[A-Za-z\s\-']+$/.test(checkoutName)) return 'Name can only contain letters, spaces, hyphens, and apostrophes.';
    const badNames = ['aaa', 'test', 'admin', 'xyz', 'qwerty', '12345', 'asdf'];
    if (badNames.includes(checkoutName.toLowerCase().trim())) return 'Please enter your real full name.';

    // 2. Mobile Validation
    if (!/^[6-9]\d{9}$/.test(phone)) return 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    if (/^(\d)\1{9}$/.test(phone) || phone === '1234567890') return 'Invalid mobile number format.';
    // Mobile verification no longer required:
    // if (!isPhoneVerified) return 'Mobile number must be verified before checkout.';

    // 3. Email Validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutEmail)) return 'Please enter a valid email address.';

    // 4. Address Validation
    const fullAddress = `${addressLine1} ${addressLine2} ${city} ${state}`.trim();
    if (fullAddress.length < 15) return 'Address is too short. Minimum 15 characters required.';
    const badAddrs = ['ddd', 'test', 'abc', 'qwerty', '123', 'xxxx'];
    if (badAddrs.some(b => fullAddress.toLowerCase().includes(b))) return 'Please enter a real physical address.';

    // 5. Pincode Validation
    if (!/^\d{6}$/.test(pincode)) return 'Pincode must be exactly 6 digits.';

    // 6. Checkbox
    if (!isConfirmed) return 'You must confirm that all details are correct before proceeding.';

    // 7. Dynamic Technical print warning check
    const allWarnings: string[] = [];
    cartItems.forEach(item => {
      allWarnings.push(...getItemValidationWarnings(item));
    });
    if (allWarnings.length > 0 && !isWarningsAcknowledged) {
      return 'Please review and acknowledge the Technical Print Advisory Alert warning in the sidebar before payment.';
    }

    return null;
  };

  const handleProceedToPay = () => {
    const errorMsg = validateCheckout();
    if (errorMsg) {
      setShippingError(errorMsg);
      return;
    }
    setShippingError('');
    setShowPayment(true);
  };

  const handleCheckoutComplete = (payment: PaymentDetails) => {
    setShowPayment(false);

    // Build the order structure
    const newOrderId = 'PB-ORD-' + Math.floor(100000 + Math.random() * 900000);
    const placedOrder: Order = {
      id: newOrderId,
      customerId: 'cust-current', // current active custom session
      customerName: checkoutName.trim(),
      customerEmail: checkoutEmail.trim(),
      shippingAddress: {
        id: 'addr-order-' + Date.now(),
        label: 'Order Address',
        name: checkoutName.trim(),
        phone: phone.trim(),
        pincode: pincode.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        isDefault: false
      },
      items: [...cartItems],
      totalAmount: grandTotal,
      shippingCharge: shippingCharge,
      advancePaid: true,
      balancePaid: true,
      payments: [payment],
      status: 'Order Received',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onCheckoutSuccess(placedOrder);
    onClearCart();
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[40px] border border-gray-200/60 shadow-sm max-w-lg mx-auto my-10">
        <div className="w-20 h-20 rounded-[28px] bg-zinc-100 flex items-center justify-center mb-6 border border-zinc-200">
          <ShoppingBag className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="font-heavy text-2xl uppercase tracking-tight text-[#0F172A]">Your Cart is Empty</h3>
        <p className="text-gray-500 text-xs mt-3 leading-relaxed max-w-xs font-normal">
          BROWSE OUR CUSTOM PRINT CATALOG, SELECT DIMENSIONS, SPECIFY CARD FINISHES, UPLOAD YOUR PRINT DESIGN VECTOR & INSTANTLY INITIATE COLLATERAL PRODUCTION ROUTINES!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 px-2">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cart items list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center bg-[#0F172A] text-white rounded-[24px] p-5 border border-slate-800">
            <span className="font-micro text-[#FF4D00]">Cart Print Items</span>
            <span className="text-xs font-mono bg-white/10 px-4 py-1.5 rounded-xl font-heavy uppercase">
              {cartItems.length} {cartItems.length === 1 ? 'Design' : 'Designs'}
            </span>
          </div>

          <motion.div layout className="space-y-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="bg-white rounded-[32px] p-5 border border-gray-200/60 shadow-sm hover:shadow-md transition-all flex items-start gap-4"
                >
                  {/* Visual product photograph thumbnail preview */}
                  <div className="w-16 h-16 rounded-[20px] overflow-hidden bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 relative shadow-2xs">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <FileCode className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-heavy text-slate-900 truncate uppercase tracking-tight">{item.productName}</h4>
                      <span className="text-sm font-mono font-heavy text-slate-900">₹{item.itemTotal.toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <span>Size: <strong className="text-zinc-950 font-heavy">{item.selectedSize.name}</strong></span>
                      <span>•</span>
                      <span>Finish: <strong className="text-zinc-950 font-heavy">{item.selectedMaterial.name}</strong></span>
                      <span>•</span>
                      <span>Qty: <strong className="text-[#FF4D00] font-mono">{item.selectedQuantity} PCS</strong></span>
                    </div>

                    {item.designFile && item.designFile.name ? (
                      <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-150 flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-[#FF4D00] shrink-0" />
                          <p className="text-[10px] text-zinc-500 truncate font-mono">FILE: {item.designFile.name}</p>
                        </div>
                        <span className="text-[9px] text-zinc-400 shrink-0 uppercase font-black font-mono">
                          {item.designFile.size ? `${(item.designFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Vector'}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 flex items-center gap-1.5 mt-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <p className="text-[10px] text-rose-700 font-bold uppercase tracking-tight truncate font-sans">No print-ready design file attached</p>
                      </div>
                    )}

                    {/* Pre-checkout validation warnings display block */}
                    {(() => {
                      const warnings = getItemValidationWarnings(item);
                      if (warnings.length === 0) return null;
                      return (
                        <div className="mt-2.5 p-3 rounded-2xl bg-[#fff5f0] border border-[#FF4D00]/15 space-y-1 text-left">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-[#FF4D00] uppercase tracking-wider font-mono">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Technical Print Advisory Warning</span>
                          </div>
                          {warnings.map((w, idx) => (
                            <p key={idx} className="text-[10px] text-zinc-700 font-bold leading-normal">
                              • {w}
                            </p>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Bulk File Upload */}
                    <div className="mt-3 text-left">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                        <FileCode className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Add Bulk Files for this Config</span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (!e.target.files?.length || !onBulkAddItems) return;
                            const newItems: CartItem[] = [];
                            Array.from(e.target.files).forEach((file: File) => {
                              newItems.push({
                                ...item,
                                id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                designFile: {
                                  name: file.name,
                                  size: file.size,
                                  type: file.type,
                                }
                              });
                            });
                            onBulkAddItems(newItems);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition shrink-0 self-start"
                    title="Remove from checkout"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Checkout Summary panel */}
        <div className="lg:col-span-5 bg-[#0F172A] rounded-[48px] p-8 text-white flex flex-col relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 p-6">
            <div className="w-14 h-14 border border-white/5 rounded-full flex items-center justify-center font-heavy text-[8px] text-[#FF4D00] rotate-12">
               PRINT<br/>CERT
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <p className="font-micro text-blue-400">Checkout: Phase 01</p>
            <h3 className="text-3xl font-heavy leading-none tracking-tight uppercase">
              SECURED TERMS <br/><span className="text-[#FF4D00]">100% UPFRONT</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="font-heavy text-[11px] uppercase tracking-wider">Dynamic Printing Estimate</span>
                <span className="font-mono font-bold text-white">₹{cartSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-300 pb-3 border-b border-white/10">
                <span className="font-heavy text-[11px] uppercase tracking-wider">PRE-FLIGHT SHIPPING</span>
                <span className="font-mono text-[#FF4D00] font-black uppercase tracking-widest text-[9px] italic">FREE COURIER</span>
              </div>

              {/* 100% Upfront secured payment info banners */}
              <div className="space-y-2 pt-1">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex justify-between items-center">
                  <div>
                    <span className="font-micro text-blue-400">100% SECURE INVOICE TOTAL</span>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight mt-0.5">Pay Online to Launch Offset Production</p>
                  </div>
                  <span className="text-sm font-mono font-black text-[#FF4D00]">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
              <span className="text-xs font-heavy uppercase tracking-wider text-slate-400">Total Order Valuation</span>
              <span className="text-2xl font-heavy text-[#FF4D00]">₹{cartSubtotal.toLocaleString('en-IN')}</span>
            </div>

            {/* Order Notes (Bleed & Special Print Instructions) */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="notes-field" className="block text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Order Notes (Special Print / Bleed / Layout Instructions)
              </label>
              <textarea
                id="notes-field"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include custom bleed setups, paper laminations, custom cuts, or specific color matching requests..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent resize-none font-mono"
              />
            </div>

            {/* Customer Contact Info */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Contact Details
              </label>
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="Full Legal Name *"
                  value={checkoutName}
                  onChange={(e) => setCheckoutName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent font-mono"
                />
                
                <div>
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Shipping Details
              </label>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Address Line 1 *"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent font-mono"
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City *"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent font-mono"
                  />
                  <input
                    type="text"
                    placeholder="State *"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Pincode *"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent font-mono"
                      />
                      {isCalculatingShipping && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-3.5 h-3.5 text-[#FF4D00] animate-spin" />
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      placeholder="Mobile No *"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent font-mono"
                    />
                  </div>

                  {/* Dynamic Weight Badge & Routing handshake feedback */}
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1.5 text-left mt-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-black text-zinc-450 uppercase tracking-widest flex items-center gap-1">
                        <Truck className="w-3 h-3 text-[#FF4D00]" />
                        Parcel Net Weight:
                      </span>
                      <span className="text-[10px] font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded-md">
                        {totalCartWeightKg.toFixed(2)} KG
                      </span>
                    </div>

                    {shippingLogisticsMsg ? (
                      <p className="text-[9.5px] font-extrabold text-amber-500 uppercase font-mono tracking-wide leading-relaxed animate-pulse">
                        {shippingLogisticsMsg}
                      </p>
                    ) : (
                      <p className="text-[9px] text-zinc-550 leading-relaxed uppercase font-mono font-semibold">
                        Enter 6-digit Pincode to evaluate live cargo distance & route tariffs.
                      </p>
                    )}

                    {logisticsZone && (
                      <div className="text-[9px] text-emerald-400 font-bold uppercase font-mono mt-1 flex items-center gap-1 bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 bg-emerald-405 rounded-full animate-ping shrink-0" />
                        CARRIER ZONE: {logisticsZone}
                      </div>
                    )}
                  </div>
                </div>
                
                {shippingError && (
                  <p className="text-rose-500 text-[10px] font-bold mt-2">{shippingError}</p>
                )}
              </div>
            </div>

            {/* Interactive Shipping Method Selector and Pricing Breakdown */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Choose Delivery Speed
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShippingMethod('standard')}
                  className={`p-3.5 rounded-2xl border text-left transition duration-150 flex flex-col justify-between cursor-pointer select-none ${
                    shippingMethod === 'standard'
                      ? 'border-[#FF4D00] bg-[#FF4D00]/5 text-white'
                      : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-mono font-black ${shippingMethod === 'standard' ? 'text-[#FF4D00]' : 'text-zinc-450'} uppercase`}>Standard Courier</span>
                    <Truck className="w-3.5 h-3.5 text-[#FF4D00]" />
                  </div>
                  <div className="mt-2">
                    <p className="text-[11px] font-bold text-zinc-200">3-5 Business Days</p>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      {isFreeStandard ? 'FREE Shipping' : '₹150 Flat Rate'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShippingMethod('express')}
                  className={`p-3.5 rounded-2xl border text-left transition duration-150 flex flex-col justify-between cursor-pointer select-none ${
                    shippingMethod === 'express'
                      ? 'border-[#FF4D00] bg-[#FF4D00]/5 text-white'
                      : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-mono font-black ${shippingMethod === 'express' ? 'text-[#FF4D00]' : 'text-zinc-455'} uppercase`}>Express Delivery</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="mt-2">
                    <p className="text-[11px] font-bold text-zinc-200">1-2 Days Priority</p>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">₹450 Air Cargo</p>
                  </div>
                </button>
              </div>

              {/* Price Breakdown Ledger */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 mt-4 text-left">
                <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                  <span>Cart Items Subtotal</span>
                  <span className="font-mono text-zinc-200">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                  <span>Courier Delivery Charges</span>
                  <span className="font-mono text-zinc-250 font-bold">
                    {shippingMethod === 'standard' && isFreeStandard ? (
                      <span className="text-emerald-400 font-extrabold uppercase">FREE SHIPPING</span>
                    ) : (
                      `₹${shippingCharge}`
                    )}
                  </span>
                </div>
                
                {shippingMethod === 'standard' && !isFreeStandard && (
                  <div className="text-[9.5px] text-zinc-400 leading-normal font-semibold">
                    💡 Spend <strong className="text-white">₹{(5000 - cartSubtotal).toLocaleString('en-IN')}</strong> extra to unlock <strong className="text-emerald-400 uppercase">FREE STANDARD SHIPPING</strong>!
                  </div>
                )}

                <div className="pt-2.5 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-mono font-black text-zinc-450 block uppercase tracking-wider">Estimated Invoice Total</span>
                    <span className="text-xs text-[#FF4D00] font-black uppercase tracking-widest font-mono">100% Upfront</span>
                  </div>
                  <span className="text-lg font-black font-mono text-white">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Dynamic pre-checkout validation warnings panel in sidebar */}
            {(() => {
              const allWarnings: string[] = [];
              cartItems.forEach(item => {
                allWarnings.push(...getItemValidationWarnings(item));
              });
              if (allWarnings.length === 0) return null;
              
              return (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-3xl space-y-3 text-left">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 uppercase tracking-widest font-mono">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>TECHNICAL PRE-CHECKOUT ALERT</span>
                  </div>
                  <div className="space-y-1">
                    {allWarnings.map((w, idx) => (
                      <p key={idx} className="text-[10px] text-zinc-200 font-semibold leading-relaxed">
                        • {w}
                      </p>
                    ))}
                  </div>
                  <div 
                    onClick={() => setIsWarningsAcknowledged(!isWarningsAcknowledged)}
                    className="flex items-center gap-2 pt-2 border-t border-white/10 cursor-pointer select-none"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isWarningsAcknowledged ? 'bg-amber-500 border-amber-500' : 'border-slate-500'}`}>
                      {isWarningsAcknowledged && <ShieldCheck className="w-3 h-3 text-black" />}
                    </div>
                    <span className="text-[9px] text-amber-500 font-black uppercase tracking-wider font-mono">
                      I ACKNOWLEDGE & BYPASS DESIGN WARNINGS
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Secure guidelines list */}
            <div className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-1.5 flex items-start gap-3 cursor-pointer" onClick={() => setIsConfirmed(!isConfirmed)}>
              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isConfirmed ? 'bg-[#FF4D00] border-[#FF4D00]' : 'border-slate-500'}`}>
                 {isConfirmed && <ShieldCheck className="w-3 h-3 text-white" />}
              </div>
              <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-wide leading-relaxed">
                I CONFIRM THAT ALL CONTACT DETAILS AND SHIPPING ADDRESS INFORMATION ENTERED ABOVE ARE 100% CORRECT. I UNDERSTAND THAT FALSE INFORMATION MAY RESULT IN ORDER CANCELLATION.
              </p>
            </div>

            {/* Checkout triggers */}
            <button
              type="button"
              onClick={handleProceedToPay}
              className="w-full py-4.5 bg-white text-black hover:bg-[#FF4D00] hover:text-white rounded-[20px] font-heavy text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl text-center"
            >
              <span>Proceed to Pay ₹{grandTotal.toLocaleString('en-IN')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Cashfree Checkout Portal */}
      {showPayment && (
        <CashfreeGateway
          amount={grandTotal}
          paymentTypeLabel="100% Upfront Invoice Payment"
          customerName={checkoutName}
          customerEmail={checkoutEmail}
          customerPhone={phone}
          onSuccess={handleCheckoutComplete}
          onCancel={() => setShowPayment(false)}
        />
      )}

    </div>
  );
}
