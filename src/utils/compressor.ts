import LZString from 'lz-string';

export interface StudentData {
  name: string;
  idNumber: string;
  school: string;
  role: string;
  grade: string;
  email: string;
  phone: string;
  bloodGroup: string;
  issueDate: string;
  expiryDate: string;
  template: string; // supports built-in and 'custom-*' templates
  colorTheme: string; // hex color code
  avatar: string; // Base64 image data URI or avatar preset name
  signature: string; // Base64 drawing data URI
  schoolLogo?: string; // Base64 image data URI of school logo
  orientation?: 'landscape' | 'portrait';
  customTemplateConfig?: string; // Compressed CustomTemplateConfig string for shared URLs
}

export interface TemplateElement {
  x: number;       // percentage (0-100)
  y: number;       // percentage (0-100)
  w: number;       // percentage (0-100)
  h: number;       // percentage (0-100)
  fontSize: number;// px sizing for text
  color: string;   // hex value
  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  enabled: boolean;
  side?: 'front' | 'back'; // side of the card it belongs to
}

export interface CustomTemplateConfig {
  id: string;
  name: string;
  orientation: 'portrait' | 'landscape';
  themeColor: string;
  frontBg: string; // Base64 or URL
  backBg: string;  // Base64 or URL
  elements: {
    name: TemplateElement;
    idNumber: TemplateElement;
    school: TemplateElement;
    role: TemplateElement;
    grade: TemplateElement;
    email: TemplateElement;
    phone: TemplateElement;
    bloodGroup: TemplateElement;
    avatar: Omit<TemplateElement, 'fontSize' | 'color' | 'align' | 'bold' | 'italic'>;
    qrCode: Omit<TemplateElement, 'fontSize' | 'color' | 'align' | 'bold' | 'italic'>;
    barcode: Omit<TemplateElement, 'fontSize' | 'color' | 'align' | 'bold' | 'italic'>;
    signature: Omit<TemplateElement, 'fontSize' | 'color' | 'align' | 'bold' | 'italic'>;
    schoolLogo?: Omit<TemplateElement, 'fontSize' | 'color' | 'align' | 'bold' | 'italic'>;
  };
}

/**
 * Compresses CustomTemplateConfig to keep it compact.
 * Strips base64 backgrounds unless explicitly requested, to fit into shared URLs.
 */
export function compressCustomTemplate(config: CustomTemplateConfig, includeImages = false): string {
  try {
    const strippedConfig = {
      ...config,
      frontBg: includeImages || !config.frontBg.startsWith('data:') ? config.frontBg : '',
      backBg: includeImages || !config.backBg.startsWith('data:') ? config.backBg : '',
    };
    return LZString.compressToEncodedURIComponent(JSON.stringify(strippedConfig));
  } catch (error) {
    console.error('Error compressing custom template:', error);
    return '';
  }
}

/**
 * Decompresses a CustomTemplateConfig token.
 */
export function decompressCustomTemplate(token: string): CustomTemplateConfig | null {
  if (!token) return null;
  try {
    const decoded = decodeURIComponent(token);
    const decompressed = LZString.decompressFromEncodedURIComponent(decoded) || 
                         LZString.decompressFromEncodedURIComponent(token.replace(/ /g, '+'));
    if (decompressed) {
      return JSON.parse(decompressed) as CustomTemplateConfig;
    }
  } catch (error) {
    console.error('Error decompressing custom template:', error);
  }
  return null;
}

// Abbreviation mapping to minimize JSON footprint in the URL
interface CompactPayload {
  n: string;     // name
  id: string;    // idNumber
  s: string;     // school
  r: string;     // role
  g: string;     // grade
  e: string;     // email
  p: string;     // phone
  b: string;     // bloodGroup
  idate: string; // issueDate
  edate: string; // expiryDate
  t: string;     // template
  c: string;     // colorTheme
  a: string;     // avatar
  sig: string;   // signature
  o?: 'l' | 'p'; // orientation
  ctc?: string;  // customTemplateConfig
  sl?: string;   // schoolLogo
}

/**
 * Compresses StudentData into a URL-safe Base64 token
 */
export function compressStudentData(data: StudentData): string {
  try {
    const compact: CompactPayload = {
      n: data.name,
      id: data.idNumber,
      s: data.school,
      r: data.role,
      g: data.grade,
      e: data.email,
      p: data.phone,
      b: data.bloodGroup,
      idate: data.issueDate,
      edate: data.expiryDate,
      t: data.template,
      c: data.colorTheme,
      a: data.avatar,
      sig: data.signature,
      o: data.orientation === 'portrait' ? 'p' : 'l',
      ctc: data.customTemplateConfig,
      sl: data.schoolLogo,
    };
    const jsonStr = JSON.stringify(compact);
    return LZString.compressToEncodedURIComponent(jsonStr);
  } catch (error) {
    console.error('Error compressing student data:', error);
    return '';
  }
}

/**
 * Decompresses a URL-safe Base64 token back into StudentData
 */
/**
 * Decompresses a URL-safe Base64 token back into StudentData.
 * Implements highly robust fallback decoders to handle Next.js routing variations
 * where special URL characters (like '+') may be decoded into spaces (' ') or double-escaped.
 */
export function decompressStudentData(token: string): StudentData | null {
  if (!token) return null;
  
  // 1. Attempt standard URL decoding if Next.js didn't decode it already
  let decodedToken = token;
  try {
    decodedToken = decodeURIComponent(token);
  } catch (e) {
    // Fallback: keep original token if decoding fails
  }

  // 2. Define multiple reconstruction routines.
  // Next.js page params decode '+' to ' ' (space) in certain server environments.
  // We try standard, spaces replaced to '+', and standard base64 decoding as fallbacks.
  const decodeAttempts = [
    (t: string) => LZString.decompressFromEncodedURIComponent(t),
    (t: string) => LZString.decompressFromEncodedURIComponent(t.replace(/ /g, '+')),
    (t: string) => LZString.decompressFromEncodedURIComponent(t.replace(/_/g, '/').replace(/-/g, '+')),
    (t: string) => LZString.decompress(t),
  ];

  for (const decompressor of decodeAttempts) {
    try {
      const jsonStr = decompressor(decodedToken);
      if (jsonStr) {
        const compact = JSON.parse(jsonStr) as CompactPayload;
        
        // Verify this matches a valid CompactPayload shape
        if (compact && (compact.n !== undefined || compact.s !== undefined)) {
          return {
            name: compact.n || '',
            idNumber: compact.id || '',
            school: compact.s || '',
            role: compact.r || 'STUDENT',
            grade: compact.g || '',
            email: compact.e || '',
            phone: compact.p || '',
            bloodGroup: compact.b || '',
            issueDate: compact.idate || '',
            expiryDate: compact.edate || '',
            template: compact.t || 'cbse-portrait',
            colorTheme: compact.c || '#ffffff',
            avatar: compact.a || '',
            signature: compact.sig || '',
            schoolLogo: compact.sl || '',
            orientation: compact.o === 'p' ? 'portrait' : 'landscape',
            customTemplateConfig: compact.ctc || '',
          };
        }
      }
    } catch (err) {
      // Silently try next fallback method
    }
  }

  // Final fallback: try raw un-decoded token in case decodeURIComponent broke it
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(token.replace(/ /g, '+'));
    if (jsonStr) {
      const compact = JSON.parse(jsonStr) as CompactPayload;
      if (compact && (compact.n !== undefined || compact.s !== undefined)) {
        return {
          name: compact.n || '',
          idNumber: compact.id || '',
          school: compact.s || '',
          role: compact.r || 'STUDENT',
          grade: compact.g || '',
          email: compact.e || '',
          phone: compact.p || '',
          bloodGroup: compact.b || '',
          issueDate: compact.idate || '',
          expiryDate: compact.edate || '',
          template: compact.t || 'cbse-portrait',
          colorTheme: compact.c || '#ffffff',
          avatar: compact.a || '',
          signature: compact.sig || '',
          schoolLogo: compact.sl || '',
          orientation: compact.o === 'p' ? 'portrait' : 'landscape',
          customTemplateConfig: compact.ctc || '',
        };
      }
    }
  } catch (err) {
    // All decoders failed
  }

  console.error('All decompressors failed for token length:', token.length);
  return null;
}

/**
 * Utility to downscale images using HTML Canvas before encoding
 * to keep base64 strings under a target size (e.g. 96x96 or 120x120 px)
 */
export function resizeAndCompressImage(
  dataUrl: string,
  maxWidth = 120,
  maxHeight = 120,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!dataUrl) return resolve('');
    // If it's not a data URL (e.g. a preset avatar ID like "avatar-1"), return as is
    if (!dataUrl.startsWith('data:')) return resolve(dataUrl);

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context'));

      ctx.drawImage(img, 0, 0, width, height);
      // Export as highly compressed JPEG or WebP
      const outputType = dataUrl.includes('image/png') ? 'image/png' : 'image/jpeg';
      const compressedDataUrl = canvas.toDataURL(outputType, quality);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => reject(err);
  });
}
