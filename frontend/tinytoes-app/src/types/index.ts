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
  image: string | null;
  createdAt: number;
  updatedAt: number;
}
