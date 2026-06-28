import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Eye, 
  Lock, 
  HardDrive, 
  Cpu, 
  ArrowLeft, 
  Printer, 
  Search, 
  BookOpen, 
  Info, 
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const sectionTitles = [
  "Introduction",
  "Definitions",
  "Scope",
  "Information Collection",
  "Account Data",
  "Seller Verification",
  "Design Data",
  "Uploaded Files",
  "Payment Processing",
  "Order Data",
  "Cookies",
  "Analytics",
  "Data Usage",
  "Legal Basis",
  "Data Sharing",
  "Third Party Services",
  "Firebase Usage",
  "Cloud Storage",
  "Security Controls",
  "Encryption",
  "Fraud Prevention",
  "Account Deactivation",
  "Account Deletion",
  "Data Portability",
  "Retention",
  "Children's Privacy",
  "International Transfers",
  "User Rights",
  "Marketing",
  "Notifications",
  "Verification Obligations",
  "Customer Obligations",
  "Wallet",
  "Credits",
  "Refund Records",
  "Dispute Resolution",
  "Compliance",
  "Support Response",
  "Activity Logs",
  "Backups",
  "Access Controls",
  "Authentication",
  "OTP",
  "Device Data",
  "Location",
  "Connectivity Logs",
  "Policy Changes",
  "Contact",
  "Grievance",
  "Conclusion",
  "Appendix A",
  "Appendix B",
  "Appendix C",
  "Appendix D",
  "Appendix E"
];

const generalBody = "PrintBazaar collects and processes information only for providing printing, design editing, verification, payments, fraud prevention, customer support, analytics, and legal compliance. Users retain rights over their content subject to platform terms. Appropriate security measures, including encryption, access controls, authentication, monitoring, backups, and activity logging, are applied where practical. Data deletion, download, correction, and account controls are available through Privacy & Security settings. Verification documents are processed for compliance. Generated content should be reviewed before use. Payment records may be retained where legally required.";

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'split' | 'continuous'>('split');

  // Build full sections list
  const sections = sectionTitles.map((title, index) => {
    let customContent = generalBody;
    
    // Add additional contextual regulatory helpers for critical compliance parts
    if (title === "Account Deactivation") {
      customContent = "PrintBazaar collects and processes information only for providing printing, design editing, verification, payments, fraud prevention, customer support, analytics, and legal compliance. Users retain rights over their content subject to platform terms. Appropriate security measures, including encryption, access controls, authentication, monitoring, backups, and activity logging, are applied where practical. Data deactivation is available through the Privacy & Security panel under Profile Settings: deactivating temporarily disables listings, pauses alerts, and holds balances, allowing instant reactivation upon next sign-in.";
    } else if (title === "Account Deletion") {
      customContent = "PrintBazaar collects and processes information only for providing printing, design editing, verification, payments, fraud prevention, customer support, analytics, and legal compliance. Users retain rights over their content subject to platform terms. Appropriate security measures, including encryption, access controls, authentication, monitoring, backups, and activity logging, are applied where practical. Data deletion triggers a 30-Day countdown grace period. Users logging back within 30 days instantly cancel the deletion. Post 30 days, files are permanently deleted from our systems.";
    }

    return {
      number: index + 1,
      title,
      content: customContent
    };
  });

  // Filter sections under search
  const filteredSections = sections.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn text-left max-w-7xl mx-auto py-4 px-2 sm:px-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button 
          id="privacy-back-btn"
          onClick={onBack} 
          className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shop</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setViewMode(v => v === 'split' ? 'continuous' : 'split')}
            className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-heavy uppercase tracking-widest transition flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-[#FF4D00]" />
            <span>{viewMode === 'split' ? 'View as Single Document' : 'View Side-by-Side'}</span>
          </button>

          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white hover:bg-neutral-900 rounded-xl text-xs font-heavy uppercase tracking-widest transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Policy</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[40px] border border-zinc-200/80 shadow-lg overflow-hidden flex flex-col">
        
        {/* Banner with identity details */}
        <div className="bg-neutral-950 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#FF4D00] text-white rounded-2xl flex items-center justify-center shadow-lg border border-[#FF4D00]/25">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-0.5">
              <h1 id="privacy-main-title" className="text-xl md:text-3xl font-black uppercase tracking-tight font-sans">
                Comprehensive Privacy Policy
              </h1>
              <p className="text-[10px] sm:text-xs font-mono text-zinc-400 font-bold uppercase tracking-widest">
                PrintBazaar Data Protection & Privacy Commitment
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <span className="px-3.5 py-1.5 bg-zinc-900 rounded-full text-[9px] font-mono font-bold uppercase border border-zinc-800 text-emerald-400">
              ● Verified Safe
            </span>
            <span className="px-3.5 py-1.5 bg-zinc-900 rounded-full text-[9px] font-mono font-bold uppercase border border-zinc-800 text-zinc-300">
              Rev. June 2026
            </span>
          </div>
        </div>

        {/* Dynamic Multi-Step layout */}
        {viewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
            {/* Sidebar list */}
            <div className="lg:col-span-4 border-r border-zinc-200 p-6 flex flex-col space-y-4 bg-zinc-50/50">
              
              {/* Search register */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-zinc-400" />
                </span>
                <input 
                  type="text"
                  placeholder="Search policy..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-800 focus:outline-[#FF4D00]"
                />
              </div>

              {/* Scrolling indices */}
              <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 space-y-1.5">
                {filteredSections.map((sec) => (
                  <button
                    key={sec.number}
                    type="button"
                    onClick={() => {
                      const absoluteIndex = sections.findIndex(s => s.number === sec.number);
                      if (absoluteIndex !== -1) setSelectedIdx(absoluteIndex);
                    }}
                    className={`w-full p-3.5 rounded-2xl text-left text-xs uppercase tracking-wide transition-all border flex items-center justify-between gap-3 cursor-pointer ${
                      sections[selectedIdx]?.number === sec.number
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm font-black'
                        : 'bg-white hover:bg-zinc-100 text-zinc-650 border-zinc-150 font-bold'
                    }`}
                  >
                    <span className="truncate">{sec.number}. {sec.title}</span>
                    <span className="text-[9px] font-mono opacity-60">CH-{sec.number}</span>
                  </button>
                ))}

                {filteredSections.length === 0 && (
                  <div className="text-center py-12 text-zinc-400">
                    <p className="font-mono text-xs uppercase font-bold">No compliance clauses matched</p>
                  </div>
                )}
              </div>

              {/* Dynamic compliance advice */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-3xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-900 font-heavy text-xs uppercase">
                  <Info className="w-4 h-4 text-indigo-650" />
                  <span>Privacy Guide</span>
                </div>
                <p className="text-[10.5px] leading-relaxed text-indigo-950">
                  Select a section to view details. Use search to find specific topics.
                </p>
              </div>

            </div>

            {/* Display pane */}
            <div className="lg:col-span-8 p-6 md:p-10 flex flex-col justify-between space-y-8 min-h-[500px]">
              
              {sections[selectedIdx] ? (
                <div className="space-y-6">
                  <span className="px-3.5 py-1 bg-[#ffe4d6] text-[#FF4D00] text-[10px] font-mono font-heavy tracking-widest uppercase rounded-full border border-orange-100">
                    Chapter {sections[selectedIdx].number} Guideline
                  </span>

                  <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase border-b border-zinc-100 pb-4">
                    {sections[selectedIdx].title}
                  </h2>

                  <div className="bg-zinc-50 border border-zinc-200/60 p-6 sm:p-8 rounded-[32px] relative overflow-hidden">
                    <p className="text-sm md:text-base leading-relaxed text-zinc-700 whitespace-pre-line font-sans font-medium">
                      {sections[selectedIdx].content}
                    </p>
                  </div>

                  {/* Play safety warning hooks */}
                  {(sections[selectedIdx].title === "Account Deactivation" || sections[selectedIdx].title === "Account Deletion") && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-left">
                        <p className="text-xs font-black text-rose-900 uppercase">Self-Service Controller Active</p>
                        <p className="text-[11px] leading-relaxed text-rose-800">
                          To execute these controls immediately on your data registries, navigate to the **Privacy & Security Settings** tab in your seller workspace dashboard room.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Document quality check alert helper */}
                  {sections[selectedIdx].title === "Seller Verification" && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-left">
                        <p className="text-xs font-black text-emerald-950 uppercase">Verified Channels</p>
                        <p className="text-[11px] leading-relaxed text-emerald-800">
                          Document protection and secure data verification runs obey verified security templates. Uploads are strictly stored inside protected pipelines.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center grow py-20 text-zinc-400">
                  <FileText className="w-16 h-16 opacity-30 animate-pulse" />
                  <p className="font-mono text-xs font-bold uppercase mt-4">Select section to begin review</p>
                </div>
              )}

              {/* Navigation button room */}
              <div className="flex justify-between items-center border-t border-zinc-100 pt-6">
                <button
                  type="button"
                  disabled={selectedIdx === 0}
                  onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
                  className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-[10px] font-black uppercase text-zinc-600 transition disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  ◀ Previous Chapter
                </button>
                <p className="text-[10px] font-mono font-bold text-zinc-400">
                  Page {selectedIdx + 1} of {sections.length}
                </p>
                <button
                  type="button"
                  disabled={selectedIdx === sections.length - 1}
                  onClick={() => setSelectedIdx(i => Math.min(sections.length - 1, i + 1))}
                  className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-[10px] font-black uppercase text-zinc-600 transition disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next Chapter ▶
                </button>
              </div>

            </div>
          </div>
        ) : (
          <div className="p-6 md:p-12 space-y-12 max-h-[680px] overflow-y-auto">
            {/* Continuous document layout */}
            <div className="max-w-4xl mx-auto space-y-10 font-sans">
              <div className="text-center space-y-2 border-b border-zinc-150 pb-8">
                <h2 className="text-2xl font-black text-zinc-900 uppercase">OFFICIAL PRIVACY POLICY</h2>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  Comprehensive 55-Part Policy Frame (Consolidated Legal View)
                </p>
              </div>

              {sections.map((sec) => (
                <div key={sec.number} className="space-y-3.5 text-left border-b border-zinc-100 pb-8">
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-zinc-105 flex items-center justify-center font-mono text-xs border border-zinc-200 text-[#FF4D00] shadow-xs">
                      {sec.number}
                    </span>
                    <span>{sec.title}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-650 leading-relaxed pl-9 whitespace-pre-line">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer verification notes */}
        <div className="bg-zinc-50 p-5 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-zinc-400 shrink-0" />
            <p className="text-[10px] text-zinc-500 font-semibold uppercase font-mono">
              Contact our privacy team:
            </p>
          </div>
          <a 
            href="mailto:compliance@printbazaar.in" 
            className="text-xs font-black text-[#FF4D00] hover:underline uppercase tracking-wider font-sans"
          >
            compliance@printbazaar.in
          </a>
        </div>

      </div>
    </div>
  );
}
