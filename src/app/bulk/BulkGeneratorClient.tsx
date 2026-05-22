'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { IDCardFace } from '@/components/IDCardPreview';
import { StudentData, CustomTemplateConfig, compressCustomTemplate } from '@/utils/compressor';
import { Upload, FileSpreadsheet, FileArchive, Download, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// Helper for CSS sanitization (duplicated here for bulk client)
function replaceModernColors(css: string): string {
  let output = css;
  const targets = ['color-mix(in oklab,', 'color-mix(in oklch,', 'color-mix('];
  for (const target of targets) {
    let index = output.indexOf(target);
    while (index !== -1) {
      let parenCount = 1;
      let i = index + target.length;
      while (i < output.length && parenCount > 0) {
        if (output[i] === '(') parenCount++;
        else if (output[i] === ')') parenCount--;
        i++;
      }
      
      if (parenCount === 0) {
        const fullMatch = output.substring(index, i);
        let fallback = 'rgba(255, 255, 255, 0.2)';
        
        const match = fullMatch.match(/var\(--color-([a-z0-9-]+)\)\s+(\d+)%/i) || 
                      fullMatch.match(/#([a-f0-9]{3,8})\s+(\d+)%/i) ||
                      fullMatch.match(/(white|black|transparent)\s+(\d+)%/i);
                      
        if (match) {
          const colorName = match[1].toLowerCase();
          const percentage = parseInt(match[2], 10);
          const opacity = percentage / 100;
          
          if (colorName === 'white' || colorName === 'fff' || colorName === 'ffffff') fallback = `rgba(255, 255, 255, ${opacity})`;
          else if (colorName === 'black' || colorName === '000' || colorName === '000000') fallback = `rgba(0, 0, 0, ${opacity})`;
          else if (colorName.includes('orange') || colorName.includes('saffron')) fallback = `rgba(255, 153, 51, ${opacity})`;
          else if (colorName.includes('green') || colorName.includes('emerald')) fallback = `rgba(19, 136, 8, ${opacity})`;
          else if (colorName.includes('blue') || colorName.includes('navy') || colorName.includes('zinc') || colorName.includes('gray')) fallback = `rgba(100, 116, 139, ${opacity})`;
          else fallback = `rgba(128, 128, 128, ${opacity})`;
        } else {
          const percentMatch = fullMatch.match(/(\d+)%/);
          if (percentMatch) {
            const opacity = parseInt(percentMatch[1], 10) / 100;
            if (fullMatch.toLowerCase().includes('white') || fullMatch.toLowerCase().includes('fff')) fallback = `rgba(255, 255, 255, ${opacity})`;
            else fallback = `rgba(128, 128, 128, ${opacity})`;
          }
        }
        
        output = output.substring(0, index) + fallback + output.substring(i);
        index = output.indexOf(target, index + fallback.length);
      } else break;
    }
  }
  
  let oklabIndex = output.indexOf('oklab(');
  while (oklabIndex !== -1) {
    let parenCount = 1;
    let i = oklabIndex + 6;
    while (i < output.length && parenCount > 0) {
      if (output[i] === '(') parenCount++;
      else if (output[i] === ')') parenCount--;
      i++;
    }
    if (parenCount === 0) {
      const fallback = '#888888';
      output = output.substring(0, oklabIndex) + fallback + output.substring(i);
      oklabIndex = output.indexOf('oklab(', oklabIndex + fallback.length);
    } else break;
  }
  return output;
}

async function sanitizeStylesheets(): Promise<() => void> {
  const restores: (() => void)[] = [];
  if (typeof window === 'undefined') return () => {};

  const styleElements = Array.from(document.querySelectorAll('style'));
  for (const style of styleElements) {
    const originalText = style.textContent || '';
    if (originalText.includes('oklch') || originalText.includes('oklab') || originalText.includes('color-mix') || originalText.includes('light-dark')) {
      const sanitizedText = replaceModernColors(originalText);
      style.textContent = sanitizedText;
      restores.push(() => { style.textContent = originalText; });
    }
  }

  const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
  for (const link of linkElements) {
    try {
      const url = new URL(link.href, window.location.origin);
      if (url.origin === window.location.origin) {
        const response = await fetch(link.href);
        const cssText = await response.text();
        if (cssText.includes('oklch') || cssText.includes('oklab') || cssText.includes('color-mix') || cssText.includes('light-dark')) {
          const sanitizedText = replaceModernColors(cssText);
          const tempStyle = document.createElement('style');
          tempStyle.textContent = sanitizedText;
          document.head.appendChild(tempStyle);
          const originalDisabled = link.disabled;
          link.disabled = true;
          restores.push(() => {
            if (tempStyle.parentNode) tempStyle.parentNode.removeChild(tempStyle);
            link.disabled = originalDisabled;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to sanitize stylesheet link:', link.href, e);
    }
  }

  return () => {
    for (let i = restores.length - 1; i >= 0; i--) restores[i]();
  };
}

export default function BulkGeneratorClient() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [currentRenderData, setCurrentRenderData] = useState<StudentData | null>(null);
  
  const hiddenFrontRef = useRef<HTMLDivElement>(null);
  const hiddenBackRef = useRef<HTMLDivElement>(null);
  const cardW = 270;
  const cardH = 428;

  // Process files
  const handleProcess = async () => {
    if (!excelFile || !zipFile) return alert("Please upload both Excel and ZIP files.");
    setStatus('processing');
    setProgress(0);
    setStatusText('Parsing Excel...');

    try {
      // 1. Read Excel
      const excelBuffer = await excelFile.arrayBuffer();
      const workbook = XLSX.read(excelBuffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      
      if (rows.length === 0) throw new Error("Excel file is empty.");

      // 2. Read ZIP
      setStatusText('Parsing Images ZIP...');
      const zipBuffer = await zipFile.arrayBuffer();
      const jszip = new JSZip();
      const loadedZip = await jszip.loadAsync(zipBuffer);
      
      const imageMap: Record<string, string> = {};
      
      for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
        if (!zipEntry.dir) {
          const blob = await zipEntry.async('blob');
          const url = URL.createObjectURL(blob);
          const filename = relativePath.split('/').pop() || relativePath;
          imageMap[filename] = url;
        }
      }

      // 3. Prepare ZIP for output
      const outputZip = new JSZip();
      const frontFolder = outputZip.folder("Front_Images");
      const backFolder = outputZip.folder("Back_Images");
      const layoutFolder = outputZip.folder("A4_Print_Layouts");
      
      outputZip.file("STUDIO_INSTRUCTIONS.txt", `STUDIO PRINTING INSTRUCTIONS
----------------------------
1. /Front_Images and /Back_Images contain individual CR80 sized (85.60 × 53.98 mm) PNG files. These are ideal for direct PVC card printers (Zebra, Fargo, Magicard).
2. /A4_Print_Layouts contains PDF sheets. These are A4 sized and contain multiple cards per sheet with crop marks. Print these at 100% scale (Do not fit to page) on A4 sheets for manual cutting.
`);

      setStatusText('Initializing render engine...');
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');
      
      let pdfLayout = new jsPDF('p', 'mm', 'a4');
      let currentCardOnPage = 0;
      const cardsPerPage = 10; // 2 columns x 5 rows for CR80 on A4
      let pageCount = 1;

      // 4. Render loop
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setStatusText(`Rendering Card ${i + 1} of ${rows.length}...`);
        setProgress(((i) / rows.length) * 100);

        // Map row to StudentData
        const photoFilename = row['Photo Filename'] || row['photo'] || row['avatar'];
        const avatarUrl = imageMap[photoFilename] || '';
        const schoolLogoFilename = row['School Logo'] || row['school_logo'] || row['schoolLogo'] || row['logo'];
        const schoolLogoUrl = imageMap[schoolLogoFilename] || '';
        const template = row['Template'] || row['template'] || 'cbse-portrait';

        let isLandscape = ['navy-landscape', 'maroon-landscape', 'tricolor-landscape'].includes(template);
        let customTemplateConfig = '';

        if (template.startsWith('custom-') && typeof window !== 'undefined') {
          try {
            const savedStr = localStorage.getItem('id-templates') || '[]';
            const saved = JSON.parse(savedStr) as CustomTemplateConfig[];
            const found = saved.find(t => t.id === template);
            if (found) {
              isLandscape = found.orientation === 'landscape';
              customTemplateConfig = compressCustomTemplate(found, false);
            }
          } catch (e) {
            console.error('Failed to resolve custom template in bulk compiler:', e);
          }
        }

        const data: StudentData = {
          name: row['Name'] || row['name'] || '',
          idNumber: String(row['ID'] || row['idNumber'] || row['id'] || ''),
          school: row['School'] || row['school'] || 'DEFAULT SCHOOL',
          role: row['Role'] || row['role'] || 'STUDENT',
          grade: row['Class'] || row['grade'] || '',
          email: row['Email'] || row['email'] || '',
          phone: String(row['Phone'] || row['phone'] || ''),
          bloodGroup: row['Blood Group'] || row['bloodGroup'] || '',
          issueDate: row['Issue Date'] || row['issueDate'] || '',
          expiryDate: row['Expiry Date'] || row['expiryDate'] || '',
          template,
          colorTheme: '#ffffff',
          avatar: avatarUrl,
          signature: '',
          schoolLogo: schoolLogoUrl,
          orientation: isLandscape ? 'landscape' : 'portrait',
          customTemplateConfig
        };

        // Render offscreen
        setCurrentRenderData(data);
        
        // Wait for React to render the DOM
        await new Promise(r => setTimeout(r, 150));

        if (!hiddenFrontRef.current || !hiddenBackRef.current) continue;

        const restoreStyles = await sanitizeStylesheets();
        
        try {
          const frontCanvas = await html2canvas(hiddenFrontRef.current, { scale: 4, useCORS: true, allowTaint: false });
          const backCanvas = await html2canvas(hiddenBackRef.current, { scale: 4, useCORS: true, allowTaint: false });
          
          const frontData = frontCanvas.toDataURL('image/png');
          const backData = backCanvas.toDataURL('image/png');
          
          const safeName = `${data.idNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${data.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
          
          frontFolder?.file(`${safeName}_front.png`, frontData.split(',')[1], { base64: true });
          backFolder?.file(`${safeName}_back.png`, backData.split(',')[1], { base64: true });

          // Add to PDF Layout
          const isCardLandscape = data.orientation === 'landscape';
          const cardW_mm = isCardLandscape ? 85.6 : 53.98;
          const cardH_mm = isCardLandscape ? 53.98 : 85.6;

          const maxRowsPerPage = isCardLandscape ? 4 : 3;
          if (currentCardOnPage >= maxRowsPerPage) {
            pdfLayout.addPage();
            currentCardOnPage = 0;
            pageCount++;
          }
          
          const currR = currentCardOnPage;
          const yPos = 15 + (currR * (cardH_mm + 10));
          
          // Center-aligned side-by-side front and back
          const gap_mm = 15;
          const totalWidth = (cardW_mm * 2) + gap_mm;
          const startX = (210 - totalWidth) / 2; // Center on A4 (210mm wide)
          
          pdfLayout.addImage(frontData, 'PNG', startX, yPos, cardW_mm, cardH_mm);
          pdfLayout.addImage(backData, 'PNG', startX + cardW_mm + gap_mm, yPos, cardW_mm, cardH_mm);
          
          // Cut lines
          pdfLayout.setDrawColor(200, 200, 200);
          pdfLayout.setLineWidth(0.2);
          pdfLayout.rect(startX, yPos, cardW_mm, cardH_mm);
          pdfLayout.rect(startX + cardW_mm + gap_mm, yPos, cardW_mm, cardH_mm);
          
          currentCardOnPage++;

        } finally {
          restoreStyles();
        }
      }

      // Save PDF Layout
      if (rows.length > 0) {
        layoutFolder?.file('A4_Print_Layout.pdf', pdfLayout.output('arraybuffer'));
      }

      setStatusText('Zipping Files...');
      setProgress(100);
      
      const content = await outputZip.generateAsync({ type: "blob" });
      saveAs(content, "Bulk_ID_Cards.zip");

      setStatus('done');
      setStatusText('Bulk Generation Complete!');

    } catch (err: any) {
      console.error(err);
      alert("Error processing bulk generation: " + err.message);
      setStatus('idle');
    }
  };

  const handleDownloadSample = () => {
    // Generate Sample Excel
    const ws_data = [
      ["Name", "ID", "Class", "School", "Phone", "Blood Group", "Photo Filename", "School Logo", "Template"],
      ["Rahul Sharma", "STU-001", "X-A", "Delhi Public School", "9876543210", "O+", "rahul.jpg", "dps_logo.png", "cbse-portrait"],
      ["Priya Singh", "STU-002", "XII-B", "Kendriya Vidyalaya", "9123456789", "A+", "priya.jpg", "", "cbse-portrait"],
      ["Custom Template Student", "STU-003", "VIII-C", "Custom High School", "9998887776", "B-", "custom.jpg", "", "custom-171549..."]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    
    // Generate sample ZIP
    const zip = new JSZip();
    zip.file("Sample_Data.xlsx", XLSX.write(wb, { bookType: 'xlsx', type: 'array' }));
    
    // Create empty/dummy image files just to show structure
    zip.file("Photos/rahul.jpg", "dummy content, please replace with actual image");
    zip.file("Photos/priya.jpg", "dummy content, please replace with actual image");
    zip.file("Photos/custom.jpg", "dummy content, please replace with actual image");
    zip.file("Photos/dps_logo.png", "dummy content, please replace with actual image");
    zip.file("README.txt", `STUDIO BULK PRINTING INSTRUCTIONS
---------------------------------
1. Place all student photos and school logos directly in this ZIP (no subfolders) and reference them correctly in the Excel file's 'Photo Filename' and 'School Logo' columns.
2. In the 'Template' column, specify standard template IDs:
   - Portrait: 'cbse-portrait', 'saffron-portrait', 'green-portrait'
   - Landscape: 'navy-landscape', 'maroon-landscape', 'tricolor-landscape'
3. To use your own Custom Templates:
   - Create a template in the Template Designer (/designer)
   - Copy the Template ID from the Designer workspace
   - Paste it under the 'Template' column (e.g. 'custom-171549...')
   - The compiler will automatically load the layout and background from your browser's local cache!
`);

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "Sample_Bulk_Format.zip");
    });
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-[#030303] py-12 px-4 text-white font-mono overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-4 border-b border-zinc-900 flex items-center justify-between px-6 text-[8px] text-zinc-600 pointer-events-none z-20">
        <span>[SYSTEM_WORKSPACE // BULK_MODE]</span>
        <span>SYS.STATUS: BATCH_COMPILER_ACTIVE</span>
      </div>

      <header className="max-w-4xl w-full text-left flex flex-col items-start gap-3 mt-4 mb-10 z-10 border-b border-zinc-900 pb-8">
        <Link href="/" className="text-zinc-500 text-[10px] uppercase hover:text-white mb-2 flex items-center gap-2">
          ← Back to Studio
        </Link>
        <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
          Bulk <span className="text-zinc-500 font-light">Generator</span>
        </h1>
        <p className="text-zinc-500 text-[10.5px] max-w-2xl leading-relaxed mt-1">
          Generate hundreds of ID cards simultaneously. Upload an Excel sheet and a ZIP file containing student photos. 
          The compiler will output a zip with individual CR80 PVC PNGs and an A4 printable PDF layout.
        </p>
        <button onClick={handleDownloadSample} className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] uppercase tracking-wider font-bold border border-zinc-700 flex items-center gap-2">
          <Download className="w-3 h-3" /> Download Sample Format
        </button>
      </header>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
        
        {/* Upload Excel */}
        <div className="border border-zinc-800 bg-black p-6 flex flex-col items-center justify-center gap-4 relative group hover:border-zinc-500 transition-colors">
          <FileSpreadsheet className="w-10 h-10 text-zinc-600 group-hover:text-white transition-colors" />
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1">1. Data Source (Excel)</p>
            <p className="text-[9px] text-zinc-500">.xlsx or .csv file</p>
          </div>
          <input 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {excelFile && <p className="text-[10px] text-green-400 font-bold border border-green-900 bg-green-950/30 px-3 py-1">{excelFile.name}</p>}
        </div>

        {/* Upload ZIP */}
        <div className="border border-zinc-800 bg-black p-6 flex flex-col items-center justify-center gap-4 relative group hover:border-zinc-500 transition-colors">
          <FileArchive className="w-10 h-10 text-zinc-600 group-hover:text-white transition-colors" />
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1">2. Photos Archive (ZIP)</p>
            <p className="text-[9px] text-zinc-500">.zip containing images</p>
          </div>
          <input 
            type="file" 
            accept=".zip" 
            onChange={(e) => setZipFile(e.target.files?.[0] || null)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {zipFile && <p className="text-[10px] text-green-400 font-bold border border-green-900 bg-green-950/30 px-3 py-1">{zipFile.name}</p>}
        </div>

      </div>

      <div className="max-w-4xl w-full mt-8 z-10">
        {status === 'idle' && (
          <button 
            onClick={handleProcess}
            className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-black text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            COMPILE BULK BATCH
          </button>
        )}

        {status === 'processing' && (
          <div className="w-full p-6 border border-zinc-800 bg-[#050505] flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">{statusText}</p>
            <div className="w-full h-2 bg-zinc-900 mt-2">
              <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="w-full p-6 border border-green-900 bg-[#050f05] flex flex-col items-center gap-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <p className="text-[12px] uppercase tracking-wider font-bold text-green-400">{statusText}</p>
            <p className="text-[10px] text-zinc-400 text-center max-w-lg mt-2">
              Your bulk generation zip file is downloading. It contains individual print-ready CR80 PNGs and an A4 layout PDF for manual sheet printing.
            </p>
            <button 
              onClick={() => { setStatus('idle'); setExcelFile(null); setZipFile(null); }}
              className="mt-4 px-6 py-2 bg-black border border-green-900 hover:border-green-500 text-green-400 text-[9px] uppercase font-bold"
            >
              Start New Batch
            </button>
          </div>
        )}
      </div>

      {/* Hidden Render Target */}
      <div 
        aria-hidden="true"
        style={{
          position: 'absolute', top: 0, left: 0, width: '2000px', height: '2000px',
          opacity: 0.01, pointerEvents: 'none', zIndex: -1000,
        }}
      >
        {currentRenderData && (
          <>
            <div 
              ref={hiddenFrontRef} 
              style={{ 
                display: 'block', 
                width: currentRenderData.orientation === 'landscape' ? 428 : 270, 
                height: currentRenderData.orientation === 'landscape' ? 270 : 428, 
                overflow: 'hidden' 
              }}
            >
              <IDCardFace data={currentRenderData} side="front" shareUrl="" />
            </div>
            <div 
              ref={hiddenBackRef} 
              style={{ 
                display: 'block', 
                width: currentRenderData.orientation === 'landscape' ? 428 : 270, 
                height: currentRenderData.orientation === 'landscape' ? 270 : 428, 
                overflow: 'hidden', 
                marginTop: 20 
              }}
            >
              <IDCardFace data={currentRenderData} side="back" shareUrl="" />
            </div>
          </>
        )}
      </div>

    </main>
  );
}
