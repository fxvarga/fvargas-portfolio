import type { MilestoneRecap } from './useRecapData';
import { MILESTONE_CATEGORIES } from '@/types';
import {
  Trophy, Activity, Heart, MessageCircle, Brain, Baby, Star,
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

interface Props {
  data: MilestoneRecap;
}

export function RecapMilestones({ data }: Props) {
  const firstDate = data.firstMilestone
    ? new Date(data.firstMilestone.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  // Categories that have entries, sorted by count descending
  const activeCategories = MILESTONE_CATEGORIES
    .filter(c => data.byCategory[c.value] > 0)
    .sort((a, b) => data.byCategory[b.value] - data.byCategory[a.value]);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full bg-theme-secondary-light flex items-center justify-center">
          <Trophy size={16} className="text-theme-secondary" />
        </div>
        <h2 className="text-lg font-bold text-theme-text">Milestones</h2>
      </div>

      {/* Total milestone highlight */}
      <div className="rounded-2xl p-5 bg-theme-panel text-center">
        <div className="text-4xl font-bold text-theme-primary mb-1">{data.total}</div>
        <div className="text-sm text-theme-muted">milestones achieved</div>
      </div>

      {/* Category breakdown */}
      {activeCategories.length > 0 && (
        <div className="rounded-2xl p-5 bg-theme-panel">
          <h3 className="text-sm font-semibold text-theme-text mb-3">By Category</h3>
          <div className="space-y-2.5">
            {activeCategories.map(cat => {
              const Icon = CATEGORY_ICONS[cat.icon] || Star;
              const count = data.byCategory[cat.value];
              const pct = Math.round((count / data.total) * 100);
              return (
                <div key={cat.value} className="flex items-center gap-3">
                  <Icon size={16} className="text-theme-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-theme-text font-medium">{cat.label}</span>
                      <span className="text-theme-muted">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-theme-bg overflow-hidden">
                      <div
                        className="h-full rounded-full bg-theme-primary transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline - show up to 8 recent milestones */}
      {data.timeline.length > 0 && (
        <div className="rounded-2xl p-5 bg-theme-panel">
          <h3 className="text-sm font-semibold text-theme-text mb-3">Timeline</h3>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-theme-accent" />

            <div className="space-y-4">
              {data.timeline.slice(0, 8).map(m => {
                const cat = MILESTONE_CATEGORIES.find(c => c.value === m.category);
                const Icon = cat ? (CATEGORY_ICONS[cat.icon] || Star) : Star;
                const date = new Date(m.achievedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <div key={m.id} className="relative flex items-start gap-3">
                    {/* Dot on timeline */}
                    <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-theme-primary-light border-2 border-theme-primary flex items-center justify-center">
                      <Icon size={8} className="text-theme-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-theme-text">{m.title}</div>
                      <div className="text-xs text-theme-muted">{date}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {data.timeline.length > 8 && (
              <div className="text-xs text-theme-muted mt-3 text-center">
                + {data.timeline.length - 8} more milestones
              </div>
            )}
          </div>
        </div>
      )}

      {/* First milestone callout */}
      {data.firstMilestone && (
        <div className="rounded-2xl p-4 bg-theme-secondary-light border border-theme-secondary/20">
          <div className="text-xs text-theme-muted mb-1">First milestone</div>
          <div className="text-base font-semibold text-theme-text">{data.firstMilestone.title}</div>
          {firstDate && <div className="text-xs text-theme-muted mt-0.5">{firstDate}</div>}
        </div>
      )}
    </section>
  );
}
