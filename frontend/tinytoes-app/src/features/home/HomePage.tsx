import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useEntries } from '@/hooks/useEntries';
import { ModuleNavBar } from '@/components/ModuleNavBar';
import { ProfileCard } from './ProfileCard';
import { StatsBar } from './StatsBar';
import { EntryCard } from './EntryCard';
import { AddEntrySheet } from '@/features/entry/AddEntrySheet';
import { EntryDetailView } from '@/features/entry/EntryDetailView';
import { RestorePrompt } from '@/components/RestorePrompt';
import type { FoodEntry } from '@/types';

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
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <svg className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!profile.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-background)' }}>
      <RestorePrompt onRestored={handleRestored} />

      {/* Backup nudge banner */}
      {showBackupNudge && (
        <div
          className="mx-4 mt-4 rounded-xl p-3 flex items-center gap-3 animate-fade-in"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="flex-1 text-xs" style={{ color: 'var(--color-text)' }}>
            You have new entries! <button onClick={() => { import('@/lib/exportImport').then(m => m.exportData()); setShowBackupNudge(false); localStorage.setItem('tinytoes-last-backup-count', String(stats.total)); }} className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>Export a backup</button> to keep them safe.
          </p>
          <button
            onClick={() => { setShowBackupNudge(false); localStorage.setItem('tinytoes-last-backup-count', String(stats.total)); }}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="px-4 pt-6 pb-2 flex items-center justify-between no-print">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          First Foods
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
      <ModuleNavBar activeSlug="first-foods" />

      {/* Content */}
      <div className="px-4 space-y-4">
        <ProfileCard profile={profile} />
        <StatsBar {...stats} filter={filter} onFilter={setFilter} />

        {filteredEntries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">
              {filter === 'all' ? (
                <span role="img" aria-label="spoon">&#x1F944;</span>
              ) : (
                filter
              )}
            </div>
            <p className="text-base font-medium" style={{ color: 'var(--color-text)' }}>
              {filter === 'all' ? 'No entries yet' : 'No matching entries'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              {filter === 'all'
                ? 'Tap the + button to log your baby\'s first bite!'
                : 'Try a different filter or add more entries.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
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
      <button
        onClick={() => setShowAddSheet(true)}
        className="fab-button fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform active:scale-90 z-40 no-print"
        style={{ backgroundColor: 'var(--color-primary)' }}
        aria-label="Add Entry"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

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
    </div>
  );
}
