# 🎨 ID Card Studio (`idcardgen`)

[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![React Version](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)](https://reactjs.org)
[![TailwindCSS Version](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#)
[![Forks](https://img.shields.io/github/forks/hxrshrathore/idcardgen?style=flat-square)](https://github.com/hxrshrathore/idcardgen/network)
[![Stars](https://img.shields.io/github/stars/hxrshrathore/idcardgen?style=flat-square)](https://github.com/hxrshrathore/idcardgen/stargazers)

An offline-first, client-side institutional ID Card Studio built on **Next.js 16**, **React 19**, and **Tailwind CSS 4**. This platform functions **100% serverless**, utilizing high-performance image compression and **LZString URL state serialization** to encode entire ID card layouts, credentials, and assets directly inside shareable URL tokens (<2KB) without a backend database.

## 🔗 Live Repository
* **GitHub Repository**: [github.com/hxrshrathore/idcardgen](https://github.com/hxrshrathore/idcardgen)
* **Developer**: [@hxrshrathore](https://github.com/hxrshrathore)

---

## 🎨 Architectural Overview

```mermaid
graph TD
    A[Widescreen Dashboard] -->|Toggle Workspace Mode| B{Studio View Mode}
    B -->|Single Mode| C[IDCardForm + IDCardPreview]
    B -->|Quick-List Mode| D[Interactive Spreadsheet Grid]
    
    D -->|Click Row| E[Active Preview Panel]
    D -->|Launch Modal| F[Signature Drawing Pad & PNG Upload]
    D -->|Inline Upload| G[Base64 Student Photo Encoder]
    
    E -->|Interactive 3D Mockup| H[Acrylic Holder & Branded Lanyard View]
    E -->|Select Style| I[Google Web Fonts Stylesheets Loader]
    E -->|Toggle Contact QR| J[vCard v3.0 Offline VCF Compiler]
    
    D -->|Click Batch Compile| K{Offline Render Engine}
    K -->|Loop Offscreen| L[IDCardFace flat canvas]
    L -->|JSZip packager| M[PVC PNG ZIP Archive]
    L -->|jsPDF compiler| N[A4 Multi-page Print PDF]
    
    O[Template Designer] -->|JSON Import/Export| P[Offline schema backup / share]
```

---

## 🚀 Key Modules & Capabilities

### 1. 🎛️ Single Generation Funnel (Home `/`)
* **Dynamic 3D Real-time Preview**: Features an interactive 3D card deck preview displaying genuine physics-based mouse tilt effects and click-to-flip cards on their Z-axis.
* **School Logo Integration**: Accommodates custom institution logo uploads alongside standard school names. When a logo is present, standard headers render a high-fidelity rounded logo container; otherwise, they fall back to styled mesh initials (e.g. `DPS`).
* **Signature Canvas & Asset Pack**: Includes an interactive touch/mouse canvas to capture digital signatures instantly, combined with an optimized preloaded avatars gallery.
* **Compact URL Packing**: Converts photos, signatures, and logos into scaled WebP data structures, running them through compression to fit inside a single browser address bar link.

### 2. 📑 Widescreen Quick-List Spreadsheet Grid (New!)
* **Interactive Spreadsheet Row Editor**: Toggle from the single card view to a widescreen, glassmorphic student table grid. Users can input rows of student details (Name, Student ID, Class, Role, School Name, Phone, Email, Blood Group) entirely offline.
* **Inline Avatar & Signature Uploads**: Supports click-to-upload files directly within table cells. Features a stylish circular photo preview and an **interactive drawing canvas signature box** to sign with touch or mouse pointers.
* **Synchronized Live Previews**: Clicking on any row in the spreadsheet makes it the *Active Row*, immediately rendering that student's card in the live 3D preview container on the right.
* **One-Click Offline Batch Compiler**: Seamlessly generates and downloads individual high-fidelity CR80 PVC-ready PNGs packed in a ZIP file, or compiles a multi-page, center-aligned A4 layout PDF with cut lines for manual printing.

### 3. 🎨 Visual Template Designer (`/designer`)
* **Background Extraction**: Integrates client-side **PDF.js** rendering. Users can upload standard portrait or landscape high-res multi-page PDF/PNG guidelines, extracting Front and Back backgrounds dynamically.
* **Absolute Grid Canvas**: Features drag-and-drop and real-time bounding box resize handles mapping elements using relative percentage vectors (`x`, `y`, `w`, `h` from `0` to `100`).
* **Keyboard Nudge Mechanics**: Precision adjusting lets users select fields and nudge them in `1%` increments using keyboard arrow keys.
* **JSON Layout Import & Export**: Back up, restore, or transfer custom designer layouts instantly. Layout bundles pack dimensions, element positions, custom fonts, and base64 template backgrounds in a lightweight, single `.json` schema file.

### 4. 💎 Advanced Offline Premium Extensions
* **🔠 Dynamic Google Fonts Selector**: Select premium, modern typography per text element in the designer sidebar (e.g., *Outfit*, *Space Grotesk*, *Playfair Display*, *Inter*, *Fira Code*, *Bungee*, *Montserrat*, *Lora*, etc.). Appends stylesheet links in the head dynamically for instant DOM and print canvas loading.
* **📇 vCard (VCF v3.0) QR Code Generator**: Switches card QR codes from online URL share trackers to offline electronic business cards. Scanning the card instantly opens a mobile contact prompt to save the student's complete profile.
* **📿 3D Acrylic Case & Color-Synchronized Lanyard**: Hangs the 3D card inside a transparent gloss-glass acrylic cover supported by a draped fabric lanyard ribbon. The lanyard color automatically matches the template accent, repeating logo watermarks (e.g., `DPS • DPS • DPS`) along the strap.

---

## 💾 Core Serialization Pipeline

To bypass backend databases and protect user privacy, card data is packed into a compact URL token:

```typescript
// Compact Payload Structure (~150 bytes excluding custom base64 images)
export interface CompactPayload {
  n: string;    // name
  i: string;    // idNumber
  s: string;    // school
  r?: string;   // role
  g?: string;   // grade
  e?: string;   // email
  p?: string;   // phone
  b?: string;   // bloodGroup
  d?: string;   // issueDate
  x?: string;   // expiryDate
  t: string;    // template ID (e.g., cbse-portrait)
  c?: string;   // custom theme hexadecimal
  a?: string;   // avatar Base64 WebP representation
  gS?: string;  // digital signature Base64
  sl?: string;  // school logo Base64
  o?: 'portrait' | 'landscape'; // card orientation
  qt?: 'u' | 'v'; // QR code type ('u' for URL, 'v' for vCard)
  cc?: string;  // compressed inline template coordinates config
}
```

---

## 🛠️ Technology Stack

* **Framework**: Next.js 16 (App Router)
* **Core Engine**: React 19 (Hooks, Context, Client/Server routing splits)
* **Styling**: Tailwind CSS v4 & Vanilla CSS variables
* **Icons**: `lucide-react`
* **Layout Parsing**: `xlsx` (SheetJS) & `jszip`
* **Compression**: `lz-string` (Lempel-Ziv-Welch URL safe tokens)
* **File Operations**: `jszip` & `file-saver` (batch package compilation)
* **QR Codes**: `qrcode`
* **Real Barcode Rendering**: Pure vector SVG renderer generating high-fidelity **Code 128** linear profiles
* **Image Capture**: `html2canvas-pro` (v2.0.2 for clean, hardware-accelerated offscreen flat face generation)
* **PDF Compilation**: `jspdf` (for accurate high-DPI millimeter vector offsets)

---

## 📂 Directory Layout

```
idcardgen/
├── public/                 # Static assets & sample templates
├── src/
│   ├── app/                # Next.js App Router Page Tree
│   │   ├── bulk/           # /bulk - Batch Excel sheet generator layout
│   │   ├── designer/       # /designer - Drag-and-drop template designer workspace
│   │   ├── id/             # /id/[token] - Single-card digital verification link
│   │   ├── layout.tsx      # Core viewport wrappers & Google Fonts injection
│   │   └── page.tsx        # Homepage - Single generator & Quick-List Spreadsheet Modes
│   ├── components/         # High-Performance UI Components
│   │   ├── IDCardForm.tsx  # Dynamic Details Form (avatar, sig-pad, logo upload)
│   │   └── IDCardPreview.tsx # 3D Deck, Acrylic Case/Lanyard, and custom ID Card Face
│   └── utils/              # Utility Functions
│       ├── avatars.ts      # Stylized preloaded mock avatar profiles
│       └── compressor.ts   # LZString encoders/decoders & image resizing bounds
├── package.json            # Scripts & Dependency mapping
└── tsconfig.json           # Strict type-checking boundaries
```

---

## ⚡ Quickstart & Development

### 1. Prerequisite Setup
Ensure you have [Node.js](https://nodejs.org) (v18+ recommended) installed on your local machine.

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/hxrshrathore/idcardgen.git
cd idcardgen
npm install
```

### 3. Start Development Server
Launch the Next.js Turbopack development hot-reloader:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your web browser.

### 4. Build Production Bundle
To build the static application and perform strict TypeScript compilation audits:
```bash
npm run build
```

---

## 🛡️ License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
