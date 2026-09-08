import { jsPDF } from 'jspdf';
import { PhotoItem } from '../types';

export interface PdfGeneratorOptions {
  quality: 'original' | 'compressed';
  pageSize: 'A4' | 'Original';
  includeHeader: boolean;
  includeFooterNumbers: boolean;
  subjectName: string;
  lectureTitle: string;
}

export async function generateLecturePdf(
  photos: PhotoItem[],
  options: PdfGeneratorOptions,
  onProgress?: (progressPercent: number) => void
): Promise<{ pdfBlob: Blob; dataUrl: string; fileName: string }> {
  if (photos.length === 0) {
    throw new Error('لا توجد صور لتوليد الـ PDF');
  }

  // Wait for Cairo Arabic font to be ready
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font wait errors
    }
  }

  // Preserve photos order as passed by caller (caller handles sequential lecture order)
  const sortedPhotos = [...photos];

  // Initialize jsPDF doc
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const totalPages = sortedPhotos.length;

  for (let i = 0; i < sortedPhotos.length; i++) {
    if (i > 0) {
      doc.addPage('a4', 'portrait');
    }

    const photo = sortedPhotos[i];
    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalPages) * 100));
    }

    // Load image element to inspect aspect ratio
    const imgProps = await new Promise<{ width: number; height: number; dataUrl: string }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height, dataUrl: photo.dataUrl });
      };
      img.onerror = () => reject(new Error(`خطأ في تحميل الصورة رقم ${photo.indexNumber}`));
      img.src = photo.dataUrl;
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm

    // Header space (18mm top margin)
    const headerOffset = options.includeHeader ? 16 : 6;
    const footerOffset = options.includeFooterNumbers ? 12 : 6;
    const availableWidth = pageWidth - 12; // 6mm side margins
    const availableHeight = pageHeight - headerOffset - footerOffset;

    // Calculate fitted dimensions preserving aspect ratio
    const imgAspect = imgProps.width / imgProps.height;
    let renderWidth = availableWidth;
    let renderHeight = renderWidth / imgAspect;

    if (renderHeight > availableHeight) {
      renderHeight = availableHeight;
      renderWidth = renderHeight * imgAspect;
    }

    const xPos = (pageWidth - renderWidth) / 2;
    const yPos = headerOffset + (availableHeight - renderHeight) / 2;

    // Direct Raw Image Embedding (Passthrough original colors, contrast, and brightness 100%)
    const imageToEmbed = imgProps.dataUrl;
    const formatMatch = imageToEmbed.match(/^data:image\/(png|jpeg|jpg|webp);base64,/i);
    const imgFormat = formatMatch
      ? (formatMatch[1].toUpperCase() === 'JPG' ? 'JPEG' : formatMatch[1].toUpperCase())
      : 'JPEG';

    doc.addImage(imageToEmbed, imgFormat, xPos, yPos, renderWidth, renderHeight, undefined, 'FAST');

    // Draw Header (Rendered via High-Res Canvas with native Arabic/Cairo font shaping)
    if (options.includeHeader) {
      const pageLectureTitle = (photo as any).lectureTitle || options.lectureTitle;
      const headerPng = renderHeaderCanvas(options.subjectName, pageLectureTitle, pageWidth, 16);
      if (headerPng) {
        doc.addImage(headerPng, 'PNG', 0, 0, pageWidth, 16, undefined, 'FAST');
      }
    }

    // Draw Footer (Rendered via High-Res Canvas with native Arabic/Cairo font shaping)
    if (options.includeFooterNumbers) {
      const footerPng = renderFooterCanvas(i + 1, totalPages, pageWidth, 10);
      if (footerPng) {
        doc.addImage(footerPng, 'PNG', 0, pageHeight - 10, pageWidth, 10, undefined, 'FAST');
      }
    }
  }

  const pdfOutput = doc.output('blob');
  const dataUrl = doc.output('datauristring');
  const sanitizedTitle = options.lectureTitle.replace(/[/\\?%*:|"<>]/g, '_');
  const fileName = `${options.subjectName}_${sanitizedTitle}.pdf`;

  return { pdfBlob: pdfOutput, dataUrl, fileName };
}

function renderHeaderCanvas(
  subjectName: string,
  lectureTitle: string,
  pageWidthMm: number,
  headerHeightMm: number
): string {
  const canvas = document.createElement('canvas');
  const scale = 3; // 300+ DPI crispness
  canvas.width = Math.round(pageWidthMm * 10 * scale);
  canvas.height = Math.round(headerHeightMm * 10 * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);

  const w = pageWidthMm * 10;
  const h = headerHeightMm * 10;

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // Title Text
  ctx.font = 'bold 36px "Cairo", "Tajawal", "Arial", sans-serif';
  ctx.fillStyle = '#0F172A'; // Deep Navy

  const headerText = `${subjectName} - ${lectureTitle}`;
  ctx.fillText(headerText, w - 100, h / 2 - 12);

  // Gold Line Separator
  ctx.strokeStyle = '#D4AF37'; // Gold Accent
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(100, h - 12);
  ctx.lineTo(w - 100, h - 12);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

function renderFooterCanvas(
  currentPage: number,
  totalPages: number,
  pageWidthMm: number,
  footerHeightMm: number
): string {
  const canvas = document.createElement('canvas');
  const scale = 3;
  canvas.width = Math.round(pageWidthMm * 10 * scale);
  canvas.height = Math.round(footerHeightMm * 10 * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);

  const w = pageWidthMm * 10;
  const h = footerHeightMm * 10;

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '600 28px "Cairo", "Tajawal", "Arial", sans-serif';
  ctx.fillStyle = '#64748B'; // Slate 500

  const footerText = `صفحة ${currentPage} من ${totalPages}`;
  ctx.fillText(footerText, w / 2, h / 2);

  return canvas.toDataURL('image/png');
}

function compressForPdf(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1200;
      let w = img.width;
      let h = img.height;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

