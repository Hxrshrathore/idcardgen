import React from 'react';
import { getSchoolDetails } from './actions';
import UploadClient from './UploadClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicUploadPage({ params }: PageProps) {
  const { slug } = await params;
  const school = await getSchoolDetails(slug);
  
  if (!school) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#030303] text-white p-4 font-sans select-none relative">
        <div className="max-w-md w-full bg-zinc-950/40 border border-zinc-900 rounded-3xl p-8 text-center flex flex-col gap-4 shadow-2xl backdrop-blur-2xl glass-panel relative">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-700" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-700" />
          <span className="text-4xl text-zinc-650 animate-bounce">⚠️</span>
          <h1 className="text-lg font-black uppercase tracking-widest text-white mt-2">
            Invalid Upload Link
          </h1>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
            This school registration portal does not exist or has been deactivated by the print partner. Please verify your URL.
          </p>
        </div>
      </main>
    );
  }
  
  return <UploadClient school={school} />;
}
