'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Shield, 
  ArrowRight, 
  Sliders, 
  Zap, 
  Printer, 
  Database, 
  FileText, 
  User, 
  Check, 
  Layout, 
  Image as ImageIcon, 
  Globe 
} from 'lucide-react';
import IDCardPreview from '../components/IDCardPreview';
import { StudentData } from '../utils/compressor';

// Premium live demo data to render a breathing, premium ID card on the landing page!
const DEMO_STUDENT: StudentData = {
  name: 'RAHUL SHARMA',
  idNumber: 'STU-2026-0042',
  school: 'DELHI PUBLIC SCHOOL',
  role: 'STUDENT',
  grade: 'GRADE X-A',
  email: 'RAHUL.SHARMA@DPS.EDU',
  phone: '+91 98765 43210',
  bloodGroup: 'O+',
  issueDate: '04/2025',
  expiryDate: '03/2026',
  template: 'cbse-portrait',
  colorTheme: '#2563eb',
  avatar: '', // Fallback SVG placeholder will render beautifully
  signature: '',
  orientation: 'portrait',
  imageAdjustments: { zoom: 1.0, x: 0, y: 0, rotate: 0, brightness: 100, contrast: 100 }
};

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Database className="w-5 h-5 text-blue-400" />,
      title: "Multi-Tenant SaaS Portal",
      description: "Initialize school portals, configure branding layout templates, lanyard specs, and manage student rosters under a unified, high-performance partner dashboard."
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      title: "3G Network downscaling",
      description: "HTML5 Canvas compresses heavy smartphone photo uploads client-side down to 40KB WebP on device, bypassing timeouts and saving 99% of transmission bandwidth."
    },
    {
      icon: <Globe className="w-5 h-5 text-emerald-400" />,
      title: "Direct-to-R2 CDN Streaming",
      description: "Avoid Next.js backend bottleneck servers. Clients receive secure presigned PUT signatures and stream student data directly to global Cloudflare R2 buckets."
    },
    {
      icon: <Sliders className="w-5 h-5 text-purple-400" />,
      title: "Studio-Level Image Calibration",
      description: "Calibrate photo zoom scales, XY translation offsets, and rotation angles in real-time. Settings are synchronized with NeonDB as a compact JSONB adjustments column."
    },
    {
      icon: <Printer className="w-5 h-5 text-rose-400" />,
      title: "PVC Precision A4 Print Sheets",
      description: "Compile single cards or entire school batches into cuttable A4 print layout sheets featuring dotted scissors cutting guidelines, center fold markers, and lamination guides."
    }
  ];

  return (
    <main className="min-h-screen w-full bg-[#030303] text-white p-4 font-sans select-none relative overflow-x-hidden">
      {/* Background ambient grids and cosmic radial glows */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:32px_32px] -z-10" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-zinc-850/5 blur-[160px] top-1/4 left-1/4 -z-20 pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-zinc-800/5 blur-[160px] bottom-1/4 right-1/4 -z-20 pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto flex flex-col gap-12 py-10 md:py-16">
        
        {/* Navigation Bar */}
        <nav className="w-full flex items-center justify-between border-b border-zinc-900 pb-5 z-20 shrink-0">
          <h1 className="text-base font-black uppercase tracking-tighter text-white flex items-center gap-2">
            IDCard <span className="text-zinc-500 font-light">Studio Core</span>
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/partner/login"
              className="px-4 py-2 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white text-[8.5px] uppercase tracking-widest font-black rounded-xl cursor-pointer active:scale-95 transition-all duration-150 flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5 text-zinc-550" />
              <span>Partner Login</span>
            </Link>
            <Link
              href="/studio"
              className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-[8.5px] uppercase tracking-widest font-black rounded-xl cursor-pointer active:scale-95 transition-all duration-150 flex items-center gap-1 shadow-md"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center z-10 relative">
          
          {/* Left Hero Texts */}
          <div className="lg:col-span-7 flex flex-col gap-5 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[7.5px] font-mono tracking-widest text-zinc-500 uppercase px-2 py-0.5 bg-zinc-950 border border-zinc-900 rounded-md w-fit">
                ⚡ CR80 PVC-Calibrated Compiling Suite
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-[0.9] max-w-xl">
              CR80 Precision.<br/>
              School Scale.<br/>
              Instant Prints.
            </h2>

            <p className="text-xs uppercase tracking-wider text-zinc-400 max-w-md leading-relaxed">
              A high-performance database-driven multi-tenant SaaS framework. Downscale heavy smartphone photos client-side on device, stream securely directly to edge CDNs, and calibrate card layouts in real time.
            </p>

            {/* Tactical Call To Action Blocks */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link
                href="/studio"
                className="px-6 py-3.5 bg-white text-black hover:bg-zinc-250 text-[9px] uppercase tracking-widest font-black rounded-2xl cursor-pointer active:scale-[0.96] transition-all duration-150 flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.08)] font-sans"
              >
                <span>Launch Client-Side Studio</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </Link>
              <Link
                href="/partner/login"
                className="px-6 py-3.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-700 text-zinc-350 hover:text-white text-[9px] uppercase tracking-widest font-black rounded-2xl cursor-pointer active:scale-[0.96] transition-all duration-150 flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4 text-zinc-500" />
                <span>Operator Database Portal</span>
              </Link>
            </div>

            {/* Quick Metrics display */}
            <div className="grid grid-cols-3 gap-4 border-t border-zinc-900 pt-6 mt-4 max-w-md font-mono">
              <div className="flex flex-col">
                <span className="text-[14px] font-black text-white leading-none">99%</span>
                <span className="text-[7px] text-zinc-600 uppercase tracking-widest mt-1">Bandwidth Saved</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-black text-white leading-none">&lt; 3ms</span>
                <span className="text-[7px] text-zinc-600 uppercase tracking-widest mt-1">R2 Handshake API</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-black text-white leading-none">O(log N)</span>
                <span className="text-[7px] text-zinc-600 uppercase tracking-widest mt-1">Registry Indexing</span>
              </div>
            </div>

          </div>

          {/* Right Live ID Card Preview Panel */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-zinc-950/40 border border-zinc-900 rounded-3xl relative overflow-hidden min-h-[360px] md:min-h-[420px] shadow-xl backdrop-blur-xl group">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-700" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-700" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-zinc-700" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-zinc-700" />
            
            {/* Ambient subtle glow beneath preview card */}
            <div className="absolute w-[200px] h-[300px] rounded-full bg-blue-500/5 blur-[50px] pointer-events-none group-hover:scale-110 transition-transform duration-500" />

            <div className="w-[200px] aspect-[53.98/85.6] rounded-xl overflow-hidden relative shadow-2xl scale-110 group-hover:scale-115 transition-transform duration-300">
              <IDCardPreview 
                data={DEMO_STUDENT}
                showMockupOverride={false}
              />
            </div>

            <span className="text-[7px] font-mono text-zinc-650 uppercase tracking-widest mt-6 group-hover:text-zinc-500 transition-colors">
              CR80 Standard Template • 300 DPI layout print scale
            </span>
          </div>

        </header>

        {/* Feature Calibration Divisions (Apple-style interactive panels) */}
        <section className="flex flex-col gap-6 py-6 border-t border-zinc-900">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[7.5px] font-mono tracking-widest text-zinc-500 uppercase">Engine Architecture</span>
            <h3 className="text-base font-black uppercase text-white">Resilience & Engineering Specifications</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Interactive list column */}
            <div className="md:col-span-5 flex flex-col gap-2">
              {features.map((feat, index) => (
                <div
                  key={feat.title}
                  onClick={() => setActiveFeature(index)}
                  className={`p-4 border rounded-2xl cursor-pointer text-left transition-all duration-200 flex items-start gap-3.5 relative ${
                    activeFeature === index
                      ? 'border-white bg-zinc-900/40 shadow-md'
                      : 'border-zinc-900 bg-zinc-950/20 hover:border-zinc-800'
                  }`}
                >
                  <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-xl shrink-0">
                    {feat.icon}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-black uppercase text-white tracking-wide">{feat.title}</span>
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 mt-1 max-w-xs leading-normal">
                      {feat.description.substring(0, 75)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Details panel column */}
            <div className="md:col-span-7 bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 md:p-8 flex flex-col gap-4 relative justify-center">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-zinc-700" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-zinc-700" />

              <div className="flex items-center gap-2">
                <span className="p-2.5 bg-zinc-900/60 border border-zinc-850 rounded-xl">
                  {features[activeFeature].icon}
                </span>
                <h4 className="text-xs font-black uppercase text-white tracking-widest">
                  {features[activeFeature].title}
                </h4>
              </div>

              <p className="text-[10.5px] uppercase tracking-wider leading-relaxed text-zinc-400 border-l-2 border-zinc-800 pl-4 mt-2">
                {features[activeFeature].description}
              </p>

              {/* Specs parameters lists */}
              <div className="grid grid-cols-2 gap-4 mt-4 text-left border-t border-zinc-900/60 pt-4 font-mono text-[8px] text-zinc-550 uppercase tracking-widest">
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-zinc-400">Target Platforms</span>
                  <span>Vercel Compute Node</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-zinc-400">Database Engine</span>
                  <span>Neon Serverless Postgres</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-zinc-400">Storage Cluster</span>
                  <span>Cloudflare R2 CDN</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-zinc-400">Security Model</span>
                  <span>HTTP-Only JWT Cookie jose</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Operator division blocks */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-900 pt-10">
          
          <div className="p-6 md:p-8 bg-zinc-950/40 border border-zinc-900 rounded-3xl flex flex-col items-start gap-4 text-left relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-zinc-700" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-zinc-700" />
            
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Layout className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Individual Studio</h4>
              <p className="text-[8px] uppercase tracking-wider text-zinc-500 leading-normal">
                Perfect for teachers, schools, or event organizers looking to quickly design and export a single card or simple spreadsheet rosters in the local browser sandboxed storage.
              </p>
            </div>
            <Link
              href="/studio"
              className="mt-2 px-4 py-2 bg-zinc-900 hover:bg-white hover:text-black border border-zinc-800 hover:border-white text-zinc-450 hover:text-white text-[8px] uppercase tracking-widest font-black rounded-xl cursor-pointer transition-all duration-150"
            >
              Launch Client Studio
            </Link>
          </div>

          <div className="p-6 md:p-8 bg-zinc-950/40 border border-zinc-900 rounded-3xl flex flex-col items-start gap-4 text-left relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-zinc-700" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-zinc-700" />
            
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Shield className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Partner Database Portal</h4>
              <p className="text-[8px] uppercase tracking-wider text-zinc-500 leading-normal">
                Tailored for printing houses, regional coordinators, or corporate admins. Manage multiple schools, issue secure upload links for staff, adjust student avatars, and compile A4 sheets.
              </p>
            </div>
            <Link
              href="/partner/login"
              className="mt-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 text-[8px] uppercase tracking-widest font-black rounded-xl cursor-pointer transition-all duration-150 shadow-md"
            >
              Access operator core
            </Link>
          </div>

        </section>

        {/* Global Widescreen Footer */}
        <footer className="w-full border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[7.5px] text-zinc-650 uppercase tracking-widest font-mono shrink-0">
          <span>© 2026 ID Card Studio Core • All Rights Reserved</span>
          <span>SaaS Engine Version 1.2.0 • Coherent Database Setup</span>
        </footer>

      </div>
    </main>
  );
}
