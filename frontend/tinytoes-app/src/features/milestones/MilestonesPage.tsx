import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useMilestones } from '@/hooks/useMilestones';
import { ModuleNavBar } from '@/components/ModuleNavBar';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/PageHeader';
import { FAB } from '@/components/FAB';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MetricsBar } from '@/components/MetricsBar';
import type { FilterPill } from '@/components/MetricsBar';
import { AddMilestoneSheet } from './AddMilestoneSheet';
import { MilestoneCard } from './MilestoneCard';
import { MilestoneDetail } from './MilestoneDetail';
import { MILESTONE_CATEGORIES, type Milestone, type MilestoneCategory } from '@/types';
import {
  Trophy,
  Activity,
  Heart,
  MessageCircle,
  Brain,
  Baby,
  Star,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

const CATEGORY_ICONS: Record<string, ComponentType<LucideProps>> = {
  activity: Activity,
  heart: Heart,
  'message-circle': MessageCircle,
  brain: Brain,
  baby: Baby,
  star: Star,
};

type MilestoneFilterValue = 'all' | MilestoneCategory;

const MILESTONE_FILTERS: FilterPill<MilestoneFilterValue>[] = [
  { label: 'All', value: 'all' },
  ...MILESTONE_CATEGORIES.map(cat => ({
    label: cat.label,
    value: cat.value as MilestoneFilterValue,
    icon: CATEGORY_ICONS[cat.icon] || Star,
  })),
];

export function MilestonesPage() {
  const { profile } = useProfile();
  const {
    filteredMilestones,
    isLoading,
    categoryFilter,
    setCategoryFilter,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    stats,
  } = useMilestones();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <PageShell>
      <PageHeader title="Milestones" />
      <ModuleNavBar activeSlug="milestones" />

      {/* Stats + Filter */}
      <div className="px-4 pb-4">
        <MetricsBar<MilestoneFilterValue>
          metrics={[
            { label: 'Total', value: stats.total },
            ...MILESTONE_CATEGORIES.slice(0, 4).map(cat => ({
              label: cat.label,
              value: stats[cat.value] as number,
              icon: CATEGORY_ICONS[cat.icon] || Star,
            })),
          ]}
          filters={MILESTONE_FILTERS}
          activeFilter={categoryFilter}
          onFilter={setCategoryFilter}
        />
      </div>

      {/* Content */}
      <div className="px-4 space-y-3">
        {filteredMilestones.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={categoryFilter === 'all' ? 'No milestones yet' : 'No milestones in this category'}
            subtitle={
              categoryFilter === 'all'
                ? `Tap the + button to record ${profile.name || 'your baby'}'s first milestone!`
                : 'Try a different category or add a new milestone.'
            }
          />
        ) : (
          filteredMilestones.map(milestone => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onClick={() => setSelectedMilestone(milestone)}
            />
          ))
        )}
      </div>

      <FAB onClick={() => setShowAddSheet(true)} label="Add Milestone" />

      <AddMilestoneSheet
        isOpen={showAddSheet || !!editingMilestone}
        onClose={() => { setShowAddSheet(false); setEditingMilestone(null); }}
        onAdd={addMilestone}
        onUpdate={updateMilestone}
        editMilestone={editingMilestone}
      />

      {selectedMilestone && (
        <MilestoneDetail
          milestone={selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
          onEdit={(m) => {
            setSelectedMilestone(null);
            setEditingMilestone(m);
          }}
          onDelete={async (id) => {
            await deleteMilestone(id);
            setSelectedMilestone(null);
          }}
        />
      )}
    </PageShell>
  );
}
