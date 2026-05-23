'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Download, Upload, Save, HelpCircle, 
  RotateCw, Plus, Check, Settings, Type, Layout, 
  FileText, Square, CheckSquare, Sparkles, AlertCircle
} from 'lucide-react';
import { CustomTemplateConfig, TemplateElement, compressCustomTemplate } from '../../utils/compressor';

export const PREMIUM_FONTS = [
  'Outfit',
  'Space Grotesk',
  'Playfair Display',
  'Inter',
  'Fira Code',
  'Bungee',
  'Montserrat',
  'Lora',
  'Cinzel',
  'Rubik Mono One'
];

export function loadGoogleFont(fontName: string) {
  if (typeof window === 'undefined') return;
  const id = `gfont-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

// Dimensions in pixels (for workspace preview display)
const CARD_PORTRAIT_W = 270;
const CARD_PORTRAIT_H = 428;
const CARD_LANDSCAPE_W = 428;
const CARD_LANDSCAPE_H = 270;

const DEFAULT_PORTRAIT_ELEMENTS = {
  school: { x: 5, y: 3, w: 90, h: 8, fontSize: 10, color: '#1e3a5f', align: 'center' as const, bold: true, italic: false, enabled: true, side: 'front' as const },
  avatar: { x: 28, y: 15, w: 44, h: 28, enabled: true, side: 'front' as const },
  name: { x: 5, y: 46, w: 90, h: 6, fontSize: 12, color: '#111827', align: 'center' as const, bold: true, italic: false, enabled: true, side: 'front' as const },
  role: { x: 30, y: 53, w: 40, h: 4, fontSize: 7, color: '#ffffff', align: 'center' as const, bold: true, italic: false, enabled: true, side: 'front' as const },
  idNumber: { x: 10, y: 60, w: 80, h: 5, fontSize: 9, color: '#374151', align: 'center' as const, bold: true, italic: false, enabled: true, side: 'front' as const },
  grade: { x: 10, y: 66, w: 80, h: 5, fontSize: 9, color: '#374151', align: 'center' as const, bold: false, italic: false, enabled: true, side: 'front' as const },
  phone: { x: 10, y: 30, w: 80, h: 5, fontSize: 8, color: '#4b5563', align: 'center' as const, bold: false, italic: false, enabled: false, side: 'back' as const },
  email: { x: 10, y: 40, w: 80, h: 5, fontSize: 8, color: '#4b5563', align: 'center' as const, bold: false, italic: false, enabled: false, side: 'back' as const },
  bloodGroup: { x: 10, y: 50, w: 80, h: 5, fontSize: 8, color: '#dc2626', align: 'center' as const, bold: true, italic: false, enabled: false, side: 'back' as const },
  qrCode: { x: 38, y: 15, w: 24, h: 15, enabled: false, side: 'back' as const },
  barcode: { x: 25, y: 80, w: 50, h: 8, enabled: false, side: 'front' as const },
  signature: { x: 35, y: 70, w: 30, h: 8, enabled: false, side: 'back' as const },
  schoolLogo: { x: 42, y: 12, w: 16, h: 10, enabled: false, side: 'front' as const },
};

const DEFAULT_LANDSCAPE_ELEMENTS = {
  school: { x: 3, y: 4, w: 94, h: 10, fontSize: 11, color: '#1e3a5f', align: 'center' as const, bold: true, italic: false, enabled: true, side: 'front' as const },
  avatar: { x: 8, y: 20, w: 28, h: 44, enabled: true, side: 'front' as const },
  name: { x: 40, y: 22, w: 52, h: 8, fontSize: 13, color: '#111827', align: 'left' as const, bold: true, italic: false, enabled: true, side: 'front' as const },
  role: { x: 40, y: 32, w: 25, h: 6, fontSize: 7, color: '#ffffff', align: 'center' as const, bold: true, italic: false, enabled: true, side: 'front' as const },
  idNumber: { x: 40, y: 42, w: 52, h: 6, fontSize: 9, color: '#374151', align: 'left' as const, bold: true, italic: false, enabled: true, side: 'front' as const },
  grade: { x: 40, y: 50, w: 52, h: 6, fontSize: 9, color: '#374151', align: 'left' as const, bold: false, italic: false, enabled: true, side: 'front' as const },
  phone: { x: 10, y: 30, w: 80, h: 6, fontSize: 8, color: '#4b5563', align: 'left' as const, bold: false, italic: false, enabled: false, side: 'back' as const },
  email: { x: 10, y: 42, w: 80, h: 6, fontSize: 8, color: '#4b5563', align: 'left' as const, bold: false, italic: false, enabled: false, side: 'back' as const },
  bloodGroup: { x: 10, y: 54, w: 80, h: 6, fontSize: 8, color: '#dc2626', align: 'left' as const, bold: true, italic: false, enabled: false, side: 'back' as const },
  qrCode: { x: 80, y: 25, w: 15, h: 24, enabled: false, side: 'back' as const },
  barcode: { x: 8, y: 70, w: 28, h: 10, enabled: false, side: 'front' as const },
  signature: { x: 72, y: 70, w: 22, h: 12, enabled: false, side: 'back' as const },
  schoolLogo: { x: 8, y: 70, w: 12, h: 12, enabled: false, side: 'front' as const },
};

export default function TemplateDesignerClient() {
  const router = useRouter();
  const [templateName, setTemplateName] = useState('My Custom Template');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [frontBg, setFrontBg] = useState<string>('');
  const [backBg, setBackBg] = useState<string>('');
  const [elements, setElements] = useState<any>(DEFAULT_PORTRAIT_ELEMENTS);
  
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; fieldX: number; fieldY: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; fieldW: number; fieldH: number } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load Google Fonts for any active elements dynamically
  useEffect(() => {
    Object.keys(elements).forEach(key => {
      const el = elements[key];
      if (el.enabled && el.fontFamily) {
        loadGoogleFont(el.fontFamily);
      }
    });
  }, [elements]);

  // Load all premium fonts at startup so the selector has previews
  useEffect(() => {
    PREMIUM_FONTS.forEach(font => loadGoogleFont(font));
  }, []);

  const handleExportTemplate = () => {
    try {
      const templateData = {
        version: "1.0",
        name: templateName,
        orientation,
        themeColor: elements.school?.color || '#1e3a5f',
        frontBg,
        backBg,
        elements
      };
      const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-layout.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Failed to export template: ' + e.message);
    }
  };

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = JSON.parse(text);

        if (!imported.name || !imported.orientation || !imported.elements) {
          throw new Error('Missing core template properties (name, orientation, or elements)');
        }

        if (typeof imported.elements !== 'object') {
          throw new Error('Elements property must be an object representing the layout placeholders');
        }

        setTemplateName(imported.name);
        setOrientation(imported.orientation);
        setFrontBg(imported.frontBg || '');
        setBackBg(imported.backBg || '');
        
        const mergedElements = {
          ...(imported.orientation === 'portrait' ? DEFAULT_PORTRAIT_ELEMENTS : DEFAULT_LANDSCAPE_ELEMENTS),
          ...imported.elements
        };
        setElements(mergedElements);

        const savedTemplatesStr = localStorage.getItem('id-templates') || '[]';
        const savedTemplates = JSON.parse(savedTemplatesStr) as CustomTemplateConfig[];
        
        const newTemplate: CustomTemplateConfig = {
          id: `custom-${Date.now()}`,
          name: imported.name,
          orientation: imported.orientation,
          themeColor: mergedElements.school?.color || '#1e3a5f',
          frontBg: imported.frontBg || '',
          backBg: imported.backBg || '',
          elements: mergedElements,
        };

        const filtered = savedTemplates.filter(t => t.name !== imported.name);
        filtered.push(newTemplate);
        localStorage.setItem('id-templates', JSON.stringify(filtered));

        alert(`Template "${imported.name}" successfully imported and saved!`);
      } catch (err: any) {
        alert('Invalid JSON layout template file: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Sync default coordinates when orientation changes
  useEffect(() => {
    if (orientation === 'portrait') {
      setElements(DEFAULT_PORTRAIT_ELEMENTS);
    } else {
      setElements(DEFAULT_LANDSCAPE_ELEMENTS);
    }
    setSelectedField(null);
  }, [orientation]);

  // Load PDF.js on demand
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        return resolve((window as any).pdfjsLib);
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = (e) => reject(new Error('Failed to load PDF.js engine'));
      document.head.appendChild(script);
    });
  };

  // Handle PDF parsing and dynamic extraction
  const handlePdfUpload = async (file: File, side: 'front' | 'back') => {
    setIsPdfLoading(true);
    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      if (pdf.numPages === 0) {
        alert('The PDF contains no pages.');
        return;
      }

      // If page 1 is front, and we have page 2, extract that as back background!
      const extractPage = async (pageNum: number): Promise<string> => {
        if (pageNum > pdf.numPages) return '';
        const page = await pdf.getPage(pageNum);
        
        // Define high resolution render scale (3.0 scale is perfect for details)
        const viewport = page.getViewport({ scale: 3.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas context');

        await page.render({ canvasContext: ctx, viewport }).promise;
        return canvas.toDataURL('image/png');
      };

      if (side === 'front') {
        const frontImage = await extractPage(1);
        setFrontBg(frontImage);
        
        // Proactively grab page 2 for back background if available!
        if (pdf.numPages >= 2) {
          const backImage = await extractPage(2);
          setBackBg(backImage);
        }
      } else {
        const backImage = await extractPage(1);
        setBackBg(backImage);
      }
    } catch (error: any) {
      console.error(error);
      alert('Error parsing template PDF: ' + error.message);
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Background Image Selector
  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      handlePdfUpload(file, side);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (side === 'front') setFrontBg(event.target.result as string);
          else setBackBg(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an image file (PNG/JPEG) or a vector PDF.');
    }
  };

  // Canvas Dimension Selectors
  const currentW = orientation === 'portrait' ? CARD_PORTRAIT_W : CARD_LANDSCAPE_W;
  const currentH = orientation === 'portrait' ? CARD_PORTRAIT_H : CARD_LANDSCAPE_H;

  // Custom Mouse Drag Handler
  const handleDragStart = (e: React.MouseEvent, fieldKey: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedField(fieldKey);

    const rect = cardContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      fieldX: elements[fieldKey].x,
      fieldY: elements[fieldKey].y,
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!dragStartRef.current || !selectedField || !cardContainerRef.current) return;

    const rect = cardContainerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Convert pixel delta to percentage delta
    const dxPercent = (dx / rect.width) * 100;
    const dyPercent = (dy / rect.height) * 100;

    const newX = Math.max(0, Math.min(100 - elements[selectedField].w, dragStartRef.current.fieldX + dxPercent));
    const newY = Math.max(0, Math.min(100 - elements[selectedField].h, dragStartRef.current.fieldY + dyPercent));

    setElements((prev: any) => ({
      ...prev,
      [selectedField]: {
        ...prev[selectedField],
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
      }
    }));
  };

  const handleDragEnd = () => {
    dragStartRef.current = null;
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  };

  // Custom Mouse Resize Handler
  const handleResizeStart = (e: React.MouseEvent, fieldKey: string) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedField(fieldKey);

    const rect = cardContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      fieldW: elements[fieldKey].w,
      fieldH: elements[fieldKey].h,
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizeStartRef.current || !selectedField || !cardContainerRef.current) return;

    const rect = cardContainerRef.current.getBoundingClientRect();
    const dx = e.clientX - resizeStartRef.current.x;
    const dy = e.clientY - resizeStartRef.current.y;

    const dwPercent = (dx / rect.width) * 100;
    const dhPercent = (dy / rect.height) * 100;

    // Set minimum size constraints of 5% width/height
    const newW = Math.max(5, Math.min(100 - elements[selectedField].x, resizeStartRef.current.fieldW + dwPercent));
    const newH = Math.max(3, Math.min(100 - elements[selectedField].y, resizeStartRef.current.fieldH + dhPercent));

    setElements((prev: any) => ({
      ...prev,
      [selectedField]: {
        ...prev[selectedField],
        w: Math.round(newW * 10) / 10,
        h: Math.round(newH * 10) / 10,
      }
    }));
  };

  const handleResizeEnd = () => {
    resizeStartRef.current = null;
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  };

  // Element Modifier Handler
  const updateFieldProperty = (fieldKey: string, property: string, value: any) => {
    setElements((prev: any) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [property]: value
      }
    }));
  };

  // Keyboard nudge handling for selected element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedField) return;
      
      // Don't nudge if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;

      const step = e.shiftKey ? 5 : 1;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        updateFieldProperty(selectedField, 'enabled', false);
        setSelectedField(null);
        e.preventDefault();
        return;
      } else return;

      e.preventDefault();

      const newX = Math.max(0, Math.min(100 - elements[selectedField].w, elements[selectedField].x + dx));
      const newY = Math.max(0, Math.min(100 - elements[selectedField].h, elements[selectedField].y + dy));

      setElements((prev: any) => ({
        ...prev,
        [selectedField]: {
          ...prev[selectedField],
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
        }
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedField, elements]);

  // Click outside to deselect
  const handleCardClick = () => {
    setSelectedField(null);
  };

  // Save the template configuration to LocalStorage
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return alert('Please enter a Template Name.');

    try {
      const savedTemplatesStr = localStorage.getItem('id-templates') || '[]';
      const savedTemplates = JSON.parse(savedTemplatesStr) as CustomTemplateConfig[];
      
      const newTemplate: CustomTemplateConfig = {
        id: `custom-${Date.now()}`,
        name: templateName,
        orientation,
        themeColor: elements.school.color || '#1e3a5f',
        frontBg: frontBg,
        backBg: backBg,
        elements: elements,
      };

      // Filter out existing template if editing (by name), or push
      const filtered = savedTemplates.filter(t => t.name !== templateName);
      filtered.push(newTemplate);

      localStorage.setItem('id-templates', JSON.stringify(filtered));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      alert(`Template "${templateName}" saved successfully!`);
    } catch (e) {
      console.error(e);
      alert('Failed to save template to localStorage (might exceed browser limits if backgrounds are extremely large). Try uploading a smaller template image.');
    }
  };

  // Sample PDF Format Generator
  const generateFormatDownload = async (type: 'blank' | 'designed', format: 'png' | 'pdf') => {
    const { jsPDF } = await import('jspdf');
    
    const scale = 4;
    const canvasW = CARD_PORTRAIT_W * scale;
    const canvasH = CARD_PORTRAIT_H * scale;
    
    const canvas = document.createElement('canvas');
    canvas.width = orientation === 'portrait' ? canvasW : canvasH;
    canvas.height = orientation === 'portrait' ? canvasH : canvasW;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Draw Background
    if (type === 'blank') {
      // Draw gridlines
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      for (let i = 0; i < w; i += w / 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let i = 0; i < h; i += h / 10) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }

      // Draw Guides
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(20, 20, w - 40, h - 40);
      ctx.setLineDash([]);

      // Draw standard markings
      ctx.fillStyle = '#71717a';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CR80 STANDARD DUMMY CANVAS', w / 2, h / 2 - 40);
      ctx.fillText(`${orientation === 'portrait' ? '54 x 85.6 mm (PORTRAIT)' : '85.6 x 54 mm (LANDSCAPE)'}`, w / 2, h / 2 + 10);
      
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '24px monospace';
      ctx.fillText('Design your template graphics here and upload.', w / 2, h / 2 + 60);

      // Draw outer crop indicators
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 6;
      ctx.beginPath();
      // TL
      ctx.moveTo(0, 40); ctx.lineTo(0, 0); ctx.lineTo(40, 0);
      // TR
      ctx.moveTo(w - 40, 0); ctx.lineTo(w, 0); ctx.lineTo(w, 40);
      // BL
      ctx.moveTo(0, h - 40); ctx.lineTo(0, h); ctx.lineTo(40, h);
      // BR
      ctx.moveTo(w - 40, h); ctx.lineTo(w, h); ctx.lineTo(w, h - 40);
      ctx.stroke();
    } else {
      // Designed Template
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(0.5, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Aesthetic geometric meshes
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 3;
      for (let i = 0; i < h; i += 60) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i + w / 2);
        ctx.stroke();
      }

      // Top school bar banner
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, 0, w, h * 0.12);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.12);
      ctx.lineTo(w, h * 0.12);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GLOBAL PUBLIC ACADEMY', w / 2, h * 0.08);

      // Bottom design highlights
      ctx.fillStyle = '#FF9933';
      ctx.fillRect(0, h - 30, w / 3, 30);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w / 3, h - 30, w / 3, 30);
      ctx.fillStyle = '#138808';
      ctx.fillRect((2 * w) / 3, h - 30, w / 3, 30);

      // Photo Frame Placeholder Outline
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 8;
      ctx.strokeRect(w / 2 - 140, h * 0.2, 280, 320);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(w / 2 - 140, h * 0.2, 280, 320);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '30px monospace';
      ctx.fillText('BACKGROUND TEMPLATE DESIGN', w / 2, h * 0.7);
    }

    const dataUrl = canvas.toDataURL('image/png');

    if (format === 'png') {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `custom-template-${type}-${orientation}.png`;
      link.click();
    } else {
      // PDF - Standard CR80 Size in MM: 53.98 x 85.6
      const pdf = new jsPDF(
        orientation === 'portrait' ? 'p' : 'l',
        'mm',
        [53.98, 85.60]
      );
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, 53.98, 85.6);
      pdf.save(`custom-template-${type}-${orientation}.pdf`);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col bg-[#030303] text-white font-mono relative overflow-hidden select-none">
      
      {/* Upper system bar */}
      <div className="w-full h-8 border-b border-zinc-900 flex items-center justify-between px-6 text-[8.5px] text-zinc-500 z-20 bg-black/60 backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>[SYSTEM_WORKSPACE // ID_STUDIO_DESIGNER]</span>
        </span>
        <span>ORIENTATION: {orientation.toUpperCase()} // ACTIVE_SIDE: {activeSide.toUpperCase()}</span>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Toolbox & Controls */}
        <section className="w-full lg:w-96 border-r border-zinc-900 bg-black flex flex-col overflow-y-auto z-10 custom-scrollbar shrink-0">
          
          <div className="p-6 border-b border-zinc-900">
            <Link href="/" className="text-zinc-500 text-[10px] uppercase hover:text-white mb-4 flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back to Studio
            </Link>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase flex items-center gap-2">
              Template <span className="text-zinc-500 font-light">Builder</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </h1>
            <p className="text-zinc-500 text-[9.5px] leading-relaxed mt-1">
              Visual coordinates mapping engine. Place placeholders onto your background layout.
            </p>
          </div>

          <div className="p-6 flex flex-col gap-6">
            
            {/* Global Settings */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[9px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
                1. Template Specs
              </h2>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase font-bold">Template Name</label>
                <input 
                  type="text" 
                  value={templateName}
                  onChange={(e) => { setTemplateName(e.target.value); setIsSaved(false); }}
                  className="w-full bg-zinc-950 border border-zinc-900 px-3 py-2 text-[10.5px] font-bold text-white rounded hover:border-zinc-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => { setOrientation('portrait'); setIsSaved(false); }}
                  className={`py-2 px-3 text-[9.5px] font-bold uppercase border rounded flex items-center justify-center gap-1.5 transition-all ${orientation === 'portrait' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-900 hover:border-zinc-700'}`}
                >
                  <Layout className="w-3 h-3" /> Portrait
                </button>
                <button
                  onClick={() => { setOrientation('landscape'); setIsSaved(false); }}
                  className={`py-2 px-3 text-[9.5px] font-bold uppercase border rounded flex items-center justify-center gap-1.5 transition-all ${orientation === 'landscape' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-900 hover:border-zinc-700'}`}
                >
                  <RotateCw className="w-3 h-3" /> Landscape
                </button>
              </div>
            </div>

            {/* Custom Downloads */}
            <div className="flex flex-col gap-2.5">
              <h2 className="text-[9px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
                2. Design Guidelines
              </h2>
              <p className="text-[9px] text-zinc-500 leading-normal">
                Download exact-scale guide canvases to overlay your graphics design in Photoshop/Canva.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] text-zinc-600 font-bold uppercase">Blank Guide</span>
                  <button 
                    onClick={() => generateFormatDownload('blank', 'pdf')}
                    className="py-1.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white text-[8px] uppercase tracking-wider font-bold rounded flex items-center justify-center gap-1"
                  >
                    <Download className="w-2.5 h-2.5" /> PDF (CR80)
                  </button>
                  <button 
                    onClick={() => generateFormatDownload('blank', 'png')}
                    className="py-1.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white text-[8px] uppercase tracking-wider font-bold rounded flex items-center justify-center gap-1"
                  >
                    <Download className="w-2.5 h-2.5" /> PNG (300DPI)
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[8px] text-zinc-600 font-bold uppercase">Sample Designed</span>
                  <button 
                    onClick={() => generateFormatDownload('designed', 'pdf')}
                    className="py-1.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white text-[8px] uppercase tracking-wider font-bold rounded flex items-center justify-center gap-1"
                  >
                    <Download className="w-2.5 h-2.5" /> PDF (CR80)
                  </button>
                  <button 
                    onClick={() => generateFormatDownload('designed', 'png')}
                    className="py-1.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white text-[8px] uppercase tracking-wider font-bold rounded flex items-center justify-center gap-1"
                  >
                    <Download className="w-2.5 h-2.5" /> PNG (300DPI)
                  </button>
                </div>
              </div>
            </div>

            {/* Background Image Upload */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[9px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
                3. Upload Card Layout
              </h2>

              <div className="flex flex-col gap-2">
                <span className="text-[8px] text-zinc-500 font-bold uppercase">
                  {activeSide.toUpperCase()} CARD BACKGROUND (PDF / Image)
                </span>
                
                <div className="border border-dashed border-zinc-800 bg-zinc-950 hover:bg-zinc-900/60 p-4 text-center rounded relative cursor-pointer group hover:border-zinc-600 transition-colors">
                  <Upload className="w-6 h-6 text-zinc-600 group-hover:text-white transition-colors mx-auto mb-2" />
                  <p className="text-[9px] font-bold uppercase text-zinc-400 group-hover:text-white transition-colors mb-1">
                    {isPdfLoading ? 'Rippling PDF Pages...' : 'Select File'}
                  </p>
                  <p className="text-[8px] text-zinc-600 leading-normal">
                    PNG, JPG, or PDF (multipage extracts front + back)
                  </p>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleBgFileChange(e, activeSide)}
                    disabled={isPdfLoading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {(activeSide === 'front' ? frontBg : backBg) && (
                  <div className="flex items-center justify-between border border-green-950 bg-green-950/20 px-2 py-1.5 rounded">
                    <span className="text-[8px] text-green-400 font-bold flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> BACKGROUND EXTRACTION LOADED
                    </span>
                    <button 
                      onClick={() => activeSide === 'front' ? setFrontBg('') : setBackBg('')}
                      className="text-[8.5px] text-zinc-500 hover:text-red-400 uppercase font-black px-1.5 py-0.5 border border-zinc-900 hover:border-red-950"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

             {/* Fields Settings Panel */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[9px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
                4. Dynamic Placeholders
              </h2>
              
              <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase">
                {Object.keys(elements).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      const willBeEnabled = !elements[key].enabled;
                      updateFieldProperty(key, 'enabled', willBeEnabled);
                      if (willBeEnabled) {
                        updateFieldProperty(key, 'side', activeSide);
                      }
                      setSelectedField(willBeEnabled ? key : null);
                    }}
                    className={`py-1.5 px-2 rounded border text-left flex items-center gap-2 transition-all ${elements[key].enabled ? 'bg-zinc-950 border-cyan-900 text-cyan-400' : 'bg-transparent border-zinc-950 text-zinc-600 hover:border-zinc-900 hover:text-zinc-400'}`}
                  >
                    {elements[key].enabled ? <CheckSquare className="w-3 h-3 shrink-0" /> : <Square className="w-3 h-3 shrink-0" />}
                    <span className="truncate">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Center: Visual Interactive Workspace */}
        <section 
          className="flex-1 flex flex-col items-center justify-center p-8 bg-[#070707] relative overflow-hidden"
          onClick={handleCardClick}
        >
          {/* Subtle geometric gird */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#111111_1px,transparent_1px),linear-gradient(to_bottom,#111111_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />

          {/* Toggle Front/Back face tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-black border border-zinc-900 rounded-full mb-6 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); setActiveSide('front'); }}
              className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-full transition-all ${activeSide === 'front' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white bg-transparent'}`}
            >
              Card Front
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveSide('back'); }}
              className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-full transition-all ${activeSide === 'back' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white bg-transparent'}`}
            >
              Card Back
            </button>
          </div>

          {/* Interactive Card Canvas Wrapper */}
          <div 
            ref={cardContainerRef}
            className="relative shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-zinc-800 transition-all select-none overflow-hidden"
            style={{
              width: currentW,
              height: currentH,
              backgroundColor: '#ffffff',
              backgroundImage: (activeSide === 'front' ? frontBg : backBg) ? `url(${activeSide === 'front' ? frontBg : backBg})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fallback placeholder visual guides if no background is loaded */}
            {!(activeSide === 'front' ? frontBg : backBg) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                <div className="absolute inset-2 border border-dashed border-zinc-300 rounded pointer-events-none opacity-50" />
                <FileText className="w-8 h-8 text-zinc-300 mb-2 opacity-50" />
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest opacity-60">
                  {activeSide.toUpperCase()} BACKGROUND
                </span>
                <span className="text-[7.5px] text-zinc-400 mt-1 max-w-[160px] leading-relaxed opacity-60">
                  Upload card layout file in the sidebar to design over your background graphics.
                </span>
              </div>
            )}

            {/* Draggable Active Elements */}
            {Object.keys(elements).map((key) => {
              const el = elements[key];
              if (!el.enabled) return null;
              if (el.side !== activeSide) return null;

              const isSelected = selectedField === key;
              const isText = key !== 'avatar' && key !== 'qrCode' && key !== 'barcode' && key !== 'signature' && key !== 'schoolLogo';

              return (
                <div
                  key={key}
                  onMouseDown={(e) => handleDragStart(e, key)}
                  className={`absolute flex flex-col items-center justify-center cursor-move border select-none transition-shadow ${isSelected ? 'border-cyan-500 border-dashed z-30 shadow-lg shadow-cyan-500/10 bg-cyan-500/5' : 'border-zinc-400 border-dotted hover:border-cyan-400 hover:bg-cyan-400/5 z-20'}`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.w}%`,
                    height: `${el.h}%`,
                  }}
                >
                  {/* Element Labels/Visual Placeholders */}
                  <div className="w-full h-full flex flex-col justify-center overflow-hidden px-1 relative select-none">
                    
                    {isText ? (
                      <span
                        className="truncate select-none pointer-events-none"
                        style={{
                          width: '100%',
                          fontSize: `${el.fontSize * 0.9}px`, // scaling factor for editor container
                          color: el.color,
                          textAlign: el.align,
                          fontWeight: el.bold ? 'bold' : 'normal',
                          fontStyle: el.italic ? 'italic' : 'normal',
                          fontFamily: el.fontFamily ? `'${el.fontFamily}', sans-serif` : "'Outfit', sans-serif",
                        }}
                      >
                        {key === 'school' ? 'ACADEMY NAME' : 
                         key === 'name' ? 'STUDENT NAME' : 
                         key === 'role' ? 'ROLE' : 
                         key === 'idNumber' ? 'STU-2026-0042' : 
                         key === 'grade' ? 'CLASS: X-A' : 
                         key === 'phone' ? '+91 98765 43210' : 
                         key === 'email' ? 'student@school.edu' : 
                         'O+ (BLOOD)'}
                      </span>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100/70 border border-zinc-200 pointer-events-none select-none text-zinc-500 font-bold uppercase tracking-tighter text-[7.5px]">
                        {key === 'avatar' && 'STUDENT PHOTO'}
                        {key === 'qrCode' && 'QR CODE'}
                        {key === 'barcode' && 'BARCODE'}
                        {key === 'signature' && 'SIGNATURE'}
                        {key === 'schoolLogo' && 'SCHOOL LOGO'}
                      </div>
                    )}
                  </div>

                  {/* Corner resizing handle */}
                  {isSelected && (
                    <div
                      onMouseDown={(e) => handleResizeStart(e, key)}
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cyan-500 border border-white cursor-se-resize rounded-full z-40 transform translate-x-1.5 translate-y-1.5"
                    />
                  )}

                  {/* Bounding box title tooltip */}
                  {isSelected && (
                    <span className="absolute -top-4 left-0 px-1 bg-cyan-500 text-white font-mono font-black text-[6.5px] uppercase tracking-wider rounded select-none">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick editor tips */}
          <div className="mt-6 text-[8.5px] text-zinc-600 max-w-sm text-center leading-normal">
            <span className="text-zinc-500 font-bold uppercase">Controls:</span> Click to select. Drag to move. Drag blue handle to resize. Use <span className="text-zinc-400">Arrow Keys</span> to nudge, <span className="text-zinc-400">Shift</span> to skip 5%, and <span className="text-zinc-400">Del</span> to remove.
          </div>
        </section>

        {/* Right Side: Properties & Style Panel */}
        <section className="w-full lg:w-80 border-l border-zinc-900 bg-black flex flex-col overflow-y-auto z-10 custom-scrollbar shrink-0">
          
          <div className="p-6 border-b border-zinc-900">
            <h2 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" /> Field Customizer
            </h2>
            <p className="text-zinc-500 text-[9.5px] mt-1 leading-normal">
              Select an element on the canvas to configure coordinates and styling.
            </p>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-6">
            {selectedField ? (
              <div className="flex flex-col gap-5">
                
                {/* Header info */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/20 border border-cyan-900 text-cyan-400 text-[9px] font-bold uppercase tracking-wider">
                  <span>Selected: {selectedField.replace(/([A-Z])/g, ' $1')}</span>
                </div>

                {/* Typography specs (If Text Element) */}
                {selectedField !== 'avatar' && selectedField !== 'qrCode' && selectedField !== 'barcode' && selectedField !== 'signature' && selectedField !== 'schoolLogo' && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-[8.5px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Type className="w-2.5 h-2.5" /> Typography & Style
                    </h3>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase">Text Align</label>
                      <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-900">
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            onClick={() => updateFieldProperty(selectedField, 'align', align)}
                            className={`py-1 text-[8.5px] uppercase font-bold rounded capitalize ${elements[selectedField].align === align ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 bg-transparent'}`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        onClick={() => updateFieldProperty(selectedField, 'bold', !elements[selectedField].bold)}
                        className={`py-1.5 text-[8.5px] uppercase font-black border rounded ${elements[selectedField].bold ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-900 hover:border-zinc-800'}`}
                      >
                        Bold
                      </button>
                      <button
                        onClick={() => updateFieldProperty(selectedField, 'italic', !elements[selectedField].italic)}
                        className={`py-1.5 text-[8.5px] uppercase font-black border rounded ${elements[selectedField].italic ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-900 hover:border-zinc-800'}`}
                      >
                        Italic
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex justify-between text-[8px] text-zinc-500 font-bold uppercase">
                        <span>Font Size</span>
                        <span className="text-zinc-300">{elements[selectedField].fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="24"
                        value={elements[selectedField].fontSize}
                        onChange={(e) => updateFieldProperty(selectedField, 'fontSize', parseInt(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <label className="text-[8px] text-zinc-500 uppercase">Font Family</label>
                      <select
                        value={elements[selectedField].fontFamily || 'Outfit'}
                        onChange={(e) => {
                          const val = e.target.value;
                          loadGoogleFont(val);
                          updateFieldProperty(selectedField, 'fontFamily', val);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded px-2.5 py-1.5 text-[10.5px] text-zinc-300 font-bold focus:outline-none focus:border-zinc-700 font-sans"
                      >
                        {PREMIUM_FONTS.map(font => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <label className="text-[8px] text-zinc-500 uppercase">Text Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={elements[selectedField].color}
                          onChange={(e) => updateFieldProperty(selectedField, 'color', e.target.value)}
                          className="w-8 h-8 bg-transparent border-0 cursor-pointer rounded shrink-0"
                        />
                        <input
                          type="text"
                          maxLength={7}
                          value={elements[selectedField].color}
                          onChange={(e) => updateFieldProperty(selectedField, 'color', e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-900 rounded px-2.5 text-[10.5px] text-zinc-300 font-bold focus:outline-none focus:border-zinc-700 uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bounds Config */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-[8.5px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Layout className="w-2.5 h-2.5" /> Absolute Coordinates
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-500">
                    <div className="flex flex-col gap-1">
                      <label>Position X (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={elements[selectedField].x}
                        onChange={(e) => updateFieldProperty(selectedField, 'x', parseFloat(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded px-2 py-1.5 font-bold text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label>Position Y (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={elements[selectedField].y}
                        onChange={(e) => updateFieldProperty(selectedField, 'y', parseFloat(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded px-2 py-1.5 font-bold text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label>Width (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="0.5"
                        value={elements[selectedField].w}
                        onChange={(e) => updateFieldProperty(selectedField, 'w', parseFloat(e.target.value) || 1)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded px-2 py-1.5 font-bold text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label>Height (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="0.5"
                        value={elements[selectedField].h}
                        onChange={(e) => updateFieldProperty(selectedField, 'h', parseFloat(e.target.value) || 1)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded px-2 py-1.5 font-bold text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Hide placeholder button */}
                <button
                  onClick={() => {
                    updateFieldProperty(selectedField, 'enabled', false);
                    setSelectedField(null);
                  }}
                  className="mt-2 py-2 border border-red-950 bg-red-950/10 hover:bg-red-950/30 text-red-400 text-[9px] uppercase font-bold rounded flex items-center justify-center gap-1 transition-colors"
                >
                  Disable Field
                </button>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 gap-2 border border-dashed border-zinc-900 rounded-md p-4 py-12">
                <AlertCircle className="w-5 h-5 opacity-40" />
                <span className="text-[8.5px] uppercase font-bold tracking-widest text-zinc-500">No Field Selected</span>
                <span className="text-[7.5px] max-w-[180px] leading-relaxed">
                  Click on any text or photo box on the card canvas to customize its color, text weight, height, and alignment.
                </span>
              </div>
            )}
          </div>

          {/* Compilation CTA */}
          <div className="p-6 border-t border-zinc-900 bg-zinc-950/30 flex flex-col gap-2">
            <button
              onClick={handleSaveTemplate}
              className={`w-full py-3 bg-white hover:bg-zinc-200 text-black font-black text-[10.5px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded border border-white ${isSaved ? 'opacity-50' : ''}`}
            >
              <Save className="w-3.5 h-3.5" /> SAVE CUSTOM TEMPLATE
            </button>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={handleExportTemplate}
                className="py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 rounded border border-zinc-800"
              >
                <Download className="w-3 h-3" /> Export JSON
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 rounded border border-zinc-800"
              >
                <Upload className="w-3 h-3" /> Import JSON
              </button>
            </div>
            
            <input 
              type="file" 
              ref={importInputRef} 
              accept=".json" 
              onChange={handleImportTemplate} 
              className="hidden" 
            />

            <p className="text-center text-[7.5px] text-zinc-600 uppercase">
              Will be saved to local templates list
            </p>
          </div>

        </section>

      </div>
    </main>
  );
}
