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
      className="w-full text-left rounded-2xl overflow-hidden shadow-sm transition-transform active:scale-[0.98] bg-theme-panel"
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
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={14} className="text-theme-primary shrink-0" />
            <h3 className="text-sm font-bold truncate flex-1 text-theme-text">
              {entry.food}
            </h3>
            {ReactionIcon && <ReactionIcon size={20} className="text-theme-primary shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-theme-primary-light text-theme-primary">
              {reactionLabel}
            </span>
            <span className="text-xs text-theme-muted">
              {dateStr}
            </span>
          </div>
          {entry.notes && (
            <p className="text-xs mt-1.5 line-clamp-2 text-theme-muted">
              {entry.notes}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
