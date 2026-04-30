import {
  PDFDocument, rgb, PDFPage, PDFFont, PDFImage, degrees,
  pushGraphicsState, popGraphicsState, rectangle, clip, endPath,
  concatTransformationMatrix,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import type { BookProject, BookPage, CoverConfig, ImageOffset, DecorationKind } from '@/types';
import { TRIM_SIZES, BLEED, MARGIN, COVER_THEMES, NURSERY, templateScale } from './bookConstants';
import { Decoration, Blob as BlobDeco, type BlobShape } from './Decorations';

import robotoRegularUrl    from '@/assets/fonts/Roboto-Regular.ttf?url';
import robotoBoldUrl       from '@/assets/fonts/Roboto-Bold.ttf?url';
import caveatRegularUrl    from '@/assets/fonts/PatrickHand-Regular.ttf?url';
import caveatBoldUrl       from '@/assets/fonts/PatrickHand-Regular.ttf?url';
import fredokaRegularUrl   from '@/assets/fonts/Fredoka-Regular.ttf?url';
import fredokaSemiBoldUrl  from '@/assets/fonts/Fredoka-SemiBold.ttf?url';
import patrickHandUrl      from '@/assets/fonts/PatrickHand-Regular.ttf?url';

/* ── Font loading ───────────────────────────────────────── */

interface FontSet {
  body:        PDFFont;  // Roboto Regular
  bodyBold:    PDFFont;  // Roboto Bold
  script:      PDFFont;  // Caveat Regular
  scriptBold:  PDFFont;  // Caveat Bold
  display:     PDFFont;  // Fredoka Regular
  displaySemi: PDFFont;  // Fredoka SemiBold
  hand:        PDFFont;  // Patrick Hand
}

let _fontBytesCache: Record<string, ArrayBuffer> | null = null;

async function loadAllFontBytes(): Promise<Record<string, ArrayBuffer>> {
  if (_fontBytesCache) return _fontBytesCache;
  const urls: Record<string, string> = {
    body:        robotoRegularUrl,
    bodyBold:    robotoBoldUrl,
    script:      caveatRegularUrl,
    scriptBold:  caveatBoldUrl,
    display:     fredokaRegularUrl,
    displaySemi: fredokaSemiBoldUrl,
    hand:        patrickHandUrl,
  };
  const entries = await Promise.all(
    Object.entries(urls).map(async ([k, u]) => [k, await fetch(u).then(r => r.arrayBuffer())] as const),
  );
  _fontBytesCache = Object.fromEntries(entries);
  return _fontBytesCache;
}

async function embedFonts(doc: PDFDocument): Promise<FontSet> {
  const bytes = await loadAllFontBytes();
  return {
    body:        await doc.embedFont(bytes.body),
    bodyBold:    await doc.embedFont(bytes.bodyBold),
    script:      await doc.embedFont(bytes.script),
    scriptBold:  await doc.embedFont(bytes.scriptBold),
    display:     await doc.embedFont(bytes.display),
    displaySemi: await doc.embedFont(bytes.displaySemi),
    hand:        await doc.embedFont(bytes.hand),
  };
}

/* ── Image helpers ──────────────────────────────────────── */

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function isJpeg(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg');
}

async function embedImage(doc: PDFDocument, dataUrl: string): Promise<PDFImage> {
  const bytes = dataUrlToBytes(dataUrl);
  return isJpeg(dataUrl) ? doc.embedJpg(bytes) : doc.embedPng(bytes);
}

/** Letterbox-fit (object-fit: contain) — image scaled to fit inside box. */
function drawImageFit(page: PDFPage, img: PDFImage, x: number, y: number, maxW: number, maxH: number) {
  const imgAspect = img.width / img.height;
  const boxAspect = maxW / maxH;
  let w: number, h: number;
  if (imgAspect > boxAspect) { w = maxW; h = maxW / imgAspect; }
  else                       { h = maxH; w = maxH * imgAspect; }
  page.drawImage(img, { x: x + (maxW - w) / 2, y: y + (maxH - h) / 2, width: w, height: h });
}

/** Cover-fit (object-fit: cover) with optional pan/zoom offset and PDF clipping. */
function drawImageCoverClipped(
  page: PDFPage, img: PDFImage,
  x: number, y: number, w: number, h: number,
  offset?: ImageOffset,
) {
  const offX  = offset?.x     ?? 0;
  const offY  = offset?.y     ?? 0;
  const scale = offset?.scale ?? 1;

  const imgAspect = img.width / img.height;
  const boxAspect = w / h;
  let dw: number, dh: number;
  if (imgAspect > boxAspect) { dh = h * scale; dw = dh * imgAspect; }
  else                       { dw = w * scale; dh = dw / imgAspect; }

  const overflowX = dw - w;
  const overflowY = dh - h;
  // Match PageCanvas's object-position math: posX% = 50 + offX
  const drawX = x - overflowX * ((50 + offX) / 100);
  const drawY = y - overflowY * ((50 - offY) / 100); // flip Y for PDF coords

  page.pushOperators(pushGraphicsState(), rectangle(x, y, w, h), clip(), endPath());
  page.drawImage(img, { x: drawX, y: drawY, width: dw, height: dh });
  page.pushOperators(popGraphicsState());
}

/* ── Decoration rasterization (SVG → PNG bytes) ─────────── */

const _decoCache = new Map<string, Uint8Array>();

async function rasterizeDecoration(kind: DecorationKind, color: string, sizePx = 256): Promise<Uint8Array> {
  const cacheKey = `${kind}|${color}|${sizePx}`;
  const hit = _decoCache.get(cacheKey);
  if (hit) return hit;

  const svgString = renderToStaticMarkup(
    createElement(Decoration, { kind, color, size: sizePx, style: { color } }),
  );
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('SVG decode failed'));
      im.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, sizePx, sizePx);
    ctx.drawImage(img, 0, 0, sizePx, sizePx);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
    });
    const bytes = new Uint8Array(await pngBlob.arrayBuffer());
    _decoCache.set(cacheKey, bytes);
    return bytes;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function drawDecoration(
  doc: PDFDocument, page: PDFPage, kind: DecorationKind, color: string,
  x: number, y: number, w: number, h: number, opacity = 1,
) {
  try {
    const bytes = await rasterizeDecoration(kind, color);
    const img = await doc.embedPng(bytes);
    page.drawImage(img, { x, y, width: w, height: h, opacity });
  } catch {
    // Silently skip decoration if SVG rasterization fails (e.g. SSR-only env)
  }
}

/* ── Blob backdrop rasterization (organic shape behind decorations) ───── */

const _blobCache = new Map<string, Uint8Array>();

async function rasterizeBlob(shape: BlobShape, color: string, sizePx = 384): Promise<Uint8Array> {
  const cacheKey = `${shape}|${color}|${sizePx}`;
  const hit = _blobCache.get(cacheKey);
  if (hit) return hit;

  const svgString = renderToStaticMarkup(
    createElement(BlobDeco, { shape, color, size: sizePx, style: { color } }),
  );
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('SVG decode failed'));
      im.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, sizePx, sizePx);
    ctx.drawImage(img, 0, 0, sizePx, sizePx);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
    });
    const bytes = new Uint8Array(await pngBlob.arrayBuffer());
    _blobCache.set(cacheKey, bytes);
    return bytes;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function drawBlob(
  doc: PDFDocument, page: PDFPage, shape: BlobShape, color: string,
  x: number, y: number, w: number, h: number, opacity = 1,
) {
  try {
    const bytes = await rasterizeBlob(shape, color);
    const img = await doc.embedPng(bytes);
    page.drawImage(img, { x, y, width: w, height: h, opacity });
  } catch {
    // Silently skip if rasterization fails
  }
}

/* ── Color helpers ──────────────────────────────────────── */

function hexToRgb(hex: string): ReturnType<typeof rgb> {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

const C = {
  cream:    hexToRgb(NURSERY.cream),
  ivory:    hexToRgb(NURSERY.ivory),
  charcoal: hexToRgb(NURSERY.charcoal),
  pencil:   hexToRgb(NURSERY.pencil),
  whisper:  hexToRgb(NURSERY.whisper),
  pink:     hexToRgb(NURSERY.pink),
  sage:     hexToRgb(NURSERY.sage),
  peach:    hexToRgb(NURSERY.peach),
};

/* ── Text helpers ───────────────────────────────────────── */

// When true, replace all text with gray placeholder bars
const TEXT_PLACEHOLDER_MODE = false;
const PLACEHOLDER_COLOR = rgb(0.82, 0.82, 0.82); // light gray

function drawCenteredText(
  page: PDFPage, text: string, cx: number, y: number,
  size: number, font: PDFFont, color: ReturnType<typeof rgb>,
) {
  const w = font.widthOfTextAtSize(text, size);
  if (TEXT_PLACEHOLDER_MODE) {
    const barH = size * 0.7;
    page.drawRectangle({ x: cx - w / 2, y: y + size * 0.1, width: w, height: barH, color: PLACEHOLDER_COLOR });
    return;
  }
  page.drawText(text, { x: cx - w / 2, y, size, font, color });
}

function drawWrappedText(
  page: PDFPage, text: string,
  x: number, startY: number, maxWidth: number,
  fontSize: number, font: PDFFont, color: ReturnType<typeof rgb>,
  options: { lineHeight?: number; align?: 'left' | 'center'; minY?: number } = {},
) {
  const lineHeight = options.lineHeight ?? fontSize * 1.2;
  const minY = options.minY ?? BLEED + MARGIN;
  const align = options.align ?? 'left';
  const paragraphs = text.split(/\n/);
  let y = startY;
  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(test, fontSize);
      if (w > maxWidth && line) {
        const lineW = font.widthOfTextAtSize(line, fontSize);
        const drawX = align === 'center' ? x + (maxWidth - lineW) / 2 : x;
        if (TEXT_PLACEHOLDER_MODE) {
          const barH = fontSize * 0.7;
          page.drawRectangle({ x: drawX, y: y + fontSize * 0.1, width: lineW, height: barH, color: PLACEHOLDER_COLOR });
        } else {
          page.drawText(line, { x: drawX, y, size: fontSize, font, color });
        }
        y -= lineHeight;
        if (y < minY) return;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      const lineW = font.widthOfTextAtSize(line, fontSize);
      const drawX = align === 'center' ? x + (maxWidth - lineW) / 2 : x;
      if (TEXT_PLACEHOLDER_MODE) {
        const barH = fontSize * 0.7;
        page.drawRectangle({ x: drawX, y: y + fontSize * 0.1, width: lineW, height: barH, color: PLACEHOLDER_COLOR });
      } else {
        page.drawText(line, { x: drawX, y, size: fontSize, font, color });
      }
      y -= lineHeight;
      if (y < minY) return;
    }
  }
}

function measureWrappedLines(
  text: string, maxWidth: number, fontSize: number, font: PDFFont,
): number {
  const paragraphs = text.split(/\n/);
  let lines = 0;
  for (const para of paragraphs) {
    if (!para.trim()) { lines += 1; continue; }
    const words = para.split(/\s+/);
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, fontSize) > maxWidth && line) {
        lines += 1;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines += 1;
  }
  return Math.max(1, lines);
}

/* ── Generate interior PDF ──────────────────────────────── */

export async function generateInteriorPdf(project: BookProject): Promise<Uint8Array> {
  const sku = project.skuSlug ?? 'print-softcover';
  const trim = TRIM_SIZES[sku] ?? TRIM_SIZES['print-softcover'];
  const pageW = trim.widthPt + BLEED * 2;
  const pageH = trim.heightPt + BLEED * 2;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = await embedFonts(doc);

  for (const bookPage of project.pages) {
    const pdfPage = doc.addPage([pageW, pageH]);
    // Cream background
    pdfPage.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: C.cream });
    await renderPageTemplate(doc, pdfPage, bookPage, pageW, pageH, fonts, trim.widthPt);
  }

  // Lulu requires even page count
  if (doc.getPageCount() % 2 !== 0) {
    const blankPage = doc.addPage([pageW, pageH]);
    blankPage.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: C.cream });
  }

  return doc.save();
}

/* ── Render individual page templates ───────────────────── */

async function renderPageTemplate(
  doc: PDFDocument, page: PDFPage, bookPage: BookPage,
  w: number, h: number, fonts: FontSet, trimWidthPt: number,
) {
  const items = bookPage.items;
  const safeX = BLEED + MARGIN;
  const safeY = BLEED + MARGIN;
  const safeW = w - 2 * (BLEED + MARGIN);
  const safeH = h - 2 * (BLEED + MARGIN);
  const ts = templateScale(trimWidthPt);

  switch (bookPage.templateId) {

    /* ── New nursery templates ─────────────────────── */

    case 'blank-locked': {
      // Intentionally rendered as a plain cream page (background already drawn
      // by the caller before the switch). No lock icon, no text — matches the
      // auto-pad blank that Lulu adds for even page count.
      break;
    }

    case 'title-stats': {
      // Layout per final_insp/001: 2 photos stacked left half + bib + heading + stats column right
      const heading = (bookPage.heading || 'Hello, Baby!').replace(/^hello,?\s*/i, '').trim() || 'BABY!';

      const gutter = safeW * 0.04;
      const leftW = safeW * 0.46;
      const rightX = safeX + leftW + gutter;
      const rightW = safeW - leftW - gutter;

      // ── Left: 2 photos stacked
      const photoGap = safeH * 0.02;
      const photoH = (safeH - photoGap) / 2;
      for (let i = 0; i < 2; i++) {
        const py = safeY + (1 - i) * (photoH + photoGap);
        if (items[i]?.image) {
          const img = await embedImage(doc, items[i].image!);
          drawImageCoverClipped(page, img, safeX, py, leftW, photoH, items[i].imageOffset);
        } else {
          page.drawRectangle({ x: safeX, y: py, width: leftW, height: photoH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
        }
      }

      // ── Right column
      const rcx = rightX + rightW / 2;
      let cursorY = safeY + safeH;

      // Bib decoration at top
      const bibSize = rightW * 0.42;
      cursorY -= bibSize + safeH * 0.01;
      await drawDecoration(doc, page, 'bib', NURSERY.peach,
        rcx - bibSize / 2, cursorY, bibSize, bibSize, 0.95);

      // "hello," script
      const helloSize = 28 * ts;
      cursorY -= helloSize * 0.6;
      drawCenteredText(page, 'hello,', rcx, cursorY, helloSize, fonts.script, C.pink);

      // Big chunky display name (auto-fit to width)
      const nameText = heading.toUpperCase();
      let nameSize = 44 * ts;
      while (fonts.displaySemi.widthOfTextAtSize(nameText, nameSize) > rightW * 0.95 && nameSize > 14) {
        nameSize -= 1;
      }
      cursorY -= nameSize * 1.05;
      drawCenteredText(page, nameText, rcx, cursorY, nameSize, fonts.displaySemi, C.charcoal);

      // Tiny divider with heart
      const dividerY = cursorY - nameSize * 0.5;
      const dividerHalfW = rightW * 0.30;
      const heartSize = 14 * ts;
      page.drawLine({
        start: { x: rcx - dividerHalfW, y: dividerY }, end: { x: rcx - heartSize / 2 - 2, y: dividerY },
        thickness: 0.6, color: C.sage,
      });
      page.drawLine({
        start: { x: rcx + heartSize / 2 + 2, y: dividerY }, end: { x: rcx + dividerHalfW, y: dividerY },
        thickness: 0.6, color: C.sage,
      });
      await drawDecoration(doc, page, 'hearts', NURSERY.pink,
        rcx - heartSize / 2, dividerY - heartSize / 2, heartSize, heartSize);

      // Stats single column
      const stats = bookPage.stats;
      if (stats) {
        const labels: { key: keyof NonNullable<typeof stats>; label: string }[] = [
          { key: 'birthDate', label: 'BORN' },
          { key: 'birthTime', label: 'TIME' },
          { key: 'weight',    label: 'WEIGHT' },
          { key: 'length',    label: 'LENGTH' },
        ];
        const labelSize = 8 * ts;
        const valueSize = 13 * ts;
        const labelToValue = labelSize * 0.5 + valueSize;
        // Distribute remaining vertical space evenly
        const top = dividerY - heartSize - 12 * ts;
        const bottom = safeY + 4 * ts;
        const rowGap = (top - bottom) / labels.length;
        labels.forEach((s, i) => {
          const ly = top - i * rowGap - labelSize;
          drawCenteredText(page, s.label, rcx, ly, labelSize, fonts.displaySemi, C.pencil);
          drawCenteredText(page, stats[s.key] || '—', rcx, ly - labelToValue, valueSize, fonts.hand, C.charcoal);
        });
      }
      break;
    }

    case 'full-photo': {
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCoverClipped(page, img, 0, 0, w, h, items[0].imageOffset);
      }
      break;
    }

    case 'photo-quote': {
      // Preview: flex-[7] photo (top) + flex-[3] caption (bottom)
      const captionH = h * 0.30;
      const photoH   = h - captionH;
      // Photo top
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCoverClipped(page, img, 0, captionH, w, photoH, items[0].imageOffset);
      }
      // Caption block bottom (cream)
      page.drawRectangle({ x: 0, y: 0, width: w, height: captionH, color: C.cream });
      // Decorations: preview = top-left (12%/6%) + bottom-right (12%/6%) of caption block
      if (bookPage.decoration) {
        const decoSize = w * 0.14;
        // Top-left of caption (PDF y from bottom = captionH - 12% - decoSize)
        await drawDecoration(doc, page, bookPage.decoration, NURSERY.peach,
          w * 0.06, captionH - captionH * 0.12 - decoSize, decoSize, decoSize, 0.85);
        // Bottom-right of caption
        await drawDecoration(doc, page, bookPage.decoration, NURSERY.sage,
          w - w * 0.06 - decoSize, captionH * 0.12, decoSize, decoSize, 0.85);
      }
      // Quote (script) — vertically centered in caption block
      const quote = bookPage.heading || items[0]?.text || items[0]?.title || '';
      if (quote) {
        const fontSize = 28 * ts;
        const lineHeight = fontSize * 1.15;
        const lines = measureWrappedLines(quote, safeW, fontSize, fonts.script);
        // Block height: first line uses full fontSize (cap height ~ fontSize),
        // each additional line adds one lineHeight. Center this block in captionH.
        const blockH = fontSize + (lines - 1) * lineHeight;
        // startY is baseline of FIRST line. Center: captionH/2 + blockH/2 - fontSize.
        const startY = captionH / 2 + blockH / 2 - fontSize;
        drawWrappedText(page, quote, safeX, startY,
          safeW, fontSize, fonts.script, C.charcoal,
          { align: 'center', lineHeight, minY: 8 });
      }
      break;
    }

    case 'two-photo-stack': {
      // Preview: gap-[2%] p-[3%] of safe area
      const pad = safeW * 0.03;
      const gap = safeW * 0.02;
      const innerX = safeX + pad;
      const innerY = safeY + pad;
      const innerW = safeW - 2 * pad;
      const innerH = safeH - 2 * pad;
      const cellH = (innerH - gap) / 2;
      for (let i = 0; i < 2; i++) {
        const cellY = innerY + (1 - i) * (cellH + gap);
        if (items[i]?.image) {
          const img = await embedImage(doc, items[i].image!);
          drawImageCoverClipped(page, img, innerX, cellY, innerW, cellH, items[i].imageOffset);
        } else {
          page.drawRectangle({ x: innerX, y: cellY, width: innerW, height: cellH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
        }
      }
      break;
    }

    case 'grid-4': {
      const pad = safeW * 0.03;
      const gap = safeW * 0.02;
      const innerX = safeX + pad;
      const innerY = safeY + pad;
      const innerW = safeW - 2 * pad;
      const innerH = safeH - 2 * pad;
      const cellW = (innerW - gap) / 2;
      const cellH = (innerH - gap) / 2;
      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = innerX + col * (cellW + gap);
        const y = innerY + (1 - row) * (cellH + gap);
        if (items[i]?.image) {
          const img = await embedImage(doc, items[i].image!);
          drawImageCoverClipped(page, img, x, y, cellW, cellH, items[i].imageOffset);
        } else {
          page.drawRectangle({ x, y, width: cellW, height: cellH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
        }
      }
      break;
    }

    case 'grid-6': {
      const pad = safeW * 0.03;
      const gap = safeW * 0.015;
      const innerX = safeX + pad;
      const innerY = safeY + pad;
      const innerW = safeW - 2 * pad;
      const innerH = safeH - 2 * pad;
      const cellW = (innerW - gap) / 2;
      const cellH = (innerH - 2 * gap) / 3;
      for (let i = 0; i < 6; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = innerX + col * (cellW + gap);
        const y = innerY + (2 - row) * (cellH + gap);
        if (items[i]?.image) {
          const img = await embedImage(doc, items[i].image!);
          drawImageCoverClipped(page, img, x, y, cellW, cellH, items[i].imageOffset);
        } else {
          page.drawRectangle({ x, y, width: cellW, height: cellH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
        }
      }
      break;
    }

    case 'polaroid': {
      // Match preview: 4 polaroids with frames + tilts, positioned via top/left/width %.
      // Scale frame widths down on wider trims so the bottom row doesn't overflow.
      const refAspect = 6 / 9;
      const trimAspect = w / h;
      const fitScale = Math.min(1, refAspect / trimAspect);
      const tilts = [-4, 3, -2, 5];
      const polPos = [
        { topPct: 0.08, leftPct: 0.08, widthPct: 0.42 * fitScale },
        { topPct: 0.12, leftPct: 0.52, widthPct: 0.40 * fitScale },
        { topPct: 0.52, leftPct: 0.06, widthPct: 0.40 * fitScale },
        { topPct: 0.50, leftPct: 0.52, widthPct: 0.42 * fitScale },
      ];
      const frameAspect = 1.18; // height / width (matches preview aspect-ratio: 1 / 1.18)
      // Optional decoration top-right
      if (bookPage.decoration) {
        const dSize = w * 0.18;
        await drawDecoration(doc, page, bookPage.decoration, NURSERY.peach,
          w - dSize - w * 0.04, h - dSize - h * 0.02, dSize, dSize, 0.9);
      }
      for (let i = 0; i < 4; i++) {
        const p = polPos[i];
        const frameW = w * p.widthPct;
        const frameH = frameW * frameAspect;
        const frameX = w * p.leftPct;
        const frameY = h - h * p.topPct - frameH; // PDF origin bottom-left
        const cx = frameX + frameW / 2;
        const cy = frameY + frameH / 2;
        // Photo inset matches preview's padding: 3% 3% 10% 3%
        const padX   = frameW * 0.03;
        const padTop = frameW * 0.03;
        const padBot = frameW * 0.10;
        const photoX = frameX + padX;
        const photoY = frameY + padBot;
        const photoW = frameW - 2 * padX;
        const photoH = frameH - padTop - padBot;
        // Center-rotation: T(cx,cy) * R(θ) * T(-cx,-cy)
        const θ = (tilts[i] * Math.PI) / 180;
        const cos = Math.cos(θ);
        const sin = Math.sin(θ);
        page.pushOperators(
          pushGraphicsState(),
          concatTransformationMatrix(
            cos, sin, -sin, cos,
            cx - cx * cos + cy * sin,
            cy - cx * sin - cy * cos,
          ),
        );
        // Subtle shadow
        page.drawRectangle({
          x: frameX + 1.5, y: frameY - 1.5, width: frameW, height: frameH,
          color: rgb(0.85, 0.82, 0.80), opacity: 0.5,
        });
        // White frame
        page.drawRectangle({
          x: frameX, y: frameY, width: frameW, height: frameH,
          color: rgb(1, 1, 1), borderColor: C.whisper, borderWidth: 0.3,
        });
        // Photo (cover-clipped) — its own clip uses absolute photo rect, which is fine
        // because the rotation matrix is still active in the graphics state.
        if (items[i]?.image) {
          const img = await embedImage(doc, items[i].image!);
          drawImageCoverClipped(page, img, photoX, photoY, photoW, photoH, items[i].imageOffset);
        } else {
          page.drawRectangle({ x: photoX, y: photoY, width: photoW, height: photoH, color: C.ivory });
        }
        page.pushOperators(popGraphicsState());
      }
      break;
    }

    case 'quote-only': {
      const quote = bookPage.heading || items[0]?.text || '';
      // Top decoration: preview width 30%, positioned 14% from top
      if (bookPage.decoration) {
        const dSize = w * 0.30;
        await drawDecoration(doc, page, bookPage.decoration, NURSERY.pink,
          (w - dSize) / 2, h - h * 0.14 - dSize, dSize, dSize);
      }
      if (quote) {
        const fontSize = 44 * ts;
        const lineHeight = fontSize * 1.1;
        const lines = measureWrappedLines(quote, safeW, fontSize, fonts.script);
        const blockH = fontSize + (lines - 1) * lineHeight;
        // Available band sits between bottom decoration top edge and top decoration bottom edge.
        const topDecoBottom  = h - h * 0.14 - w * 0.30;   // matches top decoration positioning
        const botDecoTop     = h * 0.14 + w * 0.24;        // matches bottom decoration positioning
        const bandCenter     = (topDecoBottom + botDecoTop) / 2;
        const startY = bandCenter + blockH / 2 - fontSize;
        drawWrappedText(page, quote, safeX, startY,
          safeW, fontSize, fonts.script, C.charcoal,
          { align: 'center', lineHeight, minY: botDecoTop });
      }
      // Bottom decoration: preview width 24%, positioned 14% from bottom, opacity 0.7
      if (bookPage.decoration) {
        const dSize = w * 0.24;
        await drawDecoration(doc, page, bookPage.decoration, NURSERY.peach,
          (w - dSize) / 2, h * 0.14, dSize, dSize, 0.7);
      }
      break;
    }

    /* ── Mixbook-style memory book templates (round 2e) ─── */

    case 'photo-blob-quote': {
      // Per final_insp/002, 024: centered photo (upper portion) with peach blob
      // accent behind top-right corner, caption text at bottom center.
      const photoW = safeW * 0.72;
      const photoH = safeH * 0.58;
      const photoX = safeX + (safeW - photoW) / 2;
      // Photo sits in upper-center area, offset down slightly from top
      const photoY = safeY + safeH - photoH - safeH * 0.22;

      // Peach blob accent — sits behind photo, overlapping top-right corner
      const blobSize = safeW * 0.32;
      const blobX = photoX + photoW - blobSize * 0.45;
      const blobY = photoY + photoH - blobSize * 0.55;
      await drawBlob(doc, page, bookPage.blobShape ?? 'pebble', NURSERY.peach, blobX, blobY, blobSize, blobSize, 0.85);
      // Decoration on blob
      if (bookPage.decoration) {
        const dSize = blobSize * 0.55;
        await drawDecoration(doc, page, bookPage.decoration, NURSERY.charcoal,
          blobX + (blobSize - dSize) / 2, blobY + (blobSize - dSize) / 2, dSize, dSize);
      }

      // Photo (drawn after blob so it overlaps)
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCoverClipped(page, img, photoX, photoY, photoW, photoH, items[0].imageOffset);
      } else {
        page.drawRectangle({ x: photoX, y: photoY, width: photoW, height: photoH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
      }

      // Caption below photo
      const quote = bookPage.heading || items[0]?.text || '';
      if (quote) {
        const fontSize = 28 * ts;
        const lineHeight = fontSize * 1.15;
        const bandTop = photoY - safeH * 0.03;
        const bandBot = safeY;
        const lines = measureWrappedLines(quote, safeW, fontSize, fonts.script);
        const blockH = fontSize + (lines - 1) * lineHeight;
        const startY = (bandTop + bandBot) / 2 + blockH / 2 - fontSize;
        drawWrappedText(page, quote, safeX, startY, safeW, fontSize, fonts.script, C.charcoal,
          { align: 'center', lineHeight, minY: bandBot });
      }
      break;
    }

    case 'quote-deco-photo-split': {
      // Per final_insp/006, 020: half page = decoration cluster + display+script
      // text; other half = single full-bleed photo (goes to page edge).
      const photoSide: 'left' | 'right' = bookPage.photoSide ?? 'right';
      const halfW = w * 0.50;
      const photoX = photoSide === 'right' ? w - halfW : 0;
      const textX  = photoSide === 'right' ? safeX : safeX + safeW - (safeW * 0.46);
      const textW  = safeW * 0.46;

      // Photo — full bleed on its side
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCoverClipped(page, img, photoX, 0, halfW, h, items[0].imageOffset);
      } else {
        page.drawRectangle({ x: photoX, y: 0, width: halfW, height: h, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
      }

      // Text half — decoration cluster on top, then big display + script below
      const tcx = textX + textW / 2;
      let cursorY = safeY + safeH * 0.78;

      if (bookPage.decoration) {
        const dSize = textW * 0.42;
        cursorY -= dSize;
        await drawDecoration(doc, page, bookPage.decoration, NURSERY.pink,
          tcx - dSize / 2, cursorY, dSize, dSize, 0.95);
      }

      // Split heading: first part = display caps, last word = script accent
      const heading = bookPage.heading || 'LOVE YOU\nso much!';
      const parts = heading.split('\n');
      const displayText = (parts[0] || '').toUpperCase();
      const scriptText = parts[1] || '';

      let displaySize = 38 * ts;
      while (fonts.displaySemi.widthOfTextAtSize(displayText, displaySize) > textW * 0.92 && displaySize > 12) {
        displaySize -= 1;
      }
      cursorY -= displaySize * 1.1 + safeH * 0.04;
      drawCenteredText(page, displayText, tcx, cursorY, displaySize, fonts.displaySemi, C.charcoal);

      if (scriptText) {
        const scriptSize = 32 * ts;
        cursorY -= scriptSize * 1.1;
        drawCenteredText(page, scriptText, tcx, cursorY, scriptSize, fonts.script, C.pink);
      }
      break;
    }

    case 'grid-5-asym': {
      // Per final_insp/003, 004, 028: 3 small left + 2 large right.
      // Full bleed — photos go to page edges, only thin gap between them.
      const ga5 = 6; // thin gap between photos
      const leftW5 = (w - ga5) * 0.42;
      const rightW5 = w - ga5 - leftW5;

      // Left: 3 stacked
      const leftCellH5 = (h - 2 * ga5) / 3;
      for (let i = 0; i < 3; i++) {
        const cy = h - (i + 1) * leftCellH5 - i * ga5;
        if (items[i]?.image) {
          const img = await embedImage(doc, items[i].image!);
          drawImageCoverClipped(page, img, 0, cy, leftW5, leftCellH5, items[i].imageOffset);
        } else {
          page.drawRectangle({ x: 0, y: cy, width: leftW5, height: leftCellH5, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
        }
      }
      // Right: 2 stacked larger
      const rightCellH5 = (h - ga5) / 2;
      const rightX5 = leftW5 + ga5;
      for (let i = 0; i < 2; i++) {
        const cy = h - (i + 1) * rightCellH5 - i * ga5;
        const idx = 3 + i;
        if (items[idx]?.image) {
          const img = await embedImage(doc, items[idx].image!);
          drawImageCoverClipped(page, img, rightX5, cy, rightW5, rightCellH5, items[idx].imageOffset);
        } else {
          page.drawRectangle({ x: rightX5, y: cy, width: rightW5, height: rightCellH5, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
        }
      }
      break;
    }

    case 'grid-9-deco-center': {
      // Per final_insp/010: 3×3 grid where center cell = decoration on arch blob.
      const pad = safeW * 0.02;
      const gap = safeW * 0.012;
      const innerX = safeX + pad;
      const innerY = safeY + pad;
      const innerW = safeW - 2 * pad;
      const innerH = safeH - 2 * pad;
      const cellW = (innerW - 2 * gap) / 3;
      const cellH = (innerH - 2 * gap) / 3;
      let photoIdx = 0;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const cx = innerX + col * (cellW + gap);
          const cy = innerY + (2 - row) * (cellH + gap);
          if (row === 1 && col === 1) {
            // Decoration on arch blob (center cell)
            await drawBlob(doc, page, 'arch', NURSERY.peach, cx, cy, cellW, cellH, 0.9);
            if (bookPage.decoration) {
              const dSize = Math.min(cellW, cellH) * 0.65;
              await drawDecoration(doc, page, bookPage.decoration, NURSERY.charcoal,
                cx + (cellW - dSize) / 2, cy + (cellH - dSize) / 2, dSize, dSize);
            }
          } else {
            if (items[photoIdx]?.image) {
              const img = await embedImage(doc, items[photoIdx].image!);
              drawImageCoverClipped(page, img, cx, cy, cellW, cellH, items[photoIdx].imageOffset);
            } else {
              page.drawRectangle({ x: cx, y: cy, width: cellW, height: cellH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
            }
            photoIdx++;
          }
        }
      }
      break;
    }

    case 'grid-deco-corner': {
      // Per final_insp/007, 015, 022: 4-grid where one cell = decoration on blob.
      // Photos go to full bleed (no padding).
      const gap_dc = w * 0.012;
      const cellW_dc = (w - gap_dc) / 2;
      const cellH_dc = (h - gap_dc) / 2;
      const decoCorner = bookPage.decoCorner ?? 3; // 0=TL,1=TR,2=BL,3=BR (visual rows)
      let photoIdx = 0;
      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = col * (cellW_dc + gap_dc);
        const cy = (1 - row) * (cellH_dc + gap_dc);
        if (i === decoCorner) {
          const blobShape = bookPage.blobShape ?? 'pebble';
          await drawBlob(doc, page, blobShape, NURSERY.peach, cx, cy, cellW_dc, cellH_dc, 0.9);
          if (bookPage.decoration) {
            const dSize = Math.min(cellW_dc, cellH_dc) * 0.6;
            await drawDecoration(doc, page, bookPage.decoration, NURSERY.charcoal,
              cx + (cellW_dc - dSize) / 2, cy + (cellH_dc - dSize) / 2, dSize, dSize);
          }
        } else {
          if (items[photoIdx]?.image) {
            const img = await embedImage(doc, items[photoIdx].image!);
            drawImageCoverClipped(page, img, cx, cy, cellW_dc, cellH_dc, items[photoIdx].imageOffset);
          } else {
            page.drawRectangle({ x: cx, y: cy, width: cellW_dc, height: cellH_dc, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
          }
          photoIdx++;
        }
      }
      break;
    }

    case 'quote-deco-grid-3': {
      // Per final_insp/013, 011: deco+quote in left half + 3 photos right (1 large top + 2 small bottom).
      const pad = safeW * 0.02;
      const gap = safeW * 0.015;
      const innerX = safeX + pad;
      const innerY = safeY + pad;
      const innerW = safeW - 2 * pad;
      const innerH = safeH - 2 * pad;
      const halfW = (innerW - gap) / 2;

      // Left half: deco + quote
      const lcx = innerX + halfW / 2;
      let cursorY = innerY + innerH * 0.78;
      if (bookPage.decoration) {
        const dSize = halfW * 0.50;
        cursorY -= dSize;
        await drawDecoration(doc, page, bookPage.decoration, NURSERY.pink,
          lcx - dSize / 2, cursorY, dSize, dSize, 0.95);
      }
      const quote = bookPage.heading || '';
      if (quote) {
        const fontSize = 26 * ts;
        const lineHeight = fontSize * 1.15;
        cursorY -= fontSize * 1.5;
        drawWrappedText(page, quote, innerX, cursorY, halfW, fontSize, fonts.script, C.charcoal,
          { align: 'center', lineHeight, minY: innerY });
      }

      // Right half: 1 large top + 2 small bottom
      const rightX = innerX + halfW + gap;
      const topH = (innerH - gap) * 0.55;
      const botH = innerH - gap - topH;
      const botCellW = (halfW - gap) / 2;
      // Top large
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image!);
        drawImageCoverClipped(page, img, rightX, innerY + botH + gap, halfW, topH, items[0].imageOffset);
      } else {
        page.drawRectangle({ x: rightX, y: innerY + botH + gap, width: halfW, height: topH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
      }
      // Bottom 2
      for (let i = 0; i < 2; i++) {
        const bx = rightX + i * (botCellW + gap);
        const idx = 1 + i;
        if (items[idx]?.image) {
          const img = await embedImage(doc, items[idx].image!);
          drawImageCoverClipped(page, img, bx, innerY, botCellW, botH, items[idx].imageOffset);
        } else {
          page.drawRectangle({ x: bx, y: innerY, width: botCellW, height: botH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
        }
      }
      break;
    }

    case 'photo-sparkle': {
      // Per final_insp/008: single photo centered/offset with sparkle scatter decorations
      const photoW = safeW * 0.75;
      const photoH = safeH * 0.70;
      const photoX = safeX + safeW * 0.02;
      const photoY = safeY + safeH - photoH - safeH * 0.02;
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCoverClipped(page, img, photoX, photoY, photoW, photoH, items[0].imageOffset);
      } else {
        page.drawRectangle({ x: photoX, y: photoY, width: photoW, height: photoH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
      }
      // Sparkle clusters bottom-right
      const sparkSize = safeW * 0.22;
      await drawDecoration(doc, page, 'sparkles', NURSERY.charcoal,
        safeX + safeW - sparkSize - safeW * 0.04, safeY + safeH * 0.04, sparkSize, sparkSize, 0.9);
      break;
    }

    case 'grid-3-deco-text': {
      // Per final_insp/009: 2×2 grid where one cell = deco + text (rainbow + "sweet dreams LITTLE ONE")
      const pad = safeW * 0.02;
      const gap = safeW * 0.015;
      const innerX = safeX + pad;
      const innerY = safeY + pad;
      const innerW = safeW - 2 * pad;
      const innerH = safeH - 2 * pad;
      const cellW = (innerW - gap) / 2;
      const cellH = (innerH - gap) / 2;
      const dtCorner = bookPage.decoCorner ?? 3; // which cell gets deco+text
      let photoIdx = 0;
      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = innerX + col * (cellW + gap);
        const cy = innerY + (1 - row) * (cellH + gap);
        if (i === dtCorner) {
          // Deco + text cell
          if (bookPage.decoration) {
            const dSize = Math.min(cellW, cellH) * 0.50;
            await drawDecoration(doc, page, bookPage.decoration, NURSERY.charcoal,
              cx + (cellW - dSize) / 2, cy + cellH * 0.35, dSize, dSize);
          }
          // Text would go below deco — skipped for now (HIDE_TEXT)
        } else {
          if (items[photoIdx]?.image) {
            const img = await embedImage(doc, items[photoIdx].image!);
            drawImageCoverClipped(page, img, cx, cy, cellW, cellH, items[photoIdx].imageOffset);
          } else {
            page.drawRectangle({ x: cx, y: cy, width: cellW, height: cellH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
          }
          photoIdx++;
        }
      }
      break;
    }

    case 'two-photo-text': {
      // Per final_insp/013: wide photo top spanning full width, smaller photo bottom-right, text bottom-left
      const gap_tp = w * 0.012;
      const topH_tp = h * 0.52;
      const botH_tp = h - topH_tp - gap_tp;
      const botHalfW = (w - gap_tp) / 2;
      // Top wide photo (full bleed width)
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCoverClipped(page, img, 0, botH_tp + gap_tp, w, topH_tp, items[0].imageOffset);
      } else {
        page.drawRectangle({ x: 0, y: botH_tp + gap_tp, width: w, height: topH_tp, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
      }
      // Bottom-right photo
      const photoSideTP: 'left' | 'right' = bookPage.photoSide ?? 'right';
      const botPhotoX = photoSideTP === 'right' ? botHalfW + gap_tp : 0;
      if (items[1]?.image) {
        const img = await embedImage(doc, items[1].image);
        drawImageCoverClipped(page, img, botPhotoX, 0, botHalfW, botH_tp, items[1].imageOffset);
      } else {
        page.drawRectangle({ x: botPhotoX, y: 0, width: botHalfW, height: botH_tp, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
      }
      // Text bottom-left — skipped for now (HIDE_TEXT)
      break;
    }

    case 'grid-1big-2small-deco': {
      // Per final_insp/017, 023: 1 big photo left + 2 small right + deco in one corner
      const pad = safeW * 0.02;
      const gap = safeW * 0.015;
      const innerX = safeX + pad;
      const innerY = safeY + pad;
      const innerW = safeW - 2 * pad;
      const innerH = safeH - 2 * pad;
      const bigW = innerW * 0.55;
      const smallW = innerW - bigW - gap;
      const smallH = (innerH - 2 * gap) / 3;
      const bigX = innerX;
      const rightX = innerX + bigW + gap;
      // Big photo left (full height)
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCoverClipped(page, img, bigX, innerY, bigW, innerH, items[0].imageOffset);
      } else {
        page.drawRectangle({ x: bigX, y: innerY, width: bigW, height: innerH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
      }
      // 2 small photos right (top 2 cells) + deco in bottom-right
      for (let i = 0; i < 2; i++) {
        const cy = innerY + (2 - i) * (smallH + gap);
        const idx = 1 + i;
        if (items[idx]?.image) {
          const img = await embedImage(doc, items[idx].image!);
          drawImageCoverClipped(page, img, rightX, cy, smallW, smallH, items[idx].imageOffset);
        } else {
          page.drawRectangle({ x: rightX, y: cy, width: smallW, height: smallH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
        }
      }
      // Deco in bottom-right cell
      const decoY = innerY;
      const blobShape = bookPage.blobShape ?? 'pebble';
      await drawBlob(doc, page, blobShape, NURSERY.peach, rightX, decoY, smallW, smallH, 0.9);
      if (bookPage.decoration) {
        const dSize = Math.min(smallW, smallH) * 0.6;
        await drawDecoration(doc, page, bookPage.decoration, NURSERY.charcoal,
          rightX + (smallW - dSize) / 2, decoY + (smallH - dSize) / 2, dSize, dSize);
      }
      break;
    }

    case 'photo-1big-2small-text': {
      // Per final_insp/018: 1 big photo left + 2 small right + text bottom-left
      const pad = safeW * 0.02;
      const gap = safeW * 0.015;
      const innerX = safeX + pad;
      const innerY = safeY + pad;
      const innerW = safeW - 2 * pad;
      const innerH = safeH - 2 * pad;
      const topH = innerH * 0.55;
      const botH = innerH - topH - gap;
      // Big photo top-left (spans ~60% width)
      const bigW = innerW * 0.58;
      const smallW = (innerW - bigW - gap);
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCoverClipped(page, img, innerX, innerY + botH + gap, bigW, topH, items[0].imageOffset);
      } else {
        page.drawRectangle({ x: innerX, y: innerY + botH + gap, width: bigW, height: topH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
      }
      // 2 small photos right column
      const rightX = innerX + bigW + gap;
      const smallCellH = (innerH - gap) / 2;
      for (let i = 0; i < 2; i++) {
        const cy = innerY + (1 - i) * (smallCellH + gap);
        const idx = 1 + i;
        if (items[idx]?.image) {
          const img = await embedImage(doc, items[idx].image!);
          drawImageCoverClipped(page, img, rightX, cy, smallW, smallCellH, items[idx].imageOffset);
        } else {
          page.drawRectangle({ x: rightX, y: cy, width: smallW, height: smallCellH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
        }
      }
      // Text bottom-left — skipped for now (HIDE_TEXT)
      break;
    }

    case 'grid-3-top-bottom': {
      // Per final_insp/025: 1 large photo spanning full width top, 2 small bottom
      const pad = safeW * 0.02;
      const gap = safeW * 0.015;
      const innerX = safeX + pad;
      const innerY = safeY + pad;
      const innerW = safeW - 2 * pad;
      const innerH = safeH - 2 * pad;
      const topH = innerH * 0.58;
      const botH = innerH - topH - gap;
      const botCellW = (innerW - gap) / 2;
      // Top large
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCoverClipped(page, img, innerX, innerY + botH + gap, innerW, topH, items[0].imageOffset);
      } else {
        page.drawRectangle({ x: innerX, y: innerY + botH + gap, width: innerW, height: topH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
      }
      // Bottom 2
      for (let i = 0; i < 2; i++) {
        const bx = innerX + i * (botCellW + gap);
        const idx = 1 + i;
        if (items[idx]?.image) {
          const img = await embedImage(doc, items[idx].image!);
          drawImageCoverClipped(page, img, bx, innerY, botCellW, botH, items[idx].imageOffset);
        } else {
          page.drawRectangle({ x: bx, y: innerY, width: botCellW, height: botH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
        }
      }
      break;
    }

    case 'two-photo-deco-text': {
      // Per final_insp/026: small photo TL + large photo right spanning both rows + deco BL + text BL
      const pad = safeW * 0.02;
      const gap = safeW * 0.015;
      const innerX = safeX + pad;
      const innerY = safeY + pad;
      const innerW = safeW - 2 * pad;
      const innerH = safeH - 2 * pad;
      const leftW = innerW * 0.38;
      const rightW = innerW - leftW - gap;
      const topH = innerH * 0.48;
      const botH = innerH - topH - gap;
      // Small photo top-left
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCoverClipped(page, img, innerX, innerY + botH + gap, leftW, topH, items[0].imageOffset);
      } else {
        page.drawRectangle({ x: innerX, y: innerY + botH + gap, width: leftW, height: topH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
      }
      // Large photo right (full height)
      if (items[1]?.image) {
        const img = await embedImage(doc, items[1].image);
        drawImageCoverClipped(page, img, innerX + leftW + gap, innerY, rightW, innerH, items[1].imageOffset);
      } else {
        page.drawRectangle({ x: innerX + leftW + gap, y: innerY, width: rightW, height: innerH, color: C.ivory, borderColor: C.whisper, borderWidth: 0.5 });
      }
      // Deco on blob bottom-left
      const blobShape = bookPage.blobShape ?? 'pebble';
      const blobSize = Math.min(leftW, botH) * 0.75;
      await drawBlob(doc, page, blobShape, NURSERY.pink, innerX + leftW * 0.12, innerY + botH * 0.15, blobSize, blobSize, 0.85);
      if (bookPage.decoration) {
        const dSize = blobSize * 0.65;
        await drawDecoration(doc, page, bookPage.decoration, NURSERY.charcoal,
          innerX + leftW * 0.12 + (blobSize - dSize) / 2, innerY + botH * 0.15 + (blobSize - dSize) / 2, dSize, dSize);
      }
      // Text bottom-left — skipped for now (HIDE_TEXT)
      break;
    }

    /* ── Legacy templates (back-compat) ─────────────── */

    case 'full-bleed': {
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        drawImageCoverClipped(page, img, 0, 0, w, h, items[0].imageOffset);
      }
      // Note: legacy template; preview shows no caption strip, so PDF omits it too.
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
        if (TEXT_PLACEHOLDER_MODE) {
          const tw = fonts.displaySemi.widthOfTextAtSize(items[0].title, 14);
          page.drawRectangle({ x: safeX, y: textY + 2, width: tw, height: 10, color: PLACEHOLDER_COLOR });
        } else {
          page.drawText(items[0].title, { x: safeX, y: textY, size: 14, font: fonts.displaySemi, color: C.charcoal });
        }
      }
      if (items[0]?.subtitle) {
        if (TEXT_PLACEHOLDER_MODE) {
          const tw = fonts.body.widthOfTextAtSize(items[0].subtitle, 9);
          page.drawRectangle({ x: safeX, y: textY - 14, width: tw, height: 7, color: PLACEHOLDER_COLOR });
        } else {
          page.drawText(items[0].subtitle, { x: safeX, y: textY - 16, size: 9, font: fonts.body, color: C.pencil });
        }
      }
      if (items[0]?.text) {
        drawWrappedText(page, items[0].text, safeX, textY - 36, safeW, 10, fonts.hand, C.pencil);
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
        }
      }
      break;
    }

    case 'text-only': {
      let y = safeY + safeH - 20;
      const heading = bookPage.heading || items[0]?.title;
      if (heading) {
        if (TEXT_PLACEHOLDER_MODE) {
          const tw = fonts.displaySemi.widthOfTextAtSize(heading, 18);
          page.drawRectangle({ x: safeX, y: y + 2, width: tw, height: 13, color: PLACEHOLDER_COLOR });
        } else {
          page.drawText(heading, { x: safeX, y, size: 18, font: fonts.displaySemi, color: C.charcoal });
        }
        y -= 28;
      }
      if (items[0]?.text) {
        drawWrappedText(page, items[0].text, safeX, y, safeW, 11, fonts.hand, C.pencil);
      }
      break;
    }

    case 'month-title': {
      const heading = bookPage.heading || items[0]?.title || '';
      if (items[0]?.image) {
        const img = await embedImage(doc, items[0].image);
        const r = Math.min(safeW, safeH) * 0.2;
        drawImageFit(page, img, w / 2 - r, h / 2, r * 2, r * 2);
      }
      drawCenteredText(page, heading, w / 2, h / 2 - 20, 24, fonts.displaySemi, C.charcoal);
      break;
    }
  }
}

/* ── Generate cover PDF (wrap: back-spine-front) ────────── */

export async function generateCoverPdf(
  cover: CoverConfig,
  _sku: string,
  coverWidthPt: number,
  coverHeightPt: number,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = await embedFonts(doc);
  const page = doc.addPage([coverWidthPt, coverHeightPt]);

  const theme = COVER_THEMES[cover.theme] ?? COVER_THEMES.classic;
  const accentColor = rgb(...theme.accent);

  // Cream background across the full wrap
  page.drawRectangle({ x: 0, y: 0, width: coverWidthPt, height: coverHeightPt, color: C.cream });

  // Front cover = right half of the wrap
  const frontX = coverWidthPt / 2;
  const frontW = coverWidthPt / 2;

  /* ── Front cover layout (mirrors CoverCanvas.tsx) ── */

  // Photo block — square, top portion
  const photoSize = Math.min(frontW * 0.78, coverHeightPt * 0.55);
  const photoX = frontX + (frontW - photoSize) / 2;
  const photoY = coverHeightPt - photoSize - coverHeightPt * 0.10;

  // Photo background placeholder
  page.drawRectangle({
    x: photoX, y: photoY, width: photoSize, height: photoSize,
    color: C.ivory, borderColor: C.whisper, borderWidth: 0.5,
  });

  if (cover.photo) {
    try {
      const img = await embedImage(doc, cover.photo);
      drawImageCoverClipped(page, img, photoX, photoY, photoSize, photoSize);
    } catch {
      // Skip on embed failure
    }
  }

  // Tagline (script)
  const taglineY = photoY - coverHeightPt * 0.06;
  drawCenteredText(page, 'welcome to the world',
    frontX + frontW / 2, taglineY, 32, fonts.script, C.pink);

  // Baby name (chunky display, uppercase)
  const nameY = taglineY - coverHeightPt * 0.075;
  const nameText = (cover.babyName || 'Baby Name').toUpperCase();
  drawCenteredText(page, nameText,
    frontX + frontW / 2, nameY, 36, fonts.displaySemi, C.charcoal);

  // Sparkle clusters
  const sparkleSize = frontW * 0.14;
  await drawDecoration(doc, page, 'sparkles', NURSERY.peach,
    frontX + frontW * 0.06, coverHeightPt * 0.04, sparkleSize, sparkleSize);
  await drawDecoration(doc, page, 'sparkles', NURSERY.sage,
    frontX + frontW - sparkleSize - frontW * 0.06, coverHeightPt * 0.04, sparkleSize, sparkleSize);

  /* ── Back cover (left half) — keep simple cream w/ subtle accent ── */
  // Small accent dot pattern
  page.drawCircle({ x: frontX / 2, y: coverHeightPt / 2, size: 1.5, color: accentColor, opacity: 0.5 });

  /* ── Spine text ── */
  const spineText = `${cover.babyName || 'Baby'}'s Memory Book`;
  const spineSize = 9;
  if (TEXT_PLACEHOLDER_MODE) {
    const spineW = fonts.displaySemi.widthOfTextAtSize(spineText, spineSize);
    page.drawRectangle({
      x: coverWidthPt / 2 - 3,
      y: coverHeightPt / 2 - spineW / 2,
      width: 7,
      height: spineW,
      color: PLACEHOLDER_COLOR,
    });
  } else {
    page.drawText(spineText, {
      x: coverWidthPt / 2 + 3.5,
      y: coverHeightPt / 2 - fonts.displaySemi.widthOfTextAtSize(spineText, spineSize) / 2,
      size: spineSize,
      font: fonts.displaySemi,
      color: C.charcoal,
      rotate: degrees(90),
    });
  }

  return doc.save();
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
  const widthInches = trim.widthPt / 72;
  const heightInches = trim.heightPt / 72;

  project.pages.forEach((page, idx) => {
    for (const item of page.items) {
      if (!item.image) continue;
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
