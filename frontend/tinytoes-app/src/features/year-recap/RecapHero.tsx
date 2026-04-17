import type { BabyProfile } from '@/types';
import type { StatsRecap } from './useRecapData';
import { Footprints } from 'lucide-react';

interface Props {
  profile: BabyProfile;
  stats: StatsRecap;
  totalFoods: number;
  totalMilestones: number;
  totalJournalMonths: number;
}

export function RecapHero({ profile, stats, totalFoods, totalMilestones, totalJournalMonths }: Props) {
  const hasAnyStat = totalFoods > 0 || totalMilestones > 0 || totalJournalMonths > 0;

  return (
    <section className="relative rounded-3xl overflow-hidden bg-theme-primary p-8 text-center">
      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white/5" />
      </div>

      <div className="relative z-10">
        {/* Avatar or icon */}
        {profile.photo ? (
          <div className="mx-auto w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/30 mb-4">
            <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="mx-auto w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <Footprints size={36} className="text-white" />
          </div>
        )}

        <h1 className="text-2xl font-bold text-white mb-1">
          {profile.name || 'Your Baby'}'s Year
        </h1>
        <p className="text-sm text-white/70 mb-6">
          {stats.journeyDays > 1
            ? `${stats.journeyDays} days of memories`
            : 'Your journey begins'}
        </p>

        {/* Hero stat pills */}
        {hasAnyStat && (
          <div className="flex justify-center gap-3 flex-wrap">
            {totalFoods > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-lg font-bold text-white">{totalFoods}</span>
                <span className="text-xs text-white/80 ml-1">foods</span>
              </div>
            )}
            {totalMilestones > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-lg font-bold text-white">{totalMilestones}</span>
                <span className="text-xs text-white/80 ml-1">milestones</span>
              </div>
            )}
            {totalJournalMonths > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-lg font-bold text-white">{totalJournalMonths}</span>
                <span className="text-xs text-white/80 ml-1">months</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
