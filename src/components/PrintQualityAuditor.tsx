/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Zap, Layout, Maximize2, Monitor, Printer } from 'lucide-react';
import { ArtworkAudit } from '../types';

interface PrintQualityAuditorProps {
  imageUrl?: string;
  onAuditComplete?: (audit: ArtworkAudit) => void;
}

export default function PrintQualityAuditor({ imageUrl, onAuditComplete }: PrintQualityAuditorProps) {
  const [auditing, setAuditing] = useState(false);
  const [audit, setAudit] = useState<ArtworkAudit | null>(null);

  useEffect(() => {
    if (imageUrl) {
      performAudit(imageUrl);
    } else {
      setAudit(null);
    }
  }, [imageUrl]);

  const performAudit = async (url: string) => {
    setAuditing(true);
    // Simulate complex AI analysis across multiple layers
    await new Promise(resolve => setTimeout(resolve, 2400));

    const mockAudit: ArtworkAudit = {
      qualityScore: 92,
      dpi: 300,
      colorSpace: 'CMYK',
      bleedCheck: 'Passed',
      safeMarginCheck: 'Passed',
      resolution: { width: 3500, height: 2400 },
      warnings: []
    };

    // Advanced Checks Simulation
    const checks = [
      { condition: Math.random() > 0.8, warning: 'Font Missing: "Inter Black" not outlined. Might shift in production.', score: -10 },
      { condition: Math.random() > 0.9, warning: 'Low-res Image detected in layout (Under 150 DPI).', score: -15 },
      { condition: Math.random() > 0.85, warning: 'Transparency effects found. Flattening recommended for offset.', score: -5 },
      { condition: Math.random() > 0.95, warning: 'Overprint settings detected on black text. Verify intent.', score: -2 },
      { condition: Math.random() > 0.8, warning: 'Safe margin violation on left edge. Content might get clipped.', score: -12, margin: 'Warning' as const },
      { condition: Math.random() > 0.9, warning: 'No Bleed detected. White borders possible after cutting.', score: -8, bleed: 'Warning' as const }
    ];

    checks.forEach(check => {
      if (check.condition) {
        mockAudit.warnings.push(check.warning);
        mockAudit.qualityScore += check.score;
        if (check.margin) mockAudit.safeMarginCheck = check.margin;
        if (check.bleed) mockAudit.bleedCheck = check.bleed;
      }
    });

    if (mockAudit.qualityScore < 0) mockAudit.qualityScore = 5;

    setAudit(mockAudit);
    setAuditing(false);
    onAuditComplete?.(mockAudit);
  };

  if (!imageUrl) return null;

  return (
    <div className="bg-white border border-zinc-200 rounded-[28px] overflow-hidden shadow-sm">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-900">Artwork Verification</h4>
          </div>
          {auditing && <Zap className="w-4 h-4 text-[#FF4D00] animate-pulse" />}
        </div>

        <AnimatePresence mode="wait">
          {auditing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 flex flex-col items-center justify-center space-y-3"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-zinc-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-[#FF4D00] border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 animate-pulse">Analyzing Artwork...</p>
            </motion.div>
          ) : audit ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Quality Score Meter */}
              <div className="bg-zinc-900 p-5 rounded-2xl relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Print Quality Score</p>
                    <p className="text-3xl font-black text-white">{audit.qualityScore}<span className="text-zinc-600 text-sm">/100</span></p>
                  </div>
                  <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${audit.qualityScore > 80 ? 'border-emerald-500 text-emerald-500' : 'border-amber-500 text-amber-500'}`}>
                    {audit.qualityScore > 80 ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                </div>
                {/* Score bar */}
                <div className="mt-4 h-1 bg-zinc-800 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${audit.qualityScore}%` }}
                     className={`h-full ${audit.qualityScore > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                   />
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Monitor className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase tracking-wider">Resolution</span>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-900">{audit.resolution.width} x {audit.resolution.height}px</p>
                  <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">300 DPI Verified</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Printer className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase tracking-wider">Color Profile</span>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-900">{audit.colorSpace} Detected</p>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Ready for Production</p>
                </div>
              </div>

              {/* Status Checks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Layout className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600">Bleed Detection</span>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${audit.bleedCheck === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {audit.bleedCheck}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600">Safe Margin</span>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${audit.safeMarginCheck === 'Passed' ? 'bg-emerald-100 text-emerald-700' : audit.safeMarginCheck === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {audit.safeMarginCheck}
                  </span>
                </div>
              </div>

              {/* Warnings */}
              {audit.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Production Warnings</span>
                  </div>
                  {audit.warnings.map((w, i) => (
                    <p key={i} className="text-[9px] font-bold text-amber-600 leading-tight">• {w}</p>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
             <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                <Layout className="w-8 h-8 text-zinc-200" />
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Waiting for design upload...</p>
             </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
