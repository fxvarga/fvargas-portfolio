import type { FoodEntry } from '@/types';

interface EntryCardProps {
  entry: FoodEntry;
  onClick: () => void;
}

export function EntryCard({ entry, onClick }: EntryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] text-left"
      style={{ backgroundColor: 'var(--color-panel)' }}
    >
      {/* Image area */}
      <div
        className="w-full aspect-square flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        {entry.image ? (
          <img
            src={entry.image}
            alt={entry.food}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-3xl" role="img" aria-label="food">&#x1F37D;&#xFE0F;</span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {entry.food}
          </p>
          <span className="text-base shrink-0">{entry.reaction}</span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
          {new Date(entry.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
    </button>
  );
}
