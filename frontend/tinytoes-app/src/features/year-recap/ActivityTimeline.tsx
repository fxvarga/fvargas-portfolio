import { UtensilsCrossed, Trophy, BookOpen } from 'lucide-react';
import type { TimelineItem } from './useRecapData';

interface Props {
  items: TimelineItem[];
}

const TYPE_CONFIG = {
  food: { icon: UtensilsCrossed, bg: 'bg-emerald-500' },
  milestone: { icon: Trophy, bg: 'bg-amber-500' },
  journal: { icon: BookOpen, bg: 'bg-violet-500' },
} as const;

function relativeDate(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ActivityTimeline({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-base font-bold font-display tracking-tight text-theme-text mb-3">
        Recent Activity
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {items.map(item => {
          const config = TYPE_CONFIG[item.type];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="flex flex-col items-center shrink-0 w-[72px]"
            >
              {/* Circular thumbnail with type badge */}
              <div className="relative mb-1.5">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-theme-accent bg-theme-bg">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon size={20} className="text-theme-muted" />
                    </div>
                  )}
                </div>
                {/* Type badge */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${config.bg} flex items-center justify-center ring-2 ring-white`}>
                  <Icon size={10} className="text-white" />
                </div>
              </div>

              {/* Label */}
              <span className="text-[10px] font-medium text-theme-text text-center leading-tight line-clamp-1 w-full">
                {item.title}
              </span>
              <span className="text-[9px] text-theme-muted">
                {relativeDate(item.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
