'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudentData, resizeAndCompressImage } from '../utils/compressor';
import { PRESET_AVATARS } from '../utils/avatars';
import { Upload, X, Trash2, Edit3, Image as ImageIcon, Palette, Shield, User, Info } from 'lucide-react';

interface IDCardFormProps {
  value: StudentData;
  onChange: (data: StudentData) => void;
  onSubmit: () => void;
}

export default function IDCardForm({ value, onChange, onSubmit }: IDCardFormProps) {
  const [photoError, setPhotoError] = useState('');
  const [logoError, setLogoError] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'contact' | 'credentials'>('identity');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Please select a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be less than 2MB.');
      return;
    }

    setLogoError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        // Downscale it to extremely small footprint
        const compressed = await resizeAndCompressImage(rawDataUrl, 96, 96, 0.65);
        onChange({
          ...value,
          schoolLogo: compressed,
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error handling logo:', err);
      setLogoError('Failed to compress logo.');
    }
  };

  const removeLogo = () => {
    onChange({
      ...value,
      schoolLogo: '',
    });
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const triggerLogoSelect = () => {
    logoInputRef.current?.click();
  };

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
        // Downscale it to extremely small footprint (WebP-style compression)
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

  // Zeigarnik Effect Fields Completion Tracker
  const fields = [
    { key: 'name', label: 'Full Name' },
    { key: 'idNumber', label: 'Student ID' },
    { key: 'grade', label: 'Class/Grade' },
    { key: 'school', label: 'Institution' },
    { key: 'avatar', label: 'Photo' },
    { key: 'signature', label: 'Signature' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
  ];

  const completedFields = fields.filter(f => !!value[f.key as keyof StudentData]);
  const completionPercentage = Math.round((completedFields.length / fields.length) * 100);

  return (
    <div className="w-full flex flex-col gap-6 font-sans text-[11px] text-[#e4e4e7]">
      {/* Zeigarnik Profile Integrity Completion Meter (Rule 13) */}
      <div className="bg-zinc-950/45 border border-zinc-900/80 rounded-2xl p-4 flex flex-col gap-2 shrink-0 glass-panel">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-black">
          <span className="text-zinc-400">Profile Integrity Meter</span>
          <span className={completionPercentage === 100 ? "text-emerald-400 font-extrabold flex items-center gap-1" : "text-zinc-350"}>
            {completionPercentage}% Complete
            {completionPercentage === 100 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />}
          </span>
        </div>
        <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
          <div 
            className="h-full bg-gradient-to-r from-zinc-750 via-zinc-500 to-white transition-all duration-500 ease-out" 
            style={{ width: `${completionPercentage}%` }} 
          />
        </div>
        {completionPercentage < 100 ? (
          <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest leading-normal font-mono font-bold">
            Pending: {fields.filter(f => !value[f.key as keyof StudentData]).map(f => f.label).join(' • ')}
          </span>
        ) : (
          <span className="text-[7.5px] text-emerald-400 uppercase tracking-widest font-black flex items-center gap-1.5 animate-pulse">
            ✦ Perfect Integrity! Certified Offline Ready
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Column 1: SECTION 1: Personal Profile Details */}
        <div className="relative overflow-hidden bg-zinc-950/20 border border-zinc-900/80 rounded-2xl p-5 hover:border-zinc-800/40 transition-all duration-300 flex flex-col gap-5 glass-panel">
          <div className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-3 mb-1">
              <User className="w-3.5 h-3.5 text-zinc-500" />
              Personal Profile Details
            </h3>

            {/* Snappy Sub-tabs for Progressive Disclosure (Rule 1, 16, 17) */}
            <div className="flex bg-zinc-950/80 p-0.5 border border-zinc-900 rounded-xl gap-0.5 w-full shrink-0">
              {(['identity', 'contact', 'credentials'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-[8.5px] uppercase font-bold tracking-widest rounded-lg cursor-pointer transition-all duration-150 active:scale-95 ${
                    activeTab === tab
                      ? 'bg-white text-black font-black shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300 bg-transparent'
                  }`}
                >
                  {tab === 'identity' ? 'Identity' : tab === 'contact' ? 'Contact' : 'Credentials'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content with Snappy SaaS transitions (Rule 14 & 212) */}
          <div className="flex-1 flex flex-col gap-5 transition-all duration-150">

            {/* Sub-tab 1: Identity */}
            {activeTab === 'identity' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="JANE DOE"
                    value={value.name}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Student ID</label>
                  <input
                    type="text"
                    name="idNumber"
                    placeholder="STU-2026-0042"
                    value={value.idNumber}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Class / Section</label>
                    <input
                      type="text"
                      name="grade"
                      placeholder="COMPUTER SCIENCE"
                      value={value.grade}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Role</label>
                    <select
                      name="role"
                      value={value.role}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 transition-all duration-200 cursor-pointer hover:border-zinc-800"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="FACULTY">FACULTY</option>
                      <option value="STAFF">STAFF</option>
                      <option value="VISITOR">VISITOR</option>
                      <option value="ALUMNI">ALUMNI</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Contact & Life */}
            {activeTab === 'contact' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="J.DOE@ACADEMIA.EDU"
                    value={value.email}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      placeholder="+91 98765 43210"
                      value={value.phone}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Blood Group</label>
                    <input
                      type="text"
                      name="bloodGroup"
                      placeholder="O+"
                      value={value.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Issue Date</label>
                    <input
                      type="text"
                      name="issueDate"
                      placeholder="04/2025"
                      value={value.issueDate}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-2 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 placeholder:text-zinc-800 hover:border-zinc-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Expiry Date</label>
                    <input
                      type="text"
                      name="expiryDate"
                      placeholder="03/2026"
                      value={value.expiryDate}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-2 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 placeholder:text-zinc-800 hover:border-zinc-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Credentials */}
            {activeTab === 'credentials' && (
              <div className="flex flex-col gap-4">
                {/* Photo Deck */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-950/40 p-4 border border-zinc-900/60 rounded-xl">
                  {/* Dropzone with absolute clean transitions */}
                  <div
                    onClick={triggerFileSelect}
                    className={`w-24 h-32 border flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all duration-200 shrink-0 rounded-xl ${
                      value.avatar
                        ? 'border-zinc-700 bg-zinc-900/25'
                        : 'border-zinc-850 hover:border-zinc-500 bg-zinc-950/70 border-dashed'
                    }`}
                  >
                    {value.avatar ? (
                      <div className="relative w-full h-full rounded-lg overflow-hidden">
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
                          className="absolute -top-1.5 -right-1.5 p-0.5 bg-black border border-zinc-800 text-white hover:text-rose-450 rounded-full transition-colors z-20 cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Upload className="w-4 h-4 text-zinc-550 hover:text-white transition-colors" />
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">
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

                  {/* Presets and Guidelines */}
                  <div className="flex-1 flex flex-col gap-2.5 w-full">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Preset Avatars</span>
                    <div className="flex items-center gap-2">
                      {PRESET_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => handlePresetAvatarSelect(av.url)}
                          className={`w-10 h-13 overflow-hidden border transition-all cursor-pointer rounded-lg ${
                            value.avatar === av.url 
                              ? 'border-white scale-105 shadow-md' 
                              : 'border-zinc-850 hover:border-zinc-650'
                          }`}
                          title={av.name}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    {photoError && <p className="text-[9px] text-rose-500 font-bold mt-1">{photoError}</p>}
                    <p className="text-[8px] text-zinc-600 leading-normal uppercase">
                      Offline-ready presets render perfectly at high resolution.
                    </p>
                  </div>
                </div>

                {/* Signature Drawer Box */}
                <div className="flex flex-col gap-2.5 bg-zinc-950/30 p-4 border border-zinc-900/60 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-zinc-550" />
                      Signature Drawer
                    </label>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[8px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                  <div className="relative w-full overflow-hidden border border-zinc-850 bg-zinc-950/90 rounded-xl">
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
                      className="w-full h-24 sig-canvas cursor-crosshair"
                    />
                    <div className="absolute bottom-1 right-2 pointer-events-none text-[7px] text-zinc-700 font-bold uppercase tracking-widest select-none">
                      Draw Signature Here
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
 
        {/* Column 2: SECTION 2: Branding & Lanyard Engine + Generate Button */}
        <div className="flex flex-col gap-6 w-full items-stretch">
          <div className="relative overflow-hidden bg-zinc-950/20 border border-zinc-900/80 rounded-2xl p-5 hover:border-zinc-800/40 transition-all duration-300 flex flex-col gap-5 glass-panel">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-3 mb-1">
              <Palette className="w-3.5 h-3.5 text-zinc-500" />
              Branding & Lanyard Engine
            </h3>

            {/* Institution and School Logo */}
            <div className="flex flex-col gap-3">
              <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Institution & Branding Logo</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  name="school"
                  placeholder="DELHI PUBLIC SCHOOL"
                  value={value.school}
                  onChange={handleInputChange}
                  className="flex-1 bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                  required
                />
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={triggerLogoSelect}
                    className="h-[36px] px-3 border border-zinc-900 bg-zinc-900/30 text-[8px] hover:text-white hover:border-zinc-500 rounded-xl transition-colors uppercase font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {value.schoolLogo ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={value.schoolLogo} alt="Logo" className="w-4 h-4 object-contain rounded-sm" />
                        <span>Change</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 text-zinc-550" />
                        <span>Logo</span>
                      </>
                    )}
                  </button>
                  {value.schoolLogo && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-1 -right-1 p-0.5 bg-black border border-zinc-800 text-white hover:text-rose-450 rounded-full cursor-pointer z-10"
                      title="Remove Logo"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>
              {logoError && <p className="text-[9px] text-rose-500 font-bold mt-1">{logoError}</p>}
            </div>

            {/* QR Code Segment Switcher */}
            <div className="flex flex-col gap-2.5 bg-zinc-950/30 p-4 border border-zinc-900/60 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-2 border-b border-zinc-950 pb-2.5">
                <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">QR Code Data Mode</span>
                <div className="flex bg-zinc-950 p-0.5 border border-zinc-900 rounded-lg shrink-0 gap-0.5">
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, qrType: 'url' })}
                    className={`px-3 py-1.5 text-[8px] uppercase font-bold transition-all rounded-md cursor-pointer ${
                      value.qrType !== 'vcard' 
                        ? 'bg-white text-black font-black shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-300 bg-transparent'
                    }`}
                  >
                    Share URL
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, qrType: 'vcard' })}
                    className={`px-3 py-1.5 text-[8px] uppercase font-bold transition-all rounded-md cursor-pointer ${
                      value.qrType === 'vcard' 
                        ? 'bg-white text-black font-black shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-300 bg-transparent'
                    }`}
                  >
                    vCard Contact
                  </button>
                </div>
              </div>
              <p className="text-[8px] text-zinc-650 leading-normal uppercase">
                {value.qrType === 'vcard'
                  ? "vCard Contact details compile offline for direct camera scanning."
                  : "Share URL creates secure verified cloud verification link."
                }
              </p>
            </div>

            {/* Lanyard Customizer Engine */}
            <div className="flex flex-col gap-4 bg-zinc-950/30 p-4 border border-zinc-900/60 rounded-xl">
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Lanyard Casing Customizer</span>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] text-zinc-500 uppercase font-black">Lanyard Ribbon Text</span>
                  <input
                    type="text"
                    name="lanyardText"
                    placeholder="e.g. STUDENT"
                    value={value.lanyardText || ''}
                    onChange={handleInputChange}
                    className="bg-zinc-950/45 border border-zinc-900 rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-zinc-200 focus:border-white focus:outline-none uppercase hover:border-zinc-800"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[8px] text-zinc-500 uppercase font-black">Ribbon Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="lanyardColor"
                      value={value.lanyardColor || value.colorTheme || '#1e3a5f'}
                      onChange={handleInputChange}
                      className="w-7 h-7 bg-transparent border-0 cursor-pointer rounded overflow-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => onChange({ ...value, lanyardColor: '' })}
                      className="text-[7.5px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 border border-zinc-850 px-2 py-1 rounded cursor-pointer transition-colors bg-transparent"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-1 border-t border-zinc-950 pt-2.5">
                <span className="text-[8px] text-zinc-500 uppercase font-black">Ribbon Text Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="lanyardTextColor"
                    value={value.lanyardTextColor || '#ffffff'}
                    onChange={handleInputChange}
                    className="w-7 h-7 bg-transparent border-0 cursor-pointer rounded overflow-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, lanyardTextColor: '' })}
                    className="text-[7.5px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 border border-zinc-850 px-2 py-1 rounded cursor-pointer transition-colors bg-transparent"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Action Button with scale anticipation micro-animations */}
          <button
            type="button"
            onClick={onSubmit}
            className="w-full mt-2 py-4 px-6 bg-white hover:bg-zinc-150 text-black font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer border border-white rounded-2xl flex items-center justify-center gap-2 duration-150 active:scale-[0.96] shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.06)] shrink-0"
          >
            <Shield className="w-4 h-4 text-black animate-pulse" />
            <span>Generate Secure ID Card</span>
          </button>
        </div>

      </div>
    </div>
  );
}
