import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useJournal } from '@/hooks/useJournal';
import { ModuleNavBar } from '@/components/ModuleNavBar';
import { AddJournalSheet } from './AddJournalSheet';
import { JournalCard } from './JournalCard';
import { JournalDetail } from './JournalDetail';
import type { JournalEntry } from '@/types';

export function JournalPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
  } = useJournal();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

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
          Monthly Journal
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
      <ModuleNavBar activeSlug="monthly-journal" />

      {/* Stats bar */}
      <div className="px-4 pb-4">
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ backgroundColor: 'var(--color-panel)' }}
        >
          <div className="text-center flex-1">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{entries.length}</div>
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Months Recorded</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {entries.reduce((acc, e) => acc + e.highlights.length, 0)}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Highlights</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {entries.filter(e => e.image).length}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Photos</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📖</div>
            <p className="text-base font-medium" style={{ color: 'var(--color-text)' }}>
              No journal entries yet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              Tap the + button to write about {profile.name || 'your baby'}'s month!
            </p>
          </div>
        ) : (
          entries.map(entry => (
            <JournalCard
              key={entry.id}
              entry={entry}
              onClick={() => setSelectedEntry(entry)}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="fab-button fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform active:scale-90 z-40 no-print"
        style={{ backgroundColor: 'var(--color-primary)' }}
        aria-label="Add Journal Entry"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Add / Edit Sheet */}
      <AddJournalSheet
        isOpen={showAddSheet || !!editingEntry}
        onClose={() => { setShowAddSheet(false); setEditingEntry(null); }}
        onAdd={addEntry}
        onUpdate={updateEntry}
        editEntry={editingEntry}
        existingMonthKeys={entries.map(e => e.monthKey)}
      />

      {/* Detail View */}
      {selectedEntry && (
        <JournalDetail
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEdit={(e) => {
            setSelectedEntry(null);
            setEditingEntry(e);
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
