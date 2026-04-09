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
}

export interface SessionInfo {
  email: string;
  createdAt: string;
}

export type FilterType = 'all' | '😍' | '😐' | '😖';
