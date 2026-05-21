'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudentData } from '../utils/compressor';
import { User, RefreshCw, ShieldCheck } from 'lucide-react';
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
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFlippedOverride !== undefined) setIsFlipped(isFlippedOverride);
  }, [isFlippedOverride]);

  const qrData = shareUrl || `${data.name} | ${data.idNumber} | ${data.school}`;
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
  const renderBarcode = (id: string) => {
    const str = id || 'STU-2026-0042';
    const codes = str.split('').map(c => c.charCodeAt(0));
    return (
      <div className="flex items-end h-7 gap-[1px] overflow-hidden">
        {codes.flatMap((code, i) => [
          <div key={`b${i}`} style={{ width: code % 3 === 0 ? 1 : code % 3 === 1 ? 2 : 1.5, height: i % 3 === 0 ? '100%' : '70%' }} className="bg-[#1e3a5f] shrink-0" />,
          <div key={`s${i}`} style={{ width: 1 }} className="shrink-0" />,
        ])}
        {Array.from({ length: Math.max(0, 20 - codes.length) }).flatMap((_, i) => [
          <div key={`pb${i}`} style={{ width: i % 2 === 0 ? 1 : 2, height: i % 2 === 0 ? '100%' : '60%' }} className="bg-[#1e3a5f] shrink-0" />,
          <div key={`ps${i}`} style={{ width: 1 }} className="shrink-0" />,
        ])}
      </div>
    );
  };

  // India tricolor stripe
  const TricolorStripe = () => (
    <div className="flex w-full" style={{ height: 3 }}>
      <div className="flex-1 bg-[#FF9933]" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-[#138808]" />
    </div>
  );

  // School emblem placeholder (circular with initials)
  const SchoolEmblem = ({ size = 32 }: { size?: number }) => {
    const initials = (data.school || 'School')
      .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return (
      <div
        className="rounded-full border-2 border-white/40 flex items-center justify-center bg-white/10 shrink-0 font-black text-white"
        style={{ width: size, height: size, fontSize: size * 0.28 }}
      >
        {initials}
      </div>
    );
  };

  // ─── FRONT FACE ──────────────────────────────────────────
  const CardFront = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        background: '#ffffff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* ── HEADER: Navy blue band ── */}
      <div
        className="w-full flex flex-col items-center justify-center gap-1 px-3 pt-3 pb-2 relative"
        style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #1e4d8c 60%, #1a3a6b 100%)' }}
      >
        {/* Subtle diagonal pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #ffffff 0, #ffffff 1px, transparent 0, transparent 50%)',
            backgroundSize: '8px 8px',
          }}
        />

        {/* School logo row */}
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

      {/* ── TRICOLOR STRIPE ── */}
      <TricolorStripe />

      {/* ── IDENTITY CARD LABEL ── */}
      <div className="w-full text-center py-1" style={{ background: '#1e4d8c' }}>
        <span className="text-white font-black text-[8px] tracking-[0.2em] uppercase">
          Identity Card
        </span>
      </div>

      {/* ── BODY ── */}
      <div className="flex-1 flex px-3 py-2 gap-3 bg-white">
        {/* Left: Photo */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="overflow-hidden flex items-center justify-center bg-[#f0f4f8]"
            style={{
              width: 68, height: 80,
              border: '2px solid #1e4d8c',
              borderRadius: 2,
            }}
          >
            {data.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.avatar} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8" style={{ color: '#1e4d8c' }} />
            )}
          </div>
          {/* Role badge under photo */}
          <div
            className="px-2 py-0.5 text-white font-black text-[6.5px] tracking-wider uppercase w-full text-center"
            style={{ background: '#1e4d8c', borderRadius: 1 }}
          >
            {data.role || 'STUDENT'}
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex-1 flex flex-col justify-center gap-[5px]">
          {/* Name — prominent */}
          <div className="border-b pb-1" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-[6.5px] font-bold uppercase tracking-wider" style={{ color: '#1e4d8c' }}>Name</p>
            <p className="text-[10px] font-black leading-tight" style={{ color: '#0f172a' }}>
              {data.name || 'STUDENT NAME'}
            </p>
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

      {/* ── BOTTOM STRIPE: Validity + Contact ── */}
      <div
        className="w-full px-3 py-1.5 flex items-center justify-between"
        style={{ background: 'linear-gradient(90deg, #1a3a6b, #1e4d8c)' }}
      >
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

      {/* ── LANYARD SLOT indicator ── */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-white/20 border border-white/30" />
    </div>
  );

  // ─── BACK FACE ────────────────────────────────────────────
  const CardBack = () => (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        background: '#f8fafc',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* ── TOP NAVY BAND ── */}
      <div
        className="w-full px-3 py-2 flex items-center gap-2"
        style={{ background: 'linear-gradient(135deg, #1a3a6b, #1e4d8c)' }}
      >
        <ShieldCheck className="w-4 h-4 text-white/80 shrink-0" />
        <div>
          <p className="text-white font-black text-[8px] tracking-wide uppercase leading-none">
            {data.school || 'Indian Public School'}
          </p>
          <p className="text-white/50 text-[6px] tracking-wider">Emergency Information</p>
        </div>
      </div>

      <TricolorStripe />

      {/* ── BODY ── */}
      <div className="flex-1 flex flex-col px-3 py-2 gap-2 bg-white">

        {/* QR + Contact */}
        <div className="flex gap-2 items-start">
          {/* QR Code */}
          <div
            className="shrink-0 flex items-center justify-center bg-white"
            style={{ width: 60, height: 60, border: '1.5px solid #1e4d8c', padding: 2 }}
          >
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="QR" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full animate-pulse" style={{ background: '#e2e8f0' }} />
            )}
          </div>

          {/* Emergency info */}
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

        {/* Divider */}
        <div className="w-full h-px" style={{ background: '#e2e8f0' }} />

        {/* Signature + Seal */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="flex items-center justify-center"
              style={{ width: 72, height: 22, borderBottom: '1px solid #94a3b8', background: '#f8fafc' }}
            >
              {data.signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.signature} alt="Signature" className="max-h-full max-w-full object-contain" style={{ filter: 'contrast(2)' }} />
              ) : (
                <span className="text-[6px] italic" style={{ color: '#94a3b8' }}>Signature</span>
              )}
            </div>
            <span className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Principal</span>
          </div>

          {/* School Seal */}
          <div
            className="rounded-full flex flex-col items-center justify-center border-2"
            style={{ width: 42, height: 42, borderColor: '#1e4d8c', borderStyle: 'dashed', opacity: 0.5 }}
          >
            <span className="text-[5px] font-black text-center leading-tight uppercase" style={{ color: '#1e4d8c' }}>
              School<br/>Seal
            </span>
          </div>

          {/* Note */}
          <div className="flex flex-col text-right">
            <span className="text-[6px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>If found, return to</span>
            <span className="text-[6.5px] font-bold" style={{ color: '#1e3a6b', maxWidth: 70 }}>
              {data.school || 'School Office'}
            </span>
          </div>
        </div>
      </div>

      {/* ── BARCODE FOOTER ── */}
      <div
        className="w-full px-3 py-2 flex flex-col items-center gap-0.5"
        style={{ background: 'linear-gradient(90deg, #1a3a6b, #1e4d8c)' }}
      >
        <div className="flex items-end gap-[1px] bg-white px-2 py-1 w-full">
          {renderBarcode(data.idNumber)}
        </div>
        <span className="text-white/60 text-[6px] tracking-[0.18em] font-mono">
          {data.idNumber || 'STU-2026-0042'}
        </span>
      </div>
    </div>
  );

  // ─── WRAPPER + 3D FLIP ─────────────────────────────────────
  return (
    <div className="w-full flex flex-col items-center select-none" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* Size-only wrapper — never transformed */}
      <div
        ref={wrapperRef}
        className="relative cursor-pointer group"
        style={{
          width: 240,
          height: 380,
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
            <CardFront />
            <CardBack />
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
        <span className="text-[8px] tracking-wider" style={{ color: '#94a3b8' }}>
          CR80 · Hover to tilt
        </span>
      </div>
    </div>
  );
}
