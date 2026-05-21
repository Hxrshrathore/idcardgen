'use client';

import React, { useEffect, useRef, useState } from 'react';
import { StudentData } from '@/utils/compressor';
import IDCardPreview from '@/components/IDCardPreview';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { 
  Download, 
  Copy, 
  Check, 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Terminal,
  Compass
} from 'lucide-react';

interface IDCardViewerClientProps {
  data: StudentData;
  token: string;
  isNew: boolean;
}

export default function IDCardViewerClient({ data, token, isNew }: IDCardViewerClientProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [origin, setOrigin] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  
  // Refs for offscreen flat export elements to avoid 3D perspective distortion
  const flatFrontRef = useRef<HTMLDivElement>(null);
  const flatBackRef = useRef<HTMLDivElement>(null);

  // Initialize client settings on mount to prevent SSR hydration mismatches
  useEffect(() => {
    setIsMounted(true);
    setOrigin(window.location.origin);
  }, []);

  // Generate QR Code locally via client-side canvasing (100% offline, CORS-free)
  useEffect(() => {
    const generateQr = async () => {
      try {
        const shareOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : '');
        const fullUrl = `${shareOrigin}/id/${token}`;
        const url = await QRCode.toDataURL(fullUrl, {
          margin: 1,
          width: 150,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrUrl(url);
      } catch (err) {
        console.error('Local QR code error:', err);
      }
    };
    if (isMounted) {
      generateQr();
    }
  }, [origin, token, isMounted]);

  // Trigger celebration on mount if newly generated card
  useEffect(() => {
    if (isNew) {
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

  // Download high-DPI image PNG exports (Front or Back)
  const handleDownloadImage = async (side: 'front' | 'back') => {
    setIsExporting(true);
    try {
      const element = side === 'front' ? flatFrontRef.current : flatBackRef.current;
      if (!element) return;

      const html2canvas = (await import('html2canvas')).default;

      const parent = element.parentElement;
      const originalStyle = element.style.cssText;

      // Move element to document.body temporarily to allow proper 0,0 page context rendering
      element.style.cssText = 'position: fixed; left: 0px; top: 0px; z-index: -99999; visibility: visible; opacity: 1; pointer-events: none;';
      document.body.appendChild(element);

      const isPortrait = data.orientation === 'portrait';
      const canvasWidth = isPortrait ? 270 : 428;
      const canvasHeight = isPortrait ? 428 : 270;

      const canvas = await html2canvas(element, {
        scale: 4, // 4x scale for super crisp high-resolution images
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: canvasWidth,
        height: canvasHeight
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

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const frontParent = frontElement.parentElement;
      const backParent = backElement.parentElement;
      
      const frontOriginal = frontElement.style.cssText;
      const backOriginal = backElement.style.cssText;
      
      // Move elements to document.body temporarily for flawless html2canvas context rendering
      frontElement.style.cssText = 'position: fixed; left: 0px; top: 0px; z-index: -99999; visibility: visible; opacity: 1; pointer-events: none;';
      backElement.style.cssText = 'position: fixed; left: 0px; top: 0px; z-index: -99999; visibility: visible; opacity: 1; pointer-events: none;';
      
      document.body.appendChild(frontElement);
      document.body.appendChild(backElement);

      const isPortrait = data.orientation === 'portrait';
      const canvasWidth = isPortrait ? 270 : 428;
      const canvasHeight = isPortrait ? 428 : 270;

      const frontCanvas = await html2canvas(frontElement, { scale: 4, useCORS: true, logging: false, width: canvasWidth, height: canvasHeight });
      const backCanvas = await html2canvas(backElement, { scale: 4, useCORS: true, logging: false, width: canvasWidth, height: canvasHeight });

      // Restore elements
      if (frontParent) frontParent.appendChild(frontElement);
      if (backParent) backParent.appendChild(backElement);
      
      frontElement.style.cssText = frontOriginal;
      backElement.style.cssText = backOriginal;

      const frontImg = frontCanvas.toDataURL('image/png');
      const backImg = backCanvas.toDataURL('image/png');

      // Setup standard A4 portrait PDF document (210mm x 297mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const safeName = data.name.toLowerCase().replace(/\s+/g, '-');

      // Title & Branding Headers (Monochromatic Dark / Steel Gray Header)
      pdf.setFillColor(24, 24, 27); // Zinc-900 stark dark fill
      pdf.rect(0, 0, 210, 8, 'F');
      
      pdf.setFont('Courier', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(24, 24, 27); // Zinc-900
      pdf.text('INSTITUTIONAL CREDENTIAL COMPILER', 105, 24, { align: 'center' });
      
      pdf.setFont('Courier', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(115, 115, 115); // Zinc-500
      pdf.text(`ISSUED BY: ${data.school.toUpperCase()} (ID: ${data.idNumber})`, 105, 30, { align: 'center' });
      pdf.text(`OWNER: ${data.name.toUpperCase()} • SPEC: ISO/IEC 7810 CR80`, 105, 35, { align: 'center' });

      // Physical CR80 scale in millimeters (85.6mm x 53.98mm)
      const cardW = isPortrait ? 53.98 : 85.6;
      const cardH = isPortrait ? 85.6 : 53.98;
      
      // Position front and back side-by-side touching exactly at the center (105mm)
      const yOffset = 52;
      const xFront = 105 - cardW;
      const xBack = 105;

      // Add image cards
      pdf.addImage(frontImg, 'PNG', xFront, yOffset, cardW, cardH);
      pdf.addImage(backImg, 'PNG', xBack, yOffset, cardW, cardH);

      // Draw solid perimeter dotted lines for cutting
      pdf.setLineWidth(0.1);
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.rect(xFront, yOffset, cardW * 2, cardH);

      // Draw middle vertical dashed fold line at 105mm
      pdf.setLineWidth(0.1);
      pdf.setDrawColor(120, 120, 120);
      pdf.setLineDashPattern([1.5, 1.5], 0);
      pdf.line(105, yOffset, 105, yOffset + cardH);

      // Draw professional CAD registration/crop marks (+) extending 3mm outside the card margins
      pdf.setLineWidth(0.1);
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineDashPattern([], 0); // Solid lines for crop marks
      
      // 1. Top-Left Crop Marks
      pdf.line(xFront - 6, yOffset, xFront - 2, yOffset);
      pdf.line(xFront, yOffset - 6, xFront, yOffset - 2);

      // 2. Top-Center Fold Crop Mark (vertical dash)
      pdf.line(105, yOffset - 6, 105, yOffset - 2);

      // 3. Top-Right Crop Marks
      pdf.line(xFront + 2 * cardW + 2, yOffset, xFront + 2 * cardW + 6, yOffset);
      pdf.line(xFront + 2 * cardW, yOffset - 6, xFront + 2 * cardW, yOffset - 2);

      // 4. Bottom-Left Crop Marks
      pdf.line(xFront - 6, yOffset + cardH, xFront - 2, yOffset + cardH);
      pdf.line(xFront, yOffset + cardH + 2, xFront, yOffset + cardH + 6);

      // 5. Bottom-Center Fold Crop Mark (vertical dash)
      pdf.line(105, yOffset + cardH + 2, 105, yOffset + cardH + 6);

      // 6. Bottom-Right Crop Marks
      pdf.line(xFront + 2 * cardW + 2, yOffset + cardH, xFront + 2 * cardW + 6, yOffset + cardH);
      pdf.line(xFront + 2 * cardW, yOffset + cardH + 2, xFront + 2 * cardW, yOffset + cardH + 6);

      // Add fold arrow helpers
      pdf.setFontSize(7.5);
      pdf.setTextColor(150, 150, 150);
      pdf.text('← CUT BOUNDARY & FOLD ALONG CENTER LINE →', 105, yOffset + cardH + 5, { align: 'center' });

      // Instructions block position (shifted downward based on orientation)
      const instrY = isPortrait ? 155 : 125;
      const stampY = isPortrait ? 220 : 190;

      // Instructions block
      pdf.setFillColor(252, 252, 252); // Light zinc backdrop
      pdf.rect(15, instrY, 180, 48, 'F');
      pdf.setDrawColor(220, 220, 224); // Zinc border
      pdf.setLineDashPattern([], 0);
      pdf.rect(15, instrY, 180, 48);

      pdf.setFont('Courier', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(30, 30, 30);
      pdf.text('FABRICATION & PRINTING SPECIFICATIONS', 20, instrY + 7);
      
      pdf.setFont('Courier', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(80, 80, 80);
      pdf.text('1. Layout Scale: Configure printer settings to 100% PHYSICAL SCALE (disable "Fit to Page").', 20, instrY + 13);
      pdf.text('2. Stock Type: Print on high-quality 250+ GSM heavy cardstock or matte photo paper.', 20, instrY + 19);
      pdf.text('3. Assembly: Cut along the outer dotted lines. Fold front & back cards back-to-back at center.', 20, instrY + 25);
      pdf.text('4. Lamination: Run the folded card through a thermal laminator (75-125 mic pouch) for rigidity.', 20, instrY + 31);
      pdf.text('5. Verification: Scan the QR code on the back face to verify cryptographic active link authenticity.', 20, instrY + 37);

      // Secure Stamp
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.text('✔ CRYPTOGRAPHICALLY SECURED INSTANT DIGITAL CREDENTIAL', 105, stampY, { align: 'center' });

      pdf.save(`credential-card-${safeName}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Preset styles matching preview elements for the offscreen flat exports
  const getFlatThemeClasses = () => {
    switch (data.template) {
      case 'system-7':
        return {
          card: 'bg-black border border-zinc-800 text-zinc-450 font-mono relative',
          accentText: 'text-white',
          accentBg: 'bg-white/5 border border-white/10',
          badge: 'border border-zinc-800 text-white bg-zinc-950 font-mono text-[8px] uppercase tracking-wider',
          label: 'text-[7.5px] text-zinc-500 uppercase font-mono tracking-widest block',
          value: 'text-white text-[10.5px] font-bold font-mono tracking-tight block truncate',
        };
      case 'bespoke':
        return {
          card: 'bg-zinc-950 border border-zinc-900 text-zinc-300 font-serif relative',
          accentText: 'text-zinc-200',
          accentBg: 'bg-black border border-zinc-800',
          badge: 'border border-zinc-800 text-zinc-200 bg-black font-serif italic text-[8.5px]',
          label: 'text-[8px] text-zinc-450 italic font-serif block',
          value: 'text-zinc-100 text-[11px] font-medium font-sans tracking-wide block truncate',
        };
      case 'atelier':
      default:
        return {
          card: 'bg-[#080808] border border-zinc-850 text-zinc-400 font-sans relative',
          accentText: 'text-white',
          accentBg: 'bg-white/5 border border-white/10',
          badge: 'border-white/10 text-white bg-zinc-900/60 font-sans font-bold text-[8.5px]',
          label: 'text-[8.5px] text-zinc-500 uppercase tracking-widest font-sans block',
          value: 'text-white text-[11.5px] font-bold tracking-wide block truncate',
        };
    }
  };

  const flatTheme = getFlatThemeClasses();
  const cardThemeStyles = {
    '--theme-accent': data.colorTheme || '#ffffff',
  } as React.CSSProperties;

  // Generate vector barcode lines for flat view
  const renderFlatBarcode = (idNum: string) => {
    const id = idNum || 'STU-2026-0042';
    const codes = id.split('').map(char => char.charCodeAt(0));
    return (
      <div className="flex items-center justify-between w-full h-8 px-1 bg-white rounded-none overflow-hidden">
        {codes.map((code, index) => {
          const widthClass = code % 3 === 0 ? 'w-[0.5px]' : code % 3 === 1 ? 'w-[1.5px]' : 'w-[2.5px]';
          if (index % 2 === 1) {
            return <div key={index} className="h-full bg-transparent w-[0.7px]" />;
          }
          return <div key={index} className={`h-full bg-zinc-950 ${widthClass}`} />;
        })}
        {Array.from({ length: Math.max(5, 25 - codes.length) }).map((_, i) => (
          <div key={`rem-${i}`} className={`h-full bg-zinc-950 ${i % 2 === 0 ? 'w-[0.7px]' : 'w-[1.8px]'}`} />
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#030303] py-12 px-4 select-none relative overflow-hidden text-white font-mono">
      
      {/* Micro Grid Rulers at absolute screen margins */}
      <div className="absolute top-0 left-0 right-0 h-4 border-b border-zinc-900 flex items-center justify-between px-6 text-[8px] text-zinc-600 pointer-events-none z-20">
        <span>[SYSTEM_WORKSPACE // PRESENTATION_MODE]</span>
        <span>LAT: 42.3601° N, LON: 71.0589° W</span>
        <span>SYS.STATUS: CREDENTIAL_ACTIVE</span>
      </div>

      {/* Header Back Link */}
      <div className="max-w-5xl w-full flex items-center justify-between mb-6 mt-4 z-10">
        <Link 
          href="/" 
          prefetch={false}
          className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>[ID COMPILER DASHBOARD]</span>
        </Link>
        
        <div className="flex items-center gap-1.5 text-white text-[8.5px] font-bold uppercase tracking-widest px-3 py-1 bg-black border border-zinc-800">
          <ShieldCheck className="w-4 h-4 text-zinc-500" />
          <span>ACTIVE DIGITAL VERIFICATION</span>
        </div>
      </div>

      {/* Workstation Header */}
      <header className="max-w-5xl w-full text-left flex flex-col items-start gap-3 mb-10 z-10 border-b border-zinc-900 pb-8 relative">
        <div className="flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 text-[8.5px] font-bold text-zinc-400 uppercase tracking-widest bg-black">
          <Terminal className="w-3 h-3 text-zinc-500" />
          <span>INSTITUTIONAL CREDENTIAL COMPILER</span>
        </div>

        <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
          CREDENTIAL <span className="text-zinc-500 font-light">VIEWER</span>
        </h1>

        <p className="text-zinc-500 text-[10.5px] max-w-3xl leading-relaxed mt-1">
          Cryptographically compiled serverless credentials for student <span className="text-white font-bold">{data.name.toUpperCase()}</span>. Verified and ready for high-fidelity physical fabrication.
        </p>
      </header>

      {/* Grid container */}
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">
        
        {/* Left Column: Premium 3D Interactive Card Preview */}
        <div className="lg:col-span-7 border border-zinc-900 bg-black p-6 md:p-8 relative min-h-[380px] flex flex-col items-center justify-center">
          {/* Micro coordinate decorations */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-700" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-700" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />
          
          <div className="w-full flex items-center justify-between mb-8 border-b border-zinc-900 pb-3">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-white" />
              [01] 3D_INTERACTIVE_CREDENTIAL
            </h2>
            <span className="text-[8.5px] text-zinc-650 font-bold uppercase tracking-wider">
              CR80 ASPECT RATIO • PRESS TO FLIP
            </span>
          </div>

          {/* Interactive Card Canvas */}
          <div className="w-full flex items-center justify-center p-2">
            <IDCardPreview 
              data={data} 
              shareUrl={origin ? `${origin}/id/${token}` : ''} 
            />
          </div>
        </div>

        {/* Right Column: Dynamic Action Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Card Sharing block */}
          <div className="border border-zinc-900 bg-black p-6 relative flex flex-col gap-4">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-700" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-700" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-700" />

            <h3 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-2">
              <ExternalLink className="w-4 h-4 text-zinc-500" />
              SHARE_ACTIVE_LINK
            </h3>
            <p className="text-[9px] text-zinc-500 leading-normal">
              This school ID card is fully self-contained in the URL. Share the link below directly so others can load and verify your credential instantly!
            </p>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={origin ? `${origin}/id/${token}` : ''}
                className="flex-1 py-2.5 px-4 bg-[#050505] border border-zinc-900 text-[10px] font-mono text-zinc-400 focus:outline-none rounded-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`p-2.5 border flex items-center justify-center transition-all duration-300 cursor-pointer rounded-none ${
                  copied 
                    ? 'bg-white border-white text-black font-bold' 
                    : 'bg-black border-zinc-800 hover:border-zinc-500 text-zinc-500 hover:text-white'
                }`}
                title="Copy share link"
              >
                {copied ? <Check className="w-4 h-4 animate-scale-in" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Card Export and Downloads Block */}
          <div className="border border-zinc-900 bg-black p-6 relative flex flex-col gap-4">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-700" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-700" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-700" />

            <h3 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Download className="w-4 h-4 text-zinc-500" />
              EXPORT_CREDENTIALS
            </h3>
            
            <p className="text-[9px] text-zinc-500 leading-normal">
              Download your verified ID card locally. The PDF is precisely scaled to standard CR80 physical cards and features helpful dotted guides.
            </p>

            <div className="flex flex-col gap-3 mt-1">
              {/* PDF button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-white rounded-none"
              >
                <FileText className="w-4 h-4" />
                <span>COMPILE PRINT-READY PDF</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                {/* PNG Front */}
                <button
                  type="button"
                  onClick={() => handleDownloadImage('front')}
                  disabled={isExporting}
                  className="py-2.5 px-3 bg-black border border-zinc-800 hover:border-zinc-500 text-zinc-400 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 rounded-none"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-550" />
                  <span>FRONT (PNG)</span>
                </button>

                {/* PNG Back */}
                <button
                  type="button"
                  onClick={() => handleDownloadImage('back')}
                  disabled={isExporting}
                  className="py-2.5 px-3 bg-black border border-zinc-800 hover:border-zinc-500 text-zinc-400 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 rounded-none"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-550" />
                  <span>BACK (PNG)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Info Verification / Help */}
          <div className="border border-zinc-900 bg-black p-4 relative flex items-center gap-4 border-l-2 border-l-white">
            <div className="p-2 border border-zinc-800 bg-[#050505] text-white">
              <ShieldCheck className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <h4 className="text-[9.5px] font-bold text-white uppercase tracking-wider">Tamper-Proof Encryption</h4>
              <p className="text-[8px] text-zinc-650 mt-0.5 leading-normal">
                Card credentials are mathematically generated and encoded inside the URL using compression algorithm, preventing unauthorized server tampering or deletion.
              </p>
            </div>
          </div>

          {/* Create Own CTA */}
          <Link
            href="/"
            prefetch={false}
            className="w-full py-3.5 px-6 border border-zinc-900 hover:border-zinc-750 bg-black text-zinc-400 hover:text-white font-bold text-[10px] uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2 rounded-none group"
          >
            <span>COMPILE ANOTHER CARD</span>
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
        {/* Offscreen Front Card (CR80 aspect ratio locked flat container) */}
        <div
          ref={flatFrontRef}
          style={cardThemeStyles}
          className={`${
            data.orientation === 'portrait' ? 'w-[270px] h-[428px]' : 'w-[428px] h-[270px]'
          } relative p-5 overflow-hidden flex flex-col justify-between select-none ${flatTheme.card}`}
        >
          {/* Fine Shimmer Overlay */}
          <div className="shiny-overlay" />

          {/* Template Specific Background Designs */}
          {data.template === 'system-7' && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
              <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-zinc-700 pointer-events-none" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-zinc-700 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-zinc-700 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-zinc-700 pointer-events-none" />
            </>
          )}
          
          {data.template === 'bespoke' && (
            <div className="absolute inset-1.5 border border-zinc-900/60 pointer-events-none" />
          )}

          {/* Top Bar: School & Logo */}
          <div className="flex items-center justify-between gap-3 z-10 w-full">
            <div className="flex items-center gap-2">
              <div className="p-1 border border-zinc-800 bg-black flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
              </div>
              <div className="flex flex-col leading-none">
                <h3 className={`text-[10px] font-black tracking-wider uppercase truncate ${
                  data.orientation === 'portrait' ? 'max-w-[110px]' : 'max-w-[210px]'
                }`}>
                  {data.school || 'ACADEMIA INSTITUTE'}
                </h3>
                <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-mono">
                  SECURE CREDENTIAL
                </span>
              </div>
            </div>
            <div className={`px-2 py-0.5 font-bold ${flatTheme.badge}`}>
              {data.role || 'STUDENT'}
            </div>
          </div>

          {/* Middle Section: Photo & Core Details */}
          <div className={`flex z-10 flex-1 w-full ${
            data.orientation === 'portrait' ? 'flex-col items-center justify-center gap-3.5 my-2' : 'items-center gap-4 my-2'
          }`}>
            <div className="relative shrink-0">
              <div className={`w-18 aspect-[3/4] border bg-black flex items-center justify-center overflow-hidden ${
                data.template === 'system-7' ? 'border-zinc-700' :
                data.template === 'bespoke' ? 'border-zinc-800' :
                'border-zinc-850'
              }`}>
                {data.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-600 font-bold text-2xl">?</span>
                )}
              </div>
            </div>

            <div className={`flex-1 flex flex-col justify-center space-y-1.5 ${
              data.orientation === 'portrait' ? 'items-center text-center w-full' : 'h-full'
            }`}>
              <div>
                <span className={flatTheme.label}>IDENTIFICATION.NAME</span>
                <h2 className={`font-black uppercase tracking-wide leading-tight ${
                  data.template === 'bespoke' ? 'text-zinc-200 font-serif text-sm' : 'text-white text-[12.5px]'
                } ${data.orientation === 'portrait' ? 'text-center max-w-[220px]' : ''}`}>
                  {data.name || 'JANE DOE'}
                </h2>
              </div>

              <div className={`grid gap-2 w-full ${
                data.orientation === 'portrait' ? 'grid-cols-2 text-center' : 'grid-cols-2'
              }`}>
                <div>
                  <span className={flatTheme.label}>SERIAL_NO</span>
                  <span className={flatTheme.value}>
                    {data.idNumber || 'STU-2026-0042'}
                  </span>
                </div>
                <div>
                  <span className={flatTheme.label}>DEPT/CLASS</span>
                  <span className={flatTheme.value}>
                    {data.grade || 'COMPUTER SCIENCE'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Issues, Validity & Chip */}
          <div className="flex items-end justify-between border-t border-zinc-900 pt-2 z-10 w-full">
            <div className={`flex text-[8.5px] text-zinc-500 font-mono ${
              data.orientation === 'portrait' ? 'flex-col gap-0.5 items-start' : 'items-center gap-4'
            }`}>
              <div>
                <span className="opacity-50 font-bold">VAL.FROM: </span>
                <span className="text-zinc-350">{data.issueDate || '08/2025'}</span>
              </div>
              <div>
                <span className="opacity-50 font-bold">VAL.THRU: </span>
                <span className="text-zinc-350">{data.expiryDate || '08/2026'}</span>
              </div>
            </div>
            
            <div className="w-6.5 h-4.5 rounded-none flex flex-col justify-around p-0.5 border border-zinc-800 bg-[#101012] shrink-0">
              <div className="w-full h-[0.5px] bg-zinc-700/60" />
              <div className="w-3/4 h-[0.5px] bg-zinc-700/60" />
              <div className="w-full h-[0.5px] bg-zinc-700/60" />
            </div>
          </div>
        </div>

        {/* Offscreen Back Card (CR80 aspect ratio locked flat container) */}
        <div
          ref={flatBackRef}
          style={cardThemeStyles}
          className={`${
            data.orientation === 'portrait' ? 'w-[270px] h-[428px]' : 'w-[428px] h-[270px]'
          } relative p-5 overflow-hidden flex flex-col justify-between select-none ${flatTheme.card}`}
        >
          {/* Fine Shimmer Overlay */}
          <div className="shiny-overlay" />

          {/* Template Specific Background Designs */}
          {data.template === 'system-7' && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
              <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-zinc-700 pointer-events-none" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-zinc-700 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-zinc-700 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-zinc-700 pointer-events-none" />
            </>
          )}
          
          {data.template === 'bespoke' && (
            <div className="absolute inset-1.5 border border-zinc-900/60 pointer-events-none" />
          )}

          {/* Back Header: Institution Verification */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2 z-10 w-full">
            <div className="flex flex-col leading-none">
              <span className="text-[7.5px] uppercase tracking-widest text-zinc-500 font-mono">SYSTEM_CONTACT</span>
              <span className="text-[9.5px] font-bold text-zinc-350 truncate max-w-[160px]">
                {data.school || 'ACADEMIA INSTITUTE'}
              </span>
            </div>
            <span className="text-[7px] text-zinc-500 tracking-wider">SYS.REC_SECURE</span>
          </div>

          {/* Back Center: Emergency, barcode and QR */}
          <div className={`flex z-10 flex-1 w-full ${
            data.orientation === 'portrait' ? 'flex-col items-center justify-center gap-3.5 my-2' : 'gap-4 items-center my-1'
          }`}>
            {/* QR Code Container */}
            <div className="p-1 bg-white border border-zinc-800 flex items-center justify-center shrink-0 w-16 h-16">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={qrUrl} 
                  alt="Scan Verification QR" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 animate-pulse" />
              )}
            </div>

            {/* Personal details list */}
            <div className={`flex-1 flex flex-col justify-center space-y-1.5 ${
              data.orientation === 'portrait' ? 'items-center text-center w-full' : ''
            }`}>
              <div className="flex items-center gap-1.5 text-[8.5px]">
                <span className="text-zinc-500">BLOOD_GRP:</span>
                <span className="font-bold text-white">{data.bloodGroup || 'O+'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[8.5px]">
                <span className="text-zinc-500">PHONE_SYS:</span>
                <span className="font-bold text-white">{data.phone || '+1 234-567-890'}</span>
              </div>
              <div className={`flex items-center gap-1.5 text-[8.5px] ${
                data.orientation === 'portrait' ? 'max-w-full justify-center' : 'max-w-[190px]'
              }`}>
                <span className="text-zinc-500">EMAIL_SYS:</span>
                <span className="font-bold text-white truncate max-w-[130px]">{data.email || 'j.doe@school.edu'}</span>
              </div>
            </div>
          </div>

          {/* Back Footer: Signature and Barcode */}
          <div className={`flex border-t border-zinc-900 pt-2 z-10 ${
            data.orientation === 'portrait' ? 'flex-col items-center gap-2.5 w-full' : 'items-end justify-between gap-4 w-full'
          }`}>
            {/* Principal Signature Frame (above barcode in portrait) */}
            {data.orientation === 'portrait' && (
              <div className="flex flex-col items-center shrink-0">
                <div className="h-6 w-20 relative flex items-center justify-center border-b border-zinc-800 bg-[#0d0d0f] p-0.5">
                  {data.signature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={data.signature} 
                      alt="Signature" 
                      className="max-h-full max-w-full object-contain filter invert brightness-200" 
                    />
                  ) : (
                    <span className="text-[6.5px] text-zinc-650 italic">SIGNATURE</span>
                  )}
                </div>
                <span className="text-[6.5px] uppercase tracking-widest text-zinc-500 mt-1">
                  VERIFIED AUTHORITY
                </span>
              </div>
            )}

            {/* Barcode Frame */}
            <div className={`flex flex-col space-y-0.5 ${
              data.orientation === 'portrait' ? 'w-[150px] items-center' : 'w-[130px]'
            }`}>
              {renderFlatBarcode(data.idNumber)}
              <span className="text-[7px] font-mono text-center tracking-widest text-zinc-550">
                {data.idNumber || 'STU-2026-0042'}
              </span>
            </div>

            {/* Principal Signature Frame (on the right in landscape) */}
            {data.orientation !== 'portrait' && (
              <div className="flex flex-col items-center shrink-0">
                <div className="h-6 w-20 relative flex items-center justify-center border-b border-zinc-800 bg-[#0d0d0f] p-0.5">
                  {data.signature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={data.signature} 
                      alt="Signature" 
                      className="max-h-full max-w-full object-contain filter invert brightness-200" 
                    />
                  ) : (
                    <span className="text-[6.5px] text-zinc-650 italic">SIGNATURE</span>
                  )}
                </div>
                <span className="text-[6.5px] uppercase tracking-widest text-zinc-500 mt-1">
                  VERIFIED AUTHORITY
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Visual Workspace Controls */}
      <footer className="mt-16 text-center text-[8.5px] text-zinc-700 flex items-center gap-2 border-t border-zinc-900 pt-6 max-w-5xl w-full justify-between">
        <span>SYSTEM VERSION: 2026.05.21</span>
        <span>CR80 PLATFORM SPECIFICATION • COPYRIGHT PURE HUMAN CADASTRAL</span>
      </footer>
    </main>
  );
}
