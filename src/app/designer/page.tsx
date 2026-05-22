'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const TemplateDesignerClient = dynamic(
  () => import('./TemplateDesignerClient'),
  { ssr: false }
);

export default function DesignerPage() {
  return <TemplateDesignerClient />;
}
