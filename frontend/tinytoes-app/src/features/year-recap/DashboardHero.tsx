import type { BabyProfile } from '@/types';
import { Footprints, CalendarDays } from 'lucide-react';

interface Props {
  profile: BabyProfile;
  journeyDays: number;
  firstEntryDate: number | null;
}

export function DashboardHero({ profile, journeyDays, firstEntryDate }: Props) {
  const startLabel = firstEntryDate
    ? new Date(firstEntryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <section className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-lg">
      {/* Photo / gradient fallback */}
      {profile.photo ? (
        <img
          src={profile.photo}
          alt={profile.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 60%, var(--color-secondary) 100%)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Footprints size={120} className="text-white" />
          </div>
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h1 className="text-2xl font-bold font-display tracking-tight text-white mb-0.5 drop-shadow-md">
          {profile.name || 'Your Baby'}'s Journey
        </h1>

        {journeyDays > 1 ? (
          <p className="text-sm text-white/80 drop-shadow-sm">
            {journeyDays} days of memories
          </p>
        ) : (
          <p className="text-sm text-white/80 drop-shadow-sm">
            The adventure begins
          </p>
        )}

        {startLabel && (
          <div className="flex items-center gap-1.5 mt-2">
            <CalendarDays size={12} className="text-white/60" />
            <span className="text-xs text-white/60">Since {startLabel}</span>
          </div>
        )}
      </div>
    </section>
  );
}
