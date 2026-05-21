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
  Terminal,
  Compass
} from 'lucide-react';

interface IDCardViewerClientProps {
  data: StudentData;
  token: string;
  isNew: boolean;
}

const PORTRAIT_TEMPLATES = ['cbse-portrait', 'saffron-portrait', 'green-portrait'];

// Replace modern CSS color functions that html2canvas cannot parse with fallback legacy colors
function replaceModernColors(css: string): string {
  let output = css;
  
  // Find all instances of color-mix(in oklab, ... ) or color-mix(in oklch, ... )
  const targets = ['color-mix(in oklab,', 'color-mix(in oklch,', 'color-mix('];
  for (const target of targets) {
    let index = output.indexOf(target);
    while (index !== -1) {
      let parenCount = 1;
      let i = index + target.length;
      while (i < output.length && parenCount > 0) {
        if (output[i] === '(') {
          parenCount++;
        } else if (output[i] === ')') {
          parenCount--;
        }
        i++;
      }
      
      if (parenCount === 0) {
        const fullMatch = output.substring(index, i);
        let fallback = 'rgba(255, 255, 255, 0.2)'; // Safe default
        
        // Extract color variable name and percentage to create accurate rgba fallback
        const match = fullMatch.match(/var\(--color-([a-z0-9-]+)\)\s+(\d+)%/i) || 
                      fullMatch.match(/#([a-f0-9]{3,8})\s+(\d+)%/i) ||
                      fullMatch.match(/(white|black|transparent)\s+(\d+)%/i);
                      
        if (match) {
          const colorName = match[1].toLowerCase();
          const percentage = parseInt(match[2], 10);
          const opacity = percentage / 100;
          
          if (colorName === 'white' || colorName === 'fff' || colorName === 'ffffff') {
            fallback = `rgba(255, 255, 255, ${opacity})`;
          } else if (colorName === 'black' || colorName === '000' || colorName === '000000') {
            fallback = `rgba(0, 0, 0, ${opacity})`;
          } else if (colorName.includes('orange') || colorName.includes('saffron')) {
            fallback = `rgba(255, 153, 51, ${opacity})`; // Saffron orange
          } else if (colorName.includes('green') || colorName.includes('emerald')) {
            fallback = `rgba(19, 136, 8, ${opacity})`; // Indian green
          } else if (colorName.includes('blue') || colorName.includes('navy') || colorName.includes('zinc') || colorName.includes('gray')) {
            fallback = `rgba(100, 116, 139, ${opacity})`;
          } else {
            fallback = `rgba(128, 128, 128, ${opacity})`;
          }
        } else {
          // Check if there is at least a percentage in the string
          const percentMatch = fullMatch.match(/(\d+)%/);
          if (percentMatch) {
            const opacity = parseInt(percentMatch[1], 10) / 100;
            if (fullMatch.toLowerCase().includes('white') || fullMatch.toLowerCase().includes('fff')) {
              fallback = `rgba(255, 255, 255, ${opacity})`;
            } else {
              fallback = `rgba(128, 128, 128, ${opacity})`;
            }
          }
        }
        
        output = output.substring(0, index) + fallback + output.substring(i);
        index = output.indexOf(target, index + fallback.length);
      } else {
        break;
      }
    }
  }
  
  // Also replace any oklab(L A B) color expressions to avoid unsupported color function errors
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
    } else {
      break;
    }
  }
  
  return output;
}

// Temporary stylesheet sanitizer to prevent html2canvas parsing errors
async function sanitizeStylesheets(): Promise<() => void> {
  const restores: (() => void)[] = [];
  
  if (typeof window === 'undefined') return () => {};

  // 1. Sanitize inline <style> elements
  const styleElements = Array.from(document.querySelectorAll('style'));
  for (const style of styleElements) {
    const originalText = style.textContent || '';
    if (
      originalText.includes('oklch') || 
      originalText.includes('oklab') || 
      originalText.includes('color-mix') || 
      originalText.includes('light-dark')
    ) {
      const sanitizedText = replaceModernColors(originalText);
      style.textContent = sanitizedText;
      restores.push(() => {
        style.textContent = originalText;
      });
    }
  }

  // 2. Sanitize local <link rel="stylesheet"> elements
  const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
  for (const link of linkElements) {
    try {
      const url = new URL(link.href, window.location.origin);
      if (url.origin === window.location.origin) {
        const response = await fetch(link.href);
        const cssText = await response.text();
        if (
          cssText.includes('oklch') || 
          cssText.includes('oklab') || 
          cssText.includes('color-mix') || 
          cssText.includes('light-dark')
        ) {
          const sanitizedText = replaceModernColors(cssText);
          
          const tempStyle = document.createElement('style');
          tempStyle.textContent = sanitizedText;
          document.head.appendChild(tempStyle);
          
          const originalDisabled = link.disabled;
          link.disabled = true;
          
          restores.push(() => {
            if (tempStyle.parentNode) {
              tempStyle.parentNode.removeChild(tempStyle);
            }
            link.disabled = originalDisabled;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to sanitize stylesheet link:', link.href, e);
    }
  }

  return () => {
    for (let i = restores.length - 1; i >= 0; i--) {
      restores[i]();
    }
  };
}

export default function IDCardViewerClient({ data, token, isNew }: IDCardViewerClientProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [origin, setOrigin] = useState('');

  const isPortrait = PORTRAIT_TEMPLATES.includes(data.template);
  const cardW = isPortrait ? 270 : 428;
  const cardH = isPortrait ? 428 : 270;

  // Refs for offscreen flat export elements (IDCardFace — no 3D transforms)
  const flatFrontRef = useRef<HTMLDivElement>(null);
  const flatBackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    setOrigin(window.location.origin);
  }, []);

  // Trigger celebration on mount if newly generated card
  useEffect(() => {
    if (isNew) {
      const end = Date.now() + 1200;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FF9933', '#ffffff', '#138808'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FF9933', '#ffffff', '#138808'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [isNew]);

  // Copy shareable link to clipboard
  const handleCopyLink = async () => {
    try {
      const fullUrl = `${origin}/id/${token}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Capture an IDCardFace ref element via html2canvas
  const captureElement = async (element: HTMLDivElement) => {
    const restoreStyles = await sanitizeStylesheets();
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      return await html2canvas(element, {
        scale: 4,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: true,
        width: cardW,
        height: cardH,
      });
    } finally {
      restoreStyles();
    }
  };

  // Download PNG (front or back)
  const handleDownloadImage = async (side: 'front' | 'back') => {
    setIsExporting(true);
    try {
      const element = side === 'front' ? flatFrontRef.current : flatBackRef.current;
      if (!element) { alert('Export element not ready. Please wait a moment and try again.'); return; }

      const canvas = await captureElement(element);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `id-card-${side}-${data.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('PNG export error:', err);
      alert(`Download failed: ${err?.message || err || 'Unknown error'}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Download print-ready A4 PDF with both card faces
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const frontEl = flatFrontRef.current;
      const backEl = flatBackRef.current;
      if (!frontEl || !backEl) { alert('Export elements not ready. Please wait a moment and try again.'); return; }

      const [frontCanvas, backCanvas] = await Promise.all([
        captureElement(frontEl),
        captureElement(backEl),
      ]);

      const { jsPDF } = await import('jspdf');
      const frontImg = frontCanvas.toDataURL('image/png');
      const backImg = backCanvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const safeName = data.name.toLowerCase().replace(/\s+/g, '-');

      // Header bar
      pdf.setFillColor(26, 58, 107);
      pdf.rect(0, 0, 210, 9, 'F');
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(30, 30, 30);
      pdf.text('SCHOOL IDENTITY CARD — PRINT READY', 105, 22, { align: 'center' });
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`School: ${data.school}  |  Student: ${data.name}  |  ID: ${data.idNumber}`, 105, 29, { align: 'center' });

      // CR80 physical dimensions
      const isPortrait = PORTRAIT_TEMPLATES.includes(data.template);
      const cardW = isPortrait ? 53.98 : 85.6;
      const cardH = isPortrait ? 85.6 : 53.98;
      const yOffset = 45;
      const xFront = 105 - cardW;
      const xBack = 105;

      pdf.addImage(frontImg, 'PNG', xFront, yOffset, cardW, cardH);
      pdf.addImage(backImg, 'PNG', xBack, yOffset, cardW, cardH);

      // Cut boundary
      pdf.setLineWidth(0.15);
      pdf.setDrawColor(160, 160, 160);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.rect(xFront, yOffset, cardW * 2, cardH);

      // Center fold line
      pdf.setDrawColor(120, 120, 120);
      pdf.setLineDashPattern([1.5, 1.5], 0);
      pdf.line(105, yOffset, 105, yOffset + cardH);

      // Crop marks
      pdf.setLineDashPattern([], 0);
      pdf.setLineWidth(0.1);
      pdf.setDrawColor(100, 100, 100);
      const cm = (x1: number, y1: number, x2: number, y2: number) => pdf.line(x1, y1, x2, y2);
      cm(xFront - 6, yOffset, xFront - 2, yOffset);
      cm(xFront, yOffset - 6, xFront, yOffset - 2);
      cm(105, yOffset - 6, 105, yOffset - 2);
      cm(xFront + 2*cardW + 2, yOffset, xFront + 2*cardW + 6, yOffset);
      cm(xFront + 2*cardW, yOffset - 6, xFront + 2*cardW, yOffset - 2);
      cm(xFront - 6, yOffset + cardH, xFront - 2, yOffset + cardH);
      cm(xFront, yOffset + cardH + 2, xFront, yOffset + cardH + 6);
      cm(105, yOffset + cardH + 2, 105, yOffset + cardH + 6);
      cm(xFront + 2*cardW + 2, yOffset + cardH, xFront + 2*cardW + 6, yOffset + cardH);
      cm(xFront + 2*cardW, yOffset + cardH + 2, xFront + 2*cardW, yOffset + cardH + 6);

      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text('FRONT  |  CUT ALONG DASHES & FOLD AT CENTER  |  BACK', 105, yOffset + cardH + 6, { align: 'center' });

      // Instructions
      const instrY = isPortrait ? 150 : 118;
      pdf.setFillColor(250, 250, 252);
      pdf.setDrawColor(210, 210, 220);
      pdf.setLineDashPattern([], 0);
      pdf.rect(15, instrY, 180, 50, 'FD');
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(26, 58, 107);
      pdf.text('PRINTING INSTRUCTIONS', 20, instrY + 8);
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(60, 60, 60);
      pdf.text('1. Set printer scale to 100% — do NOT use "Fit to Page" or "Shrink to Fit".', 20, instrY + 16);
      pdf.text('2. Print on 250+ GSM cardstock or matte photo paper for best quality.', 20, instrY + 23);
      pdf.text('3. Cut along the outer dashed lines. Fold front & back face-to-face at center.', 20, instrY + 30);
      pdf.text('4. Laminate with 75-125 micron thermal pouch for durability and water resistance.', 20, instrY + 37);
      pdf.text('5. Scan the QR code on the back to verify the digital credential online.', 20, instrY + 44);

      pdf.save(`school-id-${safeName}.pdf`);
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert(`PDF generation failed: ${err?.message || err || 'Unknown error'}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const shareUrl = isMounted && origin ? `${origin}/id/${token}` : '';

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#030303] py-12 px-4 select-none relative overflow-hidden text-white font-mono">

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-4 border-b border-zinc-900 flex items-center justify-between px-6 text-[8px] text-zinc-600 pointer-events-none z-20">
        <span>[SYSTEM_WORKSPACE // PRESENTATION_MODE]</span>
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

        {/* Left Column: 3D Interactive Card Preview */}
        <div className="lg:col-span-7 border border-zinc-900 bg-black p-6 md:p-8 relative min-h-[380px] flex flex-col items-center justify-center">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-700" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-700" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />

          <div className="w-full flex items-center justify-between mb-8 border-b border-zinc-900 pb-3">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-white" />
              [01] 3D_INTERACTIVE_CREDENTIAL
            </h2>
            <span className="text-[8.5px] text-zinc-600 font-bold uppercase tracking-wider">
              CR80 · PRESS TO FLIP
            </span>
          </div>

          <div className="w-full flex items-center justify-center p-2 overflow-x-auto">
            <IDCardPreview data={data} shareUrl={shareUrl} />
          </div>
        </div>

        {/* Right Column: Action Controls */}
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
              This school ID card is fully self-contained in the URL. Share it so others can view and verify the credential instantly.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={shareUrl}
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
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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
              Download your ID card locally. PDF is scaled to CR80 physical size (85.6 × 53.98 mm) with cut guides.
            </p>

            <div className="flex flex-col gap-3 mt-1">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExporting || !isMounted}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-white rounded-none"
              >
                <FileText className="w-4 h-4" />
                <span>{isExporting ? 'Generating...' : 'COMPILE PRINT-READY PDF'}</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadImage('front')}
                  disabled={isExporting || !isMounted}
                  className="py-2.5 px-3 bg-black border border-zinc-800 hover:border-zinc-500 text-zinc-400 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>FRONT (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadImage('back')}
                  disabled={isExporting || !isMounted}
                  className="py-2.5 px-3 bg-black border border-zinc-800 hover:border-zinc-500 text-zinc-400 hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>BACK (PNG)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Verification Info */}
          <div className="border border-zinc-900 bg-black p-4 relative flex items-center gap-4 border-l-2 border-l-white">
            <div className="p-2 border border-zinc-800 bg-[#050505] text-white">
              <ShieldCheck className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <h4 className="text-[9.5px] font-bold text-white uppercase tracking-wider">Tamper-Proof Encoding</h4>
              <p className="text-[8px] text-zinc-500 mt-0.5 leading-normal">
                All card data is compressed and encoded directly in the URL. No server storage — credentials are mathematically verifiable.
              </p>
            </div>
          </div>

          {/* Create Another CTA */}
          <Link
            href="/"
            prefetch={false}
            className="w-full py-3.5 px-6 border border-zinc-900 hover:border-zinc-700 bg-black text-zinc-400 hover:text-white font-bold text-[10px] uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2 rounded-none group"
          >
            <span>COMPILE ANOTHER CARD</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* HIDDEN OFFSCREEN FLAT EXPORT FRAMES — IDCardFace renders flat, no 3D */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '2000px',
          height: '2000px',
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: -1000,
        }}
      >
        <div ref={flatFrontRef} style={{ display: 'block', width: cardW, height: cardH, overflow: 'hidden' }}>
          <IDCardFace data={data} side="front" shareUrl={shareUrl} />
        </div>
        <div ref={flatBackRef} style={{ display: 'block', width: cardW, height: cardH, overflow: 'hidden', marginTop: 20 }}>
          <IDCardFace data={data} side="back" shareUrl={shareUrl} />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-[8.5px] text-zinc-700 flex items-center gap-2 border-t border-zinc-900 pt-6 max-w-5xl w-full justify-between">
        <span>Indian School ID Card Generator</span>
        <span>CR80 Standard · Serverless · Privacy First</span>
      </footer>
    </main>
  );
}
