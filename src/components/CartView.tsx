/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, Trash2, FileCode, Landmark, ShieldCheck, ArrowRight, Wallet, CheckCircle2 } from 'lucide-react';
import { CartItem, PaymentDetails, Order } from '../types';
import CashfreeGateway from './CashfreeGateway';

interface CartViewProps {
  cartItems: CartItem[];
  customerName: string;
  customerEmail: string;
  onRemoveItem: (id: string) => void;
  onCheckoutSuccess: (placedOrder: Order) => void;
  onClearCart: () => void;
}

export default function CartView({
  cartItems,
  customerName,
  customerEmail,
  onRemoveItem,
  onCheckoutSuccess,
  onClearCart
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

  // OTP Verification State
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);

  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  
  const [shippingError, setShippingError] = useState('');

  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.itemTotal, 0);

  const requestOtp = async (type: 'mobile' | 'email', value: string) => {
    try {
      const res = await fetch('/api/seller/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, mobile: type === 'mobile' ? value : undefined, email: type === 'email' ? value : undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      if (type === 'mobile') setShowPhoneOtp(true);
      else setShowEmailOtp(true);
      
      setShippingError(''); // Clear error
    } catch (err: any) {
      setShippingError(err.message);
    }
  };

  const verifyOtp = async (type: 'mobile' | 'email', value: string, otp: string) => {
    try {
      const res = await fetch('/api/seller/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, mobile: type === 'mobile' ? value : undefined, email: type === 'email' ? value : undefined, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      if (type === 'mobile') {
        setIsPhoneVerified(true);
        setShowPhoneOtp(false);
      } else {
        setIsEmailVerified(true);
        setShowEmailOtp(false);
      }
      setShippingError('');
    } catch (err: any) {
      setShippingError(err.message);
    }
  };

  const validateCheckout = (): string | null => {
    // 1. Name Validation
    if (!checkoutName || checkoutName.length < 3 || checkoutName.length > 100) return 'Name must be between 3 and 100 characters.';
    if (!/^[A-Za-z\s\-']+$/.test(checkoutName)) return 'Name can only contain letters, spaces, hyphens, and apostrophes.';
    const badNames = ['aaa', 'test', 'admin', 'xyz', 'qwerty', '12345', 'asdf'];
    if (badNames.includes(checkoutName.toLowerCase().trim())) return 'Please enter your real full name.';

    // 2. Mobile Validation
    if (!/^[6-9]\d{9}$/.test(phone)) return 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    if (/^(\d)\1{9}$/.test(phone) || phone === '1234567890') return 'Invalid mobile number format.';
    if (!isPhoneVerified) return 'Mobile number must be verified with OTP before checkout.';

    // 3. Email Validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutEmail)) return 'Please enter a valid email address.';
    if (!isEmailVerified) return 'Email address must be verified with OTP before checkout.';

    // 4. Address Validation
    const fullAddress = `${addressLine1} ${addressLine2} ${city} ${state}`.trim();
    if (fullAddress.length < 15) return 'Address is too short. Minimum 15 characters required.';
    const badAddrs = ['ddd', 'test', 'abc', 'qwerty', '123', 'xxxx'];
    if (badAddrs.some(b => fullAddress.toLowerCase().includes(b))) return 'Please enter a real physical address.';

    // 5. Pincode Validation
    if (!/^\d{6}$/.test(pincode)) return 'Pincode must be exactly 6 digits.';

    // 6. Checkbox
    if (!isConfirmed) return 'You must confirm that all details are correct before proceeding.';

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
      totalAmount: cartSubtotal,
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

          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
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

                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-150 flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-[#FF4D00] shrink-0" />
                      <p className="text-[10px] text-zinc-500 truncate font-mono">FILE: {item.designFile.name}</p>
                    </div>
                    <span className="text-[9px] text-zinc-400 shrink-0 uppercase font-black font-mono">
                      {(item.designFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
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
              </div>
            ))}
          </div>
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
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={checkoutEmail}
                      onChange={(e) => { setCheckoutEmail(e.target.value); setIsEmailVerified(false); }}
                      disabled={isEmailVerified}
                      className={`w-full ${isEmailVerified ? 'bg-white/2 opacity-60' : 'bg-white/5'} border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent font-mono`}
                    />
                    {!isEmailVerified && checkoutEmail.includes('@') && (
                      <button type="button" onClick={() => requestOtp('email', checkoutEmail)} className="px-3 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase whitespace-nowrap transition-colors shadow-sm">
                        Verify
                      </button>
                    )}
                    {isEmailVerified && (
                      <div className="px-3 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase whitespace-nowrap shadow-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </div>
                    )}
                  </div>
                  {showEmailOtp && (
                    <div className="flex items-center gap-2 pl-2 border-l-2 border-[#FF4D00]">
                      <input
                        type="text"
                        placeholder="6-digit Email OTP"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 max-w-[150px] font-mono"
                      />
                      <button type="button" onClick={() => verifyOtp('email', checkoutEmail, emailOtp)} className="px-3 py-2 bg-[#FF4D00] hover:bg-[#E64500] text-white text-[10px] rounded-lg font-bold uppercase">
                        Confirm
                      </button>
                    </div>
                  )}
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
                    <input
                      type="text"
                      placeholder="Pincode *"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent font-mono"
                    />
                    <input
                      type="tel"
                      placeholder="Mobile No *"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setIsPhoneVerified(false); }}
                      maxLength={10}
                      disabled={isPhoneVerified}
                      className={`w-full ${isPhoneVerified ? 'bg-white/2 opacity-60' : 'bg-white/5'} border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#FF4D00] focus:border-transparent font-mono`}
                    />
                  </div>
                  
                  {!isPhoneVerified && phone.length === 10 && (
                    <button type="button" onClick={() => requestOtp('mobile', phone)} className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase whitespace-nowrap transition-colors shadow-sm mt-1">
                      Verify Mobile Number
                    </button>
                  )}
                  {isPhoneVerified && (
                    <div className="w-full py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase whitespace-nowrap shadow-sm flex items-center justify-center gap-1.5 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mobile Verified
                    </div>
                  )}

                  {showPhoneOtp && (
                    <div className="flex items-center gap-2 pl-2 border-l-2 border-[#FF4D00] mt-1">
                      <input
                        type="text"
                        placeholder="6-digit Mobile OTP"
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono"
                      />
                      <button type="button" onClick={() => verifyOtp('mobile', phone, phoneOtp)} className="px-4 py-2 bg-[#FF4D00] hover:bg-[#E64500] text-white text-[10px] rounded-lg font-bold uppercase whitespace-nowrap">
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
                
                {shippingError && (
                  <p className="text-rose-500 text-[10px] font-bold mt-2">{shippingError}</p>
                )}
              </div>
            </div>

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
              <span>Proceed to Pay ₹{cartSubtotal.toLocaleString('en-IN')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Cashfree Checkout Portal */}
      {showPayment && (
        <CashfreeGateway
          amount={cartSubtotal}
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
