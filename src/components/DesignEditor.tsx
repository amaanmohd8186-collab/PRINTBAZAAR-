import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { 
  Type, 
  Square, 
  Image as ImageIcon, 
  Download, 
  Save, 
  Trash2, 
  Undo, 
  Redo,
  Sparkles,
  Layers,
  Eraser,
  Wand2,
  Maximize2,
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { ToolType, Design } from '../types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface DesignEditorProps {
  userEmail: string;
  userId: string;
  onSave?: (design: Design) => void;
}

export const DesignEditor: React.FC<DesignEditorProps> = ({ userEmail, userId, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleAiAction = async (tool: string, options: any = {}) => {
    if (!userId) {
      alert("Please sign in to use AI Studio tools.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const resp = await fetch('/api/studio/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool,
          userId,
          image: tool === 'image-gen' ? null : fabricCanvas.current?.toDataURL(),
          options
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        if (resp.status === 402) {
          alert(`Insufficient Credits! ${data.error}. Redirecting to Credits recharge...`);
          window.dispatchEvent(new CustomEvent('switch-tab', { detail: { activeTab: 'profile' } }));
          // Wait, this is in DesignEditor, we should probably set profilePortal to 'credits' too
          // But for now, alert is enough to guide user.
        } else {
          throw new Error(data.error);
        }
        return;
      }

      if (data.imageUrl) {
        const img = await fabric.Image.fromURL(data.imageUrl, { crossOrigin: 'anonymous' });
        img.scale(0.5);
        fabricCanvas.current?.add(img);
        fabricCanvas.current?.renderAll();
      }
    } catch (err: any) {
      alert("AI Processing Failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  const [aiPrompt, setAiPrompt] = useState('');
  const [designs, setDesigns] = useState<Design[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
    });

    // Handle object selection for UI state
    fabricCanvas.current.on('selection:created', () => setActiveTool('select'));
    
    loadDesigns();

    return () => {
      fabricCanvas.current?.dispose();
    };
  }, []);

  const loadDesigns = async () => {
    try {
      const res = await fetch('/api/designs/list');
      const data = await res.json();
      if (data.success) setDesigns(data.designs);
    } catch (err) {
      console.error("Failed to load designs", err);
    }
  };

  const addText = () => {
    const text = new fabric.IText('Double click to edit', {
      left: 100,
      top: 100,
      fontFamily: 'Inter',
      fontSize: 24,
      fill: '#000000',
    });
    fabricCanvas.current?.add(text);
    fabricCanvas.current?.setActiveObject(text);
  };

  const addRect = () => {
    const rect = new fabric.Rect({
      left: 150,
      top: 150,
      fill: '#FF4D00',
      width: 100,
      height: 100,
      rx: 8,
      ry: 8
    });
    fabricCanvas.current?.add(rect);
    fabricCanvas.current?.setActiveObject(rect);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgObj = new Image();
      imgObj.src = event.target?.result as string;
      imgObj.onload = () => {
        const fabricImg = new fabric.Image(imgObj);
        fabricImg.scaleToWidth(200);
        fabricCanvas.current?.add(fabricImg);
        fabricCanvas.current?.centerObject(fabricImg);
        fabricCanvas.current?.setActiveObject(fabricImg);
      };
    };
    reader.readAsDataURL(file);
  };

  const processAI = async (tool: string, extraOptions = {}) => {
    const activeObject = fabricCanvas.current?.getActiveObject();
    if (!activeObject && !['image-gen', 'template-gen'].includes(tool)) {
      showStatus('error', 'Please select an object to process.');
      return;
    }

    setIsProcessing(true);
    try {
      let imageData = '';
      if (activeObject && activeObject instanceof fabric.Image) {
        imageData = activeObject.toDataURL({ format: 'png' });
      }

      const res = await fetch('/api/studio/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool,
          image: imageData,
          options: { prompt: aiPrompt, ...extraOptions }
        })
      });

      const data = await res.json();
      if (data.success) {
        const img = await fabric.Image.fromURL(data.imageUrl, { crossOrigin: 'anonymous' });
        if (activeObject && activeObject instanceof fabric.Image) {
          // Replace existing image maintaining position
          img.set({
            left: activeObject.left,
            top: activeObject.top,
            scaleX: activeObject.scaleX,
            scaleY: activeObject.scaleY,
            angle: activeObject.angle
          });
          fabricCanvas.current?.remove(activeObject);
        } else {
          img.scaleToWidth(400);
          fabricCanvas.current?.centerObject(img);
        }
        fabricCanvas.current?.add(img);
        fabricCanvas.current?.setActiveObject(img);
        fabricCanvas.current?.renderAll();
        showStatus('success', data.message || 'AI processing complete!');
        setAiPrompt('');
      } else {
        showStatus('error', data.error);
      }
    } catch (err) {
      showStatus('error', 'AI Studio failed to connect.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveDesign = async () => {
    if (!fabricCanvas.current) return;
    setIsSaving(true);
    const canvasData = JSON.stringify(fabricCanvas.current.toJSON());
    const preview = fabricCanvas.current.toDataURL({ format: 'png', quality: 0.5 });

    try {
      const res = await fetch('/api/designs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Design ${new Date().toLocaleTimeString()}`,
          data: canvasData,
          preview,
          userId: userId || 'anonymous'
        })
      });
      const result = await res.json();
      if (result.success) {
        showStatus('success', 'Design synced to cloud!');
        loadDesigns();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      showStatus('error', 'Cloud sync failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportAsPDF = () => {
    const dataUrl = fabricCanvas.current?.toDataURL({ format: 'png' });
    if (!dataUrl) return;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [CANVAS_WIDTH, CANVAS_HEIGHT]
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    pdf.save('printbazaar-design.pdf');
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="flex h-[800px] bg-slate-50 rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
      {/* Sidebar - Tools */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6">
        <button 
          onClick={() => setActiveTool('select')}
          className={`p-3 rounded-xl transition-all ${activeTool === 'select' ? 'bg-orange-100 text-orange-600 shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Layers size={24} />
        </button>
        <button 
          onClick={addText}
          className="p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
        >
          <Type size={24} />
        </button>
        <button 
          onClick={addRect}
          className="p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
        >
          <Square size={24} />
        </button>
        <label className="p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer">
          <ImageIcon size={24} />
          <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
        </label>
        <div className="h-px w-10 bg-slate-100 mx-auto" />
        <button 
          onClick={() => setActiveTool('ai')}
          className={`p-3 rounded-xl transition-all ${activeTool === 'ai' ? 'bg-purple-100 text-purple-600 shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Sparkles size={24} />
        </button>
        <button 
          onClick={() => setShowHistory(true)}
          className="p-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
        >
          <History size={24} />
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-slate-900 font-semibold text-lg flex items-center gap-2">
              PrintBazaar Studio <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded uppercase tracking-wider">Pro</span>
            </h2>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1">
               <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"><Undo size={18} /></button>
               <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"><Redo size={18} /></button>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={saveDesign}
               disabled={isSaving}
               className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50"
             >
               {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
               <span className="text-sm font-medium">Save to Cloud</span>
             </button>
             <button 
               onClick={exportAsPDF}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
             >
               <Download size={18} />
               <span className="text-sm font-medium">Export PDF</span>
             </button>
             <button 
               onClick={() => fabricCanvas.current?.remove(...fabricCanvas.current?.getActiveObjects() || [])}
               className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
             >
               <Trash2 size={18} />
             </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center overflow-auto">
          <div className="relative shadow-2xl bg-white p-2 rounded-lg ring-1 ring-slate-200">
            <canvas ref={canvasRef} />
            
            {/* Status Toasts */}
            <AnimatePresence>
              {statusMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${statusMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                >
                  {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span className="text-sm font-medium">{statusMessage.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Context Panel (AI Tools) */}
      <AnimatePresence>
        {activeTool === 'ai' && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="text-purple-500" size={20} />
                AI Creative Hub
              </h3>
              <button 
                onClick={() => setActiveTool('select')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Generative AI</label>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your design (e.g., Luxury gold wedding invitation with floral borders)"
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all resize-none"
                />
                <button 
                  onClick={() => processAI('template-gen')}
                  disabled={!aiPrompt || isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                  Generate Full Design
                </button>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Selected Object Tools</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => processAI('background-removal')}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
                  >
                    <Eraser size={20} />
                    <span className="text-[10px] font-bold">Remove BG</span>
                  </button>
                  <button 
                    onClick={() => processAI('upscale')}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
                  >
                    <Maximize2 size={20} />
                    <span className="text-[10px] font-bold">4X Upscale</span>
                  </button>
                </div>
                <button 
                  onClick={() => processAI('enhancement')}
                  disabled={isProcessing}
                  className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
                >
                  Dynamic Color Correction
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowHistory(false)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
             >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <History size={20} />
                    Design History
                  </h3>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="grid grid-cols-3 gap-6">
                    {designs.map((design) => (
                      <div 
                        key={design.id} 
                        className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-orange-500 transition-all cursor-pointer"
                        onClick={() => {
                          fabricCanvas.current?.loadFromJSON(design.data, () => {
                            fabricCanvas.current?.renderAll();
                            setShowHistory(false);
                            showStatus('success', `Restored ${design.name}`);
                          });
                        }}
                      >
                        <div className="aspect-[4/3] bg-slate-100 relative">
                          {design.preview && <img src={design.preview} className="w-full h-full object-cover" />}
                          <div className="absolute inset-0 bg-orange-600/0 group-hover:bg-orange-600/10 transition-all flex items-center justify-center">
                             <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg text-sm font-bold text-orange-600">
                               Restore Revision
                             </div>
                          </div>
                        </div>
                        <div className="p-4 bg-white border-t border-slate-100">
                           <p className="font-bold text-slate-900 truncate">{design.name}</p>
                           <p className="text-[10px] text-slate-400 font-mono mt-1">
                             {new Date(design.updatedAt?.seconds * 1000).toLocaleString() || 'Just now'}
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
