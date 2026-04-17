import { useState, useEffect, useCallback } from 'react';
import { entriesDb } from '@/lib/db';
import type { FoodEntry, FilterType } from '@/types';

export function useEntries() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const loadEntries = useCallback(async () => {
    try {
      const stored = await entriesDb.getAll();
      stored.sort((a, b) => b.createdAt - a.createdAt);
      setEntries(stored);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (entry: FoodEntry) => {
    await entriesDb.add(entry);
    setEntries(prev => [entry, ...prev]);
  }, []);

  const updateEntry = useCallback(async (entry: FoodEntry) => {
    await entriesDb.update(entry);
    setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await entriesDb.delete(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const filteredEntries = filter === 'all'
    ? entries
    : entries.filter(e => e.reaction === filter);

  const stats = {
    total: entries.length,
    loved: entries.filter(e => e.reaction === 'loved').length,
    notSure: entries.filter(e => e.reaction === 'neutral').length,
    noThanks: entries.filter(e => e.reaction === 'disliked').length,
  };

  return {
    entries,
    filteredEntries,
    isLoading,
    filter,
    setFilter,
    addEntry,
    updateEntry,
    deleteEntry,
    stats,
    loadEntries,
  };
}
