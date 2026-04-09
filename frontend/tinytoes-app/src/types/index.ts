export type Reaction = '😍' | '😐' | '😖';

export type ReactionLabel = 'Loved it' | 'Not sure' | 'No thanks';

export const REACTIONS: { emoji: Reaction; label: ReactionLabel }[] = [
  { emoji: '😍', label: 'Loved it' },
  { emoji: '😐', label: 'Not sure' },
  { emoji: '😖', label: 'No thanks' },
];

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
  | 'memory-book'
  | 'year-recap'
  | 'first-year-bundle';

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

export type FilterType = 'all' | '😍' | '😐' | '😖';

// --- Milestones ---

export type MilestoneCategory =
  | 'motor'
  | 'social'
  | 'language'
  | 'cognitive'
  | 'feeding'
  | 'other';

export const MILESTONE_CATEGORIES: { value: MilestoneCategory; label: string; icon: string }[] = [
  { value: 'motor', label: 'Motor', icon: '🏃' },
  { value: 'social', label: 'Social', icon: '😊' },
  { value: 'language', label: 'Language', icon: '🗣️' },
  { value: 'cognitive', label: 'Cognitive', icon: '🧠' },
  { value: 'feeding', label: 'Feeding', icon: '🍼' },
  { value: 'other', label: 'Other', icon: '⭐' },
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
