import type { PageTemplateId, BookPage, PageContentItem } from '@/types';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Image, AlignLeft, Columns2, LayoutGrid, FileText, Heading,
} from 'lucide-react';

/* ── Template metadata ───────────────────────────────────── */

export interface TemplateInfo {
  id: PageTemplateId;
  label: string;
  description: string;
  icon: ComponentType<LucideProps>;
  maxItems: number;
}

export const PAGE_TEMPLATES: TemplateInfo[] = [
  { id: 'full-bleed', label: 'Full Photo', description: 'Single photo fills the page', icon: Image, maxItems: 1 },
  { id: 'photo-text', label: 'Photo + Text', description: 'Photo on top, text below', icon: AlignLeft, maxItems: 1 },
  { id: 'two-photo', label: 'Two Photos', description: 'Side-by-side photos', icon: Columns2, maxItems: 2 },
  { id: 'collage-4', label: 'Collage', description: '2x2 grid of photos', icon: LayoutGrid, maxItems: 4 },
  { id: 'text-only', label: 'Text Only', description: 'Full text page', icon: FileText, maxItems: 1 },
  { id: 'month-title', label: 'Month Title', description: 'Month heading with optional photo', icon: Heading, maxItems: 1 },
];

export function getTemplateInfo(id: PageTemplateId): TemplateInfo {
  return PAGE_TEMPLATES.find(t => t.id === id) ?? PAGE_TEMPLATES[0];
}

/* ── Preview renderers (React components for on-screen preview) ── */

interface PagePreviewProps {
  page: BookPage;
  compact?: boolean;
}

export function PagePreview({ page, compact = false }: PagePreviewProps) {
  const items = page.items;
  const h = compact ? 'h-32' : 'h-64';

  switch (page.templateId) {
    case 'full-bleed':
      return (
        <div className={`${h} w-full bg-white rounded-lg overflow-hidden relative`}>
          {items[0]?.image ? (
            <img src={items[0].image} alt={items[0].title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-theme-accent/20">
              <Image size={compact ? 20 : 32} className="text-theme-muted" />
            </div>
          )}
          {items[0]?.title && !compact && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-sm font-semibold truncate">{items[0].title}</p>
            </div>
          )}
        </div>
      );

    case 'photo-text':
      return (
        <div className={`${h} w-full bg-white rounded-lg overflow-hidden flex flex-col`}>
          <div className="flex-1 min-h-0">
            {items[0]?.image ? (
              <img src={items[0].image} alt={items[0].title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-theme-accent/20">
                <Image size={compact ? 16 : 24} className="text-theme-muted" />
              </div>
            )}
          </div>
          <div className={`${compact ? 'p-1.5' : 'p-3'} shrink-0`}>
            <p className={`font-semibold text-theme-text ${compact ? 'text-[8px]' : 'text-sm'} truncate`}>
              {items[0]?.title || 'Title'}
            </p>
            {!compact && items[0]?.text && (
              <p className="text-xs text-theme-muted mt-0.5 line-clamp-2">{items[0].text}</p>
            )}
          </div>
        </div>
      );

    case 'two-photo':
      return (
        <div className={`${h} w-full bg-white rounded-lg overflow-hidden flex gap-0.5`}>
          {[0, 1].map(i => (
            <div key={i} className="flex-1 min-w-0">
              {items[i]?.image ? (
                <img src={items[i].image} alt={items[i]?.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-theme-accent/20">
                  <Image size={compact ? 14 : 20} className="text-theme-muted" />
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case 'collage-4':
      return (
        <div className={`${h} w-full bg-white rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 gap-0.5`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="min-w-0 min-h-0">
              {items[i]?.image ? (
                <img src={items[i].image} alt={items[i]?.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-theme-accent/20">
                  <Image size={compact ? 10 : 16} className="text-theme-muted" />
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case 'text-only':
      return (
        <div className={`${h} w-full bg-white rounded-lg overflow-hidden ${compact ? 'p-2' : 'p-4'} flex flex-col justify-center`}>
          <p className={`font-semibold text-theme-text ${compact ? 'text-[8px]' : 'text-base'} truncate`}>
            {page.heading || items[0]?.title || 'Heading'}
          </p>
          <p className={`text-theme-muted ${compact ? 'text-[6px] line-clamp-3' : 'text-sm line-clamp-6'} mt-1`}>
            {items[0]?.text || 'Your text here...'}
          </p>
        </div>
      );

    case 'month-title':
      return (
        <div className={`${h} w-full bg-white rounded-lg overflow-hidden flex flex-col items-center justify-center ${compact ? 'p-2' : 'p-6'}`}>
          {items[0]?.image && (
            <div className={`${compact ? 'w-8 h-8' : 'w-16 h-16'} rounded-full overflow-hidden mb-2`}>
              <img src={items[0].image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <p className={`font-bold text-theme-text ${compact ? 'text-[9px]' : 'text-xl'} text-center`}>
            {page.heading || 'Month Title'}
          </p>
        </div>
      );
  }
}

/* ── Helper: create an empty page from template ── */

export function createEmptyPage(templateId: PageTemplateId, heading?: string): BookPage {
  const items: PageContentItem[] = [];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    templateId,
    items,
    heading,
  };
}

/* ── Helper: create page from content item ── */

export function createPageFromItem(item: PageContentItem, templateId?: PageTemplateId): BookPage {
  const tid = templateId ?? (item.image ? 'photo-text' : 'text-only');
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    templateId: tid,
    items: [item],
    heading: undefined,
  };
}
