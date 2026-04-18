import { Card } from '@/components/Card';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

/* -- Metric item (one column in the stats row) -- */

export interface MetricItem {
  label: string;
  value: number;
  icon?: ComponentType<LucideProps>;
}

/* -- Filter pill -- */

export interface FilterPill<T extends string = string> {
  label: string;
  value: T;
  icon?: ComponentType<LucideProps>;
}

/* -- Props -- */

interface MetricsBarProps<T extends string = string> {
  metrics: MetricItem[];
  filters?: FilterPill<T>[];
  activeFilter?: T;
  onFilter?: (value: T) => void;
}

/* -- Component -- */

export function MetricsBar<T extends string = string>({
  metrics,
  filters,
  activeFilter,
  onFilter,
}: MetricsBarProps<T>) {
  return (
    <div className="space-y-3">
      {/* Stats row */}
      <Card padding="sm">
        <div className="flex items-center">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className={`flex-1 text-center py-1.5 ${
                  i < metrics.length - 1 ? 'border-r border-theme-accent' : ''
                }`}
              >
                <div className="text-xl font-bold font-display tracking-tight text-theme-text flex items-center justify-center gap-1">
                  {Icon && <Icon size={15} strokeWidth={1.8} />}
                  <span>{metric.value}</span>
                </div>
                <div className="text-[11px] text-theme-muted mt-0.5">{metric.label}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filter pills */}
      {filters && onFilter && (
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => {
            const Icon = f.icon;
            return (
              <button
                key={f.value}
                onClick={() => onFilter(f.value)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                  activeFilter === f.value
                    ? 'bg-theme-primary text-white border-transparent shadow-sm'
                    : 'bg-theme-panel text-theme-text border-theme-accent/60 hover:border-theme-primary/40'
                }`}
              >
                {Icon && <Icon size={12} strokeWidth={1.8} />}
                {f.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
