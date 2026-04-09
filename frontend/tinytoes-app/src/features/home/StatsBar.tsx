import { Card } from '@/components/Card';
import type { FilterType } from '@/types';

interface StatsBarProps {
  total: number;
  loved: number;
  notSure: number;
  noThanks: number;
  filter?: FilterType;
  onFilter?: (filter: FilterType) => void;
}

export function StatsBar({ total, loved, notSure, noThanks, filter = 'all', onFilter }: StatsBarProps) {
  const stats: { label: string; value: number; emoji: string | null; filterValue: FilterType }[] = [
    { label: 'Total', value: total, emoji: null, filterValue: 'all' },
    { label: 'Loved', value: loved, emoji: '\u{1F60D}', filterValue: '\u{1F60D}' as FilterType },
    { label: 'Okay', value: notSure, emoji: '\u{1F610}', filterValue: '\u{1F610}' as FilterType },
    { label: 'Nope', value: noThanks, emoji: '\u{1F616}', filterValue: '\u{1F616}' as FilterType },
  ];

  return (
    <Card padding="sm">
      <div className="flex">
        {stats.map((stat, i) => {
          const isActive = filter === stat.filterValue;
          return (
            <button
              key={stat.label}
              onClick={() => onFilter?.(stat.filterValue)}
              className={`flex-1 text-center py-1 transition-all rounded-xl ${i < stats.length - 1 ? 'border-r' : ''} ${
                onFilter ? 'cursor-pointer active:scale-95' : ''
              }`}
              style={{
                borderColor: 'var(--color-accent)',
                backgroundColor: isActive && filter !== 'all' ? 'var(--color-primary-light)' : 'transparent',
              }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: isActive && filter !== 'all' ? 'var(--color-primary)' : 'var(--color-text)' }}
              >
                {stat.emoji ? `${stat.emoji} ${stat.value}` : stat.value}
              </div>
              <div
                className="text-xs"
                style={{ color: isActive && filter !== 'all' ? 'var(--color-primary)' : 'var(--color-muted)' }}
              >
                {stat.label}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
