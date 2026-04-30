/* eslint-disable no-console */
/**
 * Preview PDF generator harness — 1:1 mapping to final_insp/ images.
 *
 * Builds a 26-page interior PDF matching the inspiration sequence exactly.
 * Image 000 = cover, 001–028 = interior pages (skipping 005, 011).
 *
 * Usage (from frontend/tinytoes-app):
 *   pnpm exec vite-node tools/preview-pdf.ts
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { generateInteriorPdf, generateCoverPdf } from '../src/features/print-book/PdfGenerator';
import type { BookProject, BookPage, PageContentItem, ImageOffset } from '../src/types';

// ── Paths ─────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, 'fixtures');
const OUTPUT   = resolve(__dirname, 'output');
const FONTS    = resolve(__dirname, '..', 'src', 'assets', 'fonts');
if (!existsSync(OUTPUT)) mkdirSync(OUTPUT, { recursive: true });

// ── fetch shim ────────────────────────────────────────────
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init?: any): Promise<Response> => {
  const url = typeof input === 'string' ? input : input?.url ?? String(input);
  let filePath: string | null = null;
  if (url.startsWith('file://')) {
    filePath = fileURLToPath(url);
  } else if (/^[a-zA-Z]:[\\/]/.test(url) || url.startsWith('/')) {
    if (existsSync(url)) filePath = url;
  }
  if (!filePath && url.includes('/assets/fonts/')) {
    const name = url.split('/assets/fonts/').pop()!.split('?')[0];
    const candidate = resolve(FONTS, name);
    if (existsSync(candidate)) filePath = candidate;
  }
  if (filePath && existsSync(filePath) && statSync(filePath).isFile()) {
    const buf = readFileSync(filePath);
    return new Response(buf, { status: 200 });
  }
  return originalFetch(input, init);
}) as typeof fetch;

// ── Fixture helpers ───────────────────────────────────────
function jpegDataUrl(name: string): string {
  const buf = readFileSync(resolve(FIXTURES, name));
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

const IMG = {
  b1: jpegDataUrl('baby-1.jpg'),
  b2: jpegDataUrl('baby-2.jpg'),
  b3: jpegDataUrl('baby-3.jpg'),
  b4: jpegDataUrl('baby-4.jpg'),
};

const O: ImageOffset = { x: 0, y: 0, scale: 1 };

function it(image: string | null = null): PageContentItem {
  return { sourceType: 'custom', sourceId: 'demo', image, title: '', subtitle: '', text: '', imageOffset: O };
}

function pg(p: Partial<BookPage> & Pick<BookPage, 'templateId'>): BookPage {
  return {
    id: `pg-${Math.random().toString(36).slice(2, 8)}`,
    templateId: p.templateId,
    items: p.items ?? [],
    heading: p.heading,
    decoration: p.decoration,
    decoCorner: p.decoCorner,
    photoSide: p.photoSide,
    blobShape: p.blobShape,
    locked: p.locked,
    stats: p.stats,
  };
}

// ── 26 interior pages mapped 1:1 to final_insp/ sequence ──
// (image 000 = cover, rest are interior)
// We cycle the 4 stock photos to fill slots.
const i1 = IMG.b1, i2 = IMG.b2, i3 = IMG.b3, i4 = IMG.b4;

const PAGES: BookPage[] = [
  // Page 1 — insp 001: title-stats
  pg({
    templateId: 'title-stats',
    heading: 'Hello, Baby!',
    items: [it(i1), it(i2)],
    stats: { birthDate: 'August 1, 2025', birthTime: '9:07 pm', weight: '7 pounds, 7 ounces', length: '19 inches' },
  }),
  // Page 2 — insp 002: photo-blob-quote ("LOVE at first sight")
  pg({
    templateId: 'photo-blob-quote',
    decoration: 'hearts',
    items: [it(i3)],
  }),
  // Page 3 — insp 003: grid-5-asym
  pg({
    templateId: 'grid-5-asym',
    items: [it(i1), it(i2), it(i3), it(i4), it(i1)],
  }),
  // Page 4 — insp 004: grid-5-asym
  pg({
    templateId: 'grid-5-asym',
    items: [it(i4), it(i3), it(i2), it(i1), it(i4)],
  }),
  // Page 5 — insp 006: quote-deco-photo-split (photo LEFT)
  pg({
    templateId: 'quote-deco-photo-split',
    decoration: 'hearts',
    photoSide: 'left',
    items: [it(i2)],
  }),
  // Page 6 — insp 007: grid-deco-corner (deco TL, circle blob, moon-stars)
  pg({
    templateId: 'grid-deco-corner',
    decoration: 'moon-stars',
    decoCorner: 0,
    blobShape: 'oval',
    items: [it(i1), it(i3), it(i4)],
  }),
  // Page 7 — insp 008: photo-sparkle (single offset photo + sparkles)
  pg({
    templateId: 'photo-sparkle',
    items: [it(i4)],
  }),
  // Page 8 — insp 009: grid-3-deco-text (3 photos + rainbow deco in BR)
  pg({
    templateId: 'grid-3-deco-text',
    decoration: 'rainbow',
    decoCorner: 3,
    items: [it(i2), it(i1), it(i3)],
  }),
  // Page 9 — insp 010: full-photo
  pg({
    templateId: 'full-photo',
    items: [it(i1)],
  }),
  // Page 10 — insp 012: grid-9-deco-center (sailboat center)
  pg({
    templateId: 'grid-9-deco-center',
    decoration: 'sailboat',
    items: [it(i4), it(i3), it(i1), it(i2), it(i4), it(i3), it(i1), it(i2)],
  }),
  // Page 11 — insp 013: two-photo-text (2 stacked photos right + text left)
  pg({
    templateId: 'two-photo-text',
    photoSide: 'right',
    items: [it(i4), it(i3)],
  }),
  // Page 12 — insp 014: quote-deco-grid-3 (flowers deco + 1 big + 2 small right)
  pg({
    templateId: 'quote-deco-grid-3',
    decoration: 'floral',
    items: [it(i1), it(i3), it(i2)],
  }),
  // Page 13 — insp 015: full-photo
  pg({
    templateId: 'full-photo',
    items: [it(i2)],
  }),
  // Page 14 — insp 016: grid-4
  pg({
    templateId: 'grid-4',
    items: [it(i3), it(i1), it(i2), it(i4)],
  }),
  // Page 15 — insp 017: grid-1big-2small-deco (lion, pebble blob)
  pg({
    templateId: 'grid-1big-2small-deco',
    decoration: 'lion',
    blobShape: 'pebble',
    items: [it(i4), it(i1), it(i2)],
  }),
  // Page 16 — insp 018: photo-1big-2small-text ("our little ANGEL")
  pg({
    templateId: 'photo-1big-2small-text',
    items: [it(i1), it(i3), it(i2)],
  }),
  // Page 17 — insp 019: full-photo
  pg({
    templateId: 'full-photo',
    items: [it(i3)],
  }),
  // Page 18 — insp 020: quote-deco-photo-split (sun deco, photo RIGHT)
  pg({
    templateId: 'quote-deco-photo-split',
    decoration: 'sun',
    photoSide: 'right',
    items: [it(i1)],
  }),
  // Page 19 — insp 021: grid-4 (4 photos 2×2)
  pg({
    templateId: 'grid-4',
    items: [it(i2), it(i1), it(i3), it(i4)],
  }),
  // Page 20 — insp 022: full-photo
  pg({
    templateId: 'full-photo',
    items: [it(i2)],
  }),
  // Page 21 — insp 023: grid-1big-2small-deco (giraffe, circle blob)
  pg({
    templateId: 'grid-1big-2small-deco',
    decoration: 'giraffe',
    blobShape: 'oval',
    items: [it(i4), it(i3), it(i2)],
  }),
  // Page 22 — insp 024: photo-blob-quote (2 blobs + cupcake deco + "so very SWEET")
  pg({
    templateId: 'photo-blob-quote',
    decoration: 'cupcake',
    items: [it(i1)],
  }),
  // Page 23 — insp 025: grid-3-top-bottom (1 large top + 2 small bottom)
  pg({
    templateId: 'grid-3-top-bottom',
    items: [it(i3), it(i2), it(i4)],
  }),
  // Page 24 — insp 026: two-photo-deco-text (small TL + big right + elephant deco BL)
  pg({
    templateId: 'two-photo-deco-text',
    decoration: 'elephant',
    blobShape: 'pebble',
    items: [it(i2), it(i1)],
  }),
  // Page 25 — insp 027: grid-6
  pg({
    templateId: 'grid-6',
    items: [it(i3), it(i4), it(i1), it(i2), it(i3), it(i4)],
  }),
  // Page 26 — insp 028: grid-5-asym
  pg({
    templateId: 'grid-5-asym',
    items: [it(i1), it(i3), it(i2), it(i4), it(i1)],
  }),
];

// ── Demo project ──────────────────────────────────────────
const DEMO: BookProject = {
  id: 'demo',
  name: 'Memory Book Demo — Final Insp Match',
  cover: { babyName: 'Eloise Alice', year: '2025', theme: 'classic', photo: IMG.b1 },
  skuSlug: 'print-hardcover',  // 8.5×8.5 square
  createdAt: Date.now(),
  updatedAt: Date.now(),
  pages: PAGES,
};

// ── Generate individual page PDFs ─────────────────────────
async function main() {
  const pageArg = process.argv[2]; // e.g. "5" or "1-5" or "all"
  let indices: number[];

  if (!pageArg || pageArg === 'all') {
    indices = PAGES.map((_, i) => i);
  } else if (pageArg.includes('-')) {
    const [a, b] = pageArg.split('-').map(Number);
    indices = [];
    for (let i = a; i <= b; i++) indices.push(i);
  } else {
    indices = pageArg.split(',').map(Number);
  }

  for (const idx of indices) {
    if (idx < 0 || idx >= PAGES.length) {
      console.log(`[preview] skipping invalid page index ${idx}`);
      continue;
    }
    const singleProject: BookProject = {
      ...DEMO,
      pages: [PAGES[idx]],
    };
    console.log(`[preview] page ${idx + 1} (${PAGES[idx].templateId})…`);
    const pdf = await generateInteriorPdf(singleProject);
    const fname = `page-${String(idx + 1).padStart(2, '0')}.pdf`;
    writeFileSync(resolve(OUTPUT, fname), pdf);
    console.log(`  → ${fname} (${pdf.byteLength.toLocaleString()} bytes)`);
  }

  // Also generate the full interior for reference
  console.log(`[preview] generating full interior PDF…`);
  const interior = await generateInteriorPdf(DEMO);
  writeFileSync(resolve(OUTPUT, 'demo-interior.pdf'), interior);
  console.log(`[preview] done. ${indices.length} pages + full interior.`);
}

main().catch(err => {
  console.error('[preview] failed:', err);
  process.exit(1);
});
