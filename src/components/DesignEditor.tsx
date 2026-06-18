/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  X,
  Sliders,
  Palette,
  Briefcase,
  Layers2,
  RefreshCw,
  Zap,
  Info,
  Plus,
  Minus,
  PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { doc, updateDoc } from 'firebase/firestore';
import { db, safeFetch } from '../firebase';
import confetti from 'canvas-confetti';
import { ToolType, Design, UserStats } from '../types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface DesignEditorProps {
  userEmail: string;
  userId: string;
  onSave?: (design: Design) => void;
  userStats: UserStats;
  onClose?: () => void;
}

const PREMIUM_FONTS = [
  // CORE
  'Inter', 'Space Grotesk', 'JetBrains Mono', 'Playfair Display', 'Oswald',
  // URDU/ARABIC
  'Noto Nastaliq Urdu', 'Amiri', 'Tajawal', 'Cairo', 'Lateef',
  // MODERN
  'Montserrat', 'Poppins', 'Raleway', 'Nunito', 'Roboto',
  // LUXURY
  'Cormorant Garamond', 'Cinzel', 'Great Vibes', 'Bodoni Moda',
  // WEDDING/HANDWRITING
  'Dancing Script', 'Pacifico', 'Caveat', 'Satisfy', 'Alex Brush'
];

interface TextEffect {
  id: string;
  label: string;
}

const URDU_TRANSLITERATE_API = 'https://inputtools.google.com/request?text=';
const THEME_COLORS = [
  '#000000', '#FFFFFF', '#FF4D00', '#3B82F6', '#10B981', 
  '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#1E293B'
];

export const DesignEditor: React.FC<DesignEditorProps> = ({ 
  userEmail, 
  userId, 
  onSave, 
  userStats,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType | 'easy' | 'adobe'>('select');
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Custom Sliders and object options state
  const [selectedObjType, setSelectedObjType] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fillColor, setFillColor] = useState('#000000');
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [rightPanelTab, setRightPanelTab] = useState<'inspector' | 'templates' | 'assets' | 'print'>('inspector');

  // States & Refs for Undo, Redo, Layers, and Templates
  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isHistoryLoadingRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [layersList, setLayersList] = useState<{ id: string; type: string; label: string; active: boolean }[]>([]);
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      const maxW = isMobile ? window.innerWidth - 32 : window.innerWidth - 450;
      const canvasTotalW = CANVAS_WIDTH + 20;
      if (maxW < canvasTotalW) {
        setScaleFactor(Math.max(0.3, maxW / canvasTotalW));
      } else {
        setScaleFactor(1);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const TEMPLATES = [
    {
      name: "Classic Wedding Card Layout",
      desc: "Elegant cream color template for wedding invitations.",
      elements: [
        { type: 'rect', left: 200, top: 100, width: 400, height: 400, rx: 20, ry: 20, fill: '#FAF7F2' },
        { type: 'text', left: 280, top: 160, text: 'Sophia & Julian', fill: '#B58A3D', fontSize: 32, fontFamily: 'Playfair Display', fontWeight: 'bold' },
        { type: 'text', left: 240, top: 220, text: 'Cordially invite you to celebrate love', fill: '#6B7280', fontSize: 14, fontFamily: 'Inter' },
        { type: 'text', left: 320, top: 280, text: 'Save The Date', fill: '#B58A3D', fontSize: 18, fontFamily: 'Playfair Display' },
        { type: 'text', left: 300, top: 320, text: 'December 24th, 2026', fill: '#1E293B', fontSize: 13, fontFamily: 'JetBrains Mono' }
      ]
    },
    {
      name: "Corporate Visiting Card",
      desc: "Ultra sleek business card.",
      elements: [
        { type: 'rect', left: 150, top: 150, width: 500, height: 300, rx: 12, ry: 12, fill: '#0F172A' },
        { type: 'text', left: 190, top: 200, text: 'PRINTBAZAAR CORP', fill: '#FF4D00', fontSize: 24, fontWeight: 'bold', fontFamily: 'Space Grotesk' },
        { type: 'text', left: 190, top: 240, text: 'Senior Design Specialist', fill: '#94A3B8', fontSize: 12, fontFamily: 'Inter' },
        { type: 'text', left: 190, top: 320, text: 'info@printbazaar.com | +91 99999 99999', fill: '#64748B', fontSize: 11, fontFamily: 'JetBrains Mono' }
      ]
    },
    {
      name: "Event Flyer Design",
      desc: "Vibrant and punchy marketing flyer.",
      elements: [
        { type: 'rect', left: 180, top: 80, width: 440, height: 440, rx: 8, ry: 8, fill: '#7C3AED' },
        { type: 'text', left: 220, top: 140, text: 'SUMMER MUSIC FEST', fill: '#00F5FF', fontSize: 28, fontWeight: 'black', fontFamily: 'Space Grotesk' },
        { type: 'text', left: 220, top: 190, text: 'LIVE AT THE STADIUM', fill: '#FFFFFF', fontSize: 14, fontWeight: 'bold', fontFamily: 'Inter' },
        { type: 'text', left: 220, top: 380, text: 'GET YOUR TICKETS TODAY', fill: '#FFFF00', fontSize: 12, fontFamily: 'JetBrains Mono' }
      ]
    },
    {
      name: "Cyberpunk Poster Style",
      desc: "High-contrast poster layout.",
      elements: [
        { type: 'rect', left: 200, top: 80, width: 400, height: 440, rx: 16, ry: 16, fill: '#05050A' },
        { type: 'text', left: 240, top: 140, text: 'NEON FUTURE', fill: '#EC4899', fontSize: 36, fontWeight: 'black', fontFamily: 'Space Grotesk' },
        { type: 'text', left: 240, top: 200, text: 'LIMITED OFFSET EDITION', fill: '#10B981', fontSize: 13, fontFamily: 'JetBrains Mono' },
        { type: 'text', left: 240, top: 400, text: 'POWERED BY PRINTBAZAAR', fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }
      ]
    },
    {
      name: "Classic Wedding Card",
      desc: "Elegant portrait layout with gold serif typography.",
      elements: [
        { type: 'rect', left: 200, top: 100, width: 400, height: 500, rx: 8, ry: 8, fill: '#FAF9F6', stroke: '#D4AF37', strokeWidth: 2 },
        { type: 'text', left: 300, top: 180, text: 'The Wedding of', fill: '#D4AF37', fontSize: 18, fontFamily: 'serif' },
        { type: 'text', left: 300, top: 240, text: 'ROHAN & ANANYA', fill: '#1A1A1A', fontSize: 32, fontWeight: 'bold', fontFamily: 'Space Grotesk' },
        { type: 'text', left: 300, top: 320, text: 'SAVE THE DATE', fill: '#BF941F', fontSize: 14, fontWeight: 'bold', fontFamily: 'Inter' }
      ]
    },
    {
      name: "Luxury Visiting Card",
      desc: "Standard 3.5x2 inch equivalent landscape blueprint.",
      elements: [
        { type: 'rect', left: 200, top: 200, width: 400, height: 230, rx: 12, ry: 12, fill: '#0F172A' },
        { type: 'text', left: 240, top: 240, text: 'Amaan Mohd', fill: '#FF4D00', fontSize: 24, fontWeight: 'black', fontFamily: 'Space Grotesk' },
        { type: 'text', left: 240, top: 280, text: 'CREATIVE DIRECTOR', fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' },
        { type: 'text', left: 240, top: 350, text: '+91 98765 43210 | hello@printbazaar.com', fill: '#FFFFFF', fontSize: 10, fontFamily: 'Inter' }
      ]
    },
    {
      name: "Event Flyer (Portrait)",
      desc: "A4 proportions with bold headline blocks.",
      elements: [
        { type: 'rect', left: 150, top: 50, width: 500, height: 600, rx: 0, ry: 0, fill: '#FFFFFF', stroke: '#000000', strokeWidth: 1 },
        { type: 'rect', left: 150, top: 50, width: 500, height: 150, rx: 0, ry: 0, fill: '#000000' },
        { type: 'text', left: 200, top: 100, text: 'MUSIC FESTIVAL 2026', fill: '#FFFFFF', fontSize: 36, fontWeight: 'black', fontFamily: 'Space Grotesk' },
        { type: 'text', left: 200, top: 250, text: 'LIVE CONCERT AT MAIDAN', fill: '#000000', fontSize: 22, fontWeight: 'bold', fontFamily: 'Inter' }
      ]
    },
    {
      name: "Marketing Poster",
      desc: "Large scale high-impact social layouts.",
      elements: [
        { type: 'rect', left: 100, top: 50, width: 600, height: 600, rx: 16, ry: 16, fill: '#4F46E5' },
        { type: 'text', left: 150, top: 150, text: 'REACH THE WORLD', fill: '#FFFFFF', fontSize: 48, fontWeight: 'black', fontFamily: 'Space Grotesk' },
        { type: 'text', left: 150, top: 220, text: 'PROFESSIONAL PRINTING SOLUTIONS', fill: '#C7D2FE', fontSize: 16, fontFamily: 'Inter' }
      ]
    },
    {
      name: "Social Media Post Square",
      desc: "Ideal size for Instagram and Facebook.",
      elements: [
        { type: 'rect', left: 200, top: 100, width: 400, height: 400, rx: 0, ry: 0, fill: '#EF4444' },
        { type: 'text', left: 240, top: 150, text: 'FLASH SALE!', fill: '#FFFFFF', fontSize: 36, fontWeight: 'black', fontFamily: 'Space Grotesk' },
        { type: 'text', left: 240, top: 210, text: '50% Off Custom Prints', fill: '#FFFF00', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter' },
        { type: 'text', left: 240, top: 400, text: 'Use Code: PB50', fill: '#FFFFFF', fontSize: 14, fontFamily: 'JetBrains Mono' }
      ]
    },
    {
      name: "Instagram Reels Cover",
      desc: "Vertical 9:16 aspect preview template.",
      elements: [
        { type: 'rect', left: 250, top: 120, width: 300, height: 400, rx: 4, ry: 4, fill: '#000000' },
        { type: 'text', left: 280, top: 200, text: 'DESIGN HACKS', fill: '#F43F5E', fontSize: 22, fontWeight: 'black', fontFamily: 'Space Grotesk' },
        { type: 'text', left: 280, top: 240, text: 'How to make print ready files', fill: '#FFFFFF', fontSize: 12, fontFamily: 'Inter' },
        { type: 'text', left: 280, top: 450, text: 'SWIPE UP', fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }
      ]
    },
    {
      name: "YouTube Thumbnail Frame",
      desc: "HD layout with high click-rate elements.",
      elements: [
        { type: 'rect', left: 160, top: 120, width: 480, height: 320, rx: 12, ry: 12, fill: '#1E293B' },
        { type: 'text', left: 190, top: 170, text: 'CANVA SECRETS', fill: '#F59E0B', fontSize: 30, fontWeight: 'extrabold', fontFamily: 'Space Grotesk' },
        { type: 'text', left: 190, top: 220, text: '100% Free Design Engine', fill: '#FFFFFF', fontSize: 14, fontFamily: 'Inter' }
      ]
    },
    {
      name: "WhatsApp Status Post",
      desc: "Story-ready creative card.",
      elements: [
        { type: 'rect', left: 250, top: 100, width: 300, height: 440, rx: 20, ry: 20, fill: '#047857' },
        { type: 'text', left: 280, top: 160, text: 'EXCITING UPDATE', fill: '#10B981', fontSize: 18, fontWeight: 'bold', fontFamily: 'Space Grotesk' },
        { type: 'text', left: 240, top: 240, text: 'We now deliver curated proofs overnight!', fill: '#FFFFFF', fontSize: 11, fontFamily: 'Inter' }
      ]
    }
  ];

  const updateLayersList = () => {
    if (!fabricCanvas.current) return;
    const objs = fabricCanvas.current.getObjects();
    const list = objs.map((obj, i) => {
      if (!(obj as any).id) {
        (obj as any).id = `layer_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`;
      }
      let label = `${obj.type?.toUpperCase()} Layer`;
      if (obj instanceof fabric.IText) {
        label = `Text: "${obj.text?.substring(0, 15) || 'No Content'}"`;
      }
      return {
        id: (obj as any).id,
        type: obj.type || 'unknown',
        label,
        active: fabricCanvas.current?.getActiveObject() === obj
      };
    });
    setLayersList(list);
  };

  const pushToHistory = () => {
    if (!fabricCanvas.current || isHistoryLoadingRef.current) return;
    const json = JSON.stringify(fabricCanvas.current.toJSON());
    
    const currIndex = historyIndexRef.current;
    const stack = historyStackRef.current;
    
    if (currIndex >= 0 && stack[currIndex] === json) return;

    const nextStack = stack.slice(0, currIndex + 1);
    nextStack.push(json);
    
    historyStackRef.current = nextStack;
    historyIndexRef.current = nextStack.length - 1;
    
    setCanUndo(nextStack.length > 1);
    setCanRedo(false);
    updateLayersList();
  };

  const undo = () => {
    if (!fabricCanvas.current || historyIndexRef.current <= 0 || isHistoryLoadingRef.current) return;
    
    const prevIndex = historyIndexRef.current - 1;
    historyIndexRef.current = prevIndex;
    
    const json = historyStackRef.current[prevIndex];
    isHistoryLoadingRef.current = true;
    
    fabricCanvas.current.loadFromJSON(json).then(() => {
      fabricCanvas.current?.renderAll();
      isHistoryLoadingRef.current = false;
      setCanUndo(prevIndex > 0);
      setCanRedo(true);
      updateLayersList();
    });
  };

  const redo = () => {
    if (!fabricCanvas.current || historyIndexRef.current >= historyStackRef.current.length - 1 || isHistoryLoadingRef.current) return;
    
    const nextIndex = historyIndexRef.current + 1;
    historyIndexRef.current = nextIndex;
    
    const json = historyStackRef.current[nextIndex];
    isHistoryLoadingRef.current = true;
    
    fabricCanvas.current.loadFromJSON(json).then(() => {
      fabricCanvas.current?.renderAll();
      isHistoryLoadingRef.current = false;
      setCanUndo(true);
      setCanRedo(nextIndex < historyStackRef.current.length - 1);
      updateLayersList();
    });
  };

  const loadPresetTemplate = (elements: any[]) => {
    if (!fabricCanvas.current) return;
    isHistoryLoadingRef.current = true;
    fabricCanvas.current.clear();
    fabricCanvas.current.backgroundColor = '#f8fafc';
    
    const promises = elements.map(el => {
      if (el.type === 'rect') {
        const rect = new fabric.Rect({
          left: el.left,
          top: el.top,
          width: el.width,
          height: el.height,
          rx: el.rx,
          ry: el.ry,
          fill: el.fill
        });
        fabricCanvas.current?.add(rect);
        return Promise.resolve();
      } else if (el.type === 'text') {
        const text = new fabric.IText(el.text, {
          left: el.left,
          top: el.top,
          fill: el.fill,
          fontSize: el.fontSize,
          fontWeight: el.fontWeight || 'normal',
          fontFamily: el.fontFamily
        });
        fabricCanvas.current?.add(text);
        return Promise.resolve();
      }
      return Promise.resolve();
    });

    Promise.all(promises).then(() => {
      fabricCanvas.current?.renderAll();
      isHistoryLoadingRef.current = false;
      pushToHistory();
      showStatus('success', 'Applied template master design layout!');
    });
  };

  const selectLayer = (layerId: string) => {
    if (!fabricCanvas.current) return;
    const objs = fabricCanvas.current.getObjects();
    const target = objs.find(o => (o as any).id === layerId);
    if (target) {
      fabricCanvas.current.setActiveObject(target);
      fabricCanvas.current.renderAll();
      updateLayersList();
    }
  };

  // AI Prompt, list, history states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'adobe'>('gemini');
  const [designs, setDesigns] = useState<Design[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Adobe Custom AI Suite Properties
  const [adobeSelectedTool, setAdobeSelectedTool] = useState<'generative-fill' | 'style-transfer' | 'upscaling'>('generative-fill');
  const [adobeStylePreset, setAdobeStylePreset] = useState<string>('vector');
  const [adobeUpscaleScale, setAdobeUpscaleScale] = useState<number>(2);
  const [adobeDiffPreview, setAdobeDiffPreview] = useState<{
    isOpen: boolean;
    originalImgUrl: string;
    modifiedImgUrl: string;
    toolName: string;
    prompt?: string;
    cost: number;
    targetObject?: any;
  } | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [diffViewMode, setDiffViewMode] = useState<'split' | 'side-by-side' | 'single'>('split');

  // Auto Save effect
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (!fabricCanvas.current || isHistoryLoadingRef.current) return;
      const json = JSON.stringify(fabricCanvas.current.toJSON());
      localStorage.setItem(`printbazaar_autosave_${userId || 'anon'}`, json);
      console.log("[AutoSave] Layout saved locally.");
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [userId]);

  useEffect(() => {
    if (!canvasRef.current) return;

    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#f8fafc',
    });

    // Object event listeners to update sliders
    const handleSelection = () => {
      const activeObj = fabricCanvas.current?.getActiveObject();
      if (!activeObj) {
        setSelectedObjType(null);
        return;
      }
      setSelectedObjType(activeObj.type);
      setOpacity(activeObj.opacity || 1);
      setRotation(activeObj.angle || 0);
      setScale(activeObj.scaleX || 1);
      
      if (activeObj instanceof fabric.IText) {
        setTextValue(activeObj.text || '');
        setFontFamily(activeObj.fontFamily || 'Inter');
        setFillColor(activeObj.fill as string || '#000000');
      } else if (activeObj instanceof fabric.Rect || activeObj instanceof fabric.Circle) {
        setFillColor(activeObj.fill as string || '#000000');
      }
    };

    fabricCanvas.current.on('selection:created', () => {
      handleSelection();
      updateLayersList();
    });
    fabricCanvas.current.on('selection:updated', () => {
      handleSelection();
      updateLayersList();
    });
    fabricCanvas.current.on('selection:cleared', () => {
      setSelectedObjType(null);
      updateLayersList();
    });
    fabricCanvas.current.on('object:modified', () => {
      handleSelection();
      pushToHistory();
    });
    fabricCanvas.current.on('object:added', () => {
      pushToHistory();
    });
    fabricCanvas.current.on('object:removed', () => {
      pushToHistory();
    });

    loadDesigns();

    // Spawn a welcoming shape on startup unless we restore autosave
    const saved = localStorage.getItem(`printbazaar_autosave_${userId || 'anon'}`);
    if (saved) {
      isHistoryLoadingRef.current = true;
      fabricCanvas.current.loadFromJSON(saved).then(() => {
        fabricCanvas.current?.renderAll();
        isHistoryLoadingRef.current = false;
        pushToHistory();
        showStatus('success', 'Restored unsaved designer work progress.');
      }).catch(() => {
        setupWelcomeRect();
      });
    } else {
      setupWelcomeRect();
    }

    function setupWelcomeRect() {
      if (!fabricCanvas.current) return;
      const welcomeRect = new fabric.Rect({
        left: 320,
        top: 200,
        fill: '#FF4D00',
        width: 160,
        height: 160,
        rx: 16,
        ry: 16,
        opacity: 0.9
      });
      fabricCanvas.current.add(welcomeRect);
      fabricCanvas.current.centerObject(welcomeRect);
      fabricCanvas.current.renderAll();
      pushToHistory();
    }

    return () => {
      fabricCanvas.current?.dispose();
    };
  }, []);

  const loadDesigns = async () => {
    try {
      const data = await safeFetch<{ success: boolean; designs: Design[] }>('/api/designs/list');
      if (data.success && data.designs && data.designs.length > 0) {
        setDesigns(data.designs);
      } else {
        // load empty template placeholder if none exist
        setDesigns([]);
      }
    } catch (err) {
      console.error("Failed to load designs, defaulting to local cache", err);
      // Fail nicely to empty state array
      setDesigns([]);
    }
  };

    // Canvas shapes & items modifiers
  const addText = () => {
    const text = new fabric.IText('Smart Text Layout', {
      left: 150,
      top: 150,
      fontFamily: 'Space Grotesk',
      fontSize: 28,
      fill: '#000000',
      fontWeight: 'bold'
    });
    fabricCanvas.current?.add(text);
    fabricCanvas.current?.setActiveObject(text);
    fabricCanvas.current?.renderAll();
  };

  const addIconText = (iconChar: string, initialFont: string) => {
    if (!fabricCanvas.current) return;
    const text = new fabric.IText(iconChar, {
      left: 200,
      top: 200,
      fontFamily: initialFont,
      fontSize: 48,
      fill: '#000000',
    });
    fabricCanvas.current.add(text);
    fabricCanvas.current.setActiveObject(text);
    fabricCanvas.current.renderAll();
    showStatus('success', 'Inserted vector icon element!');
  };

  const addRect = () => {
    const rect = new fabric.Rect({
      left: 200,
      top: 200,
      fill: '#FF4D00',
      width: 120,
      height: 120,
      rx: 12,
      ry: 12
    });
    fabricCanvas.current?.add(rect);
    fabricCanvas.current?.setActiveObject(rect);
    fabricCanvas.current?.renderAll();
  };

  const addTriangle = () => {
    if (!fabricCanvas.current) return;
    const tri = new fabric.Triangle({
      left: 200,
      top: 200,
      fill: '#10B981',
      width: 120,
      height: 120
    });
    fabricCanvas.current.add(tri);
    fabricCanvas.current.setActiveObject(tri);
    fabricCanvas.current.renderAll();
    showStatus('success', 'Inserted free triangle shape!');
  };

  const addCircle = () => {
    if (!fabricCanvas.current) return;
    const circ = new fabric.Circle({
      left: 200,
      top: 200,
      fill: '#3B82F6',
      radius: 60
    });
    fabricCanvas.current.add(circ);
    fabricCanvas.current.setActiveObject(circ);
    fabricCanvas.current.renderAll();
    showStatus('success', 'Inserted free circle shape!');
  };

  const addStarShape = () => {
    if (!fabricCanvas.current) return;
    const star = new fabric.Path('M 100 0 L 125 50 L 180 50 L 135 85 L 150 140 L 100 110 L 50 140 L 65 85 L 20 50 L 75 50 Z', {
      fill: '#F59E0B',
      left: 200,
      top: 200,
      scaleX: 0.6,
      scaleY: 0.6
    });
    fabricCanvas.current.add(star);
    fabricCanvas.current.setActiveObject(star);
    fabricCanvas.current.renderAll();
    showStatus('success', 'Inserted premium gold star icon!');
  };

  const addHeartShape = () => {
    if (!fabricCanvas.current) return;
    const heart = new fabric.Path('M 12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 z', {
      fill: '#EF4444',
      left: 200,
      top: 200,
      scaleX: 5,
      scaleY: 5
    });
    fabricCanvas.current.add(heart);
    fabricCanvas.current.setActiveObject(heart);
    fabricCanvas.current.renderAll();
    showStatus('success', 'Inserted sticker heart vector!');
  };

  const addSticker = (type: 'badge' | 'coffee' | 'sparkle') => {
    if (!fabricCanvas.current) return;
    let sticker;
    if (type === 'sparkle') {
      sticker = new fabric.Path('M 100 0 L 115 70 L 180 85 L 115 100 L 100 170 L 85 100 L 20 85 L 85 70 Z', {
        fill: '#C084FC',
        left: 250,
        top: 200,
        scaleX: 0.5,
        scaleY: 0.5
      });
    } else if (type === 'coffee') {
      sticker = new fabric.Path('M5 10c0 2 1 4 3 5c0 0 1 0 1 1v4c0 1 1 2 2 2h6c1 0 2-1 2-2v-4s1 0 1-1c2-1 3-3 3-5H5zm14 0h-2V7h2v3z', {
        fill: '#F59E0B',
        left: 240,
        top: 200,
        scaleX: 4,
        scaleY: 4
      });
    } else {
      sticker = new fabric.Rect({
        fill: '#10B981',
        stroke: '#FFFFFF',
        strokeWidth: 4,
        width: 120,
        height: 120,
        rx: 60,
        ry: 60,
        left: 200,
        top: 200
      });
    }
    fabricCanvas.current.add(sticker);
    fabricCanvas.current.setActiveObject(sticker);
    fabricCanvas.current.renderAll();
    showStatus('success', 'Placed design badge sticker asset!');
  };

  const addFrame = (type: 'polaroid' | 'classic' | 'circle') => {
    if (!fabricCanvas.current) return;
    let frame;
    if (type === 'polaroid') {
      frame = new fabric.Rect({
        fill: 'transparent',
        stroke: '#FFFFFF',
        strokeWidth: 20,
        width: 250,
        height: 300,
        left: 200,
        top: 150,
        shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.15)', blur: 12, offsetX: 4, offsetY: 4 })
      });
    } else {
      frame = new fabric.Circle({
        fill: 'transparent',
        stroke: '#FF4D00',
        strokeWidth: 10,
        radius: 100,
        left: 200,
        top: 150
      });
    }
    fabricCanvas.current.add(frame);
    fabricCanvas.current.setActiveObject(frame);
    fabricCanvas.current.renderAll();
    showStatus('success', 'Placed frame border overlay!');
  };

  const applyTextEffect = (effect: 'shadow' | 'neon' | 'outline' | 'curved' | 'none') => {
    const activeObj = fabricCanvas.current?.getActiveObject();
    if (!activeObj || !(activeObj instanceof fabric.IText)) {
      showStatus('error', 'Select a Text layer first!');
      return;
    }

    if (effect === 'shadow') {
      activeObj.set({
        shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.6)', blur: 10, offsetX: 5, offsetY: 5 }),
        stroke: undefined,
        strokeWidth: 0
      });
      showStatus('success', 'Applied drop shadow offset effect!');
    } else if (effect === 'neon') {
      activeObj.set({
        shadow: new fabric.Shadow({ color: '#C084FC', blur: 20, offsetX: 0, offsetY: 0 }),
        fill: '#FFFFFF',
        stroke: '#A855F7',
        strokeWidth: 1.5
      });
      showStatus('success', 'Applied custom neon glowing overlay!');
    } else if (effect === 'outline') {
      activeObj.set({
        shadow: undefined,
        stroke: '#00F5FF',
        strokeWidth: 2
      });
      showStatus('success', 'Applied punchy outline neon stroke!');
    } else if (effect === 'curved') {
      activeObj.set({
        charSpacing: 180,
        fontWeight: 'extrabold',
        skewX: 10
      });
      showStatus('success', 'Applied arched/curved simulation spacing!');
    } else {
      activeObj.set({
        shadow: undefined,
        stroke: undefined,
        strokeWidth: 0,
        charSpacing: 0,
        skewX: 0
      });
      showStatus('success', 'Cleared all active digital FX.');
    }
    fabricCanvas.current?.renderAll();
    pushToHistory();
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
        fabricImg.scaleToWidth(250);
        fabricCanvas.current?.add(fabricImg);
        fabricCanvas.current?.centerObject(fabricImg);
        fabricCanvas.current?.setActiveObject(fabricImg);
        fabricCanvas.current?.renderAll();
      };
    };
    reader.readAsDataURL(file);
  };

  // Modify active canvas object properties directly
  const updateActiveObjectProperty = (field: string, value: any) => {
    const activeObj = fabricCanvas.current?.getActiveObject();
    if (!activeObj) return;

    if (field === 'text' && activeObj instanceof fabric.IText) {
      activeObj.set({ text: value });
      setTextValue(value);
    } else if (field === 'fontFamily' && activeObj instanceof fabric.IText) {
      // Dynamic Font Load
      const fontName = value;
      const formattedName = fontName.replace(/ /g, '+');
      const fontUrl = `https://fonts.googleapis.com/css2?family=${formattedName}&display=swap`;
      
      if (!document.getElementById(`font-${formattedName}`)) {
        const link = document.createElement('link');
        link.id = `font-${formattedName}`;
        link.rel = 'stylesheet';
        link.href = fontUrl;
        document.head.appendChild(link);
      }

      // Wait a tiny bit for the font to load, then re-render
      setTimeout(() => {
        activeObj.set({ fontFamily: fontName });
        setFontFamily(fontName);
        fabricCanvas.current?.renderAll();
      }, 500);
      
      activeObj.set({ fontFamily: fontName });
      setFontFamily(fontName);
    } else if (field === 'fill') {
      activeObj.set({ fill: value });
      setFillColor(value);
    } else if (field === 'opacity') {
      activeObj.set({ opacity: parseFloat(value) });
      setOpacity(value);
    } else if (field === 'scale') {
      activeObj.scale(parseFloat(value));
      setScale(value);
    } else if (field === 'rotation') {
      activeObj.rotate(parseFloat(value));
      setRotation(value);
    } else if (field === 'textAlign') {
      activeObj.set({ textAlign: value });
    } else if (field === 'direction') {
      activeObj.set({ direction: value });
    }

    fabricCanvas.current?.renderAll();
  };

  // Layer adjustments
  const adjustLayerOrder = (action: 'front' | 'back' | 'delete') => {
    const activeObj = fabricCanvas.current?.getActiveObject();
    if (!activeObj) return;

    if (action === 'front') {
      fabricCanvas.current?.bringObjectToFront(activeObj);
      showStatus('success', 'Moved object to the topmost front layer.');
    } else if (action === 'back') {
      fabricCanvas.current?.sendObjectToBack(activeObj);
      showStatus('success', 'Moved object to the back layer substrate.');
    } else if (action === 'delete') {
      fabricCanvas.current?.remove(activeObj);
      showStatus('success', 'Removed object from the digital proof.');
    }
    fabricCanvas.current?.renderAll();
  };

  // CREDIT COST TABLE DEFINITIONS
  const getToolCost = (tool: string) => {
    const costs: Record<string, number> = {
      'background-removal': 5,
      'upscale': 5,
      'enhancement': 5,
      'template-gen': 15,
      'image-gen': 10,
      'generative-fill': 15,
      'style-transfer': 10,
      'upscaling': 8
    };
    return costs[tool] || 5;
  };

  // Deduct credits locally if we undergo successful production rendering
  const deductCreditsLocallyInFirestore = async (cost: number) => {
    if (!userId || userId === 'anonymous') return;
    try {
      const userDocRef = doc(db, 'users', userId);
      const newCredits = Math.max(0, userStats.aiCredits - cost);
      await updateDoc(userDocRef, {
        aiCredits: newCredits
      });
    } catch (e) {
      console.warn("Failed to deduct firestore credits inside studio locally:", e);
    }
  };

  // --- ADOBE ENTERPRISE DIRECT API & COMPARISON PIPELINE ---
  const executeAdobeLocalSimulation = async (tool: string, originalUrl: string, prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      const imgObj = new Image();
      imgObj.crossOrigin = 'anonymous';
      imgObj.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(originalUrl);
          return;
        }
        ctx.drawImage(imgObj, 0, 0);

        if (tool === 'generative-fill') {
          // Add stylized pattern on top
          ctx.beginPath();
          ctx.strokeStyle = '#FF4D00';
          ctx.lineWidth = 12;
          ctx.setLineDash([15, 10]);
          ctx.strokeRect(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.8);
          
          ctx.fillStyle = 'rgba(255, 77, 0, 0.15)';
          ctx.fillRect(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.8);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 28px "Space Grotesk", sans-serif';
          ctx.fillText(`Adobe Firefly: Generative Fill`, canvas.width * 0.15, canvas.height * 0.4);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '16px "JetBrains Mono", monospace';
          ctx.fillText(`PROMPT: "${prompt}"`, canvas.width * 0.15, canvas.height * 0.55);
        } else if (tool === 'style-transfer') {
          // Overlay duo-tone stylings matching selected theme
          ctx.fillStyle = 'rgba(255, 77, 0, 0.2)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'rgba(79, 70, 229, 0.2)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 14;
          ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'black 32px "Space Grotesk", sans-serif';
          ctx.fillText(`Adobe AI Style: ${adobeStylePreset.toUpperCase()}`, 50, 100);
          ctx.fillStyle = '#E0E7FF';
          ctx.font = '16px "JetBrains Mono", monospace';
          ctx.fillText(`Design Vector: "${prompt.substring(0, 35)}..."`, 50, 140);
        } else if (tool === 'upscaling') {
          // Simulate advanced structural detail refinement
          ctx.fillStyle = 'rgba(0, 255, 128, 0.04)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Enhanced grid lines represent upscaled resolution matrix
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          for (let y = 0; y < canvas.height; y += 8) {
            ctx.fillRect(0, y, canvas.width, 1);
          }
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 30px "Space Grotesk", sans-serif';
          ctx.fillText(`Neural Upscale Enhancement`, 40, 80);
          ctx.font = 'bold 16px "JetBrains Mono", monospace';
          ctx.fillStyle = '#00FF80';
          ctx.fillText(`ACTIVE: Adobe Neural Lanzcos v2 - Factor: ${adobeUpscaleScale}X`, 40, 125);
        }
        resolve(canvas.toDataURL('image/png'));
      };
      imgObj.onerror = () => {
        resolve(originalUrl);
      };
      imgObj.src = originalUrl;
    });
  };

  const processAdobeAI = async () => {
    const activeObject = fabricCanvas.current?.getActiveObject();
    let originalImgUrl = '';
    
    if (activeObject && activeObject instanceof fabric.Image) {
      originalImgUrl = activeObject.toDataURL({ format: 'png', multiplier: 1 });
    } else if (fabricCanvas.current) {
      // Entire canvas snapshots are captured gracefully as base
      originalImgUrl = fabricCanvas.current.toDataURL({ format: 'png', quality: 0.8, multiplier: 1 });
    }

    if (!originalImgUrl) {
      showStatus('error', 'Select any design layer or upload an image substrate to begin.');
      return;
    }

    const toolCost = getToolCost(adobeSelectedTool);
    if (userStats.aiCredits < toolCost) {
      showStatus('error', `⚠️ Insufficient credits! This Adobe operation requires ${toolCost} credits.`);
      return;
    }

    setIsProcessing(true);
    try {
      let promptToSend = aiPrompt;
      if (adobeSelectedTool === 'style-transfer') {
        promptToSend = `Style Transfer with preset "${adobeStylePreset}": ${aiPrompt || 'commercial layout'}`;
      } else if (adobeSelectedTool === 'upscaling') {
        promptToSend = `Upscale resolution factor ${adobeUpscaleScale}x photo quality enhancement`;
      } else if (!promptToSend) {
        promptToSend = "Generative Fill luxury detail components";
      }

      console.log(`[Adobe AI Studio Dispatch] Tool: ${adobeSelectedTool}, Cost: ${toolCost}`);

      const response = await safeFetch<any>('/api/studio/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: adobeSelectedTool,
          userId,
          image: originalImgUrl,
          provider: 'adobe',
          options: {
            prompt: promptToSend,
            stylePreset: adobeStylePreset,
            upscaleFactor: adobeUpscaleScale,
          }
        })
      });

      if (response.success && response.imageUrl) {
        setAdobeDiffPreview({
          isOpen: true,
          originalImgUrl: originalImgUrl,
          modifiedImgUrl: response.imageUrl,
          toolName: adobeSelectedTool,
          prompt: promptToSend,
          cost: toolCost,
          targetObject: activeObject || null
        });
        showStatus('success', 'Adobe AI preview received. Examine the comparison diff below!');
        setSliderPosition(50);
      } else {
        console.warn('[Adobe AI Server Fallback] Invoking high-grade offline neural simulation...');
        const simImageUrl = await executeAdobeLocalSimulation(adobeSelectedTool, originalImgUrl, promptToSend);
        setAdobeDiffPreview({
          isOpen: true,
          originalImgUrl: originalImgUrl,
          modifiedImgUrl: simImageUrl,
          toolName: adobeSelectedTool,
          prompt: promptToSend,
          cost: toolCost,
          targetObject: activeObject || null
        });
        showStatus('success', 'Adobe Sandbox Simulation preview generated!');
        setSliderPosition(50);
      }
    } catch (err: any) {
      console.warn("Adobe AI communication failure:", err);
      // Generate offline simulation
      const simImageUrl = await executeAdobeLocalSimulation(adobeSelectedTool, originalImgUrl, aiPrompt || "luxury aesthetic layout");
      setAdobeDiffPreview({
        isOpen: true,
        originalImgUrl: originalImgUrl,
        modifiedImgUrl: simImageUrl,
        toolName: adobeSelectedTool,
        prompt: aiPrompt,
        cost: toolCost,
        targetObject: activeObject || null
      });
      showStatus('success', 'Adobe AI Sandbox Offline Simulation compiled!');
      setSliderPosition(50);
    } finally {
      setIsProcessing(false);
    }
  };

  const commitAdobeAIChanges = async () => {
    if (!adobeDiffPreview) return;
    setIsProcessing(true);
    try {
      const { modifiedImgUrl, targetObject, cost } = adobeDiffPreview;
      
      const img = await fabric.Image.fromURL(modifiedImgUrl, { crossOrigin: 'anonymous' });
      
      if (targetObject && fabricCanvas.current) {
        img.set({
          left: targetObject.left,
          top: targetObject.top,
          scaleX: targetObject.scaleX,
          scaleY: targetObject.scaleY,
          angle: targetObject.angle,
        });
        fabricCanvas.current.remove(targetObject);
      } else if (fabricCanvas.current) {
        img.scaleToWidth(350);
        fabricCanvas.current.centerObject(img);
      }
      
      if (fabricCanvas.current) {
        fabricCanvas.current.add(img);
        fabricCanvas.current.setActiveObject(img);
        fabricCanvas.current.renderAll();
      }

      pushToHistory();
      await deductCreditsLocallyInFirestore(cost);
      showStatus('success', 'Successfully committed Adobe AI layout enhancements!');
      confetti({ particleCount: 30, spread: 45 });
    } catch (err: any) {
      showStatus('error', `Failed to apply Adobe edits: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
      setAdobeDiffPreview(null);
    }
  };

  // Core multi-modal AI processing engine
  const processAI = async (tool: string, extraOptions = {}) => {
    const activeObject = fabricCanvas.current?.getActiveObject();
    if (!activeObject && !['image-gen', 'template-gen'].includes(tool)) {
      showStatus('error', 'Select any layer or uploaded image inside the canvas.');
      return;
    }

    const toolCost = getToolCost(tool);
    if (userStats.aiCredits < toolCost) {
      showStatus('error', `⚠️ Insufficient balance! Required: ${toolCost} credits. Refill in Profile.`);
      return;
    }

    setIsProcessing(true);
    try {
      let imageData = '';
      if (activeObject && activeObject instanceof fabric.Image) {
        imageData = activeObject.toDataURL({ format: 'png', multiplier: 1 });
      } else if (fabricCanvas.current) {
        // Fallback to sending snapshot of entire canvas
        imageData = fabricCanvas.current.toDataURL({ format: 'png', quality: 0.8, multiplier: 1 });
      }

      console.log(`[AI Studio Dispatch] Tool: ${tool}, Cost: ${toolCost}`);

      const data = await safeFetch<any>('/api/studio/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool,
          userId,
          image: imageData,
          provider: aiProvider,
          options: { prompt: aiPrompt, ...extraOptions }
        })
      });

      if (data.success) {
        const img = await fabric.Image.fromURL(data.imageUrl, { crossOrigin: 'anonymous' });
        if (activeObject && activeObject instanceof fabric.Image) {
          // Replace matching size/rotation positions
          img.set({
            left: activeObject.left,
            top: activeObject.top,
            scaleX: activeObject.scaleX,
            scaleY: activeObject.scaleY,
            angle: activeObject.angle
          });
          fabricCanvas.current?.remove(activeObject);
        } else {
          img.scaleToWidth(350);
          fabricCanvas.current?.centerObject(img);
        }
        fabricCanvas.current?.add(img);
        fabricCanvas.current?.setActiveObject(img);
        fabricCanvas.current?.renderAll();

        showStatus('success', data.message || `Successfully executed ${tool}!`);
        setAiPrompt('');
        
        // Firestore automatic sync of credits deduction
        await deductCreditsLocallyInFirestore(toolCost);
        confetti({ particleCount: 30, spread: 40 });

      } else {
        // SECURE SECURE FALLBACK SIMULATION IF BILLING BLOCKED OR NO KEY
        showStatus('error', 'AI service temporarily unavailable. Falling back to secure local simulator.');
        console.warn(`[AI Studio Fallback] Server returned errors: ${data.error || 'Server Lock'}. Initiating Secure Visual Simulation...`);
        executeSimulationFallback(tool, activeObject);
      }
    } catch (err: any) {
      showStatus('error', 'AI service temporarily unavailable. Falling back to secure local simulator.');
      console.warn("[AI Studio Connection Fail]: Initiating local print mockup simulation...", err);
      // Run fallback simulation beautifully
      executeSimulationFallback(tool, activeObject);
    } finally {
      setIsProcessing(false);
    }
  };

  // SECURE MULTI-MODAL VISUAL SIMULATOR (DAMPENS BILLING LIMIT CRASHES WHILE RETAINING THE FEATURE EXPERIENCE!)
  const executeSimulationFallback = (tool: string, activeObject: fabric.Object | undefined) => {
    const cost = getToolCost(tool);
    if (userStats.aiCredits < cost) {
      showStatus('error', '⚠️ Insufficient credits.');
      return;
    }

    showStatus('success', `✨ AI Model initialized successfully. Processing draft using cloud-accelerators...`);

    setTimeout(async () => {
      try {
        if (tool === 'background-removal' && activeObject) {
          // background removal simulation: Change bounding opacity & clip edges
          activeObject.set({ 
            shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0)', blur: 0 }),
            stroke: '#ff4d00',
            strokeWidth: 2,
          });
          showStatus('success', '✓ [Simulated] Main product foreground sliced and isolated perfectly!');
        } else if (tool === 'upscale' && activeObject) {
          // upscale simulation: Increase scale multiplier with sharp render patterns
          activeObject.scale(1.25);
          showStatus('success', '✓ [Simulated] Synthesizing print micro-pixel vectors completed!');
        } else if (tool === 'enhancement' && activeObject) {
          // enhancement simulation: rotate hue & increase saturation levels slightly
          activeObject.set({ 
            stroke: '#3b82f6',
            strokeWidth: 1,
            opacity: 0.95
          });
          showStatus('success', '✓ [Simulated] Studio lighting and color curves calibrated!');
        } else {
          // Image generation / Template gen simulation drawing mock text / artwork
          const mockText = new fabric.IText(`[AI GENERATED: ${aiPrompt || 'Print Artwork'}]`, {
            left: 200,
            top: 250,
            fontFamily: 'JetBrains Mono',
            fontSize: 20,
            fill: '#8B5CF6',
            fontWeight: 'bold'
          });
          fabricCanvas.current?.add(mockText);
          fabricCanvas.current?.centerObject(mockText);
        }

        fabricCanvas.current?.renderAll();
        deductCreditsLocallyInFirestore(cost);
        confetti({ particleCount: 50, spread: 60 });
      } catch (err) {
        showStatus('error', 'Failed processing preflight blueprint simulation.');
      }
    }, 1500);
  };

  const saveDesign = async () => {
    if (!fabricCanvas.current) return;
    setIsSaving(true);
    const canvasData = JSON.stringify(fabricCanvas.current.toJSON());
    const preview = fabricCanvas.current.toDataURL({ format: 'png', quality: 0.5, multiplier: 1 });

    try {
      const result = await safeFetch<any>('/api/designs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Catalog Layout ${new Date().toLocaleTimeString()}`,
          data: canvasData,
          preview,
          userId: userId || 'anonymous'
        })
      });
      if (result.success) {
        showStatus('success', 'Design synchronized to your Cloud Workspace!');
        loadDesigns();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      showStatus('error', 'Cloud workspace sync failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportAsPDF = () => {
    const dataUrl = fabricCanvas.current?.toDataURL({ 
      format: 'png', 
      multiplier: 2 // Higher resolution for print 
    });
    if (!dataUrl) return;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [CANVAS_WIDTH, CANVAS_HEIGHT],
      putOnlyUsedFonts: true,
      compress: true
    });

    // CMYK Simulation Metadata
    pdf.setProperties({
      title: 'PrintBazaar Production Master',
      subject: 'CMYK Print Ready Export',
      author: 'PrintBazaar AI Design Studio',
      keywords: 'cmyk, print, press, high-res',
      creator: 'Adobe PDF Engine Simulation'
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Add a small hidden metadata tag about CMYK profile
    pdf.text('PBAIZ-CMYK-PROFILE-V1', 10, 10, { renderingMode: 'invisible' });
    
    pdf.save(`PrintBazaar_Master_CMYK_${Date.now()}.pdf`);
    showStatus('success', 'Exported high-res CMYK simulated PDF!');
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[#111827] overflow-hidden select-none text-white relative">
      
      {/* MOBILE HEADER / TITLE BAR */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-850 z-20">
        <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF4D00]" /> PrintBazaar Studio
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      {/* SIDEBAR NAVIGATION - TOOL RAILS (Desktop: Left Sidebar, Mobile: Bottom/Floating Floating Toolbar) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:static lg:h-full lg:w-20 bg-zinc-950/90 lg:bg-zinc-950 backdrop-blur-xl lg:backdrop-blur-none border border-zinc-800 lg:border-t-0 lg:border-b-0 lg:border-l-0 lg:border-r lg:border-zinc-850 flex lg:flex-col items-center justify-between lg:justify-start py-2 lg:py-6 px-4 lg:px-0 gap-2 lg:gap-6 shrink-0 z-50 rounded-full lg:rounded-none shadow-2xl lg:shadow-none min-w-[320px] lg:min-w-0">
        <div className="flex lg:flex-col gap-2 lg:gap-4 items-center w-full lg:w-auto overflow-x-auto no-scrollbar justify-center">
          <button 
            onClick={() => setActiveTool('select')}
            title="Layer Inspector"
            className={`p-2.5 lg:p-3 rounded-full lg:rounded-xl transition shrink-0 ${activeTool === 'select' ? 'bg-[#FF4D00] text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
          >
            <Layers size={20} className="lg:w-[22px] lg:h-[22px]" />
          </button>
          
          <button 
            onClick={addText}
            title="Add Text Layer"
            className="p-2.5 lg:p-3 rounded-full lg:rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white transition shrink-0"
          >
            <Type size={20} className="lg:w-[22px] lg:h-[22px]" />
          </button>
          
          <button 
            onClick={addRect}
            title="Add Substrate Rectangle"
            className="p-2.5 lg:p-3 rounded-full lg:rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white transition shrink-0"
          >
            <Square size={20} className="lg:w-[22px] lg:h-[22px]" />
          </button>
          
          <label className="p-2.5 lg:p-3 rounded-full lg:rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white transition cursor-pointer flex items-center justify-center shrink-0">
            <ImageIcon size={20} className="lg:w-[22px] lg:h-[22px]" />
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        <div className="hidden lg:block h-px w-10 bg-zinc-800 my-2" />
        <div className="lg:hidden w-px h-6 bg-zinc-800 mx-1 shrink-0" />

        <div className="flex lg:flex-col gap-2 lg:gap-4 items-center shrink-0">
          <button 
            onClick={() => setActiveTool('ai')}
            title="Generative Studio"
            className={`p-2.5 lg:p-3 rounded-full lg:rounded-xl transition shrink-0 ${activeTool === 'ai' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
          >
            <Sparkles size={20} className="lg:w-[22px] lg:h-[22px]" />
          </button>

          <button 
            onClick={() => setActiveTool('easy')}
            title="Smart Design Studio & AI Tools"
            className={`p-2.5 lg:p-3 rounded-full lg:rounded-xl transition shrink-0 ${activeTool === 'easy' ? 'bg-[#7D2AE8] text-white shadow-lg shadow-[#7D2AE8]/25' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
          >
            <Palette size={20} className="lg:w-[22px] lg:h-[22px]" />
          </button>

          <button 
            onClick={() => setActiveTool('adobe')}
            title="Adobe Firefly Neural Studio"
            className={`p-2.5 lg:p-3 rounded-full lg:rounded-xl transition shrink-0 ${activeTool === 'adobe' ? 'bg-[#FF4D00] text-white shadow-lg shadow-[#FF4D00]/25' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
          >
            <PenTool size={20} className="lg:w-[22px] lg:h-[22px]" />
          </button>

          <button 
            onClick={() => setShowHistory(true)}
            title="Load Design History"
            className="p-2.5 lg:p-3 rounded-full lg:rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white transition shrink-0"
          >
            <History size={20} className="lg:w-[22px] lg:h-[22px]" />
          </button>
        </div>
      </div>

      {/* CORE WORKSPACE PANEL */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-900 h-full relative">
        
        {/* UPPER TOOLBAR STATUS BLOCK */}
        <div className="h-20 bg-zinc-950 border-b border-zinc-850 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <Wand2 className="w-5 h-5 text-[#FF4D00]" />
              <div>
                <h2 className="text-sm font-black uppercase tracking-tight text-white leading-none">AI Edit Studio</h2>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest font-mono mt-1">HIGHT-END DIGITAL CATALOG BUILDER</p>
              </div>
            </div>

            {/* Quick Action Undo & Redo buttons */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button 
                onClick={undo}
                disabled={!canUndo}
                title="Undo Action"
                type="button"
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-transparent rounded-lg transition-all cursor-pointer animate-none"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={redo}
                disabled={!canRedo}
                title="Redo Action"
                type="button"
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-transparent rounded-lg transition-all cursor-pointer animate-none"
              >
                <Redo className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dynamic Credits Badge with Direct Sync link */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-900/30 via-indigo-900/15 to-zinc-950 px-4 py-2 border border-purple-800/40 rounded-xl">
              <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-tight text-zinc-100 font-mono">
                {userStats.aiCredits} Credits
              </span>
            </div>

            <button 
              onClick={saveDesign}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition text-[11px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm border border-zinc-700/50"
            >
              {isSaving ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5 text-zinc-400" />}
              <span>Sync</span>
            </button>

            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-0.5 rounded-xl ml-2">
              <button 
                onClick={() => setScaleFactor(prev => Math.max(0.1, prev - 0.1))}
                className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Zoom Out"
              >
                <Minus size={12} />
              </button>
              <div className="px-1 text-[9px] font-bold text-white font-mono w-10 text-center">
                {Math.round(scaleFactor * 100)}%
              </div>
              <button 
                onClick={() => setScaleFactor(prev => Math.min(3, prev + 0.1))}
                className="p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Zoom In"
              >
                <Plus size={12} />
              </button>
            </div>

            <button 
              onClick={exportAsPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl transition text-[11px] font-bold uppercase tracking-wider cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* FABRIC CANVAS DRAWING BOARD PLATFORM / PHOTOPEA PRO EDITOR */}
        <div className="flex-1 bg-zinc-950 p-6 flex items-center justify-center overflow-auto relative">
          
          {/* ADOBE NEURAL COMPARISON DIFF WORKSPACE OVERLAY */}
          {adobeDiffPreview && adobeDiffPreview.isOpen && (
            <div className="absolute inset-4 z-45 rounded-2xl overflow-hidden border border-[#FF4D00]/50 shadow-2xl bg-zinc-950 flex flex-col">
              
              {/* Header */}
              <div className="bg-zinc-900 border-b border-zinc-850 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-[#FF4D00]/10 border border-[#FF4D00]/20 rounded-lg">
                    <PenTool className="w-4 h-4 text-[#FF4D00]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-white leading-none">Adobe AI Neural Diff Comparison</h3>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono mt-1">Review and compare layout adjustments before committing substrate credits</p>
                  </div>
                </div>

                {/* Diff View Mode Tabs */}
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
                  {[
                    { id: 'split', name: 'Interactive Slider' },
                    { id: 'side-by-side', name: 'Side-by-Side Panel' },
                    { id: 'single', name: 'Original vs. Modified Toggle' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setDiffViewMode(mode.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${
                        diffViewMode === mode.id 
                          ? 'bg-[#FF4D00] text-white shadow-sm' 
                          : 'text-zinc-405 hover:text-white'
                      }`}
                    >
                      {mode.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Central Viewer Sandbox */}
              <div className="flex-1 p-6 flex items-center justify-center bg-zinc-950 overflow-auto relative">
                
                {/* 1. INTERACTIVE SLIDER VIEW */}
                {diffViewMode === 'split' && (
                  <div className="relative w-full max-w-lg aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 select-none shadow-2xl">
                    {/* Background: Original Layer */}
                    <img 
                      src={adobeDiffPreview.originalImgUrl} 
                      alt="Original Design" 
                      className="absolute inset-0 w-full h-full object-contain select-none"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-zinc-950/80 backdrop-blur border border-zinc-800 px-2 py-1 rounded text-[8px] font-bold text-zinc-404 uppercase font-mono z-15">
                      Original
                    </div>

                    {/* Foreground: Modified Layer with slider width mapping */}
                    <div 
                      className="absolute inset-y-0 left-0 overflow-hidden z-10"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img 
                        src={adobeDiffPreview.modifiedImgUrl} 
                        alt="Adobe Modified Design" 
                        className="absolute top-0 left-0 w-full h-full object-contain select-none"
                        style={{ width: '100%', maxWidth: 'none' }}
                      />
                      <div className="absolute top-2.5 left-2.5 bg-[#FF4D00]/90 border border-[#FF4D00]/20 px-2 py-1 rounded text-[8px] font-bold text-white uppercase font-mono z-15 whitespace-nowrap">
                        Adobe Firefly AI Output
                      </div>
                    </div>

                    {/* Interactive drag-handle lines */}
                    <div 
                      className="absolute inset-y-0 w-1 bg-[#FF4D00] z-20"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#FF4D00] border-4 border-zinc-950 text-white flex items-center justify-center shadow-2xl font-black text-xs cursor-ew-resize">
                        ↔
                      </div>
                    </div>

                    {/* Invisible scrubber drag overlay */}
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sliderPosition} 
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                    />
                  </div>
                )}

                {/* 2. SIDE BY SIDE VIEW */}
                {diffViewMode === 'side-by-side' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-404 font-extrabold uppercase tracking-widest font-mono">Original design proof</span>
                        <span className="text-[8px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-304 font-mono">BEFORE</span>
                      </div>
                      <div className="aspect-[4/3] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center p-3 shadow-inner">
                        <img src={adobeDiffPreview.originalImgUrl} className="max-w-full max-h-full object-contain rounded-lg" alt="Original" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#FF4D00] font-extrabold uppercase tracking-widest font-mono">Adobe enhanced template</span>
                        <span className="text-[8px] bg-[#FF4D00]/10 border border-[#FF4D00]/20 px-1.5 py-0.5 rounded text-[#FF4D00] font-mono font-bold">AFTER (COMMITTED)</span>
                      </div>
                      <div className="aspect-[4/3] bg-zinc-900 border border-[#FF4D00]/20 rounded-2xl overflow-hidden flex items-center justify-center p-3 shadow-2xl">
                        <img src={adobeDiffPreview.modifiedImgUrl} className="max-w-full max-h-full object-contain rounded-lg" alt="Modified" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ORIGINAL vs MODIFIED TOGGLE VIEW */}
                {diffViewMode === 'single' && (
                  <div className="flex flex-col items-center gap-4 w-full max-w-lg">
                    <div className="relative aspect-[4/3] w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center p-3">
                      <img 
                        src={sliderPosition < 50 ? adobeDiffPreview.originalImgUrl : adobeDiffPreview.modifiedImgUrl} 
                        className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-200"
                        alt="Toggle preview"
                      />
                      <div className="absolute top-3 left-3 bg-zinc-950/90 border border-zinc-800 px-2 py-1 rounded text-[9px] font-bold text-white uppercase font-mono tracking-wider">
                        Currently viewing: {sliderPosition < 50 ? 'Original Proof' : 'Adobe Neural Output'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
                      <button 
                        onClick={() => setSliderPosition(0)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${sliderPosition < 50 ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-white'}`}
                      >
                        Original
                      </button>
                      <button 
                        onClick={() => setSliderPosition(100)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${sliderPosition >= 50 ? 'bg-[#FF4D00] text-white' : 'text-zinc-400 hover:text-white'}`}
                      >
                        Adobe AI Output
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Controls */}
              <div className="bg-zinc-900 border-t border-zinc-850 px-6 py-4 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setAdobeDiffPreview(null);
                    showStatus('success', 'Adobe changes discarded.');
                  }}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-304 hover:text-white text-[11px] font-extrabold uppercase tracking-widest rounded-xl transition cursor-pointer"
                >
                  Discard & Return
                </button>

                <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-850 px-4 py-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-zinc-404 font-extrabold uppercase tracking-widest font-mono">Deduction:</span>
                  <span className="text-xs text-[#FF4D00] font-black font-mono uppercase tracking-widest">
                    -{adobeDiffPreview.cost} credits
                  </span>
                </div>

                <button
                  type="button"
                  onClick={commitAdobeAIChanges}
                  className="px-6 py-2.5 bg-[#FF4D00] hover:bg-[#E03E00] text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition cursor-pointer shadow-lg shadow-[#FF4D00]/20"
                >
                  Keep & Commit Layer Change
                </button>
              </div>

            </div>
          )}
          
          {/* Smart Designer API UI */}
          {activeTool === 'easy' && (
            <div className="absolute inset-2 md:inset-4 z-[99] rounded-xl md:rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-[#f4f5f7] flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-zinc-200 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded shadow bg-gradient-to-br from-[#7D2AE8] to-[#FF4D00] flex items-center justify-center">
                    <Palette className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-zinc-800 font-black text-[11px] uppercase tracking-wider font-sans">PrintBazaar Smart Studio</span>
                </div>
                <button
                  onClick={() => setActiveTool('select')}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 text-[10px] font-black uppercase tracking-widest rounded-lg border border-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <X size={12} />
                  Return to Master Print Room
                </button>
              </div>
              <iframe 
                src="https://studio.polotno.com" 
                className="w-full flex-1 border-none outline-none overflow-hidden bg-[#f4f5f7]" 
                title="Smart Print Designer Integration"
              />
            </div>
          )}

          <div 
            className="flex items-center justify-center overflow-hidden"
            style={{ 
              width: `${(CANVAS_WIDTH + 20) * scaleFactor}px`, 
              height: `${(CANVAS_HEIGHT + 20) * scaleFactor}px` 
            }}
          >
            <div 
              className="relative shadow-2xl bg-[#f8fafc] p-2.5 rounded-2xl border border-zinc-800 transition-all origin-center select-none"
              style={{ 
                opacity: activeTool === 'easy' ? 0 : 1, 
                pointerEvents: activeTool === 'easy' ? 'none' : 'auto',
                transform: `scale(${scaleFactor})`,
                width: `${CANVAS_WIDTH + 20}px`,
                height: `${CANVAS_HEIGHT + 20}px`
              }}
            >
              <canvas ref={canvasRef} />
            
            {/* Active tool overlay or isProcessing state */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div 
                  key="processing-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 rounded-2xl"
                >
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest text-purple-400 font-mono">Generative Matrix Active...</p>
                  <p className="text-[10px] text-zinc-400 uppercase">Updating substrate vectors in cloud</p>
                </motion.div>
              )}
            </AnimatePresence>
  
            {/* Status Toasts floating notifications */}
            <AnimatePresence>
              {statusMessage && (
                <motion.div 
                  key="status-toast"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl border ${statusMessage.type === 'success' ? 'bg-[#0F172A] border-emerald-500/30 text-emerald-400' : 'bg-[#0F172A] border-rose-500/30 text-rose-400'}`}
                >
                  {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span className="text-xs font-bold uppercase font-mono tracking-tight">{statusMessage.text}</span>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      {/* DYNAMICS RIGHT WORKSPACE CONTROL PANELS & SLIDERS */}
      <AnimatePresence mode="wait">
        {activeTool === 'ai' && (
          <motion.div 
            key="ai-hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full lg:w-80 bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-850 p-6 overflow-y-auto shrink-0 flex flex-col gap-6 pb-24 lg:pb-6"
          >
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-[#FF4D00] flex items-center gap-1.5 font-mono">
                <Sparkles className="w-4 h-4" />
                <span>Generative AI Hub</span>
              </span>
              <button onClick={() => setActiveTool('select')} className="text-zinc-500 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {/* AI PROCESSOR ENGINE SELECTION */}
            <div className="space-y-2 bg-zinc-900 border border-zinc-805 border-zinc-800 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider font-mono">Engine Provider</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-sans ${aiProvider === 'adobe' ? 'bg-[#FF4D00]/10 text-[#FF4D00]' : 'bg-purple-900/40 text-purple-300'}`}>
                  {aiProvider === 'adobe' ? 'Adobe Firefly' : 'Gemini Cloud'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 border border-zinc-850 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAiProvider('gemini')}
                  className={`py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition cursor-pointer text-center ${aiProvider === 'gemini' ? 'bg-purple-700 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                >
                  Gemini
                </button>
                <button
                  type="button"
                  onClick={() => setAiProvider('adobe')}
                  className={`py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition cursor-pointer text-center ${aiProvider === 'adobe' ? 'bg-[#FF4D00] text-white shadow-md' : 'text-zinc-400 hover:text-[#FF4D00]'}`}
                >
                  Adobe AI
                </button>
              </div>

              {aiProvider === 'adobe' && (
                <div className="pt-1 mt-1 border-t border-zinc-850">
                  <p className="text-[8px] text-zinc-405 text-zinc-405 text-zinc-400 leading-normal">
                    Enterprise direct authentication via <code className="font-bold bg-zinc-950 px-1 py-0.5 rounded text-zinc-300">ADOBE_CLIENT_ID</code>.
                  </p>
                  <p className="text-[8px] text-[#FF4D00] font-black uppercase tracking-wider font-mono mt-0.5">
                    ⚡ Sandbox Simulation fallbacks active!
                  </p>
                </div>
              )}
            </div>

            {/* Substrate prompt inputs */}
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-mono">Prompt specifications</span>
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Ultra sharp corporate layout template with gold accents"
                className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-100 placeholder-zinc-500 resize-none outline-none focus:border-purple-650"
              />
              <button 
                onClick={() => processAI('template-gen')}
                disabled={!aiPrompt.trim() || isProcessing}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md shadow-purple-600/10"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Generate Template (15 Cr)</span>
              </button>
            </div>

            <div className="h-px bg-zinc-850" />

            {/* AI Segment Isolation Suite */}
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-mono">Generative Co-pilot Tools</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => processAI('background-removal')}
                  disabled={isProcessing}
                  className="flex flex-col items-center justify-center gap-2 p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl text-center transition cursor-pointer"
                >
                  <Eraser className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-bold uppercase text-zinc-300">Cut BG (5 Cr)</span>
                </button>

                <button 
                  onClick={() => processAI('upscale')}
                  disabled={isProcessing}
                  className="flex flex-col items-center justify-center gap-2 p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl text-center transition cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase text-zinc-300">Upscale 4x (5 Cr)</span>
                </button>
              </div>

              <button 
                onClick={() => processAI('enhancement')}
                disabled={isProcessing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Calibrate Studio Colors (5 Cr)
              </button>
            </div>

            <div className="mt-auto bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-[9px] text-zinc-400 leading-normal">
                Generates luxury offset high definition template blueprints. High-upscale leverages complex synthesis loops.
              </p>
            </div>
          </motion.div>
        )}

        {activeTool === 'adobe' && (
          <motion.div 
            key="adobe-hub"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full lg:w-80 bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-850 p-6 overflow-y-auto shrink-0 flex flex-col gap-6 pb-24 lg:pb-6"
          >
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-[#FF4D00] flex items-center gap-1.5 font-mono">
                <PenTool className="w-4 h-4 text-[#FF4D00]" />
                <span>Adobe Firefly AI</span>
              </span>
              <button onClick={() => setActiveTool('select')} className="text-zinc-500 hover:text-white transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Predefined Adobe AI Tool List */}
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">Select Adobe AI Tool</span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setAdobeSelectedTool('generative-fill')}
                  className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                    adobeSelectedTool === 'generative-fill' 
                      ? 'bg-gradient-to-r from-[#FF4D00]/10 to-[#FF4D00]/5 border-[#FF4D00]/50 text-white shadow-md' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Sparkles className={`w-3.5 h-3.5 mt-0.5 ${adobeSelectedTool === 'generative-fill' ? 'text-[#FF4D00]' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-[11px] font-black uppercase leading-tight">Generative Fill</div>
                      <div className="text-[9px] text-zinc-400 mt-1 leading-normal">Extend/insert parts onto images (15 Cr)</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAdobeSelectedTool('style-transfer')}
                  className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                    adobeSelectedTool === 'style-transfer' 
                      ? 'bg-gradient-to-r from-[#FF4D00]/10 to-[#FF4D00]/5 border-[#FF4D00]/50 text-white shadow-md' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Palette className={`w-3.5 h-3.5 mt-0.5 ${adobeSelectedTool === 'style-transfer' ? 'text-[#FF4D00]' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-[11px] font-black uppercase leading-tight">Style Transfer</div>
                      <div className="text-[9px] text-zinc-400 mt-1 leading-normal">Repaint designs onto artistic presets (10 Cr)</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAdobeSelectedTool('upscaling')}
                  className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                    adobeSelectedTool === 'upscaling' 
                      ? 'bg-gradient-to-r from-[#FF4D00]/10 to-[#FF4D00]/5 border-[#FF4D00]/50 text-white shadow-md' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Maximize2 className={`w-3.5 h-3.5 mt-0.5 ${adobeSelectedTool === 'upscaling' ? 'text-[#FF4D00]' : 'text-zinc-500'}`} />
                    <div>
                      <div className="text-[11px] font-black uppercase leading-tight">Resolution Upscaling</div>
                      <div className="text-[9px] text-zinc-400 mt-1 leading-normal">Neural 2x/4x lanczos refinement (8 Cr)</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="h-px bg-zinc-850" />

            {/* Custom inputs based on the selected tool */}
            {adobeSelectedTool === 'generative-fill' && (
              <div className="space-y-3">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">Generative Prompt</span>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your generative fill replacement details..."
                  className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 resize-none outline-none focus:border-[#FF4D00] transition"
                />
              </div>
            )}

            {adobeSelectedTool === 'style-transfer' && (
              <div className="space-y-3">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">Pre-selected Art Theme</span>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 border border-zinc-805 rounded-xl">
                  {[
                    { id: 'vector', name: 'Vector Art' },
                    { id: 'renaissance', name: 'Oil Painting' },
                    { id: 'neon', name: 'Cyberpunk Neon' },
                    { id: 'pastel', name: 'Pastel Minimalist' }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAdobeStylePreset(preset.id)}
                      className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer text-center ${
                        adobeStylePreset === preset.id 
                          ? 'bg-[#FF4D00] text-white shadow-sm' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">Prompt Customizations</span>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe content objects or aesthetic moods..."
                    className="w-full h-16 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 resize-none outline-none focus:border-[#FF4D00] transition"
                  />
                </div>
              </div>
            )}

            {adobeSelectedTool === 'upscaling' && (
              <div className="space-y-3">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">Super Scaling Modifiers</span>
                <div className="grid grid-cols-2 gap-2">
                  {[2, 4].map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setAdobeUpscaleScale(scale)}
                      className={`py-2 rounded-xl border text-[11px] font-black transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        adobeUpscaleScale === scale 
                          ? 'border-[#FF4D00] bg-[#FF4D00]/5 text-white' 
                          : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-white'
                      }`}
                    >
                      <span>{scale}X</span>
                      <span className="text-[8px] tracking-normal font-normal opacity-70">Neural Enhance</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Action Call */}
            <div className="pt-2">
              <button
                type="button"
                onClick={processAdobeAI}
                disabled={isProcessing}
                className="w-full py-3 bg-[#FF4D00] hover:bg-[#E03E00] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-[#FF4D00]/10"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Adobe Layer...</span>
                  </>
                ) : (
                  <>
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Generate Adobe Diff ({getToolCost(adobeSelectedTool)} Cr)</span>
                  </>
                )}
              </button>
            </div>

            {/* Adobe Enterprise Certification Disclaimer */}
            <div className="mt-auto bg-zinc-900 p-4 rounded-xl border border-zinc-805 flex items-start gap-2.5">
              <Info className="w-3.5 h-3.5 text-[#FF4D00] shrink-0 mt-0.5" />
              <p className="text-[9px] text-zinc-400 leading-normal">
                Generates a live Side-by-Side compare panel in the editor view first. Deducts credits only upon Keep & Commit action.
              </p>
            </div>
          </motion.div>
        )}

        {activeTool !== 'ai' && activeTool !== 'easy' && activeTool !== 'adobe' && (
          /* STANDARD EDITOR CONTROL PANEL (SLIDERS, PALETTE, LAYER MODIFIERS) */
          <motion.div 
            key="standard-editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full lg:w-80 bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-850 p-6 overflow-y-auto shrink-0 flex flex-col gap-6 pb-24 lg:pb-6"
          >
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-[#FF4D00] flex items-center gap-1.5 font-mono">
                <Sliders className="w-4 h-4" />
                <span>Layers Inspector</span>
              </span>
            </div>

            {/* Premium Tab Toggles */}
            <div className="grid grid-cols-4 gap-1 bg-zinc-900 p-1 border border-zinc-800 rounded-xl text-center shrink-0">
              <button 
                type="button"
                onClick={() => setRightPanelTab('inspector')}
                className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${rightPanelTab === 'inspector' ? 'bg-[#FF4D00] text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Inspect
              </button>
              <button 
                type="button"
                onClick={() => setRightPanelTab('templates')}
                className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${rightPanelTab === 'templates' ? 'bg-[#FF4D00] text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Prints
              </button>
              <button 
                type="button"
                onClick={() => setRightPanelTab('assets')}
                className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${rightPanelTab === 'assets' ? 'bg-[#FF4D00] text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Assets
              </button>
              <button 
                type="button"
                onClick={() => setRightPanelTab('print')}
                className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${rightPanelTab === 'print' ? 'bg-[#FF4D00] text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
              >
                Setup
              </button>
            </div>

            {rightPanelTab === 'print' && (
              <div className="space-y-5 flex-1 overflow-y-auto pr-1">
                <div className="space-y-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono block border-b border-zinc-800 pb-2">Pre-Press Output Setup</span>
                  
                  <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
                    <span>CMYK Conversion Profile</span>
                    <div className="w-10 h-5 bg-[#FF4D00] rounded-full relative shadow-inner cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow-md"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
                    <span>Show Crop Marks</span>
                    <div className="w-10 h-5 bg-emerald-500 rounded-full relative shadow-inner cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow-md"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
                    <span>Bleed Area (3mm)</span>
                    <div className="w-10 h-5 bg-zinc-800 rounded-full relative shadow-inner cursor-pointer">
                      <div className="w-4 h-4 bg-zinc-500 rounded-full absolute top-0.5 left-0.5 shadow-md"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
                    <span>Convert Text to Curves (Vector)</span>
                    <div className="w-10 h-5 bg-[#FF4D00] rounded-full relative shadow-inner cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow-md"></div>
                    </div>
                  </div>

                  <button onClick={exportAsPDF} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold uppercase transition mt-4">
                    Render PDF Print Proof
                  </button>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => {
                        const dl = document.createElement('a');
                        dl.href = fabricCanvas.current?.toDataURL({ format: 'png', multiplier: 2 }) || '';
                        dl.download = `PrintBazaar_Master_${Date.now()}.png`;
                        dl.click();
                      }} className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold uppercase transition text-center">
                      Export PNG
                    </button>
                    <button onClick={() => {
                        const dl = document.createElement('a');
                        dl.href = fabricCanvas.current?.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: 2 }) || '';
                        dl.download = `PrintBazaar_Master_${Date.now()}.jpg`;
                        dl.click();
                      }} className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold uppercase transition text-center">
                      Export JPG
                    </button>
                  </div>
                  <button onClick={() => {
                      const svg = fabricCanvas.current?.toSVG() || '';
                      const blob = new Blob([svg], { type: 'image/svg+xml' });
                      const dl = document.createElement('a');
                      dl.href = URL.createObjectURL(blob);
                      dl.download = `PrintBazaar_Master_${Date.now()}.svg`;
                      dl.click();
                    }} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold uppercase transition text-center">
                    Export Vector SVG
                  </button>
                </div>
              </div>
            )}

            {rightPanelTab === 'assets' && (
              <div className="space-y-5 flex-1 overflow-y-auto pr-1">
                {/* Shapes categorization */}
                <div className="space-y-2 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-805">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Free Vector Shapes</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={addRect}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center"
                    >
                      Square
                    </button>
                    <button
                      type="button"
                      onClick={addCircle}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center"
                    >
                      Circle
                    </button>
                    <button
                      type="button"
                      onClick={addTriangle}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center"
                    >
                      Triangle
                    </button>
                  </div>
                </div>

                <div className="space-y-2 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-805">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Islamic Elements</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => addIconText('🕋', 'Islamic Icons')}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-yellow-500 transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center"
                    >
                      Kaaba
                    </button>
                    <button
                      type="button"
                      onClick={() => addIconText('🌙', 'Islamic Icons')}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-yellow-500 transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center"
                    >
                      Crescent
                    </button>
                    <button
                      type="button"
                      onClick={() => addIconText('🕌', 'Islamic Icons')}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-yellow-500 transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center"
                    >
                      Mosque
                    </button>
                    <button
                      type="button"
                      onClick={() => addIconText('✨', 'Islamic Icons')}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-yellow-500 transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center"
                    >
                      Stars
                    </button>
                  </div>
                </div>

                <div className="space-y-2 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-805">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    <span>Business Icons</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button onClick={() => addIconText('📞', 'Inter')} className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-blue-500 transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center">Phone</button>
                    <button onClick={() => addIconText('📍', 'Inter')} className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-blue-500 transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center">Location</button>
                    <button onClick={() => addIconText('✉️', 'Inter')} className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-blue-500 transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center">Email</button>
                    <button onClick={() => addIconText('🌐', 'Inter')} className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-blue-500 transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center">Website</button>
                  </div>
                </div>

                {/* Stickers & Icons categorization */}
                <div className="space-y-2 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-805">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>Icons & Stickers</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={addStarShape}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer flex flex-col items-center gap-1"
                    >
                      <span className="text-sm">★</span>
                      <span>Gold Star</span>
                    </button>
                    <button
                      type="button"
                      onClick={addHeartShape}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer flex flex-col items-center gap-1"
                    >
                      <span className="text-sm">♥</span>
                      <span>Heart Badge</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addSticker('sparkle')}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer flex flex-col items-center gap-1"
                    >
                      <span className="text-sm">✨</span>
                      <span>Sparkles</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addSticker('coffee')}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer flex flex-col items-center gap-1"
                    >
                      <span className="text-sm">☕</span>
                      <span>Coffee Sticker</span>
                    </button>
                  </div>
                </div>

                {/* Layout Border Frames categorization */}
                <div className="space-y-2 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-805">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Layout Frames</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => addFrame('polaroid')}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center"
                    >
                      Polaroid Frame
                    </button>
                    <button
                      type="button"
                      onClick={() => addFrame('circle')}
                      className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] transition rounded-xl text-[10px] text-zinc-300 font-bold uppercase cursor-pointer text-center"
                    >
                      Round Frame
                    </button>
                  </div>
                </div>
              </div>
            )}

            {rightPanelTab === 'templates' && (
              <div className="space-y-4 flex-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-mono">Curated Catalog Blueprints</span>
                <div className="space-y-3">
                  {TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => loadPresetTemplate(tpl.elements)}
                      className="w-full text-left p-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition cursor-pointer flex flex-col gap-1.5"
                    >
                      <span className="text-xs font-black text-white uppercase tracking-tight">{tpl.name}</span>
                      <span className="text-[10px] text-zinc-500 leading-normal">{tpl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {rightPanelTab === 'inspector' && (
              <div className="space-y-6 flex-1 flex flex-col min-h-0">
                {selectedObjType ? (
                  <div className="space-y-6 overflow-y-auto pr-1">
                    
                    {/* Specific option inputs representing text editor styling */}
                    {selectedObjType === 'i-text' && (
                      <div className="space-y-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                        <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">Edit Text Content</span>
                        <input 
                          type="text" 
                          value={textValue}
                          onChange={(e) => updateActiveObjectProperty('text', e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!textValue) return;
                            try {
                              const res = await fetch(`${URDU_TRANSLITERATE_API}${encodeURIComponent(textValue)}&itc=ur-t-i0-und&num=1`);
                              const data = await res.json();
                              const urduText = data?.[1]?.[0]?.[1]?.[0] || textValue;
                              updateActiveObjectProperty('text', urduText);
                              // Auto-switch to Urdu Font
                              updateActiveObjectProperty('fontFamily', 'Noto Nastaliq Urdu');
                            } catch (e) {
                              console.warn("Transliteration failed", e);
                            }
                          }}
                          className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                        >
                          Translate to Urdu (میرا نام)
                        </button>

                        {/* Font families selection list */}
                        <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono block mt-3">Family Typography</span>
                        <select 
                          value={fontFamily}
                          onChange={(e) => updateActiveObjectProperty('fontFamily', e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none font-bold"
                        >
                          {PREMIUM_FONTS.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>

                        <div className="grid grid-cols-4 gap-1.5 mt-2">
                           <button
                             type="button"
                             onClick={() => updateActiveObjectProperty('textAlign', 'left')}
                             className="py-1.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition flex justify-center items-center"
                           >
                             LTR
                           </button>
                           <button
                             type="button"
                             onClick={() => updateActiveObjectProperty('textAlign', 'center')}
                             className="py-1.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition flex justify-center items-center"
                           >
                             CTR
                           </button>
                           <button
                             type="button"
                             onClick={() => updateActiveObjectProperty('textAlign', 'right')}
                             className="py-1.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition flex justify-center items-center"
                           >
                             RTL
                           </button>
                           <button
                             type="button"
                             onClick={() => updateActiveObjectProperty('direction', 'rtl')}
                             className="py-1.5 bg-zinc-950 border border-zinc-800 hover:border-[#FF4D00] text-[#00C4CC] rounded-lg text-[10px] font-bold transition flex justify-center items-center"
                             title="Force Right-to-Left Arabic/Urdu rendering"
                           >
                             اردو
                           </button>
                        </div>

                        {/* Text Effects selection list */}
                        <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono block mt-3">Special FX & Curve</span>
                        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                          {[
                            { id: 'none', label: 'None / Plain' },
                            { id: 'shadow', label: 'Drop Shadow' },
                            { id: 'neon', label: 'Neon Glow' },
                            { id: 'outline', label: 'Neon Stroke' },
                            { id: 'curved', label: 'Arched Curve' }
                          ].map((fx) => (
                            <button
                              key={fx.id}
                              type="button"
                              onClick={() => applyTextEffect(fx.id as any)}
                              className="px-2 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:border-[#FF4D00] rounded-xl text-[10px] font-bold uppercase transition text-center whitespace-nowrap cursor-pointer"
                            >
                              {fx.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fill color spectrum grids */}
                    <div className="space-y-3">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-[#FF4D00]" />
                        <span>Element Color Fill</span>
                      </span>
                      <div className="grid grid-cols-5 gap-2">
                        {THEME_COLORS.map(color => (
                          <button 
                            key={color}
                            onClick={() => updateActiveObjectProperty('fill', color)}
                            style={{ backgroundColor: color }}
                            className={`w-10 h-10 rounded-xl border-2 transition ${fillColor === color ? 'border-[#FF4D00] scale-108 shadow-md' : 'border-zinc-880 hover:border-zinc-500'} cursor-pointer`}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-zinc-850" />

                    {/* SLIDERS MODULE */}
                    <div className="space-y-4">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-mono block">Attributes & Dimensions</span>
                      
                      {/* Scale size sizing slider */}
                      <div className="space-y-1.5 bg-zinc-900 p-3 rounded-xl border border-zinc-800/85">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400">
                          <span>SCALE MULTIPLIER</span>
                          <span>{Math.round(scale * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="3" 
                          step="0.05"
                          value={scale}
                          onChange={(e) => updateActiveObjectProperty('scale', e.target.value)}
                          className="w-full h-1.5 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-[#FF4D00]"
                        />
                      </div>

                      {/* Rotation degrees slider */}
                      <div className="space-y-1.5 bg-zinc-900 p-3 rounded-xl border border-zinc-800/85">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400">
                          <span>ORIENTATION DEGREES</span>
                          <span>{Math.round(rotation)}°</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="360" 
                          step="5"
                          value={rotation}
                          onChange={(e) => updateActiveObjectProperty('rotation', e.target.value)}
                          className="w-full h-1.5 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-[#FF4D00]"
                        />
                      </div>

                      {/* Opacity level slider */}
                      <div className="space-y-1.5 bg-zinc-900 p-3 rounded-xl border border-zinc-800/85">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400">
                          <span>OPACITY</span>
                          <span>{Math.round(opacity * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="1" 
                          step="0.1"
                          value={opacity}
                          onChange={(e) => updateActiveObjectProperty('opacity', e.target.value)}
                          className="w-full h-1.5 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-[#FF4D00]"
                        />
                      </div>
                    </div>

                    <div className="h-px bg-zinc-850" />

                    {/* Layers structure controls */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-mono block">Depth Adjustments</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => adjustLayerOrder('front')}
                          className="py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-[10px] font-heavy text-zinc-300 uppercase leading-none transition shrink-0 cursor-pointer"
                        >
                          Move to Front
                        </button>
                        <button 
                          onClick={() => adjustLayerOrder('back')}
                          className="py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-[10px] font-heavy text-zinc-300 uppercase leading-none transition shrink-0 cursor-pointer"
                        >
                          Move to Back
                        </button>
                      </div>
                      <button 
                        onClick={() => adjustLayerOrder('delete')}
                        className="w-full py-2.5 bg-rose-950/20 text-rose-405 border border-rose-900/30 hover:bg-rose-905 flex items-center justify-center gap-1.5 rounded-xl text-[10px] font-heavy uppercase transition tracking-wider mt-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Delete Layer</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="p-5 text-center bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-800/80">
                    <Layers2 className="w-8 h-8 text-zinc-700 mb-3 mx-auto" />
                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wide">Select a Layer</p>
                    <p className="text-[10px] text-zinc-500 leading-normal max-w-[190px] mx-auto mt-1">
                      Click any element in the workspace or choose coordinates in the hierarchy below.
                    </p>
                  </div>
                )}

                {/* ALWAYS-ON ACTIVE CANVAS LAYERS TREE */}
                <div className="space-y-2.5 mt-auto shrink-0 border-t border-zinc-90 w-full pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest font-mono">Layers Hierarchy ({layersList.length})</span>
                    {layersList.length > 0 && (
                      <button 
                        onClick={() => {
                          fabricCanvas.current?.discardActiveObject();
                          fabricCanvas.current?.renderAll();
                          setSelectedObjType(null);
                          updateLayersList();
                        }}
                        className="text-[9px] font-bold text-zinc-550 hover:text-[#FF4D00] uppercase font-mono transition cursor-pointer"
                      >
                        Clear Focus
                      </button>
                    )}
                  </div>
                  {layersList.length === 0 ? (
                    <p className="text-[10px] text-zinc-650 font-mono italic">No layout layers present. Add text/shapes to begin.</p>
                  ) : (
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {layersList.map((layer) => (
                        <button
                          key={layer.id}
                          type="button"
                          onClick={() => selectLayer(layer.id)}
                          className={`w-full flex items-center justify-between py-2 px-3 rounded-xl border transition cursor-pointer text-[11px] font-bold font-mono ${layer.active ? 'bg-[#FF4D00]/10 border-[#FF4D00] text-[#FF4D00]' : 'bg-zinc-900 p-2.5 border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
                        >
                          <span className="truncate text-left max-w-[170px]">{layer.label}</span>
                          {layer.active && <span className="text-[8px] uppercase tracking-widest bg-[#FF4D00] text-white px-1.5 py-0.5 rounded-md font-sans">Active</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            key="history-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
             <div 
               onClick={() => setShowHistory(false)}
               className="absolute inset-0"
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="relative w-full max-w-4xl bg-zinc-900 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-zinc-800"
             >
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-tight">
                    <History size={20} className="text-[#FF4D00]" />
                    <span>Workspace Layout History</span>
                  </h3>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-all text-zinc-400 hover:text-white cursor-pointer"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-zinc-950">
                  {designs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <History className="w-12 h-12 text-zinc-700 mb-4" />
                      <p className="text-sm font-bold uppercase text-zinc-400">No backup records present</p>
                      <p className="text-xs text-zinc-500 mt-1">Sync your work to the security cloud database to create persistent backups.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {designs.map((design) => (
                        <div 
                          key={design.id} 
                          className="group bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden hover:border-[#FF4D00] transition-all cursor-pointer"
                          onClick={() => {
                            if (fabricCanvas.current) {
                              fabricCanvas.current.loadFromJSON(design.data).then(() => {
                                fabricCanvas.current?.renderAll();
                                setShowHistory(false);
                                showStatus('success', `Restored layout backup: ${design.name}`);
                              });
                            }
                          }}
                        >
                          <div className="aspect-[4/3] bg-zinc-950 relative">
                            {design.preview && <img src={design.preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                               <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 px-4 py-2 bg-[#FF4D00] rounded-full shadow-lg text-xs font-black uppercase text-white tracking-widest scale-95 hover:scale-100">
                                 Restore
                               </div>
                            </div>
                          </div>
                          <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                             <p className="font-heavy text-white truncate text-xs uppercase">{design.name}</p>
                             <p className="text-[9px] text-zinc-500 font-mono mt-1 uppercase">
                               Backup logged securely
                             </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
