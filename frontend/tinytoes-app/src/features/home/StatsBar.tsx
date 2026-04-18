import { Smile, Meh, Frown } from 'lucide-react';
import { Card } from '@/components/Card';
import type { FilterType } from '@/types';
import type { LucideIcon } from 'lucide-react';

interface StatsBarProps {
  total: number;
  loved: number;
  notSure: number;
  noThanks: number;
  filter?: FilterType;
  onFilter?: (filter: FilterType) => void;
}

const FILTERS: { label: string; icon: LucideIcon | null; value: FilterType }[] = [
  { label: 'All', icon: null, value: 'all' },
  { label: 'Loved', icon: Smile, value: 'loved' },
  { label: 'Meh', icon: Meh, value: 'neutral' },
  { label: 'No thanks', icon: Frown, value: 'disliked' },
];

export function StatsBar({ total, loved, notSure, noThanks, filter = 'all', onFilter }: StatsBarProps) {
  const stats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: 'Loved', value: loved, icon: Smile },
    { label: 'Meh', value: notSure, icon: Meh },
    { label: 'No thanks', value: noThanks, icon: Frown },
  ];

  return (
    <div className="space-y-3">
      {/* Stats display */}
      <Card padding="sm">
        <div className="flex items-center">
          <div className="flex-1 text-center py-1 border-r border-theme-accent">
            <div className="text-lg font-bold text-theme-text">{total}</div>
            <div className="text-xs text-theme-muted">Total</div>
          </div>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex-1 text-center py-1 ${
                i < stats.length - 1 ? 'border-r border-theme-accent' : ''
              }`}
            >
              <div className="text-lg font-bold text-theme-text flex items-center justify-center gap-1">
                <stat.icon size={16} />
                <span>{stat.value}</span>
              </div>
              <div className="text-xs text-theme-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter pills */}
      {onFilter && (
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => onFilter(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                filter === f.value
                  ? 'bg-theme-primary text-white'
                  : 'bg-theme-panel text-theme-text hover:bg-black/5'
              }`}
            >
              {f.icon && <f.icon size={12} />}
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
