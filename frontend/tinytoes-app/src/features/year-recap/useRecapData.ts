import { useMemo } from 'react';
import type {
  FoodEntry,
  Milestone,
  JournalEntry,
  BabyProfile,
  ProductSlug,
} from '@/types';

/* ── Unified timeline item for recent activity ──────────── */

export interface TimelineItem {
  id: string;
  type: 'food' | 'milestone' | 'journal';
  title: string;
  subtitle: string;
  image: string | null;
  timestamp: number;
  data: FoodEntry | Milestone | JournalEntry;
}

/* ── Dashboard data shape ───────────────────────────────── */

export interface DashboardData {
  profile: BabyProfile;
  hasAnyData: boolean;

  /* Hero */
  journeyDays: number;
  firstEntryDate: number | null;

  /* Fun counters */
  totalFoods: number;
  totalMilestones: number;
  totalJournalMonths: number;
  totalPhotos: number;
  loggingStreak: number;

  /* Activity timeline (all types combined, sorted newest first) */
  recentActivity: TimelineItem[];

  /* Photo collage (entries with photos, newest first) */
  photoMemories: TimelineItem[];

  /* Insights */
  insights: Insight[];
}

export interface Insight {
  icon: 'smile' | 'flame' | 'calendar' | 'camera' | 'trophy' | 'utensils' | 'book' | 'sparkles';
  text: string;
}

/* ── Helpers ─────────────────────────────────────────────── */

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

function monthLabel(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function toTimelineItem(type: 'food', e: FoodEntry): TimelineItem;
function toTimelineItem(type: 'milestone', e: Milestone): TimelineItem;
function toTimelineItem(type: 'journal', e: JournalEntry): TimelineItem;
function toTimelineItem(type: 'food' | 'milestone' | 'journal', e: FoodEntry | Milestone | JournalEntry): TimelineItem {
  switch (type) {
    case 'food': {
      const f = e as FoodEntry;
      return { id: f.id, type: 'food', title: f.food, subtitle: f.reaction === 'loved' ? 'Loved it' : f.reaction === 'neutral' ? 'Meh' : 'No thanks', image: f.image, timestamp: f.createdAt, data: f };
    }
    case 'milestone': {
      const m = e as Milestone;
      return { id: m.id, type: 'milestone', title: m.title, subtitle: new Date(m.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), image: m.image, timestamp: m.achievedAt, data: m };
    }
    case 'journal': {
      const j = e as JournalEntry;
      const [y, mo] = j.monthKey.split('-').map(Number);
      const monthName = new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { id: j.id, type: 'journal', title: j.monthLabel, subtitle: monthName, image: j.image, timestamp: j.createdAt, data: j };
    }
  }
}

/* ── Hook ────────────────────────────────────────────────── */

export function useRecapData(
  profile: BabyProfile,
  entries: FoodEntry[],
  milestones: Milestone[],
  journalEntries: JournalEntry[],
  hasProduct: (slug: ProductSlug) => boolean,
): DashboardData {
  return useMemo(() => {
    const hasFoods = hasProduct('first-foods');
    const hasMilestones = hasProduct('milestones');
    const hasJournal = hasProduct('monthly-journal');

    /* Build unified timeline */
    const allItems: TimelineItem[] = [];
    if (hasFoods) entries.forEach(e => allItems.push(toTimelineItem('food', e)));
    if (hasMilestones) milestones.forEach(m => allItems.push(toTimelineItem('milestone', m)));
    if (hasJournal) journalEntries.forEach(j => allItems.push(toTimelineItem('journal', j)));

    allItems.sort((a, b) => b.timestamp - a.timestamp); // newest first

    const recentActivity = allItems.slice(0, 15);
    const photoMemories = allItems.filter(i => i.image).slice(0, 9);

    /* Journey stats */
    const allTimestamps = allItems.map(i => i.timestamp);
    const earliest = allTimestamps.length > 0 ? Math.min(...allTimestamps) : null;
    const latest = allTimestamps.length > 0 ? Math.max(...allTimestamps) : null;
    const journeyDays = earliest && latest ? Math.max(1, Math.round((latest - earliest) / 86_400_000)) : 0;

    const totalFoods = hasFoods ? entries.length : 0;
    const totalMilestones = hasMilestones ? milestones.length : 0;
    const totalJournalMonths = hasJournal ? journalEntries.length : 0;
    const totalPhotos = allItems.filter(i => i.image).length;
    const streak = hasFoods ? longestStreak(entries) : 0;

    /* Build insights */
    const insights: Insight[] = [];

    if (hasFoods && entries.length > 0) {
      // Favorite food
      const foodCounts: Record<string, number> = {};
      entries.filter(e => e.reaction === 'loved').forEach(e => { foodCounts[e.food] = (foodCounts[e.food] || 0) + 1; });
      const topFood = Object.entries(foodCounts).sort((a, b) => b[1] - a[1])[0];
      if (topFood) {
        insights.push({
          icon: 'smile',
          text: topFood[1] > 1
            ? `${topFood[0]} is the #1 favorite — loved ${topFood[1]} times!`
            : `${topFood[0]} is the top favorite!`,
        });
      }

      // Streak
      if (streak > 1) {
        insights.push({ icon: 'flame', text: `${streak}-day logging streak — impressive consistency!` });
      }

      // Busiest month
      const byMonth: Record<string, number> = {};
      entries.forEach(e => { const m = monthLabel(e.createdAt); byMonth[m] = (byMonth[m] || 0) + 1; });
      const busiest = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0];
      if (busiest && busiest[1] > 2) {
        insights.push({ icon: 'calendar', text: `${busiest[0]} was the busiest month with ${busiest[1]} foods tried` });
      }

      // Reaction breakdown
      const loved = entries.filter(e => e.reaction === 'loved').length;
      const pct = Math.round((loved / entries.length) * 100);
      if (pct >= 50) {
        insights.push({ icon: 'sparkles', text: `${pct}% of foods were loved — what an adventurous eater!` });
      }
    }

    if (hasMilestones && milestones.length > 0) {
      const latest = [...milestones].sort((a, b) => b.achievedAt - a.achievedAt)[0];
      insights.push({
        icon: 'trophy',
        text: `Latest milestone: "${latest.title}" — ${new Date(latest.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      });
    }

    if (totalPhotos > 0) {
      insights.push({ icon: 'camera', text: `${totalPhotos} photo${totalPhotos !== 1 ? 's' : ''} captured across the journey` });
    }

    if (hasJournal && journalEntries.length > 0) {
      const totalHighlights = journalEntries.reduce((sum, j) => sum + j.highlights.length, 0);
      if (totalHighlights > 0) {
        insights.push({ icon: 'book', text: `${totalHighlights} highlights recorded across ${journalEntries.length} month${journalEntries.length !== 1 ? 's' : ''}` });
      }
    }

    return {
      profile,
      hasAnyData: allItems.length > 0,
      journeyDays,
      firstEntryDate: earliest,
      totalFoods,
      totalMilestones,
      totalJournalMonths,
      totalPhotos,
      loggingStreak: streak,
      recentActivity,
      photoMemories,
      insights,
    };
  }, [profile, entries, milestones, journalEntries, hasProduct]);
}
