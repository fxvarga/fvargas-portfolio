import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useJournal } from '@/hooks/useJournal';
import { ModuleNavBar } from '@/components/ModuleNavBar';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/PageHeader';
import { FAB } from '@/components/FAB';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MetricsBar } from '@/components/MetricsBar';
import { AddJournalSheet } from './AddJournalSheet';
import { JournalCard } from './JournalCard';
import { JournalDetail } from './JournalDetail';
import { BookOpen, CalendarDays, Sparkles, Camera } from 'lucide-react';
import type { JournalEntry } from '@/types';

export function JournalPage() {
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
    return <LoadingSpinner />;
  }

  return (
    <PageShell>
      <PageHeader title="Monthly Journal" />

      {/* Module Navigation Bar */}
      <ModuleNavBar activeSlug="monthly-journal" />

      {/* Stats bar */}
      <div className="px-4 pb-4">
        <MetricsBar
          metrics={[
            { label: 'Months', value: entries.length, icon: CalendarDays },
            { label: 'Highlights', value: entries.reduce((acc, e) => acc + e.highlights.length, 0), icon: Sparkles },
            { label: 'Photos', value: entries.filter(e => e.image).length, icon: Camera },
          ]}
        />
      </div>

      {/* Content */}
      <div className="px-4 space-y-3">
        {entries.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No journal entries yet"
            subtitle={`Tap the + button to write about ${profile.name || 'your baby'}'s month!`}
          />
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
      <FAB onClick={() => setShowAddSheet(true)} label="Add Journal Entry" />

      {/* Add / Edit Sheet */}
      <AddJournalSheet
        isOpen={showAddSheet || !!editingEntry}
        onClose={() => { setShowAddSheet(false); setEditingEntry(null); }}
        onAdd={addEntry}
        onUpdate={updateEntry}
        editEntry={editingEntry}
      />

      {/* Detail View */}
      {selectedEntry && (
        <JournalDetail
          entry={selectedEntry}
          items={entries}
          onNavigate={setSelectedEntry}
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
    </PageShell>
  );
}
