import type { AppData, BabyProfile, FoodEntry, JournalEntry, Milestone, Reaction } from '@/types';
import { EMOJI_TO_REACTION } from '@/types';
import { profileDb, entriesDb, milestonesDb, journalDb } from './db';
import { clearStoredImages, resolveImageForExport, shareOrDownloadFile, storeImageReference } from './storage-adapter';

/** Normalize a reaction value — handles both legacy emoji and new string keys */
function normalizeReaction(value: string): Reaction {
  // Already a valid new key
  if (value === 'loved' || value === 'neutral' || value === 'disliked') return value;
  // Legacy emoji
  const mapped = EMOJI_TO_REACTION[value];
  if (mapped) return mapped;
  // Fallback
  return 'neutral';
}

export async function exportData(): Promise<void> {
  const profile = await profileDb.get();
  const entries = await entriesDb.getAll();
  const milestones = await milestonesDb.getAll();
  const journal = await journalDb.getAll();

  const data: AppData = {
    profile: profile ? {
      ...profile,
      photo: await resolveImageForExport(profile.photo),
    } : {
      name: '',
      ageRange: '6–9 months',
      theme: 'Neutral',
      photo: null,
      onboardingComplete: false,
    },
    entries: await Promise.all(entries.map(async entry => ({
      ...entry,
      image: await resolveImageForExport(entry.image),
    }))),
    milestones: await Promise.all(milestones.map(async milestone => ({
      ...milestone,
      image: await resolveImageForExport(milestone.image),
    }))),
    journal: await Promise.all(journal.map(async entry => ({
      ...entry,
      image: await resolveImageForExport(entry.image),
      images: entry.images ? await Promise.all(entry.images.map(async image => await resolveImageForExport(image) ?? image)) : entry.images,
    }))),
  };

  const json = JSON.stringify(data, null, 2);
  const filename = `tinytoes-backup-${new Date().toISOString().split('T')[0]}.json`;
  await shareOrDownloadFile(filename, json, 'application/json');
}

async function storeProfileImages(profile: BabyProfile): Promise<BabyProfile> {
  return { ...profile, photo: await storeImageReference(profile.photo) };
}

async function storeFoodImages(entry: FoodEntry): Promise<FoodEntry> {
  return { ...entry, image: await storeImageReference(entry.image) };
}

async function storeMilestoneImages(milestone: Milestone): Promise<Milestone> {
  return { ...milestone, image: await storeImageReference(milestone.image) };
}

async function storeJournalImages(entry: JournalEntry): Promise<JournalEntry> {
  return {
    ...entry,
    image: await storeImageReference(entry.image),
    images: entry.images ? await Promise.all(entry.images.map(async image => await storeImageReference(image) ?? image)) : entry.images,
  };
}

export async function importData(file: File): Promise<{ profile: BabyProfile; entryCount: number }> {
  const text = await file.text();
  let data: AppData;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  if (!data.profile || !Array.isArray(data.entries)) {
    throw new Error('Invalid backup format. Missing profile or entries.');
  }

  if (!data.profile.name || !data.profile.ageRange || !data.profile.theme) {
    throw new Error('Invalid profile data in backup.');
  }

  // Validate and normalize entries (handle legacy emoji reactions on import)
  for (const entry of data.entries) {
    if (!entry.id || !entry.food || !entry.reaction || typeof entry.createdAt !== 'number') {
      throw new Error('Invalid entry data in backup.');
    }
    (entry as FoodEntry).reaction = normalizeReaction(entry.reaction as string);
  }

  // Clear existing data and import
  await clearStoredImages();
  await profileDb.clear();
  await entriesDb.clear();
  await milestonesDb.clear();
  await journalDb.clear();

  const profile = await storeProfileImages(data.profile);
  await profileDb.set(profile);

  for (const entry of data.entries) {
    await entriesDb.add(await storeFoodImages(entry));
  }

  // Import milestones if present
  if (Array.isArray(data.milestones)) {
    for (const milestone of data.milestones) {
      await milestonesDb.add(await storeMilestoneImages(milestone));
    }
  }

  // Import journal entries if present
  if (Array.isArray(data.journal)) {
    for (const entry of data.journal) {
      await journalDb.add(await storeJournalImages(entry));
    }
  }

  const totalCount = data.entries.length
    + (data.milestones?.length || 0)
    + (data.journal?.length || 0);

  return { profile, entryCount: totalCount };
}
