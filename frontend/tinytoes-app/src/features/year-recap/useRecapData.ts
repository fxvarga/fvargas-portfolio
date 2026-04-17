import { useMemo } from 'react';
import type {
  FoodEntry,
  Milestone,
  JournalEntry,
  BabyProfile,
  Reaction,
  MilestoneCategory,
  ProductSlug,
} from '@/types';

/* ── Derived data shapes ────────────────────────────────── */

export interface FoodRecap {
  total: number;
  loved: number;
  neutral: number;
  disliked: number;
  firstFood: FoodEntry | null;
  favoriteFood: string | null;
  /** Top 5 loved foods */
  topFoods: string[];
  /** { monthLabel: count } */
  byMonth: Record<string, number>;
  /** Longest consecutive-day streak of logging */
  streak: number;
}

export interface MilestoneRecap {
  total: number;
  byCategory: Record<MilestoneCategory, number>;
  firstMilestone: Milestone | null;
  latestMilestone: Milestone | null;
  /** Milestones sorted chronologically */
  timeline: Milestone[];
}

export interface JournalRecap {
  totalMonths: number;
  totalHighlights: number;
  /** All highlights collected across months */
  highlights: string[];
  /** A single representative excerpt from the longest entry */
  excerpt: string | null;
  entries: JournalEntry[];
}

export interface StatsRecap {
  /** Month with the most food entries */
  busiestFoodMonth: string | null;
  /** Total days between first and latest entry */
  journeyDays: number;
  /** Average foods logged per week */
  foodsPerWeek: number;
  /** Most common reaction */
  dominantReaction: Reaction | null;
  /** Total photos across all modules */
  totalPhotos: number;
}

export interface RecapData {
  profile: BabyProfile;
  food: FoodRecap | null;
  milestones: MilestoneRecap | null;
  journal: JournalRecap | null;
  stats: StatsRecap;
  hasAnyData: boolean;
}

/* ── Helpers ─────────────────────────────────────────────── */

function monthLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function longestStreak(entries: FoodEntry[]): number {
  if (entries.length === 0) return 0;
  const days = [...new Set(entries.map(e => dayKey(e.createdAt)))].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
    if (diff <= 1) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

function topFoodsByReaction(entries: FoodEntry[], reaction: Reaction, limit: number): string[] {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    if (e.reaction === reaction) {
      counts[e.food] = (counts[e.food] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([food]) => food);
}

/* ── Hook ────────────────────────────────────────────────── */

export function useRecapData(
  profile: BabyProfile,
  entries: FoodEntry[],
  milestones: Milestone[],
  journalEntries: JournalEntry[],
  hasProduct: (slug: ProductSlug) => boolean,
): RecapData {
  return useMemo(() => {
    const hasFoods = hasProduct('first-foods');
    const hasMilestones = hasProduct('milestones');
    const hasJournal = hasProduct('monthly-journal');

    /* ── Food Recap ──────────────────────────────── */
    let food: FoodRecap | null = null;
    if (hasFoods && entries.length > 0) {
      const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
      const byMonth: Record<string, number> = {};
      for (const e of sorted) {
        const m = monthLabel(e.createdAt);
        byMonth[m] = (byMonth[m] || 0) + 1;
      }
      const top = topFoodsByReaction(entries, 'loved', 5);
      food = {
        total: entries.length,
        loved: entries.filter(e => e.reaction === 'loved').length,
        neutral: entries.filter(e => e.reaction === 'neutral').length,
        disliked: entries.filter(e => e.reaction === 'disliked').length,
        firstFood: sorted[0],
        favoriteFood: top[0] ?? null,
        topFoods: top,
        byMonth,
        streak: longestStreak(sorted),
      };
    }

    /* ── Milestone Recap ─────────────────────────── */
    let milestoneRecap: MilestoneRecap | null = null;
    if (hasMilestones && milestones.length > 0) {
      const sorted = [...milestones].sort((a, b) => a.achievedAt - b.achievedAt);
      const byCategory = {
        motor: 0, social: 0, language: 0, cognitive: 0, feeding: 0, other: 0,
      } as Record<MilestoneCategory, number>;
      for (const m of milestones) byCategory[m.category]++;
      milestoneRecap = {
        total: milestones.length,
        byCategory,
        firstMilestone: sorted[0],
        latestMilestone: sorted[sorted.length - 1],
        timeline: sorted,
      };
    }

    /* ── Journal Recap ───────────────────────────── */
    let journal: JournalRecap | null = null;
    if (hasJournal && journalEntries.length > 0) {
      const sorted = [...journalEntries].sort(
        (a, b) => a.monthKey.localeCompare(b.monthKey),
      );
      const allHighlights = sorted.flatMap(e => e.highlights);
      const longest = sorted.reduce((a, b) => (b.text.length > a.text.length ? b : a));
      const excerpt = longest.text.length > 0
        ? longest.text.slice(0, 160) + (longest.text.length > 160 ? '...' : '')
        : null;
      journal = {
        totalMonths: sorted.length,
        totalHighlights: allHighlights.length,
        highlights: allHighlights.slice(0, 12),
        excerpt,
        entries: sorted,
      };
    }

    /* ── Aggregate Stats ─────────────────────────── */
    const allTimestamps = [
      ...entries.map(e => e.createdAt),
      ...milestones.map(m => m.achievedAt),
      ...journalEntries.map(j => j.createdAt),
    ];
    const earliest = allTimestamps.length > 0 ? Math.min(...allTimestamps) : Date.now();
    const latest = allTimestamps.length > 0 ? Math.max(...allTimestamps) : Date.now();
    const journeyDays = Math.max(1, Math.round((latest - earliest) / 86_400_000));

    let busiestFoodMonth: string | null = null;
    if (food) {
      const best = Object.entries(food.byMonth).sort((a, b) => b[1] - a[1])[0];
      busiestFoodMonth = best ? best[0] : null;
    }

    const reactions = { loved: food?.loved ?? 0, neutral: food?.neutral ?? 0, disliked: food?.disliked ?? 0 };
    const dominant = Object.entries(reactions).sort((a, b) => b[1] - a[1])[0];
    const dominantReaction = dominant && dominant[1] > 0 ? (dominant[0] as Reaction) : null;

    const totalPhotos = [
      ...entries.filter(e => e.image),
      ...milestones.filter(m => m.image),
      ...journalEntries.filter(j => j.image),
    ].length;

    const weeks = journeyDays / 7;
    const foodsPerWeek = weeks > 0 ? Math.round((entries.length / weeks) * 10) / 10 : 0;

    const stats: StatsRecap = {
      busiestFoodMonth,
      journeyDays,
      foodsPerWeek,
      dominantReaction,
      totalPhotos,
    };

    const hasAnyData = entries.length > 0 || milestones.length > 0 || journalEntries.length > 0;

    return { profile, food, milestones: milestoneRecap, journal, stats, hasAnyData };
  }, [profile, entries, milestones, journalEntries, hasProduct]);
}
