import { MILESTONE_CATEGORIES, type Milestone } from '@/types';
import {
  Activity,
  Heart,
  MessageCircle,
  Brain,
  Baby,
  Star,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

const CATEGORY_ICONS: Record<string, ComponentType<LucideProps>> = {
  activity: Activity,
  heart: Heart,
  'message-circle': MessageCircle,
  brain: Brain,
  baby: Baby,
  star: Star,
};

interface MilestoneCardProps {
  milestone: Milestone;
  onClick: () => void;
}

export function MilestoneCard({ milestone, onClick }: MilestoneCardProps) {
  const category = MILESTONE_CATEGORIES.find(c => c.value === milestone.category);
  const Icon = CATEGORY_ICONS[category?.icon ?? ''] || Star;
  const dateStr = new Date(milestone.achievedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden shadow-sm transition-transform active:scale-[0.98] bg-theme-panel"
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
            <Icon size={20} className="text-theme-primary shrink-0" />
            <h3 className="text-sm font-bold truncate flex-1 text-theme-text">
              {milestone.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-theme-primary-light text-theme-primary">
              {category?.label || 'Other'}
            </span>
            <span className="text-xs text-theme-muted">
              {dateStr}
            </span>
          </div>
          {milestone.notes && (
            <p className="text-xs mt-1.5 line-clamp-2 text-theme-muted">
              {milestone.notes}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
