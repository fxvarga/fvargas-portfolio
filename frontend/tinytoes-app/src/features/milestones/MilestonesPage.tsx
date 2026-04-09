import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useMilestones } from '@/hooks/useMilestones';
import { ModuleNavBar } from '@/components/ModuleNavBar';
import { AddMilestoneSheet } from './AddMilestoneSheet';
import { MilestoneCard } from './MilestoneCard';
import { MilestoneDetail } from './MilestoneDetail';
import { MILESTONE_CATEGORIES, type Milestone } from '@/types';

export function MilestonesPage() {
  const navigate = useNavigate();
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
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <svg className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header className="px-4 pt-6 pb-2 flex items-center justify-between no-print">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Milestones
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
      <ModuleNavBar activeSlug="milestones" />

      {/* Stats */}
      <div className="px-4 pb-3">
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ backgroundColor: 'var(--color-panel)' }}
        >
          <div className="text-center flex-1">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{stats.total}</div>
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Total</div>
          </div>
          {MILESTONE_CATEGORIES.slice(0, 4).map(cat => (
            <div key={cat.value} className="text-center flex-1">
              <div className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {stats[cat.value]}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                {cat.icon} {cat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              categoryFilter === 'all' ? '' : 'hover:bg-black/5'
            }`}
            style={categoryFilter === 'all' ? {
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
            } : {
              backgroundColor: 'var(--color-panel)',
              color: 'var(--color-text)',
            }}
          >
            All
          </button>
          {MILESTONE_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                categoryFilter === cat.value ? '' : 'hover:bg-black/5'
              }`}
              style={categoryFilter === cat.value ? {
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
              } : {
                backgroundColor: 'var(--color-panel)',
                color: 'var(--color-text)',
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-3">
        {filteredMilestones.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-base font-medium" style={{ color: 'var(--color-text)' }}>
              {categoryFilter === 'all' ? 'No milestones yet' : 'No milestones in this category'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              {categoryFilter === 'all'
                ? `Tap the + button to record ${profile.name || 'your baby'}'s first milestone!`
                : 'Try a different category or add a new milestone.'}
            </p>
          </div>
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

      {/* FAB */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="fab-button fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform active:scale-90 z-40 no-print"
        style={{ backgroundColor: 'var(--color-primary)' }}
        aria-label="Add Milestone"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Add / Edit Sheet */}
      <AddMilestoneSheet
        isOpen={showAddSheet || !!editingMilestone}
        onClose={() => { setShowAddSheet(false); setEditingMilestone(null); }}
        onAdd={addMilestone}
        onUpdate={updateMilestone}
        editMilestone={editingMilestone}
      />

      {/* Detail View */}
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
    </div>
  );
}
