'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentData, compressStudentData } from '../utils/compressor';
import IDCardForm from '../components/IDCardForm';
import IDCardPreview from '../components/IDCardPreview';
import { Award, Compass, Sparkles, Terminal } from 'lucide-react';

const INITIAL_DEMO_DATA: StudentData = {
  name: 'JANE DOE',
  idNumber: 'STU-2026-0042',
  school: 'MIT SCHOOL OF ENGINEERING',
  role: 'STUDENT',
  grade: 'COMPUTER SCIENCE',
  email: 'J.DOE@SCHOOL.EDU',
  phone: '+1 234-567-890',
  bloodGroup: 'O+',
  issueDate: '08/2025',
  expiryDate: '08/2026',
  template: 'atelier',
  colorTheme: '#ffffff', // Stark titanium white preset default
  avatar: '', // Starts empty to show placeholder
  signature: '', // Starts empty to draw in signature pad
  orientation: 'landscape', // Standard credit card orientation
};

export default function Home() {
  const [studentData, setStudentData] = useState<StudentData>(INITIAL_DEMO_DATA);
  const router = useRouter();

  // Compress state to URL-safe token and redirect to presentation page
  const handleGenerateCard = () => {
    if (!studentData.name.trim() || !studentData.idNumber.trim() || !studentData.school.trim()) {
      alert('Please fill out the Name, Student ID, and School Name fields before compiling.');
      return;
    }

    const token = compressStudentData(studentData);
    if (token) {
      router.push(`/id/${token}?new=true`);
    } else {
      alert('Failed to compile secure URL credential.');
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#030303] py-12 px-4 select-none relative overflow-hidden text-white font-mono">
      
      {/* Micro Grid Rulers at absolute screen margins */}
      <div className="absolute top-0 left-0 right-0 h-4 border-b border-zinc-900 flex items-center justify-between px-6 text-[8px] text-zinc-600 pointer-events-none">
        <span>[SYSTEM_WORKSPACE]</span>
        <span>LAT: 42.3601° N, LON: 71.0589° W</span>
        <span>SYS.STATUS: ONLINE</span>
      </div>
      
      {/* Workstation Header */}
      <header className="max-w-6xl w-full text-left flex flex-col items-start gap-3 mt-4 mb-10 z-10 border-b border-zinc-900 pb-8">
        <div className="flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 text-[8.5px] font-bold text-zinc-400 uppercase tracking-widest bg-black">
          <Terminal className="w-3 h-3 text-zinc-500" />
          <span>INSTITUTIONAL CREDENTIAL COMPILER</span>
        </div>

        <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
          SECURE CARD <span className="text-zinc-500 font-light">WORKSTATION</span>
        </h1>

        <p className="text-zinc-500 text-[10.5px] max-w-3xl leading-relaxed mt-1">
          A high-precision, serverless development utility for compiling double-sided institutional identity cards. 
          Generates self-contained cryptographic URL tokens with 0KB server footprint, adhering to the physical standard CR80 format.
        </p>
      </header>

      {/* Main Generator Workspace Grid */}
      <section className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">

        {/* Left Side: Form Details - Configuration Panel */}
        <div className="lg:col-span-6 border border-zinc-900 bg-black p-6 md:p-8 relative">
          {/* Micro coordinate decorations */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-700" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-700" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />

          <h2 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-zinc-900 pb-4">
            <Compass className="w-4 h-4 text-zinc-500" />
            [01] SYSTEM.INPUT_INTERFACE
          </h2>

          <IDCardForm
            value={studentData}
            onChange={setStudentData}
            onSubmit={handleGenerateCard}
          />
        </div>

        {/* Right Side: Real-Time 3D Card Preview */}
        <div className="lg:col-span-6 flex flex-col gap-6 sticky top-8">

          {/* Card Frame wrapper */}
          <div className="border border-zinc-900 bg-black p-6 md:p-8 flex flex-col items-center justify-center min-h-[380px] relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-700" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-700" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />

            <div className="w-full flex items-center justify-between mb-8 border-b border-zinc-900 pb-3">
              <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                [02] PHYSICAL.CR80_PREVIEW
              </h2>
              <span className="text-[8.5px] text-zinc-650 font-bold uppercase tracking-wider">
                SCALE: 1:1 • ISO/IEC 7810
              </span>
            </div>

            <div className="w-full flex items-center justify-center p-2">
              <IDCardPreview
                data={studentData}
              />
            </div>
          </div>

          {/* Quick instructions / Features */}
          <div className="border border-zinc-900 bg-black p-4 grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1 items-start text-left p-2 border-r border-zinc-900">
              <span className="text-[8.5px] font-bold text-zinc-450 tracking-wider uppercase">00. PERSISTENCE</span>
              <span className="text-[8px] text-zinc-600 leading-normal mt-1">100% serverless url containment. zero db dependency.</span>
            </div>
            <div className="flex flex-col gap-1 items-start text-left p-2 border-r border-zinc-900 pl-3">
              <span className="text-[8.5px] font-bold text-zinc-450 tracking-wider uppercase">01. GEOMETRY</span>
              <span className="text-[8px] text-zinc-600 leading-normal mt-1">aspect-ratio constrained to 85.60 x 53.98mm credit scale.</span>
            </div>
            <div className="flex flex-col gap-1 items-start text-left p-2 pl-3">
              <span className="text-[8.5px] font-bold text-zinc-450 tracking-wider uppercase">02. COMPILATION</span>
              <span className="text-[8px] text-zinc-600 leading-normal mt-1">high DPI image canvas rendering & print-ready A4 vectors.</span>
            </div>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-[8.5px] text-zinc-700 flex items-center gap-2 border-t border-zinc-900 pt-6 max-w-6xl w-full justify-between">
        <span>SYSTEM VERSION: 2026.05.21</span>
        <span>CR80 PLATFORM SPECIFICATION • COPYRIGHT PURE HUMAN CADASTRAL</span>
      </footer>

    </main>
  );
}
