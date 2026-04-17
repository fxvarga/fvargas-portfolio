import type { FoodRecap } from './useRecapData';
import { UtensilsCrossed, Smile, Meh, Frown, Flame, CalendarDays } from 'lucide-react';

interface Props {
  data: FoodRecap;
}

function ReactionBar({ loved, neutral, disliked, total }: { loved: number; neutral: number; disliked: number; total: number }) {
  if (total === 0) return null;
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`;
  return (
    <div className="space-y-2">
      <div className="flex rounded-full overflow-hidden h-3">
        {loved > 0 && (
          <div className="bg-emerald-400 transition-all duration-700" style={{ width: pct(loved) }} />
        )}
        {neutral > 0 && (
          <div className="bg-amber-400 transition-all duration-700" style={{ width: pct(neutral) }} />
        )}
        {disliked > 0 && (
          <div className="bg-rose-400 transition-all duration-700" style={{ width: pct(disliked) }} />
        )}
      </div>
      <div className="flex justify-between text-xs text-theme-muted">
        <span className="flex items-center gap-1">
          <Smile size={12} className="text-emerald-500" /> {pct(loved)}
        </span>
        <span className="flex items-center gap-1">
          <Meh size={12} className="text-amber-500" /> {pct(neutral)}
        </span>
        <span className="flex items-center gap-1">
          <Frown size={12} className="text-rose-500" /> {pct(disliked)}
        </span>
      </div>
    </div>
  );
}

export function RecapFoodJourney({ data }: Props) {
  const firstDate = data.firstFood
    ? new Date(data.firstFood.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full bg-theme-primary-light flex items-center justify-center">
          <UtensilsCrossed size={16} className="text-theme-primary" />
        </div>
        <h2 className="text-lg font-bold text-theme-text">Food Journey</h2>
      </div>

      {/* First food card */}
      {data.firstFood && (
        <div className="rounded-2xl p-4 bg-theme-panel border border-theme-accent">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme-primary-light flex items-center justify-center shrink-0">
              <CalendarDays size={18} className="text-theme-primary" />
            </div>
            <div>
              <div className="text-xs text-theme-muted mb-0.5">First food tried</div>
              <div className="text-base font-semibold text-theme-text">{data.firstFood.food}</div>
              {firstDate && (
                <div className="text-xs text-theme-muted mt-0.5">{firstDate}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reaction breakdown */}
      <div className="rounded-2xl p-5 bg-theme-panel">
        <h3 className="text-sm font-semibold text-theme-text mb-3">Reactions</h3>
        <ReactionBar
          loved={data.loved}
          neutral={data.neutral}
          disliked={data.disliked}
          total={data.total}
        />
      </div>

      {/* Top loved foods */}
      {data.topFoods.length > 0 && (
        <div className="rounded-2xl p-5 bg-theme-panel">
          <h3 className="text-sm font-semibold text-theme-text mb-3">
            {data.topFoods.length === 1 ? 'Favorite Food' : 'Top Favorites'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.topFoods.map((food, i) => (
              <span
                key={food}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                  i === 0
                    ? 'bg-theme-primary-light text-theme-primary'
                    : 'bg-theme-bg text-theme-text'
                }`}
              >
                {i === 0 && <Smile size={14} />}
                {food}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fun stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 bg-theme-panel text-center">
          <div className="text-2xl font-bold text-theme-primary">{data.total}</div>
          <div className="text-xs text-theme-muted mt-1">Foods Tried</div>
        </div>
        {data.streak > 1 && (
          <div className="rounded-2xl p-4 bg-theme-panel text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame size={20} className="text-theme-secondary" />
              <span className="text-2xl font-bold text-theme-primary">{data.streak}</span>
            </div>
            <div className="text-xs text-theme-muted mt-1">Day Streak</div>
          </div>
        )}
      </div>
    </section>
  );
}
