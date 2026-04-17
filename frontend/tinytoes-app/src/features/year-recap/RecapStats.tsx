import type { StatsRecap } from './useRecapData';
import {
  BarChart3, CalendarDays, Camera, TrendingUp, Smile, Meh, Frown,
} from 'lucide-react';
import type { Reaction } from '@/types';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

const REACTION_DISPLAY: Record<Reaction, { label: string; Icon: ComponentType<LucideProps>; color: string }> = {
  loved: { label: 'Loved it', Icon: Smile, color: 'text-emerald-500' },
  neutral: { label: 'Not sure', Icon: Meh, color: 'text-amber-500' },
  disliked: { label: 'No thanks', Icon: Frown, color: 'text-rose-500' },
};

interface Props {
  data: StatsRecap;
}

export function RecapStats({ data }: Props) {
  const reaction = data.dominantReaction ? REACTION_DISPLAY[data.dominantReaction] : null;

  const statCards: { icon: ComponentType<LucideProps>; value: string; label: string; show: boolean }[] = [
    {
      icon: CalendarDays,
      value: `${data.journeyDays}`,
      label: 'Days of journey',
      show: data.journeyDays > 1,
    },
    {
      icon: TrendingUp,
      value: `${data.foodsPerWeek}`,
      label: 'Foods per week',
      show: data.foodsPerWeek > 0,
    },
    {
      icon: Camera,
      value: `${data.totalPhotos}`,
      label: 'Photos captured',
      show: data.totalPhotos > 0,
    },
  ].filter(s => s.show);

  if (statCards.length === 0 && !data.busiestFoodMonth && !reaction) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full bg-theme-secondary-light flex items-center justify-center">
          <BarChart3 size={16} className="text-theme-secondary" />
        </div>
        <h2 className="text-lg font-bold text-theme-text">Fun Stats</h2>
      </div>

      {/* Stat cards grid */}
      {statCards.length > 0 && (
        <div className={`grid gap-3 ${statCards.length >= 3 ? 'grid-cols-3' : `grid-cols-${statCards.length}`}`}>
          {statCards.map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-2xl p-4 bg-theme-panel text-center">
              <Icon size={20} className="text-theme-primary mx-auto mb-2" />
              <div className="text-xl font-bold text-theme-primary">{value}</div>
              <div className="text-[10px] text-theme-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Busiest month + dominant reaction */}
      <div className="grid grid-cols-2 gap-3">
        {data.busiestFoodMonth && (
          <div className="rounded-2xl p-4 bg-theme-panel">
            <div className="text-xs text-theme-muted mb-1">Busiest Month</div>
            <div className="text-base font-bold text-theme-text">{data.busiestFoodMonth}</div>
          </div>
        )}
        {reaction && (
          <div className="rounded-2xl p-4 bg-theme-panel">
            <div className="text-xs text-theme-muted mb-1">Top Reaction</div>
            <div className="flex items-center gap-1.5">
              <reaction.Icon size={18} className={reaction.color} />
              <span className="text-base font-bold text-theme-text">{reaction.label}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
