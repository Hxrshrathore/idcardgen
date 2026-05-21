'use client';

import React, { useEffect, useRef, useState } from 'react';
import { StudentData } from '@/utils/compressor';
import IDCardPreview, { IDCardFace } from '@/components/IDCardPreview';
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
      if (!element) {
        console.error('Export element not found');
        return;
      }

      const html2canvas = (await import('html2canvas')).default;

      const isPortrait = ['cbse-portrait', 'saffron-portrait', 'green-portrait'].includes(data.template);
      const canvasWidth = isPortrait ? 270 : 428;
      const canvasHeight = isPortrait ? 428 : 270;

      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: canvasWidth,
        height: canvasHeight,
        windowWidth: canvasWidth,
        windowHeight: canvasHeight,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `student-id-${side}-${data.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Download failed. Please try again.');
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
      pdf.text(`OWNER: ${data.name.toUpperCase()} â€¢ SPEC: ISO/IEC 7810 CR80`, 105, 35, { align: 'center' });

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
      pdf.text('â† CUT BOUNDARY & FOLD ALONG CENTER LINE â†’', 105, yOffset + cardH + 5, { align: 'center' });

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
      pdf.text('âœ” CRYPTOGRAPHICALLY SECURED INSTANT DIGITAL CREDENTIAL', 105, stampY, { align: 'center' });

      pdf.save(`credential-card-${safeName}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // --- HIDDEN OFFSCREEN FLAT EXPORT FRAMES ---
  // Using IDCardFace (a flat, non-3D renderer) so html2canvas captures correct output.
  const isPortraitTemplate = ['cbse-portrait', 'saffron-portrait', 'green-portrait'].includes(data.template);
  const shareUrl = isMounted && origin ? `${origin}/id/${token}` : '';

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#030303] py-12 px-4 select-none relative overflow-hidden text-white font-mono">
      
      {/* Micro Grid Rulers at absolute screen margins */}
      <div className="absolute top-0 left-0 right-0 h-4 border-b border-zinc-900 flex items-center justify-between px-6 text-[8px] text-zinc-600 pointer-events-none z-20">
        <span>[SYSTEM_WORKSPACE // PRESENTATION_MODE]</span>
        <span>LAT: 42.3601Â° N, LON: 71.0589Â° W</span>
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
              CR80 ASPECT RATIO â€¢ PRESS TO FLIP
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

      {/* HIDDEN OFFSCREEN FLAT EXPORT FRAMES â€” rendered via IDCardFace (no 3D transforms) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          zIndex: -1,
          pointerEvents: 'none',
          opacity: 1,
          visibility: 'visible',
        }}
      >
        {/* Front face export target */}
        <div ref={flatFrontRef} style={{ display: 'inline-block' }}>
          <IDCardFace data={data} side="front" shareUrl={shareUrl} />
        </div>

        {/* Back face export target */}
        <div ref={flatBackRef} style={{ display: 'inline-block', marginLeft: 20 }}>
          <IDCardFace data={data} side="back" shareUrl={shareUrl} />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-[8.5px] text-zinc-700 flex items-center gap-2 border-t border-zinc-900 pt-6 max-w-5xl w-full justify-between">
        <span>SYSTEM VERSION: 2026.05.21</span>
        <span>CR80 PLATFORM SPECIFICATION â€¢ COPYRIGHT PURE HUMAN CADASTRAL</span>
      </footer>
    </main>
  );
}
