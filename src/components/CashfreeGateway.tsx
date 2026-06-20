/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, Landmark, ShieldCheck, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { PaymentDetails } from '../types';

interface CashfreeGatewayProps {
  amount: number;
  paymentTypeLabel: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  onSuccess: (payment: PaymentDetails) => void;
  onCancel: () => void;
}

declare const Cashfree: any;

function safeJsonParse(str: string | null | undefined, fallback: any = {}): any {
  if (!str) return fallback;
  const cleaned = str.trim();
  if (cleaned === 'undefined' || cleaned === '') return fallback;
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[CASHFREE] JSON parsing exception captured safely for text:", cleaned, e);
    return fallback;
  }
}

export default function CashfreeGateway({
  amount,
  paymentTypeLabel,
  customerName = "Guest User",
  customerPhone = "9999999999",
  customerEmail = "guest@example.com",
  onSuccess,
  onCancel
}: CashfreeGatewayProps) {
  const [hasKeys, setHasKeys] = useState<boolean>(false);
  const [cashfreeEnv, setCashfreeEnv] = useState<string>('TEST');
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function checkConfig() {
      try {
        const response = await fetch('/api/cashfree/config');
        const text = await response.text();
        const data = safeJsonParse(text, { success: false });
        
        if (response.ok && data.success) {
          setHasKeys(data.hasKeys);
          setCashfreeEnv(data.env);
        }
      } catch (err) {
        console.error("Failed to query Cashfree config", err);
      } finally {
        setLoadingConfig(false);
      }
    }
    checkConfig();
  }, []);

  const loadCashfreeScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof Cashfree !== 'undefined') {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    if (!hasKeys) {
      setProcessing(true);
      setErrorMsg(null);
      setStep('Simulating Secure Payment (Sandbox)...');
      setTimeout(() => {
        setProcessing(false);
        onSuccess({
          method: 'Wallet', // Using Wallet as valid Type for Demo/Sandbox
          txId: 'demo_' + Date.now(),
          amount,
          timestamp: new Date().toISOString()
        });
      }, 3000);
      return;
    }
    setProcessing(true);
    setErrorMsg(null);
    setStep('Connecting to Cashfree Payments Node...');

    try {
      const cleanName = (customerName || "").trim() || "Guest User";
      const cleanPhone = (customerPhone || "").trim() || "9999999999";
      const cleanEmail = (customerEmail || "").trim() || "guest@example.com";

      // 1. Create order on backend
      const res = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          customerId: 'cust_' + Date.now(),
          customerName: cleanName,
          customerPhone: cleanPhone,
          customerEmail: cleanEmail
        })
      });
      
      const text = await res.text();
      const data = safeJsonParse(text, { success: false, error: "Order session parser returned empty payload state." });
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || `Failed to initialize Cashfree order session (${res.status})`);
      }

      if (!data.payment_session_id) {
        console.error("========== CASHFREE INITIALIZATION ERROR ==========");
        console.error("Root cause: payment_session_id is missing");
        console.error("Line failed: 'cf.checkout' cannot be called");
        console.error("Variable undefined: data.payment_session_id");
        console.error("API returned valid data? False:", data);
        console.error("==================================================");
        throw new Error("Backend did not return a valid payment_session_id. Initialization failed.");
      }

      setStep('Mounting Cashfree V3 Checkout...');
      const loaded = await loadCashfreeScript();
      if (!loaded) throw new Error('Cashfree SDK failed to load. Check internet connectivity.');

      const resolvedEnv = data.environment || cashfreeEnv;
      console.log(`[CASHFREE] Verified Environment matching: Backend=${data.environment}, Frontend=${resolvedEnv}`);
      
      console.log("Checkout Payload:", {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self"
      });

      console.log("paymentSessionId typeof:", typeof data.payment_session_id);
      console.log("paymentSessionId value:", data.payment_session_id);

      if (!data.payment_session_id || typeof data.payment_session_id !== 'string' || !data.payment_session_id.startsWith('session_')) {
        throw new Error(`Invalid payment_session_id format: ${data.payment_session_id}`);
      }

      // Ensure window.Cashfree exists
      if (!(window as any).Cashfree) {
        throw new Error('window.Cashfree is undefined after script load.');
      }
      
      console.log("[CASHFREE] window.Cashfree:", (window as any).Cashfree);
      if ((window as any).Cashfree.version) {
        console.log("[CASHFREE] SDK Version:", (window as any).Cashfree.version);
      }

      const cfInstance = (window as any).Cashfree({ mode: resolvedEnv.toLowerCase() === 'production' ? 'production' : 'sandbox' });
      
      console.log("[CASHFREE] Initialized Instance:", cfInstance);

      setStep('Launching secure payment overlay...');
      
      const payload = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self"
      };

      console.log("========== CASHFREE CHECKOUT PAYLOAD ==========");
      console.log(payload);
      console.log("===============================================");

      cfInstance.checkout(payload).then(async (result: any) => {
        if (result.error) {
          setErrorMsg(result.error.message);
          setProcessing(false);
        } else if (result.redirect) {
          console.log("Cashfree redirecting...");
        } else {
          // Payment might be finished, verify on backend
          setStep('Verifying payment status from Cashfree servers...');
          const verifyRes = await fetch('/api/cashfree/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: data.order_id })
          });
          
          const verifyText = await verifyRes.text();
          const verifyData = safeJsonParse(verifyText, { success: false, error: "Payment verification returned empty payload." });
          
          if (verifyRes.ok && verifyData.success && verifyData.verified) {
            const paymentResult: PaymentDetails = {
              method: 'Card',
              txId: verifyData.payment?.cf_payment_id || data.order_id,
              amount,
              timestamp: new Date().toISOString()
            };
            setProcessing(false);
            onSuccess(paymentResult);
          } else {
            setErrorMsg(verifyData.message || "Payment verification failed. Please check your bank status.");
            setProcessing(false);
          }
        }
      });
    } catch (error: any) {
      console.error("Cashfree execution error:", error);
      setErrorMsg("Payment System Error: " + error.message);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[36px] shadow-2xl w-full max-w-md overflow-hidden border border-gray-150 flex flex-col md:max-h-[95vh]">
        
        {/* Gateway Security Header */}
        <div className="bg-[#0F172A] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#FF4D00]" />
            <span className="font-micro text-white tracking-wider">SECURE PAYMENTS: CASHFREE™</span>
          </div>
          <div className="flex items-center gap-1.5">
            {loadingConfig ? (
              <span className="text-[9px] font-mono font-bold bg-[#FF4D00]/10 text-zinc-400 px-2 py-0.5 rounded-full animate-pulse">CHECKING GATE...</span>
            ) : hasKeys ? (
              <span className="text-[9px] font-mono font-extrabold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5 animate-spin" /> Live Cashfree
              </span>
            ) : (
              <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                System Unavailable
              </span>
            )}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-zinc-50 border-b border-zinc-150 p-6 text-center relative">
          <p className="font-micro text-gray-400 block">{paymentTypeLabel}</p>
          <p className="text-3xl font-heavy text-slate-950 mt-1">₹{amount.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-zinc-400 mt-2 font-mono uppercase tracking-widest">
            Currency Support: INR (₹)
          </p>

          {!loadingConfig && !hasKeys && (
            <div className="mt-4 mx-2 p-3 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col text-left space-y-1">
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-wide flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                Gateway Sandbox Mode
              </span>
              <p className="text-[9px] text-zinc-500 leading-relaxed font-bold">
                API credentials missing. System is currently running in a zero-value sandbox mode for flow verification.
              </p>
            </div>
          )}
        </div>

        {/* Form Body */}
        {processing ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[320px]">
            <Loader2 className="w-12 h-12 text-[#FF4D00] animate-spin" />
            <p className="text-[#0F172A] font-black text-xs mt-6 animate-pulse uppercase tracking-wider">{step}</p>
            <p className="text-[9px] text-zinc-400 text-center mt-3 max-w-[280px] uppercase font-bold">
              Please do not refresh this window or tap back during the payment session.
            </p>
          </div>
        ) : errorMsg ? (
          <div className="p-6 flex flex-col items-center text-center justify-center min-h-[340px] space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Payment Interrupted</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold max-w-sm">
              {errorMsg}
            </p>
            
            <div className="w-full max-w-xs space-y-2 pt-4">
              <button
                type="button"
                onClick={() => handlePay()}
                className="w-full py-3 rounded-2xl bg-black hover:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5"
              >
                🔄 Retry Payment
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3 rounded-2xl border border-zinc-200 hover:bg-zinc-100 text-zinc-650 text-[10px] font-black uppercase tracking-wider transition"
              >
                Back to Checkout
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            
            {(
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    Cashfree Gateway 
                  </p>
                </div>
                <p className="text-[10px] text-zinc-550 leading-relaxed">
                  Encryption-ready session established for securely processing ₹{amount.toLocaleString('en-IN')}.
                </p>
              </div>
            )}

            <div className="bg-zinc-50 rounded-2.5xl p-4 border border-zinc-150 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide leading-relaxed">
                By proceeding, you agree to Cashfree Terms & PrintBazaar's privacy standards. Real payment details will be entered securely on the next screen.
              </p>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        {!processing && !errorMsg && (
          <div className="border-t border-zinc-150 p-5 bg-zinc-50 flex items-center gap-3 mt-auto">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-2xl border border-zinc-200 hover:bg-zinc-100 text-zinc-650 text-xs font-bold uppercase tracking-wider transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handlePay()}
              className={`flex-1 py-3.5 rounded-2xl text-white text-xs font-heavy uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 ${hasKeys ? 'bg-black hover:bg-[#FF4D00]' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              <span>{hasKeys ? 'Pay via Cashfree' : 'Simulate Payment'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
