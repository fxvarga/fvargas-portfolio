import { useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useEntries } from '@/hooks/useEntries';
import { useMilestones } from '@/hooks/useMilestones';
import { useJournal } from '@/hooks/useJournal';
import { ModuleNavBar } from '@/components/ModuleNavBar';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { SegmentedControl } from '@/components/SegmentedControl';
import { MemorySlideshow, type SlideItem } from '@/components/MemorySlideshow';
import { PrintTab } from '@/features/print-book/PrintTab';
import {
  BookOpen, Printer, Smile, Meh, Frown, UtensilsCrossed,
  Trophy, BookText, Activity, Heart, MessageCircle, Brain,
  Baby, Star,
} from 'lucide-react';
import {
  REACTIONS, MILESTONE_CATEGORIES,
  type FoodEntry, type Milestone, type JournalEntry, type Reaction,
} from '@/types';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

/* ── Constants ──────────────────────────────────────────── */

const REACTION_ICONS: Record<Reaction, ComponentType<LucideProps>> = {
  loved: Smile,
  neutral: Meh,
  disliked: Frown,
};

const CATEGORY_ICONS: Record<string, ComponentType<LucideProps>> = {
  activity: Activity,
  heart: Heart,
  'message-circle': MessageCircle,
  brain: Brain,
  baby: Baby,
  star: Star,
};

type ItemFilter = 'all' | 'foods' | 'milestones' | 'journal';

const FILTERS: { label: string; icon: ComponentType<LucideProps> | null; value: ItemFilter }[] = [
  { label: 'All', icon: null, value: 'all' },
  { label: 'Foods', icon: UtensilsCrossed, value: 'foods' },
  { label: 'Milestones', icon: Trophy, value: 'milestones' },
  { label: 'Journal', icon: BookText, value: 'journal' },
];

/* ── Unified timeline item ──────────────────────────────── */

type TimelineItem =
  | { type: 'food'; data: FoodEntry; timestamp: number }
  | { type: 'milestone'; data: Milestone; timestamp: number }
  | { type: 'journal'; data: JournalEntry; timestamp: number };

interface MonthGroup {
  key: string;
  label: string;
  items: TimelineItem[];
}

function buildTimeline(
  entries: FoodEntry[],
  milestones: Milestone[],
  journalEntries: JournalEntry[],
  filter: ItemFilter,
): MonthGroup[] {
  const items: TimelineItem[] = [];

  if (filter === 'all' || filter === 'foods') {
    for (const e of entries) items.push({ type: 'food', data: e, timestamp: e.createdAt });
  }
  if (filter === 'all' || filter === 'milestones') {
    for (const m of milestones) items.push({ type: 'milestone', data: m, timestamp: m.achievedAt });
  }
  if (filter === 'all' || filter === 'journal') {
    for (const j of journalEntries) {
      // Use monthKey (e.g. "2026-01") to derive timestamp for correct chronological placement
      const [year, month] = j.monthKey.split('-').map(Number);
      items.push({ type: 'journal', data: j, timestamp: new Date(year, month - 1, 1).getTime() });
    }
  }

  // Sort ascending (earliest first for a book)
  items.sort((a, b) => a.timestamp - b.timestamp);

  // Group by month
  const groups = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const d = new Date(item.timestamp);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: new Date(items[0].timestamp).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    }),
    items,
  }));
}

/* ── Page ────────────────────────────────────────────────── */

export function MemoryBookPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const { entries } = useEntries();
  const { milestones } = useMilestones();
  const { entries: journalEntries } = useJournal();
  const [filter, setFilter] = useState<ItemFilter>('all');
  const [slideshowIndex, setSlideshowIndex] = useState<number | null>(null);
  const savedTab = sessionStorage.getItem('memoryBookTab') as 'timeline' | 'print' | null;
  const initialTab = savedTab ?? ((location.state as { tab?: string } | null)?.tab === 'print' ? 'print' : 'timeline');
  const [activeTab, setActiveTab] = useState<'timeline' | 'print'>(initialTab);

  const handleTabChange = (tab: 'timeline' | 'print') => {
    setActiveTab(tab);
    sessionStorage.setItem('memoryBookTab', tab);
  };

  const canPrint = true; // Print books available to all users; checkout grants bundle if needed

  const totalItems = entries.length + milestones.length + journalEntries.length;

  const months = useMemo(
    () => buildTimeline(entries, milestones, journalEntries, filter),
    [entries, milestones, journalEntries, filter],
  );

  // Flat list of all visible items for the slideshow
  const allSlideItems = useMemo<SlideItem[]>(
    () => months.flatMap(m => m.items.map(item => ({ type: item.type, data: item.data }) as SlideItem)),
    [months],
  );

  // Open slideshow at a specific item by its id and type
  const openSlideshow = useCallback((itemType: string, itemId: string) => {
    const idx = allSlideItems.findIndex(s => s.type === itemType && s.data.id === itemId);
    if (idx >= 0) setSlideshowIndex(idx);
  }, [allSlideItems]);

  const handlePrint = () => window.print();

  const printButton = totalItems > 0 && canPrint ? (
    <button
      onClick={handlePrint}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 text-theme-muted"
      aria-label="Print"
    >
      <Printer size={22} />
    </button>
  ) : undefined;

  return (
    <PageShell>
      <PageHeader title="Memory Book" actions={printButton} />
      <ModuleNavBar activeSlug="memory-book" />

      {/* Tab switcher */}
      {canPrint && (
        <div className="px-4 pb-3">
          <SegmentedControl
            options={[
              { value: 'timeline' as const, label: 'Timeline' },
              { value: 'print' as const, label: 'Print' },
            ]}
            value={activeTab}
            onChange={handleTabChange}
          />
        </div>
      )}

      {activeTab === 'print' && canPrint ? (
        <PrintTab />
      ) : (
      <>
      {/* Print header (hidden on screen) */}
      <div className="print-header hidden">
        <h1 className="text-theme-text">{profile.name}'s Memory Book</h1>
        <p>Foods, milestones, and memories</p>
      </div>

      {/* Filter pills */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                filter === f.value
                  ? 'bg-theme-primary text-white'
                  : 'bg-theme-panel text-theme-text hover:bg-black/5'
              }`}
            >
              {f.icon && <f.icon size={12} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-8">
        {totalItems === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Your memory book is empty"
            subtitle="Start adding entries, milestones, or journal reflections to see them collected here."
            action={
              <Button onClick={() => navigate('/home')}>
                Go to First Foods
              </Button>
            }
          />
        ) : months.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No entries for this filter"
            subtitle="Try a different filter to see your memories."
          />
        ) : (
          <div className="space-y-8">
            {months.map((month, monthIndex) => (
              <section
                key={month.key}
                className={monthIndex > 0 ? 'print-page-break' : ''}
              >
                {/* Month heading */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-theme-text">
                    {month.label}
                  </h2>
                  <div className="flex-1 h-px bg-theme-accent" />
                  <span className="text-sm font-medium text-theme-muted">
                    {month.items.length} {month.items.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {month.items.map(item => {
                    switch (item.type) {
                      case 'food':
                        return <FoodMemoryEntry key={`f-${item.data.id}`} entry={item.data} onClick={() => openSlideshow('food', item.data.id)} />;
                      case 'milestone':
                        return <MilestoneMemoryEntry key={`m-${item.data.id}`} milestone={item.data} onClick={() => openSlideshow('milestone', item.data.id)} />;
                      case 'journal':
                        return <JournalMemoryEntry key={`j-${item.data.id}`} entry={item.data} onClick={() => openSlideshow('journal', item.data.id)} />;
                    }
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* Fullscreen slideshow */}
      {slideshowIndex !== null && (
        <MemorySlideshow
          items={allSlideItems}
          startIndex={slideshowIndex}
          onClose={() => setSlideshowIndex(null)}
        />
      )}
    </PageShell>
  );
}

/* ── Memory Entry Cards ──────────────────────────────────── */

function FoodMemoryEntry({ entry, onClick }: { entry: FoodEntry; onClick: () => void }) {
  const reactionLabel = REACTIONS.find(r => r.key === entry.reaction)?.label ?? '';
  const ReactionIcon = REACTION_ICONS[entry.reaction] || Smile;
  const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm print-entry bg-theme-panel cursor-pointer active:scale-[0.98] transition-transform" onClick={onClick}>
      <div className="flex gap-0">
        {entry.image && (
          <div className="w-28 shrink-0">
            <img src={entry.image} alt={entry.food} className="w-full h-full object-cover min-h-[7rem]" />
          </div>
        )}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <UtensilsCrossed size={14} className="text-theme-primary shrink-0" />
              <h3 className="text-base font-bold truncate text-theme-text">{entry.food}</h3>
            </div>
            <ReactionIcon size={20} className="text-theme-primary shrink-0" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium text-theme-primary">{reactionLabel}</span>
            <span className="text-xs text-theme-muted">{dateStr}</span>
          </div>
          {entry.notes && (
            <p className="text-sm mt-2 line-clamp-2 text-theme-muted">{entry.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MilestoneMemoryEntry({ milestone, onClick }: { milestone: Milestone; onClick: () => void }) {
  const category = MILESTONE_CATEGORIES.find(c => c.value === milestone.category);
  const Icon = CATEGORY_ICONS[category?.icon ?? ''] || Star;
  const dateStr = new Date(milestone.achievedAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm print-entry bg-theme-panel cursor-pointer active:scale-[0.98] transition-transform" onClick={onClick}>
      <div className="flex gap-0">
        {milestone.image && (
          <div className="w-28 shrink-0">
            <img src={milestone.image} alt={milestone.title} className="w-full h-full object-cover min-h-[7rem]" />
          </div>
        )}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-theme-secondary shrink-0" />
            <h3 className="text-base font-bold truncate flex-1 text-theme-text">{milestone.title}</h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-theme-secondary-light text-theme-secondary flex items-center gap-1">
              <Icon size={10} />
              {category?.label || 'Other'}
            </span>
            <span className="text-xs text-theme-muted">{dateStr}</span>
          </div>
          {milestone.notes && (
            <p className="text-sm mt-2 line-clamp-2 text-theme-muted">{milestone.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function JournalMemoryEntry({ entry, onClick }: { entry: JournalEntry; onClick: () => void }) {
  const dateLabel = (() => {
    const [year, month] = entry.monthKey.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  })();

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm print-entry bg-theme-panel cursor-pointer active:scale-[0.98] transition-transform" onClick={onClick}>
      <div className="flex gap-0">
        {entry.image && (
          <div className="w-28 shrink-0">
            <img src={entry.image} alt={entry.monthLabel} className="w-full h-full object-cover min-h-[7rem]" />
          </div>
        )}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <BookText size={14} className="text-theme-primary shrink-0" />
              <h3 className="text-base font-bold truncate text-theme-text">{entry.monthLabel}</h3>
            </div>
            <span className="text-[10px] shrink-0 text-theme-muted">{dateLabel}</span>
          </div>
          {entry.text && (
            <p className="text-sm mt-1.5 line-clamp-2 text-theme-muted">{entry.text}</p>
          )}
          {entry.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.highlights.slice(0, 3).map((h, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-theme-primary-light text-theme-primary"
                >
                  {h}
                </span>
              ))}
              {entry.highlights.length > 3 && (
                <span className="text-[10px] px-1 text-theme-muted">
                  +{entry.highlights.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
