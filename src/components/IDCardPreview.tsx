'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudentData } from '../utils/compressor';
import { ShieldCheck, Calendar, Phone, Mail, Droplet, User, RefreshCw, Layers } from 'lucide-react';
import QRCode from 'qrcode';

interface IDCardPreviewProps {
  data: StudentData;
  isFlippedOverride?: boolean;
  shareUrl?: string;
}

export default function IDCardPreview({ data, isFlippedOverride, shareUrl }: IDCardPreviewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync external flip overrides (e.g. from export functions)
  useEffect(() => {
    if (isFlippedOverride !== undefined) {
      setIsFlipped(isFlippedOverride);
    }
  }, [isFlippedOverride]);

  // Generate QR Code locally via client-side canvasing (100% offline, CORS-free)
  const qrData = shareUrl || `mailto:${data.email || 'student@school.edu'}?subject=Verified ID Card: ${data.name}`;
  
  useEffect(() => {
    const generateQr = async () => {
      try {
        const url = await QRCode.toDataURL(qrData, {
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
    generateQr();
  }, [qrData]);

  // Handle 3D Mouse Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const px = x / rect.width - 0.5;
    const py = y / rect.height - 0.5;
    
    const tiltX = -py * 20;
    const tiltY = px * 20;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
  };

  const toggleFlip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  // Generate technical vector barcode lines
  const renderBarcode = (idNum: string) => {
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

  const cardThemeStyles = {
    '--theme-accent': data.colorTheme || '#ffffff',
  } as React.CSSProperties;

  // Active template styling configurations
  const getThemeClasses = () => {
    switch (data.template) {
      case 'system-7':
        return {
          card: 'bg-black border border-zinc-800 text-zinc-450 font-mono relative',
          label: 'text-[7.5px] text-zinc-500 uppercase font-mono tracking-widest block',
          value: 'text-white text-[10.5px] font-bold font-mono tracking-tight block truncate',
          badge: 'border border-zinc-800 text-white bg-zinc-950 font-mono text-[8px] uppercase tracking-wider',
        };
      case 'bespoke':
        return {
          card: 'bg-zinc-950 border border-zinc-900 text-zinc-300 font-serif relative',
          label: 'text-[8px] text-zinc-450 italic font-serif block',
          value: 'text-zinc-100 text-[11px] font-medium font-sans tracking-wide block truncate',
          badge: 'border border-zinc-800 text-zinc-200 bg-black font-serif italic text-[8.5px]',
        };
      case 'atelier':
      default:
        return {
          card: 'bg-[#080808] border border-zinc-850 text-zinc-400 font-sans relative',
          label: 'text-[8.5px] text-zinc-500 uppercase tracking-widest font-sans block',
          value: 'text-white text-[11.5px] font-bold tracking-wide block truncate',
          badge: 'border border-white/10 text-white bg-zinc-900/60 font-sans font-bold text-[8.5px]',
        };
    }
  };

  const theme = getThemeClasses();
  const isPortrait = data.orientation === 'portrait';

  return (
    <div style={cardThemeStyles} className="w-full flex flex-col items-center select-none font-mono">
      {/* 3D Scene viewport */}
      <div 
        className={`w-full perspective-1000 cursor-pointer card-hover-trigger relative group ${
          isPortrait ? 'max-w-[270px] aspect-[1/1.586]' : 'max-w-[428px] aspect-[1.586/1]'
        }`}
        onClick={toggleFlip}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Hover Tip */}
        <div className="absolute -top-7 right-4 flex items-center gap-1.5 text-[8.5px] text-zinc-400 bg-black border border-zinc-850 px-2.5 py-1 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <RefreshCw className="w-3 h-3 text-zinc-400 animate-spin-slow" />
          <span>Click to Flip Card</span>
        </div>

        {/* 3D Card Container */}
        <div
          ref={cardRef}
          className="w-full h-full relative preserve-3d transition-transform duration-700 ease-out shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${isFlipped ? 180 - tilt.y : tilt.y}deg)`,
            transition: isHovering ? 'none' : 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          {/* A. CARD FRONT SIDE */}
          <div 
            className={`absolute top-0 left-0 w-full h-full backface-hidden p-5 overflow-hidden flex flex-col justify-between ${theme.card}`}
            style={{ 
              transform: 'rotateY(0deg) translateZ(1px)', 
              zIndex: isFlipped ? 0 : 20, 
              opacity: isFlipped ? 0 : 1,
              transition: 'opacity 0.6s, z-index 0.6s'
            }}
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

            {/* Top Row: Brand & Role */}
            <div className="flex items-center justify-between gap-3 z-10 w-full">
              <div className="flex items-center gap-2">
                <div className="p-1 border border-zinc-800 bg-black flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
                </div>
                <div className="flex flex-col leading-none">
                  <h3 className={`text-[10px] font-black tracking-wider uppercase truncate ${isPortrait ? 'max-w-[110px]' : 'max-w-[210px]'}`}>
                    {data.school || 'ACADEMIA INSTITUTE'}
                  </h3>
                  <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-mono">
                    SECURE CREDENTIAL
                  </span>
                </div>
              </div>
              <div className={`px-2 py-0.5 font-bold ${theme.badge}`}>
                {data.role || 'STUDENT'}
              </div>
            </div>

            {/* Middle Row: Photo & Core Metadata details */}
            <div className={`flex z-10 flex-1 w-full ${isPortrait ? 'flex-col items-center justify-center gap-3.5 my-2' : 'items-center gap-4 my-2'}`}>
              
              {/* Photo Inset Frame */}
              <div className="relative shrink-0">
                <div className={`w-18 aspect-[3/4] border bg-black flex items-center justify-center overflow-hidden ${
                  data.template === 'system-7' ? 'border-zinc-700' :
                  data.template === 'bespoke' ? 'border-zinc-800' :
                  'border-zinc-850'
                }`}>
                  {data.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={data.avatar} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <User className="w-8 h-8 text-zinc-750" />
                  )}
                </div>
              </div>

              {/* Text metadata block */}
              <div className={`flex-1 flex flex-col justify-center space-y-1.5 ${isPortrait ? 'items-center text-center w-full' : 'h-full'}`}>
                <div>
                  <span className={theme.label}>IDENTIFICATION.NAME</span>
                  <h2 className={`font-black uppercase tracking-wide leading-tight ${
                    data.template === 'bespoke' ? 'text-zinc-200 font-serif text-sm' : 'text-white text-[12.5px]'
                  } ${isPortrait ? 'text-center max-w-[220px]' : ''}`}>
                    {data.name || 'JANE DOE'}
                  </h2>
                </div>

                <div className={`grid gap-2 w-full ${isPortrait ? 'grid-cols-2 text-center' : 'grid-cols-2'}`}>
                  <div>
                    <span className={theme.label}>SERIAL_NO</span>
                    <span className={theme.value}>
                      {data.idNumber || 'STU-2026-0042'}
                    </span>
                  </div>
                  <div>
                    <span className={theme.label}>DEPT/CLASS</span>
                    <span className={theme.value}>
                      {data.grade || 'COMPUTER SCIENCE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Validity & Smart Chip contact */}
            <div className="flex items-end justify-between border-t border-zinc-900 pt-2 z-10 w-full">
              <div className={`flex text-[8.5px] text-zinc-500 font-mono ${isPortrait ? 'flex-col gap-0.5 items-start' : 'items-center gap-4'}`}>
                <div>
                  <span className="opacity-50 font-bold">VAL.FROM: </span>
                  <span className="text-zinc-350">{data.issueDate || '08/2025'}</span>
                </div>
                <div>
                  <span className="opacity-50 font-bold">VAL.THRU: </span>
                  <span className="text-zinc-350">{data.expiryDate || '08/2026'}</span>
                </div>
              </div>
              
              {/* Virtual Microchip elements */}
              <div className="w-6.5 h-4.5 rounded-none flex flex-col justify-around p-0.5 border border-zinc-800 bg-[#101012] shrink-0">
                <div className="w-full h-[0.5px] bg-zinc-700/60" />
                <div className="w-3/4 h-[0.5px] bg-zinc-700/60" />
                <div className="w-full h-[0.5px] bg-zinc-700/60" />
              </div>
            </div>
          </div>

          {/* B. CARD BACK SIDE */}
          <div 
            className={`absolute top-0 left-0 w-full h-full backface-hidden p-5 overflow-hidden flex flex-col justify-between rotate-y-180 ${theme.card}`}
            style={{ 
              transform: 'rotateY(180deg) translateZ(1px)', 
              zIndex: isFlipped ? 20 : 0, 
              opacity: isFlipped ? 1 : 0,
              transition: 'opacity 0.6s, z-index 0.6s'
            }}
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

            {/* Header: Contacts */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 z-10 w-full">
              <div className="flex flex-col leading-none">
                <span className="text-[7.5px] uppercase tracking-widest text-zinc-500 font-mono">SYSTEM_CONTACT</span>
                <span className="text-[9.5px] font-bold text-zinc-350 truncate max-w-[160px]">
                  {data.school || 'ACADEMIA INSTITUTE'}
                </span>
              </div>
              <span className="text-[7px] text-zinc-500 tracking-wider">SYS.REC_SECURE</span>
            </div>

            {/* Center Area: QR Verification code & Core data parameters */}
            <div className={`flex z-10 flex-1 w-full ${isPortrait ? 'flex-col items-center justify-center gap-3.5 my-2' : 'gap-4 items-center my-1'}`}>
              
              {/* Local QR Code image */}
              <div className="p-1 bg-white border border-zinc-800 flex items-center justify-center shrink-0 w-16 h-16">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={qrUrl} 
                    alt="Verification QR" 
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900 animate-pulse" />
                )}
              </div>

              {/* Data list parameters */}
              <div className={`flex-1 flex flex-col justify-center space-y-1.5 ${isPortrait ? 'items-center text-center w-full' : ''}`}>
                <div className="flex items-center gap-1.5 text-[8.5px]">
                  <span className="text-zinc-500">BLOOD_GRP:</span>
                  <span className="font-bold text-white">{data.bloodGroup || 'O+'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[8.5px]">
                  <span className="text-zinc-500">PHONE_SYS:</span>
                  <span className="font-bold text-white">{data.phone || '+1 234-567-890'}</span>
                </div>
                <div className={`flex items-center gap-1.5 text-[8.5px] ${isPortrait ? 'max-w-full justify-center' : 'max-w-[190px]'}`}>
                  <span className="text-zinc-500">EMAIL_SYS:</span>
                  <span className="font-bold text-white truncate max-w-[130px]">{data.email || 'j.doe@school.edu'}</span>
                </div>
              </div>
            </div>

            {/* Back Footer: Signature Pad stripe & Barcode */}
            <div className={`flex border-t border-zinc-900 pt-2 z-10 ${
              isPortrait ? 'flex-col items-center gap-2.5 w-full' : 'items-end justify-between gap-4 w-full'
            }`}>
              
              {/* Authority Signature Pad Frame (Top in Portrait) */}
              {isPortrait && (
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-6 w-20 relative flex items-center justify-center border-b border-zinc-800 bg-[#0d0d0f] p-0.5">
                    {data.signature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={data.signature} 
                        alt="Signature" 
                        className="max-h-full max-w-full object-contain filter invert brightness-200" 
                        loading="lazy"
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

              {/* Barcode System render */}
              <div className={`flex flex-col space-y-0.5 ${isPortrait ? 'w-[150px] items-center' : 'w-[130px]'}`}>
                {renderBarcode(data.idNumber)}
                <span className="text-[7px] font-mono text-center tracking-widest text-zinc-550">
                  {data.idNumber || 'STU-2026-0042'}
                </span>
              </div>

              {/* Authority Signature Pad Frame (Right in Landscape) */}
              {!isPortrait && (
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-6 w-20 relative flex items-center justify-center border-b border-zinc-800 bg-[#0d0d0f] p-0.5">
                    {data.signature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={data.signature} 
                        alt="Signature" 
                        className="max-h-full max-w-full object-contain filter invert brightness-200" 
                        loading="lazy"
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
      </div>
      
      {/* Visual Workspace Controls */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleFlip}
          className="py-1.5 px-3 border border-zinc-800 hover:border-zinc-600 bg-black text-[9px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>FLIP CREDENTIAL CARD</span>
        </button>
        <span className="text-[9px] text-zinc-600 tracking-wider">
          CR80 SCALE PREVIEW • ROTATE: 3D_MOUSE_TILT
        </span>
      </div>
    </div>
  );
}
