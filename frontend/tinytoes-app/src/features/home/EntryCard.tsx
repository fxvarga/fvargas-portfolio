import { UtensilsCrossed, Smile, Meh, Frown } from 'lucide-react';
import { REACTIONS, type FoodEntry, type Reaction } from '@/types';

const REACTION_ICONS = { loved: Smile, neutral: Meh, disliked: Frown } as const;

interface EntryCardProps {
  entry: FoodEntry;
  onClick: () => void;
}

export function EntryCard({ entry, onClick }: EntryCardProps) {
  const ReactionIcon = REACTION_ICONS[entry.reaction as Reaction];
  const reactionLabel = REACTIONS.find(r => r.key === entry.reaction)?.label ?? '';
  const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98] bg-theme-panel border border-theme-accent/60 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 3px rgba(61,44,46,0.04), 0 4px 12px rgba(61,44,46,0.03)' }}
    >
      <div className="flex gap-0">
        {/* Image column */}
        {entry.image && (
          <div className="w-24 shrink-0">
            <img
              src={entry.image}
              alt={entry.food}
              className="w-full h-full object-cover min-h-[6rem]"
              loading="lazy"
            />
          </div>
        )}

        {/* Info column */}
        <div className="flex-1 p-3.5 min-w-0">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={14} className="text-theme-primary shrink-0" strokeWidth={1.8} />
            <h3 className="text-sm font-semibold truncate flex-1 text-theme-text tracking-tight">
              {entry.food}
            </h3>
            {ReactionIcon && <ReactionIcon size={18} className="text-theme-primary shrink-0" strokeWidth={1.8} />}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-theme-primary-light text-theme-primary">
              {reactionLabel}
            </span>
            <span className="text-xs text-theme-muted">
              {dateStr}
            </span>
          </div>
          {entry.notes && (
            <p className="text-xs mt-2 line-clamp-2 text-theme-muted leading-relaxed">
              {entry.notes}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
