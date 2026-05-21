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


  // Portrait templates
  const PORTRAIT_TEMPLATES: StudentData['template'][] = ['cbse-portrait', 'saffron-portrait', 'green-portrait'];
  // Landscape templates
  const LANDSCAPE_TEMPLATES: StudentData['template'][] = ['navy-landscape', 'maroon-landscape', 'tricolor-landscape'];

  // Select ID Card Design Template — also syncs orientation
  const handleTemplateSelect = (template: StudentData['template']) => {
    const isPortrait = PORTRAIT_TEMPLATES.includes(template);
    onChange({
      ...value,
      template,
      orientation: isPortrait ? 'portrait' : 'landscape',
      colorTheme: '#ffffff',
    });
  };

  // Switching orientation picks the first matching template in that group
  const handleOrientationChange = (o: 'landscape' | 'portrait') => {
    const currentIsPortrait = PORTRAIT_TEMPLATES.includes(value.template as StudentData['template']);
    const switchingGroup = (o === 'portrait') !== currentIsPortrait;
    const newTemplate = switchingGroup
      ? (o === 'portrait' ? PORTRAIT_TEMPLATES[0] : LANDSCAPE_TEMPLATES[0])
      : value.template;
    onChange({ ...value, orientation: o, template: newTemplate as StudentData['template'] });
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
      
      {/* A. Template — 6 Indian school designs in 2 groups */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          Design Template
        </label>

        {/* Portrait group */}
        <div className="flex flex-col gap-0">
          <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest px-1 pb-1">Portrait (Vertical)</div>
          <div className="grid grid-cols-3 gap-0 border border-zinc-800">
            {([
              { id: 'cbse-portrait', label: 'CBSE', sub: 'Navy' },
              { id: 'saffron-portrait', label: 'KV', sub: 'Saffron' },
              { id: 'green-portrait', label: 'NVS', sub: 'Green' },
            ] as const).map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplateSelect(t.id)}
                className={`py-2.5 px-1 flex flex-col items-center gap-0.5 text-center transition-all cursor-pointer ${
                  i < 2 ? 'border-r border-zinc-800' : ''
                } ${
                  value.template === t.id
                    ? 'bg-white text-black'
                    : 'bg-black text-zinc-500 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-wider">{t.label}</span>
                <span className={`text-[7px] font-bold uppercase tracking-wide ${
                  value.template === t.id ? 'text-zinc-600' : 'text-zinc-700'
                }`}>{t.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Landscape group */}
        <div className="flex flex-col gap-0">
          <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest px-1 pb-1">Landscape (Horizontal)</div>
          <div className="grid grid-cols-3 gap-0 border border-zinc-800">
            {([
              { id: 'navy-landscape', label: 'DPS', sub: 'Navy' },
              { id: 'maroon-landscape', label: 'Heritage', sub: 'Maroon' },
              { id: 'tricolor-landscape', label: 'National', sub: 'Tricolor' },
            ] as const).map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplateSelect(t.id)}
                className={`py-2.5 px-1 flex flex-col items-center gap-0.5 text-center transition-all cursor-pointer ${
                  i < 2 ? 'border-r border-zinc-800' : ''
                } ${
                  value.template === t.id
                    ? 'bg-white text-black'
                    : 'bg-black text-zinc-500 hover:text-white hover:bg-zinc-900/50'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-wider">{t.label}</span>
                <span className={`text-[7px] font-bold uppercase tracking-wide ${
                  value.template === t.id ? 'text-zinc-600' : 'text-zinc-700'
                }`}>{t.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* B. Orientation — read-only indicator (auto-set by template) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          Orientation
          <span className="ml-auto text-[8px] text-zinc-600 normal-case tracking-normal font-normal">auto-set by template</span>
        </label>
        <div className="grid grid-cols-2 gap-0 border border-zinc-800">
          {(['portrait', 'landscape'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => handleOrientationChange(o)}
              className={`py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                o === 'portrait' ? 'border-r border-zinc-800' : ''
              } ${
                (value.orientation || 'landscape') === o
                  ? 'bg-white text-black font-black'
                  : 'bg-black text-zinc-500 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* D. Photo */}
      <div className="flex flex-col gap-2 border border-zinc-800 p-4 bg-black">
        <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          Photo
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

          {/* Preset avatars */}
          <div className="flex-1 flex flex-col gap-2 w-full">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Or choose a preset avatar:</span>
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
              Preset avatars work offline and render crisply at any resolution.
            </p>
          </div>
        </div>
      </div>

      {/* E. Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
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
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">Student ID</label>
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
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">Institution</label>
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
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">Class / Section</label>
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
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">Role</label>
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
            <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">Issue Date</label>
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
            <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">Expiry Date</label>
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
          <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">Email</label>
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
            <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">Phone</label>
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
            <label className="text-[9.5px] font-bold text-zinc-500 uppercase tracking-widest">Blood Group</label>
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

      {/* F. Signature */}
      <div className="flex flex-col gap-2 border border-zinc-800 p-4 bg-black mt-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" />
            Signature
          </label>
          <button
            type="button"
            onClick={clearSignature}
            className="text-[9px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            Clear
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
            Draw here
          </div>
        </div>
      </div>

      {/* G. Generate */}
      <button
        type="button"
        onClick={onSubmit}
        className="w-full mt-4 py-4 px-6 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-widest transition-all cursor-pointer border border-white rounded-none flex items-center justify-center gap-2"
      >
        <Shield className="w-4 h-4" />
        <span>Generate ID Card</span>
      </button>
    </div>
  );
}
