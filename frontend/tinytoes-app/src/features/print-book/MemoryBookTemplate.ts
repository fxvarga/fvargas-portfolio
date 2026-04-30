/**
 * MemoryBookTemplate.ts
 *
 * Generates a fixed 26-page Mixbook-style memory book from user inputs.
 * The page sequence, templates, decorations, and text are pre-determined —
 * the user only supplies photos, baby name, and birth stats.
 */
import type {
  BookProject,
  BookPage,
  PageContentItem,
  ImageOffset,
  DecorationKind,
  PageTemplateId,
  CoverTheme,
} from '../../types';

// ── Helpers ───────────────────────────────────────────────

const O: ImageOffset = { x: 0, y: 0, scale: 1 };

function id(): string {
  return `pg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function item(image: string | null): PageContentItem {
  return {
    sourceType: 'custom',
    sourceId: '',
    image,
    title: '',
    subtitle: '',
    text: '',
    imageOffset: { ...O },
  };
}

// ── Quote / heading text for each page ───────────────────

const PAGE_QUOTES: Record<number, string> = {
  2: 'LOVE at first sight',
  5: 'you are my SUNSHINE',
  8: 'little moments, BIG memories',
  11: 'tiny hands, FULL hearts',
  12: "can't wait to WATCH YOU GROW",
  16: 'our little ANGEL',
  18: 'you are like SUNSHINE',
  22: 'so very SWEET',
  24: 'BLESSED beyond measure',
};

// ── Page blueprint ───────────────────────────────────────

interface PageBlueprint {
  templateId: PageTemplateId;
  photoCount: number;
  decoration?: DecorationKind;
  decoCorner?: 0 | 1 | 2 | 3;
  photoSide?: 'left' | 'right';
  blobShape?: 'pebble' | 'arch' | 'oval';
  heading?: string;
}

/**
 * The fixed 26-page sequence. Photo counts indicate how many images
 * the template consumes from the user's photo pool.
 */
const BLUEPRINTS: PageBlueprint[] = [
  /* 1  */ { templateId: 'title-stats',            photoCount: 2 },
  /* 2  */ { templateId: 'photo-blob-quote',       photoCount: 1, decoration: 'hearts' },
  /* 3  */ { templateId: 'grid-5-asym',            photoCount: 5 },
  /* 4  */ { templateId: 'grid-5-asym',            photoCount: 5 },
  /* 5  */ { templateId: 'quote-deco-photo-split', photoCount: 1, decoration: 'hearts', photoSide: 'left' },
  /* 6  */ { templateId: 'grid-deco-corner',       photoCount: 3, decoration: 'moon-stars', decoCorner: 0, blobShape: 'oval' },
  /* 7  */ { templateId: 'photo-sparkle',          photoCount: 1 },
  /* 8  */ { templateId: 'grid-3-deco-text',       photoCount: 3, decoration: 'rainbow', decoCorner: 3 },
  /* 9  */ { templateId: 'full-photo',             photoCount: 1 },
  /* 10 */ { templateId: 'grid-9-deco-center',     photoCount: 8, decoration: 'sailboat' },
  /* 11 */ { templateId: 'two-photo-text',         photoCount: 2, photoSide: 'right' },
  /* 12 */ { templateId: 'quote-deco-grid-3',      photoCount: 3, decoration: 'floral' },
  /* 13 */ { templateId: 'full-photo',             photoCount: 1 },
  /* 14 */ { templateId: 'grid-4',                 photoCount: 4 },
  /* 15 */ { templateId: 'grid-1big-2small-deco',  photoCount: 3, decoration: 'lion', blobShape: 'pebble' },
  /* 16 */ { templateId: 'photo-1big-2small-text', photoCount: 3 },
  /* 17 */ { templateId: 'full-photo',             photoCount: 1 },
  /* 18 */ { templateId: 'quote-deco-photo-split', photoCount: 1, decoration: 'sun', photoSide: 'right' },
  /* 19 */ { templateId: 'grid-4',                 photoCount: 4 },
  /* 20 */ { templateId: 'full-photo',             photoCount: 1 },
  /* 21 */ { templateId: 'grid-1big-2small-deco',  photoCount: 3, decoration: 'giraffe', blobShape: 'oval' },
  /* 22 */ { templateId: 'photo-blob-quote',       photoCount: 1, decoration: 'cupcake' },
  /* 23 */ { templateId: 'grid-3-top-bottom',      photoCount: 3 },
  /* 24 */ { templateId: 'two-photo-deco-text',    photoCount: 2, decoration: 'elephant', blobShape: 'pebble' },
  /* 25 */ { templateId: 'grid-6',                 photoCount: 6 },
  /* 26 */ { templateId: 'grid-5-asym',            photoCount: 5 },
];

/** Total photos consumed if every slot is filled. */
export const TOTAL_PHOTO_SLOTS = BLUEPRINTS.reduce((s, b) => s + b.photoCount, 0);

// ── Public API ───────────────────────────────────────────

export interface MemoryBookInput {
  /** Ordered array of photo data-URLs (or blob URLs). */
  photos: string[];
  babyName: string;
  /** Optional birth stats. */
  stats?: {
    birthDate?: string;
    birthTime?: string;
    weight?: string;
    length?: string;
  };
  /** Cover theme. Defaults to 'classic'. */
  coverTheme?: CoverTheme;
  /** Cover photo (data URL). Defaults to first photo. */
  coverPhoto?: string | null;
  /** Year string for cover. Defaults to current year. */
  year?: string;
}

/**
 * Create a complete 26-page memory book project from user inputs.
 *
 * Photos are distributed across pages in order. If fewer photos than
 * slots are provided, photos cycle. If more photos than slots, extras
 * are ignored.
 */
export function createMemoryBookProject(input: MemoryBookInput): BookProject {
  const { photos, babyName, stats, coverTheme, coverPhoto, year } = input;

  if (photos.length === 0) {
    throw new Error('At least one photo is required to create a memory book.');
  }

  // Photo pool — cycle through if not enough
  let photoIdx = 0;
  function nextPhoto(): string {
    const p = photos[photoIdx % photos.length];
    photoIdx++;
    return p;
  }

  const pages: BookPage[] = BLUEPRINTS.map((bp, i) => {
    const pageNum = i + 1;
    const items: PageContentItem[] = [];
    for (let j = 0; j < bp.photoCount; j++) {
      items.push(item(nextPhoto()));
    }

    const page: BookPage = {
      id: id(),
      templateId: bp.templateId,
      items,
      heading: PAGE_QUOTES[pageNum] ?? bp.heading,
      decoration: bp.decoration,
      decoCorner: bp.decoCorner,
      photoSide: bp.photoSide,
      blobShape: bp.blobShape,
    };

    // Title-stats page gets birth info
    if (bp.templateId === 'title-stats' && stats) {
      page.heading = page.heading || `Hello, ${babyName}!`;
      page.stats = { ...stats };
    }

    return page;
  });

  const now = Date.now();
  return {
    id: `membook-${now.toString(36)}`,
    name: `${babyName}'s Memory Book`,
    cover: {
      babyName,
      year: year ?? new Date().getFullYear().toString(),
      theme: coverTheme ?? 'classic',
      photo: coverPhoto ?? photos[0] ?? null,
    },
    skuSlug: 'print-hardcover',
    createdAt: now,
    updatedAt: now,
    pages,
  };
}
