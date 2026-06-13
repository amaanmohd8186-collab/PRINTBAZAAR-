import React from 'react';
import { ShieldCheck, Eye, Lock, HardDrive, Cpu, ArrowLeft, Printer } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="space-y-6 animate-fadeIn text-left max-w-4xl mx-auto py-4">
      {/* Return Navigation */}
      <button 
        id="privacy-back-btn"
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
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 id="privacy-main-title" className="text-xl md:text-2xl font-heavy text-slate-900 uppercase tracking-tight">Privacy Policy</h3>
              <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase mt-0.5">Regulatory Compliance Document</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-zinc-700 leading-relaxed font-sans text-sm">
          
          <div className="md:col-span-2 space-y-8">
            {/* Section 1 */}
            <div className="space-y-3">
              <h4 className="text-base font-heavy text-slate-900 uppercase tracking-tight">
                1. Information We Collect
              </h4>
              <p>
                At PRINTBAZAAR Press, your data protection is our highest operational priority. When you utilize our platform to customize and coordinate high-volume print blueprints, we acquire specific categories of user information:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>
                  <strong>Identity and Contact Data:</strong> Name, professional company email address, custom shipping locations, and phone numbers required for high-priority logistics.
                </li>
                <li>
                  <strong>Industrial Design Assets:</strong> Custom typography vectors, color models, corporate logos, and image files explicitly uploaded to the AI Studio Workspace.
                </li>
                <li>
                  <strong>Financial Transaction Markers:</strong> Secure billing logs, wallet balance thresholds, and digital authorization flags. We do not store absolute debit or credit card credentials on our hardware.
                </li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h4 className="text-base font-heavy text-slate-900 uppercase tracking-tight">
                2. Data Processing & Usage Rules
              </h4>
              <p>
                Your private profile details are rigorously handled in order to sustain high performance:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>
                  To execute instant pre-press preflight audits and align color channels.
                </li>
                <li>
                  To deliver real-time order tracking stage updates (e.g., plate building, active ink-pressing, dispatch).
                </li>
                <li>
                  To secure local workspace autosaves to LocalStorage ("Vault state saving") to prevent work disruptions.
                </li>
                <li>
                  For billing validation, balance ledger updates, and transactional security audits.
                </li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h4 className="text-base font-heavy text-slate-900 uppercase tracking-tight">
                3. High-Security Measures
              </h4>
              <p>
                We execute robust protective controls to satisfy global data regulatory standards:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>
                  <strong>Data Isolation:</strong> Artwork and blueprints uploaded are isolated via randomized canvas keys, avoiding exposure across other users' projects.
                </li>
                <li>
                  <strong>Encrypted Pipelines:</strong> Transmission is fully packed over standard SSL/TLS tunnels during preflight pre-press transmissions.
                </li>
                <li>
                  <strong>Firebase Storage Compliance:</strong> Database state layers are integrated safely behind validated security regulations, restricted to logged-in user identifiers.
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h4 className="text-base font-heavy text-slate-900 uppercase tracking-tight">
                4. Third-Party Sharing Restrictions
              </h4>
              <p>
                We **never** sell, rent, or distribute your customized catalogs, brand assets, or emails to private advertisement brokerages. We only permit data transit to:
              </p>
              <p className="text-xs">
                - Accredited sovereign industrial offset mills executing your layout jobs.<br />
                - Global freight transport couriers completing physical delivery shipments.
              </p>
            </div>
          </div>

          {/* Quick Summary Sidebar Panels */}
          <div className="space-y-6">
            <div className="p-5 bg-zinc-50 border border-zinc-150 rounded-2xl space-y-4">
              <h5 className="font-heavy text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-650" />
                Transparency Promise
              </h5>
              <p className="text-[11.5px] leading-relaxed text-zinc-500">
                You retain ultimate ownership of every pixel you upload to PRINTBAZAAR. We hold NO claim or licensing holds over user concepts generated inside our AI tools.
              </p>
            </div>

            <div className="p-5 bg-[#ffe4d6] border border-[#FF4D00]/10 rounded-2xl space-y-4">
              <h5 className="font-heavy text-[#FF4D00] uppercase text-xs tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#FF4D00]" />
                Compliance Safe
              </h5>
              <p className="text-[11.5px] leading-relaxed text-neutral-800">
                Meets global industrial file retention requirements. Inactive design assets on the pre-press server queue are auto-pruned after 60 days of inactivity.
              </p>
            </div>

            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4">
              <h5 className="font-heavy text-indigo-805 uppercase text-xs tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                Your Rights
              </h5>
              <p className="text-[11.5px] leading-relaxed text-indigo-950">
                Right to erase. You can request a complete data purge of all historic designs from our pipeline by emailing our help channel.
              </p>
            </div>
          </div>

        </div>

        {/* Closing Contact Banner */}
        <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-zinc-400 shrink-0" />
            <p className="text-xs text-zinc-500 font-semibold uppercase font-mono">Questions on compliance pipelines?</p>
          </div>
          <a 
            href="mailto:privacy@printbazaar.com" 
            className="text-xs font-black text-indigo-650 hover:underline uppercase tracking-wider"
          >
            privacy@printbazaar.com
          </a>
        </div>

      </div>
    </div>
  );
}
