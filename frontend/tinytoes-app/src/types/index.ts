export type Reaction = 'loved' | 'neutral' | 'disliked';

export type ReactionLabel = 'Loved it' | 'Meh' | 'No thanks';

export const REACTIONS: { key: Reaction; label: ReactionLabel }[] = [
  { key: 'loved', label: 'Loved it' },
  { key: 'neutral', label: 'Meh' },
  { key: 'disliked', label: 'No thanks' },
];

/** Map legacy emoji values to new string keys (for IDB migration + import) */
export const EMOJI_TO_REACTION: Record<string, Reaction> = {
  '\u{1F60D}': 'loved',   // 😍
  '\u{1F610}': 'neutral', // 😐
  '\u{1F616}': 'disliked', // 😖
};

export type AgeRange = '4–6 months' | '6–9 months' | '9–12 months' | '12+ months';

export const AGE_RANGES: AgeRange[] = [
  '4–6 months',
  '6–9 months',
  '9–12 months',
  '12+ months',
];

export type ThemeName = 'Neutral' | 'Soft Pastel' | 'Playful';

export interface BabyProfile {
  name: string;
  ageRange: AgeRange;
  theme: ThemeName;
  photo: string | null;
  onboardingComplete: boolean;
}

export interface FoodEntry {
  id: string;
  food: string;
  reaction: Reaction;
  notes: string;
  image: string | null;
  createdAt: number;
}

export interface AppData {
  profile: BabyProfile;
  entries: FoodEntry[];
  milestones?: Milestone[];
  journal?: JournalEntry[];
}

export interface SessionInfo {
  email: string;
  createdAt: string;
}

export type ProductSlug =
  | 'first-foods'
  | 'milestones'
  | 'monthly-journal'
  | 'first-year-bundle';

/** Core purchasable product slugs (Memory Book & Year Recap are free features) */
export const CORE_PRODUCT_SLUGS: ProductSlug[] = ['first-foods', 'milestones', 'monthly-journal'];

export interface Product {
  slug: ProductSlug;
  name: string;
  description: string;
  priceUsd: number;
  isBundle: boolean;
  bundleIncludes: string | null;
  isAvailable: boolean;
}

export interface EntitlementsResponse {
  products: string[];
}

export type FilterType = 'all' | 'loved' | 'neutral' | 'disliked';

// --- Print Book Types ---

export type PrintProductSlug = 'print-softcover' | 'print-hardcover' | 'print-premium';

export interface PrintProduct {
  slug: PrintProductSlug;
  name: string;
  description: string;
  basePriceUsd: number;
  luluPodPackageId: string;
  minPages: number;
  maxPages: number;
}

export type PageTemplateId =
  // Locked / system
  | 'blank-locked'
  // Hero / opening
  | 'title-stats'
  // Photo-driven
  | 'full-photo'
  | 'photo-quote'
  | 'two-photo-stack'
  | 'grid-4'
  | 'grid-6'
  | 'polaroid'
  // Text-driven
  | 'quote-only'
  // Legacy (kept for back-compat with existing projects)
  | 'full-bleed'
  | 'photo-text'
  | 'two-photo'
  | 'collage-4'
  | 'text-only'
  | 'month-title';

/** Decoration mascot/motif for photo-quote and quote-only pages */
export type DecorationKind =
  | 'sparkles'
  | 'hearts'
  | 'moon-stars'
  | 'sun'
  | 'rainbow'
  | 'sailboat'
  | 'lion'
  | 'giraffe'
  | 'elephant'
  | 'cupcake'
  | 'floral'
  | 'angel';

/** Per-image positioning when an image fills its slot (object-fit: cover).
 * Offsets are percentages (-50..50) relative to slot center; scale 1+. */
export interface ImageOffset {
  x: number;
  y: number;
  scale: number;
}

export interface PageContentItem {
  /** Source item type */
  sourceType: 'food' | 'milestone' | 'journal' | 'custom';
  /** ID of the source item in IndexedDB */
  sourceId: string;
  /** Snapshot of the image data URL (may be null) */
  image: string | null;
  /** Display title */
  title: string;
  /** Subtitle / date string */
  subtitle: string;
  /** Body text (notes, journal text, etc.) */
  text: string;
  /** Optional pan/zoom offset for the filled image */
  imageOffset?: ImageOffset;
}

export interface BookPage {
  id: string;
  templateId: PageTemplateId;
  /** Content items placed on this page (1-4 depending on template) */
  items: PageContentItem[];
  /** Optional custom caption / heading override */
  heading?: string;
  /** Decoration motif applied to this page (if template supports it) */
  decoration?: DecorationKind;
  /** Locked pages cannot be edited, deleted, or reordered */
  locked?: boolean;
  /** Optional birth-stats payload (used by title-stats template) */
  stats?: {
    birthDate?: string;   // ISO date or "August 1, 2026"
    birthTime?: string;   // "9:42 am"
    weight?: string;      // "7 lb 4 oz"
    length?: string;      // "20 in"
  };
}

export type CoverTheme = 'classic' | 'pastel' | 'playful';

export interface CoverConfig {
  babyName: string;
  year: string;
  theme: CoverTheme;
  /** Baby profile photo data URL for cover */
  photo: string | null;
}

export interface BookProject {
  id: string;
  name: string;
  cover: CoverConfig;
  pages: BookPage[];
  /** Selected print SKU slug (null = not chosen yet) */
  skuSlug: PrintProductSlug | null;
  createdAt: number;
  updatedAt: number;
}

// --- Print Order Types ---

export type PrintOrderStatus =
  | 'created'
  | 'uploading'
  | 'unpaid'
  | 'payment_in_progress'
  | 'production_ready'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'error';

export interface PrintOrder {
  token: string;
  status: PrintOrderStatus;
  productName: string;
  pageCount: number;
  totalPriceUsd: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingOption {
  level: string;
  name: string;
  costUsd: number;
  estimatedDays: string;
}

export interface CostEstimate {
  baseCost: number;
  totalCost: number;
  currency: string;
  pageCount: number;
}

// --- Milestones ---

export type MilestoneCategory =
  | 'motor'
  | 'social'
  | 'language'
  | 'cognitive'
  | 'feeding'
  | 'other';

export const MILESTONE_CATEGORIES: { value: MilestoneCategory; label: string; icon: string }[] = [
  { value: 'motor', label: 'Motor', icon: 'activity' },
  { value: 'social', label: 'Social', icon: 'heart' },
  { value: 'language', label: 'Language', icon: 'message-circle' },
  { value: 'cognitive', label: 'Cognitive', icon: 'brain' },
  { value: 'feeding', label: 'Feeding', icon: 'baby' },
  { value: 'other', label: 'Other', icon: 'star' },
];

export interface Milestone {
  id: string;
  title: string;
  category: MilestoneCategory;
  achievedAt: number; // timestamp
  notes: string;
  image: string | null;
  createdAt: number;
}

// --- Monthly Journal ---

export interface JournalEntry {
  id: string;
  monthKey: string; // "2026-01", "2026-02", etc.
  monthLabel: string; // "Month 1", "Month 2", etc.
  text: string;
  highlights: string[]; // short highlight items
  /** @deprecated Use `images`. Kept for back-compat with older entries. */
  image: string | null;
  /** Multiple photos per month (preferred). First image acts as cover. */
  images?: string[];
  createdAt: number;
  updatedAt: number;
}

/** Returns all images for a journal entry, merging legacy `image` with new `images[]`. */
export function getJournalImages(entry: JournalEntry): string[] {
  const all = entry.images ? [...entry.images] : [];
  if (entry.image && !all.includes(entry.image)) all.unshift(entry.image);
  return all;
}

/** Returns ms timestamp for the start of the month referenced by a journal entry's monthKey. */
export function journalEntryDateMs(entry: JournalEntry): number {
  const [year, month] = entry.monthKey.split('-').map(Number);
  if (!year || !month) return entry.createdAt;
  return new Date(year, month - 1, 1).getTime();
}
