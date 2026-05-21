'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentData, compressStudentData } from '../utils/compressor';
import IDCardForm from '../components/IDCardForm';
import IDCardPreview from '../components/IDCardPreview';

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
  colorTheme: '#ffffff',
  avatar: '',
  signature: '',
  orientation: 'landscape',
};

export default function Home() {
  const [studentData, setStudentData] = useState<StudentData>(INITIAL_DEMO_DATA);
  const router = useRouter();

  const handleGenerateCard = () => {
    if (!studentData.name.trim() || !studentData.idNumber.trim() || !studentData.school.trim()) {
      alert('Please fill out the Name, Student ID, and School Name fields before generating.');
      return;
    }

    const token = compressStudentData(studentData);
    if (token) {
      router.push(`/id/${token}?new=true`);
    } else {
      alert('Failed to generate ID card URL. Please try again.');
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#030303] py-12 px-4 select-none relative overflow-hidden text-white font-mono">

      {/* Header */}
      <header className="max-w-6xl w-full text-left flex flex-col items-start gap-3 mt-4 mb-10 z-10 border-b border-zinc-900 pb-8">
        <div className="flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 text-[8.5px] font-bold text-zinc-400 uppercase tracking-widest bg-black">
          <span>ID Card Generator</span>
        </div>

        <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
          ID Card <span className="text-zinc-500 font-light">Studio</span>
        </h1>

        <p className="text-zinc-500 text-[10.5px] max-w-3xl leading-relaxed mt-1">
          Design and generate professional institutional ID cards. Serverless and privacy-first — 
          all data is encoded directly in the URL with no server storage.
        </p>
      </header>

      {/* Main Grid */}
      <section className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">

        {/* Left: Form */}
        <div className="lg:col-span-6 border border-zinc-900 bg-black p-6 md:p-8 relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-700" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-700" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />

          <h2 className="text-[11px] font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-zinc-900 pb-4">
            Card Details
          </h2>

          <IDCardForm
            value={studentData}
            onChange={setStudentData}
            onSubmit={handleGenerateCard}
          />
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-6 flex flex-col gap-6 sticky top-8">

          <div className="border border-zinc-900 bg-black p-6 md:p-8 flex flex-col items-center justify-center min-h-[380px] relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-700" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-700" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />

            <div className="w-full flex items-center justify-between mb-8 border-b border-zinc-900 pb-3">
              <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Live Preview
              </h2>
              <span className="text-[8.5px] text-zinc-600 font-bold uppercase tracking-wider">
                CR80 Standard
              </span>
            </div>

            <div className="w-full flex items-center justify-center p-2">
              <IDCardPreview
                data={studentData}
              />
            </div>
          </div>

          {/* Feature highlights */}
          <div className="border border-zinc-900 bg-black p-4 grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1 items-start text-left p-2 border-r border-zinc-900">
              <span className="text-[8.5px] font-bold text-zinc-450 tracking-wider uppercase">Serverless</span>
              <span className="text-[8px] text-zinc-600 leading-normal mt-1">All data lives in the URL. No database required.</span>
            </div>
            <div className="flex flex-col gap-1 items-start text-left p-2 border-r border-zinc-900 pl-3">
              <span className="text-[8.5px] font-bold text-zinc-450 tracking-wider uppercase">CR80 Format</span>
              <span className="text-[8px] text-zinc-600 leading-normal mt-1">Standard credit card size — 85.60 × 53.98 mm.</span>
            </div>
            <div className="flex flex-col gap-1 items-start text-left p-2 pl-3">
              <span className="text-[8.5px] font-bold text-zinc-450 tracking-wider uppercase">Print Ready</span>
              <span className="text-[8px] text-zinc-600 leading-normal mt-1">High-DPI canvas rendering with A4 print layout.</span>
            </div>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-[8.5px] text-zinc-700 flex items-center gap-2 border-t border-zinc-900 pt-6 max-w-6xl w-full justify-between">
        <span>ID Card Studio</span>
        <span>CR80 Standard • Serverless • Privacy First</span>
      </footer>

    </main>
  );
}
