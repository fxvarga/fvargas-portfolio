import type { ComponentType } from 'react';
import {
  UtensilsCrossed,
  Trophy,
  BookOpen,
  Gift,
  Package,
  BarChart3,
  type LucideProps,
} from 'lucide-react';

export interface ProductMeta {
  icon: ComponentType<LucideProps>;
  highlights: string[];
}

export const PRODUCT_META: Record<string, ProductMeta> = {
  'first-foods': {
    icon: UtensilsCrossed,
    highlights: ['Track every first bite', 'Photo entries & reactions', 'Works offline as a PWA'],
  },
  milestones: {
    icon: Trophy,
    highlights: ['First smile to first steps', 'Photo + date tracking', 'Category organization'],
  },
  'monthly-journal': {
    icon: BookOpen,
    highlights: ['Month-by-month memories', 'Photos & written entries', 'Highlight tags'],
  },
  'first-year-bundle': {
    icon: Gift,
    highlights: ['All 3 core products included', 'Save over 30%', 'Memory Book & Year Recap included free'],
  },
};

export function getProductIcon(slug: string): ComponentType<LucideProps> {
  return PRODUCT_META[slug]?.icon ?? Package;
}

export function getProductHighlights(slug: string): string[] {
  return PRODUCT_META[slug]?.highlights ?? [];
}

/** Icon for year recap info items */
export const RECAP_ITEM_ICONS: Record<string, ComponentType<LucideProps>> = {
  'Food Journey': UtensilsCrossed,
  'Milestone Timeline': Trophy,
  'Monthly Highlights': BookOpen,
  'Stats & Insights': BarChart3,
};
