import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, BookOpen } from 'lucide-react';
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
import { MemorySlideshow, type SlideItem } from '@/components/MemorySlideshow';
import { useRecapData, type TimelineItem } from './useRecapData';
import { DashboardHero } from './DashboardHero';
import { FunCounters } from './FunCounters';
import { ActivityTimeline } from './ActivityTimeline';
import { MemoryCollage } from './MemoryCollage';
import { InsightCards } from './InsightCards';
import type { FoodEntry, Milestone, JournalEntry } from '@/types';

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

/* ── Convert TimelineItem to SlideItem ───────────────────── */

function toSlideItem(item: TimelineItem): SlideItem {
  switch (item.type) {
    case 'food':
      return { type: 'food', data: item.data as FoodEntry };
    case 'milestone':
      return { type: 'milestone', data: item.data as Milestone };
    case 'journal':
      return { type: 'journal', data: item.data as JournalEntry };
  }
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

  /* Slideshow state for image previews */
  const [slideshow, setSlideshow] = useState<{ items: SlideItem[]; startIndex: number } | null>(null);

  const openCollageSlideshow = (index: number) => {
    const slideItems = data.photoMemories.map(toSlideItem);
    setSlideshow({ items: slideItems, startIndex: index });
  };

  const openActivitySlideshow = (item: TimelineItem) => {
    // Build a slideshow from all recent activity items
    const slideItems = data.recentActivity.map(toSlideItem);
    const startIndex = data.recentActivity.findIndex(a => a.id === item.id);
    setSlideshow({ items: slideItems, startIndex: Math.max(0, startIndex) });
  };

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
                <ActivityTimeline
                  items={data.recentActivity}
                  onItemClick={openActivitySlideshow}
                />
              </RevealSection>

              {/* Photo memory collage */}
              <RevealSection delay={240}>
                <MemoryCollage
                  items={data.photoMemories}
                  onItemClick={openCollageSlideshow}
                />
              </RevealSection>

              {/* Did you know? insights */}
              <RevealSection delay={320}>
                <InsightCards insights={data.insights} />
              </RevealSection>

              {/* Print a Book CTA */}
              <RevealSection delay={400}>
                <button
                  onClick={() => navigate('/memory-book', { state: { tab: 'print' } })}
                  className="w-full rounded-2xl p-5 text-left transition-transform active:scale-[0.98] bg-theme-panel shadow-sm border border-theme-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-theme-primary-light">
                      <BookOpen size={20} className="text-theme-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-theme-text">Print a Photo Book</h3>
                      <p className="text-xs text-theme-muted mt-0.5">
                        Turn {profile.name ? `${profile.name}'s` : 'your'} memories into a beautiful keepsake book
                      </p>
                    </div>
                  </div>
                </button>
              </RevealSection>

              {/* Footer */}
              <RevealSection delay={480}>
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

      {/* Slideshow overlay for image previews */}
      {slideshow && (
        <MemorySlideshow
          items={slideshow.items}
          startIndex={slideshow.startIndex}
          onClose={() => setSlideshow(null)}
        />
      )}
    </PageShell>
  );
}
