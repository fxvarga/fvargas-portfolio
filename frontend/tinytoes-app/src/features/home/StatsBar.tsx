import { Card } from '@/components/Card';

interface StatsBarProps {
  total: number;
  loved: number;
  notSure: number;
  noThanks: number;
}

export function StatsBar({ total, loved, notSure, noThanks }: StatsBarProps) {
  const stats = [
    { label: 'Total', value: total, emoji: null },
    { label: 'Loved', value: loved, emoji: '😍' },
    { label: 'Okay', value: notSure, emoji: '😐' },
    { label: 'Nope', value: noThanks, emoji: '😖' },
  ];

  return (
    <Card padding="sm">
      <div className="flex">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex-1 text-center py-1 ${i < stats.length - 1 ? 'border-r' : ''}`}
            style={{ borderColor: 'var(--color-accent)' }}
          >
            <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {stat.emoji ? `${stat.emoji} ${stat.value}` : stat.value}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
