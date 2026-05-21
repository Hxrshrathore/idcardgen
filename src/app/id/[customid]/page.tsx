// Dynamic ID Page for Credentials
import { decompressStudentData } from '@/utils/compressor';

import { Metadata } from 'next';
import IDCardViewerClient from './IDCardViewerClient';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

interface PageProps {
  params: Promise<{ customid: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// 1. Server-Side Metadata Generation for SEO & Rich Link Sharing Previews
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { customid } = await params;
  const data = decompressStudentData(customid);

  if (!data) {
    return {
      title: 'Invalid ID Card - Verified Credentials',
      description: 'The requested student ID card is invalid or has expired.',
    };
  }

  return {
    title: `Verified: ${data.name} | ${data.school}`,
    description: `Official Verified Student ID Card for ${data.name} at ${data.school}. Click to view interactive 3D credential.`,
    openGraph: {
      title: `Verified ID Card: ${data.name}`,
      description: `Official digital student card at ${data.school}. Roll No: ${data.idNumber}`,
      type: 'profile',
      images: [
        {
          url: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
          width: 150,
          height: 200,
          alt: `${data.name}'s Profile Photo`,
        },
      ],
    },
  };
}

// 2. Server Entry Component
export default async function IDCardPage({ params, searchParams }: PageProps) {
  const { customid } = await params;
  const resolvedSearchParams = await searchParams;
  const isNew = resolvedSearchParams.new === 'true';

  const data = decompressStudentData(customid);

  // Fallback: Elegant error page if token decompression fails
  if (!data) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center p-4 bg-[#080710]">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-2">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">ID Card Credential Not Found</h1>
          <p className="text-sm text-zinc-400">
            The link you followed is invalid, corrupt, or has expired. Make sure the entire URL token was copied correctly.
          </p>
          <Link
            href="/"
            className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            Create New ID Card
          </Link>
        </div>
      </main>
    );
  }

  return (
    <IDCardViewerClient 
      data={data} 
      token={customid} 
      isNew={isNew} 
    />
  );
}
