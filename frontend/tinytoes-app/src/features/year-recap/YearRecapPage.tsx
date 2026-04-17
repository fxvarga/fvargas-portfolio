import { useNavigate } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useEntries } from '@/hooks/useEntries';
import { useMilestones } from '@/hooks/useMilestones';
import { useJournal } from '@/hooks/useJournal';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { ModuleNavBar } from '@/components/ModuleNavBar';
import { Button } from '@/components/Button';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { useRecapData } from './useRecapData';
import { RecapHero } from './RecapHero';
import { RecapFoodJourney } from './RecapFoodJourney';
import { RecapMilestones } from './RecapMilestones';
import { RecapJournal } from './RecapJournal';
import { RecapStats } from './RecapStats';

/* ── Scroll-reveal wrapper ───────────────────────────────── */

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div
      className="animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export function YearRecapPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { hasProduct, hasAnyCoreProduct } = useEntitlements(isAuthenticated);
  const { profile } = useProfile();
  const { entries } = useEntries();
  const { milestones } = useMilestones();
  const { entries: journalEntries } = useJournal();

  const canGenerate = hasAnyCoreProduct();

  const recap = useRecapData(profile, entries, milestones, journalEntries, hasProduct);

  return (
    <PageShell>
      <PageHeader title={profile.name ? `${profile.name}'s Journey` : 'Year Recap'} />
      <ModuleNavBar activeSlug="year-recap" />

      {canGenerate ? (
        /* ── Full Recap Story ─────────────────────── */
        <div className="px-4 space-y-6 pb-8">
          {recap.hasAnyData ? (
            <>
              <RevealSection>
                <RecapHero
                  profile={recap.profile}
                  stats={recap.stats}
                  totalFoods={recap.food?.total ?? 0}
                  totalMilestones={recap.milestones?.total ?? 0}
                  totalJournalMonths={recap.journal?.totalMonths ?? 0}
                />
              </RevealSection>

              {recap.food && (
                <RevealSection delay={100}>
                  <RecapFoodJourney data={recap.food} />
                </RevealSection>
              )}

              {recap.milestones && (
                <RevealSection delay={200}>
                  <RecapMilestones data={recap.milestones} />
                </RevealSection>
              )}

              {recap.journal && (
                <RevealSection delay={300}>
                  <RecapJournal data={recap.journal} />
                </RevealSection>
              )}

              <RevealSection delay={400}>
                <RecapStats data={recap.stats} />
              </RevealSection>

              {/* Footer */}
              <RevealSection delay={500}>
                <div className="text-center py-4">
                  <p className="text-xs text-theme-muted">
                    Made with love by TinyToes
                  </p>
                </div>
              </RevealSection>
            </>
          ) : (
            <EmptyState
              icon={Clapperboard}
              title="No data yet"
              subtitle="Start logging foods, milestones, or journal entries to see your recap come to life."
            />
          )}
        </div>
      ) : (
        /* ── No products — direct to store ─────────── */
        <div className="px-4">
          <EmptyState
            icon={Clapperboard}
            title="Year Recap"
            subtitle="Purchase any product to unlock your Year Recap — a beautiful summary of your baby's first year, generated from your data."
            action={
              <Button onClick={() => navigate('/store')}>
                View Products
              </Button>
            }
          />
        </div>
      )}
    </PageShell>
  );
}
