'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Table, 
  Plus, 
  Trash2, 
  Copy, 
  Sparkles, 
  Upload, 
  Download, 
  Loader2, 
  CheckCircle2, 
  Image, 
  FileSpreadsheet, 
  Play, 
  PenTool, 
  X,
  Settings,
  Grid,
  Palette,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MousePointer,
  Hand,
  RefreshCw,
  Eye,
  Shield
} from 'lucide-react';
import { StudentData, compressStudentData } from '../../utils/compressor';
import IDCardForm from '../../components/IDCardForm';
import IDCardPreview, { IDCardFace } from '../../components/IDCardPreview';

// Demo students for the Quick-List spreadsheet mode to let users get started instantly
const INITIAL_QUICK_LIST: StudentData[] = [
  {
    name: 'AARAV MEHTA',
    idNumber: 'STU-2026-0101',
    school: 'DELHI PUBLIC SCHOOL',
    role: 'STUDENT',
    grade: 'X-B',
    email: 'aarav.mehta@dps.edu',
    phone: '+91 99887 76655',
    bloodGroup: 'A+',
    issueDate: '04/2025',
    expiryDate: '03/2026',
    template: 'cbse-portrait',
    colorTheme: '#2563eb',
    avatar: '',
    signature: '',
    orientation: 'portrait',
  },
  {
    name: 'DIYA SHARMA',
    idNumber: 'STU-2026-0102',
    school: 'DELHI PUBLIC SCHOOL',
    role: 'STUDENT',
    grade: 'XI-A',
    email: 'diya.sharma@dps.edu',
    phone: '+91 99223 34455',
    bloodGroup: 'B+',
    issueDate: '04/2025',
    expiryDate: '03/2026',
    template: 'saffron-portrait',
    colorTheme: '#ea580c',
    avatar: '',
    signature: '',
    orientation: 'portrait',
  },
  {
    name: 'KABIR SINGH',
    idNumber: 'STU-2026-0103',
    school: 'DELHI PUBLIC SCHOOL',
    role: 'STUDENT',
    grade: 'IX-C',
    email: 'kabir.singh@dps.edu',
    phone: '+91 98888 77777',
    bloodGroup: 'O+',
    issueDate: '04/2025',
    expiryDate: '03/2026',
    template: 'green-portrait',
    colorTheme: '#16a34a',
    avatar: '',
    signature: '',
    orientation: 'portrait',
  }
];

const INITIAL_DEMO_DATA: StudentData = {
  name: 'RAHUL SHARMA',
  idNumber: 'STU-2026-0042',
  school: 'DELHI PUBLIC SCHOOL',
  role: 'STUDENT',
  grade: 'X-A',
  email: 'rahul.sharma@dps.edu',
  phone: '+91 98765 43210',
  bloodGroup: 'O+',
  issueDate: '04/2025',
  expiryDate: '03/2026',
  template: 'cbse-portrait',
  colorTheme: '#2563eb',
  avatar: '',
  signature: '',
  orientation: 'portrait',
};

// CSS Sanitizer for modern colors that can crash html2canvas
function replaceModernColors(css: string): string {
  let output = css;
  const targets = ['color-mix(in oklab,', 'color-mix(in oklch,', 'color-mix('];
  for (const target of targets) {
    let index = output.indexOf(target);
    while (index !== -1) {
      let parenCount = 1;
      let i = index + target.length;
      while (i < output.length && parenCount > 0) {
        if (output[i] === '(') parenCount++;
        else if (output[i] === ')') parenCount--;
        i++;
      }
      
      if (parenCount === 0) {
        const fullMatch = output.substring(index, i);
        let fallback = 'rgba(255, 255, 255, 0.2)';
        
        const match = fullMatch.match(/var\(--color-([a-z0-9-]+)\)\s+(\d+)%/i) || 
                      fullMatch.match(/#([a-f0-9]{3,8})\s+(\d+)%/i) ||
                      fullMatch.match(/(white|black|transparent)\s+(\d+)%/i);
                      
        if (match) {
          const colorName = match[1].toLowerCase();
          const percentage = parseInt(match[2], 10);
          const opacity = percentage / 100;
          
          if (colorName === 'white' || colorName === 'fff' || colorName === 'ffffff') fallback = `rgba(255, 255, 255, ${opacity})`;
          else if (colorName === 'black' || colorName === '000' || colorName === '000000') fallback = `rgba(0, 0, 0, ${opacity})`;
          else if (colorName.includes('orange') || colorName.includes('saffron')) fallback = `rgba(255, 153, 51, ${opacity})`;
          else if (colorName.includes('green') || colorName.includes('emerald')) fallback = `rgba(19, 136, 8, ${opacity})`;
          else if (colorName.includes('blue') || colorName.includes('navy') || colorName.includes('zinc') || colorName.includes('gray')) fallback = `rgba(100, 116, 139, ${opacity})`;
          else fallback = `rgba(128, 128, 128, ${opacity})`;
        } else {
          const percentMatch = fullMatch.match(/(\d+)%/);
          if (percentMatch) {
            const opacity = parseInt(percentMatch[1], 10) / 100;
            if (fullMatch.toLowerCase().includes('white') || fullMatch.toLowerCase().includes('fff')) fallback = `rgba(255, 255, 255, ${opacity})`;
            else fallback = `rgba(128, 128, 128, ${opacity})`;
          }
        }
        
        output = output.substring(0, index) + fallback + output.substring(i);
        index = output.indexOf(target, index + fallback.length);
      } else break;
    }
  }
  
  let oklabIndex = output.indexOf('oklab(');
  while (oklabIndex !== -1) {
    let parenCount = 1;
    let i = oklabIndex + 6;
    while (i < output.length && parenCount > 0) {
      if (output[i] === '(') parenCount++;
      else if (output[i] === ')') parenCount--;
      i++;
    }
    if (parenCount === 0) {
      const fallback = '#888888';
      output = output.substring(0, oklabIndex) + fallback + output.substring(i);
      oklabIndex = output.indexOf('oklab(', oklabIndex + fallback.length);
    } else break;
  }
  return output;
}

async function sanitizeStylesheets(): Promise<() => void> {
  const restores: (() => void)[] = [];
  if (typeof window === 'undefined') return () => {};

  const styleElements = Array.from(document.querySelectorAll('style'));
  for (const style of styleElements) {
    const originalText = style.textContent || '';
    if (originalText.includes('oklch') || originalText.includes('oklab') || originalText.includes('color-mix') || originalText.includes('light-dark')) {
      const sanitizedText = replaceModernColors(originalText);
      style.textContent = sanitizedText;
      restores.push(() => { style.textContent = originalText; });
    }
  }

  const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
  for (const link of linkElements) {
    try {
      const url = new URL(link.href, window.location.origin);
      if (url.origin === window.location.origin) {
        const response = await fetch(link.href);
        const cssText = await response.text();
        if (cssText.includes('oklch') || cssText.includes('oklab') || cssText.includes('color-mix') || cssText.includes('light-dark')) {
          const sanitizedText = replaceModernColors(cssText);
          const tempStyle = document.createElement('style');
          tempStyle.textContent = sanitizedText;
          document.head.appendChild(tempStyle);
          const originalDisabled = link.disabled;
          link.disabled = true;
          restores.push(() => {
            if (tempStyle.parentNode) tempStyle.parentNode.removeChild(tempStyle);
            link.disabled = originalDisabled;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to sanitize stylesheet link:', link.href, e);
    }
  }

  return () => {
    for (let i = restores.length - 1; i >= 0; i--) restores[i]();
  };
}

// ─── FIGMA-STYLE PREVIEW CANVAS WORKSPACE ───────────────────
interface FigmaPreviewCanvasProps {
  data: StudentData;
  onChange: (newData: StudentData) => void;
  onDownloadPNG: (student: StudentData) => void;
  onDownloadPDF: (student: StudentData) => void;
  singleDownloadStatus: 'idle' | 'processing';
  activeRowIndex?: number;
  mode: 'single' | 'quick-list';
  batchStatus?: 'idle' | 'processing' | 'done';
  batchProgress?: number;
  batchStatusText?: string;
  onBatchCompile?: (type: 'zip' | 'pdf' | 'both') => void;
  onCloseBatchOverlay?: () => void;
}

function FigmaPreviewCanvas({ 
  data, 
  onChange, 
  onDownloadPNG, 
  onDownloadPDF, 
  singleDownloadStatus, 
  activeRowIndex, 
  mode,
  batchStatus = 'idle',
  batchProgress = 0,
  batchStatusText = '',
  onBatchCompile,
  onCloseBatchOverlay
}: FigmaPreviewCanvasProps) {
  const [zoom, setZoom] = useState(0.7);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showMockup, setShowMockup] = useState(true);
  const [activeTool, setActiveTool] = useState<'select' | 'pan'>('select');

  // Reset zoom and flip when student data changes
  useEffect(() => {
    setIsFlipped(false);
  }, [data.idNumber, data.name]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 1.45));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.7));
  const handleZoomReset = () => setZoom(0.7);

  const isLandscape = data.orientation === 'landscape' || 
    ['navy-landscape', 'maroon-landscape', 'tricolor-landscape'].includes(data.template || '');

  return (
    <div className="w-full h-full bg-[#0a0a0c] border border-zinc-900 lg:border-r-0 lg:border-b-0 lg:rounded-r-none lg:rounded-b-none rounded-xl flex flex-col overflow-hidden select-none relative">
      
      {/* 1. Header Toolbar: active design + template customizer link */}
      <div className="px-4 py-2.5 bg-zinc-900/30 border-b border-zinc-900/80 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 text-[#e4e4e7]">
          <Palette className="w-3.5 h-3.5 text-zinc-550" />
          <span className="text-[8.5px] font-mono tracking-widest text-zinc-500 uppercase">Template</span>
          
          <div className="flex items-center bg-zinc-950 p-0.5 border border-zinc-900 rounded-lg shrink-0 gap-0.5">
            {(isLandscape 
              ? [
                  { id: 'navy-landscape', label: 'Navy' },
                  { id: 'maroon-landscape', label: 'Maroon' },
                  { id: 'tricolor-landscape', label: 'Tricolor' }
                ]
              : [
                  { id: 'cbse-portrait', label: 'CBSE' },
                  { id: 'saffron-portrait', label: 'Saffron' },
                  { id: 'green-portrait', label: 'Green' }
                ]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onChange({ 
                    ...data, 
                    template: t.id as StudentData['template']
                  });
                }}
                className={`px-3 py-1 text-[8.5px] uppercase font-bold tracking-wider rounded-md transition-all duration-150 cursor-pointer ${
                  data.template === t.id
                    ? 'bg-white text-black font-black shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300 bg-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Link 
          href="/designer" 
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[8.5px] uppercase font-bold tracking-widest transition-all cursor-pointer active:scale-95 duration-200"
          title="Open Layout Customizer"
        >
          <Sparkles className="w-3 h-3 text-zinc-400" />
          <span>Designer</span>
        </Link>
      </div>

      {/* 2. Premium Display Board Workspace (AmbientRadial Glow) */}
      <div 
        className="flex-1 w-full overflow-hidden flex items-center justify-center relative p-6 bg-gradient-to-b from-[#0c0c0e] to-[#040405]"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.015) 0%, transparent 75%)',
          cursor: activeTool === 'pan' ? 'grab' : 'default'
        }}
      >
        {/* GPU Scale Wrapper */}
        <div 
          className="transition-transform duration-150 ease-out origin-center flex items-center justify-center"
          style={{ 
            transform: `scale(${zoom})`,
            width: isLandscape ? 512 : 320,
            height: isLandscape ? 320 : 512,
          }}
        >
          <IDCardPreview
            data={data}
            isFlippedOverride={isFlipped}
            showMockupOverride={showMockup}
          />
        </div>

        {/* FLOATING Specs Overlay (Pill Style) */}
        <div className="absolute bottom-4 left-4 bg-zinc-950/80 backdrop-blur-md border border-zinc-850 px-3 py-1.5 rounded-full flex items-center gap-2 text-[8px] font-mono text-zinc-450 uppercase tracking-widest shadow-xl z-10">
          <span className="font-bold text-zinc-350">CR80 Specs</span>
          <span className="w-1 h-1 rounded-full bg-zinc-850" />
          <span>85.60 x 53.98 mm</span>
        </div>

        {/* FLOATING Zoom Overlay (Pill Style) */}
        <div className="absolute bottom-4 right-4 bg-zinc-950/80 backdrop-blur-md border border-zinc-850 rounded-full flex items-center p-0.5 shadow-xl z-10 gap-0.5">
          <button
            type="button"
            title="Zoom Out"
            onClick={handleZoomOut}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Reset Zoom"
            onClick={handleZoomReset}
            className="px-2.5 py-1 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono text-[8px] font-bold transition-colors cursor-pointer"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            title="Zoom In"
            onClick={handleZoomIn}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Absolute Glassmorphic Compiler Loading & Success Overlay (Rule 7 & 12) */}
        {(batchStatus === 'processing' || batchStatus === 'done') && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-6 transition-all duration-300">
            {batchStatus === 'processing' ? (
              <div className="flex flex-col items-center gap-4 max-w-sm w-full text-center">
                <Loader2 className="w-9 h-9 text-white animate-spin" />
                <p className="text-[10px] uppercase tracking-widest font-black text-white">
                  Compiling Student Batch
                </p>
                <p className="text-[8.5px] uppercase tracking-wider text-zinc-400 leading-relaxed max-w-xs h-8 flex items-center justify-center">
                  {batchStatusText}
                </p>
                <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden mt-1 border border-zinc-900">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${batchProgress}%` }} />
                </div>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  {batchProgress}% Completed
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 max-w-sm w-full text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="w-6 h-6 animate-bounce" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] uppercase tracking-widest font-black text-white">
                    Compilation Successful!
                  </p>
                  <p className="text-[8.5px] uppercase tracking-wider text-zinc-400 max-w-xs leading-relaxed">
                    All PVC-calibrated ID cards generated and saved locally.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCloseBatchOverlay}
                  className="mt-2 px-6 py-2.5 bg-white text-black hover:bg-zinc-200 text-[8.5px] uppercase tracking-widest font-black rounded-xl cursor-pointer active:scale-95 transition-all duration-150 shadow-md"
                >
                  Return to Studio
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Bottom Actions Grid (Apple-style premium Segmented controllers) */}
      <div className="flex flex-col gap-2.5 px-4 py-3 bg-[#0a0a0c] border-t border-zinc-900 shrink-0">
        <div className="grid grid-cols-3 gap-3">
          {/* Mockup Case ON/OFF */}
          <button
            type="button"
            onClick={() => setShowMockup(prev => !prev)}
            className={`py-2.5 text-[8.5px] uppercase font-bold tracking-wider transition-all border rounded-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 duration-200 ${
              showMockup 
                ? 'bg-white text-black border-white shadow-md' 
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-200'
            }`}
            title="Toggle Realistic 3D Mockup Casing"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Mockup: {showMockup ? 'ON' : 'OFF'}</span>
          </button>

          {/* Download as PNG (Single or Batch Zip) */}
          <button
            type="button"
            onClick={() => {
              if (mode === 'quick-list') {
                onBatchCompile?.('zip');
              } else {
                onDownloadPNG(data);
              }
            }}
            disabled={singleDownloadStatus === 'processing' || batchStatus === 'processing'}
            className="py-2.5 bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50 duration-200"
            title={mode === 'quick-list' ? "Compile Entire Batch as PNG ZIP" : "Download Card faces as PNG"}
          >
            {mode === 'quick-list' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span className="text-[8.5px] font-bold uppercase tracking-wider">Compile ZIP</span>
              </>
            ) : (
              <>
                <Image className="w-3.5 h-3.5 text-blue-400" />
                <Download className="w-3.5 h-3.5 text-zinc-500" />
              </>
            )}
          </button>

          {/* Download as PDF (Single or Batch PDF Sheet) */}
          <button
            type="button"
            onClick={() => {
              if (mode === 'quick-list') {
                onBatchCompile?.('pdf');
              } else {
                onDownloadPDF(data);
              }
            }}
            disabled={singleDownloadStatus === 'processing' || batchStatus === 'processing'}
            className="py-2.5 bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50 duration-200"
            title={mode === 'quick-list' ? "Compile Entire Batch as printable A4 PDF" : "Download printable A4 PDF Sheet"}
          >
            {mode === 'quick-list' ? (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[8.5px] font-bold uppercase tracking-wider">Compile PDF</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" />
                <Download className="w-3.5 h-3.5 text-zinc-500" />
              </>
            )}
          </button>
        </div>

        {/* Loss Aversion and Security Integrity Row (Rule 15 & 18) */}
        <div className="flex items-center justify-between text-[7px] text-zinc-600 font-bold uppercase tracking-widest px-0.5 mt-0.5 select-none">
          <span className="flex items-center gap-1 text-zinc-500">
            <Shield className="w-2.5 h-2.5 text-zinc-650" />
            Verified Local Sandbox
          </span>
          <span className="text-zinc-400 font-black animate-pulse flex items-center gap-1">
            ⚠️ Memory Draft — Download to Preserve
          </span>
        </div>
      </div>
      
    </div>
  );
}

export default function Home() {
  const [studentData, setStudentData] = useState<StudentData>(INITIAL_DEMO_DATA);
  const [mode, setMode] = useState<'single' | 'quick-list'>('single');
  
  // Quick List state
  const [quickList, setQuickList] = useState<StudentData[]>(INITIAL_QUICK_LIST);
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
  
  // Batch compilation states
  const [batchStatus, setBatchStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatusText, setBatchStatusText] = useState('');
  
  // Offscreen rendering data
  const [currentRenderData, setCurrentRenderData] = useState<StudentData | null>(null);
  const hiddenFrontRef = useRef<HTMLDivElement>(null);
  const hiddenBackRef = useRef<HTMLDivElement>(null);

  // Signature drawing pad modal states
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [sigModalRowIndex, setSigModalRowIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const router = useRouter();

  // Merge quick student with global styling options
  const getMergedStudentData = (student: StudentData): StudentData => {
    return {
      ...student,
      template: studentData.template,
      colorTheme: studentData.colorTheme,
      school: student.school || studentData.school || 'DELHI PUBLIC SCHOOL',
      schoolLogo: studentData.schoolLogo,
      issueDate: studentData.issueDate || '04/2025',
      expiryDate: studentData.expiryDate || '03/2026',
      qrType: studentData.qrType || 'url',
      customTemplateConfig: studentData.customTemplateConfig,
      orientation: studentData.orientation || 'portrait',
      lanyardText: studentData.lanyardText,
      lanyardColor: studentData.lanyardColor,
      lanyardTextColor: studentData.lanyardTextColor,
    };
  };

  // Sync active row to studentData whenever switching active rows
  const handleRowSelect = (index: number) => {
    setActiveRowIndex(index);
    setStudentData(getMergedStudentData(quickList[index]));
  };

  // Sync global changes back to the active student row preview
  useEffect(() => {
    if (mode === 'quick-list' && quickList[activeRowIndex]) {
      setStudentData(getMergedStudentData(quickList[activeRowIndex]));
    }
  }, [
    studentData.template,
    studentData.colorTheme,
    studentData.school,
    studentData.schoolLogo,
    studentData.issueDate,
    studentData.expiryDate,
    studentData.qrType,
    studentData.customTemplateConfig,
    studentData.orientation,
    studentData.lanyardText,
    studentData.lanyardColor,
    studentData.lanyardTextColor,
    activeRowIndex,
    mode
  ]);

  const updateStudentRow = (index: number, field: keyof StudentData, value: any) => {
    setQuickList(prev => {
      const updatedList = prev.map((student, i) => {
        if (i === index) {
          return { ...student, [field]: value };
        }
        return student;
      });
      
      if (index === activeRowIndex) {
        // Enforce immediate preview update
        setStudentData(getMergedStudentData(updatedList[index]));
      }
      return updatedList;
    });
  };

  const addStudentRow = () => {
    const newStudent: StudentData = {
      name: 'NEW STUDENT',
      idNumber: `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      school: studentData.school || 'DELHI PUBLIC SCHOOL',
      role: 'STUDENT',
      grade: 'X-A',
      email: '',
      phone: '',
      bloodGroup: 'O+',
      issueDate: studentData.issueDate || '04/2025',
      expiryDate: studentData.expiryDate || '03/2026',
      template: studentData.template || 'cbse-portrait',
      colorTheme: studentData.colorTheme || '#2563eb',
      avatar: '',
      signature: '',
      orientation: studentData.orientation || 'portrait',
    };
    
    const updated = [...quickList, newStudent];
    setQuickList(updated);
    setActiveRowIndex(updated.length - 1);
    setStudentData(getMergedStudentData(newStudent));
  };

  const duplicateStudentRow = (index: number) => {
    const source = quickList[index];
    const duplicated: StudentData = {
      ...source,
      idNumber: `${source.idNumber}-COPY`,
    };
    const newList = [...quickList];
    newList.splice(index + 1, 0, duplicated);
    setQuickList(newList);
    setActiveRowIndex(index + 1);
    setStudentData(getMergedStudentData(duplicated));
  };

  const deleteStudentRow = (index: number) => {
    if (quickList.length <= 1) {
      alert('At least one student row must remain in the spreadsheet.');
      return;
    }
    
    const newList = quickList.filter((_, i) => i !== index);
    let nextActiveIndex = activeRowIndex;
    
    if (activeRowIndex === index) {
      nextActiveIndex = Math.max(0, index - 1);
    } else if (activeRowIndex > index) {
      nextActiveIndex = activeRowIndex - 1;
    }
    
    setQuickList(newList);
    setActiveRowIndex(nextActiveIndex);
    setStudentData(getMergedStudentData(newList[nextActiveIndex]));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateStudentRow(index, 'avatar', event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drawing pad implementation
  useEffect(() => {
    if (sigModalOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [sigModalOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000'; // dark ink
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    
    if ('touches' in e) {
      e.preventDefault();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();

    if ('touches' in e) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || sigModalRowIndex === null) return;
    
    const base64 = canvas.toDataURL('image/png');
    updateStudentRow(sigModalRowIndex, 'signature', base64);
    setSigModalOpen(false);
  };

  const handleSignatureImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || sigModalRowIndex === null) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateStudentRow(sigModalRowIndex, 'signature', event.target.result as string);
        setSigModalOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Compile student list into ZIP of PNG files or multi-student A4 sheets
  const handleBatchCompile = async (compileType: 'zip' | 'pdf' | 'both') => {
    if (quickList.length === 0) {
      alert('Please add at least one student row to compile.');
      return;
    }

    setBatchStatus('processing');
    setBatchProgress(0);
    setBatchStatusText('Initializing offscreen compiler...');

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');

      const zip = new JSZip();
      const frontFolder = zip.folder('Front_Images');
      const backFolder = zip.folder('Back_Images');

      let pdfLayout = new jsPDF('p', 'mm', 'a4');
      let currentCardOnPage = 0;
      let pageCount = 1;

      const restoreStyles = await sanitizeStylesheets();

      for (let i = 0; i < quickList.length; i++) {
        const student = getMergedStudentData(quickList[i]);
        setBatchStatusText(`Rendering Card ${i + 1} of ${quickList.length}: ${student.name || 'Student'}`);
        setBatchProgress(Math.round((i / quickList.length) * 100));

        // Load correct rendering variables
        setCurrentRenderData(student);

        // Allow React time to render DOM elements
        await new Promise(r => setTimeout(r, 150));

        if (!hiddenFrontRef.current || !hiddenBackRef.current) {
          console.warn(`Hidden refs missing for card index ${i}`);
          continue;
        }

        const frontCanvas = await html2canvas(hiddenFrontRef.current, { scale: 4, useCORS: true, allowTaint: false });
        const backCanvas = await html2canvas(hiddenBackRef.current, { scale: 4, useCORS: true, allowTaint: false });

        const frontData = frontCanvas.toDataURL('image/png');
        const backData = backCanvas.toDataURL('image/png');

        const safeName = `${(student.idNumber || `STU-${i}`).replace(/[^a-zA-Z0-9]/g, '_')}_${(student.name || 'unnamed').replace(/[^a-zA-Z0-9]/g, '_')}`;

        if (compileType === 'zip' || compileType === 'both') {
          frontFolder?.file(`${safeName}_front.png`, frontData.split(',')[1], { base64: true });
          backFolder?.file(`${safeName}_back.png`, backData.split(',')[1], { base64: true });
        }

        if (compileType === 'pdf' || compileType === 'both') {
          const isLandscape = student.orientation === 'landscape';
          const cardW_mm = isLandscape ? 85.6 : 53.98;
          const cardH_mm = isLandscape ? 53.98 : 85.6;

          const maxRowsPerPage = isLandscape ? 4 : 3;
          if (currentCardOnPage >= maxRowsPerPage) {
            pdfLayout.addPage();
            currentCardOnPage = 0;
            pageCount++;
          }

          const currR = currentCardOnPage;
          const yPos = 15 + (currR * (cardH_mm + 10));

          // Center side-by-side front and back
          const gap_mm = 15;
          const totalWidth = (cardW_mm * 2) + gap_mm;
          const startX = (210 - totalWidth) / 2;

          pdfLayout.addImage(frontData, 'PNG', startX, yPos, cardW_mm, cardH_mm);
          pdfLayout.addImage(backData, 'PNG', startX + cardW_mm + gap_mm, yPos, cardW_mm, cardH_mm);

          // Render high-fidelity border lines for guide cuts
          pdfLayout.setDrawColor(200, 200, 200);
          pdfLayout.setLineWidth(0.2);
          pdfLayout.rect(startX, yPos, cardW_mm, cardH_mm);
          pdfLayout.rect(startX + cardW_mm + gap_mm, yPos, cardW_mm, cardH_mm);

          currentCardOnPage++;
        }
      }

      restoreStyles();
      setCurrentRenderData(null);
      setBatchProgress(100);
      setBatchStatusText('Zipping and saving files...');

      if (compileType === 'zip' || compileType === 'both') {
        zip.file('STUDIO_INSTRUCTIONS.txt', `STUDIO BATCH COMPILE INSTRUCTIONS
---------------------------------
1. /Front_Images and /Back_Images contain individual PVC-ready high-fidelity CR80 PNG files.
2. Direct print layouts are calibrated at standard 85.60 × 53.98 mm dimensions.
`);
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `ID_Cards_Batch_${Date.now()}.zip`);
      }

      if (compileType === 'pdf' || compileType === 'both') {
        pdfLayout.save(`ID_Cards_Print_Layout_${Date.now()}.pdf`);
      }

      setBatchStatus('done');
      setBatchStatusText('Batch Compilation Complete!');
    } catch (err: any) {
      console.error(err);
      alert(`Error during batch compilation: ${err.message}`);
      setBatchStatus('idle');
    }
  };

  // ─── SINGLE CARD DOWNLOAD HANDLERS ─────────────────────────
  const [singleDownloadStatus, setSingleDownloadStatus] = useState<'idle' | 'processing'>('idle');

  const handleDownloadSinglePNG = async (student: StudentData) => {
    if (singleDownloadStatus === 'processing') return;
    setSingleDownloadStatus('processing');
    
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { saveAs } = await import('file-saver');

      // Populate hidden render target
      setCurrentRenderData(student);
      
      // Wait for React rendering cycle
      await new Promise(r => setTimeout(r, 200));

      if (!hiddenFrontRef.current || !hiddenBackRef.current) {
        throw new Error('Hidden canvas nodes not initialized yet.');
      }

      const frontCanvas = await html2canvas(hiddenFrontRef.current, { scale: 4, useCORS: true, allowTaint: false });
      const backCanvas = await html2canvas(hiddenBackRef.current, { scale: 4, useCORS: true, allowTaint: false });

      const frontBlob = await new Promise<Blob | null>(r => frontCanvas.toBlob(r, 'image/png'));
      const backBlob = await new Promise<Blob | null>(r => backCanvas.toBlob(r, 'image/png'));

      const safeName = `${(student.idNumber || 'ID').replace(/[^a-zA-Z0-9]/g, '_')}_${(student.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_')}`;

      if (frontBlob) saveAs(frontBlob, `${safeName}_front.png`);
      if (backBlob) saveAs(backBlob, `${safeName}_back.png`);

    } catch (err: any) {
      console.error(err);
      alert(`Error exporting card PNG: ${err.message}`);
    } finally {
      setCurrentRenderData(null);
      setSingleDownloadStatus('idle');
    }
  };

  const handleDownloadSinglePDF = async (student: StudentData) => {
    if (singleDownloadStatus === 'processing') return;
    setSingleDownloadStatus('processing');

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      // Populate hidden render target
      setCurrentRenderData(student);

      // Wait for React rendering cycle
      await new Promise(r => setTimeout(r, 200));

      if (!hiddenFrontRef.current || !hiddenBackRef.current) {
        throw new Error('Hidden canvas nodes not initialized yet.');
      }

      const frontCanvas = await html2canvas(hiddenFrontRef.current, { scale: 4, useCORS: true, allowTaint: false });
      const backCanvas = await html2canvas(hiddenBackRef.current, { scale: 4, useCORS: true, allowTaint: false });

      const frontData = frontCanvas.toDataURL('image/png');
      const backData = backCanvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const isLandscape = student.orientation === 'landscape' || 
        ['navy-landscape', 'maroon-landscape', 'tricolor-landscape'].includes(student.template || '');

      const cardW_mm = isLandscape ? 85.6 : 53.98;
      const cardH_mm = isLandscape ? 53.98 : 85.6;

      const yPos = (297 - cardH_mm) / 2;
      const gap_mm = 15;
      const totalWidth = (cardW_mm * 2) + gap_mm;
      const startX = (210 - totalWidth) / 2;

      pdf.addImage(frontData, 'PNG', startX, yPos, cardW_mm, cardH_mm);
      pdf.addImage(backData, 'PNG', startX + cardW_mm + gap_mm, yPos, cardW_mm, cardH_mm);

      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);
      pdf.rect(startX, yPos, cardW_mm, cardH_mm);
      pdf.rect(startX + cardW_mm + gap_mm, yPos, cardW_mm, cardH_mm);

      const safeName = `${(student.idNumber || 'ID').replace(/[^a-zA-Z0-9]/g, '_')}_${(student.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_')}`;
      pdf.save(`${safeName}_print_sheet.pdf`);

    } finally {
      setCurrentRenderData(null);
      setSingleDownloadStatus('idle');
    }
  };

  const handleGenerateCard = () => {
    if (!studentData.name.trim() || !studentData.idNumber.trim() || !studentData.school.trim()) {
      alert('Please fill out the Name, Student ID, and School Name fields before generating.');
      return;
    }

    const token = compressStudentData(studentData);
    if (token) {
      router.push(`/id/${token}?new=true`);
    } else {
      alert('Failed to generate ID card URL. Please try again.');
    }
  };

  return (
    <main className="min-h-screen lg:h-screen w-full flex flex-col items-stretch bg-[#030303] py-12 lg:pt-4 lg:pb-0 pl-4 pr-4 lg:pl-6 lg:pr-0 select-none relative overflow-hidden text-white font-sans lg:justify-start">

      {/* Cyber Grid Background lines */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] -z-10" />

      {/* Slim Premium Header */}
      <header className="w-full text-center flex flex-col items-center justify-center gap-3 mt-4 lg:mt-0 mb-4 z-10 border-b border-zinc-900 pb-3 shrink-0 lg:pr-6">
        <div className="flex flex-col items-center leading-none gap-1.5">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl lg:text-lg font-black tracking-tighter text-white uppercase flex items-center gap-1.5">
              ID Card <span className="text-zinc-500 font-light">Studio</span>
            </h1>
            <span className="text-[7.5px] font-mono tracking-widest text-zinc-550 uppercase px-1.5 py-0.5 bg-[#09090b] border border-zinc-900 rounded-sm">
              v2.0 · Offline First
            </span>
          </div>
          <p className="text-zinc-650 text-[9px] uppercase tracking-wider hidden md:block">
            Serverless printing engine with spreadsheet funnel
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 shrink-0">
          <Link href="/designer" prefetch={false} className="px-3 py-1.5 border border-zinc-850 hover:border-zinc-500 bg-[#050505] text-zinc-400 hover:text-white text-[8.5px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 rounded-sm">
            🎨 Custom Template Designer
          </Link>
          <Link href="/bulk" prefetch={false} className="px-3 py-1.5 border border-zinc-850 hover:border-zinc-500 bg-[#050505] text-zinc-400 hover:text-white text-[8.5px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 rounded-sm">
            📂 Excel Bulk Generator
          </Link>
        </div>
      </header>

      {/* Switchable Studio Mode Workspace Selector (Stationary 8/4 grid split centered perfectly) */}
      <div className="w-full lg:pr-0 grid grid-cols-1 lg:grid-cols-12 gap-8 mb-5 lg:mb-3 z-10 border-b border-zinc-900 pb-4 shrink-0 items-center">
        
        {/* Left Column: Center-aligned Studio Mode Switcher */}
        <div className="lg:col-span-8 flex justify-center items-center">
          <div className="flex items-center bg-zinc-950 p-1 border border-zinc-900 rounded-xl shrink-0">
            <button
              onClick={() => setMode('single')}
              className={`flex items-center gap-2 px-5 py-2 text-[9.5px] uppercase font-black tracking-wider transition-all rounded-lg cursor-pointer duration-200 ${
                mode === 'single'
                  ? 'bg-white text-black font-black shadow-[0_0_10px_rgba(255,255,255,0.08)]'
                  : 'text-zinc-400 hover:text-white bg-transparent'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Single Card Studio
            </button>
            <button
              onClick={() => setMode('quick-list')}
              className={`flex items-center gap-2 px-5 py-2 text-[9.5px] uppercase font-black tracking-wider transition-all rounded-lg cursor-pointer duration-200 ${
                mode === 'quick-list'
                  ? 'bg-white text-black font-black shadow-[0_0_10px_rgba(255,255,255,0.08)]'
                  : 'text-zinc-400 hover:text-white bg-transparent'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Quick-List Spreadsheet
            </button>
          </div>
        </div>

        {/* Right Column: Center-aligned Orientation Switcher */}
        <div className="lg:col-span-4 flex justify-center items-center">
          <div className="flex items-center bg-zinc-950 p-1 border border-zinc-900 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                const currentOrientation = studentData.orientation;
                if (currentOrientation !== 'portrait') {
                  setStudentData(prev => ({ 
                    ...prev, 
                    orientation: 'portrait',
                    template: 'cbse-portrait'
                  }));
                }
              }}
              className={`px-5 py-2 text-[9px] uppercase tracking-widest font-black transition-all rounded-lg cursor-pointer duration-200 ${
                studentData.orientation !== 'landscape'
                  ? 'bg-white text-black font-black shadow-[0_0_10px_rgba(255,255,255,0.08)]'
                  : 'text-zinc-500 hover:text-zinc-300 bg-transparent'
              }`}
            >
              Portrait Mode
            </button>
            <button
              type="button"
              onClick={() => {
                const currentOrientation = studentData.orientation;
                if (currentOrientation !== 'landscape') {
                  setStudentData(prev => ({ 
                    ...prev, 
                    orientation: 'landscape',
                    template: 'navy-landscape'
                  }));
                }
              }}
              className={`px-5 py-2 text-[9px] uppercase tracking-widest font-black transition-all rounded-lg cursor-pointer duration-200 ${
                studentData.orientation === 'landscape'
                  ? 'bg-white text-black font-black shadow-[0_0_10px_rgba(255,255,255,0.08)]'
                  : 'text-zinc-500 hover:text-zinc-300 bg-transparent'
              }`}
            >
              Landscape Mode
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <section className="w-full lg:pr-0 z-10 flex-1 lg:overflow-hidden min-h-0">

        {mode === 'single' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-full lg:items-stretch min-h-0">
            {/* Left: Form (Scrollable, Inspector layout - Expanded to col-span-8) */}
            <div className="lg:col-span-8 border border-zinc-900 bg-black p-6 md:p-8 relative lg:h-full lg:overflow-y-auto pr-3 flex flex-col gap-6">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-700" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-700" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />

              <div>
                <h2 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-zinc-900 pb-4">
                  Card Details
                </h2>

                <IDCardForm
                  value={studentData}
                  onChange={setStudentData}
                  onSubmit={handleGenerateCard}
                />
              </div>

              {/* Feature highlights inside scrollable sidebar */}
              <div className="border border-zinc-900 bg-zinc-950/45 p-3 grid grid-cols-3 gap-2 mt-auto shrink-0">
                <div className="flex flex-col gap-1 items-start text-left p-1 border-r border-zinc-900">
                  <span className="text-[8px] font-bold text-zinc-450 tracking-wider uppercase">Serverless</span>
                  <span className="text-[7.5px] text-zinc-650 leading-normal mt-0.5">All data lives in the URL. No database required.</span>
                </div>
                <div className="flex flex-col gap-1 items-start text-left p-1 border-r border-zinc-900 pl-2">
                  <span className="text-[8px] font-bold text-zinc-450 tracking-wider uppercase">CR80 Format</span>
                  <span className="text-[7.5px] text-zinc-650 leading-normal mt-0.5">Standard credit card size — 85.60 × 53.98 mm.</span>
                </div>
                <div className="flex flex-col gap-1 items-start text-left p-1 pl-2">
                  <span className="text-[8px] font-bold text-zinc-450 tracking-wider uppercase">Print Ready</span>
                  <span className="text-[7.5px] text-zinc-650 leading-normal mt-0.5">High-DPI canvas rendering with A4 print layout.</span>
                </div>
              </div>

              {/* Sidebar Inline Footer */}
              <footer className="mt-4 text-left text-[8px] text-zinc-700 flex items-center justify-between border-t border-zinc-900 pt-3 shrink-0">
                <span>ID Card Studio</span>
                <span>CR80 Standard • Serverless • Privacy First</span>
              </footer>
            </div>

            {/* Right: Preview Canvas (Full Height, Expanded - Set to col-span-4 to match spreadsheet mode) */}
            <div className="lg:col-span-4 flex flex-col lg:h-full lg:overflow-hidden">
              <div className="flex-1 min-h-0">
                <FigmaPreviewCanvas
                  data={studentData}
                  onChange={setStudentData}
                  onDownloadPNG={handleDownloadSinglePNG}
                  onDownloadPDF={handleDownloadSinglePDF}
                  singleDownloadStatus={singleDownloadStatus}
                  mode="single"
                  onCloseBatchOverlay={() => setBatchStatus('idle')}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-full lg:items-stretch min-h-0">
            
            {/* Left: Quick-List spreadsheet grid */}
            <div className="lg:col-span-8 border border-zinc-900 bg-black p-5 relative flex flex-col gap-4 lg:h-full lg:overflow-y-auto pr-3">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-700" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-700" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                <div>
                  <h2 className="text-[11px] font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Grid className="w-3.5 h-3.5 text-zinc-400" /> Interactive Spreadsheet Grid
                  </h2>
                  <p className="text-[8.5px] text-zinc-650 leading-relaxed uppercase">
                    All data is safe offline. Click on any row to select and preview standard styling designs.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={addStudentRow}
                    className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-500 bg-[#050505] text-white hover:bg-zinc-950 text-[9px] uppercase font-bold tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear the entire spreadsheet?')) {
                        setQuickList([INITIAL_DEMO_DATA]);
                        setActiveRowIndex(0);
                        setStudentData(getMergedStudentData(INITIAL_DEMO_DATA));
                      }
                    }}
                    className="px-3 py-1.5 border border-zinc-850 hover:border-red-800 hover:text-red-400 bg-[#050505] text-zinc-500 text-[9px] uppercase font-bold tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear Table
                  </button>
                </div>
              </div>

              {/* Responsive Spreadsheet Grid */}
              <div className="overflow-x-auto border border-zinc-900 bg-zinc-950/40 rounded-sm">
                <table className="w-full border-collapse min-w-[900px] text-left">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-zinc-900 text-[8.5px] text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="px-3 py-2.5 w-10 text-center">Sel</th>
                      <th className="px-3 py-2.5 w-12">Photo</th>
                      <th className="px-3 py-2.5 w-40">Name</th>
                      <th className="px-3 py-2.5 w-32">Student ID</th>
                      <th className="px-3 py-2.5 w-24">Grade</th>
                      <th className="px-3 py-2.5 w-28">Role</th>
                      <th className="px-3 py-2.5 w-44">School Name</th>
                      <th className="px-3 py-2.5 w-32">Phone</th>
                      <th className="px-3 py-2.5 w-40">Email</th>
                      <th className="px-3 py-2.5 w-20">Blood</th>
                      <th className="px-3 py-2.5 w-24">Sig</th>
                      <th className="px-3 py-2.5 w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quickList.map((student, index) => {
                      const isActive = index === activeRowIndex;
                      return (
                        <tr
                          key={index}
                          onClick={() => handleRowSelect(index)}
                          className={`border-b border-zinc-900 hover:bg-zinc-950/30 transition-all ${
                            isActive ? 'bg-zinc-900/35 border-l-2 border-l-white' : ''
                          }`}
                        >
                          {/* Active Row Selector Checkbox */}
                          <td className="px-3 py-1 text-center align-middle">
                            <div className="flex justify-center">
                              <span className={`w-2 h-2 rounded-full transition-all ${
                                isActive ? 'bg-green-500 scale-125 shadow-[0_0_8px_#22c55e]' : 'bg-zinc-800'
                              }`} />
                            </div>
                          </td>

                          {/* Student Photo */}
                          <td className="px-2 py-1 align-middle">
                            <div className="relative w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center overflow-hidden group/avatar">
                              {student.avatar ? (
                                <img src={student.avatar} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-zinc-650" />
                              )}
                              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                <Upload className="w-3 h-3 text-white" />
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, index)}
                                onClick={(e) => e.stopPropagation()} // Prevent selecting row on click
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                          </td>

                          {/* Student Name */}
                          <td className="px-1 py-1 align-middle">
                            <input
                              type="text"
                              value={student.name || ''}
                              onChange={(e) => updateStudentRow(index, 'name', e.target.value.toUpperCase())}
                              placeholder="NAME"
                              className="bg-transparent border-0 w-full px-2 py-1.5 text-[10px] text-white focus:outline-none focus:bg-zinc-900/50 transition-colors uppercase font-mono font-bold"
                            />
                          </td>

                          {/* Student ID */}
                          <td className="px-1 py-1 align-middle">
                            <input
                              type="text"
                              value={student.idNumber || ''}
                              onChange={(e) => updateStudentRow(index, 'idNumber', e.target.value)}
                              placeholder="ID NUMBER"
                              className="bg-transparent border-0 w-full px-2 py-1.5 text-[10px] text-white focus:outline-none focus:bg-zinc-900/50 transition-colors font-mono font-bold"
                            />
                          </td>

                          {/* Grade/Class */}
                          <td className="px-1 py-1 align-middle">
                            <input
                              type="text"
                              value={student.grade || ''}
                              onChange={(e) => updateStudentRow(index, 'grade', e.target.value)}
                              placeholder="CLASS"
                              className="bg-transparent border-0 w-full px-2 py-1.5 text-[10px] text-white focus:outline-none focus:bg-zinc-900/50 transition-colors"
                            />
                          </td>

                          {/* Role */}
                          <td className="px-1 py-1 align-middle">
                            <input
                              type="text"
                              value={student.role || ''}
                              onChange={(e) => updateStudentRow(index, 'role', e.target.value.toUpperCase())}
                              placeholder="ROLE"
                              className="bg-transparent border-0 w-full px-2 py-1.5 text-[10px] text-white focus:outline-none focus:bg-zinc-900/50 transition-colors uppercase font-semibold"
                            />
                          </td>

                          {/* School Name */}
                          <td className="px-1 py-1 align-middle">
                            <input
                              type="text"
                              value={student.school || ''}
                              onChange={(e) => updateStudentRow(index, 'school', e.target.value)}
                              placeholder="SCHOOL"
                              className="bg-transparent border-0 w-full px-2 py-1.5 text-[10px] text-white focus:outline-none focus:bg-zinc-900/50 transition-colors"
                            />
                          </td>

                          {/* Phone */}
                          <td className="px-1 py-1 align-middle">
                            <input
                              type="text"
                              value={student.phone || ''}
                              onChange={(e) => updateStudentRow(index, 'phone', e.target.value)}
                              placeholder="PHONE"
                              className="bg-transparent border-0 w-full px-2 py-1.5 text-[10px] text-white focus:outline-none focus:bg-zinc-900/50 transition-colors"
                            />
                          </td>

                          {/* Email */}
                          <td className="px-1 py-1 align-middle">
                            <input
                              type="text"
                              value={student.email || ''}
                              onChange={(e) => updateStudentRow(index, 'email', e.target.value)}
                              placeholder="EMAIL"
                              className="bg-transparent border-0 w-full px-2 py-1.5 text-[10px] text-white focus:outline-none focus:bg-zinc-900/50 transition-colors"
                            />
                          </td>

                          {/* Blood Group */}
                          <td className="px-1 py-1 align-middle">
                            <input
                              type="text"
                              value={student.bloodGroup || ''}
                              onChange={(e) => updateStudentRow(index, 'bloodGroup', e.target.value)}
                              placeholder="BLOOD"
                              className="bg-transparent border-0 w-full px-2 py-1.5 text-[10px] text-white focus:outline-none focus:bg-zinc-900/50 transition-colors uppercase font-mono font-bold"
                            />
                          </td>

                          {/* Signature Drawing */}
                          <td className="px-2 py-1 align-middle">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSigModalRowIndex(index);
                                setSigModalOpen(true);
                              }}
                              className="h-7 px-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded text-[8px] uppercase font-bold transition-all flex items-center justify-center gap-1 w-full cursor-pointer"
                            >
                              {student.signature ? (
                                <div className="relative w-full h-full flex items-center justify-center py-0.5">
                                  <img src={student.signature} alt="Sig" className="max-h-full max-w-full object-contain invert" />
                                </div>
                              ) : (
                                <>
                                  <PenTool className="w-2.5 h-2.5" />
                                  <span>Sign</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-2 py-1 align-middle text-center">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => duplicateStudentRow(index)}
                                title="Duplicate Row"
                                className="p-1 border border-zinc-900 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteStudentRow(index)}
                                title="Delete Row"
                                className="p-1 border border-zinc-900 hover:border-red-950 bg-zinc-950 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Instructions footer of spreadsheet */}
              <div className="border border-zinc-900 bg-zinc-950/30 p-3 text-[8px] text-zinc-550 leading-relaxed uppercase flex flex-col gap-1.5 mt-2">
                <span>• Custom signatures and photos reside purely in memory (base64) until downloaded.</span>
                <span>• Use the right sidebar branding module to apply global designs (colors, logos, templates, dates) immediately to the entire batch!</span>
              </div>
            </div>

            {/* Right: Preview Matrix Area (Full Height Locked) */}
            <div className="lg:col-span-4 lg:h-full lg:overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 min-h-0">
                <FigmaPreviewCanvas
                  data={studentData}
                  onChange={setStudentData}
                  onDownloadPNG={handleDownloadSinglePNG}
                  onDownloadPDF={handleDownloadSinglePDF}
                  singleDownloadStatus={singleDownloadStatus}
                  activeRowIndex={activeRowIndex}
                  mode="quick-list"
                  batchStatus={batchStatus}
                  batchProgress={batchProgress}
                  batchStatusText={batchStatusText}
                  onBatchCompile={handleBatchCompile}
                  onCloseBatchOverlay={() => setBatchStatus('idle')}
                />
              </div>
            </div>

          </div>
        )}

      </section>

      {/* Signature drawing canvas modal overlay */}
      {sigModalOpen && sigModalRowIndex !== null && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="border border-zinc-800 bg-[#070707] p-6 max-w-md w-full relative">
            <button 
              onClick={() => setSigModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-[12px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-zinc-900 pb-2 text-white">
              <PenTool className="w-4 h-4 text-white animate-bounce" /> Create Signature Box
            </h3>
            
            <p className="text-[9.5px] text-zinc-500 mb-3 leading-relaxed uppercase">
              Draw inside the white box with your pointer, or upload a PNG file with transparent layer.
            </p>

            {/* Drawing Canvas Board */}
            <div className="border border-zinc-800 bg-white rounded p-1 mb-4 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair bg-white w-full h-[150px]"
              />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-2">
                <button
                  onClick={clearCanvas}
                  className="px-3 py-1.5 border border-zinc-850 hover:border-zinc-500 bg-black text-zinc-400 hover:text-white text-[9px] uppercase font-bold tracking-wider cursor-pointer"
                >
                  Clear Box
                </button>
                
                <label className="px-3 py-1.5 border border-zinc-850 hover:border-zinc-500 bg-black text-zinc-400 hover:text-white text-[9px] uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1 transition-colors">
                  <Upload className="w-3 h-3" /> Load PNG
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleSignatureImageUpload} 
                  />
                </label>
              </div>

              <button
                onClick={saveSignature}
                className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black text-[9px] uppercase font-black tracking-widest cursor-pointer"
              >
                Apply Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Render Target for Offscreen Batch Canvas Generation */}
      <div 
        aria-hidden="true"
        style={{
          position: 'absolute', top: 0, left: 0, width: '2000px', height: '2000px',
          opacity: 0.01, pointerEvents: 'none', zIndex: -1000,
        }}
      >
        {currentRenderData && (
          <>
            <div 
              ref={hiddenFrontRef} 
              style={{ 
                display: 'block', 
                width: currentRenderData.orientation === 'landscape' ? 428 : 270, 
                height: currentRenderData.orientation === 'landscape' ? 270 : 428, 
                overflow: 'hidden' 
              }}
            >
              <IDCardFace data={currentRenderData} side="front" shareUrl="" />
            </div>
            <div 
              ref={hiddenBackRef} 
              style={{ 
                display: 'block', 
                width: currentRenderData.orientation === 'landscape' ? 428 : 270, 
                height: currentRenderData.orientation === 'landscape' ? 270 : 428, 
                overflow: 'hidden', 
                marginTop: 20 
              }}
            >
              <IDCardFace data={currentRenderData} side="back" shareUrl="" />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-[8.5px] text-zinc-700 flex items-center gap-2 border-t border-zinc-900 pt-6 w-full lg:pr-6 justify-between lg:hidden">
        <span>ID Card Studio</span>
        <span>CR80 Standard • Serverless • Privacy First</span>
      </footer>

    </main>
  );
}
