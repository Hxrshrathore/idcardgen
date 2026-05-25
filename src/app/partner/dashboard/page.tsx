'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  Settings, 
  Sliders, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Sun, 
  Contrast, 
  Download, 
  Printer, 
  Loader2, 
  CheckCircle2, 
  User, 
  Image, 
  FileText, 
  Sparkles, 
  RefreshCw,
  Layout,
  Link2,
  Trash
} from 'lucide-react';
import { 
  getPartnerDetails, 
  getPartnerSchools, 
  createSchool, 
  getSchoolStudents, 
  updateStudentAdjustments, 
  updateStudentStatus, 
  deleteStudent, 
  deleteSchool,
  logoutPartner 
} from './actions';
import IDCardPreview from '../../../components/IDCardPreview';
import { StudentData } from '../../../utils/compressor';

// Mapping utility to adapt database records into frontend-coherent StudentData model
const mapDbStudentToStudentData = (student: any, school: any): StudentData => {
  const isLandscape = (school.template || '').includes('landscape');
  return {
    name: student.name,
    idNumber: student.id_number,
    school: school.name,
    role: student.role || 'STUDENT',
    grade: student.grade,
    email: student.email || '',
    phone: student.phone || '',
    bloodGroup: student.blood_group || 'O+',
    issueDate: student.issue_date || '04/2025',
    expiryDate: student.expiry_date || '03/2026',
    template: school.template || 'cbse-portrait',
    colorTheme: school.color_theme || '#2563eb',
    avatar: student.avatar_url || '',
    signature: student.signature_url || '',
    schoolLogo: school.branding_logo || '',
    qrType: school.qr_type || 'url',
    lanyardText: school.lanyard_text || '',
    lanyardColor: school.lanyard_color || '',
    lanyardTextColor: school.lanyard_text_color || '',
    imageAdjustments: student.image_adjustments || { zoom: 1, x: 0, y: 0, rotate: 0, brightness: 100, contrast: 100 },
    orientation: isLandscape ? 'landscape' : 'portrait'
  };
};

export default function PartnerDashboard() {
  const router = useRouter();
  
  // State
  const [partner, setPartner] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // School creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolSlug, setNewSchoolSlug] = useState('');
  const [newSchoolLogo, setNewSchoolLogo] = useState<string | null>(null);
  const [newSchoolTheme, setNewSchoolTheme] = useState('#2563eb');
  const [newSchoolTemplate, setNewSchoolTemplate] = useState('cbse-portrait');
  const [newSchoolQr, setNewSchoolQr] = useState('url');
  const [newLanyardText, setNewLanyardText] = useState('');
  const [newLanyardColor, setNewLanyardColor] = useState('#2563eb');
  const [newLanyardTextColor, setNewLanyardTextColor] = useState('#ffffff');

  // Studio Editor state
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studioAdjustments, setStudioAdjustments] = useState({
    zoom: 1.0,
    x: 0,
    y: 0,
    rotate: 0,
    brightness: 100,
    contrast: 100
  });
  
  // Utility copying state
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Hidden references for offscreen html2canvas card rendering
  const hiddenFrontRef = useRef<HTMLDivElement>(null);
  const hiddenBackRef = useRef<HTMLDivElement>(null);
  
  // Batch print rendering state
  const [batchStatus, setBatchStatus] = useState<'idle' | 'rendering' | 'success'>('idle');
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatusText, setBatchStatusText] = useState('');
  const [compileType, setCompileType] = useState<'pdf' | 'png'>('pdf');
  const [batchRenderStudent, setBatchRenderStudent] = useState<StudentData | null>(null);

  // Initial authentication & data load
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const partnerData = await getPartnerDetails();
        setPartner(partnerData);
        
        const schoolData = await getPartnerSchools();
        setSchools(schoolData);
        
        if (schoolData.length > 0) {
          setSelectedSchool(schoolData[0]);
        }
      } catch (err: any) {
        console.error('Failed to load partner details:', err);
        router.push('/partner/login');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [router]);

  // Load students when selected school shifts
  useEffect(() => {
    if (!selectedSchool) {
      setStudents([]);
      setSelectedStudent(null);
      return;
    }

    async function loadSchoolStudents() {
      try {
        setStudentsLoading(true);
        const studentData = await getSchoolStudents(selectedSchool.id);
        setStudents(studentData);
        setSelectedStudent(null); // Reset studio editor
      } catch (err: any) {
        console.error('Failed to load students:', err);
        setErrorMessage(err.message || 'Failed to retrieve registered students.');
      } finally {
        setStudentsLoading(false);
      }
    }

    loadSchoolStudents();
  }, [selectedSchool]);

  // Logout trigger
  const handleLogout = async () => {
    await logoutPartner();
    router.push('/partner/login');
  };

  // Clipboard Portal Copy helper
  const handleCopyLink = () => {
    if (!selectedSchool) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const publicUrl = `${origin}/upload/${selectedSchool.slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Convert File to Base64 for branding upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewSchoolLogo(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Create school handler
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage('');
    
    try {
      const res = await createSchool({
        name: newSchoolName,
        slug: newSchoolSlug,
        branding_logo: newSchoolLogo,
        color_theme: newSchoolTheme,
        template: newSchoolTemplate,
        qr_type: newSchoolQr,
        lanyard_text: newLanyardText,
        lanyard_color: newLanyardColor,
        lanyard_text_color: newLanyardTextColor
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage('School Portal successfully initialized!');
        const updatedSchools = await getPartnerSchools();
        setSchools(updatedSchools);
        
        // Reset state
        setNewSchoolName('');
        setNewSchoolSlug('');
        setNewSchoolLogo(null);
        setShowCreateModal(false);
        
        // Select the newly created school (first in ordering)
        if (updatedSchools.length > 0) {
          setSelectedSchool(updatedSchools[0]);
        }
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not instantiate school portal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete school handler
  const handleDeleteSchool = async (schoolId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this school portal? All registered students will be deleted permanently.')) return;
    
    try {
      setActionLoading(true);
      await deleteSchool(schoolId);
      const updatedSchools = await getPartnerSchools();
      setSchools(updatedSchools);
      if (selectedSchool?.id === schoolId) {
        setSelectedSchool(updatedSchools.length > 0 ? updatedSchools[0] : null);
      }
      setSuccessMessage('School portal successfully removed.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove school portal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger studio editor mode
  const openStudioEditor = (student: any) => {
    setSelectedStudent(student);
    const adj = student.image_adjustments || {
      zoom: 1.0,
      x: 0,
      y: 0,
      rotate: 0,
      brightness: 100,
      contrast: 100
    };
    setStudioAdjustments({
      zoom: adj.zoom || 1.0,
      x: adj.x || 0,
      y: adj.y || 0,
      rotate: adj.rotate || 0,
      brightness: adj.brightness || 100,
      contrast: adj.contrast || 100
    });
  };

  // Live adjustment modifications
  const handleAdjustmentChange = (key: string, val: number) => {
    setStudioAdjustments(prev => {
      const updated = { ...prev, [key]: val };
      // Inject adjustments into live rendering reference
      if (selectedStudent) {
        setSelectedStudent((student: any) => ({
          ...student,
          image_adjustments: updated
        }));
      }
      return updated;
    });
  };

  // Save adjustments to DB
  const saveAdjustments = async () => {
    if (!selectedStudent) return;
    setActionLoading(true);
    
    try {
      const res = await updateStudentAdjustments(selectedStudent.id, studioAdjustments);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage('Studio adjustments saved!');
        
        // Update local students list cache
        setStudents(prev => prev.map(s => {
          if (s.id === selectedStudent.id) {
            return { ...s, image_adjustments: studioAdjustments };
          }
          return s;
        }));
        
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sync image adjustments.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark student status as Completed or Pending
  const toggleStudentStatus = async (studentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      const res = await updateStudentStatus(studentId, nextStatus);
      if (!res.error) {
        setStudents(prev => prev.map(s => {
          if (s.id === studentId) {
            return { ...s, status: nextStatus };
          }
          return s;
        }));
        if (selectedStudent?.id === studentId) {
          setSelectedStudent((prev: any) => ({ ...prev, status: nextStatus }));
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Delete student handler
  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Permanently delete this student card record?')) return;
    
    try {
      await deleteStudent(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // --- High-Fidelity Printable A4 PDF layout generation with dotted lines & FOLD markers ---
  const generatePrintablePDF = async (singleStudentOnly = false) => {
    if (!selectedSchool) return;
    
    setBatchStatus('rendering');
    setBatchProgress(0);
    setBatchStatusText('Preparing high-res printer templates...');

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      // Filter list of cards to compile
      const compilationQueue = singleStudentOnly && selectedStudent
        ? [selectedStudent]
        : students;

      if (compilationQueue.length === 0) {
        alert('No students registered in this portal.');
        setBatchStatus('idle');
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const isLandscape = (selectedSchool.template || '').includes('landscape');
      const cardW_mm = isLandscape ? 85.6 : 53.98;
      const cardH_mm = isLandscape ? 53.98 : 85.6;
      
      // Fitting logic
      const maxRowsPerPage = isLandscape ? 4 : 3;
      let currentCardOnPage = 0;
      let pageCount = 1;

      for (let i = 0; i < compilationQueue.length; i++) {
        const rawStudent = compilationQueue[i];
        const studentData = mapDbStudentToStudentData(rawStudent, selectedSchool);

        setBatchStatusText(`Rendering ${i + 1} of ${compilationQueue.length}: ${studentData.name}`);
        setBatchProgress(Math.round((i / compilationQueue.length) * 100));

        // Load correct rendering template in hidden compiler block
        setBatchRenderStudent(studentData);
        await new Promise(r => setTimeout(r, 200)); // allow browser DOM layout synchronization

        if (!hiddenFrontRef.current || !hiddenBackRef.current) {
          console.warn('Hidden printing refs are missing from viewport.');
          continue;
        }

        // Render card faces at 4.0x DPI scale factor for crisp print quality
        const frontCanvas = await html2canvas(hiddenFrontRef.current, { scale: 4, useCORS: true, allowTaint: false });
        const backCanvas = await html2canvas(hiddenBackRef.current, { scale: 4, useCORS: true, allowTaint: false });

        const frontPng = frontCanvas.toDataURL('image/png');
        const backPng = backCanvas.toDataURL('image/png');

        if (currentCardOnPage >= maxRowsPerPage) {
          pdf.addPage();
          currentCardOnPage = 0;
          pageCount++;
        }

        const row = currentCardOnPage;
        
        // 1. Calculate positions side-by-side (Left: Front, Right: Back) for clean center folding
        const gap_mm = 0; // Exactly 0 gap enables cutting once and folding!
        const totalW_mm = (cardW_mm * 2) + gap_mm;
        const startX = (210 - totalW_mm) / 2; // Center horizontally on A4
        const yPos = 20 + (row * (cardH_mm + 12));

        // Draw Front & Back card prints
        pdf.addImage(frontPng, 'PNG', startX, yPos, cardW_mm, cardH_mm);
        pdf.addImage(backPng, 'PNG', startX + cardW_mm, yPos, cardW_mm, cardH_mm);

        // 2. Draw Dotted Cut Border outlines around combined front-back block
        pdf.setDrawColor(128, 128, 128);
        pdf.setLineWidth(0.2);
        if (typeof pdf.setLineDashPattern === 'function') {
          pdf.setLineDashPattern([1.5, 1.5], 0);
        }
        
        // Outermost cutting frame
        pdf.rect(startX, yPos, totalW_mm, cardH_mm);
        
        // Center dotted folding indicator
        pdf.line(startX + cardW_mm, yPos, startX + cardW_mm, yPos + cardH_mm);

        // 3. Render tiny cutting scissors icon and instruction strings under each card block
        pdf.setLineDashPattern([], 0); // Reset lines to solid
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.setTextColor(110, 110, 110);
        
        const instructionText = `✂️ CR80 PRECISION LAYOUT: CUT ALONG DOTTED LINES • FOLD IN HALF • HEAT LAMINATE`;
        pdf.text(instructionText, 105, yPos + cardH_mm + 4.5, { align: 'center' });

        currentCardOnPage++;
      }

      // Add overall print metadata headers on all pages
      for (let p = 1; p <= pageCount; p++) {
        pdf.setPage(p);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        
        pdf.text(`PORTAL REGISTRY PRINT SHEET — ${selectedSchool.name.toUpperCase()}`, 15, 12);
        pdf.text(`PAGE ${p} OF ${pageCount}`, 195, 12, { align: 'right' });
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.2);
        pdf.line(15, 14, 195, 14);
      }

      // Trigger download in client browser
      const dateToken = new Date().toISOString().split('T')[0];
      const filename = `${selectedSchool.slug}_printable_cards_${dateToken}.pdf`;
      pdf.save(filename);
      
      setBatchStatus('success');
      setTimeout(() => setBatchStatus('idle'), 2000);
    } catch (err: any) {
      console.error(err);
      alert('Compiler encountered an error during image generation.');
      setBatchStatus('idle');
    } finally {
      setBatchRenderStudent(null);
    }
  };

  // --- Capture PNG card export helper ---
  const handleSinglePngDownload = async (type: 'front' | 'back') => {
    if (!selectedStudent || !selectedSchool) return;
    
    setBatchStatus('rendering');
    setBatchProgress(40);
    setBatchStatusText('Compiling high-DPI raster asset...');
    
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const studentData = mapDbStudentToStudentData(selectedStudent, selectedSchool);
      setBatchRenderStudent(studentData);
      
      await new Promise(r => setTimeout(r, 200));

      const ref = type === 'front' ? hiddenFrontRef : hiddenBackRef;
      if (!ref.current) throw new Error('Render reference target unavailable');

      const canvas = await html2canvas(ref.current, { scale: 4, useCORS: true, allowTaint: false });
      const dataUri = canvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `${selectedStudent.id_number}_${type}.png`;
      link.click();
      
      setBatchStatus('success');
      setTimeout(() => setBatchStatus('idle'), 1500);
    } catch (err) {
      console.error(err);
      setBatchStatus('idle');
    } finally {
      setBatchRenderStudent(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#030303] text-white font-sans gap-3">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Securing session credentials...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col bg-[#030303] text-white p-4 font-sans select-none relative overflow-x-hidden">
      {/* Background Radial Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px] -z-10" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-zinc-800/5 blur-[160px] top-0 right-0 -z-20 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-zinc-700/5 blur-[140px] bottom-0 left-0 -z-20 pointer-events-none" />

      {/* Global Widescreen Header */}
      <header className="w-full flex items-center justify-between border-b border-zinc-900 pb-4 mb-6 shrink-0 z-30">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[7.5px] font-mono tracking-widest text-zinc-500 uppercase px-2 py-0.5 bg-zinc-950 border border-zinc-900 rounded-md w-fit">
              Partner Workspace
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-lg font-black uppercase tracking-tighter text-white flex items-center gap-2">
            IDCard <span className="text-zinc-500 font-light">Studio Core</span>
          </h1>
        </div>

        {partner && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[8px] font-mono text-zinc-500 uppercase">Authorized Operator</span>
              <span className="text-[10px] font-bold text-white uppercase tracking-tight">{partner.name || partner.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-zinc-950 border border-zinc-900 hover:border-white text-zinc-400 hover:text-white text-[8.5px] uppercase tracking-widest font-black rounded-xl cursor-pointer active:scale-95 transition-all duration-150 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Core</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Grid Division */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
        
        {/* sidebar column: schools */}
        <section className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-5 flex flex-col gap-4 shadow-xl backdrop-blur-xl relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-zinc-700" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-zinc-700" />
            
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">School Portals</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg cursor-pointer active:scale-90 transition-all duration-150 flex items-center gap-1"
                title="Create New School Portal"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {schools.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-zinc-900 rounded-2xl flex flex-col items-center gap-2">
                <span className="text-[8px] uppercase tracking-wider text-zinc-650">No portals initialized</span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 bg-zinc-900 text-white hover:bg-white hover:text-black text-[8px] uppercase tracking-widest font-bold rounded-lg cursor-pointer transition-all duration-150"
                >
                  Create Portal
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                {schools.map((school) => (
                  <div
                    key={school.id}
                    onClick={() => setSelectedSchool(school)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between relative group ${
                      selectedSchool?.id === school.id
                        ? 'border-white bg-zinc-900/40'
                        : 'border-zinc-900 bg-zinc-950/30 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: school.color_theme }} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10.5px] font-bold truncate text-white uppercase">{school.name}</span>
                        <span className="text-[7.5px] font-mono text-zinc-600 truncate uppercase">/{school.slug}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSchool(school.id);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-150 hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400 rounded transition-all duration-150 z-20 cursor-pointer"
                      title="Delete school portal"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Center column: Selected School Workspace */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          
          {selectedSchool ? (
            <>
              {/* Selected School Header / Active link details */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl backdrop-blur-xl relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-zinc-700" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-zinc-700" />
                
                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedSchool.color_theme }} />
                    <h2 className="text-sm font-black uppercase tracking-tight text-white">{selectedSchool.name}</h2>
                  </div>
                  <p className="text-[7.5px] font-mono uppercase tracking-widest text-zinc-500">
                    Template: {selectedSchool.template} • QR Type: {selectedSchool.qr_type}
                  </p>
                </div>

                {/* Secure Direct Upload link */}
                <div className="flex items-center gap-2 bg-zinc-950/90 border border-zinc-900 p-2.5 rounded-2xl w-full md:w-auto overflow-hidden shrink-0">
                  <div className="flex flex-col overflow-hidden px-1">
                    <span className="text-[7.5px] font-mono text-zinc-550 uppercase tracking-widest">Public Registration Link</span>
                    <span className="text-[9.5px] font-mono text-white truncate max-w-[200px] md:max-w-[280px]">
                      /upload/{selectedSchool.slug}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-auto md:ml-0">
                    <button
                      onClick={handleCopyLink}
                      className="p-2 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl cursor-pointer transition-all duration-150 active:scale-90"
                      title="Copy Public Form URL"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={`/upload/${selectedSchool.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90"
                      title="Open registration form"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Batch Compiler Bar & Registry Table */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 flex flex-col gap-6 shadow-xl backdrop-blur-xl relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-zinc-700" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-zinc-700" />
                
                {/* Compiler Action Bar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Student Registry Registry</span>
                    <span className="text-[8px] font-mono uppercase text-zinc-550 mt-0.5">
                      {students.length} Total records • {students.filter(s => s.status === 'pending').length} Pending compiler queue
                    </span>
                  </div>

                  {students.length > 0 && (
                    <button
                      onClick={() => generatePrintablePDF(false)}
                      disabled={batchStatus !== 'idle'}
                      className="px-4 py-2.5 bg-white text-black hover:bg-zinc-200 text-[8.5px] uppercase tracking-widest font-black rounded-xl cursor-pointer active:scale-95 transition-all duration-150 flex items-center gap-1.5 shadow-md shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5 text-black" />
                      <span>Print Cuttable A4 PDF Sheet</span>
                    </button>
                  )}
                </div>

                {/* Success/Error displays */}
                {successMessage && (
                  <div className="p-3 bg-emerald-950/25 border border-emerald-900/60 rounded-2xl text-emerald-400 text-[8.5px] uppercase tracking-widest font-black text-center font-mono animate-pulse">
                    ✓ {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="p-3 bg-red-950/20 border border-red-900/60 rounded-2xl text-red-400 text-[8.5px] uppercase tracking-widest font-black text-center font-mono animate-bounce">
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* Table implementation */}
                {studentsLoading ? (
                  <div className="text-center py-16 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    <span className="text-[8px] uppercase tracking-wider font-mono text-zinc-650">Syncing student metadata...</span>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-zinc-900 rounded-3xl flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-950/70 border border-zinc-900 flex items-center justify-center text-zinc-650">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-450">No students registered yet</p>
                      <p className="text-[8px] uppercase tracking-widest text-zinc-600 max-w-xs mx-auto leading-relaxed">
                        Provide the registration link to school managers or teachers. As they upload via smartphone, student records will auto-populate this queue.
                      </p>
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-zinc-900 hover:bg-white hover:text-black text-[8px] uppercase tracking-widest font-black rounded-lg cursor-pointer transition-all duration-150 mt-1"
                    >
                      Copy Upload Link
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="border-b border-zinc-900 text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                          <th className="pb-3 pl-2">Photo</th>
                          <th className="pb-3">Name / ID</th>
                          <th className="pb-3">Grade / Role</th>
                          <th className="pb-3">Registration Date</th>
                          <th className="pb-3 text-center">Print Status</th>
                          <th className="pb-3 pr-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/60 font-mono text-[10px] text-zinc-350">
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-zinc-900/10 group transition-colors">
                            <td className="py-3 pl-2">
                              <div className="w-8 h-10 border border-zinc-900 bg-zinc-950 rounded overflow-hidden flex items-center justify-center shrink-0">
                                {student.thumbnail_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={student.thumbnail_url} alt="Thumb" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-zinc-700" />
                                )}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-white uppercase text-[10.5px] font-sans">{student.name}</span>
                                <span className="text-[7.5px] text-zinc-500 tracking-wider mt-0.5">{student.id_number}</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-col">
                                <span className="text-zinc-400">{student.grade}</span>
                                <span className="text-[7.5px] text-zinc-650 uppercase tracking-widest mt-0.5">{student.role}</span>
                              </div>
                            </td>
                            <td className="py-3 text-[8.5px] text-zinc-600">
                              {new Date(student.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 text-center">
                              <button
                                onClick={() => toggleStudentStatus(student.id, student.status)}
                                className={`px-2 py-0.5 rounded text-[7.5px] font-black uppercase tracking-widest cursor-pointer ${
                                  student.status === 'completed'
                                    ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                                    : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                                }`}
                              >
                                {student.status}
                              </button>
                            </td>
                            <td className="py-3 pr-2 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openStudioEditor(student)}
                                  className="px-2.5 py-1 bg-zinc-900 hover:bg-white hover:text-black border border-zinc-900 hover:border-white rounded-lg text-[8.5px] uppercase font-black tracking-widest cursor-pointer active:scale-95 transition-all duration-150 flex items-center gap-1"
                                >
                                  <Sliders className="w-3 h-3" />
                                  <span>Studio</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="p-1 hover:bg-rose-500/10 text-zinc-700 hover:text-rose-400 rounded transition-all duration-150 cursor-pointer"
                                  title="Delete Student Card"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Widescreen Onboarding empty state */
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4 shadow-xl backdrop-blur-xl min-h-[400px]">
              <div className="w-16 h-16 rounded-3xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-500 shadow-lg animate-pulse mb-2">
                <Layout className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1.5 max-w-md">
                <h2 className="text-base font-black uppercase tracking-widest text-white">Select or Initialize Portal</h2>
                <p className="text-[9.5px] uppercase tracking-widest leading-relaxed text-zinc-500">
                  Configure school branding, lanyard credentials, print templates, and unique forms. Click the plus icon on the sidebar to initialize your first school portal database queue!
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 px-6 py-3 bg-white text-black hover:bg-zinc-200 text-[9px] uppercase tracking-widest font-black rounded-2xl cursor-pointer active:scale-95 transition-all duration-150 shadow-md"
              >
                Initialize First Portal
              </button>
            </div>
          )}
        </section>

      </div>

      {/* --- STUDIO EDITOR WORKSPACE OVERLAY PANEL --- */}
      {selectedStudent && selectedSchool && (
        <section className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_200ms_ease-out]">
          <div className="max-w-5xl w-full bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative my-8 animate-[scaleUp_250ms_cubic-bezier(0.16,1,0.3,1)]">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-700" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-700" />
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer z-30"
            >
              <XIcon className="w-4 h-4" />
            </button>

            {/* Studio Header block */}
            <div className="border-b border-zinc-900 pb-4">
              <span className="text-[7.5px] font-mono tracking-widest text-zinc-550 uppercase px-2 py-0.5 bg-zinc-950 border border-zinc-900 rounded-md w-fit">
                Studio Precision Editor
              </span>
              <h3 className="text-base font-black uppercase text-white mt-1.5 flex items-center gap-2">
                {selectedStudent.name} <span className="text-zinc-650 font-normal">({selectedStudent.id_number})</span>
              </h3>
            </div>

            {/* Layout dividing card and sliders */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Card visualizer column */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center bg-zinc-950/70 border border-zinc-900/60 p-6 rounded-2xl shrink-0 min-h-[350px] relative">
                <div className="w-[260px] aspect-[53.98/85.6] rounded-xl relative overflow-hidden flex items-center justify-center shrink-0">
                  <IDCardPreview 
                    data={mapDbStudentToStudentData(selectedStudent, selectedSchool)} 
                    showMockupOverride={false}
                  />
                </div>
                <span className="text-[7.5px] font-mono text-zinc-600 uppercase tracking-widest mt-4">
                  Drag avatar image offsets or slide controls to configure centering
                </span>
              </div>

              {/* Sliders columns */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Sliders Box */}
                <div className="bg-zinc-950/50 border border-zinc-900 p-5 rounded-2xl flex flex-col gap-5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-zinc-550" />
                    Calibration Controls
                  </span>

                  {/* Zoom slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Zoom factor</span>
                      <span className="font-mono text-white text-[9.5px]">{studioAdjustments.zoom.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.01"
                      value={studioAdjustments.zoom}
                      onChange={(e) => handleAdjustmentChange('zoom', parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Positioning offsets */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                        <span>Offset X</span>
                        <span className="font-mono text-white text-[9.5px]">{studioAdjustments.x}px</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="1"
                        value={studioAdjustments.x}
                        onChange={(e) => handleAdjustmentChange('x', parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                        <span>Offset Y</span>
                        <span className="font-mono text-white text-[9.5px]">{studioAdjustments.y}px</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="1"
                        value={studioAdjustments.y}
                        onChange={(e) => handleAdjustmentChange('y', parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>
                  </div>

                  {/* Rotation slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><RotateCw className="w-3 h-3" /> Angle rotation</span>
                      <span className="font-mono text-white text-[9.5px]">{studioAdjustments.rotate}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={studioAdjustments.rotate}
                      onChange={(e) => handleAdjustmentChange('rotate', parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Brightness / Contrast */}
                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-900/60 pt-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> Brightness</span>
                        <span className="font-mono text-white text-[9.5px]">{studioAdjustments.brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        step="1"
                        value={studioAdjustments.brightness}
                        onChange={(e) => handleAdjustmentChange('brightness', parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Contrast className="w-3 h-3" /> Contrast</span>
                        <span className="font-mono text-white text-[9.5px]">{studioAdjustments.contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        step="1"
                        value={studioAdjustments.contrast}
                        onChange={(e) => handleAdjustmentChange('contrast', parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>
                  </div>

                  {/* Reset action button */}
                  <button
                    onClick={() => {
                      setStudioAdjustments({ zoom: 1.0, x: 0, y: 0, rotate: 0, brightness: 100, contrast: 100 });
                      setSelectedStudent((student: any) => ({
                        ...student,
                        image_adjustments: { zoom: 1.0, x: 0, y: 0, rotate: 0, brightness: 100, contrast: 100 }
                      }));
                    }}
                    className="self-end px-3 py-1.5 border border-zinc-900 hover:border-zinc-700 bg-zinc-950 text-zinc-450 hover:text-white text-[8px] uppercase tracking-wider font-bold rounded-lg cursor-pointer transition-colors active:scale-95"
                  >
                    Reset defaults
                  </button>

                </div>

                {/* Exporter Operations */}
                <div className="bg-zinc-950/50 border border-zinc-900 p-5 rounded-2xl flex flex-col gap-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-zinc-550" />
                    Asset Compiler & Operations
                  </span>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleSinglePngDownload('front')}
                      className="py-3 px-2 bg-zinc-900 hover:bg-zinc-800 text-[8.5px] uppercase tracking-widest font-black rounded-xl cursor-pointer text-center border border-zinc-900 hover:border-zinc-700 active:scale-95 transition-all"
                    >
                      Front PNG
                    </button>
                    <button
                      onClick={() => handleSinglePngDownload('back')}
                      className="py-3 px-2 bg-zinc-900 hover:bg-zinc-800 text-[8.5px] uppercase tracking-widest font-black rounded-xl cursor-pointer text-center border border-zinc-900 hover:border-zinc-700 active:scale-95 transition-all"
                    >
                      Back PNG
                    </button>
                    <button
                      onClick={() => generatePrintablePDF(true)}
                      className="py-3 px-2 bg-zinc-900 hover:bg-zinc-800 text-[8.5px] uppercase tracking-widest font-black rounded-xl cursor-pointer text-center border border-zinc-900 hover:border-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-1 text-emerald-450"
                    >
                      <Printer className="w-3 h-3 text-emerald-400" />
                      Print PDF
                    </button>
                  </div>

                  <div className="flex gap-3 mt-2 border-t border-zinc-900/60 pt-4">
                    <button
                      onClick={() => toggleStudentStatus(selectedStudent.id, selectedStudent.status)}
                      className={`flex-1 py-3.5 text-[8.5px] font-black uppercase tracking-widest rounded-2xl cursor-pointer active:scale-95 transition-all border ${
                        selectedStudent.status === 'completed'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                          : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      Mark status as: {selectedStudent.status === 'completed' ? 'PENDING' : 'COMPLETED'}
                    </button>
                    <button
                      onClick={saveAdjustments}
                      disabled={actionLoading}
                      className="flex-1 py-3.5 bg-white text-black hover:bg-zinc-200 text-[8.5px] font-black uppercase tracking-widest rounded-2xl cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1 shadow-md"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Save Studio Edits</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>
      )}

      {/* --- CREATE SCHOOL GLASSMORPHIC DIALOG MODAL --- */}
      {showCreateModal && (
        <section className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_200ms_ease-out]">
          <form onSubmit={handleCreateSchool} className="max-w-xl w-full bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-2xl relative my-8 animate-[scaleUp_250ms_cubic-bezier(0.16,1,0.3,1)]">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-700" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-700" />
            
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>

            {/* Title */}
            <div>
              <span className="text-[7.5px] font-mono tracking-widest text-zinc-550 uppercase px-2 py-0.5 bg-zinc-950 border border-zinc-900 rounded-md w-fit">
                Initialize Portal Setup
              </span>
              <h3 className="text-base font-black uppercase text-white mt-1.5">
                New School Print Registry
              </h3>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-950/20 border border-red-900/60 rounded-xl text-red-400 text-[8.5px] uppercase tracking-widest font-black text-center font-mono">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Inputs body */}
            <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1">
              
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">School Portal Name</label>
                <input
                  type="text"
                  placeholder="DELHI PUBLIC SCHOOL"
                  value={newSchoolName}
                  onChange={(e) => {
                    setNewSchoolName(e.target.value);
                    setNewSchoolSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                  }}
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:outline-none placeholder:text-zinc-800"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Unique Portal Slug Link</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] font-mono text-zinc-650 uppercase">/upload/</span>
                  <input
                    type="text"
                    placeholder="delhi-public-school"
                    value={newSchoolSlug}
                    onChange={(e) => setNewSchoolSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl py-2.5 pl-14 pr-3 text-xs font-mono text-zinc-200 focus:outline-none placeholder:text-zinc-800"
                    required
                  />
                </div>
              </div>

              {/* Grid template specifications */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Default Template Layout</label>
                  <select
                    value={newSchoolTemplate}
                    onChange={(e) => setNewSchoolTemplate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:outline-none cursor-pointer hover:border-zinc-800"
                  >
                    <option value="cbse-portrait">CBSE Navy (Portrait)</option>
                    <option value="saffron-portrait">Saffron Vidyalaya (Portrait)</option>
                    <option value="green-portrait">NVS Emerald (Portrait)</option>
                    <option value="cbse-landscape">CBSE Navy (Landscape)</option>
                    <option value="saffron-landscape">Saffron Vidyalaya (Landscape)</option>
                    <option value="green-landscape">NVS Emerald (Landscape)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">QR Code Payload Type</label>
                  <select
                    value={newSchoolQr}
                    onChange={(e) => setNewSchoolQr(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:outline-none cursor-pointer hover:border-zinc-800"
                  >
                    <option value="url">Covering Verification URL</option>
                    <option value="vcard">VCard Contact Details Payload</option>
                  </select>
                </div>
              </div>

              {/* Accent Color picker */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Brand Accent Theme Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newSchoolTheme}
                      onChange={(e) => {
                        setNewSchoolTheme(e.target.value);
                        setNewLanyardColor(e.target.value);
                      }}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden"
                    />
                    <span className="text-[10px] font-mono text-white uppercase">{newSchoolTheme}</span>
                  </div>
                </div>
                
                {/* School logo branding */}
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">School Logo Branding</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-zinc-900 bg-zinc-950 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      {newSchoolLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={newSchoolLogo} alt="Logo" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <Image className="w-4 h-4 text-zinc-700" />
                      )}
                    </div>
                    <label className="px-3 py-1.5 bg-zinc-900 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white text-[8px] uppercase tracking-widest font-black rounded-lg cursor-pointer transition-colors select-none">
                      Upload Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Lanyard customization parameters */}
              <div className="border-t border-zinc-900/60 pt-4 flex flex-col gap-3">
                <span className="text-[7.5px] font-bold uppercase tracking-widest text-zinc-550">Lanyard Ribbon Configuration</span>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Lanyard Overlay Text</label>
                  <input
                    type="text"
                    placeholder="DELHI PUBLIC SCHOOL • CAMPUS OPERATOR"
                    value={newLanyardText}
                    onChange={(e) => setNewLanyardText(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl py-2.5 px-3 text-xs font-mono text-zinc-200 focus:outline-none placeholder:text-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Lanyard Ribbon Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newLanyardColor}
                        onChange={(e) => setNewLanyardColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden"
                      />
                      <span className="text-[10px] font-mono text-white uppercase">{newLanyardColor}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Lanyard Ribbon Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newLanyardTextColor}
                        onChange={(e) => setNewLanyardTextColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden"
                      />
                      <span className="text-[10px] font-mono text-white uppercase">{newLanyardTextColor}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-2 border-t border-zinc-900/60 pt-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white text-[8.5px] font-black uppercase tracking-widest rounded-2xl cursor-pointer active:scale-95 transition-all duration-150 text-center"
              >
                Cancel Setup
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-3.5 bg-white text-black hover:bg-zinc-200 text-[8.5px] font-black uppercase tracking-widest rounded-2xl cursor-pointer active:scale-95 transition-all duration-150 flex items-center justify-center gap-1 shadow-md"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Initialize Portal</span>
              </button>
            </div>

          </form>
        </section>
      )}

      {/* --- HIDDEN COMPILER BLOCK FOR CRISP RENDERING (OFFSCREEN RENDERING ENGINE) --- */}
      <div className="fixed -left-[1000px] -top-[1000px] pointer-events-none z-0">
        {batchRenderStudent && selectedSchool && (
          <div className="flex gap-10">
            {/* FRONT REF */}
            <div 
              ref={hiddenFrontRef}
              style={{
                width: (selectedSchool.template || '').includes('landscape') ? '323.5px' : '204px',
                height: (selectedSchool.template || '').includes('landscape') ? '204px' : '323.5px',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '0px', // clean cuts
              }}
            >
              <IDCardPreview 
                data={batchRenderStudent} 
                isFlippedOverride={false}
                showMockupOverride={false}
              />
            </div>

            {/* BACK REF */}
            <div 
              ref={hiddenBackRef}
              style={{
                width: (selectedSchool.template || '').includes('landscape') ? '323.5px' : '204px',
                height: (selectedSchool.template || '').includes('landscape') ? '204px' : '323.5px',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '0px', // clean cuts
              }}
            >
              <IDCardPreview 
                data={batchRenderStudent} 
                isFlippedOverride={true}
                showMockupOverride={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Compiler global progress bar overlay */}
      {batchStatus === 'rendering' && (
        <div className="fixed bottom-6 right-6 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-2 max-w-sm w-full animate-bounce">
          <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin text-white" /> Compiler active</span>
            <span className="font-mono text-white text-[9.5px]">{batchProgress}%</span>
          </div>
          <p className="text-[8px] uppercase font-mono text-zinc-550 truncate">{batchStatusText}</p>
          <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-300" style={{ width: `${batchProgress}%` }} />
          </div>
        </div>
      )}

    </main>
  );
}

// Inline fallback XIcon since lucide-react name is X
function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
