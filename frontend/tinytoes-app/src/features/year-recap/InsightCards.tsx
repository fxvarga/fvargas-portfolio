import { useNavigate } from 'react-router-dom';
import {
  Smile, Flame, CalendarDays, Camera, Trophy, UtensilsCrossed, BookOpen, Sparkles,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Insight } from './useRecapData';

const ICON_MAP: Record<Insight['icon'], LucideIcon> = {
  smile: Smile,
  flame: Flame,
  calendar: CalendarDays,
  camera: Camera,
  trophy: Trophy,
  utensils: UtensilsCrossed,
  book: BookOpen,
  sparkles: Sparkles,
};

const ICON_COLOR: Record<Insight['icon'], string> = {
  smile: 'text-emerald-500',
  flame: 'text-orange-500',
  calendar: 'text-blue-500',
  camera: 'text-violet-500',
  trophy: 'text-amber-500',
  utensils: 'text-theme-primary',
  book: 'text-theme-secondary',
  sparkles: 'text-pink-500',
};

interface Props {
  insights: Insight[];
}

export function InsightCards({ insights }: Props) {
  const navigate = useNavigate();
  // Show up to 3 insights
  const visible = insights.slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-theme-secondary" />
        <h2 className="text-base font-bold font-display tracking-tight text-theme-text">
          Did You Know?
        </h2>
      </div>

      <div className="space-y-2.5">
        {visible.map((insight, i) => {
          const Icon = ICON_MAP[insight.icon];
          const color = ICON_COLOR[insight.icon];
          const isClickable = !!insight.link;

          return (
            <button
              key={i}
              type="button"
              disabled={!isClickable}
              onClick={() => insight.link && navigate(insight.link)}
              className={`flex items-start gap-3 rounded-2xl p-4 bg-theme-panel border border-theme-accent w-full text-left transition-colors ${
                isClickable ? 'active:bg-theme-accent cursor-pointer' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-theme-bg flex items-center justify-center shrink-0">
                <Icon size={18} className={color} />
              </div>
              <p className="text-sm text-theme-text leading-relaxed pt-1.5 flex-1">
                {insight.text}
              </p>
              {isClickable && (
                <ChevronRight size={16} className="text-theme-muted shrink-0 mt-2" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
