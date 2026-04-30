import type { PageTemplateId, BookPage, PageContentItem, DecorationKind } from '@/types';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Image as ImageIcon, Quote, Layers, LayoutGrid, Grid3x3, FileText, Heading,
  Camera, Sparkles,
} from 'lucide-react';

/* ── Template metadata ───────────────────────────────────── */

export interface TemplateInfo {
  id: PageTemplateId;
  label: string;
  description: string;
  icon: ComponentType<LucideProps>;
  maxItems: number;
  /** Whether the template supports a decoration motif */
  supportsDecoration?: boolean;
  /** Hidden from the user-facing layout picker (system templates) */
  hidden?: boolean;
}

export const PAGE_TEMPLATES: TemplateInfo[] = [
  // System
  { id: 'blank-locked', label: 'Blank (locked)', description: 'Intentionally left blank', icon: FileText, maxItems: 0, hidden: true },
  // Curated nursery layouts
  { id: 'title-stats',     label: 'Hello, Baby!',  description: 'Name + birth stats',          icon: Heading,    maxItems: 0 },
  { id: 'full-photo',      label: 'Full Photo',    description: 'Single edge-to-edge photo',   icon: ImageIcon,  maxItems: 1 },
  { id: 'photo-quote',     label: 'Photo + Quote', description: 'Photo with script quote',     icon: Quote,      maxItems: 1, supportsDecoration: true },
  { id: 'two-photo-stack', label: 'Two Photos',    description: 'Two stacked photos',          icon: Layers,     maxItems: 2 },
  { id: 'grid-4',          label: 'Grid of 4',     description: '2×2 photo grid',              icon: LayoutGrid, maxItems: 4 },
  { id: 'grid-6',          label: 'Grid of 6',     description: '3×2 photo grid',              icon: Grid3x3,    maxItems: 6 },
  { id: 'polaroid',        label: 'Polaroids',     description: 'Photos in tilted frames',     icon: Camera,     maxItems: 4 },
  { id: 'quote-only',      label: 'Quote Only',    description: 'Big script quote',            icon: Sparkles,   maxItems: 0, supportsDecoration: true },

  // Mixbook-style memory book templates
  { id: 'photo-blob-quote',       label: 'Photo + Blob Quote',    description: 'Photo with blob accent + quote',          icon: Quote,      maxItems: 1, supportsDecoration: true },
  { id: 'quote-deco-photo-split', label: 'Split Quote/Photo',     description: 'Half quote/deco, half photo',             icon: Quote,      maxItems: 1, supportsDecoration: true },
  { id: 'grid-5-asym',            label: 'Grid 5 Asymmetric',     description: '3 small + 2 large photos',                icon: LayoutGrid, maxItems: 5 },
  { id: 'grid-9-deco-center',     label: 'Grid 9 + Center Deco',  description: '8 photos around center decoration',       icon: Grid3x3,    maxItems: 8, supportsDecoration: true },
  { id: 'grid-deco-corner',       label: 'Grid + Deco Corner',    description: '3 photos + decoration in one corner',     icon: LayoutGrid, maxItems: 3, supportsDecoration: true },
  { id: 'photo-sparkle',          label: 'Photo + Sparkles',      description: 'Single photo with sparkle accents',       icon: Sparkles,   maxItems: 1 },
  { id: 'grid-3-deco-text',       label: 'Grid 3 + Deco/Text',   description: '3 photos + deco/text cell',               icon: LayoutGrid, maxItems: 3, supportsDecoration: true },
  { id: 'two-photo-text',         label: 'Two Photos + Text',     description: '2 stacked photos + text area',            icon: Layers,     maxItems: 2 },
  { id: 'quote-deco-grid-3',      label: 'Quote + 3 Photos',      description: 'Quote/deco side + 1 big + 2 small',       icon: Quote,      maxItems: 3, supportsDecoration: true },
  { id: 'grid-1big-2small-deco',  label: '1 Big + 2 Small + Deco', description: 'Large photo + 2 small + decoration',     icon: LayoutGrid, maxItems: 3, supportsDecoration: true },
  { id: 'photo-1big-2small-text', label: '3 Photos + Text',       description: '1 big + 2 small photos + text',           icon: ImageIcon,  maxItems: 3 },
  { id: 'grid-3-top-bottom',      label: '1 Top + 2 Bottom',      description: '1 large top + 2 small bottom',            icon: LayoutGrid, maxItems: 3 },
  { id: 'two-photo-deco-text',    label: '2 Photos + Deco/Text',  description: '2 asymmetric photos + decoration + text', icon: Layers,     maxItems: 2, supportsDecoration: true },

  // Legacy (kept hidden so old projects still render)
  { id: 'full-bleed',  label: 'Full Photo',   description: 'Legacy', icon: ImageIcon,  maxItems: 1, hidden: true },
  { id: 'photo-text',  label: 'Photo + Text', description: 'Legacy', icon: Quote,      maxItems: 1, hidden: true },
  { id: 'two-photo',   label: 'Two Photos',   description: 'Legacy', icon: Layers,     maxItems: 2, hidden: true },
  { id: 'collage-4',   label: 'Collage',      description: 'Legacy', icon: LayoutGrid, maxItems: 4, hidden: true },
  { id: 'text-only',   label: 'Text Only',    description: 'Legacy', icon: FileText,   maxItems: 1, hidden: true },
  { id: 'month-title', label: 'Month Title',  description: 'Legacy', icon: Heading,    maxItems: 1, hidden: true },
];

export function getTemplateInfo(id: PageTemplateId): TemplateInfo {
  return PAGE_TEMPLATES.find(t => t.id === id) ?? PAGE_TEMPLATES[1];
}

/** User-pickable templates (excludes system + legacy) */
export const PICKABLE_TEMPLATES: TemplateInfo[] = PAGE_TEMPLATES.filter(t => !t.hidden);

/* ── ID generation ──────────────────────────────────────── */

let _seq = 0;
function newId(): string {
  _seq += 1;
  return `${Date.now().toString(36)}-${_seq}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ── Helpers ────────────────────────────────────────────── */

export function createEmptyPage(
  templateId: PageTemplateId,
  opts?: { heading?: string; decoration?: DecorationKind; locked?: boolean },
): BookPage {
  return {
    id: newId(),
    templateId,
    items: [],
    heading: opts?.heading,
    decoration: opts?.decoration,
    locked: opts?.locked,
  };
}

export function createPageFromItem(item: PageContentItem, templateId?: PageTemplateId): BookPage {
  const tid: PageTemplateId = templateId ?? (item.image ? 'photo-quote' : 'quote-only');
  return {
    id: newId(),
    templateId: tid,
    items: [item],
  };
}

/* ── Default starter book for newly-created projects ── */

/** Minimum interior pages for Lulu print (hardcover / softcover). */
const MIN_PAGES = 32;

/**
 * The fixed 26-page memory book template sequence.
 * All pages are locked so users cannot reorder or delete them.
 * Photos are left empty — auto-fill or manual placement fills them in later.
 */
interface Recipe {
  templateId: PageTemplateId;
  heading?: string;
  decoration?: DecorationKind;
  decoCorner?: 0 | 1 | 2 | 3;
  photoSide?: 'left' | 'right';
  blobShape?: 'pebble' | 'arch' | 'oval';
  locked?: boolean;
}

const MEMORY_BOOK_RECIPES: Recipe[] = [
  { templateId: 'title-stats',            heading: 'Hello, Baby!', locked: true },
  { templateId: 'photo-blob-quote',       decoration: 'hearts', locked: true },
  { templateId: 'grid-5-asym',            locked: true },
  { templateId: 'grid-5-asym',            locked: true },
  { templateId: 'quote-deco-photo-split', decoration: 'hearts', photoSide: 'left', locked: true },
  { templateId: 'grid-deco-corner',       decoration: 'moon-stars', decoCorner: 0, blobShape: 'oval', locked: true },
  { templateId: 'photo-sparkle',          locked: true },
  { templateId: 'grid-3-deco-text',       decoration: 'rainbow', decoCorner: 3, locked: true },
  { templateId: 'full-photo',             locked: true },
  { templateId: 'grid-9-deco-center',     decoration: 'sailboat', locked: true },
  { templateId: 'two-photo-text',         photoSide: 'right', locked: true },
  { templateId: 'quote-deco-grid-3',      decoration: 'floral', locked: true },
  { templateId: 'full-photo',             locked: true },
  { templateId: 'grid-4',                 locked: true },
  { templateId: 'grid-1big-2small-deco',  decoration: 'lion', blobShape: 'pebble', locked: true },
  { templateId: 'photo-1big-2small-text', locked: true },
  { templateId: 'full-photo',             locked: true },
  { templateId: 'quote-deco-photo-split', decoration: 'sun', photoSide: 'right', locked: true },
  { templateId: 'grid-4',                 locked: true },
  { templateId: 'full-photo',             locked: true },
  { templateId: 'grid-1big-2small-deco',  decoration: 'giraffe', blobShape: 'oval', locked: true },
  { templateId: 'photo-blob-quote',       decoration: 'cupcake', locked: true },
  { templateId: 'grid-3-top-bottom',      locked: true },
  { templateId: 'two-photo-deco-text',    decoration: 'elephant', blobShape: 'pebble', locked: true },
  { templateId: 'grid-6',                 locked: true },
  { templateId: 'grid-5-asym',            locked: true },
];

/**
 * Returns the default starter book: 26 locked memory-book template pages
 * plus padding pages to reach the 32-page Lulu minimum.
 */
export function createDefaultPages(): BookPage[] {
  const pages: BookPage[] = MEMORY_BOOK_RECIPES.map(r => {
    const page = createEmptyPage(r.templateId, {
      heading: r.heading,
      decoration: r.decoration,
      locked: r.locked,
    });
    page.decoCorner = r.decoCorner;
    page.photoSide = r.photoSide;
    page.blobShape = r.blobShape;
    return page;
  });

  // Pad to minimum page count with unlocked extra pages
  const padTemplates: PageTemplateId[] = [
    'full-photo', 'two-photo-stack', 'grid-4', 'full-photo', 'photo-quote', 'grid-6',
  ];
  const padDecos: DecorationKind[] = ['sparkles', 'hearts', 'moon-stars', 'sun', 'rainbow', 'floral'];
  while (pages.length < MIN_PAGES) {
    const i = pages.length - MEMORY_BOOK_RECIPES.length;
    const tid = padTemplates[i % padTemplates.length];
    const supportsDeco = tid === 'photo-quote';
    pages.push(createEmptyPage(tid, {
      decoration: supportsDeco ? padDecos[i % padDecos.length] : undefined,
    }));
  }

  return pages;
}
