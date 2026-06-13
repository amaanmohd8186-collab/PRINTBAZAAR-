import React from 'react';
import { FileText, Shield, Scale, AlertOctagon, HelpCircle, ArrowLeft, Printer } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <div className="space-y-6 animate-fadeIn text-left max-w-4xl mx-auto py-4">
      {/* Return Navigation */}
      <button 
        id="tos-back-btn"
        onClick={onBack} 
        className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Shop</span>
      </button>

      {/* Main Container */}
      <div className="bg-white rounded-[32px] border border-zinc-200/80 p-6 md:p-8 shadow-sm space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#FF4D00]/10 text-[#FF4D00] rounded-2xl border border-[#FF4D00]/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 id="tos-main-title" className="text-xl md:text-2xl font-heavy text-slate-900 uppercase tracking-tight">Terms of Service</h3>
              <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase mt-0.5">Last Updated: June 12, 2026</p>
            </div>
          </div>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 px-4 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-slate-900 border border-zinc-200 rounded-xl text-xs font-heavy uppercase tracking-widest transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Copy</span>
          </button>
        </div>

        {/* Content Blocks */}
        <div className="space-y-8 text-zinc-700 leading-relaxed font-sans text-sm">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h4 className="text-base font-heavy text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="text-xs font-mono font-black px-2 py-0.5 bg-zinc-100 text-[#FF4D00] rounded">01</span>
              User Agreement & Acceptance
            </h4>
            <p>
              Welcome to the PRINTBAZAAR Press platform. This User Agreement ("Agreement") constitutes a legally binding contract between you ("User", "you", or "your") and PRINTBAZAAR Press Ltd. ("PRINTBAZAAR", "we", "us", or "our"). By accessing, registering for, or using our online marketplace, services, and digital editing tools, you agree to be bound by these Terms.
            </p>
            <p>
              If you do not agree with any part of these Terms, you are strictly prohibited from using our services and must immediately cease access to the platform.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h4 className="text-base font-heavy text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="text-xs font-mono font-black px-2 py-0.5 bg-zinc-100 text-[#FF4D00] rounded">02</span>
              Industrial Printing Marketplace Code of Conduct
            </h4>
            <p>
              Our marketplace operates as a high-volume professional digital and offset pre-press production network. By publishing products, customization configurations, or uploading graphics, you warrant and pledge that:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-650">
              <li>
                <strong>Ownership Rights:</strong> You own or hold the explicit commercial license for all images, typography vectors, logomarks, and artwork uploaded to the AI Studio or customization workspace.
              </li>
              <li>
                <strong>Compliance Safeguards:</strong> You will not submit designs containing copyright-infringing content, counterfeit packaging templates, or material violating sovereign financial security laws (e.g., currency template forging).
              </li>
              <li>
                <strong>Design Accuracy:</strong> All layouts submitted must conform to specified bleed boundaries (default 3mm outer threshold margins) and resolution constraints (minimum 300 DPI for standard production).
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h4 className="text-base font-heavy text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="text-xs font-mono font-black px-2 py-0.5 bg-zinc-100 text-[#FF4D00] rounded">03</span>
              Mandatory Payment Protocol (No-COD)
            </h4>
            <div className="p-4 bg-[#ffe4d6] border border-[#FF4D00]/20 rounded-2xl text-neutral-800 space-y-2">
              <p className="font-heavy uppercase text-xs tracking-wider text-[#FF4D00] flex items-center gap-1.5/5">
                <AlertOctagon className="w-4 h-4 text-[#FF4D00]" />
                STRICT 100% UPFRONT PAYMENT POLICY
              </p>
              <p className="text-xs leading-relaxed font-semibold">
                To guarantee high-intensity operations and minimize custom-cut paper waste (CMYK plates and custom offset configurations cannot be recovered once printed), PRINTBAZAAR operates under a strict **Zero Cash On Delivery (No-COD)** and **No-Returns / No-Refunds** policy on active machinery runs.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h4 className="text-base font-heavy text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="text-xs font-mono font-black px-2 py-0.5 bg-zinc-100 text-[#FF4D00] rounded">04</span>
              Limitation of Liability
            </h4>
            <p>
              To the maximum extent permitted by applicable law, in no event shall PRINTBAZAAR, its subsidiaries, directors, officers, or engineers be held liable for any indirect, incidental, punitive, or consequential damages. This includes but is not limited to: loss of revenue, print delays caused by raw material supply constraints, color shifts in CMYK space arising from device-rendering calibration mismatches, or shipping handling errors.
            </p>
            <p className="font-mono text-[11px] bg-zinc-50 border border-zinc-150 p-3 rounded-xl block text-zinc-500">
              OUR MAXIMUM AGGREGATE LIABILITY ARISING OUT OF OR IN CONNECTION WITH THE SERVICES, REGARDLESS OF THE FORM OF CLAIM OR THEORY OF LIABILITY, SHALL BE STRICTLY LIMITED TO THE ACTUAL MONETARY AMOUNT RECEIVED BY PRINTBAZAAR FROM THE USER FOR THE APPLICABLE PRINT RUN ASSOCIATED WITH THE CLAIM.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h4 className="text-base font-heavy text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="text-xs font-mono font-black px-2 py-0.5 bg-zinc-100 text-[#FF4D00] rounded">05</span>
              Termination & Policy Revisions
            </h4>
            <p>
              We reserve the absolute right to suspend or terminate your account and blacklist your corporate IP from the offset network immediately if you breach any criteria defined in these terms. We may revise these terms at any time by updating this document online. Your continued use of the platform after any changes indicates your active consent.
            </p>
          </div>

        </div>

        {/* Support Section */}
        <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-zinc-400 shrink-0" />
            <p className="text-xs text-zinc-500 font-semibold uppercase font-mono">Need formal clarify on legal clauses?</p>
          </div>
          <a 
            href="mailto:compliance@printbazaar.com" 
            className="text-xs font-black text-[#FF4D00] hover:underline uppercase tracking-wider"
          >
            compliance@printbazaar.com
          </a>
        </div>

      </div>
    </div>
  );
}
