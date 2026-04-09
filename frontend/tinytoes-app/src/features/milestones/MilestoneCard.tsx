import { MILESTONE_CATEGORIES, type Milestone } from '@/types';

interface MilestoneCardProps {
  milestone: Milestone;
  onClick: () => void;
}

export function MilestoneCard({ milestone, onClick }: MilestoneCardProps) {
  const category = MILESTONE_CATEGORIES.find(c => c.value === milestone.category);
  const dateStr = new Date(milestone.achievedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden shadow-sm transition-transform active:scale-[0.98]"
      style={{ backgroundColor: 'var(--color-panel)' }}
    >
      <div className="flex gap-0">
        {/* Image column */}
        {milestone.image && (
          <div className="w-24 shrink-0">
            <img
              src={milestone.image}
              alt={milestone.title}
              className="w-full h-full object-cover min-h-[6rem]"
            />
          </div>
        )}

        {/* Info column */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{category?.icon || '⭐'}</span>
            <h3 className="text-sm font-bold truncate flex-1" style={{ color: 'var(--color-text)' }}>
              {milestone.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              {category?.label || 'Other'}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {dateStr}
            </span>
          </div>
          {milestone.notes && (
            <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--color-muted)' }}>
              {milestone.notes}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
