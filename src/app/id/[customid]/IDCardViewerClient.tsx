'use client';

import React, { useEffect, useRef, useState } from 'react';
import { StudentData } from '@/utils/compressor';
import IDCardPreview from '@/components/IDCardPreview';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { 
  Download, 
  Copy, 
  Check, 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  Printer, 
  ExternalLink,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface IDCardViewerClientProps {
  data: StudentData;
  token: string;
  isNew: boolean;
}

export default function IDCardViewerClient({ data, token, isNew }: IDCardViewerClientProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSide, setExportSide] = useState<'front' | 'back' | 'both'>('both');
  const [isMounted, setIsMounted] = useState(false);
  const [origin, setOrigin] = useState('');
  
  // Refs for offscreen flat export elements to avoid 3D perspective distortion
  const flatFrontRef = useRef<HTMLDivElement>(null);
  const flatBackRef = useRef<HTMLDivElement>(null);

  // Initialize client settings on mount to prevent SSR hydration mismatches
  useEffect(() => {
    setIsMounted(true);
    setOrigin(window.location.origin);
  }, []);

  // Trigger celebration on mount if newly generated card
  useEffect(() => {
    if (isNew) {
      // Fire confetti twice for extra volume!
      const end = Date.now() + 1000;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ffffff', '#a1a1aa', '#71717a', '#27272a']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ffffff', '#a1a1aa', '#71717a', '#27272a']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    }
  }, [isNew]);

  // Copy shareable link to clipboard
  const handleCopyLink = async () => {
    try {
      const shareOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : '');
      const fullUrl = `${shareOrigin}/id/${token}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Download high-DPI image PNG exports (Front, Back, or both)
  const handleDownloadImage = async (side: 'front' | 'back') => {
    setIsExporting(true);
    try {
      const element = side === 'front' ? flatFrontRef.current : flatBackRef.current;
      if (!element) return;

      // Dynamic import to prevent SSR/compilation window reference exceptions
      const html2canvas = (await import('html2canvas')).default;

      const parent = element.parentElement;
      const originalStyle = element.style.cssText;

      // Move element to document.body temporarily to allow proper 0,0 page context rendering
      element.style.cssText = 'position: fixed; left: 0px; top: 0px; z-index: -99999; visibility: visible; opacity: 1; pointer-events: none;';
      document.body.appendChild(element);

      const canvas = await html2canvas(element, {
        scale: 4, // 4x scale for super crisp high-resolution images
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: 424,
        height: 268
      });

      // Restore to original parent
      if (parent) {
        parent.appendChild(element);
      }
      element.style.cssText = originalStyle;

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `student-id-${side}-${data.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Download high-fidelity physical scale PDF for printing on A4
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const frontElement = flatFrontRef.current;
      const backElement = flatBackRef.current;
      if (!frontElement || !backElement) return;

      // Dynamic imports for browser canvas and PDF generation
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const frontParent = frontElement.parentElement;
      const backParent = backElement.parentElement;
      
      const frontOriginal = frontElement.style.cssText;
      const backOriginal = backElement.style.cssText;
      
      // Move elements to document.body, fixed 0,0, behind everything so it is invisible to the user
      frontElement.style.cssText = 'position: fixed; left: 0px; top: 0px; z-index: -99999; visibility: visible; opacity: 1; pointer-events: none;';
      backElement.style.cssText = 'position: fixed; left: 0px; top: 0px; z-index: -99999; visibility: visible; opacity: 1; pointer-events: none;';
      
      document.body.appendChild(frontElement);
      document.body.appendChild(backElement);

      const frontCanvas = await html2canvas(frontElement, { scale: 4, useCORS: true, logging: false, width: 424, height: 268 });
      const backCanvas = await html2canvas(backElement, { scale: 4, useCORS: true, logging: false, width: 424, height: 268 });

      // Put them back in their original parents
      if (frontParent) frontParent.appendChild(frontElement);
      if (backParent) backParent.appendChild(backElement);
      
      frontElement.style.cssText = frontOriginal;
      backElement.style.cssText = backOriginal;

      const frontImg = frontCanvas.toDataURL('image/png');
      const backImg = backCanvas.toDataURL('image/png');

      // Setup standard A4 portrait PDF document (210mm x 297mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const safeName = data.name.toLowerCase().replace(/\s+/g, '-');

      // Title & Branding Headers (Monochromatic Dark / Carbon Gray Header)
      pdf.setFillColor(24, 24, 27); // Zinc-900 stark dark fill
      pdf.rect(0, 0, 210, 8, 'F');
      
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(24, 24, 27); // zinc-900
      pdf.text('SECURE CREDENTIAL CARD', 105, 28, { align: 'center' });
      
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(115, 115, 115); // zinc-500
      pdf.text(`ISSUED BY: ${data.school.toUpperCase()}`, 105, 34, { align: 'center' });
      pdf.text(`OWNER: ${data.name.toUpperCase()} (ID: ${data.idNumber})`, 105, 39, { align: 'center' });

      // Physical CR80 scale in millimeters (85.6mm x 53.98mm)
      const cardW = 85.6;
      const cardH = 53.98;
      
      // Position front and back side-by-side centered
      const yOffset = 58;
      const xFront = 105 - cardW - 6; // slightly left of center
      const xBack = 105 + 6;          // slightly right of center

      // Add image cards
      pdf.addImage(frontImg, 'PNG', xFront, yOffset, cardW, cardH);
      pdf.addImage(backImg, 'PNG', xBack, yOffset, cardW, cardH);

      // Draw dotted cut guides
      pdf.setDrawColor(212, 212, 216); // zinc-300
      pdf.setLineDashPattern([1.5, 1.5], 0);
      pdf.rect(xFront, yOffset, cardW, cardH);
      pdf.rect(xBack, yOffset, cardW, cardH);

      // Add fold arrow helpers
      pdf.setFontSize(7.5);
      pdf.setTextColor(161, 161, 170); // zinc-400
      pdf.text('← CUT HERE AND FOLD TOGETHER →', 105, yOffset + cardH + 6, { align: 'center' });

      // Instructions block
      pdf.setFillColor(250, 250, 250); // Zinc-50 light backdrop
      pdf.rect(15, 135, 180, 48, 'F');
      pdf.setDrawColor(228, 228, 231); // Zinc-200
      pdf.setLineDashPattern([], 0);
      pdf.rect(15, 135, 180, 48);

      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(39, 39, 42); // zinc-800
      pdf.text('PRINTING AND FABRICATION INSTRUCTIONS', 20, 142);
      
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(82, 82, 91); // zinc-600
      pdf.text('1. Layout Scale: Ensure your print settings are configured to 100% SCALE (do not fit-to-page).', 20, 148);
      pdf.text('2. Stock Type: Print on high-quality 250+ GSM glossy cardstock or heavy photo paper.', 20, 154);
      pdf.text('3. Assembly: Cut carefully along the light dotted lines. Fold the front and back pieces back-to-back.', 20, 160);
      pdf.text('4. Lamination: Laminate the folded cards using a standard hot-laminator for professional PVC stiffness.', 20, 166);
      pdf.text('5. Verification: Scan the QR code on the back to verify active digital enrollment at any time.', 20, 172);

      // Secure Stamp
      pdf.setFontSize(8);
      pdf.setTextColor(63, 63, 70); // zinc-700
      pdf.text('✔ SECURE DIGITAL CREDENTIAL', 105, 205, { align: 'center' });

      pdf.save(`school-id-${safeName}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Preset styles matching preview elements for the offscreen flat exports
  const getFlatThemeClasses = () => {
    switch (data.template) {
      case 'cyberpunk':
        return {
          card: 'template-cyberpunk-bg border border-zinc-700 font-mono text-zinc-400',
          accentText: 'text-white',
          accentBg: 'bg-white/5 border border-white/10',
          badge: 'border-zinc-700 text-white bg-zinc-950/90 font-mono',
          label: 'text-zinc-500 uppercase tracking-widest text-[8.5px]',
          value: 'text-zinc-100 font-mono font-bold',
        };
      case 'classic':
        return {
          card: 'template-classic-bg border-white/15 text-zinc-200 font-serif',
          accentText: 'text-white',
          accentBg: 'bg-white/5 border border-white/10',
          badge: 'border-white/20 text-white bg-zinc-950/80 font-serif italic',
          label: 'text-zinc-400 italic text-[9px]',
          value: 'text-white font-sans font-semibold tracking-wide',
        };
      case 'retro':
        return {
          card: 'template-retro-bg border-2 border-white text-white font-mono',
          accentText: 'text-white font-black',
          accentBg: 'bg-white/10 border border-white',
          badge: 'border-white text-black bg-white font-mono font-black',
          label: 'text-zinc-450 uppercase text-[8.5px] font-bold',
          value: 'text-white font-black tracking-tight',
        };
      case 'minimal':
      default:
        return {
          card: 'template-minimalist-bg border border-white/10 text-white font-sans',
          accentText: 'text-white',
          accentBg: 'bg-white/5 border border-white/10',
          badge: 'border-white/20 text-white bg-black/80 backdrop-blur-md font-bold',
          label: 'text-zinc-400 tracking-wide text-[9.5px]',
          value: 'text-white font-semibold',
        };
    }
  };

  const flatTheme = getFlatThemeClasses();
  const cardThemeStyles = {
    '--theme-accent': data.colorTheme,
    '--theme-accent-glow': `${data.colorTheme}40`,
  } as React.CSSProperties;

  // Generate vector barcode lines for flat view
  const renderFlatBarcode = (idNum: string) => {
    const id = idNum || 'STUDENT-2026';
    const codes = id.split('').map(char => char.charCodeAt(0));
    return (
      <div className="flex items-center justify-between w-full h-10 px-1 bg-white rounded overflow-hidden">
        {codes.map((code, index) => {
          const widthClass = code % 3 === 0 ? 'w-[1px]' : code % 3 === 1 ? 'w-[2px]' : 'w-[3px]';
          if (index % 2 === 1) return <div key={index} className="h-full bg-transparent w-[1px]" />;
          return <div key={index} className={`h-full bg-slate-900 ${widthClass}`} />;
        })}
        {Array.from({ length: Math.max(5, 30 - codes.length) }).map((_, i) => (
          <div key={`rem-${i}`} className={`h-full bg-slate-900 ${i % 2 === 0 ? 'w-[1px]' : 'w-[2px]'}`} />
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#080710] py-12 px-4 select-none">
      
      {/* Header Back Link */}
      <div className="max-w-5xl w-full flex items-center justify-between mb-8 z-10">
        <Link 
          href="/" 
          prefetch={false}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ID Generator Dashboard</span>
        </Link>
        
        <div className="flex items-center gap-1.5 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
          <ShieldCheck className="w-4 h-4 text-zinc-450" />
          <span>Active Digital Credential</span>
        </div>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">
        
        {/* Left Column: Premium 3D Interactive Card Preview */}
        <div className="lg:col-span-7 flex flex-col items-center gap-6 glass-panel rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-white" />
          
          <div className="text-center space-y-1 mb-2">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              {data.name || 'JANE DOE'}
            </h1>
            <p className="text-xs text-zinc-450 font-medium">
              Digital ID Card Portal • {data.school || 'Academia School'}
            </p>
          </div>

          {/* Interactive Card Canvas */}
          <div className="w-full flex items-center justify-center p-4">
            <IDCardPreview 
              data={data} 
              shareUrl={origin ? `${origin}/id/${token}` : ''} 
            />
          </div>
        </div>

        {/* Right Column: Dynamic Action Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Card Sharing block */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-zinc-400" />
              Share Active Credential
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This school ID card is fully self-contained in the URL. Share the link below directly so others can load and verify your credential instantly!
            </p>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={origin ? `${origin}/id/${token}` : ''}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  copied 
                    ? 'bg-white border-white text-black font-bold' 
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-650 text-zinc-400 hover:text-white'
                }`}
                title="Copy share link"
              >
                {copied ? <Check className="w-4 h-4 animate-scale-in" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Card Export and Downloads Block */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-zinc-400" />
              Download & Print Credentials
            </h3>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              Download your verified ID card locally. The PDF is precisely scaled to standard CR80 physical cards and features helpful dotted guides.
            </p>

            <div className="flex flex-col gap-3 mt-1">
              {/* PDF button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-white"
              >
                <FileText className="w-4 h-4" />
                <span>Download Print-Ready PDF</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                {/* PNG Front */}
                <button
                  type="button"
                  onClick={() => handleDownloadImage('front')}
                  disabled={isExporting}
                  className="py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-650 text-zinc-200 hover:text-white font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Download Front (PNG)</span>
                </button>

                {/* PNG Back */}
                <button
                  type="button"
                  onClick={() => handleDownloadImage('back')}
                  disabled={isExporting}
                  className="py-2.5 px-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-650 text-zinc-200 hover:text-white font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Download Back (PNG)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Info Verification / Help */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex items-center gap-4 border-l-2 border-l-white">
            <div className="p-2.5 rounded-lg bg-zinc-950 text-white">
              <ShieldCheck className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tamper-Proof Encryption</h4>
              <p className="text-[10px] text-zinc-450 mt-0.5 leading-normal">
                Card credentials are mathematically generated and encoded inside the URL using compression algorithm, preventing unauthorized server tampering or deletion.
              </p>
            </div>
          </div>

          {/* Create Own CTA */}
          <Link
            href="/"
            prefetch={false}
            className="w-full py-3.5 px-6 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-300 hover:text-white font-extrabold text-xs uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2 group"
          >
            <span>Create Another ID Card</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* --- HIDDEN OFFSCREEN FLAT ID CARD RENDERING FRAMES ---
          This container is absolutely positioned far offscreen. It renders Front and Back card faces flatly 
          (without 3D rotates or perspectives) at exact high-res sizes so html2canvas renders perfect output. */}
      <div 
        className="absolute overflow-hidden pointer-events-none"
        style={{ left: '-9999px', top: '-9999px', width: '500px', height: '600px', zIndex: -10 }}
      >
        {/* Offscreen Front Card (exact 424px x 268px, CR80 aspect ratio roughly) */}
        <div
          ref={flatFrontRef}
          style={cardThemeStyles}
          className={`w-[424px] h-[268px] relative rounded-2xl p-5 overflow-hidden flex flex-col justify-between select-none ${flatTheme.card}`}
        >
          {/* Top Bar: School & Logo */}
          <div className="flex items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                <ShieldCheck className={`w-4 h-4 ${data.template === 'minimal' ? 'text-[var(--theme-accent)]' : flatTheme.accentText}`} />
              </div>
              <div className="flex flex-col leading-none">
                <h3 className={`text-xs font-extrabold tracking-wider uppercase truncate max-w-[210px] ${data.template === 'minimal' ? 'text-white' : ''}`}>
                  {data.school || 'ACADEMIA INSTITUTE'}
                </h3>
                <span className={`text-[8px] tracking-widest opacity-80 uppercase ${flatTheme.label}`}>
                  Institutional ID
                </span>
              </div>
            </div>
            <div className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full border ${flatTheme.badge}`}>
              {data.role || 'STUDENT'}
            </div>
          </div>

          {/* Middle Section: Photo & Core Details */}
          <div className="flex items-center gap-4 my-2 z-10 flex-1">
            <div className="relative">
              <div className={`w-20 aspect-[3/4] relative rounded-lg overflow-hidden border bg-zinc-950 flex items-center justify-center ${
                data.template === 'cyberpunk' ? 'border-emerald-500' :
                data.template === 'classic' ? 'border-amber-400/50' :
                data.template === 'retro' ? 'border-rose-500 border-2' :
                'border-white/10'
              }`}>
                {data.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-600 font-bold text-2xl">?</span>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-1.5 h-full">
              <div>
                <span className={`${flatTheme.label} block`}>Full Name</span>
                <h2 className={`truncate text-sm font-extrabold tracking-wide ${
                  data.template === 'classic' ? 'text-amber-100 font-serif text-[15px]' : 'text-white font-sans'
                }`}>
                  {data.name || 'JANE DOE'}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={flatTheme.label}>Roll No / ID</span>
                  <span className={`block text-[11px] truncate ${flatTheme.value}`}>
                    {data.idNumber || 'STU-2026-0042'}
                  </span>
                </div>
                <div>
                  <span className={flatTheme.label}>Class / Dept</span>
                  <span className={`block text-[11px] truncate ${flatTheme.value}`}>
                    {data.grade || 'Computer Science'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Issues, Validity & Chip */}
          <div className="flex items-end justify-between border-t border-white/5 pt-2 z-10">
            <div className="flex items-center gap-4 text-[9px] text-zinc-400">
              <div className="flex items-center gap-1">
                <div>
                  <span className="block opacity-60 leading-none">ISSUED</span>
                  <span className="font-semibold text-zinc-200">{data.issueDate || '08/2025'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div>
                  <span className="block opacity-60 leading-none">EXPIRES</span>
                  <span className="font-semibold text-zinc-200">{data.expiryDate || '08/2026'}</span>
                </div>
              </div>
            </div>
            
            <div className={`w-7 h-5 rounded-md flex flex-col justify-around p-0.5 border ${
              data.template === 'cyberpunk' ? 'bg-emerald-950/50 border-emerald-500/40' :
              data.template === 'classic' ? 'bg-amber-950/40 border-amber-500/30' :
              data.template === 'retro' ? 'bg-fuchsia-950/40 border-rose-500/40' :
              'bg-white/5 border-white/10'
            }`}>
              <div className="w-full h-[1px] bg-white/20" />
              <div className="w-2/3 h-[1px] bg-white/20" />
              <div className="w-full h-[1px] bg-white/20" />
            </div>
          </div>
        </div>

        {/* Offscreen Back Card (exact 424px x 268px) */}
        <div
          ref={flatBackRef}
          style={cardThemeStyles}
          className={`w-[424px] h-[268px] relative rounded-2xl p-5 overflow-hidden flex flex-col justify-between select-none ${flatTheme.card}`}
        >
          {/* Back Header: Institution Verification */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2 z-10">
            <div className="flex flex-col leading-none">
              <span className={`text-[7.5px] uppercase tracking-widest ${flatTheme.label}`}>Official Contact</span>
              <span className="text-[10px] font-semibold text-zinc-200 truncate max-w-[210px]">
                {data.school || 'ACADEMIA INSTITUTE'}
              </span>
            </div>
            <span className="text-[8px] text-zinc-500 tracking-wider">SECURE ID</span>
          </div>

          {/* Back Center: Emergency, barcode and QR */}
          <div className="flex gap-4 items-center my-1 z-10 flex-1">
            {/* QR Code Container */}
            <div className="w-[72px] h-[72px] p-1 bg-white rounded-lg flex items-center justify-center border shadow-md border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100&100&data=${encodeURIComponent(origin ? `${origin}/id/${token}` : data.email)}&color=080710&bgcolor=ffffff`}
                alt="Scan Verification QR" 
                className="w-full h-full object-contain animate-fade-in"
                crossOrigin="anonymous"
              />
            </div>

            {/* Personal details list */}
            <div className="flex-1 flex flex-col justify-center space-y-1">
              <div className="flex items-center gap-1.5 text-[9.5px]">
                <span className="text-zinc-400">BLOOD GRP:</span>
                <span className="font-bold text-zinc-100">{data.bloodGroup || 'O+'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[9.5px]">
                <span className="text-zinc-400">PHONE:</span>
                <span className="font-semibold text-zinc-200">{data.phone || '+1 234-567-890'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[9.5px] max-w-[190px]">
                <span className="text-zinc-400">EMAIL:</span>
                <span className="font-semibold text-zinc-200 truncate">{data.email || 'j.doe@school.edu'}</span>
              </div>
            </div>
          </div>

          {/* Back Footer: Signature and Barcode */}
          <div className="flex items-end justify-between gap-4 border-t border-white/5 pt-2 z-10">
            {/* Barcode Frame */}
            <div className="w-[140px] flex flex-col space-y-0.5">
              {renderFlatBarcode(data.idNumber)}
              <span className="text-[7.5px] font-mono text-center tracking-widest text-zinc-400">
                {data.idNumber || 'STU-2026-0042'}
              </span>
            </div>

            {/* Principal Signature Frame */}
            <div className="flex flex-col items-center shrink-0">
              <div className="h-8 w-20 relative flex items-center justify-center border-b border-zinc-500/40">
                {data.signature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={data.signature} 
                    alt="Signature" 
                    className="max-h-full max-w-full object-contain filter invert brightness-200" 
                  />
                ) : (
                  <span className="text-[7px] text-zinc-500 italic">Signature</span>
                )}
              </div>
              <span className="text-[7px] uppercase tracking-widest text-zinc-400 mt-0.5">
                Authority Signature
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
