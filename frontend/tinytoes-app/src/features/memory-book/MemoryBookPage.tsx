import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useEntries } from '@/hooks/useEntries';
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
  const { profile } = useProfile();
  const { entries } = useEntries();

  const months = useMemo(() => groupByMonth(entries), [entries]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header className="px-4 pt-6 pb-4 flex items-center gap-3 no-print">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
          style={{ color: 'var(--color-text)' }}
          aria-label="Go back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold flex-1" style={{ color: 'var(--color-text)' }}>
          Memory Book
        </h1>
        {entries.length > 0 && (
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            Print
          </Button>
        )}
      </header>

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
              Go Home
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
