import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Verified Student ID Card Generator',
  description: 'Generate high-fidelity, interactive 3D digital school identity cards. Instant serverless sharing via URLs, high-res image downloads, and print-ready CR80 PDFs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
