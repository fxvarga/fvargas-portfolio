import { PDFDocument, rgb, PDFPage, PDFFont, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { BookProject, BookPage, CoverConfig } from '@/types';

import robotoRegularUrl from '@/assets/fonts/Roboto-Regular.ttf?url';
import robotoBoldUrl from '@/assets/fonts/Roboto-Bold.ttf?url';

/* ── Font loading (embedded for Lulu compliance) ─────────── */

let _fontCache: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;

async function loadFontBytes(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
  if (_fontCache) return _fontCache;
  const [regular, bold] = await Promise.all([
    fetch(robotoRegularUrl).then(r => r.arrayBuffer()),
    fetch(robotoBoldUrl).then(r => r.arrayBuffer()),
  ]);
  _fontCache = { regular, bold };
  return _fontCache;
}

/* ── Trim sizes (in points, 72pt = 1 inch) ─────────────── */

interface TrimSize {
  widthPt: number;
  heightPt: number;
}

const TRIM_SIZES: Record<string, TrimSize> = {
  'print-softcover':  { widthPt: 6 * 72, heightPt: 9 * 72 },       // 6x9
  'print-hardcover':  { widthPt: 8.5 * 72, heightPt: 8.5 * 72 },   // 8.5x8.5
  'print-premium':    { widthPt: 8.5 * 72, heightPt: 11 * 72 },     // 8.5x11
};

const BLEED = 0.125 * 72; // 0.125" bleed on all sides
const MARGIN = 0.5 * 72;  // 0.5" safe margin

/* ── Cover theme colors ─────────────────────────────────── */

const COVER_THEMES: Record<string, { bg: [number, number, number]; text: [number, number, number]; accent: [number, number, number] }> = {
  classic:  { bg: [0.984, 0.969, 0.957], text: [0.239, 0.173, 0.180], accent: [0.561, 0.725, 0.588] },
  pastel:   { bg: [1, 0.965, 0.976],     text: [0.239, 0.173, 0.180], accent: [0.910, 0.627, 0.749] },
  playful:  { bg: [1, 0.980, 0.941],     text: [0.239, 0.173, 0.180], accent: [0.910, 0.643, 0.290] },
};

/* ── Data URL → Uint8Array helper ───────────────────────── */

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function isJpeg(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg');
}

/* ── Embed image (JPEG or PNG) ──────────────────────────── */

async function embedImage(doc: PDFDocument, dataUrl: string) {
  const bytes = dataUrlToBytes(dataUrl);
  if (isJpeg(dataUrl)) {
    return doc.embedJpg(bytes);
  }
  return doc.embedPng(bytes);
}

/* ── Draw image scaled to fit within a box ──────────────── */

function drawImageFit(
  page: PDFPage,
  img: Awaited<ReturnType<typeof embedImage>>,
  x: number, y: number, maxW: number, maxH: number,
) {
  const imgAspect = img.width / img.height;
  const boxAspect = maxW / maxH;
  let w: number, h: number;
  if (imgAspect > boxAspect) {
    w = maxW;
    h = maxW / imgAspect;
  } else {
    h = maxH;
    w = maxH * imgAspect;
  }
  const offsetX = x + (maxW - w) / 2;
  const offsetY = y + (maxH - h) / 2;
  page.drawImage(img, { x: offsetX, y: offsetY, width: w, height: h });
}

/* ── Draw image to fill (cover crop) ────────────────────── */

function drawImageCover(
  page: PDFPage,
  img: Awaited<ReturnType<typeof embedImage>>,
  x: number, y: number, w: number, h: number,
) {
  // Scale to cover the box, then clip is not supported in pdf-lib,
  // so we just scale to fill (slight overflow is ok for print bleed)
  const imgAspect = img.width / img.height;
  const boxAspect = w / h;
  let dw: number, dh: number;
  if (imgAspect > boxAspect) {
    dh = h;
    dw = h * imgAspect;
  } else {
    dw = w;
    dh = w / imgAspect;
  }
  const offsetX = x + (w - dw) / 2;
  const offsetY = y + (h - dh) / 2;
  page.drawImage(img, { x: offsetX, y: offsetY, width: dw, height: dh });
}

/* ── Generate interior PDF ──────────────────────────────── */

export async function generateInteriorPdf(project: BookProject): Promise<Uint8Array> {
  const sku = project.skuSlug ?? 'print-softcover';
  const trim = TRIM_SIZES[sku] ?? TRIM_SIZES['print-softcover'];
  const pageW = trim.widthPt + BLEED * 2;
  const pageH = trim.heightPt + BLEED * 2;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = await loadFontBytes();
  const font = await doc.embedFont(fonts.regular);
  const fontBold = await doc.embedFont(fonts.bold);

  for (const bookPage of project.pages) {
    const pdfPage = doc.addPage([pageW, pageH]);
    // White background
    pdfPage.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: rgb(1, 1, 1) });

    await renderPageTemplate(doc, pdfPage, bookPage, pageW, pageH, font, fontBold);
  }

  // Lulu requires even page count (content pages)
  if (doc.getPageCount() % 2 !== 0) {
    const blankPage = doc.addPage([pageW, pageH]);
    blankPage.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: rgb(1, 1, 1) });
  }

  return doc.save();
}

/* ── Render individual page templates ───────────────────── */

async function renderPageTemplate(
  doc: PDFDocument,
  page: PDFPage,
  bookPage: BookPage,
  w: number,
  h: number,
  font: PDFFont,
  fontBold: PDFFont,
) {
  const items = bookPage.items;
  const safeX = BLEED + MARGIN;
  const safeY = BLEED + MARGIN;
  const safeW = w - 2 * (BLEED + MARGIN);
  const safeH = h - 2 * (BLEED + MARGIN);

  switch (bookPage.templateId) {
    case 'full-bleed': {
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCover(page, img, 0, 0, w, h);
      }
      // Caption at bottom
      if (items[0]?.title) {
        page.drawRectangle({ x: 0, y: 0, width: w, height: 40, color: rgb(0, 0, 0), opacity: 0.5 });
        page.drawText(items[0].title, { x: BLEED + 12, y: 14, size: 11, font: fontBold, color: rgb(1, 1, 1) });
      }
      break;
    }

    case 'photo-text': {
      const photoH = safeH * 0.6;
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageFit(page, img, safeX, safeY + safeH - photoH, safeW, photoH);
      }
      const textY = safeY + safeH - photoH - 20;
      if (items[0]?.title) {
        page.drawText(items[0].title, { x: safeX, y: textY, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
      }
      if (items[0]?.subtitle) {
        page.drawText(items[0].subtitle, { x: safeX, y: textY - 16, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
      }
      if (items[0]?.text) {
        drawWrappedText(page, items[0].text, safeX, textY - 36, safeW, 10, font, rgb(0.3, 0.3, 0.3));
      }
      break;
    }

    case 'two-photo': {
      const gap = 8;
      const halfW = (safeW - gap) / 2;
      for (let i = 0; i < 2; i++) {
        const x = safeX + i * (halfW + gap);
        if (items[i]?.image) {
          const img = await embedImage(doc, items[i].image!);
          drawImageFit(page, img, x, safeY, halfW, safeH);
        } else {
          page.drawRectangle({ x, y: safeY, width: halfW, height: safeH, color: rgb(0.95, 0.95, 0.95) });
        }
      }
      break;
    }

    case 'collage-4': {
      const gap = 6;
      const cellW = (safeW - gap) / 2;
      const cellH = (safeH - gap) / 2;
      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = safeX + col * (cellW + gap);
        const y = safeY + safeH - (row + 1) * cellH - row * gap;
        if (items[i]?.image) {
          const img = await embedImage(doc, items[i].image!);
          drawImageFit(page, img, x, y, cellW, cellH);
        } else {
          page.drawRectangle({ x, y, width: cellW, height: cellH, color: rgb(0.95, 0.95, 0.95) });
        }
      }
      break;
    }

    case 'text-only': {
      let y = safeY + safeH - 20;
      const heading = bookPage.heading || items[0]?.title;
      if (heading) {
        page.drawText(heading, { x: safeX, y, size: 18, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
        y -= 28;
      }
      if (items[0]?.text) {
        drawWrappedText(page, items[0].text, safeX, y, safeW, 11, font, rgb(0.3, 0.3, 0.3));
      }
      break;
    }

    case 'month-title': {
      const heading = bookPage.heading || items[0]?.title || '';
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        const circleR = Math.min(safeW, safeH) * 0.2;
        drawImageFit(page, img, w / 2 - circleR, h / 2, circleR * 2, circleR * 2);
      }
      const textWidth = fontBold.widthOfTextAtSize(heading, 24);
      page.drawText(heading, {
        x: (w - textWidth) / 2,
        y: h / 2 - 20,
        size: 24,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      break;
    }
  }
}

/* ── Generate cover PDF ─────────────────────────────────── */

export async function generateCoverPdf(
  cover: CoverConfig,
  _sku: string,
  coverWidthPt: number,
  coverHeightPt: number,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = await loadFontBytes();
  const page = doc.addPage([coverWidthPt, coverHeightPt]);
  const fontBold = await doc.embedFont(fonts.bold);
  const font = await doc.embedFont(fonts.regular);

  const theme = COVER_THEMES[cover.theme] ?? COVER_THEMES.classic;
  const bgColor = rgb(...theme.bg);
  const textColor = rgb(...theme.text);
  const accentColor = rgb(...theme.accent);

  // Background
  page.drawRectangle({ x: 0, y: 0, width: coverWidthPt, height: coverHeightPt, color: bgColor });

  // Center area (front cover is the right half for a wrap cover)
  const frontX = coverWidthPt / 2;
  const frontW = coverWidthPt / 2;
  const centerX = frontX + frontW / 2;

  // Baby photo circle
  if (cover.photo) {
    try {
      const img = await embedImage(doc, cover.photo);
      const circleR = 60;
      drawImageFit(page, img, centerX - circleR, coverHeightPt * 0.6, circleR * 2, circleR * 2);
    } catch {
      // Skip photo if embed fails
    }
  }

  // Accent line
  const lineW = 100;
  page.drawRectangle({
    x: centerX - lineW / 2,
    y: coverHeightPt * 0.55,
    width: lineW,
    height: 2,
    color: accentColor,
  });

  // Baby name
  const nameSize = 28;
  const nameWidth = fontBold.widthOfTextAtSize(cover.babyName, nameSize);
  page.drawText(cover.babyName, {
    x: centerX - nameWidth / 2,
    y: coverHeightPt * 0.45,
    size: nameSize,
    font: fontBold,
    color: textColor,
  });

  // Subtitle
  const subtitle = `First Year ${cover.year}`;
  const subSize = 14;
  const subWidth = font.widthOfTextAtSize(subtitle, subSize);
  page.drawText(subtitle, {
    x: centerX - subWidth / 2,
    y: coverHeightPt * 0.40,
    size: subSize,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Spine text
  const spineText = `${cover.babyName}'s Memory Book`;
  const spineSize = 8;
  // Spine is at the center line. Rotate text 90 degrees
  page.drawText(spineText, {
    x: coverWidthPt / 2 + 3,
    y: coverHeightPt / 2 - fontBold.widthOfTextAtSize(spineText, spineSize) / 2,
    size: spineSize,
    font: fontBold,
    color: textColor,
    rotate: degrees(90),
  });

  return doc.save();
}

/* ── Text wrapping helper ───────────────────────────────── */

function drawWrappedText(
  page: PDFPage,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  fontSize: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
) {
  const words = text.split(/\s+/);
  let line = '';
  let y = startY;
  const lineHeight = fontSize * 1.4;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && line) {
      page.drawText(line, { x, y, size: fontSize, font, color });
      line = word;
      y -= lineHeight;
      if (y < BLEED + MARGIN) break; // Don't write outside safe area
    } else {
      line = testLine;
    }
  }
  if (line && y >= BLEED + MARGIN) {
    page.drawText(line, { x, y, size: fontSize, font, color });
  }
}

/* ── DPI check helper ───────────────────────────────────── */

export interface DpiWarning {
  pageIndex: number;
  itemTitle: string;
  estimatedDpi: number;
}

export function checkDpiWarnings(project: BookProject): DpiWarning[] {
  const sku = project.skuSlug ?? 'print-softcover';
  const trim = TRIM_SIZES[sku] ?? TRIM_SIZES['print-softcover'];
  const warnings: DpiWarning[] = [];

   // Images are stored at max 2400x2400 px. For full-bleed on an 8.5x11 page, that's ~282 DPI.
  // Lulu recommends 300 DPI but doesn't block lower. We warn below 150 DPI.
  const widthInches = trim.widthPt / 72;
  const heightInches = trim.heightPt / 72;

  project.pages.forEach((page, idx) => {
    for (const item of page.items) {
      if (!item.image) continue;
      // Estimate: compressed images are max 2400px wide
      const estimatedPixels = 2400;
      const dpiW = estimatedPixels / widthInches;
      const dpiH = estimatedPixels / heightInches;
      const effectiveDpi = Math.min(dpiW, dpiH);
      if (effectiveDpi < 150) {
        warnings.push({ pageIndex: idx, itemTitle: item.title, estimatedDpi: Math.round(effectiveDpi) });
      }
    }
  });

  return warnings;
}
