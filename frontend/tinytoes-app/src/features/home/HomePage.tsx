import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useEntries } from '@/hooks/useEntries';
import { ModuleNavBar } from '@/components/ModuleNavBar';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/PageHeader';
import { FAB } from '@/components/FAB';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MetricsBar } from '@/components/MetricsBar';
import type { FilterPill } from '@/components/MetricsBar';
import { EntryCard } from './EntryCard';
import { AddEntrySheet } from '@/features/entry/AddEntrySheet';
import { EntryDetailView } from '@/features/entry/EntryDetailView';
import { RestorePrompt } from '@/components/RestorePrompt';
import { UtensilsCrossed, Upload, X, Smile, Meh, Frown } from 'lucide-react';
import type { FoodEntry, FilterType } from '@/types';

const FILTER_ICONS = { loved: Smile, neutral: Meh, disliked: Frown } as const;

const FOOD_FILTERS: FilterPill<FilterType>[] = [
  { label: 'All', value: 'all' },
  { label: 'Loved', value: 'loved', icon: Smile },
  { label: 'Meh', value: 'neutral', icon: Meh },
  { label: 'No thanks', value: 'disliked', icon: Frown },
];

export function HomePage() {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useProfile();
  const {
    filteredEntries,
    isLoading: entriesLoading,
    filter,
    setFilter,
    addEntry,
    updateEntry,
    deleteEntry,
    stats,
  } = useEntries();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<FoodEntry | null>(null);
  const [showBackupNudge, setShowBackupNudge] = useState(false);

  const handleRestored = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if (!profileLoading && !profile.onboardingComplete) {
      navigate('/onboarding', { replace: true });
    }
  }, [profileLoading, profile.onboardingComplete, navigate]);

  useEffect(() => {
    if (entriesLoading || stats.total === 0) return;
    const lastBackupCount = parseInt(localStorage.getItem('tinytoes-last-backup-count') || '0', 10);
    const entriesSinceBackup = stats.total - lastBackupCount;
    if (entriesSinceBackup >= 5) {
      setShowBackupNudge(true);
    }
  }, [entriesLoading, stats.total]);

  if (profileLoading || entriesLoading) {
    return <LoadingSpinner />;
  }

  if (!profile.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <PageShell>
      <RestorePrompt onRestored={handleRestored} />

      {/* Backup nudge banner */}
      {showBackupNudge && (
        <div className="mx-4 mt-4 rounded-xl p-3 flex items-center gap-3 animate-fade-in bg-theme-primary-light">
          <Upload size={20} className="shrink-0 text-theme-primary" />
          <p className="flex-1 text-xs text-theme-text">
            You have new entries!{' '}
            <button
              onClick={() => {
                import('@/lib/exportImport').then(m => m.exportData());
                setShowBackupNudge(false);
                localStorage.setItem('tinytoes-last-backup-count', String(stats.total));
              }}
              className="font-semibold underline text-theme-primary"
            >
              Export a backup
            </button>{' '}
            to keep them safe.
          </p>
          <button
            onClick={() => {
              setShowBackupNudge(false);
              localStorage.setItem('tinytoes-last-backup-count', String(stats.total));
            }}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 text-theme-muted"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <PageHeader title="First Foods" />

      {/* Module Navigation Bar */}
      <ModuleNavBar activeSlug="first-foods" />

      {/* Content */}
      <div className="px-4 space-y-4">
        <MetricsBar
          metrics={[
            { label: 'Total', value: stats.total },
            { label: 'Loved', value: stats.loved, icon: Smile },
            { label: 'Meh', value: stats.notSure, icon: Meh },
            { label: 'No thanks', value: stats.noThanks, icon: Frown },
          ]}
          filters={FOOD_FILTERS}
          activeFilter={filter}
          onFilter={setFilter}
        />

        {filteredEntries.length === 0 ? (
          filter === 'all' ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No entries yet"
              subtitle="Tap the + button to log your baby's first bite!"
            />
          ) : (
            <div className="text-center py-16">
              <div className="mb-3 flex justify-center">
                {(() => {
                  const FilterIcon = FILTER_ICONS[filter as keyof typeof FILTER_ICONS];
                  return FilterIcon ? <FilterIcon size={36} className="text-theme-muted" /> : null;
                })()}
              </div>
              <p className="text-base font-medium text-theme-text">No matching entries</p>
              <p className="text-sm mt-1 text-theme-muted">
                Try a different filter or add more entries.
              </p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {filteredEntries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onClick={() => setSelectedEntry(entry)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <FAB onClick={() => setShowAddSheet(true)} label="Add Entry" />

      {/* Add / Edit Entry Sheet */}
      <AddEntrySheet
        isOpen={showAddSheet || !!editingEntry}
        onClose={() => { setShowAddSheet(false); setEditingEntry(null); }}
        onAdd={addEntry}
        onUpdate={updateEntry}
        editEntry={editingEntry}
      />

      {/* Entry Detail View */}
      {selectedEntry && (
        <EntryDetailView
          entry={selectedEntry}
          items={filteredEntries}
          onNavigate={setSelectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEdit={(entry) => {
            setSelectedEntry(null);
            setEditingEntry(entry);
          }}
          onDelete={async (id) => {
            await deleteEntry(id);
            setSelectedEntry(null);
          }}
        />
      )}
    </PageShell>
  );
}
