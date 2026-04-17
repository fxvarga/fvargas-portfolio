import type { JournalEntry } from '@/types';

interface JournalCardProps {
  entry: JournalEntry;
  onClick: () => void;
}

export function JournalCard({ entry, onClick }: JournalCardProps) {
  const dateLabel = (() => {
    const [year, month] = entry.monthKey.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  })();

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden shadow-sm transition-transform active:scale-[0.98] bg-theme-panel"
    >
      <div className="flex gap-0">
        {/* Image column */}
        {entry.image && (
          <div className="w-24 shrink-0">
            <img
              src={entry.image}
              alt={entry.monthLabel}
              className="w-full h-full object-cover min-h-[7rem]"
            />
          </div>
        )}

        {/* Info column */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold truncate text-theme-text">
              {entry.monthLabel}
            </h3>
            <span className="text-[10px] shrink-0 text-theme-muted">
              {dateLabel}
            </span>
          </div>
          {entry.text && (
            <p className="text-xs mt-1.5 line-clamp-2 text-theme-muted">
              {entry.text}
            </p>
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
    </button>
  );
}
