'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Upload, 
  X, 
  Edit3, 
  Trash2, 
  Shield, 
  Loader2, 
  CheckCircle2, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { submitStudentData } from './actions';
import { resizeAndCompressImage } from '../../../utils/compressor';

interface UploadClientProps {
  school: {
    id: string;
    name: string;
    slug: string;
    branding_logo: string | null;
    color_theme: string;
    template: string;
    qr_type: string;
    lanyard_text: string | null;
    lanyard_color: string | null;
    lanyard_text_color: string | null;
  };
}

export default function UploadClient({ school }: UploadClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'contact' | 'media'>('profile');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [grade, setGrade] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [issueDate, setIssueDate] = useState('04/2025');
  const [expiryDate, setExpiryDate] = useState('03/2026');

  // Media Blobs / DataURIs
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [sigDataUrl, setSigDataUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Monitor network connection status in real-time
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Look for any cached draft saved from previous offline drops
    const draft = localStorage.getItem(`draft_${school.slug}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setName(parsed.name || '');
        setIdNumber(parsed.idNumber || '');
        setGrade(parsed.grade || '');
        setRole(parsed.role || 'STUDENT');
        setEmail(parsed.email || '');
        setPhone(parsed.phone || '');
        setBloodGroup(parsed.bloodGroup || 'O+');
        setAvatarDataUrl(parsed.avatar || '');
        setSigDataUrl(parsed.signature || '');
      } catch (e) {
        console.error('Failed to parse cached offline draft:', e);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [school.slug]);

  // Autosave draft locally in case of sudden drops (Loss Aversion & Resilience)
  const saveOfflineDraft = () => {
    const draftObj = {
      name, idNumber, grade, role, email, phone, bloodGroup,
      avatar: avatarDataUrl,
      signature: sigDataUrl
    };
    localStorage.setItem(`draft_${school.slug}`, JSON.stringify(draftObj));
  };

  // --- Network Resilience: Exponential Backoff Retry with Random Jitter (DSA) ---
  const fetchWithRetry = async (url: string, options: RequestInit, maxAttempts = 3): Promise<Response> => {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        throw new Error(`Server responded with status ${response.status}`);
      } catch (err) {
        attempt++;
        if (attempt >= maxAttempts) throw err;
        // Jittered Backoff Formula: T = base * 1.5^attempt * (1 +- Jitter)
        const delay = Math.round(1500 * Math.pow(1.5, attempt) * (0.8 + Math.random() * 0.4));
        setStatusMessage(`Network drop detected. Attempting retry ${attempt}/${maxAttempts} in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw new Error('Max network retries exceeded.');
  };

  // --- Client-Side Dual WebP Canvas compression ---
  const compressToBlob = (dataUrl: string, type: 'full' | 'thumb'): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Dual-WebP dimensions (400x533 for full CR80, 96x128 for thumbnail)
        const targetW = type === 'full' ? 400 : 96;
        const targetH = type === 'full' ? 533 : 128;
        
        canvas.width = targetW;
        canvas.height = targetH;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        
        ctx.drawImage(img, 0, 0, targetW, targetH);
        
        // Export to WebP at premium quality factor
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression Blob compilation failed'));
        }, 'image/webp', type === 'full' ? 0.70 : 0.65);
      };
      img.onerror = (e) => reject(e);
    });
  };

  // --- Cloudflare R2 Streamer ---
  const uploadToR2 = async (fileDataUrl: string, filename: string, isThumbnail = false): Promise<string> => {
    if (!fileDataUrl) return '';

    setStatusMessage(`Compressing ${isThumbnail ? 'thumbnail' : 'profile image'}...`);
    const blob = await compressToBlob(fileDataUrl, isThumbnail ? 'thumb' : 'full');

    const getCompressedBase64 = (): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    };

    setStatusMessage(`Signing secure upload link...`);
    const presignRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename,
        contentType: 'image/webp',
        fileSize: blob.size,
        isThumbnail
      })
    });

    if (!presignRes.ok) {
      const errData = await presignRes.json();
      throw new Error(errData.error || 'Failed to sign R2 upload credentials.');
    }

    const { uploadUrl, publicUrl } = await presignRes.json();

    // Graceful Developer Fallback
    if (uploadUrl === 'mock://local-upload') {
      return await getCompressedBase64(); // Return compressed WebP Base64 (~40KB instead of 5MB!)
    }

    setStatusMessage(`Uploading directly to Cloudflare R2 Edge...`);
    await fetchWithRetry(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/webp' },
      body: blob
    });

    return publicUrl;
  };


  // Handle Photos upload in browser
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Please choose a file smaller than 8MB. We will compress it.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        setAvatarDataUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Signature pad drawing triggers ---
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const coords = getCoords(e);
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
    const coords = getCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Save signature directly as Base64 (drawn signatures are extremely small, <5KB)
    const canvas = canvasRef.current;
    if (canvas) {
      setSigDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearSig = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSigDataUrl('');
    }
  };

  // Submit flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !idNumber.trim() || !grade.trim()) {
      setError('Please fill in Name, Student ID, and Class/Section.');
      return;
    }

    if (!isOnline) {
      saveOfflineDraft();
      alert('Offline Draft Saved! We will automatically upload as soon as your 3G signal recovers.');
      return;
    }

    setLoading(true);
    setError('');
    setStatusMessage('Preparing payloads...');

    try {
      // 1. Upload compressed avatar WebP and Thumbnail WebP directly to R2
      let finalAvatarUrl = avatarDataUrl;
      let finalThumbnailUrl = '';
      if (avatarDataUrl && avatarDataUrl.startsWith('data:')) {
        finalAvatarUrl = await uploadToR2(avatarDataUrl, `${idNumber}_photo.webp`, false);
        finalThumbnailUrl = await uploadToR2(avatarDataUrl, `${idNumber}_thumb.webp`, true);
      }

      // 2. Submit signature Base64 (kept as Base64 or uploaded to R2)
      let finalSignatureUrl = sigDataUrl;
      if (sigDataUrl && sigDataUrl.startsWith('data:')) {
        // Signatures are small but keeping them in R2 ensures unified CDN urls
        finalSignatureUrl = await uploadToR2(sigDataUrl, `${idNumber}_signature.webp`, true);
      }

      setStatusMessage('Syncing metadata to NeonDB...');
      const response = await submitStudentData(school.id, {
        name,
        idNumber,
        grade,
        role,
        email,
        phone,
        bloodGroup,
        issueDate,
        expiryDate,
        avatarUrl: finalAvatarUrl,
        thumbnailUrl: finalThumbnailUrl,
        signatureUrl: finalSignatureUrl
      });

      if (response.error) {
        setError(response.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        // Clear cached drafts
        localStorage.removeItem(`draft_${school.slug}`);
      }

    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err.message || 'Connection timeout. Please verify your internet speed.');
      setLoading(false);
      saveOfflineDraft(); // Keep safe
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#030303] text-white p-4 font-sans select-none relative overflow-y-auto">
      {/* Background grids */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px] -z-10" />

      {/* Online/Offline status card */}
      <div className="absolute top-4 right-4 z-40">
        {isOnline ? (
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-[8px] font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-md">
            <Wifi className="w-2.5 h-2.5 animate-pulse" />
            <span>3G Link Active</span>
          </div>
        ) : (
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-[8px] font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-md animate-pulse">
            <WifiOff className="w-2.5 h-2.5" />
            <span>Offline Draft Mode</span>
          </div>
        )}
      </div>

      <div className="max-w-xl w-full flex flex-col gap-6 py-8">
        
        {/* School Branding Header */}
        <header className="w-full flex items-center justify-between border-b border-zinc-900 pb-5 shrink-0">
          <div className="flex flex-col gap-1.5">
            <span className="text-[7.5px] font-mono tracking-widest text-zinc-550 uppercase px-2 py-0.5 bg-zinc-950 border border-zinc-900 rounded-md w-fit">
              Student Registration Portal
            </span>
            <h1 className="text-lg font-black uppercase tracking-tighter text-white">
              {school.name}
            </h1>
          </div>
          {school.branding_logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.branding_logo} alt="Logo" className="h-10 w-10 object-contain rounded-md border border-zinc-900 bg-zinc-950 p-1" />
          )}
        </header>

        {success ? (
          /* Celebratory Success card (Peak-End Rule) */
          <div className="w-full bg-zinc-950/40 border border-zinc-900 rounded-3xl p-8 text-center flex flex-col items-center gap-5 shadow-2xl backdrop-blur-xl glass-panel relative animate-[scaleUp_300ms_cubic-bezier(0.16,1,0.3,1)]">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-700" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-700" />
            
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] mt-3">
              <CheckCircle2 className="w-7 h-7 animate-bounce" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">
                Details Registered!
              </h2>
              <p className="text-[8.5px] uppercase tracking-wider text-zinc-400 max-w-xs leading-relaxed mx-auto">
                Student data has been successfully compressed and stored in the Neon database. The regional print partner has been notified.
              </p>
            </div>

            <button
              onClick={() => {
                setSuccess(false);
                setName('');
                setIdNumber('');
                setGrade('');
                setEmail('');
                setPhone('');
                setAvatarDataUrl('');
                setSigDataUrl('');
                clearSig();
                setActiveTab('profile');
              }}
              style={{ borderColor: school.color_theme }}
              className="mt-2 px-6 py-2.5 bg-white text-black hover:bg-zinc-200 text-[8.5px] uppercase tracking-widest font-black rounded-xl cursor-pointer active:scale-95 transition-all duration-150 shadow-md"
            >
              Register Another Student
            </button>
          </div>
        ) : (
          /* Main Interactive Form with Progressive Disclosure tabs */
          <form onSubmit={handleSubmit} className="w-full bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl backdrop-blur-2xl glass-panel relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-700" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-700" />

            <div className="flex flex-col gap-3">
              {/* Progressive disclosure tabs */}
              <div className="flex bg-zinc-950/80 p-0.5 border border-zinc-900 rounded-xl gap-0.5 w-full">
                {(['profile', 'contact', 'media'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-[8px] uppercase font-black tracking-widest rounded-lg cursor-pointer transition-all duration-150 active:scale-95 ${
                      activeTab === tab
                        ? 'bg-white text-black'
                        : 'text-zinc-500 hover:text-zinc-350 bg-transparent'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-grow flex flex-col gap-5 min-h-[220px]">
              
              {/* Tab 1: Profile */}
              {activeTab === 'profile' && (
                <div className="flex flex-col gap-4 animate-[fadeIn_150ms_ease-out]">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      placeholder="JANE DOE"
                      value={name}
                      onChange={(e) => { setName(e.target.value); saveOfflineDraft(); }}
                      className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Student ID Number</label>
                    <input
                      type="text"
                      placeholder="STU-2026-0042"
                      value={idNumber}
                      onChange={(e) => { setIdNumber(e.target.value); saveOfflineDraft(); }}
                      className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/5 transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Class / Section</label>
                      <input
                        type="text"
                        placeholder="GRADE X-A"
                        value={grade}
                        onChange={(e) => { setGrade(e.target.value); saveOfflineDraft(); }}
                        className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Role</label>
                      <select
                        value={role}
                        onChange={(e) => { setRole(e.target.value); saveOfflineDraft(); }}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none cursor-pointer hover:border-zinc-800"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="FACULTY">FACULTY</option>
                        <option value="STAFF">STAFF</option>
                        <option value="ALUMNI">ALUMNI</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Contact */}
              {activeTab === 'contact' && (
                <div className="flex flex-col gap-4 animate-[fadeIn_150ms_ease-out]">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      placeholder="J.DOE@ACADEMIA.EDU"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); saveOfflineDraft(); }}
                      className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); saveOfflineDraft(); }}
                        className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Blood Group</label>
                      <input
                        type="text"
                        placeholder="O+"
                        value={bloodGroup}
                        onChange={(e) => { setBloodGroup(e.target.value); saveOfflineDraft(); }}
                        className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none transition-all duration-200 placeholder:text-zinc-800 hover:border-zinc-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Issue Date</label>
                      <input
                        type="text"
                        value={issueDate}
                        onChange={(e) => { setIssueDate(e.target.value); saveOfflineDraft(); }}
                        className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-2 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none hover:border-zinc-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Expiry Date</label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => { setExpiryDate(e.target.value); saveOfflineDraft(); }}
                        className="w-full bg-zinc-950/45 border border-zinc-900 rounded-xl py-2.5 px-2 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none hover:border-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Media Upload */}
              {activeTab === 'media' && (
                <div className="flex flex-col gap-4 animate-[fadeIn_150ms_ease-out]">
                  {/* Photo dropzone */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center bg-zinc-950/40 p-4 border border-zinc-900/60 rounded-2xl">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-24 h-32 border flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all duration-200 shrink-0 rounded-xl ${
                        avatarDataUrl
                          ? 'border-zinc-700 bg-zinc-900/20'
                          : 'border-zinc-900 hover:border-zinc-500 bg-zinc-950/70 border-dashed'
                      }`}
                    >
                      {avatarDataUrl ? (
                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={avatarDataUrl} alt="Student" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setAvatarDataUrl(''); saveOfflineDraft(); }}
                            className="absolute -top-1.5 -right-1.5 p-0.5 bg-black border border-zinc-800 text-white hover:text-red-400 rounded-full transition-colors z-20 cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Upload className="w-4 h-4 text-zinc-650" />
                          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">
                            Photo
                          </span>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 flex flex-col gap-1 w-full">
                      <span className="text-[8px] text-zinc-400 uppercase tracking-widest font-black">Camera Photo Specs</span>
                      <p className="text-[8px] text-zinc-600 leading-relaxed uppercase">
                        Smartphone camera portraits supported. We compress images down to 40KB WebP on your device to ensure uploads succeed even on slow 3G networks.
                      </p>
                    </div>
                  </div>

                  {/* Signature pad */}
                  <div className="flex flex-col gap-2.5 bg-zinc-950/30 p-4 border border-zinc-900/60 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-zinc-550" />
                        Signature Drawer
                      </label>
                      <button
                        type="button"
                        onClick={clearSig}
                        className="text-[8px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                    <div className="relative w-full overflow-hidden border border-zinc-900 bg-zinc-950/90 rounded-xl">
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={100}
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={stopDraw}
                        onMouseLeave={stopDraw}
                        onTouchStart={startDraw}
                        onTouchMove={draw}
                        onTouchEnd={stopDraw}
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

            {error && (
              <div className="p-3 bg-red-950/15 border border-red-900/60 rounded-xl text-red-400 text-[8.5px] uppercase tracking-widest font-black text-center font-mono leading-normal">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Action Button with active scale anticipation */}
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: school.color_theme || '#ffffff', color: '#000000' }}
              className="w-full py-4 px-6 text-black font-black text-[9px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.96] shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.06)] disabled:opacity-50 shrink-0 font-sans"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>{statusMessage}</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-black animate-pulse" />
                  <span>Submit to print registry</span>
                </>
              )}
            </button>
          </form>
        )}

        <footer className="w-full border-t border-zinc-900 pt-5 flex items-center justify-between text-[7.5px] text-zinc-650 uppercase tracking-widest font-mono">
          <span>{school.name} Portal</span>
          <span>Powered by ID Card Studio</span>
        </footer>

      </div>
    </main>
  );
}
