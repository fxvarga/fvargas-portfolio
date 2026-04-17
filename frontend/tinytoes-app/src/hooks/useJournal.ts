import { useState, useEffect, useCallback } from 'react';
import { journalDb, scheduleAutoBackup } from '@/lib/db';
import type { JournalEntry } from '@/types';

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    try {
      const stored = await journalDb.getAll();
      stored.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      setEntries(stored);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (entry: JournalEntry) => {
    await journalDb.add(entry);
    setEntries(prev => [entry, ...prev]);
    scheduleAutoBackup();
  }, []);

  const updateEntry = useCallback(async (entry: JournalEntry) => {
    await journalDb.update(entry);
    setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
    scheduleAutoBackup();
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await journalDb.delete(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    scheduleAutoBackup();
  }, []);

  return {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    loadEntries,
  };
}
