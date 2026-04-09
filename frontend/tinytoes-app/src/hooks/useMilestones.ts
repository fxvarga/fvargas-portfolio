import { useState, useEffect, useCallback } from 'react';
import { milestonesDb, scheduleAutoBackup } from '@/lib/db';
import type { Milestone, MilestoneCategory } from '@/types';

export function useMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<MilestoneCategory | 'all'>('all');

  const loadMilestones = useCallback(async () => {
    try {
      const stored = await milestonesDb.getAll();
      setMilestones(stored);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const addMilestone = useCallback(async (milestone: Milestone) => {
    await milestonesDb.add(milestone);
    setMilestones(prev => [milestone, ...prev]);
    scheduleAutoBackup();
  }, []);

  const updateMilestone = useCallback(async (milestone: Milestone) => {
    await milestonesDb.update(milestone);
    setMilestones(prev => prev.map(m => m.id === milestone.id ? milestone : m));
    scheduleAutoBackup();
  }, []);

  const deleteMilestone = useCallback(async (id: string) => {
    await milestonesDb.delete(id);
    setMilestones(prev => prev.filter(m => m.id !== id));
    scheduleAutoBackup();
  }, []);

  const filteredMilestones = categoryFilter === 'all'
    ? milestones
    : milestones.filter(m => m.category === categoryFilter);

  const stats = {
    total: milestones.length,
    motor: milestones.filter(m => m.category === 'motor').length,
    social: milestones.filter(m => m.category === 'social').length,
    language: milestones.filter(m => m.category === 'language').length,
    cognitive: milestones.filter(m => m.category === 'cognitive').length,
    feeding: milestones.filter(m => m.category === 'feeding').length,
    other: milestones.filter(m => m.category === 'other').length,
  };

  return {
    milestones,
    filteredMilestones,
    isLoading,
    categoryFilter,
    setCategoryFilter,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    stats,
    loadMilestones,
  };
}
