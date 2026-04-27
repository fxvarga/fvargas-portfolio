/* ── Shared constants for book rendering (PDF + on-screen canvas) ── */

/** Trim size in points (72pt = 1 inch) */
export interface TrimSize {
  widthPt: number;
  heightPt: number;
}

export const TRIM_SIZES: Record<string, TrimSize> = {
  'print-softcover':  { widthPt: 6 * 72, heightPt: 9 * 72 },       // 6×9
  'print-hardcover':  { widthPt: 8.5 * 72, heightPt: 8.5 * 72 },   // 8.5×8.5 (square)
  'print-premium':    { widthPt: 8.5 * 72, heightPt: 11 * 72 },     // 8.5×11
};

/** 0.125" bleed on all sides (in points) */
export const BLEED = 0.125 * 72;

/** 0.5" safe margin (in points) */
export const MARGIN = 0.5 * 72;

/* ── Nursery palette ────────────────────────────────────── */

/** Primary page background — soft cream */
export const NURSERY = {
  cream:    '#FAF7F2',
  ivory:    '#FFFCF6',
  sage:     '#A8C5A0',
  peach:    '#F4C28C',
  pink:     '#E8A0BF',
  sky:      '#B7D6E5',
  butter:   '#F5E5A3',
  charcoal: '#3D2C2E',
  pencil:   '#7A6F70',
  whisper:  '#C9BEC0',
};

/** Cover theme colour palettes (RGB 0-1 floats for pdf-lib) */
export const COVER_THEMES: Record<string, {
  bg: [number, number, number];
  text: [number, number, number];
  accent: [number, number, number];
}> = {
  classic:  { bg: [0.980, 0.969, 0.949], text: [0.239, 0.173, 0.180], accent: [0.659, 0.773, 0.627] },  // sage accent
  pastel:   { bg: [1.000, 0.988, 0.976], text: [0.239, 0.173, 0.180], accent: [0.910, 0.627, 0.749] },  // pink accent
  playful:  { bg: [1.000, 0.980, 0.941], text: [0.239, 0.173, 0.180], accent: [0.957, 0.761, 0.549] },  // peach accent
};

/* ── Font family tokens (browser CSS) ────────────────────── */

export const FONTS = {
  /** Chunky display headings — baby names, page titles */
  display: `'Fredoka', 'Quicksand', system-ui, sans-serif`,
  /** Handwritten script — taglines, quotes */
  script:  `'Caveat', 'Pacifico', cursive`,
  /** Friendly handwriting body */
  hand:    `'Patrick Hand', 'Caveat', cursive`,
  /** Plain body fallback */
  body:    `'Patrick Hand', system-ui, sans-serif`,
};

/* ── Derived helpers for on-screen rendering ────────────────────── */

/** Get trim size for a SKU slug, defaulting to softcover */
export function getTrimSize(skuSlug: string | null | undefined): TrimSize {
  return TRIM_SIZES[skuSlug ?? 'print-softcover'] ?? TRIM_SIZES['print-softcover'];
}

/** Aspect ratio (width / height) of the trim area (no bleed) */
export function getTrimAspect(skuSlug: string | null | undefined): number {
  const t = getTrimSize(skuSlug);
  return t.widthPt / t.heightPt;
}

/** Margin as a fraction of trim width */
export function marginFraction(skuSlug: string | null | undefined): number {
  const t = getTrimSize(skuSlug);
  return MARGIN / t.widthPt;
}

/** Margin as a fraction of trim height (use for vertical insets so margins are symmetric in inches) */
export function marginFractionV(skuSlug: string | null | undefined): number {
  const t = getTrimSize(skuSlug);
  return MARGIN / t.heightPt;
}

/* ── Print spec ────────────────────────────────────── */

/** Lulu minimum interior page count for print books */
export const MIN_PRINT_PAGES = 32;

/** Lulu maximum interior page count */
export const MAX_PRINT_PAGES = 240;

/**
 * Scale typography proportional to trim width so 6×9 and 8.5×11 books look balanced.
 * Reference width = 6" (432pt). 8.5" trims scale up ~1.42×.
 */
export function templateScale(trimWidthPt: number): number {
  return trimWidthPt / (6 * 72);
}

/** CSS-friendly colour string from 0-1 float array */
export function floatToRgb(c: [number, number, number]): string {
  return `rgb(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)})`;
}
