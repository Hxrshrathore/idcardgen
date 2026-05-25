'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudentData, CustomTemplateConfig, decompressCustomTemplate } from '../utils/compressor';
import { User, RefreshCw, ShieldCheck, Phone, Mail, Droplets } from 'lucide-react';
import QRCode from 'qrcode';

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

export function getAvatarStyle(data: StudentData): React.CSSProperties {
  const adj = data.imageAdjustments || (data as any).image_adjustments;
  if (!adj) return { objectFit: 'cover', width: '100%', height: '100%' };
  const { zoom = 1, x = 0, y = 0, rotate = 0, brightness = 100, contrast = 100 } = adj;
  return {
    transform: `translate(${x}px, ${y}px) scale(${zoom}) rotate(${rotate}deg)`,
    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
    transition: 'transform 0.1s ease-out, filter 0.1s ease-out',
    objectFit: 'cover',
    transformOrigin: 'center center',
    width: '100%',
    height: '100%',
  };
}


// Reusable helper to resolve a custom template layout
export function getCustomTemplate(data: StudentData): CustomTemplateConfig | null {
  // 1. Try to decompress from data.customTemplateConfig if present
  if (data.customTemplateConfig) {
    const config = decompressCustomTemplate(data.customTemplateConfig);
    if (config) {
      // Look up in localStorage to see if we have the local template with background images
      if (typeof window !== 'undefined') {
        try {
          const savedTemplatesStr = localStorage.getItem('id-templates') || '[]';
          const savedTemplates = JSON.parse(savedTemplatesStr) as CustomTemplateConfig[];
          const found = savedTemplates.find(t => t.id === config.id || t.name === config.name);
          if (found) {
            // Merge in case local version has backgrounds
            return {
              ...config,
              frontBg: found.frontBg || config.frontBg,
              backBg: found.backBg || config.backBg,
            };
          }
        } catch (e) {
          console.error(e);
        }
      }
      return config;
    }
  }

  // 2. Try to look up in localStorage using template ID if data.template starts with 'custom-'
  if (data.template && data.template.startsWith('custom-') && typeof window !== 'undefined') {
    try {
      const savedTemplatesStr = localStorage.getItem('id-templates') || '[]';
      const savedTemplates = JSON.parse(savedTemplatesStr) as CustomTemplateConfig[];
      const found = savedTemplates.find(t => t.id === data.template);
      if (found) return found;
    } catch (e) {
      console.error(e);
    }
  }

  return null;
}

// Flat custom card face component that absolute positions fields using percentages
export function CustomIDCardFace({
  data,
  side,
  customConfig,
  shareUrl,
  flat = false,
}: {
  data: StudentData;
  side: 'front' | 'back';
  customConfig: CustomTemplateConfig;
  shareUrl?: string;
  flat?: boolean;
}) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const qrData = data.qrType === 'vcard'
    ? `BEGIN:VCARD\nVERSION:3.0\nN:${data.name || 'Student'};;;;\nFN:${data.name || 'Student'}\nORG:${data.school || 'School'}\nTITLE:${data.role || 'STUDENT'}\nTEL;TYPE=CELL:${data.phone || ''}\nEMAIL;TYPE=PREF,INTERNET:${data.email || ''}\nNOTE:Grade: ${data.grade || ''}\\nID: ${data.idNumber || ''}\\nBlood Group: ${data.bloodGroup || ''}\nEND:VCARD`
    : (shareUrl || `${data.name} | ${data.idNumber} | ${data.school}`);

  useEffect(() => {
    QRCode.toDataURL(qrData, {
      margin: 1, width: 160,
      color: { dark: '#1e3a5f', light: '#ffffff' },
    }).then(setQrUrl).catch(console.error);
  }, [qrData]);

  useEffect(() => {
    if (customConfig && customConfig.elements) {
      Object.values(customConfig.elements).forEach((el: any) => {
        if (el && el.enabled && el.fontFamily) {
          loadGoogleFont(el.fontFamily);
        }
      });
    }
  }, [customConfig]);

  const renderBarcode = (id: string, color = '#1e3a5f') => {
    const str = (id || 'STU-2026-0042').trim();
    const patterns = [
      "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
      "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
      "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
      "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
      "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
      "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
      "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
      "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
      "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
      "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
      "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
    ];

    const startCode = 104; // Start B
    const stopCode = 106;  // Stop
    const charCodes = [startCode];
    let sum = startCode;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      const val = code >= 32 && code <= 127 ? code - 32 : 0;
      charCodes.push(val);
      sum += val * (i + 1);
    }
    charCodes.push(sum % 103);
    charCodes.push(stopCode);

    let modules = "";
    charCodes.forEach((val) => {
      const pat = patterns[val];
      for (let i = 0; i < pat.length; i++) {
        const width = parseInt(pat[i], 10);
        const bit = (i % 2 === 0) ? "1" : "0";
        modules += bit.repeat(width);
      }
    });

    let path = "";
    let x = 0;
    let runLength = 0;
    for (let i = 0; i <= modules.length; i++) {
      if (i < modules.length && modules[i] === "1") {
        runLength++;
      } else {
        if (runLength > 0) {
          path += `M${x - runLength},0 h${runLength} v28 h-${runLength} z `;
          runLength = 0;
        }
      }
      x++;
    }

    return (
      <svg 
        viewBox={`0 0 ${modules.length} 28`} 
        width="100%" 
        height="100%" 
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="overflow-hidden"
      >
        <path d={path} fill={color} />
      </svg>
    );
  };

  const bg = side === 'front' ? customConfig.frontBg : customConfig.backBg;

  // Fallback premium dark mesh/gradient background
  const hasBg = !!bg;
  const backgroundStyle: React.CSSProperties = hasBg
    ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {
        background: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        fontFamily: "'Outfit', sans-serif",
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: side === 'back' ? 'rotateY(180deg) translateZ(1px)' : 'rotateY(0deg) translateZ(1px)',
        ...backgroundStyle,
      }}
    >
      {/* Fallback layout alert badge if background is missing */}
      {!hasBg && (
        <div className="absolute top-2.5 left-2.5 z-50 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[6.5px] uppercase font-bold tracking-widest rounded flex items-center gap-1">
          <span>LAYOUT BG NOT SHARED IN URL</span>
        </div>
      )}

      {/* Render each enabled element in customConfig.elements */}
      {Object.entries(customConfig.elements || {}).map(([key, el]: [string, any]) => {
        if (!el || !el.enabled || el.side !== side) return null;

        const isText = key !== 'avatar' && key !== 'qrCode' && key !== 'barcode' && key !== 'signature' && key !== 'schoolLogo';
        const val = 
          key === 'school' ? (data.school || 'INDIAN PUBLIC SCHOOL') :
          key === 'name' ? (data.name || 'STUDENT NAME') :
          key === 'role' ? (data.role || 'STUDENT') :
          key === 'idNumber' ? (data.idNumber || 'STU-2026-0042') :
          key === 'grade' ? (data.grade || 'X-A') :
          key === 'phone' ? (data.phone || '+91 98765 43210') :
          key === 'email' ? (data.email || 'student@school.edu') :
          key === 'bloodGroup' ? (data.bloodGroup || 'O+') : '';

        return (
          <div
            key={key}
            style={{
              position: 'absolute',
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.w}%`,
              height: `${el.h}%`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {isText ? (
              <span
                style={{
                  width: '100%',
                  fontSize: `${el.fontSize * (flat ? 1.0 : 0.88)}px`, // scale up a bit for flat print size
                  color: el.color || '#1e3a5f',
                  textAlign: el.align || 'center',
                  fontWeight: el.bold ? 'bold' : 'normal',
                  fontStyle: el.italic ? 'italic' : 'normal',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  fontFamily: el.fontFamily ? `'${el.fontFamily}', sans-serif` : "'Outfit', sans-serif",
                }}
              >
                {val}
              </span>
            ) : (
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {key === 'avatar' && (
                  data.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.avatar} alt="Photo" className="w-full h-full" style={getAvatarStyle(data)} crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full h-full bg-[#f0f4f8] flex items-center justify-center border text-[#1e3a5f] font-bold text-[7px] uppercase">
                      PHOTO
                    </div>
                  )
                )}
                {key === 'qrCode' && (
                  qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrUrl} alt="QR" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 animate-pulse" />
                  )
                )}
                {key === 'barcode' && (
                  <div className="w-full h-full bg-white p-1">
                    {renderBarcode(data.idNumber, el.color || '#1e3a5f')}
                  </div>
                )}
                {key === 'signature' && (
                  data.signature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.signature} alt="Sig" className="max-w-full max-h-full object-contain" style={{ filter: 'contrast(2)' }} />
                  ) : (
                    <div className="w-full h-full border border-dashed border-zinc-400 bg-zinc-50 flex items-center justify-center text-[6px] italic text-zinc-400">
                      Signature
                    </div>
                  )
                )}
                {key === 'schoolLogo' && (
                  data.schoolLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.schoolLogo} alt="School Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full h-full bg-[#f0f4f8] flex items-center justify-center border text-[#1e3a5f] font-bold text-[7px] uppercase">
                      LOGO
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface IDCardPreviewProps {
  data: StudentData;
  isFlippedOverride?: boolean;
  showMockupOverride?: boolean;
  shareUrl?: string;
}

export default function IDCardPreview({ data, isFlippedOverride, showMockupOverride, shareUrl }: IDCardPreviewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [showMockup, setShowMockup] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFlippedOverride !== undefined) setIsFlipped(isFlippedOverride);
  }, [isFlippedOverride]);

  useEffect(() => {
    if (showMockupOverride !== undefined) setShowMockup(showMockupOverride);
  }, [showMockupOverride]);

  const qrData = data.qrType === 'vcard'
    ? `BEGIN:VCARD\nVERSION:3.0\nN:${data.name || 'Student'};;;;\nFN:${data.name || 'Student'}\nORG:${data.school || 'School'}\nTITLE:${data.role || 'STUDENT'}\nTEL;TYPE=CELL:${data.phone || ''}\nEMAIL;TYPE=PREF,INTERNET:${data.email || ''}\nNOTE:Grade: ${data.grade || ''}\\nID: ${data.idNumber || ''}\\nBlood Group: ${data.bloodGroup || ''}\nEND:VCARD`
    : (shareUrl || `${data.name} | ${data.idNumber} | ${data.school}`);

  useEffect(() => {
    QRCode.toDataURL(qrData, {
      margin: 1, width: 160,
      color: { dark: '#1e3a5f', light: '#ffffff' },
    }).then(setQrUrl).catch(console.error);
  }, [qrData]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 10, y: px * 10 });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
  };

  const toggleFlip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsFlipped(prev => !prev);
  };

  // Barcode renderer
  const renderBarcode = (id: string, color = '#1e3a5f') => {
    const str = (id || 'STU-2026-0042').trim();
    const patterns = [
      "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
      "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
      "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
      "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
      "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
      "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
      "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
      "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
      "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
      "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
      "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
    ];

    const startCode = 104; // Start B
    const stopCode = 106;  // Stop
    const charCodes = [startCode];
    let sum = startCode;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      const val = code >= 32 && code <= 127 ? code - 32 : 0;
      charCodes.push(val);
      sum += val * (i + 1);
    }
    charCodes.push(sum % 103);
    charCodes.push(stopCode);

    let modules = "";
    charCodes.forEach((val) => {
      const pat = patterns[val];
      for (let i = 0; i < pat.length; i++) {
        const width = parseInt(pat[i], 10);
        const bit = (i % 2 === 0) ? "1" : "0";
        modules += bit.repeat(width);
      }
    });

    let path = "";
    let x = 0;
    let runLength = 0;
    for (let i = 0; i <= modules.length; i++) {
      if (i < modules.length && modules[i] === "1") {
        runLength++;
      } else {
        if (runLength > 0) {
          path += `M${x - runLength},0 h${runLength} v28 h-${runLength} z `;
          runLength = 0;
        }
      }
      x++;
    }

    return (
      <svg 
        viewBox={`0 0 ${modules.length} 28`} 
        width="100%" 
        height="100%" 
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="overflow-hidden"
      >
        <path d={path} fill={color} />
      </svg>
    );
  };


  // India tricolor stripe
  const TricolorStripe = ({ height = 3 }: { height?: number }) => (
    <div className="flex w-full" style={{ height }}>
      <div className="flex-1 bg-[#FF9933]" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-[#138808]" />
    </div>
  );

  // School emblem placeholder (circular with initials or custom logo)
  const SchoolEmblem = ({ size = 32, bg = 'rgba(255,255,255,0.15)', border = 'rgba(255,255,255,0.4)', textColor = 'white' }: { size?: number; bg?: string; border?: string; textColor?: string }) => {
    if (data.schoolLogo) {
      return (
        <div
          className="rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-white"
          style={{ width: size, height: size, border: `1px solid ${border}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.schoolLogo} alt="Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
        </div>
      );
    }
    const initials = (data.school || 'School')
      .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return (
      <div
        className="rounded-full flex items-center justify-center shrink-0 font-black"
        style={{ width: size, height: size, fontSize: size * 0.28, background: bg, border: `2px solid ${border}`, color: textColor }}
      >
        {initials}
      </div>
    );
  };

  const template = data.template || 'cbse-portrait';

  // ══════════════════════════════════════════════════════
  // TEMPLATE 1: CBSE-PORTRAIT — Navy Blue Official
  // ══════════════════════════════════════════════════════
  const CbsePortraitFront = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(0deg) translateZ(1px)',
        background: '#ffffff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Header: Navy blue band */}
      <div
        className="w-full flex flex-col items-center justify-center gap-1 px-3 pt-3 pb-2 relative"
        style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #1e4d8c 60%, #1a3a6b 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #ffffff 0, #ffffff 1px, transparent 0, transparent 50%)',
            backgroundSize: '8px 8px',
          }}
        />
        <div className="flex items-center gap-2 z-10 w-full justify-center">
          <SchoolEmblem size={30} />
          <div className="flex flex-col items-center leading-none">
            <span className="text-white font-black text-[9px] tracking-wider uppercase text-center leading-tight" style={{ maxWidth: 140, lineHeight: 1.2 }}>
              {data.school || 'INDIAN PUBLIC SCHOOL'}
            </span>
            <span className="text-white/60 text-[6.5px] tracking-widest uppercase mt-0.5">Est. 1985 · Affiliated to CBSE</span>
          </div>
          <SchoolEmblem size={30} />
        </div>
      </div>
      <TricolorStripe />
      <div className="w-full text-center py-1" style={{ background: '#1e4d8c' }}>
        <span className="text-white font-black text-[8px] tracking-[0.2em] uppercase">Identity Card</span>
      </div>
      <div className="flex-1 flex px-3 py-2 gap-3 bg-white">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="overflow-hidden flex items-center justify-center bg-[#f0f4f8]" style={{ width: 68, height: 80, border: '2px solid #1e4d8c', borderRadius: 2 }}>
            {data.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.avatar} alt="Photo" className="w-full h-full" style={getAvatarStyle(data)} crossOrigin="anonymous" />
            ) : (
              <User className="w-8 h-8" style={{ color: '#1e4d8c' }} />
            )}
          </div>
          <div className="px-2 py-0.5 text-white font-black text-[6.5px] tracking-wider uppercase w-full text-center" style={{ background: '#1e4d8c', borderRadius: 1 }}>
            {data.role || 'STUDENT'}
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-[5px]">
          <div className="border-b pb-1" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-[6.5px] font-bold uppercase tracking-wider" style={{ color: '#1e4d8c' }}>Name</p>
            <p className="text-[10px] font-black leading-tight" style={{ color: '#0f172a' }}>{data.name || 'STUDENT NAME'}</p>
          </div>
          {[
            { label: 'Class / Section', value: data.grade || 'X-A' },
            { label: 'Roll No. / ID', value: data.idNumber || 'STU-2026-001' },
            { label: 'Blood Group', value: data.bloodGroup || 'O+' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-baseline gap-1">
              <span className="text-[6px] font-bold uppercase tracking-wider shrink-0 w-[60px]" style={{ color: '#64748b' }}>{label}</span>
              <span className="text-[8px] font-bold" style={{ color: '#1e293b' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full px-3 py-1.5 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #1a3a6b, #1e4d8c)' }}>
        <div className="flex flex-col">
          <span className="text-white/50 text-[5.5px] uppercase tracking-wider">Valid From</span>
          <span className="text-white font-bold text-[7px]">{data.issueDate || '08/2025'}</span>
        </div>
        <div className="h-6 w-px bg-white/20" />
        <div className="flex flex-col items-center">
          <span className="text-white/50 text-[5.5px] uppercase tracking-wider">Academic Year</span>
          <span className="text-white font-bold text-[7px]">2025–2026</span>
        </div>
        <div className="h-6 w-px bg-white/20" />
        <div className="flex flex-col items-end">
          <span className="text-white/50 text-[5.5px] uppercase tracking-wider">Valid Until</span>
          <span className="text-white font-bold text-[7px]">{data.expiryDate || '08/2026'}</span>
        </div>
      </div>
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-white/20 border border-white/30" />
    </div>
  );

  const CbsePortraitBack = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg) translateZ(1px)',
        background: '#f8fafc',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div className="w-full px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1a3a6b, #1e4d8c)' }}>
        <ShieldCheck className="w-4 h-4 text-white/80 shrink-0" />
        <div>
          <p className="text-white font-black text-[8px] tracking-wide uppercase leading-none">{data.school || 'Indian Public School'}</p>
          <p className="text-white/50 text-[6px] tracking-wider">Emergency Information</p>
        </div>
      </div>
      <TricolorStripe />
      <div className="flex-1 flex flex-col px-3 py-2 gap-2 bg-white">
        <div className="flex gap-2 items-start">
          <div className="shrink-0 flex items-center justify-center bg-white" style={{ width: 60, height: 60, border: '1.5px solid #1e4d8c', padding: 2 }}>
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="QR" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full animate-pulse" style={{ background: '#e2e8f0' }} />
            )}
          </div>
          <div className="flex-1 flex flex-col gap-1">
            {[
              { label: 'Phone', value: data.phone || '+91 98765 43210' },
              { label: 'Email', value: data.email || 'student@school.edu' },
              { label: 'Blood Grp', value: data.bloodGroup || 'O+' },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="text-[6px] font-bold uppercase tracking-wider block" style={{ color: '#1e4d8c' }}>{label}</span>
                <span className="text-[7.5px] font-semibold block truncate" style={{ color: '#0f172a', maxWidth: 110 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full h-px" style={{ background: '#e2e8f0' }} />
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center justify-center" style={{ width: 72, height: 22, borderBottom: '1px solid #94a3b8', background: '#f8fafc' }}>
              {data.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.signature} alt="Signature" className="max-h-full max-w-full object-contain" style={{ filter: 'contrast(2)' }} />
              ) : (
                <span className="text-[6px] italic" style={{ color: '#94a3b8' }}>Signature</span>
              )}
            </div>
            <span className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Principal</span>
          </div>
          <div className="rounded-full flex flex-col items-center justify-center border-2" style={{ width: 42, height: 42, borderColor: '#1e4d8c', borderStyle: 'dashed', opacity: 0.5 }}>
            <span className="text-[5px] font-black text-center leading-tight uppercase" style={{ color: '#1e4d8c' }}>School<br />Seal</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>If found, return to</span>
            <span className="text-[6.5px] font-bold" style={{ color: '#1e3a6b', maxWidth: 70 }}>{data.school || 'School Office'}</span>
          </div>
        </div>
      </div>
      <div className="w-full px-3 py-2 flex flex-col items-center gap-0.5" style={{ background: 'linear-gradient(90deg, #1a3a6b, #1e4d8c)' }}>
        <div className="flex items-end gap-[1px] bg-white px-2 py-1 w-full">
          {renderBarcode(data.idNumber)}
        </div>
        <span className="text-white/60 text-[6px] tracking-[0.18em] font-mono">{data.idNumber || 'STU-2026-0042'}</span>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════
  // TEMPLATE 2: SAFFRON-PORTRAIT — Kendriya Vidyalaya Warm
  // ══════════════════════════════════════════════════════
  const SaffronPortraitFront = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(0deg) translateZ(1px)',
        background: '#fffbf5',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Saffron gradient header */}
      <div className="w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #c45200 0%, #e86c00 40%, #FF9933 100%)', paddingBottom: 12, paddingTop: 10 }}>
        {/* Sun burst pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'repeating-conic-gradient(from 0deg at 50% 120%, transparent 0deg, transparent 9deg, rgba(255,255,255,0.8) 10deg, transparent 11deg)',
        }} />
        <div className="flex flex-col items-center gap-1 z-10 relative px-3">
          <div className="flex items-center gap-2">
            <SchoolEmblem size={32} bg="rgba(255,255,255,0.2)" border="rgba(255,255,255,0.5)" />
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-[9.5px] tracking-wide uppercase text-center leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                {data.school || 'KENDRIYA VIDYALAYA'}
              </span>
              <span className="text-orange-100 text-[6px] tracking-widest uppercase mt-0.5">केन्द्रीय विद्यालय · CBSE Affiliated</span>
            </div>
            <SchoolEmblem size={32} bg="rgba(255,255,255,0.2)" border="rgba(255,255,255,0.5)" />
          </div>
        </div>
      </div>

      {/* Tricolor stripe */}
      <TricolorStripe height={4} />

      {/* Student ID badge */}
      <div className="w-full flex items-center justify-center py-[5px]" style={{ background: '#c45200' }}>
        <span className="text-white font-black text-[7.5px] tracking-[0.25em] uppercase">छात्र पहचान पत्र · Student ID Card</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-3 pt-2 pb-1 bg-[#fffbf5]">
        {/* Photo centered */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="overflow-hidden flex items-center justify-center" style={{
              width: 68, height: 82,
              border: '2.5px solid #e86c00',
              borderRadius: 3,
              background: '#fff3e6',
            }}>
              {data.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.avatar} alt="Photo" className="w-full h-full" style={getAvatarStyle(data)} crossOrigin="anonymous" />
              ) : (
                <User className="w-8 h-8" style={{ color: '#e86c00' }} />
              )}
            </div>
            <div className="px-2 py-0.5 text-white font-black text-[6px] tracking-wider uppercase w-full text-center" style={{ background: '#e86c00', borderRadius: 2 }}>
              {data.role || 'STUDENT'}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-[5px]">
            <div className="border-b-2 pb-1" style={{ borderColor: '#FF9933' }}>
              <p className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#c45200' }}>Student Name / नाम</p>
              <p className="text-[10px] font-black leading-tight" style={{ color: '#1a0a00' }}>{data.name || 'STUDENT NAME'}</p>
            </div>
            {[
              { label: 'Class / कक्षा', value: data.grade || 'X-A' },
              { label: 'Admission No.', value: data.idNumber || 'KV-2026-001' },
              { label: 'Blood Group', value: data.bloodGroup || 'O+' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-1">
                <span className="text-[5.5px] font-bold uppercase tracking-wide shrink-0 w-[62px]" style={{ color: '#92400e' }}>{label}</span>
                <span className="text-[8px] font-bold" style={{ color: '#1a0a00' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative chakra watermark */}
        <div className="flex justify-center mt-1 opacity-10">
          <div className="w-8 h-8 rounded-full border-2 border-orange-600 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border border-orange-600" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full px-3 py-1.5 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #c45200, #e86c00)' }}>
        <div className="flex flex-col">
          <span className="text-orange-200 text-[5.5px] uppercase tracking-wider">Issued</span>
          <span className="text-white font-bold text-[7px]">{data.issueDate || '08/2025'}</span>
        </div>
        <div className="h-5 w-px bg-white/20" />
        <div className="flex flex-col items-center">
          <span className="text-orange-200 text-[5.5px] uppercase tracking-wider">Session</span>
          <span className="text-white font-bold text-[7px]">2025–2026</span>
        </div>
        <div className="h-5 w-px bg-white/20" />
        <div className="flex flex-col items-end">
          <span className="text-orange-200 text-[5.5px] uppercase tracking-wider">Expires</span>
          <span className="text-white font-bold text-[7px]">{data.expiryDate || '08/2026'}</span>
        </div>
      </div>
    </div>
  );

  const SaffronPortraitBack = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg) translateZ(1px)',
        background: '#fffbf5',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div className="w-full px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #c45200, #e86c00)' }}>
        <ShieldCheck className="w-4 h-4 text-orange-100 shrink-0" />
        <div>
          <p className="text-white font-black text-[8px] tracking-wide uppercase">{data.school || 'Kendriya Vidyalaya'}</p>
          <p className="text-orange-200 text-[6px] tracking-wider">आपातकालीन जानकारी · Emergency Info</p>
        </div>
      </div>
      <TricolorStripe height={4} />
      <div className="flex-1 flex flex-col px-3 py-2 gap-2 bg-[#fffbf5]">
        <div className="flex gap-2 items-start">
          <div className="shrink-0 p-1 bg-white" style={{ border: '1.5px solid #e86c00' }}>
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="QR" style={{ width: 52, height: 52, objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 52, height: 52, background: '#ffe8cc' }} className="animate-pulse" />
            )}
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            {[
              { icon: <Phone className="w-2.5 h-2.5" />, label: 'Emergency', value: data.phone || '+91 98765 43210' },
              { icon: <Mail className="w-2.5 h-2.5" />, label: 'Email', value: data.email || 'student@kv.edu' },
              { icon: <Droplets className="w-2.5 h-2.5" />, label: 'Blood Group', value: data.bloodGroup || 'O+' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-1">
                <span style={{ color: '#e86c00' }} className="shrink-0 mt-0.5">{icon}</span>
                <div>
                  <span className="text-[5.5px] font-bold uppercase tracking-wider block" style={{ color: '#92400e' }}>{label}</span>
                  <span className="text-[7.5px] font-semibold block truncate" style={{ color: '#1a0a00', maxWidth: 100 }}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full h-px" style={{ background: '#fcd9b0' }} />
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center justify-center" style={{ width: 68, height: 20, borderBottom: '1.5px solid #e86c00', background: '#fff8f0' }}>
              {data.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.signature} alt="Sig" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-[6px] italic" style={{ color: '#d97706' }}>Signature</span>
              )}
            </div>
            <span className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#92400e' }}>Principal</span>
          </div>
          <div className="rounded-full flex flex-col items-center justify-center" style={{ width: 40, height: 40, border: '2px dashed #e86c00', opacity: 0.6 }}>
            <span className="text-[5px] font-black text-center" style={{ color: '#c45200' }}>SCHOOL<br />SEAL</span>
          </div>
          <div className="text-right">
            <p className="text-[5.5px] uppercase tracking-wider font-bold" style={{ color: '#92400e' }}>If Found Return To</p>
            <p className="text-[6.5px] font-bold" style={{ color: '#c45200' }}>{data.school || 'School Office'}</p>
          </div>
        </div>
      </div>
      <div className="w-full px-2 py-1.5 flex flex-col items-center gap-0.5" style={{ background: 'linear-gradient(90deg, #c45200, #e86c00)' }}>
        <div className="bg-white px-2 py-1 w-full flex items-end gap-[1px]">
          {renderBarcode(data.idNumber, '#c45200')}
        </div>
        <span className="text-orange-200 text-[6px] tracking-[0.15em] font-mono">{data.idNumber || 'KV-2026-0042'}</span>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════
  // TEMPLATE 3: GREEN-PORTRAIT — Navodaya / Eco School
  // ══════════════════════════════════════════════════════
  const GreenPortraitFront = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(0deg) translateZ(1px)',
        background: '#f0faf4',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Green gradient header */}
      <div className="w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)', paddingTop: 10, paddingBottom: 10 }}>
        {/* Leaf pattern overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(ellipse 20px 30px at 20px 20px, white 0%, transparent 60%), radial-gradient(ellipse 15px 25px at 60px 50px, white 0%, transparent 60%)',
          backgroundSize: '80px 80px',
        }} />
        <div className="flex flex-col items-center gap-1 z-10 relative px-3">
          <div className="flex items-center gap-2 w-full justify-center">
            <SchoolEmblem size={30} bg="rgba(255,255,255,0.15)" border="rgba(255,255,255,0.4)" />
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-[9px] tracking-wide uppercase text-center leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                {data.school || 'NAVODAYA VIDYALAYA'}
              </span>
              <span className="text-green-200 text-[6px] tracking-widest uppercase mt-0.5">नवोदय विद्यालय · NVS Affiliated</span>
            </div>
            <SchoolEmblem size={30} bg="rgba(255,255,255,0.15)" border="rgba(255,255,255,0.4)" />
          </div>
        </div>
      </div>

      {/* Tricolor + green accent */}
      <TricolorStripe height={3} />
      <div className="h-1" style={{ background: '#047857' }} />

      {/* ID Label */}
      <div className="w-full flex items-center justify-center py-[5px]" style={{ background: '#065f46' }}>
        <span className="text-white font-black text-[7.5px] tracking-[0.2em] uppercase">Student Identity Card</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex px-3 py-2 gap-3 bg-[#f0faf4]">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="overflow-hidden flex items-center justify-center" style={{
            width: 66, height: 80,
            border: '2.5px solid #047857',
            borderRadius: 4,
            background: '#d1fae5',
          }}>
            {data.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.avatar} alt="Photo" className="w-full h-full" style={getAvatarStyle(data)} crossOrigin="anonymous" />
            ) : (
              <User className="w-8 h-8" style={{ color: '#047857' }} />
            )}
          </div>
          <div className="px-2 py-0.5 text-white font-black text-[6px] tracking-wider uppercase w-full text-center" style={{ background: '#047857', borderRadius: 2 }}>
            {data.role || 'STUDENT'}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-[5px]">
          <div className="pb-1" style={{ borderBottom: '2px solid #6ee7b7' }}>
            <p className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#047857' }}>Name / नाम</p>
            <p className="text-[10px] font-black leading-tight" style={{ color: '#022c22' }}>{data.name || 'STUDENT NAME'}</p>
          </div>
          {[
            { label: 'Class & Sec.', value: data.grade || 'IX-B' },
            { label: 'Admission No.', value: data.idNumber || 'NVS-2026-001' },
            { label: 'Blood Group', value: data.bloodGroup || 'B+' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-baseline gap-1">
              <span className="text-[5.5px] font-bold uppercase tracking-wide shrink-0 w-[58px]" style={{ color: '#065f46' }}>{label}</span>
              <span className="text-[8px] font-bold" style={{ color: '#022c22' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full px-3 py-1.5 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #064e3b, #047857)' }}>
        <div className="flex flex-col">
          <span className="text-green-300 text-[5.5px] uppercase tracking-wider">Valid From</span>
          <span className="text-white font-bold text-[7px]">{data.issueDate || '08/2025'}</span>
        </div>
        <div className="h-5 w-px bg-white/20" />
        <div className="flex flex-col items-center">
          <span className="text-green-300 text-[5.5px] uppercase tracking-wider">Session</span>
          <span className="text-white font-bold text-[7px]">2025–2026</span>
        </div>
        <div className="h-5 w-px bg-white/20" />
        <div className="flex flex-col items-end">
          <span className="text-green-300 text-[5.5px] uppercase tracking-wider">Expires</span>
          <span className="text-white font-bold text-[7px]">{data.expiryDate || '08/2026'}</span>
        </div>
      </div>
    </div>
  );

  const GreenPortraitBack = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg) translateZ(1px)',
        background: '#f0faf4',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div className="w-full px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #064e3b, #047857)' }}>
        <ShieldCheck className="w-4 h-4 text-green-200 shrink-0" />
        <div>
          <p className="text-white font-black text-[8px] tracking-wide uppercase">{data.school || 'Navodaya Vidyalaya'}</p>
          <p className="text-green-200 text-[6px] tracking-wider">Emergency Information · आपातकाल</p>
        </div>
      </div>
      <TricolorStripe />
      <div className="flex-1 flex flex-col px-3 py-2 gap-2 bg-[#f0faf4]">
        <div className="flex gap-2 items-start">
          <div className="shrink-0 p-1 bg-white" style={{ border: '1.5px solid #047857' }}>
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="QR" style={{ width: 52, height: 52, objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 52, height: 52, background: '#d1fae5' }} className="animate-pulse" />
            )}
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            {[
              { label: 'Parent/Guardian Phone', value: data.phone || '+91 98765 43210' },
              { label: 'Email', value: data.email || 'student@nvs.edu' },
              { label: 'Blood Group', value: data.bloodGroup || 'B+' },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="text-[5.5px] font-bold uppercase tracking-wider block" style={{ color: '#047857' }}>{label}</span>
                <span className="text-[7px] font-semibold block truncate" style={{ color: '#022c22', maxWidth: 105 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full h-px" style={{ background: '#6ee7b7' }} />
        <div className="flex items-end justify-between">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center justify-center" style={{ width: 68, height: 20, borderBottom: '1.5px solid #047857', background: '#ecfdf5' }}>
              {data.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.signature} alt="Sig" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-[6px] italic" style={{ color: '#6ee7b7' }}>Signature</span>
              )}
            </div>
            <span className="text-[6px] font-bold uppercase" style={{ color: '#047857' }}>Principal</span>
          </div>
          <div className="rounded-full flex flex-col items-center justify-center" style={{ width: 40, height: 40, border: '2px dashed #047857', opacity: 0.6 }}>
            <span className="text-[5px] font-black text-center" style={{ color: '#065f46' }}>SCHOOL<br />SEAL</span>
          </div>
          <div className="text-right">
            <p className="text-[5.5px] uppercase tracking-wider font-bold" style={{ color: '#065f46' }}>Return To</p>
            <p className="text-[6.5px] font-bold" style={{ color: '#047857' }}>{data.school || 'School Office'}</p>
          </div>
        </div>
      </div>
      <div className="w-full px-2 py-1.5 flex flex-col items-center gap-0.5" style={{ background: 'linear-gradient(90deg, #064e3b, #047857)' }}>
        <div className="bg-white px-2 py-1 w-full flex items-end gap-[1px]">
          {renderBarcode(data.idNumber, '#047857')}
        </div>
        <span className="text-green-300 text-[6px] tracking-[0.15em] font-mono">{data.idNumber || 'NVS-2026-0042'}</span>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════
  // TEMPLATE 4: NAVY-LANDSCAPE — DPS / Corporate School
  // ══════════════════════════════════════════════════════
  const NavyLandscapeFront = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-row"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(0deg) translateZ(1px)',
        background: '#ffffff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
        width: '100%',
        height: '100%',
      }}
    >
      {/* Left blue accent strip */}
      <div className="flex flex-col items-center justify-between py-3 px-2 shrink-0" style={{ width: 52, background: 'linear-gradient(180deg, #0f2552 0%, #1a3a8c 50%, #0f2552 100%)' }}>
        <SchoolEmblem size={36} bg="rgba(255,255,255,0.15)" border="rgba(255,255,255,0.35)" />
        {/* Vertical text */}
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'rgba(255,255,255,0.5)', fontSize: 6, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 'bold' }}>
          STUDENT CREDENTIAL
        </div>
        {/* Blood group badge */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-white/40 text-[5.5px] uppercase">Blood</span>
          <span className="text-white font-black text-[9px]">{data.bloodGroup || 'O+'}</span>
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 flex flex-col">
        {/* School header */}
        <div className="px-3 pt-2 pb-1.5" style={{ background: '#f0f4ff', borderBottom: '2px solid #1a3a8c' }}>
          <p className="text-[9px] font-black tracking-wide uppercase" style={{ color: '#0f2552' }}>{data.school || 'DELHI PUBLIC SCHOOL'}</p>
          <p className="text-[6px] tracking-widest font-bold" style={{ color: '#3b5bdb' }}>Affiliated to CBSE · Reg. No. 2930112 · Est. 1949</p>
        </div>

        <TricolorStripe height={3} />

        {/* Body */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5">
          {/* Photo */}
          <div className="shrink-0" style={{ width: 52, height: 64, border: '2px solid #1a3a8c', overflow: 'hidden', background: '#e8eeff' }}>
            {data.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.avatar} alt="Photo" className="w-full h-full" style={getAvatarStyle(data)} crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-7 h-7" style={{ color: '#1a3a8c' }} />
              </div>
            )}
          </div>

          {/* Student info */}
          <div className="flex-1 flex flex-col gap-[3px]">
            <div>
              <p className="text-[5.5px] font-bold uppercase tracking-wider" style={{ color: '#3b5bdb' }}>Student Name</p>
              <p className="text-[11px] font-black leading-tight" style={{ color: '#0f2552' }}>{data.name || 'STUDENT NAME'}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-0.5">
              {[
                { label: 'Class/Section', value: data.grade || 'XII-A' },
                { label: 'Roll Number', value: data.idNumber || 'DPS-2026-001' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="text-[5.5px] font-bold uppercase block" style={{ color: '#6b7280' }}>{label}</span>
                  <span className="text-[8px] font-bold block" style={{ color: '#0f2552' }}>{value}</span>
                </div>
              ))}
            </div>
            {/* Role badge */}
            <div className="mt-1 inline-flex">
              <span className="px-2 py-0.5 text-white font-black text-[6px] tracking-wider uppercase" style={{ background: '#1a3a8c' }}>
                {data.role || 'STUDENT'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 flex items-center justify-between" style={{ background: '#0f2552' }}>
          <div>
            <p className="text-blue-300 text-[5px] uppercase tracking-wider">Valid</p>
            <p className="text-white font-bold text-[7px]">{data.issueDate || '08/2025'} – {data.expiryDate || '08/2026'}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-300 text-[5px] uppercase tracking-wider">Academic Year</p>
            <p className="text-white font-bold text-[7px]">2025 – 2026</p>
          </div>
        </div>
      </div>
    </div>
  );

  const NavyLandscapeBack = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-row"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg) translateZ(1px)',
        background: '#f8faff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Left strip */}
      <div className="flex flex-col items-center justify-center py-3 px-1.5 shrink-0 gap-2" style={{ width: 44, background: 'linear-gradient(180deg, #0f2552, #1a3a8c)' }}>
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'rgba(255,255,255,0.4)', fontSize: 5.5, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 'bold' }}>
          EMERGENCY INFO
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 flex flex-col">
        <div className="px-3 py-2 flex items-center gap-2" style={{ background: '#0f2552' }}>
          <ShieldCheck className="w-3.5 h-3.5 text-blue-300 shrink-0" />
          <p className="text-white font-black text-[7.5px] uppercase tracking-wide">{data.school || 'Delhi Public School'}</p>
        </div>
        <TricolorStripe />
        <div className="flex-1 flex items-center gap-3 px-3 py-2">
          <div className="p-1 bg-white shrink-0" style={{ border: '1.5px solid #1a3a8c' }}>
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="QR" style={{ width: 52, height: 52 }} />
            ) : (
              <div style={{ width: 52, height: 52 }} className="bg-blue-50 animate-pulse" />
            )}
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            {[
              { label: 'Emergency Contact', value: data.phone || '+91 98765 43210' },
              { label: 'Email', value: data.email || 'student@dps.edu' },
              { label: 'Blood Group', value: data.bloodGroup || 'O+' },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="text-[5.5px] font-bold uppercase tracking-wider block" style={{ color: '#1a3a8c' }}>{label}</span>
                <span className="text-[7.5px] font-semibold block truncate" style={{ color: '#0f2552', maxWidth: 120 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-3 py-1.5 flex items-center justify-between" style={{ borderTop: '1px solid #e0e7ff' }}>
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center justify-center" style={{ width: 60, height: 18, borderBottom: '1px solid #1a3a8c' }}>
              {data.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.signature} alt="Sig" className="max-h-full object-contain" style={{ filter: 'contrast(2)' }} />
              ) : (
                <span className="text-[5.5px] italic" style={{ color: '#93c5fd' }}>Signature</span>
              )}
            </div>
            <span className="text-[5.5px] uppercase tracking-wider font-bold" style={{ color: '#1a3a8c' }}>Principal</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-white px-1.5 py-0.5 flex items-end gap-[1px]" style={{ border: '1px solid #1a3a8c', height: 22 }}>
              {renderBarcode(data.idNumber, '#0f2552')}
            </div>
            <span className="text-[5.5px] font-mono mt-0.5" style={{ color: '#1a3a8c' }}>{data.idNumber || 'DPS-2026-0042'}</span>
          </div>
          <div className="rounded-full" style={{ width: 36, height: 36, border: '1.5px dashed #1a3a8c', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
            <span className="text-[4.5px] text-center font-black" style={{ color: '#0f2552' }}>SCHOOL<br />SEAL</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════
  // TEMPLATE 5: MAROON-LANDSCAPE — Heritage / Private School
  // ══════════════════════════════════════════════════════
  const MaroonLandscapeFront = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(0deg) translateZ(1px)',
        background: '#fff9f9',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Maroon top header - full width */}
      <div className="w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5c0a1e 0%, #7c1030 50%, #991b3a 100%)', paddingTop: 8, paddingBottom: 8 }}>
        {/* Gold geometric pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(212,175,55,0.8) 0, rgba(212,175,55,0.8) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(90deg, rgba(212,175,55,0.8) 0, rgba(212,175,55,0.8) 1px, transparent 1px, transparent 12px)',
        }} />
        <div className="flex items-center gap-2 px-3 relative z-10">
          <SchoolEmblem size={32} bg="rgba(212,175,55,0.2)" border="rgba(212,175,55,0.6)" />
          <div className="flex-1">
            <p className="text-white font-black text-[9px] tracking-wide uppercase" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
              {data.school || 'ST. XAVIER\'S HIGH SCHOOL'}
            </p>
            <p className="text-[6px] uppercase tracking-widest" style={{ color: '#f5d77c' }}>Estd. 1890 · ICSE Affiliated · Excellence in Education</p>
          </div>
          <SchoolEmblem size={32} bg="rgba(212,175,55,0.2)" border="rgba(212,175,55,0.6)" />
        </div>
      </div>

      {/* Gold accent line + tricolor */}
      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #d4af37, #f5d77c, #d4af37)' }} />
      <TricolorStripe height={3} />
      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #d4af37, #f5d77c, #d4af37)' }} />

      {/* Body - landscape layout */}
      <div className="flex-1 flex items-center px-3 gap-3 bg-[#fff9f9]">
        {/* Photo */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="overflow-hidden" style={{
            width: 54, height: 68,
            border: '2.5px solid #7c1030',
            background: '#fce8ed',
            outline: '1px solid #d4af37',
            outlineOffset: 2,
          }}>
            {data.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.avatar} alt="Photo" className="w-full h-full" style={getAvatarStyle(data)} crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-7 h-7" style={{ color: '#7c1030' }} />
              </div>
            )}
          </div>
          <span className="px-2 py-0.5 text-white text-[6px] font-black uppercase tracking-wider" style={{ background: '#7c1030' }}>
            {data.role || 'STUDENT'}
          </span>
        </div>

        {/* Gold divider */}
        <div className="h-[68px] w-px" style={{ background: 'linear-gradient(180deg, transparent, #d4af37, transparent)' }} />

        {/* Info */}
        <div className="flex-1 flex flex-col gap-[4px]">
          <div style={{ borderBottom: '1px solid #f5d77c', paddingBottom: 3 }}>
            <p className="text-[5.5px] font-bold uppercase tracking-wider" style={{ color: '#7c1030' }}>Student Name</p>
            <p className="text-[11px] font-black" style={{ color: '#2d0a10' }}>{data.name || 'STUDENT NAME'}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {[
              { label: 'Class & Section', value: data.grade || 'X-A' },
              { label: 'Roll Number', value: data.idNumber || 'XAV-2026-001' },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="text-[5.5px] font-bold uppercase block" style={{ color: '#7c1030' }}>{label}</span>
                <span className="text-[8px] font-bold block" style={{ color: '#2d0a10' }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[5.5px] uppercase font-bold" style={{ color: '#7c1030' }}>Blood:</span>
            <span className="text-[8px] font-black" style={{ color: '#2d0a10' }}>{data.bloodGroup || 'O+'}</span>
            <div className="flex-1 h-px" style={{ background: '#f5d77c' }} />
            <span className="text-[5.5px] uppercase font-bold" style={{ color: '#7c1030' }}>Session: 2025–26</span>
          </div>
        </div>
      </div>

      {/* Maroon footer */}
      <div className="w-full px-3 py-1.5 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #5c0a1e, #7c1030)' }}>
        <div>
          <span className="text-[5.5px] uppercase" style={{ color: '#f5d77c' }}>Valid From</span>
          <p className="text-white font-bold text-[7px]">{data.issueDate || '08/2025'}</p>
        </div>
        <div className="text-center">
          <span className="text-[6px] font-black" style={{ color: '#f5d77c', letterSpacing: 2 }}>✦ IDENTITY CARD ✦</span>
        </div>
        <div className="text-right">
          <span className="text-[5.5px] uppercase" style={{ color: '#f5d77c' }}>Valid Until</span>
          <p className="text-white font-bold text-[7px]">{data.expiryDate || '08/2026'}</p>
        </div>
      </div>
    </div>
  );

  const MaroonLandscapeBack = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg) translateZ(1px)',
        background: '#fff9f9',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div className="w-full px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #5c0a1e, #7c1030)' }}>
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: '#f5d77c' }} />
        <p className="font-black text-[8px] uppercase tracking-wide text-white">{data.school || 'St. Xavier\'s High School'}</p>
      </div>
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #d4af37, #f5d77c, #d4af37)' }} />
      <TricolorStripe />
      <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-[#fff9f9]">
        <div className="p-1 bg-white shrink-0" style={{ border: '1.5px solid #7c1030', outline: '1px solid #d4af37', outlineOffset: 2 }}>
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="QR" style={{ width: 52, height: 52 }} />
          ) : (
            <div style={{ width: 52, height: 52 }} className="animate-pulse bg-rose-50" />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          {[
            { label: 'Emergency Phone', value: data.phone || '+91 98765 43210' },
            { label: 'Email', value: data.email || 'student@xaviers.edu' },
            { label: 'Blood Group', value: data.bloodGroup || 'O+' },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="text-[5.5px] font-bold uppercase tracking-wider block" style={{ color: '#7c1030' }}>{label}</span>
              <span className="text-[7.5px] font-semibold block truncate" style={{ color: '#2d0a10', maxWidth: 120 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 pb-2 flex items-end justify-between" style={{ borderTop: '1px solid #fce8ed' }}>
        <div className="flex flex-col items-center gap-0.5 mt-1.5">
          <div className="flex items-center justify-center" style={{ width: 60, height: 18, borderBottom: '1.5px solid #d4af37' }}>
            {data.signature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.signature} alt="Sig" className="max-h-full object-contain" />
            ) : (
              <span className="text-[5.5px] italic" style={{ color: '#d4af37' }}>Signature</span>
            )}
          </div>
          <span className="text-[5.5px] uppercase font-bold" style={{ color: '#7c1030' }}>Principal</span>
        </div>
        <div className="flex flex-col items-center mt-1.5">
          <div className="bg-white px-1.5 py-0.5 flex items-end gap-[1px]" style={{ border: '1px solid #7c1030', height: 22 }}>
            {renderBarcode(data.idNumber, '#7c1030')}
          </div>
          <span className="text-[5.5px] font-mono mt-0.5" style={{ color: '#7c1030' }}>{data.idNumber || 'XAV-2026-0042'}</span>
        </div>
        <div className="rounded-full mt-1.5" style={{ width: 36, height: 36, border: '1.5px dashed #d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>
          <span className="text-[4.5px] font-black text-center" style={{ color: '#7c1030' }}>SCHOOL<br />SEAL</span>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════
  // TEMPLATE 6: TRICOLOR-LANDSCAPE — National / Patriotic
  // ══════════════════════════════════════════════════════
  const TricolorLandscapeFront = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(0deg) translateZ(1px)',
        background: '#ffffff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Tricolor header band - full saffron/white/green split */}
      <div className="w-full flex" style={{ height: 28 }}>
        <div className="flex-1 flex items-center justify-start px-3" style={{ background: '#FF9933' }}>
          <span className="text-white font-black text-[7px] tracking-widest uppercase" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            {(data.school || 'GOVT. SCHOOL').split(' ').slice(0, 2).join(' ')}
          </span>
        </div>
        <div className="flex items-center justify-center px-2" style={{ background: '#ffffff', minWidth: 48 }}>
          <div className="w-6 h-6 rounded-full border-2 border-[#000080] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full border border-[#000080]" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-end px-3" style={{ background: '#138808' }}>
          <span className="text-white font-black text-[7px] tracking-widest uppercase" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            {(data.school || 'HIGH SCHOOL').split(' ').slice(-2).join(' ')}
          </span>
        </div>
      </div>

      {/* Dark navy ID title bar */}
      <div className="w-full flex items-center justify-between px-4 py-[5px]" style={{ background: '#000080' }}>
        <span className="text-white font-black text-[7.5px] tracking-[0.2em] uppercase">Student Identity Card</span>
        <span className="text-blue-200 text-[6px] tracking-wider uppercase">भारत सरकार</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center gap-3 px-3 py-2">
        {/* Photo with tricolor border */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div style={{
            padding: 2,
            background: 'linear-gradient(180deg, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)',
            borderRadius: 3,
          }}>
            <div className="overflow-hidden" style={{ width: 56, height: 70, background: '#f0f0ff' }}>
              {data.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.avatar} alt="Photo" className="w-full h-full" style={getAvatarStyle(data)} crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-7 h-7" style={{ color: '#000080' }} />
                </div>
              )}
            </div>
          </div>
          <span className="px-2 py-0.5 text-white text-[6px] font-black uppercase" style={{ background: '#000080' }}>
            {data.role || 'STUDENT'}
          </span>
        </div>

        {/* Info grid */}
        <div className="flex-1 flex flex-col gap-1">
          <div style={{ borderLeft: '3px solid #FF9933', paddingLeft: 6, marginBottom: 2 }}>
            <p className="text-[5.5px] font-bold uppercase tracking-wider" style={{ color: '#000080' }}>Student Name / नाम</p>
            <p className="text-[11px] font-black" style={{ color: '#0a0a2e' }}>{data.name || 'STUDENT NAME'}</p>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[
              { label: 'Class / कक्षा', value: data.grade || 'VIII-B', accent: '#FF9933' },
              { label: 'Roll / क्रमांक', value: data.idNumber || 'GOV-2026-001', accent: '#138808' },
              { label: 'Blood Group', value: data.bloodGroup || 'A+', accent: '#000080' },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 4 }}>
                <span className="text-[5px] font-bold uppercase block" style={{ color: '#4b5563' }}>{label}</span>
                <span className="text-[8px] font-bold block" style={{ color: '#0a0a2e' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tricolor footer */}
      <div className="w-full" style={{ height: 4, background: 'linear-gradient(90deg, #FF9933 0%, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%, #138808 100%)' }} />
      <div className="w-full px-3 py-1 flex items-center justify-between" style={{ background: '#000080' }}>
        <span className="text-blue-200 text-[6px] font-bold">Valid: {data.issueDate || '08/2025'} – {data.expiryDate || '08/2026'}</span>
        <span className="text-blue-200 text-[6px] font-bold">Academic Year 2025–26</span>
      </div>
    </div>
  );

  const TricolorLandscapeBack = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg) translateZ(1px)',
        background: '#f8f8ff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div className="w-full flex items-center gap-2 px-3 py-2" style={{ background: '#000080' }}>
        <ShieldCheck className="w-3.5 h-3.5 text-blue-200 shrink-0" />
        <p className="text-white font-black text-[7.5px] uppercase tracking-wide">{data.school || 'Government School'}</p>
        <span className="ml-auto text-blue-200 text-[5.5px] tracking-wider">आपातकाल · Emergency</span>
      </div>
      <div className="w-full flex" style={{ height: 4 }}>
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>
      <div className="flex-1 flex items-center gap-3 px-3 py-2">
        <div className="p-1 bg-white shrink-0" style={{ border: '2px solid #000080' }}>
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="QR" style={{ width: 50, height: 50 }} />
          ) : (
            <div style={{ width: 50, height: 50 }} className="animate-pulse bg-blue-50" />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          {[
            { label: 'Emergency Contact', value: data.phone || '+91 98765 43210', accent: '#FF9933' },
            { label: 'Email Address', value: data.email || 'student@govt.edu', accent: '#138808' },
            { label: 'Blood Group', value: data.bloodGroup || 'A+', accent: '#000080' },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 5 }}>
              <span className="text-[5.5px] font-bold uppercase block" style={{ color: '#4b5563' }}>{label}</span>
              <span className="text-[7.5px] font-semibold block truncate" style={{ color: '#0a0a2e', maxWidth: 115 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 py-1.5 flex items-end justify-between" style={{ borderTop: '1px solid #e5e7ff' }}>
        <div className="flex flex-col items-center gap-0.5">
          <div style={{ width: 60, height: 18, borderBottom: '1.5px solid #000080', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {data.signature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.signature} alt="Sig" className="max-h-full object-contain" style={{ filter: 'contrast(2)' }} />
            ) : (
              <span className="text-[5.5px] italic" style={{ color: '#93c5fd' }}>Signature</span>
            )}
          </div>
          <span className="text-[5.5px] uppercase font-bold" style={{ color: '#000080' }}>Principal</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-white px-1 py-0.5 flex items-end gap-[1px]" style={{ border: '1px solid #000080', height: 22 }}>
            {renderBarcode(data.idNumber, '#000080')}
          </div>
          <span className="text-[5.5px] font-mono mt-0.5" style={{ color: '#000080' }}>{data.idNumber || 'GOV-2026-0042'}</span>
        </div>
        <div className="rounded-full" style={{ width: 36, height: 36, border: '1.5px dashed #000080', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
          <span className="text-[4.5px] font-black text-center" style={{ color: '#000080' }}>SCHOOL<br />SEAL</span>
        </div>
      </div>
    </div>
  );

  const customConfig = getCustomTemplate(data);
  const isCustom = !!customConfig;

  // ─── Decide card dimensions based on template orientation ────
  const isLandscape = isCustom && customConfig
    ? customConfig.orientation === 'landscape'
    : ['navy-landscape', 'maroon-landscape', 'tricolor-landscape'].includes(template);
  const cardWidth = isLandscape ? 512 : 320;
  const cardHeight = isLandscape ? 320 : 512;

  // ─── Pick Front/Back based on template ─────────────────────
  const renderFront = () => {
    if (isCustom && customConfig) {
      return (
        <CustomIDCardFace
          data={data}
          side="front"
          customConfig={customConfig}
          shareUrl={shareUrl}
          flat={false}
        />
      );
    }
    switch (template) {
      case 'saffron-portrait': return <SaffronPortraitFront />;
      case 'green-portrait': return <GreenPortraitFront />;
      case 'navy-landscape': return <NavyLandscapeFront />;
      case 'maroon-landscape': return <MaroonLandscapeFront />;
      case 'tricolor-landscape': return <TricolorLandscapeFront />;
      case 'cbse-portrait':
      default: return <CbsePortraitFront />;
    }
  };

  const renderBack = () => {
    if (isCustom && customConfig) {
      return (
        <CustomIDCardFace
          data={data}
          side="back"
          customConfig={customConfig}
          shareUrl={shareUrl}
          flat={false}
        />
      );
    }
    switch (template) {
      case 'saffron-portrait': return <SaffronPortraitBack />;
      case 'green-portrait': return <GreenPortraitBack />;
      case 'navy-landscape': return <NavyLandscapeBack />;
      case 'maroon-landscape': return <MaroonLandscapeBack />;
      case 'tricolor-landscape': return <TricolorLandscapeBack />;
      case 'cbse-portrait':
      default: return <CbsePortraitBack />;
    }
  };


  const getThemeColor = () => {
    if (isCustom && customConfig) return customConfig.themeColor || data.colorTheme || '#1e3a5f';
    switch (template) {
      case 'cbse-portrait': return '#1e4d8c';
      case 'saffron-portrait': return '#c45200';
      case 'green-portrait': return '#047857';
      case 'navy-landscape': return '#0f2552';
      case 'maroon-landscape': return '#7c1030';
      case 'tricolor-landscape': return '#000080';
      default: return data.colorTheme || '#1e3a5f';
    }
  };

  const schoolInitials = (data.school || 'School')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'ID';

  // ─── WRAPPER + 3D FLIP ─────────────────────────────────────
  return (
    <div className="w-full flex flex-col items-center select-none" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* Lanyard container spacer */}
      {showMockup && <div className="h-28 w-full pointer-events-none" />}

      {/* Size-only wrapper — never transformed */}
      <div
        ref={wrapperRef}
        className="relative cursor-pointer group"
        style={{
          width: cardWidth,
          height: cardHeight,
          perspective: '1000px',
        }}
        onClick={toggleFlip}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Hover tip */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 text-[8px] text-zinc-400 bg-black border border-zinc-800 px-2.5 py-1 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
          <RefreshCw className="w-2.5 h-2.5" />
          <span>Click to flip</span>
        </div>

        {/* 3D Acrylic Case Overlay (crystal glassmorphic frame) */}
        {showMockup && (
          <div 
            className="absolute pointer-events-none rounded-[10px] border-2 border-white/20 bg-white/5 backdrop-blur-[0.5px] shadow-2xl z-40"
            style={{
              inset: '-8px',
              boxShadow: 'inset 0 0 12px rgba(255,255,255,0.15), 0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Acrylic shiny diagonal light reflect */}
            <div 
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-80"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)'
              }}
            />
            {/* Specular highlight lines */}
            <div className="absolute top-1 left-1 right-1 h-px bg-white/30" />
            <div className="absolute bottom-1 left-1 right-1 h-px bg-white/10" />
          </div>
        )}

        {/* Strap slot connector at top */}
        {showMockup && (
          <div 
            className="absolute -top-[16px] left-1/2 -translate-x-1/2 w-10 h-4 bg-white/10 rounded-t border-t border-x border-white/20 z-45 flex items-center justify-center pointer-events-none"
            style={{ boxShadow: 'inset 0 0 4px rgba(255,255,255,0.1)' }}
          >
            <div className="w-5 h-1.5 bg-black/60 rounded-full border border-white/15" />
          </div>
        )}

        {/* Lanyard Clip and Strap hanging */}
        {showMockup && (
          <>
            {/* Lanyard Loop Strap (vector) */}
            <div 
              className="absolute -top-32 left-1/2 -translate-x-1/2 w-6 h-28 opacity-95 z-0 pointer-events-none flex flex-col items-center justify-end overflow-hidden"
              style={{
                background: `linear-gradient(to bottom, ${data.lanyardColor || getThemeColor()} 0%, ${data.lanyardColor || getThemeColor()} 85%, rgba(0,0,0,0.4) 100%)`,
                clipPath: 'polygon(15% 0%, 85% 0%, 50% 100%)',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))'
              }}
            >
              {/* Repeating initials text pattern synchronized with school color */}
              <div 
                className="text-[6.5px] font-black tracking-[0.2em] text-center uppercase py-1 flex flex-col justify-end gap-1 h-full font-mono select-none"
                style={{ color: data.lanyardTextColor || 'rgba(255,255,255,0.6)' }}
              >
                <span>{data.lanyardText || schoolInitials}</span>
                <span className="opacity-40">•</span>
                <span>{data.lanyardText || schoolInitials}</span>
              </div>
            </div>

            {/* Metal Swivel Clip */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-3.5 h-6 bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-650 rounded border border-white/15 shadow z-45 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-1 h-3.5 bg-zinc-800/60 rounded-sm border border-zinc-300/10" />
            </div>
          </>
        )}

        {/* Tilt layer */}
        <div
          className="w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: isHovering
              ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
              : 'rotateX(0deg) rotateY(0deg)',
            transition: isHovering ? 'none' : 'transform 0.5s ease-out',
          }}
        >
          {/* Flip layer */}
          <div
            className="w-full h-full relative"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {renderFront()}
            {renderBack()}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleFlip}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all border"
          style={{
            borderColor: '#1e4d8c',
            color: '#1e4d8c',
            background: 'transparent',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#1e4d8c';
            (e.currentTarget as HTMLButtonElement).style.color = '#fff';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#1e4d8c';
          }}
        >
          <RefreshCw className="w-3 h-3" />
          <span>Flip Card</span>
        </button>

        {/* Glassmorphic Mockup Toggle Button */}
        <button
          type="button"
          onClick={() => setShowMockup(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all border ${showMockup ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-transparent text-zinc-500 border-zinc-900 hover:border-zinc-800'}`}
        >
          <span>Mockup: {showMockup ? 'ON' : 'OFF'}</span>
        </button>

        <span className="text-[8px] tracking-wider" style={{ color: '#94a3b8' }}>
          CR80 · Hover to tilt
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NAMED EXPORT: IDCardFace
// Renders a single flat (no 3D/flip) card face for export/download.
// This bypasses all 3D perspective transforms so html2canvas works perfectly.
// ═══════════════════════════════════════════════════════════════
export function IDCardFace({
  data,
  side,
  shareUrl,
}: {
  data: StudentData;
  side: 'front' | 'back';
  shareUrl?: string;
}) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const template = data.template || 'cbse-portrait';

  const qrData = data.qrType === 'vcard'
    ? `BEGIN:VCARD\nVERSION:3.0\nN:${data.name || 'Student'};;;;\nFN:${data.name || 'Student'}\nORG:${data.school || 'School'}\nTITLE:${data.role || 'STUDENT'}\nTEL;TYPE=CELL:${data.phone || ''}\nEMAIL;TYPE=PREF,INTERNET:${data.email || ''}\nNOTE:Grade: ${data.grade || ''}\\nID: ${data.idNumber || ''}\\nBlood Group: ${data.bloodGroup || ''}\nEND:VCARD`
    : (shareUrl || `${data.name} | ${data.idNumber} | ${data.school}`);

  useEffect(() => {
    QRCode.toDataURL(qrData, {
      margin: 1, width: 160,
      color: { dark: '#1e3a5f', light: '#ffffff' },
    }).then(setQrUrl).catch(console.error);
  }, [qrData]);

  // Helper: Barcode
  const renderBarcode = (id: string, color = '#1e3a5f') => {
    const str = (id || 'STU-2026-0042').trim();
    const patterns = [
      "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
      "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
      "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
      "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
      "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
      "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
      "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
      "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
      "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
      "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
      "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
    ];

    const startCode = 104; // Start B
    const stopCode = 106;  // Stop
    const charCodes = [startCode];
    let sum = startCode;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      const val = code >= 32 && code <= 127 ? code - 32 : 0;
      charCodes.push(val);
      sum += val * (i + 1);
    }
    charCodes.push(sum % 103);
    charCodes.push(stopCode);

    let modules = "";
    charCodes.forEach((val) => {
      const pat = patterns[val];
      for (let i = 0; i < pat.length; i++) {
        const width = parseInt(pat[i], 10);
        const bit = (i % 2 === 0) ? "1" : "0";
        modules += bit.repeat(width);
      }
    });

    let path = "";
    let x = 0;
    let runLength = 0;
    for (let i = 0; i <= modules.length; i++) {
      if (i < modules.length && modules[i] === "1") {
        runLength++;
      } else {
        if (runLength > 0) {
          path += `M${x - runLength},0 h${runLength} v28 h-${runLength} z `;
          runLength = 0;
        }
      }
      x++;
    }

    return (
      <svg 
        viewBox={`0 0 ${modules.length} 28`} 
        width="100%" 
        height="100%" 
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="overflow-hidden"
      >
        <path d={path} fill={color} />
      </svg>
    );
  };

  // Helper: Tricolor stripe
  const TricolorStripe = ({ height = 3 }: { height?: number }) => (
    <div className="flex w-full" style={{ height }}>
      <div className="flex-1 bg-[#FF9933]" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-[#138808]" />
    </div>
  );

  // Helper: School emblem
  const SchoolEmblem = ({ size = 32, bg = 'rgba(255,255,255,0.15)', border = 'rgba(255,255,255,0.4)', textColor = 'white' }: { size?: number; bg?: string; border?: string; textColor?: string }) => {
    const initials = (data.school || 'School').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return (
      <div className="rounded-full flex items-center justify-center shrink-0 font-black" style={{ width: size, height: size, fontSize: size * 0.28, background: bg, border: `2px solid ${border}`, color: textColor }}>
        {initials}
      </div>
    );
  };

  const customConfig = getCustomTemplate(data);
  const isCustom = !!customConfig;

  const isLandscape = isCustom && customConfig
    ? customConfig.orientation === 'landscape'
    : ['navy-landscape', 'maroon-landscape', 'tricolor-landscape'].includes(template);
  const cardW = isLandscape ? 428 : 270;
  const cardH = isLandscape ? 270 : 428;

  // Flat container styles (no backface-visibility, no 3D)
  const flatStyle: React.CSSProperties = {
    width: cardW,
    height: cardH,
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Outfit', sans-serif",
    flexShrink: 0,
  };

  if (isCustom && customConfig) {
    return (
      <div style={flatStyle}>
        <CustomIDCardFace
          data={data}
          side={side}
          customConfig={customConfig}
          shareUrl={shareUrl}
          flat={true}
        />
      </div>
    );
  }

  // ── CBSE Portrait ──────────────────────────────────────────
  if (template === 'cbse-portrait') {
    if (side === 'front') return (
      <div style={{ ...flatStyle, background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
        <div className="w-full flex flex-col items-center justify-center gap-1 px-3 pt-3 pb-2 relative" style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #1e4d8c 60%, #1a3a6b 100%)' }}>
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ffffff 0, #ffffff 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />
          <div className="flex items-center gap-2 z-10 w-full justify-center">
            <SchoolEmblem size={30} /><div className="flex flex-col items-center leading-none"><span className="text-white font-black text-[9px] tracking-wider uppercase text-center leading-tight" style={{ maxWidth: 140, lineHeight: 1.2 }}>{data.school || 'INDIAN PUBLIC SCHOOL'}</span><span className="text-white/60 text-[6.5px] tracking-widest uppercase mt-0.5">Est. 1985 · Affiliated to CBSE</span></div><SchoolEmblem size={30} />
          </div>
        </div>
        <TricolorStripe />
        <div className="w-full text-center py-1" style={{ background: '#1e4d8c' }}><span className="text-white font-black text-[8px] tracking-[0.2em] uppercase">Identity Card</span></div>
        <div className="flex-1 flex px-3 py-2 gap-3 bg-white">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="overflow-hidden flex items-center justify-center bg-[#f0f4f8]" style={{ width: 68, height: 80, border: '2px solid #1e4d8c', borderRadius: 2 }}>
              {data.avatar ? <img src={data.avatar} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" /> : <User className="w-8 h-8" style={{ color: '#1e4d8c' }} />}
            </div>
            <div className="px-2 py-0.5 text-white font-black text-[6.5px] tracking-wider uppercase w-full text-center" style={{ background: '#1e4d8c', borderRadius: 1 }}>{data.role || 'STUDENT'}</div>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-[5px]">
            <div className="border-b pb-1" style={{ borderColor: '#e2e8f0' }}><p className="text-[6.5px] font-bold uppercase tracking-wider" style={{ color: '#1e4d8c' }}>Name</p><p className="text-[10px] font-black leading-tight" style={{ color: '#0f172a' }}>{data.name || 'STUDENT NAME'}</p></div>
            {[{ label: 'Class / Section', value: data.grade || 'X-A' }, { label: 'Roll No. / ID', value: data.idNumber || 'STU-2026-001' }, { label: 'Blood Group', value: data.bloodGroup || 'O+' }].map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-1"><span className="text-[6px] font-bold uppercase tracking-wider shrink-0 w-[60px]" style={{ color: '#64748b' }}>{label}</span><span className="text-[8px] font-bold" style={{ color: '#1e293b' }}>{value}</span></div>
            ))}
          </div>
        </div>
        <div className="w-full px-3 py-1.5 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #1a3a6b, #1e4d8c)' }}>
          <div className="flex flex-col"><span className="text-white/50 text-[5.5px] uppercase tracking-wider">Valid From</span><span className="text-white font-bold text-[7px]">{data.issueDate || '08/2025'}</span></div>
          <div className="h-6 w-px bg-white/20" />
          <div className="flex flex-col items-center"><span className="text-white/50 text-[5.5px] uppercase tracking-wider">Academic Year</span><span className="text-white font-bold text-[7px]">2025–2026</span></div>
          <div className="h-6 w-px bg-white/20" />
          <div className="flex flex-col items-end"><span className="text-white/50 text-[5.5px] uppercase tracking-wider">Valid Until</span><span className="text-white font-bold text-[7px]">{data.expiryDate || '08/2026'}</span></div>
        </div>
      </div>
    );
    return (
      <div style={{ ...flatStyle, background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        <div className="w-full px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1a3a6b, #1e4d8c)' }}><ShieldCheck className="w-4 h-4 text-white/80 shrink-0" /><div><p className="text-white font-black text-[8px] tracking-wide uppercase leading-none">{data.school || 'Indian Public School'}</p><p className="text-white/50 text-[6px] tracking-wider">Emergency Information</p></div></div>
        <TricolorStripe />
        <div className="flex-1 flex flex-col px-3 py-2 gap-2 bg-white">
          <div className="flex gap-2 items-start">
            <div className="shrink-0 flex items-center justify-center bg-white" style={{ width: 60, height: 60, border: '1.5px solid #1e4d8c', padding: 2 }}>{qrUrl ? <img src={qrUrl} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ width: '100%', height: '100%', background: '#e2e8f0' }} />}</div>
            <div className="flex-1 flex flex-col gap-1">{[{ label: 'Phone', value: data.phone || '+91 98765 43210' }, { label: 'Email', value: data.email || 'student@school.edu' }, { label: 'Blood Grp', value: data.bloodGroup || 'O+' }].map(({ label, value }) => (<div key={label}><span className="text-[6px] font-bold uppercase tracking-wider block" style={{ color: '#1e4d8c' }}>{label}</span><span className="text-[7.5px] font-semibold block truncate" style={{ color: '#0f172a', maxWidth: 110 }}>{value}</span></div>))}</div>
          </div>
          <div className="w-full h-px" style={{ background: '#e2e8f0' }} />
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col items-center gap-0.5"><div className="flex items-center justify-center" style={{ width: 72, height: 22, borderBottom: '1px solid #94a3b8', background: '#f8fafc' }}>{data.signature ? <img src={data.signature} alt="Sig" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'contrast(2)' }} /> : <span className="text-[6px] italic" style={{ color: '#94a3b8' }}>Signature</span>}</div><span className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Principal</span></div>
            <div className="rounded-full flex flex-col items-center justify-center border-2" style={{ width: 42, height: 42, borderColor: '#1e4d8c', borderStyle: 'dashed', opacity: 0.5 }}><span className="text-[5px] font-black text-center leading-tight uppercase" style={{ color: '#1e4d8c' }}>School<br />Seal</span></div>
            <div className="flex flex-col text-right"><span className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>If found, return to</span><span className="text-[6.5px] font-bold" style={{ color: '#1e3a6b', maxWidth: 70 }}>{data.school || 'School Office'}</span></div>
          </div>
        </div>
        <div className="w-full px-3 py-2 flex flex-col items-center gap-0.5" style={{ background: 'linear-gradient(90deg, #1a3a6b, #1e4d8c)' }}>
          <div className="flex items-end gap-[1px] bg-white px-2 py-1 w-full">{renderBarcode(data.idNumber)}</div>
          <span className="text-white/60 text-[6px] tracking-[0.18em] font-mono">{data.idNumber || 'STU-2026-0042'}</span>
        </div>
      </div>
    );
  }

  // ── Saffron Portrait ─────────────────────────────────────
  if (template === 'saffron-portrait') {
    if (side === 'front') return (
      <div style={{ ...flatStyle, background: '#fffbf5', display: 'flex', flexDirection: 'column' }}>
        <div className="w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #c45200 0%, #e86c00 40%, #FF9933 100%)', paddingBottom: 12, paddingTop: 10 }}>
          <div className="flex flex-col items-center gap-1 z-10 relative px-3"><div className="flex items-center gap-2"><SchoolEmblem size={32} bg="rgba(255,255,255,0.2)" border="rgba(255,255,255,0.5)" /><div className="flex flex-col items-center"><span className="text-white font-black text-[9.5px] tracking-wide uppercase text-center leading-tight">{data.school || 'KENDRIYA VIDYALAYA'}</span><span className="text-orange-100 text-[6px] tracking-widest uppercase mt-0.5">केन्द्रीय विद्यालय · CBSE Affiliated</span></div><SchoolEmblem size={32} bg="rgba(255,255,255,0.2)" border="rgba(255,255,255,0.5)" /></div></div>
        </div>
        <TricolorStripe height={4} />
        <div className="w-full flex items-center justify-center py-[5px]" style={{ background: '#c45200' }}><span className="text-white font-black text-[7.5px] tracking-[0.25em] uppercase">छात्र पहचान पत्र · Student ID Card</span></div>
        <div className="flex-1 flex flex-col px-3 pt-2 pb-1 bg-[#fffbf5]">
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-1 shrink-0"><div className="overflow-hidden flex items-center justify-center" style={{ width: 68, height: 82, border: '2.5px solid #e86c00', borderRadius: 3, background: '#fff3e6' }}>{data.avatar ? <img src={data.avatar} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" /> : <User className="w-8 h-8" style={{ color: '#e86c00' }} />}</div><div className="px-2 py-0.5 text-white font-black text-[6px] tracking-wider uppercase w-full text-center" style={{ background: '#e86c00', borderRadius: 2 }}>{data.role || 'STUDENT'}</div></div>
            <div className="flex-1 flex flex-col justify-center gap-[5px]"><div className="border-b-2 pb-1" style={{ borderColor: '#FF9933' }}><p className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#c45200' }}>Student Name / नाम</p><p className="text-[10px] font-black leading-tight" style={{ color: '#1a0a00' }}>{data.name || 'STUDENT NAME'}</p></div>{[{ label: 'Class / कक्षा', value: data.grade || 'X-A' }, { label: 'Admission No.', value: data.idNumber || 'KV-2026-001' }, { label: 'Blood Group', value: data.bloodGroup || 'O+' }].map(({ label, value }) => (<div key={label} className="flex items-baseline gap-1"><span className="text-[5.5px] font-bold uppercase tracking-wide shrink-0 w-[62px]" style={{ color: '#92400e' }}>{label}</span><span className="text-[8px] font-bold" style={{ color: '#1a0a00' }}>{value}</span></div>))}</div>
          </div>
        </div>
        <div className="w-full px-3 py-1.5 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #c45200, #e86c00)' }}>
          <div className="flex flex-col"><span className="text-orange-200 text-[5.5px] uppercase tracking-wider">Issued</span><span className="text-white font-bold text-[7px]">{data.issueDate || '08/2025'}</span></div>
          <div className="h-5 w-px bg-white/20" />
          <div className="flex flex-col items-center"><span className="text-orange-200 text-[5.5px] uppercase tracking-wider">Session</span><span className="text-white font-bold text-[7px]">2025–2026</span></div>
          <div className="h-5 w-px bg-white/20" />
          <div className="flex flex-col items-end"><span className="text-orange-200 text-[5.5px] uppercase tracking-wider">Expires</span><span className="text-white font-bold text-[7px]">{data.expiryDate || '08/2026'}</span></div>
        </div>
      </div>
    );
    return (
      <div style={{ ...flatStyle, background: '#fffbf5', display: 'flex', flexDirection: 'column' }}>
        <div className="w-full px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #c45200, #e86c00)' }}><ShieldCheck className="w-4 h-4 text-orange-100 shrink-0" /><div><p className="text-white font-black text-[8px] tracking-wide uppercase">{data.school || 'Kendriya Vidyalaya'}</p><p className="text-orange-200 text-[6px] tracking-wider">आपातकालीन जानकारी · Emergency Info</p></div></div>
        <TricolorStripe height={4} />
        <div className="flex-1 flex flex-col px-3 py-2 gap-2 bg-[#fffbf5]">
          <div className="flex gap-2 items-start"><div className="shrink-0 p-1 bg-white" style={{ border: '1.5px solid #e86c00' }}>{qrUrl ? <img src={qrUrl} alt="QR" style={{ width: 52, height: 52, objectFit: 'contain' }} /> : <div style={{ width: 52, height: 52, background: '#ffe8cc' }} />}</div><div className="flex-1 flex flex-col gap-1.5">{[{ label: 'Emergency', value: data.phone || '+91 98765 43210' }, { label: 'Email', value: data.email || 'student@kv.edu' }, { label: 'Blood Group', value: data.bloodGroup || 'O+' }].map(({ label, value }) => (<div key={label}><span className="text-[5.5px] font-bold uppercase tracking-wider block" style={{ color: '#92400e' }}>{label}</span><span className="text-[7.5px] font-semibold block truncate" style={{ color: '#1a0a00', maxWidth: 100 }}>{value}</span></div>))}</div></div>
          <div className="w-full h-px" style={{ background: '#fcd9b0' }} />
          <div className="flex items-end justify-between gap-2"><div className="flex flex-col items-center gap-0.5"><div className="flex items-center justify-center" style={{ width: 68, height: 20, borderBottom: '1.5px solid #e86c00', background: '#fff8f0' }}>{data.signature ? <img src={data.signature} alt="Sig" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} /> : <span className="text-[6px] italic" style={{ color: '#d97706' }}>Signature</span>}</div><span className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#92400e' }}>Principal</span></div><div className="rounded-full flex flex-col items-center justify-center" style={{ width: 40, height: 40, border: '2px dashed #e86c00', opacity: 0.6 }}><span className="text-[5px] font-black text-center" style={{ color: '#c45200' }}>SCHOOL<br />SEAL</span></div><div className="text-right"><p className="text-[5.5px] uppercase tracking-wider font-bold" style={{ color: '#92400e' }}>If Found Return To</p><p className="text-[6.5px] font-bold" style={{ color: '#c45200' }}>{data.school || 'School Office'}</p></div></div>
        </div>
        <div className="w-full px-2 py-1.5 flex flex-col items-center gap-0.5" style={{ background: 'linear-gradient(90deg, #c45200, #e86c00)' }}><div className="bg-white px-2 py-1 w-full flex items-end gap-[1px]">{renderBarcode(data.idNumber, '#c45200')}</div><span className="text-orange-200 text-[6px] tracking-[0.15em] font-mono">{data.idNumber || 'KV-2026-0042'}</span></div>
      </div>
    );
  }

  // ── Green Portrait ─────────────────────────────────────
  if (template === 'green-portrait') {
    if (side === 'front') return (
      <div style={{ ...flatStyle, background: '#f0faf4', display: 'flex', flexDirection: 'column' }}>
        <div className="w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)', paddingTop: 10, paddingBottom: 10 }}>
          <div className="flex flex-col items-center gap-1 z-10 relative px-3"><div className="flex items-center gap-2 w-full justify-center"><SchoolEmblem size={30} bg="rgba(255,255,255,0.15)" border="rgba(255,255,255,0.4)" /><div className="flex flex-col items-center"><span className="text-white font-black text-[9px] tracking-wide uppercase text-center leading-tight">{data.school || 'NAVODAYA VIDYALAYA'}</span><span className="text-green-200 text-[6px] tracking-widest uppercase mt-0.5">नवोदय विद्यालय · NVS Affiliated</span></div><SchoolEmblem size={30} bg="rgba(255,255,255,0.15)" border="rgba(255,255,255,0.4)" /></div></div>
        </div>
        <TricolorStripe height={3} />
        <div className="h-1" style={{ background: '#047857' }} />
        <div className="w-full flex items-center justify-center py-[5px]" style={{ background: '#065f46' }}><span className="text-white font-black text-[7.5px] tracking-[0.2em] uppercase">Student Identity Card</span></div>
        <div className="flex-1 flex px-3 py-2 gap-3 bg-[#f0faf4]">
          <div className="flex flex-col items-center gap-1 shrink-0"><div className="overflow-hidden flex items-center justify-center" style={{ width: 66, height: 80, border: '2.5px solid #047857', borderRadius: 4, background: '#d1fae5' }}>{data.avatar ? <img src={data.avatar} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" /> : <User className="w-8 h-8" style={{ color: '#047857' }} />}</div><div className="px-2 py-0.5 text-white font-black text-[6px] tracking-wider uppercase w-full text-center" style={{ background: '#047857', borderRadius: 2 }}>{data.role || 'STUDENT'}</div></div>
          <div className="flex-1 flex flex-col justify-center gap-[5px]"><div className="pb-1" style={{ borderBottom: '2px solid #6ee7b7' }}><p className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#047857' }}>Name / नाम</p><p className="text-[10px] font-black leading-tight" style={{ color: '#022c22' }}>{data.name || 'STUDENT NAME'}</p></div>{[{ label: 'Class & Sec.', value: data.grade || 'IX-B' }, { label: 'Admission No.', value: data.idNumber || 'NVS-2026-001' }, { label: 'Blood Group', value: data.bloodGroup || 'B+' }].map(({ label, value }) => (<div key={label} className="flex items-baseline gap-1"><span className="text-[5.5px] font-bold uppercase tracking-wide shrink-0 w-[58px]" style={{ color: '#065f46' }}>{label}</span><span className="text-[8px] font-bold" style={{ color: '#022c22' }}>{value}</span></div>))}</div>
        </div>
        <div className="w-full px-3 py-1.5 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #064e3b, #047857)' }}><div className="flex flex-col"><span className="text-green-300 text-[5.5px] uppercase tracking-wider">Valid From</span><span className="text-white font-bold text-[7px]">{data.issueDate || '08/2025'}</span></div><div className="h-5 w-px bg-white/20" /><div className="flex flex-col items-center"><span className="text-green-300 text-[5.5px] uppercase tracking-wider">Session</span><span className="text-white font-bold text-[7px]">2025–2026</span></div><div className="h-5 w-px bg-white/20" /><div className="flex flex-col items-end"><span className="text-green-300 text-[5.5px] uppercase tracking-wider">Expires</span><span className="text-white font-bold text-[7px]">{data.expiryDate || '08/2026'}</span></div></div>
      </div>
    );
    return (
      <div style={{ ...flatStyle, background: '#f0faf4', display: 'flex', flexDirection: 'column' }}>
        <div className="w-full px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #064e3b, #047857)' }}><ShieldCheck className="w-4 h-4 text-green-200 shrink-0" /><div><p className="text-white font-black text-[8px] tracking-wide uppercase">{data.school || 'Navodaya Vidyalaya'}</p><p className="text-green-200 text-[6px] tracking-wider">Emergency Information · आपातकाल</p></div></div>
        <TricolorStripe />
        <div className="flex-1 flex flex-col px-3 py-2 gap-2 bg-[#f0faf4]"><div className="flex gap-2 items-start"><div className="shrink-0 p-1 bg-white" style={{ border: '1.5px solid #047857' }}>{qrUrl ? <img src={qrUrl} alt="QR" style={{ width: 52, height: 52, objectFit: 'contain' }} /> : <div style={{ width: 52, height: 52, background: '#d1fae5' }} />}</div><div className="flex-1 flex flex-col gap-1.5">{[{ label: 'Parent/Guardian Phone', value: data.phone || '+91 98765 43210' }, { label: 'Email', value: data.email || 'student@nvs.edu' }, { label: 'Blood Group', value: data.bloodGroup || 'B+' }].map(({ label, value }) => (<div key={label}><span className="text-[5.5px] font-bold uppercase tracking-wider block" style={{ color: '#047857' }}>{label}</span><span className="text-[7px] font-semibold block truncate" style={{ color: '#022c22', maxWidth: 105 }}>{value}</span></div>))}</div></div>
        <div className="w-full h-px" style={{ background: '#6ee7b7' }} /><div className="flex items-end justify-between"><div className="flex flex-col items-center gap-0.5"><div className="flex items-center justify-center" style={{ width: 68, height: 20, borderBottom: '1.5px solid #047857', background: '#ecfdf5' }}>{data.signature ? <img src={data.signature} alt="Sig" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} /> : <span className="text-[6px] italic" style={{ color: '#6ee7b7' }}>Signature</span>}</div><span className="text-[6px] font-bold uppercase" style={{ color: '#047857' }}>Principal</span></div><div className="rounded-full flex flex-col items-center justify-center" style={{ width: 40, height: 40, border: '2px dashed #047857', opacity: 0.6 }}><span className="text-[5px] font-black text-center" style={{ color: '#065f46' }}>SCHOOL<br />SEAL</span></div><div className="text-right"><p className="text-[5.5px] uppercase tracking-wider font-bold" style={{ color: '#065f46' }}>Return To</p><p className="text-[6.5px] font-bold" style={{ color: '#047857' }}>{data.school || 'School Office'}</p></div></div></div>
        <div className="w-full px-2 py-1.5 flex flex-col items-center gap-0.5" style={{ background: 'linear-gradient(90deg, #064e3b, #047857)' }}><div className="bg-white px-2 py-1 w-full flex items-end gap-[1px]">{renderBarcode(data.idNumber, '#047857')}</div><span className="text-green-300 text-[6px] tracking-[0.15em] font-mono">{data.idNumber || 'NVS-2026-0042'}</span></div>
      </div>
    );
  }

  // ── Navy Landscape ──────────────────────────────────────
  if (template === 'navy-landscape') {
    if (side === 'front') return (
      <div style={{ ...flatStyle, background: '#ffffff', display: 'flex', flexDirection: 'row' }}>
        <div className="flex flex-col items-center justify-between py-3 px-2 shrink-0" style={{ width: 52, background: 'linear-gradient(180deg, #0f2552 0%, #1a3a8c 50%, #0f2552 100%)' }}>
          <SchoolEmblem size={36} bg="rgba(255,255,255,0.15)" border="rgba(255,255,255,0.35)" />
          <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'rgba(255,255,255,0.5)', fontSize: 6, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 'bold' }}>STUDENT CREDENTIAL</div>
          <div className="flex flex-col items-center gap-0.5"><span className="text-white/40 text-[5.5px] uppercase">Blood</span><span className="text-white font-black text-[9px]">{data.bloodGroup || 'O+'}</span></div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="px-3 pt-2 pb-1.5" style={{ background: '#f0f4ff', borderBottom: '2px solid #1a3a8c' }}><p className="text-[9px] font-black tracking-wide uppercase" style={{ color: '#0f2552' }}>{data.school || 'DELHI PUBLIC SCHOOL'}</p><p className="text-[6px] tracking-widest font-bold" style={{ color: '#3b5bdb' }}>Affiliated to CBSE · Est. 1949</p></div>
          <TricolorStripe height={3} />
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5">
            <div className="shrink-0" style={{ width: 52, height: 64, border: '2px solid #1a3a8c', overflow: 'hidden', background: '#e8eeff' }}>{data.avatar ? <img src={data.avatar} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User style={{ color: '#1a3a8c', width: 28, height: 28 }} /></div>}</div>
            <div className="flex-1 flex flex-col gap-[3px]">
              <div><p className="text-[5.5px] font-bold uppercase tracking-wider" style={{ color: '#3b5bdb' }}>Student Name</p><p className="text-[11px] font-black leading-tight" style={{ color: '#0f2552' }}>{data.name || 'STUDENT NAME'}</p></div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-0.5">{[{ label: 'Class/Section', value: data.grade || 'XII-A' }, { label: 'Roll Number', value: data.idNumber || 'DPS-2026-001' }].map(({ label, value }) => (<div key={label}><span className="text-[5.5px] font-bold uppercase block" style={{ color: '#6b7280' }}>{label}</span><span className="text-[8px] font-bold block" style={{ color: '#0f2552' }}>{value}</span></div>))}</div>
              <div className="mt-1 inline-flex"><span className="px-2 py-0.5 text-white font-black text-[6px] tracking-wider uppercase" style={{ background: '#1a3a8c' }}>{data.role || 'STUDENT'}</span></div>
            </div>
          </div>
          <div className="px-3 py-1.5 flex items-center justify-between" style={{ background: '#0f2552' }}><div><p className="text-blue-300 text-[5px] uppercase tracking-wider">Valid</p><p className="text-white font-bold text-[7px]">{data.issueDate || '08/2025'} – {data.expiryDate || '08/2026'}</p></div><div className="text-right"><p className="text-blue-300 text-[5px] uppercase tracking-wider">Academic Year</p><p className="text-white font-bold text-[7px]">2025 – 2026</p></div></div>
        </div>
      </div>
    );
    return (
      <div style={{ ...flatStyle, background: '#f8faff', display: 'flex', flexDirection: 'row' }}>
        <div className="flex flex-col items-center justify-center py-3 px-1.5 shrink-0 gap-2" style={{ width: 44, background: 'linear-gradient(180deg, #0f2552, #1a3a8c)' }}><div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'rgba(255,255,255,0.4)', fontSize: 5.5, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 'bold' }}>EMERGENCY INFO</div></div>
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-2 flex items-center gap-2" style={{ background: '#0f2552' }}><ShieldCheck style={{ color: '#93c5fd', width: 14, height: 14, flexShrink: 0 }} /><p className="text-white font-black text-[7.5px] uppercase tracking-wide">{data.school || 'Delhi Public School'}</p></div>
          <TricolorStripe />
          <div className="flex-1 flex items-center gap-3 px-3 py-2">
            <div className="p-1 bg-white shrink-0" style={{ border: '1.5px solid #1a3a8c' }}>{qrUrl ? <img src={qrUrl} alt="QR" style={{ width: 52, height: 52 }} /> : <div style={{ width: 52, height: 52, background: '#eff6ff' }} />}</div>
            <div className="flex-1 flex flex-col gap-1.5">{[{ label: 'Emergency Contact', value: data.phone || '+91 98765 43210' }, { label: 'Email', value: data.email || 'student@dps.edu' }, { label: 'Blood Group', value: data.bloodGroup || 'O+' }].map(({ label, value }) => (<div key={label}><span className="text-[5.5px] font-bold uppercase tracking-wider block" style={{ color: '#1a3a8c' }}>{label}</span><span className="text-[7.5px] font-semibold block truncate" style={{ color: '#0f2552', maxWidth: 120 }}>{value}</span></div>))}</div>
          </div>
          <div className="px-3 py-1.5 flex items-center justify-between" style={{ borderTop: '1px solid #e0e7ff' }}>
            <div className="flex flex-col items-center gap-0.5"><div className="flex items-center justify-center" style={{ width: 60, height: 18, borderBottom: '1px solid #1a3a8c' }}>{data.signature ? <img src={data.signature} alt="Sig" style={{ maxHeight: '100%', objectFit: 'contain', filter: 'contrast(2)' }} /> : <span className="text-[5.5px] italic" style={{ color: '#93c5fd' }}>Signature</span>}</div><span className="text-[5.5px] uppercase tracking-wider font-bold" style={{ color: '#1a3a8c' }}>Principal</span></div>
            <div className="flex flex-col items-center"><div className="bg-white px-1.5 py-0.5 flex items-end gap-[1px]" style={{ border: '1px solid #1a3a8c', height: 22 }}>{renderBarcode(data.idNumber, '#0f2552')}</div><span className="text-[5.5px] font-mono mt-0.5" style={{ color: '#1a3a8c' }}>{data.idNumber || 'DPS-2026-0042'}</span></div>
            <div className="rounded-full" style={{ width: 36, height: 36, border: '1.5px dashed #1a3a8c', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}><span className="text-[4.5px] text-center font-black" style={{ color: '#0f2552' }}>SCHOOL<br />SEAL</span></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Maroon Landscape ────────────────────────────────────
  if (template === 'maroon-landscape') {
    if (side === 'front') return (
      <div style={{ ...flatStyle, background: '#fff9f9', display: 'flex', flexDirection: 'column' }}>
        <div className="w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5c0a1e 0%, #7c1030 50%, #991b3a 100%)', paddingTop: 8, paddingBottom: 8 }}>
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(212,175,55,0.8) 0, rgba(212,175,55,0.8) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(90deg, rgba(212,175,55,0.8) 0, rgba(212,175,55,0.8) 1px, transparent 1px, transparent 12px)' }} />
          <div className="flex items-center gap-2 px-3 relative z-10"><SchoolEmblem size={32} bg="rgba(212,175,55,0.2)" border="rgba(212,175,55,0.6)" /><div className="flex-1"><p className="text-white font-black text-[9px] tracking-wide uppercase">{data.school || "ST. XAVIER'S HIGH SCHOOL"}</p><p className="text-[6px] uppercase tracking-widest" style={{ color: '#f5d77c' }}>Estd. 1890 · ICSE Affiliated · Excellence in Education</p></div><SchoolEmblem size={32} bg="rgba(212,175,55,0.2)" border="rgba(212,175,55,0.6)" /></div>
        </div>
        <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #d4af37, #f5d77c, #d4af37)' }} />
        <TricolorStripe height={3} />
        <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #d4af37, #f5d77c, #d4af37)' }} />
        <div className="flex-1 flex items-center px-3 gap-3 bg-[#fff9f9]">
          <div className="shrink-0 flex flex-col items-center gap-1"><div className="overflow-hidden" style={{ width: 54, height: 68, border: '2.5px solid #7c1030', background: '#fce8ed', outline: '1px solid #d4af37', outlineOffset: 2 }}>{data.avatar ? <img src={data.avatar} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User style={{ color: '#7c1030', width: 28, height: 28 }} /></div>}</div><span className="px-2 py-0.5 text-white text-[6px] font-black uppercase tracking-wider" style={{ background: '#7c1030' }}>{data.role || 'STUDENT'}</span></div>
          <div className="h-[68px] w-px" style={{ background: 'linear-gradient(180deg, transparent, #d4af37, transparent)' }} />
          <div className="flex-1 flex flex-col gap-[4px]">
            <div style={{ borderBottom: '1px solid #f5d77c', paddingBottom: 3 }}><p className="text-[5.5px] font-bold uppercase tracking-wider" style={{ color: '#7c1030' }}>Student Name</p><p className="text-[11px] font-black" style={{ color: '#2d0a10' }}>{data.name || 'STUDENT NAME'}</p></div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">{[{ label: 'Class & Section', value: data.grade || 'X-A' }, { label: 'Roll Number', value: data.idNumber || 'XAV-2026-001' }].map(({ label, value }) => (<div key={label}><span className="text-[5.5px] font-bold uppercase block" style={{ color: '#7c1030' }}>{label}</span><span className="text-[8px] font-bold block" style={{ color: '#2d0a10' }}>{value}</span></div>))}</div>
            <div className="flex items-center gap-2 mt-0.5"><span className="text-[5.5px] uppercase font-bold" style={{ color: '#7c1030' }}>Blood:</span><span className="text-[8px] font-black" style={{ color: '#2d0a10' }}>{data.bloodGroup || 'O+'}</span><div className="flex-1 h-px" style={{ background: '#f5d77c' }} /><span className="text-[5.5px] uppercase font-bold" style={{ color: '#7c1030' }}>Session: 2025–26</span></div>
          </div>
        </div>
        <div className="w-full px-3 py-1.5 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #5c0a1e, #7c1030)' }}><div><span className="text-[5.5px] uppercase" style={{ color: '#f5d77c' }}>Valid From</span><p className="text-white font-bold text-[7px]">{data.issueDate || '08/2025'}</p></div><div className="text-center"><span className="text-[6px] font-black" style={{ color: '#f5d77c', letterSpacing: 2 }}>✦ IDENTITY CARD ✦</span></div><div className="text-right"><span className="text-[5.5px] uppercase" style={{ color: '#f5d77c' }}>Valid Until</span><p className="text-white font-bold text-[7px]">{data.expiryDate || '08/2026'}</p></div></div>
      </div>
    );
    return (
      <div style={{ ...flatStyle, background: '#fff9f9', display: 'flex', flexDirection: 'column' }}>
        <div className="w-full px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #5c0a1e, #7c1030)' }}><ShieldCheck style={{ width: 14, height: 14, flexShrink: 0, color: '#f5d77c' }} /><p className="font-black text-[8px] uppercase tracking-wide text-white">{data.school || "St. Xavier's High School"}</p></div>
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #d4af37, #f5d77c, #d4af37)' }} />
        <TricolorStripe />
        <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-[#fff9f9]"><div className="p-1 bg-white shrink-0" style={{ border: '1.5px solid #7c1030', outline: '1px solid #d4af37', outlineOffset: 2 }}>{qrUrl ? <img src={qrUrl} alt="QR" style={{ width: 52, height: 52 }} /> : <div style={{ width: 52, height: 52, background: '#fce8ed' }} />}</div><div className="flex-1 flex flex-col gap-1.5">{[{ label: 'Emergency Phone', value: data.phone || '+91 98765 43210' }, { label: 'Email', value: data.email || 'student@xaviers.edu' }, { label: 'Blood Group', value: data.bloodGroup || 'O+' }].map(({ label, value }) => (<div key={label}><span className="text-[5.5px] font-bold uppercase tracking-wider block" style={{ color: '#7c1030' }}>{label}</span><span className="text-[7.5px] font-semibold block truncate" style={{ color: '#2d0a10', maxWidth: 120 }}>{value}</span></div>))}</div></div>
        <div className="px-3 pb-2 flex items-end justify-between" style={{ borderTop: '1px solid #fce8ed' }}>
          <div className="flex flex-col items-center gap-0.5 mt-1.5"><div className="flex items-center justify-center" style={{ width: 60, height: 18, borderBottom: '1.5px solid #d4af37' }}>{data.signature ? <img src={data.signature} alt="Sig" style={{ maxHeight: '100%', objectFit: 'contain' }} /> : <span className="text-[5.5px] italic" style={{ color: '#d4af37' }}>Signature</span>}</div><span className="text-[5.5px] uppercase font-bold" style={{ color: '#7c1030' }}>Principal</span></div>
          <div className="flex flex-col items-center mt-1.5"><div className="bg-white px-1.5 py-0.5 flex items-end gap-[1px]" style={{ border: '1px solid #7c1030', height: 22 }}>{renderBarcode(data.idNumber, '#7c1030')}</div><span className="text-[5.5px] font-mono mt-0.5" style={{ color: '#7c1030' }}>{data.idNumber || 'XAV-2026-0042'}</span></div>
          <div className="rounded-full mt-1.5" style={{ width: 36, height: 36, border: '1.5px dashed #d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}><span className="text-[4.5px] font-black text-center" style={{ color: '#7c1030' }}>SCHOOL<br />SEAL</span></div>
        </div>
      </div>
    );
  }

  // ── Tricolor Landscape (default for any unrecognised) ───
  // front
  if (side === 'front') return (
    <div style={{ ...flatStyle, background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      <div className="w-full flex" style={{ height: 28 }}>
        <div className="flex-1 flex items-center justify-start px-3" style={{ background: '#FF9933' }}><span className="text-white font-black text-[7px] tracking-widest uppercase">{(data.school || 'GOVT. SCHOOL').split(' ').slice(0, 2).join(' ')}</span></div>
        <div className="flex items-center justify-center px-2" style={{ background: '#ffffff', minWidth: 48 }}><div className="w-6 h-6 rounded-full border-2 border-[#000080] flex items-center justify-center"><div className="w-3 h-3 rounded-full border border-[#000080]" /></div></div>
        <div className="flex-1 flex items-center justify-end px-3" style={{ background: '#138808' }}><span className="text-white font-black text-[7px] tracking-widest uppercase">{(data.school || 'HIGH SCHOOL').split(' ').slice(-2).join(' ')}</span></div>
      </div>
      <div className="w-full flex items-center justify-between px-4 py-[5px]" style={{ background: '#000080' }}><span className="text-white font-black text-[7.5px] tracking-[0.2em] uppercase">Student Identity Card</span><span className="text-blue-200 text-[6px] tracking-wider uppercase">भारत सरकार</span></div>
      <div className="flex-1 flex items-center gap-3 px-3 py-2">
        <div className="shrink-0 flex flex-col items-center gap-1"><div style={{ padding: 2, background: 'linear-gradient(180deg, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)', borderRadius: 3 }}><div style={{ width: 56, height: 70, background: '#f0f0ff', overflow: 'hidden' }}>{data.avatar ? <img src={data.avatar} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User style={{ color: '#000080', width: 28, height: 28 }} /></div>}</div></div><span className="px-2 py-0.5 text-white text-[6px] font-black uppercase" style={{ background: '#000080' }}>{data.role || 'STUDENT'}</span></div>
        <div className="flex-1 flex flex-col gap-1"><div style={{ borderLeft: '3px solid #FF9933', paddingLeft: 6, marginBottom: 2 }}><p className="text-[5.5px] font-bold uppercase tracking-wider" style={{ color: '#000080' }}>Student Name / नाम</p><p className="text-[11px] font-black" style={{ color: '#0a0a2e' }}>{data.name || 'STUDENT NAME'}</p></div><div className="grid grid-cols-2 gap-1">{[{ label: 'Class / कक्षा', value: data.grade || 'VIII-B', accent: '#FF9933' }, { label: 'Roll / क्रमांक', value: data.idNumber || 'GOV-2026-001', accent: '#138808' }, { label: 'Blood Group', value: data.bloodGroup || 'A+', accent: '#000080' }].map(({ label, value, accent }) => (<div key={label} style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 4 }}><span className="text-[5px] font-bold uppercase block" style={{ color: '#4b5563' }}>{label}</span><span className="text-[8px] font-bold block" style={{ color: '#0a0a2e' }}>{value}</span></div>))}</div></div>
      </div>
      <div className="w-full" style={{ height: 4, background: 'linear-gradient(90deg, #FF9933 0%, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%, #138808 100%)' }} />
      <div className="w-full px-3 py-1 flex items-center justify-between" style={{ background: '#000080' }}><span className="text-blue-200 text-[6px] font-bold">Valid: {data.issueDate || '08/2025'} – {data.expiryDate || '08/2026'}</span><span className="text-blue-200 text-[6px] font-bold">Academic Year 2025–26</span></div>
    </div>
  );
  // back (tricolor landscape)
  return (
    <div style={{ ...flatStyle, background: '#f8f8ff', display: 'flex', flexDirection: 'column' }}>
      <div className="w-full flex items-center gap-2 px-3 py-2" style={{ background: '#000080' }}><ShieldCheck style={{ width: 14, height: 14, color: '#93c5fd', flexShrink: 0 }} /><p className="text-white font-black text-[7.5px] uppercase tracking-wide">{data.school || 'Government School'}</p><span className="ml-auto text-blue-200 text-[5.5px] tracking-wider">आपातकाल · Emergency</span></div>
      <div className="w-full flex" style={{ height: 4 }}><div className="flex-1 bg-[#FF9933]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#138808]" /></div>
      <div className="flex-1 flex items-center gap-3 px-3 py-2"><div className="p-1 bg-white shrink-0" style={{ border: '2px solid #000080' }}>{qrUrl ? <img src={qrUrl} alt="QR" style={{ width: 50, height: 50 }} /> : <div style={{ width: 50, height: 50, background: '#eff6ff' }} />}</div><div className="flex-1 flex flex-col gap-1.5">{[{ label: 'Emergency Contact', value: data.phone || '+91 98765 43210', accent: '#FF9933' }, { label: 'Email Address', value: data.email || 'student@govt.edu', accent: '#138808' }, { label: 'Blood Group', value: data.bloodGroup || 'A+', accent: '#000080' }].map(({ label, value, accent }) => (<div key={label} style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 5 }}><span className="text-[5.5px] font-bold uppercase block" style={{ color: '#4b5563' }}>{label}</span><span className="text-[7.5px] font-semibold block truncate" style={{ color: '#0a0a2e', maxWidth: 115 }}>{value}</span></div>))}</div></div>
      <div className="px-3 py-1.5 flex items-end justify-between" style={{ borderTop: '1px solid #e5e7ff' }}>
        <div className="flex flex-col items-center gap-0.5"><div style={{ width: 60, height: 18, borderBottom: '1.5px solid #000080', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{data.signature ? <img src={data.signature} alt="Sig" style={{ maxHeight: '100%', objectFit: 'contain', filter: 'contrast(2)' }} /> : <span className="text-[5.5px] italic" style={{ color: '#93c5fd' }}>Signature</span>}</div><span className="text-[5.5px] uppercase font-bold" style={{ color: '#000080' }}>Principal</span></div>
        <div className="flex flex-col items-center"><div className="bg-white px-1 py-0.5 flex items-end gap-[1px]" style={{ border: '1px solid #000080', height: 22 }}>{renderBarcode(data.idNumber, '#000080')}</div><span className="text-[5.5px] font-mono mt-0.5" style={{ color: '#000080' }}>{data.idNumber || 'GOV-2026-0042'}</span></div>
        <div className="rounded-full" style={{ width: 36, height: 36, border: '1.5px dashed #000080', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}><span className="text-[4.5px] font-black text-center" style={{ color: '#000080' }}>SCHOOL<br />SEAL</span></div>
      </div>
    </div>
  );
}
