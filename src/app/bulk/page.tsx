import React from 'react';
import BulkGeneratorClient from './BulkGeneratorClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bulk Generator | ID Card Studio',
  description: 'Generate multiple institutional ID cards simultaneously from Excel and ZIP uploads.',
};

export default function BulkGeneratorPage() {
  return <BulkGeneratorClient />;
}
