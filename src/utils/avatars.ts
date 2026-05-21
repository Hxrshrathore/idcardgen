/**
 * Local Premium Monochromatic SVG Avatars
 * Built to eliminate external network requests (preventing CORS canvas-tainting download errors)
 * and designed to match the high-end, human-crafted monochromatic editorial themes.
 */

// Escape SVG for use in data URI (replaces '#' with '%23')
function createSvgDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${svgString.replace(/#/g, '%23')}`;
}

// 1. ATELIER - Modernist Geometric Abstract Silhouette
const ATELIER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="120" height="160">
  <rect width="120" height="160" fill="#09090b"/>
  <circle cx="60" cy="55" r="28" fill="#ffffff" />
  <!-- Minimal geometric glasses/shadow block -->
  <rect x="36" y="52" width="48" height="6" fill="#27272a" rx="1"/>
  <circle cx="48" cy="55" r="7" stroke="#ffffff" stroke-width="3" fill="#09090b"/>
  <circle cx="72" cy="55" r="7" stroke="#ffffff" stroke-width="3" fill="#09090b"/>
  <path d="M60 55 v15 h-6" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <!-- Minimal posture blocks -->
  <path d="M25 125 C 25 110, 40 98, 60 98 C 80 98, 95 110, 95 125 C 95 135, 95 160, 95 160 H 25 Z" fill="#e4e4e7"/>
  <path d="M42 98 v28 h36 v-28 Z" fill="#ffffff" opacity="0.9"/>
  <!-- Grid overlay lines to look structured -->
  <line x1="12" y1="12" x2="108" y2="12" stroke="#27272a" stroke-width="0.5"/>
  <line x1="12" y1="148" x2="108" y2="148" stroke="#27272a" stroke-width="0.5"/>
</svg>
`.trim();

// 2. SYSTEM-7 - Technical Grid Schematic Wireframe
const SYSTEM_7_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="120" height="160">
  <rect width="120" height="160" fill="#000000"/>
  <!-- Technical Grid Background -->
  <line x1="0" y1="40" x2="120" y2="40" stroke="#18181b" stroke-width="0.5" stroke-dasharray="2,2"/>
  <line x1="0" y1="80" x2="120" y2="80" stroke="#18181b" stroke-width="0.5" stroke-dasharray="2,2"/>
  <line x1="0" y1="120" x2="120" y2="120" stroke="#18181b" stroke-width="0.5" stroke-dasharray="2,2"/>
  <line x1="30" y1="0" x2="30" y2="160" stroke="#18181b" stroke-width="0.5" stroke-dasharray="2,2"/>
  <line x1="60" y1="0" x2="60" y2="160" stroke="#18181b" stroke-width="0.5" stroke-dasharray="2,2"/>
  <line x1="90" y1="0" x2="90" y2="160" stroke="#18181b" stroke-width="0.5" stroke-dasharray="2,2"/>
  
  <!-- Technical Head Silhouette Grid -->
  <circle cx="60" cy="55" r="24" stroke="#a1a1aa" stroke-width="1.5" fill="none" stroke-dasharray="4,2"/>
  <circle cx="60" cy="55" r="18" stroke="#71717a" stroke-width="0.5" fill="none"/>
  
  <!-- Hairline shoulders -->
  <path d="M20 135 L 45 110 L 75 110 L 100 135" stroke="#a1a1aa" stroke-width="1.5" fill="none"/>
  <path d="M35 160 V 120 H 85 V 160" stroke="#27272a" stroke-width="1" fill="none"/>
  
  <!-- Coordinate markings -->
  <line x1="60" y1="20" x2="60" y2="90" stroke="#71717a" stroke-width="0.5"/>
  <line x1="25" y1="55" x2="95" y2="55" stroke="#71717a" stroke-width="0.5"/>
  
  <!-- Crosshairs -->
  <path d="M5 5 H 15 M 5 5 V 15" stroke="#ffffff" stroke-width="1"/>
  <path d="M115 5 H 105 M 115 5 V 15" stroke="#ffffff" stroke-width="1"/>
  <path d="M5 155 H 15 M 5 155 V 145" stroke="#ffffff" stroke-width="1"/>
  <path d="M115 155 H 105 M 115 155 V 145" stroke="#ffffff" stroke-width="1"/>
  
  <text x="60" y="152" fill="#a1a1aa" font-family="monospace" font-size="6.5" text-anchor="middle" letter-spacing="1">[SYS.SCHEM.07]</text>
</svg>
`.trim();

// 3. BESPOKE - Haute-Couture Portrait Outline
const BESPOKE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="120" height="160">
  <rect width="120" height="160" fill="#18181b"/>
  <!-- Thin double elegant border -->
  <rect x="4" y="4" width="112" height="152" fill="none" stroke="#71717a" stroke-width="0.5"/>
  <rect x="7" y="7" width="106" height="146" fill="none" stroke="#27272a" stroke-width="0.5"/>
  
  <!-- Sophisticated organic face profile (Artistic Serif Lines) -->
  <path d="M 60 30 
           C 65 30, 80 40, 80 58 
           C 80 75, 68 85, 68 95 
           L 68 102 
           C 68 105, 52 105, 52 102 
           L 52 95
           C 52 85, 40 75, 40 58
           C 40 40, 55 30, 60 30 Z" fill="#71717a" opacity="0.25"/>
  
  <circle cx="60" cy="55" r="22" stroke="#e4e4e7" stroke-width="1.5" fill="none"/>
  <path d="M 32 140 
           C 32 118, 48 108, 60 108 
           C 72 108, 88 118, 88 140 
           L 88 150 H 32 Z" fill="none" stroke="#e4e4e7" stroke-width="1.5"/>
           
  <path d="M 52 108 V 125 H 68 V 108" fill="none" stroke="#e4e4e7" stroke-width="1"/>
  
  <!-- Visual accent star to represent Bespoke design quality -->
  <path d="M 60 10 L 61.5 13 L 64.5 13.5 L 62 15.5 L 63 18.5 L 60 17 L 57 18.5 L 58 15.5 L 55.5 13.5 L 58.5 13 Z" fill="#ffffff"/>
</svg>
`.trim();

// 4. FINE-LINE - Abstract Continuous Wire Contour portrait
const FINE_LINE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="120" height="160">
  <rect width="120" height="160" fill="#000000"/>
  <!-- Minimal circular coordinates -->
  <circle cx="60" cy="80" r="54" fill="none" stroke="#18181b" stroke-width="1"/>
  <circle cx="60" cy="80" r="36" fill="none" stroke="#27272a" stroke-width="0.5"/>
  
  <!-- Continuous outline art of face and shoulders -->
  <path d="M 30 150 
           C 30 115, 38 105, 48 98
           C 40 90, 38 78, 42 62
           C 46 44, 58 36, 70 42
           C 80 48, 82 62, 78 76
           C 75 88, 70 94, 72 98
           C 82 105, 90 115, 90 150" 
        fill="none" 
        stroke="#ffffff" 
        stroke-width="1.5" 
        stroke-linecap="round"
        stroke-linejoin="round"/>
        
  <!-- Abstract artistic floating eye points -->
  <circle cx="52" cy="62" r="2" fill="#ffffff"/>
  <circle cx="68" cy="66" r="2" fill="#ffffff"/>
  <path d="M 58 74 Q 60 76 62 74" fill="none" stroke="#ffffff" stroke-width="1.5"/>
</svg>
`.trim();

export const PRESET_AVATARS = [
  { id: 'av-atelier', name: 'Atelier Outline', url: createSvgDataUri(ATELIER_SVG) },
  { id: 'av-system7', name: 'System-7 Grid', url: createSvgDataUri(SYSTEM_7_SVG) },
  { id: 'av-bespoke', name: 'Bespoke Serif', url: createSvgDataUri(BESPOKE_SVG) },
  { id: 'av-fineline', name: 'Fine Line Art', url: createSvgDataUri(FINE_LINE_SVG) },
];
