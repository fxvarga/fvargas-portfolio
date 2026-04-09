import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useProfile } from '@/hooks/useProfile';
import { useEntries } from '@/hooks/useEntries';
import { ModuleNavBar } from '@/components/ModuleNavBar';
import { Button } from '@/components/Button';
import { REACTIONS, type FoodEntry } from '@/types';

interface MonthGroup {
  key: string;
  label: string;
  entries: FoodEntry[];
}

function groupByMonth(entries: FoodEntry[]): MonthGroup[] {
  const groups = new Map<string, FoodEntry[]>();

  // Sort entries by createdAt ascending for the book
  const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);

  for (const entry of sorted) {
    const date = new Date(entry.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  return Array.from(groups.entries()).map(([key, entries]) => ({
    key,
    label: new Date(entries[0].createdAt).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    }),
    entries,
  }));
}

export function MemoryBookPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { hasProduct } = useEntitlements(isAuthenticated);
  const { profile } = useProfile();
  const { entries } = useEntries();

  const months = useMemo(() => groupByMonth(entries), [entries]);
  const canPrint = hasProduct('memory-book');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header className="px-4 pt-6 pb-2 flex items-center justify-between no-print">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Memory Book
        </h1>
        <div className="flex gap-2">
          {entries.length > 0 && canPrint && (
            <button
              onClick={handlePrint}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
              style={{ color: 'var(--color-muted)' }}
              aria-label="Print"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </button>
          )}
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Settings"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Module Navigation Bar */}
      <ModuleNavBar activeSlug="memory-book" />

      {/* Print header (hidden on screen, shown on print) */}
      <div className="print-header hidden">
        <h1 style={{ color: 'var(--color-text)' }}>{profile.name}'s First Bites</h1>
        <p>A memory book of first food adventures</p>
      </div>

      {/* Content */}
      <div className="px-4 pb-8">
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">
              <span role="img" aria-label="book">&#x1F4D6;</span>
            </div>
            <p className="text-base font-medium" style={{ color: 'var(--color-text)' }}>
              Your memory book is empty
            </p>
            <p className="text-sm mt-1 mb-6" style={{ color: 'var(--color-muted)' }}>
              Start adding entries to see them beautifully collected here.
            </p>
            <Button onClick={() => navigate('/home')}>
              Go to First Foods
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {months.map((month, monthIndex) => (
              <section
                key={month.key}
                className={monthIndex > 0 ? 'print-page-break' : ''}
              >
                {/* Month heading */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                    {month.label}
                  </h2>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                    {month.entries.length} {month.entries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* Entries */}
                <div className="space-y-4">
                  {month.entries.map(entry => (
                    <MemoryEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemoryEntry({ entry }: { entry: FoodEntry }) {
  const reactionLabel = REACTIONS.find(r => r.emoji === entry.reaction)?.label ?? '';
  const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm print-entry"
      style={{ backgroundColor: 'var(--color-panel)' }}
    >
      <div className="flex gap-0">
        {/* Image column */}
        {entry.image && (
          <div className="w-28 shrink-0">
            <img
              src={entry.image}
              alt={entry.food}
              className="w-full h-full object-cover min-h-[7rem]"
            />
          </div>
        )}

        {/* Info column */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold truncate" style={{ color: 'var(--color-text)' }}>
              {entry.food}
            </h3>
            <span className="text-lg shrink-0">{entry.reaction}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
              {reactionLabel}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {dateStr}
            </span>
          </div>
          {entry.notes && (
            <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--color-muted)' }}>
              {entry.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
