import { Camera } from 'lucide-react';
import { getJournalImages, type JournalEntry } from '@/types';

interface JournalCardProps {
  entry: JournalEntry;
  onClick: () => void;
}

export function JournalCard({ entry, onClick }: JournalCardProps) {
  const images = getJournalImages(entry);
  const cover = images[0];
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
      className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98] bg-theme-panel border border-theme-accent/60 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 3px rgba(61,44,46,0.04), 0 4px 12px rgba(61,44,46,0.03)' }}
    >
      <div className="flex gap-0">
        {/* Image column */}
        {cover && (
          <div className="w-24 shrink-0 relative">
            <img
              src={cover}
              alt={entry.monthLabel}
              className="w-full h-full object-cover min-h-[7rem]"
            />
            {images.length > 1 && (
              <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">
                <Camera size={9} /> {images.length}
              </span>
            )}
          </div>
        )}

        {/* Info column */}
        <div className="flex-1 p-3.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold truncate text-theme-text tracking-tight">
              {entry.monthLabel}
            </h3>
            <span className="text-[10px] shrink-0 text-theme-muted">
              {dateLabel}
            </span>
          </div>
          {entry.text && (
            <p className="text-xs mt-2 line-clamp-2 text-theme-muted leading-relaxed">
              {entry.text}
            </p>
          )}
          {entry.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
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
