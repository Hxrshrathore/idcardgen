'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentData, compressStudentData } from '../utils/compressor';
import IDCardForm from '../components/IDCardForm';
import IDCardPreview from '../components/IDCardPreview';
import { ShieldCheck, Sparkles, Award, Compass, Heart } from 'lucide-react';

const INITIAL_DEMO_DATA: StudentData = {
  name: 'Jane Doe',
  idNumber: 'STU-2026-0042',
  school: 'MIT School of Engineering',
  role: 'STUDENT',
  grade: 'Computer Science & Eng',
  email: 'j.doe@school.edu',
  phone: '+1 234-567-890',
  bloodGroup: 'O+',
  issueDate: '08/2025',
  expiryDate: '08/2026',
  template: 'minimal',
  colorTheme: '#6366f1', // Beautiful default Indigo
  avatar: '', // Starts empty to show placeholder icon or preset
  signature: '', // Hand signature canvas state
};

export default function Home() {
  const [studentData, setStudentData] = useState<StudentData>(INITIAL_DEMO_DATA);
  const router = useRouter();

  // Compress state to URL-safe token and redirect to presentation page
  const handleGenerateCard = () => {
    if (!studentData.name.trim() || !studentData.idNumber.trim() || !studentData.school.trim()) {
      alert('Please fill out the Name, Student ID, and School Name fields before generating.');
      return;
    }

    const token = compressStudentData(studentData);
    if (token) {
      router.push(`/id/${token}?new=true`);
    } else {
      alert('Failed to generate secure URL credential. Please try again.');
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#080710] py-12 px-4 select-none relative overflow-hidden">
      
      {/* Decorative blurred background shapes */}
      <div className="absolute top-[-10%] left-[5%] w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[-5%] w-[400px] h-[400px] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

      {/* Hero Header Section */}
      <header className="max-w-6xl w-full text-center flex flex-col items-center gap-3 mb-12 z-10">
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10.5px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
          <Award className="w-3.5 h-3.5" />
          <span>Serverless Digital Credentials</span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase max-w-3xl leading-none">
          Verified Student <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">ID Generator</span>
        </h1>
        
        <p className="text-zinc-400 text-xs md:text-sm max-w-2xl leading-relaxed">
          Create, customize, and share secure, double-sided institutional student identity credentials.
          Generates dynamic URLs that run completely client-side without databases, and supports high-res print A4 PDFs and PNG images.
        </p>
      </header>

      {/* Main Generator Workspace */}
      <section className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">
        
        {/* Left Side: Form Details */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <h2 className="text-base font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
            <Compass className="w-4.5 h-4.5 text-indigo-400" />
            1. Enter Student Credentials
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
          <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 self-start flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400 animate-spin-slow" />
              Real-time 3D Card Canvas
            </h2>

            <div className="w-full flex items-center justify-center p-2">
              <IDCardPreview 
                data={studentData} 
              />
            </div>
          </div>

          {/* Quick instructions / Features */}
          <div className="glass-panel rounded-2xl p-6 grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1 items-center text-center">
              <span className="text-[10px] font-extrabold text-white tracking-wider uppercase">NO DATABASE</span>
              <span className="text-[9px] text-zinc-500 leading-tight">URL carries 100% of encrypted data securely.</span>
            </div>
            <div className="flex flex-col gap-1 items-center text-center border-x border-zinc-800 px-3">
              <span className="text-[10px] font-extrabold text-white tracking-wider uppercase">3D TILT EFFECT</span>
              <span className="text-[9px] text-zinc-500 leading-tight">CSS 3D perspective responds to cursor.</span>
            </div>
            <div className="flex flex-col gap-1 items-center text-center">
              <span className="text-[10px] font-extrabold text-white tracking-wider uppercase">PRINT PERFECT</span>
              <span className="text-[9px] text-zinc-500 leading-tight">PDF scale fits standard CR80 wallet plastic.</span>
            </div>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-[10px] text-zinc-600 flex items-center gap-1.5 z-10">
        <span>Verified ID Platform</span>
        <span>•</span>
        <span>Made with</span>
        <Heart className="w-3 h-3 text-rose-600" />
        <span>for modern academics</span>
      </footer>

    </main>
  );
}
