'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudentData } from '../utils/compressor';
import { ShieldCheck, Calendar, Phone, Mail, Droplet, User, MapPin, RefreshCw } from 'lucide-react';

interface IDCardPreviewProps {
  data: StudentData;
  isFlippedOverride?: boolean;
  shareUrl?: string;
}

export default function IDCardPreview({ data, isFlippedOverride, shareUrl }: IDCardPreviewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync external flip overrides (e.g. from export functions)
  useEffect(() => {
    if (isFlippedOverride !== undefined) {
      setIsFlipped(isFlippedOverride);
    }
  }, [isFlippedOverride]);

  // Handle 3D Mouse Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Get mouse coordinates relative to the card
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates around the center (from -0.5 to 0.5)
    const px = x / rect.width - 0.5;
    const py = y / rect.height - 0.5;
    
    // Calculate tilt angles (limit to 12 degrees max)
    const tiltX = -py * 24;
    const tiltY = px * 24;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Generate vector barcode lines deterministically from ID Number
  const renderBarcode = (idNum: string) => {
    const id = idNum || 'STUDENT-2026';
    // Create a simple, robust deterministic hash to set line widths
    const codes = id.split('').map(char => char.charCodeAt(0));
    
    return (
      <div className="flex items-center justify-between w-full h-10 px-1 bg-white rounded overflow-hidden">
        {codes.map((code, index) => {
          // generate pattern: thin, medium, wide lines
          const widthClass = code % 3 === 0 ? 'w-[1px]' : code % 3 === 1 ? 'w-[2px]' : 'w-[3px]';
          // alternate spaces (invisible lines)
          const isSpace = index % 2 === 1;
          
          if (isSpace) {
            return <div key={index} className="h-full bg-transparent w-[1px]" />;
          }
          return <div key={index} className={`h-full bg-slate-900 ${widthClass}`} />;
        })}
        {/* Fill remainder to look full */}
        {Array.from({ length: Math.max(5, 30 - codes.length) }).map((_, i) => {
          const widthClass = i % 2 === 0 ? 'w-[1px]' : 'w-[2px]';
          return <div key={`rem-${i}`} className={`h-full bg-slate-900 ${widthClass}`} />;
        })}
      </div>
    );
  };

  // Generate QR Code URL
  const qrData = shareUrl || `mailto:${data.email || 'student@school.edu'}?subject=Verified ID Card: ${data.name}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100&100&data=${encodeURIComponent(qrData)}&color=080710&bgcolor=ffffff`;

  // Inline CSS variable styles for theme customizations
  const cardThemeStyles = {
    '--theme-accent': data.colorTheme,
    '--theme-accent-glow': `${data.colorTheme}40`,
  } as React.CSSProperties;

  // Active theme classes mapping
  const getThemeClasses = () => {
    switch (data.template) {
      case 'cyberpunk':
        return {
          card: 'template-cyberpunk-bg border-zinc-700 font-mono text-zinc-400',
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
          badge: 'border-white/20 text-white bg-black/60 backdrop-blur-md font-bold',
          label: 'text-zinc-400 tracking-wide text-[9.5px]',
          value: 'text-white font-semibold',
        };
    }
  };

  const theme = getThemeClasses();

  const isPortrait = data.orientation === 'portrait';

  return (
    <div style={cardThemeStyles} className="w-full flex flex-col items-center">
      {/* 3D Scene Wrapper */}
      <div 
        className={`w-full perspective-1000 cursor-pointer card-hover-trigger relative group ${
          isPortrait ? 'max-w-[272px] aspect-[1/1.586]' : 'max-w-[430px] aspect-[1.586/1]'
        }`}
        onClick={toggleFlip}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Hover Hint */}
        <div className="absolute -top-7 right-4 flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-indigo-400" />
          <span>Click to Flip Card</span>
        </div>

        {/* 3D Card Container */}
        <div
          ref={cardRef}
          className={`w-full h-full relative preserve-3d transition-transform duration-700 ease-out select-none shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-2xl`}
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${isFlipped ? 180 - tilt.y : tilt.y}deg)`,
            transition: isHovering ? 'none' : 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          {/* Card Front Side */}
          <div className={`absolute top-0 left-0 w-full h-full backface-hidden rounded-2xl p-5 overflow-hidden flex flex-col justify-between ${theme.card}`}>
            {/* Holographic Shiny Overlay */}
            <div className="shiny-overlay rounded-2xl" />

            {/* Top Bar: School & Logo */}
            <div className="flex items-center justify-between gap-3 z-10 w-full">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <ShieldCheck className={`w-4 h-4 ${data.template === 'minimal' ? 'text-[var(--theme-accent)]' : theme.accentText}`} />
                </div>
                <div className="flex flex-col leading-none">
                  <h3 className={`text-xs font-extrabold tracking-wider uppercase truncate ${isPortrait ? 'max-w-[120px]' : 'max-w-[200px]'} ${data.template === 'minimal' ? 'text-white' : ''}`}>
                    {data.school || 'ACADEMIA INSTITUTE'}
                  </h3>
                  <span className={`text-[8px] tracking-widest opacity-80 uppercase ${theme.label}`}>
                    Institutional ID
                  </span>
                </div>
              </div>
              <div className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                {data.role || 'STUDENT'}
              </div>
            </div>

            {/* Middle Section: Photo & Core Details */}
            <div className={`flex z-10 flex-1 w-full ${isPortrait ? 'flex-col items-center justify-center gap-3 my-1.5' : 'items-center gap-4 my-2'}`}>
              {/* Profile Image Frame */}
              <div className={`relative shrink-0 ${isPortrait ? 'mt-0.5' : ''}`}>
                {data.template === 'cyberpunk' && (
                  <div className="absolute -inset-1 bg-emerald-500/20 blur-sm glow-cyberpunk" />
                )}
                <div className={`w-20 aspect-[3/4] relative rounded-lg overflow-hidden border bg-zinc-950 flex items-center justify-center ${
                  data.template === 'cyberpunk' ? 'border-emerald-500' :
                  data.template === 'classic' ? 'border-amber-400/50' :
                  data.template === 'retro' ? 'border-rose-500 border-2' :
                  'border-white/10'
                }`}>
                  {data.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={data.avatar} 
                      alt={data.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <User className="w-10 h-10 text-zinc-600" />
                  )}
                </div>
              </div>

              {/* Core Details Grid */}
              <div className={`flex-1 flex flex-col justify-center space-y-1 ${isPortrait ? 'items-center text-center w-full' : 'h-full'}`}>
                <div>
                  <span className={`${theme.label} block`}>Full Name</span>
                  <h2 className={`truncate text-sm font-extrabold tracking-wide ${
                    data.template === 'classic' ? 'text-amber-100 font-serif text-[15px]' : 'text-white font-sans'
                  } ${isPortrait ? 'text-center text-[15px] max-w-[220px]' : ''}`}>
                    {data.name || 'JANE DOE'}
                  </h2>
                </div>

                <div className={`grid gap-2 w-full ${isPortrait ? 'grid-cols-2 text-center' : 'grid-cols-2'}`}>
                  <div>
                    <span className={theme.label}>Roll No / ID</span>
                    <span className={`block text-[11px] truncate ${theme.value} ${isPortrait ? 'text-center text-[10px]' : ''}`}>
                      {data.idNumber || 'STU-2026-0042'}
                    </span>
                  </div>
                  <div>
                    <span className={theme.label}>Class / Dept</span>
                    <span className={`block text-[11px] truncate ${theme.value} ${isPortrait ? 'text-center text-[10px]' : ''}`}>
                      {data.grade || 'Computer Science'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar: Issues, Validity & Chip */}
            <div className="flex items-end justify-between border-t border-white/5 pt-2 z-10 w-full">
              <div className={`flex text-[9px] text-zinc-400 ${isPortrait ? 'flex-col gap-1 items-start' : 'items-center gap-4'}`}>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 opacity-60 text-zinc-400 shrink-0" />
                  <div className="leading-none">
                    <span className="opacity-60 text-[8px] uppercase">ISSUED: </span>
                    <span className="font-semibold text-zinc-200">{data.issueDate || '08/2025'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 opacity-60 text-zinc-400 shrink-0" />
                  <div className="leading-none">
                    <span className="opacity-60 text-[8px] uppercase">EXPIRES: </span>
                    <span className="font-semibold text-zinc-200">{data.expiryDate || '08/2026'}</span>
                  </div>
                </div>
              </div>
              
              {/* Virtual Microchip element */}
              <div className={`w-7 h-5 rounded-md flex flex-col justify-around p-0.5 border shrink-0 ${
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

          {/* Card Back Side (Rotated 180 degrees) */}
          <div 
            className={`absolute top-0 left-0 w-full h-full backface-hidden rounded-2xl p-5 overflow-hidden flex flex-col justify-between rotate-y-180 ${theme.card}`}
          >
            {/* Holographic Shiny Overlay */}
            <div className="shiny-overlay rounded-2xl" />

            {/* Back Header: Institution Verification */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2 z-10 w-full">
              <div className="flex flex-col leading-none">
                <span className={`text-[7.5px] uppercase tracking-widest ${theme.label}`}>Official Contact</span>
                <span className="text-[10px] font-semibold text-zinc-200 truncate max-w-[150px]">
                  {data.school || 'ACADEMIA INSTITUTE'}
                </span>
              </div>
              <span className="text-[8px] text-zinc-500 tracking-wider">SECURE ID</span>
            </div>

            {/* Back Center: Emergency, barcode and QR */}
            <div className={`flex z-10 flex-1 w-full ${isPortrait ? 'flex-col items-center justify-center gap-3 my-1.5' : 'gap-4 items-center my-1'}`}>
              {/* QR Code Container */}
              <div className={`p-1 bg-white rounded-lg flex items-center justify-center border shadow-md shrink-0 ${
                isPortrait ? 'w-[78px] h-[78px]' : 'w-[72px] h-[72px]'
              } ${
                data.template === 'cyberpunk' ? 'border-emerald-500' :
                data.template === 'classic' ? 'border-amber-400' :
                data.template === 'retro' ? 'border-rose-500' :
                'border-white/10'
              }`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={qrCodeUrl} 
                  alt="Scan Verification QR" 
                  className="w-full h-full object-contain"
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Personal details list */}
              <div className={`flex-1 flex flex-col justify-center space-y-1 ${isPortrait ? 'items-center text-center w-full' : ''}`}>
                <div className="flex items-center gap-1.5 text-[9.5px]">
                  <Droplet className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="text-zinc-400">BLOOD GRP:</span>
                  <span className="font-bold text-zinc-100">{data.bloodGroup || 'O+'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9.5px]">
                  <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="text-zinc-400">PHONE:</span>
                  <span className="font-semibold text-zinc-200">{data.phone || '+1 234-567-890'}</span>
                </div>
                <div className={`flex items-center gap-1.5 text-[9.5px] ${isPortrait ? 'max-w-full justify-center' : 'max-w-[190px]'}`}>
                  <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="text-zinc-400">EMAIL:</span>
                  <span className="font-semibold text-zinc-200 truncate max-w-[130px]">{data.email || 'j.doe@school.edu'}</span>
                </div>
              </div>
            </div>

            {/* Back Footer: Signature and Barcode */}
            <div className={`flex border-t border-white/5 pt-2 z-10 ${
              isPortrait ? 'flex-col items-center gap-2.5 w-full' : 'items-end justify-between gap-4 w-full'
            }`}>
              {/* Principal Signature Frame (above barcode in portrait) */}
              {isPortrait && (
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-8 w-20 relative flex items-center justify-center border-b border-zinc-500/40">
                    {data.signature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={data.signature} 
                        alt="Signature" 
                        className="max-h-full max-w-full object-contain filter invert brightness-200" 
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[7px] text-zinc-500 italic">Signature</span>
                    )}
                  </div>
                  <span className="text-[7px] uppercase tracking-widest text-zinc-400 mt-0.5">
                    Authority Signature
                  </span>
                </div>
              )}

              {/* Barcode Frame */}
              <div className={`flex flex-col space-y-0.5 ${isPortrait ? 'w-[150px] items-center' : 'w-[140px]'}`}>
                {renderBarcode(data.idNumber)}
                <span className="text-[7.5px] font-mono text-center tracking-widest text-zinc-400">
                  {data.idNumber || 'STU-2026-0042'}
                </span>
              </div>

              {/* Principal Signature Frame (on the right in landscape) */}
              {!isPortrait && (
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-8 w-20 relative flex items-center justify-center border-b border-zinc-500/40">
                    {data.signature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={data.signature} 
                        alt="Signature" 
                        className="max-h-full max-w-full object-contain filter invert brightness-200" 
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[7px] text-zinc-500 italic">Signature</span>
                    )}
                  </div>
                  <span className="text-[7px] uppercase tracking-widest text-zinc-400 mt-0.5">
                    Authority Signature
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Dynamic Instruction */}
      <span className="mt-4 text-zinc-500 text-xs font-medium tracking-wide">
        Hover to tilt in 3D • Click card to flip to the {isFlipped ? 'front' : 'back'}
      </span>
    </div>
  );
}
