'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudentData, resizeAndCompressImage } from '../utils/compressor';
import { Upload, X, Trash2, Edit3, Image as ImageIcon, Sparkles, Palette, HelpCircle } from 'lucide-react';

interface IDCardFormProps {
  value: StudentData;
  onChange: (data: StudentData) => void;
  onSubmit: () => void;
}

const PRESET_COLORS = [
  { name: 'Titanium White', value: '#ffffff' },
  { name: 'Steel Gray', value: '#a1a1aa' },
  { name: 'Slate Gray', value: '#71717a' },
  { name: 'Carbon Black', value: '#27272a' },
];

const PRESET_AVATARS = [
  { id: 'av-grad-1', name: 'Aurora', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
  { id: 'av-grad-2', name: 'Breeze', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
  { id: 'av-grad-3', name: 'Dawn', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150' },
  { id: 'av-grad-4', name: 'Dust', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' },
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
  const handlePresetAvatarSelect = async (url: string) => {
    setPhotoError('');
    try {
      // We must fetch the preset image, convert it to base64, and compress it so it can be shared in the URL
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await resizeAndCompressImage(base64, 100, 133, 0.65);
        onChange({
          ...value,
          avatar: compressed,
        });
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error('Preset avatar fetch error:', e);
      // Fallback: set URL directly
      onChange({
        ...value,
        avatar: url,
      });
    }
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
    
    // Support TouchEvents and MouseEvents
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Scale according to CSS pixels relative to HTML Canvas sizes
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
    ctx.lineWidth = 3;
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
    
    // Resize signature image slightly to save space in base64 URL
    // Standard drawing canvas is 300x120; we scale it down to a small base64 string
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
    <div className="w-full flex flex-col gap-6">
      {/* Card Orientation Switcher */}
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-zinc-400" />
          Card Orientation
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['landscape', 'portrait'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange({ ...value, orientation: o })}
              className={`py-2.5 px-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                (value.orientation || 'landscape') === o
                  ? 'bg-white border-white text-black font-black'
                  : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Design Templates */}
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-zinc-400" />
          Select ID Card Design Theme
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['minimal', 'cyberpunk', 'classic', 'retro'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTemplateSelect(t)}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                value.template === t
                  ? 'bg-white border-white text-black font-black'
                  : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Color Accent Picker */}
      {value.template === 'minimal' && (
        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-zinc-400" />
            Customize Accent Tone
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleColorSelect(c.value)}
                className="w-8 h-8 rounded-full border border-white/10 relative transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-md"
                style={{ backgroundColor: c.value }}
                title={c.name}
              >
                {value.colorTheme === c.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-black shadow-md animate-scale-in" />
                )}
              </button>
            ))}
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <input
                type="color"
                name="colorTheme"
                value={value.colorTheme}
                onChange={handleInputChange}
                className="w-8 h-8 rounded-full border border-white/10 bg-transparent cursor-pointer p-0 overflow-hidden"
              />
              <span className="text-xs text-zinc-500 font-mono">{value.colorTheme.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Photo Upload */}
      <div className="flex flex-col gap-2.5">
        <label className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-zinc-400" />
          Student Photo
        </label>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Main upload trigger */}
          <div 
            onClick={triggerFileSelect}
            className={`w-28 h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all duration-300 group hover:bg-zinc-800/20 ${
              value.avatar 
                ? 'border-white/40 bg-white/5' 
                : 'border-zinc-800 hover:border-zinc-650 bg-zinc-950/30'
            }`}
          >
            {value.avatar ? (
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={value.avatar} 
                  alt="Student preview" 
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto();
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-zinc-900 hover:bg-zinc-800 rounded-full text-white shadow-lg border border-zinc-700 transition-transform hover:scale-110"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload className="w-6 h-6 text-zinc-500 group-hover:text-white group-hover:scale-110 transition-all" />
                <span className="text-[10px] text-zinc-500 font-medium group-hover:text-zinc-400">
                  Upload Photo
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

          {/* Quick presets fallback */}
          <div className="flex-1 flex flex-col gap-2 w-full">
            <span className="text-xs text-zinc-500 font-medium">Or choose a pre-curated illustration avatar:</span>
            <div className="flex items-center gap-3">
              {PRESET_AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => handlePresetAvatarSelect(av.url)}
                  className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-800 hover:border-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {photoError && <p className="text-xs text-rose-400 font-medium mt-1">{photoError}</p>}
            <p className="text-[10px] text-zinc-600 mt-1 max-w-sm">
              Note: Images are resized to optimized thumbnails locally to enable 100% serverless instant link sharing.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Personal Information Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Name</label>
          <input
            type="text"
            name="name"
            placeholder="Jane Doe"
            value={value.name}
            onChange={handleInputChange}
            className="w-full py-2.5 px-4 rounded-xl glass-input text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Roll No / ID Number</label>
          <input
            type="text"
            name="idNumber"
            placeholder="STU-2026-0042"
            value={value.idNumber}
            onChange={handleInputChange}
            className="w-full py-2.5 px-4 rounded-xl glass-input text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">School / College Name</label>
          <input
            type="text"
            name="school"
            placeholder="MIT School of Engineering"
            value={value.school}
            onChange={handleInputChange}
            className="w-full py-2.5 px-4 rounded-xl glass-input text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Grade / Department</label>
          <input
            type="text"
            name="grade"
            placeholder="Computer Science & Eng"
            value={value.grade}
            onChange={handleInputChange}
            className="w-full py-2.5 px-4 rounded-xl glass-input text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Card Role</label>
          <select
            name="role"
            value={value.role}
            onChange={handleInputChange}
            className="w-full py-2.5 px-4 rounded-xl glass-input text-sm bg-zinc-950"
          >
            <option value="STUDENT">STUDENT</option>
            <option value="FACULTY">FACULTY</option>
            <option value="STAFF">STAFF</option>
            <option value="VISITOR">VISITOR</option>
            <option value="ALUMNI">ALUMNI</option>
          </select>
        </div>

        <div className="flex grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Issue Date</label>
            <input
              type="text"
              name="issueDate"
              placeholder="08/2025"
              value={value.issueDate}
              onChange={handleInputChange}
              className="w-full py-2.5 px-4 rounded-xl glass-input text-xs font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Expiry Date</label>
            <input
              type="text"
              name="expiryDate"
              placeholder="08/2026"
              value={value.expiryDate}
              onChange={handleInputChange}
              className="w-full py-2.5 px-4 rounded-xl glass-input text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="j.doe@school.edu"
            value={value.email}
            onChange={handleInputChange}
            className="w-full py-2.5 px-4 rounded-xl glass-input text-sm"
          />
        </div>

        <div className="flex grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Emergency Phone</label>
            <input
              type="text"
              name="phone"
              placeholder="+1 234-567-890"
              value={value.phone}
              onChange={handleInputChange}
              className="w-full py-2.5 px-4 rounded-xl glass-input text-xs font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Blood Group</label>
            <input
              type="text"
              name="bloodGroup"
              placeholder="O+"
              value={value.bloodGroup}
              onChange={handleInputChange}
              className="w-full py-2.5 px-4 rounded-xl glass-input text-xs"
            />
          </div>
        </div>
      </div>

      {/* 5. Principal/Authority Signature Pad */}
      <div className="flex flex-col gap-2.5 mt-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-zinc-400" />
            Draw Authority Signature
          </label>
          <button
            type="button"
            onClick={clearSignature}
            className="text-xs font-medium text-rose-450 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            Clear signature
          </button>
        </div>
        <div className="relative w-full rounded-xl overflow-hidden glass-panel">
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
          <div className="absolute bottom-1 right-2 pointer-events-none text-[8.5px] text-zinc-650 font-semibold uppercase tracking-widest select-none">
            Sign inside this box
          </div>
        </div>
      </div>

      {/* 6. Form Submission Trigger */}
      <button
        type="button"
        onClick={onSubmit}
        className="w-full mt-4 py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-sm uppercase tracking-widest transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer border border-white"
      >
        <span>Generate Verified ID Card & Link</span>
      </button>
    </div>
  );
}
