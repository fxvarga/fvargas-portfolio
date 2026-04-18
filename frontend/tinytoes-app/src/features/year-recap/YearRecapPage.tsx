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
import { DashboardHero } from './DashboardHero';
import { FunCounters } from './FunCounters';
import { ActivityTimeline } from './ActivityTimeline';
import { MemoryCollage } from './MemoryCollage';
import { InsightCards } from './InsightCards';

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

  const data = useRecapData(profile, entries, milestones, journalEntries, hasProduct);

  return (
    <PageShell>
      <PageHeader title={profile.name ? `${profile.name}'s Journey` : 'Dashboard'} />
      <ModuleNavBar activeSlug="year-recap" />

      {canGenerate ? (
        <div className="px-4 space-y-6 pb-8">
          {data.hasAnyData ? (
            <>
              {/* Hero — big photo card */}
              <RevealSection>
                <DashboardHero
                  profile={data.profile}
                  journeyDays={data.journeyDays}
                  firstEntryDate={data.firstEntryDate}
                />
              </RevealSection>

              {/* Fun animated counters */}
              <RevealSection delay={80}>
                <FunCounters
                  totalFoods={data.totalFoods}
                  totalMilestones={data.totalMilestones}
                  totalJournalMonths={data.totalJournalMonths}
                  totalPhotos={data.totalPhotos}
                  loggingStreak={data.loggingStreak}
                />
              </RevealSection>

              {/* Recent activity horizontal scroll */}
              <RevealSection delay={160}>
                <ActivityTimeline items={data.recentActivity} />
              </RevealSection>

              {/* Photo memory collage */}
              <RevealSection delay={240}>
                <MemoryCollage items={data.photoMemories} />
              </RevealSection>

              {/* Did you know? insights */}
              <RevealSection delay={320}>
                <InsightCards insights={data.insights} />
              </RevealSection>

              {/* Footer */}
              <RevealSection delay={400}>
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
              subtitle="Start logging foods, milestones, or journal entries to see your dashboard come to life."
            />
          )}
        </div>
      ) : (
        <div className="px-4">
          <EmptyState
            icon={Clapperboard}
            title="Dashboard"
            subtitle="Purchase any product to unlock your dashboard — a beautiful summary of your baby's journey, generated from your data."
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
