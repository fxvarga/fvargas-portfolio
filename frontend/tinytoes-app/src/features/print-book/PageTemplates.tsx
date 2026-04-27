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

/**
 * Returns a 32-page (Lulu print minimum) starter book with a curated mix of
 * templates and decorations. Page 1 is a locked blank flyleaf, page 2 is the
 * title/stats page, page 32 is a closing quote, and the rest cycle through
 * photo, polaroid, grid, and quote layouts.
 */
export function createDefaultPages(): BookPage[] {
  type Recipe = { templateId: PageTemplateId; heading?: string; decoration?: DecorationKind; locked?: boolean };

  const decoCycle: DecorationKind[] = ['sparkles', 'moon-stars', 'rainbow', 'sun', 'hearts', 'floral'];
  // Templates to cycle through for the "story" pages between the front matter and closing.
  const storyCycle: PageTemplateId[] = [
    'full-photo',
    'photo-quote',
    'two-photo-stack',
    'photo-quote',
    'grid-4',
    'full-photo',
    'polaroid',
    'photo-quote',
    'two-photo-stack',
    'grid-6',
  ];

  const recipes: Recipe[] = [
    // 1. Locked blank flyleaf
    { templateId: 'blank-locked', locked: true },
    // 2. Title page with birth stats
    { templateId: 'title-stats', heading: 'Hello, Baby!' },
  ];

  // Pages 3..30 = 28 story pages cycling through templates + decorations.
  for (let i = 0; i < 28; i++) {
    const tid = storyCycle[i % storyCycle.length];
    const supportsDeco =
      tid === 'photo-quote' || tid === 'quote-only' || tid === 'polaroid';
    recipes.push({
      templateId: tid,
      decoration: supportsDeco ? decoCycle[i % decoCycle.length] : undefined,
    });
  }

  // 31. Closing quote
  recipes.push({ templateId: 'quote-only', decoration: 'floral' });
  // 32. Locked blank back flyleaf
  recipes.push({ templateId: 'blank-locked', locked: true });

  return recipes.map(r => createEmptyPage(r.templateId, r));
}
