import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useEntries } from '@/hooks/useEntries';
import { useMilestones } from '@/hooks/useMilestones';
import { useJournal } from '@/hooks/useJournal';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { ModuleNavBar } from '@/components/ModuleNavBar';
import { Button } from '@/components/Button';

export function YearRecapPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { hasProduct } = useEntitlements(isAuthenticated);
  const { profile } = useProfile();
  const { stats: foodStats } = useEntries();
  const { stats: milestoneStats } = useMilestones();
  const { entries: journalEntries } = useJournal();

  const canGenerate = hasProduct('year-recap');

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header className="px-4 pt-6 pb-2 flex items-center justify-between no-print">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Year Recap
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Settings"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Module Navigation Bar */}
      <ModuleNavBar activeSlug="year-recap" />

      {/* Summary Preview */}
      <div className="px-4 space-y-4">
        <div
          className="rounded-2xl p-6 text-center"
          style={{ backgroundColor: 'var(--color-panel)' }}
        >
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            {profile.name || 'Your Baby'}'s First Year
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
            A beautiful summary of everything you've captured — foods tried, milestones reached, and monthly memories.
          </p>

          {/* Data overview */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: 'var(--color-background)' }}
            >
              <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {foodStats.total}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                Foods Tried
              </div>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: 'var(--color-background)' }}
            >
              <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {milestoneStats.total}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                Milestones
              </div>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: 'var(--color-background)' }}
            >
              <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {journalEntries.length}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                Months Written
              </div>
            </div>
          </div>

          {canGenerate ? (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Coming soon — your personalized first year recap will be generated from all your data across modules.
              </p>
              <Button fullWidth disabled>
                Generate Recap (Coming Soon)
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Purchase the Year Recap to generate a beautiful summary of your baby's first year.
              </p>
              <Button fullWidth onClick={() => navigate('/store')}>
                View in Store
              </Button>
            </div>
          )}
        </div>

        {/* What's included info */}
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--color-panel)' }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            What's in the Year Recap?
          </h3>
          <div className="space-y-3">
            {[
              { icon: '🥄', title: 'Food Journey', desc: 'Every food tried, favorites, and reactions at a glance' },
              { icon: '🏆', title: 'Milestone Timeline', desc: 'A chronological timeline of every milestone achieved' },
              { icon: '📖', title: 'Monthly Highlights', desc: 'Your reflections and highlights month by month' },
              { icon: '📊', title: 'Stats & Insights', desc: 'Fun statistics about your baby\'s first year' },
            ].map(item => (
              <div key={item.icon} className="flex gap-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.title}</div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
