import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Eye, 
  ZoomIn, 
  Info, 
  Check, 
  AlertTriangle,
  Layers,
  Flame,
  MousePointerClick
} from 'lucide-react';

interface QualityMetric {
  feature: string;
  digital: string;
  offset: string;
  isPositiveOffset: boolean;
}

const COMPARISON_METRICS: QualityMetric[] = [
  {
    feature: "Print Resolution",
    digital: "300 to 600 DPI (Slightly Soft)",
    offset: "2400 to 4800 DPI (True Vector Sharpness)",
    isPositiveOffset: true,
  },
  {
    feature: "Solid Fill Consistency",
    digital: "Bandings & subtle toner dusting",
    offset: "Flawless solid ink laying (No Banding)",
    isPositiveOffset: true,
  },
  {
    feature: "Fine Line & Font Rendering",
    digital: "Minor pixelation / jagged curves below 6pt",
    offset: "Ultra-sharp micro-elements & crisp hair-strokes",
    isPositiveOffset: true,
  },
  {
    feature: "Ink Technology",
    digital: "Dry toner fused on surface",
    offset: "Premium liquid inks absorbed directly in paper fiber",
    isPositiveOffset: true,
  },
  {
    feature: "Accuracy / Registration",
    digital: "±0.8mm variance per sheet",
    offset: "Micron-level ±0.1mm perfect print registry",
    isPositiveOffset: true,
  }
];

export default function PrintQualitySlider() {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x to 2.5x simulation
  const [selectedSample, setSelectedSample] = useState<'typography' | 'gradient' | 'illustrations'>('typography');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper handling calculation on move
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  // Samples descriptions and image overlays or generated high-quality CSS layouts to highlight details
  const samples = {
    typography: {
      title: "Micro-Typography Sharpness",
      description: "Focus on 4pt tiny text curves and solid sharp outlines.",
      // High-res visual representation using pure styled text/markup so it acts as an actual zoom simulator perfectly!
      digitalMarkup: (
        <div className="p-8 h-full flex flex-col justify-center items-center bg-zinc-50 select-none text-zinc-900/90" style={{ filter: 'blur(0.8px) contrast(90%)' }}>
          <div className="text-center space-y-4">
            <span className="text-[10px] bg-zinc-200 text-zinc-650 px-2 py-0.5 rounded uppercase font-bold tracking-widest block w-max mx-auto">Standard Digital CMYK</span>
            <h4 className="text-4xl font-extrabold tracking-tight text-slate-800 leading-none">SWISS BOLD 6PT</h4>
            <p className="text-[8px] font-mono text-zinc-500 uppercase max-w-[280px] mx-auto tracking-normal leading-tight">
              Toner dispersion leaves subtle gray particles around letter edges. Round curves appear slightly jagged under a printing microscope magnifying lens.
            </p>
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-zinc-300 mx-auto flex items-center justify-center p-2 bg-white flex-col">
              <span className="text-3xl font-black text-rose-500 leading-none">A</span>
              <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Jagged Edges</span>
            </div>
          </div>
        </div>
      ),
      offsetMarkup: (
        <div className="p-8 h-full flex flex-col justify-center items-center bg-stone-50 select-none text-slate-950">
          <div className="text-center space-y-4">
            <span className="text-[10px] bg-[#fff5f0] text-[#FF4D00] px-2 py-0.5 rounded uppercase font-extrabold tracking-widest block w-max mx-auto">2400 DPI Offset Press</span>
            <h4 className="text-4xl font-black tracking-tight text-slate-900 leading-none">SWISS BOLD 6PT</h4>
            <p className="text-[8px] font-mono text-zinc-700 uppercase max-w-[280px] mx-auto tracking-normal leading-tight font-semibold">
              TRUE SOLID INK ABSORPTION PENETRATING PAPER FIBER. SHARPEST CORNERS EXECUTED BY HIGH-SPEED METALLIC CYLINDRICAL OFFSET MATRICES.
            </p>
            <div className="w-24 h-24 rounded-full border-4 border-[#FF4D00]/30 mx-auto flex items-center justify-center p-2 bg-white flex-col">
              <span className="text-3xl font-black text-emerald-600 leading-none">A</span>
              <span className="text-[7px] text-emerald-600 font-extrabold uppercase tracking-widest mt-0.5">Perfect Razor Line</span>
            </div>
          </div>
        </div>
      )
    },
    gradient: {
      title: "Solid Ink Color Gradients",
      description: "Inspecting smooth gradient transitions without blocky banding or stepping artifacts.",
      digitalMarkup: (
        <div className="h-full flex flex-col justify-center items-center relative p-8 select-none" style={{ background: 'linear-gradient(135deg, #1e293b 20%, #475569 45%, #334155 70%, #1e293b 100%)', filter: 'blur(0.5px)' }}>
          {/* Simulated digital banding overlays */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(0,0,0,0.15))] pointer-events-none opacity-80" />
          <div className="absolute inset-x-0 top-1/4 h-2 bg-white/5 shadow-inner" />
          <div className="absolute inset-x-0 top-1/2 h-3 bg-black/10 shadow-inner" />
          <div className="absolute inset-x-0 top-2/3 h-2 bg-white/5 shadow-inner" />
          <div className="text-center text-white space-y-2 z-10">
            <span className="text-[10px] bg-red-900/40 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-sm uppercase font-bold tracking-widest">Digital Toner Stripes</span>
            <h4 className="text-2xl font-black uppercase text-slate-300">Banding Artifacts</h4>
            <p className="text-[9px] text-slate-400 font-mono tracking-relaxed uppercase max-w-sm">
              Laser heaters cause non-uniform thermal fusion, resulting in visual steps, toner halos, and harsh banding stripes across rich solid block gradients.
            </p>
          </div>
        </div>
      ),
      offsetMarkup: (
        <div className="h-full flex flex-col justify-center items-center relative p-8 select-none" style={{ background: 'linear-gradient(135deg, #FF4D00 0%, #d93d00 50%, #9e2a00 100%)' }}>
          <div className="text-center text-white space-y-2 z-10">
            <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-sm uppercase font-black tracking-widest">continuous deep ink</span>
            <h4 className="text-2xl font-black uppercase text-white">Stunning Seamless Solids</h4>
            <p className="text-[9px] font-semibold text-orange-100 font-mono tracking-normal uppercase max-w-sm">
              HYPER-FINE PRESS MATRICES INLAY Ink layers uniformly. NO BANDING, NO STRIPES, AND ZERO PATTERN DISTRACTORS FOR PRISTINE CORPORATE SOLIDS.
            </p>
          </div>
        </div>
      )
    },
    illustrations: {
      title: "Fine Vector Illustrations",
      description: "Inspecting geometric alignments and registration of overlapping primary colors.",
      digitalMarkup: (
        <div className="p-8 h-full flex flex-col justify-center items-center bg-neutral-900 select-none" style={{ filter: 'blur(0.6px)' }}>
          <div className="text-center space-y-3">
            <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase font-bold tracking-widest">Registry Drift (Digital)</span>
            {/* Venn-diagram like circles with visual offset shift */}
            <div className="relative w-28 h-20 mx-auto flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full bg-cyan-500/60 mix-blend-screen -translate-x-3 translate-y-1.5" />
              <div className="absolute w-12 h-12 rounded-full bg-magenta-500/60 mix-blend-screen translate-x-2 -translate-y-1" style={{ backgroundColor: '#eb008b' }} />
              <div className="absolute w-12 h-12 rounded-full bg-yellow-500/60 mix-blend-screen translate-y-2" />
            </div>
            <p className="text-[9px] text-zinc-400 max-w-[280px] mx-auto tracking-normal leading-relaxed uppercase font-mono">
              Overlapping registration drifts up to ±0.8mm creating white slivers or blurred colored outlines.
            </p>
          </div>
        </div>
      ),
      offsetMarkup: (
        <div className="p-8 h-full flex flex-col justify-center items-center bg-neutral-950 select-none">
          <div className="text-center space-y-3">
            <span className="text-[9px] bg-[#fff5f0] text-[#FF4D00] px-2.5 py-0.5 rounded-sm uppercase font-extrabold tracking-wider">Perfect Dot Rosette Registration</span>
            {/* Perfect overlapping circles */}
            <div className="relative w-28 h-20 mx-auto flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full bg-cyan-500/80 mix-blend-screen" />
              <div className="absolute w-12 h-12 rounded-full bg-magenta-500/80 mix-blend-screen" style={{ backgroundColor: '#ff00a0' }} />
              <div className="absolute w-12 h-12 rounded-full bg-yellow-500/80 mix-blend-screen" />
            </div>
            <p className="text-[9px] text-zinc-300 max-w-[280px] mx-auto tracking-normal leading-relaxed uppercase font-mono font-semibold">
              FLAWLESS MULTI-PLATE MECHANICAL ALIGNMENT. ABSOLUTE REGISTRATION LOCKING DOWN COLOR COMBINATIONS WITHOUT ANY FUZZINESS.
            </p>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="bg-white rounded-[36px] overflow-hidden border border-zinc-200/80 shadow-md p-6 md:p-8 space-y-8" id="print-quality-comparison-section">
      
      {/* Header Accent */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-[#fff5f0] text-[#FF4D00] px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
            <span>Interactive Quality Lab</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-heavy text-slate-900 uppercase tracking-tight leading-none">
            OFFSET VS STANDARD <span className="text-[#FF4D00]">DIGITAL GRAPHICS</span>
          </h3>
          <p className="text-xs text-zinc-650 leading-relaxed font-normal">
            Drag the divider to compare standard office laser/digital toner resolution (300 DPI) against our commercial high-volume cylindrical offset presses (2400+ DPI rosette screening).
          </p>
        </div>

        {/* Tab triggers for different detail samples */}
        <div className="flex gap-1 bg-zinc-150 p-1.5 rounded-2xl border border-zinc-200/50">
          {(Object.keys(samples) as Array<keyof typeof samples>).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedSample(key)}
              className={`px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-tight rounded-xl transition-all cursor-pointer ${
                selectedSample === key
                  ? 'bg-black text-white shadow-sm'
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              {key === 'typography' ? 'Text Sharpness' : key === 'gradient' ? 'Gradients' : 'Vector Art'}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Slide Stage wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Slider Box */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="relative select-none rounded-[32px] overflow-hidden border border-zinc-300 bg-zinc-100 shadow-inner h-[320px] md:h-[380px]" id="quality-drag-viewport">
            
            <div 
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute inset-0 w-full h-full cursor-col-resize select-none overflow-hidden touch-none"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
            >
              {/* Left Side: Standard Digital toner output */}
              <div className="absolute inset-0 w-full h-full bg-zinc-200">
                {samples[selectedSample].digitalMarkup}
                
                {/* Standard badge on left */}
                <div className="absolute bottom-4 left-4 z-10 bg-black/75 text-zinc-300 text-[10px] font-semibold tracking-wider font-mono py-1 px-3.5 rounded-xl border border-zinc-100/10 pointer-events-none uppercase">
                  ◄ Left: Standard digital (Soft, Banding)
                </div>
              </div>

              {/* Right Side Overlay: Perfect Offset plates ink output */}
              <div 
                className="absolute inset-0 h-full overflow-hidden select-none"
                style={{ left: `${sliderPosition}%`, right: 0 }}
              >
                {/* Inner div needs translation anchor locked to left:0 so content aligns with left side */}
                <div 
                  className="absolute inset-y-0 h-full"
                  style={{ left: `-${sliderPosition}%`, width: containerRef.current?.getBoundingClientRect().width || '100%' }}
                >
                  {samples[selectedSample].offsetMarkup}
                </div>

                {/* Offset badge on right */}
                <div className="absolute bottom-4 right-4 z-10 bg-[#FF4D00] text-white text-[10px] font-black tracking-widest font-mono py-1 px-3.5 rounded-xl pointer-events-none uppercase shadow-md">
                  Premium Offset (Sharp, Deep Ink) ►
                </div>
              </div>

              {/* Dividing Sliding Line Handle */}
              <div 
                className="absolute inset-y-0 w-1 bg-[#FF4D00] z-20 pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#FF4D00] text-white border-2 border-white flex items-center justify-center shadow-lg">
                  <div className="flex gap-0.5 justify-center items-center">
                    <span className="text-[9px] font-black font-mono">◄►</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Micro instructions overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none bg-white/90 backdrop-blur-xs py-1 px-3 rounded-full shadow-xs border border-zinc-200 flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-[#FF4D00] animate-pulse" />
              <span className="text-[9px] text-zinc-700 font-extrabold uppercase tracking-wide">Drag to slice before & after</span>
            </div>

          </div>

          {/* Zoom controls */}
          <div className="flex items-center justify-between bg-zinc-50 p-4.5 rounded-2xl border border-zinc-200">
            <div className="flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-zinc-550" />
              <span className="text-[10px] text-zinc-600 font-heavy uppercase tracking-wide">Press Microscope Zoom:</span>
              <span className="text-xs font-mono font-bold text-slate-800 bg-white border border-zinc-200 px-2 py-0.5 rounded-md">{zoomLevel === 1 ? '1.0X Standard Screen' : zoomLevel === 1.5 ? '1.5X Close Inspection' : '2.0X Extreme Macro Detail'}</span>
            </div>

            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                  zoomLevel === 1
                    ? 'bg-black text-white'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                1.0x (Standard)
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1.5)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                  zoomLevel === 1.5
                    ? 'bg-black text-white'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                1.5x Zoom
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(2)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                  zoomLevel === 2
                    ? 'bg-black text-white'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                2.0x (Macro)
              </button>
            </div>
          </div>

        </div>

        {/* Fact Card panel */}
        <div className="lg:col-span-4 space-y-5.5">
          
          <div className="bg-[#0F172A] text-white p-5 rounded-[28px] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#FF4D00]" />
              <p className="text-[10px] text-zinc-300 font-black uppercase tracking-widest font-mono">Why Choose Commercial Offset?</p>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              High-volume corporate projects require mechanical print blocks. Instead of standard dry toner dusting, offset presses utilize continuous rubber blankets to distribute high-opacity liquid ink directly into paper stocks.
            </p>

            <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-0.5 px-2 rounded font-black font-mono">2400 DPI</span>
              <p className="text-[10px] text-slate-450 uppercase font-bold leading-tight">Continuous flow halftone screenings with zero gradient loss.</p>
            </div>
          </div>

          {/* Metric Comparison rows */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-widest font-mono">Direct Technical Metrics</h4>
            
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {COMPARISON_METRICS.map((metric, i) => (
                <div key={i} className="bg-zinc-50 border border-zinc-200/6s p-3 rounded-2xl space-y-1">
                  <p className="text-[10px] font-bold text-slate-800 uppercase tracking-normal">{metric.feature}</p>
                  <div className="grid grid-cols-2 gap-3 text-[9px] font-mono">
                    <div className="text-zinc-500 line-through">
                      <span className="font-sans font-bold text-red-500 mr-1">⨯</span>
                      {metric.digital}
                    </div>
                    <div className="text-emerald-700 font-extrabold">
                      <span className="font-sans text-emerald-500 mr-1">✔</span>
                      {metric.offset}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
