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
import { Decoration } from './Decorations';

import robotoRegularUrl    from '@/assets/fonts/Roboto-Regular.ttf?url';
import robotoBoldUrl       from '@/assets/fonts/Roboto-Bold.ttf?url';
import caveatRegularUrl    from '@/assets/fonts/Caveat-Regular.ttf?url';
import caveatBoldUrl       from '@/assets/fonts/Caveat-Bold.ttf?url';
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

function drawCenteredText(
  page: PDFPage, text: string, cx: number, y: number,
  size: number, font: PDFFont, color: ReturnType<typeof rgb>,
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx - w / 2, y, size, font, color });
}

function drawWrappedText(
  page: PDFPage, text: string,
  x: number, startY: number, maxWidth: number,
  fontSize: number, font: PDFFont, color: ReturnType<typeof rgb>,
  options: { lineHeight?: number; align?: 'left' | 'center'; minY?: number } = {},
) {
  const lineHeight = options.lineHeight ?? fontSize * 1.4;
  const minY = options.minY ?? BLEED + MARGIN;
  const align = options.align ?? 'left';
  // Split on whitespace AND preserve explicit \n line breaks
  const paragraphs = text.split(/\n/);
  let y = startY;
  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(test, fontSize);
      if (w > maxWidth && line) {
        const drawX = align === 'center' ? x + (maxWidth - font.widthOfTextAtSize(line, fontSize)) / 2 : x;
        page.drawText(line, { x: drawX, y, size: fontSize, font, color });
        y -= lineHeight;
        if (y < minY) return;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      const drawX = align === 'center' ? x + (maxWidth - font.widthOfTextAtSize(line, fontSize)) / 2 : x;
      page.drawText(line, { x: drawX, y, size: fontSize, font, color });
      y -= lineHeight;
      if (y < minY) return;
    }
  }
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
      // Lock-shape glyph + "INTENTIONALLY LEFT BLANK" centered, very subtle.
      // Preview uses a Lock icon at 8% of page width; mirror with simple primitives.
      const cx = w / 2;
      const cy = h / 2;
      const lockSize = w * 0.08;
      const bodyW = lockSize * 0.78;
      const bodyH = lockSize * 0.55;
      const bodyX = cx - bodyW / 2;
      const bodyY = cy + lockSize * 0.10;
      const shackleR = bodyW * 0.34;
      const shackleCx = cx;
      const shackleCy = bodyY + bodyH + shackleR * 0.55;
      // Lock shackle (drawn as a stroked ring, then knocked out by body rectangle below)
      page.drawCircle({ x: shackleCx, y: shackleCy, size: shackleR, borderColor: C.whisper, borderWidth: 1.2 });
      // Lock body
      page.drawRectangle({
        x: bodyX, y: bodyY, width: bodyW, height: bodyH,
        color: C.cream, borderColor: C.whisper, borderWidth: 1.2,
      });
      const textSize = 9 * ts;
      const text1 = 'THIS PAGE INTENTIONALLY';
      const text2 = 'LEFT BLANK';
      drawCenteredText(page, text1, w / 2, cy - lockSize * 0.6,        textSize, fonts.display, C.whisper);
      drawCenteredText(page, text2, w / 2, cy - lockSize * 0.6 - textSize * 1.4, textSize, fonts.display, C.whisper);
      break;
    }

    case 'title-stats': {
      const heading = (bookPage.heading || 'Hello, Baby!').replace(/^hello,?\s*/i, '').trim() || 'BABY!';
      const helloSize = 56 * ts;
      const nameSize  = 64 * ts;
      // "hello," in script
      drawCenteredText(page, 'hello,', w / 2, h * 0.62, helloSize, fonts.script, C.pink);
      // Big chunky display name
      drawCenteredText(page, heading.toUpperCase(), w / 2, h * 0.50, nameSize, fonts.displaySemi, C.charcoal);

      // Decorative divider with heart
      const dividerY = h * 0.42;
      const dividerHalfW = safeW * 0.32;
      const heartSize = 24 * ts;
      page.drawLine({
        start: { x: w / 2 - dividerHalfW, y: dividerY }, end: { x: w / 2 - heartSize / 2, y: dividerY },
        thickness: 0.6, color: C.sage,
      });
      page.drawLine({
        start: { x: w / 2 + heartSize / 2, y: dividerY }, end: { x: w / 2 + dividerHalfW, y: dividerY },
        thickness: 0.6, color: C.sage,
      });
      await drawDecoration(doc, page, 'hearts', NURSERY.pink,
        w / 2 - heartSize / 2, dividerY - heartSize / 2, heartSize, heartSize);

      // Stats grid
      const stats = bookPage.stats;
      if (stats) {
        const labels: { key: keyof NonNullable<typeof stats>; label: string }[] = [
          { key: 'birthDate', label: 'BORN' },
          { key: 'birthTime', label: 'TIME' },
          { key: 'weight',    label: 'WEIGHT' },
          { key: 'length',    label: 'LENGTH' },
        ];
        const startY = h * 0.32;
        const colWidth = safeW / 2;
        const labelSize = 8 * ts;
        const valueSize = 14 * ts;
        const rowGap = (labelSize + valueSize) * 1.6;
        labels.forEach((s, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = safeX + col * colWidth + colWidth / 2;
          const ly = startY - row * rowGap;
          drawCenteredText(page, s.label, cx, ly, labelSize, fonts.displaySemi, C.pencil);
          drawCenteredText(page, stats[s.key] || '—', cx, ly - valueSize - 2, valueSize, fonts.hand, C.charcoal);
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
      // Quote (script) — preview uses 28*scale, lineHeight 1.15
      const quote = bookPage.heading || items[0]?.text || items[0]?.title || '';
      if (quote) {
        const fontSize = 28 * ts;
        drawWrappedText(page, quote, safeX, captionH / 2 + fontSize / 2,
          safeW, fontSize, fonts.script, C.charcoal,
          { align: 'center', lineHeight: fontSize * 1.15, minY: 8 });
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
      const tilts = [-4, 3, -2, 5];
      const polPos = [
        { topPct: 0.08, leftPct: 0.08, widthPct: 0.42 },
        { topPct: 0.12, leftPct: 0.52, widthPct: 0.40 },
        { topPct: 0.52, leftPct: 0.06, widthPct: 0.40 },
        { topPct: 0.50, leftPct: 0.52, widthPct: 0.42 },
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
        drawWrappedText(page, quote, safeX, h * 0.55,
          safeW, fontSize, fonts.script, C.charcoal,
          { align: 'center', lineHeight: fontSize * 1.1, minY: h * 0.25 });
      }
      // Bottom decoration: preview width 24%, positioned 14% from bottom, opacity 0.7
      if (bookPage.decoration) {
        const dSize = w * 0.24;
        await drawDecoration(doc, page, bookPage.decoration, NURSERY.peach,
          (w - dSize) / 2, h * 0.14, dSize, dSize, 0.7);
      }
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
        page.drawText(items[0].title, { x: safeX, y: textY, size: 14, font: fonts.displaySemi, color: C.charcoal });
      }
      if (items[0]?.subtitle) {
        page.drawText(items[0].subtitle, { x: safeX, y: textY - 16, size: 9, font: fonts.body, color: C.pencil });
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
        page.drawText(heading, { x: safeX, y, size: 18, font: fonts.displaySemi, color: C.charcoal });
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
  page.drawText(spineText, {
    x: coverWidthPt / 2 + 3.5,
    y: coverHeightPt / 2 - fonts.displaySemi.widthOfTextAtSize(spineText, spineSize) / 2,
    size: spineSize,
    font: fonts.displaySemi,
    color: C.charcoal,
    rotate: degrees(90),
  });

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
