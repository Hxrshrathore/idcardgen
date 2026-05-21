'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudentData, resizeAndCompressImage } from '../utils/compressor';
import { PRESET_AVATARS } from '../utils/avatars';
import { Upload, X, Trash2, Edit3, Image as ImageIcon, Sliders, Palette, Shield } from 'lucide-react';

interface IDCardFormProps {
  value: StudentData;
  onChange: (data: StudentData) => void;
  onSubmit: () => void;
}

const PRESET_COLORS = [
  { name: 'Titanium White', value: '#ffffff' },
  { name: 'Steel Gray', value: '#a1a1aa' },
  { name: 'Slate Gray', value: '#71717a' },
  { name: 'Carbon Black', value: '#18181b' },
];

export default function IDCardForm({ value, onChange, onSubmit }: IDCardFormProps) {
  const [photoError, setPhotoError] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Signature Canvas settings on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear to transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // If there is an existing signature, draw it on the canvas
    if (value.signature) {
      const img = new Image();
      img.src = value.signature;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
  }, [value.signature]);

  // Handle Text/Config Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value: val } = e.target;
    onChange({
      ...value,
      [name]: val,
    });
  };

  // Select Preset Color Accent
  const handleColorSelect = (color: string) => {
    onChange({
      ...value,
      colorTheme: color,
    });
  };

  // Select ID Card Design Template
  const handleTemplateSelect = (template: StudentData['template']) => {
    onChange({
      ...value,
      template,
      colorTheme: '#ffffff', // Default to clean monochrome white accent
    });
  };

  // Process and Compress Image Files
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be less than 5MB.');
      return;
    }

    setPhotoError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        // Downscale it to extremely small footprint (96x96 or 120x120px WebP at 0.6 quality)
        const compressed = await resizeAndCompressImage(rawDataUrl, 100, 133, 0.65);
        onChange({
          ...value,
          avatar: compressed,
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error handling photo:', err);
      setPhotoError('Failed to compress image.');
    }
  };

  // Select a preset avatar
  const handlePresetAvatarSelect = (url: string) => {
    setPhotoError('');
    onChange({
      ...value,
      avatar: url,
    });
  };

  const removePhoto = () => {
    onChange({
      ...value,
      avatar: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- Signature Pad Drawing Logic ---
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const coords = getCanvasCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange({
      ...value,
      signature: '',
    });
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 120;
    tempCanvas.height = 48;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0, 120, 48);
      const sigDataUrl = tempCanvas.toDataURL('image/png');
      onChange({
        ...value,
        signature: sigDataUrl,
      });
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col gap-6 font-mono text-[11px]">
      
      {/* A. PHYSICAL GRID SPECIFICATIONS */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          CARD.ORIENTATION_METRIC
        </label>
        <div className="grid grid-cols-2 gap-0 border border-zinc-800">
          {(['landscape', 'portrait'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange({ ...value, orientation: o })}
              className={`py-3 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                (value.orientation || 'landscape') === o
                  ? 'bg-white text-black font-black'
                  : 'bg-black text-zinc-500 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              {o.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* B. CURATED WORKSPACE THEMES */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          CARD.DESIGN_SCHEMATIC
        </label>
        <div className="grid grid-cols-3 gap-0 border border-zinc-800">
          {(['atelier', 'system-7', 'bespoke'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTemplateSelect(t)}
              className={`py-3 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-r border-zinc-800 last:border-r-0 ${
                value.template === t
                  ? 'bg-white text-black font-black'
                  : 'bg-black text-zinc-500 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* C. MONOCHROMATIC ACCENT SELECTOR */}
      {value.template === 'atelier' && (
        <div className="flex flex-col gap-2 border border-zinc-800 p-4 bg-black">
          <label className="text-[9.5px] font-bold tracking-widest text-zinc-500 uppercase">
            ATELIER.ACCENT_TONE
          </label>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleColorSelect(c.value)}
                className="w-6 h-6 border border-zinc-700 relative transition-transform hover:scale-105 flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: c.value }}
                title={c.name}
              >
                {value.colorTheme === c.value && (
                  <div className="w-1.5 h-1.5 bg-zinc-900 mix-blend-difference" />
                )}
              </button>
            ))}
            <div className="flex items-center gap-2 pl-3 border-l border-zinc-800">
              <input
                type="color"
                name="colorTheme"
                value={value.colorTheme}
                onChange={handleInputChange}
                className="w-6 h-6 border border-zinc-700 bg-transparent cursor-pointer p-0 overflow-hidden"
              />
              <span className="text-[9px] text-zinc-400 font-mono">{value.colorTheme.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

      {/* D. VISUAL CREDENTIAL (AVATAR) */}
      <div className="flex flex-col gap-2 border border-zinc-800 p-4 bg-black">
        <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          VISUAL.AVATAR_PLATE
        </label>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center mt-1">
          {/* Stark Dropzone Frame */}
          <div 
            onClick={triggerFileSelect}
            className={`w-24 h-32 border flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all duration-200 shrink-0 ${
              value.avatar 
                ? 'border-zinc-700 bg-zinc-900/20' 
                : 'border-zinc-800 hover:border-zinc-500 bg-black'
            }`}
          >
            {value.avatar ? (
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={value.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto();
                  }}
                  className="absolute -top-1.5 -right-1.5 p-0.5 bg-black border border-zinc-800 text-white hover:text-rose-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1">
                <Upload className="w-4 h-4 text-zinc-600 hover:text-white" />
                <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">
                  UPLOAD
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Local SVG illustration catalog */}
          <div className="flex-1 flex flex-col gap-2 w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Or select vector system schematic:</span>
            <div className="flex items-center gap-2">
              {PRESET_AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => handlePresetAvatarSelect(av.url)}
                  className={`w-10 h-13 overflow-hidden border transition-all cursor-pointer ${
                    value.avatar === av.url ? 'border-white scale-105' : 'border-zinc-800 hover:border-zinc-650'
                  }`}
                  title={av.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {photoError && <p className="text-[9px] text-rose-500 font-bold mt-1">{photoError}</p>}
            <p className="text-[8px] text-zinc-600 leading-normal max-w-sm mt-1">
              * Local vectors guarantee high-DPI canvas integrity with zero CORS taint and absolute offline rendering support.
            </p>
          </div>
        </div>
      </div>

      {/* E. FIELD DIALS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">FIELD.FULL_NAME</label>
          <input
            type="text"
            name="name"
            placeholder="JANE DOE"
            value={value.name}
            onChange={handleInputChange}
            className="w-full bg-black border border-zinc-800 rounded-none py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">FIELD.CREDENTIAL_ID</label>
          <input
            type="text"
            name="idNumber"
            placeholder="STU-2026-0042"
            value={value.idNumber}
            onChange={handleInputChange}
            className="w-full bg-black border border-zinc-800 rounded-none py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">FIELD.INSTITUTION</label>
          <input
            type="text"
            name="school"
            placeholder="ACADEMIA INSTITUTE"
            value={value.school}
            onChange={handleInputChange}
            className="w-full bg-black border border-zinc-800 rounded-none py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">FIELD.CLASS_GRADE</label>
          <input
            type="text"
            name="grade"
            placeholder="COMPUTER SCIENCE"
            value={value.grade}
            onChange={handleInputChange}
            className="w-full bg-black border border-zinc-800 rounded-none py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">FIELD.CREDENTIAL_ROLE</label>
          <select
            name="role"
            value={value.role}
            onChange={handleInputChange}
            className="w-full bg-black border border-zinc-800 rounded-none py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none"
          >
            <option value="STUDENT">STUDENT</option>
            <option value="FACULTY">FACULTY</option>
            <option value="STAFF">STAFF</option>
            <option value="VISITOR">VISITOR</option>
            <option value="ALUMNI">ALUMNI</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">DATE.ISSUE</label>
            <input
              type="text"
              name="issueDate"
              placeholder="08/2025"
              value={value.issueDate}
              onChange={handleInputChange}
              className="w-full bg-black border border-zinc-800 rounded-none py-2.5 px-3 text-[11px] font-mono text-zinc-200 focus:border-white focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">DATE.EXPIRY</label>
            <input
              type="text"
              name="expiryDate"
              placeholder="08/2026"
              value={value.expiryDate}
              onChange={handleInputChange}
              className="w-full bg-black border border-zinc-800 rounded-none py-2.5 px-3 text-[11px] font-mono text-zinc-200 focus:border-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">FIELD.EMAIL</label>
          <input
            type="email"
            name="email"
            placeholder="J.DOE@ACADEMIA.EDU"
            value={value.email}
            onChange={handleInputChange}
            className="w-full bg-black border border-zinc-800 rounded-none py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">FIELD.PHONE</label>
            <input
              type="text"
              name="phone"
              placeholder="+1 234 567"
              value={value.phone}
              onChange={handleInputChange}
              className="w-full bg-black border border-zinc-800 rounded-none py-2.5 px-3 text-[11px] font-mono text-zinc-200 focus:border-white focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">FIELD.BLOOD_GROUP</label>
            <input
              type="text"
              name="bloodGroup"
              placeholder="O+"
              value={value.bloodGroup}
              onChange={handleInputChange}
              className="w-full bg-black border border-zinc-800 rounded-none py-2.5 px-3 text-[11px] font-mono text-zinc-200 focus:border-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* F. DRAW AUTHORITY SIGNATURE TERMINAL */}
      <div className="flex flex-col gap-2 border border-zinc-800 p-4 bg-black mt-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" />
            SIGNATURE.AUTHORITY_PAD
          </label>
          <button
            type="button"
            onClick={clearSignature}
            className="text-[9px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            [RESET.PAD]
          </button>
        </div>
        <div className="relative w-full overflow-hidden border border-zinc-800 bg-[#040404]">
          <canvas
            ref={canvasRef}
            width={300}
            height={100}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-24 sig-canvas"
          />
          <div className="absolute bottom-1 right-2 pointer-events-none text-[7px] text-zinc-650 font-bold uppercase tracking-widest select-none">
            [DRAWN SIGNATURE AREA]
          </div>
        </div>
      </div>

      {/* G. WORKSPACE GENERATE ACTION */}
      <button
        type="button"
        onClick={onSubmit}
        className="w-full mt-4 py-4 px-6 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest transition-all cursor-pointer border border-white rounded-none flex items-center justify-center gap-2"
      >
        <Shield className="w-4 h-4" />
        <span>COMPILE_CREDENTIAL_URL</span>
      </button>
    </div>
  );
}
