import type { AppData, BabyProfile, FoodEntry, JournalEntry, Milestone, Reaction } from '@/types';
import { EMOJI_TO_REACTION } from '@/types';
import { profileDb, entriesDb, milestonesDb, journalDb } from './db';
import {
  clearStoredImages,
  downloadLatestBackupFromCloud,
  resolveImageForExport,
  shareOrDownloadFile,
  storeImageReference,
  uploadBackupToCloud,
  type CloudBackupMeta,
} from './storage-adapter';

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
  const data = await buildExportData();
  const json = JSON.stringify(data, null, 2);
  const filename = `tinytoes-backup-${new Date().toISOString().split('T')[0]}.json`;
  await shareOrDownloadFile(filename, json, 'application/json');
}

export async function exportDataToCloudKit(): Promise<CloudBackupMeta> {
  const data = await buildExportData();
  const json = JSON.stringify(data, null, 2);
  const filename = `tinytoes-backup-${new Date().toISOString().split('T')[0]}.json`;
  return uploadBackupToCloud(filename, json, 'application/json');
}

async function buildExportData(): Promise<AppData> {
  const profile = await profileDb.get();
  const entries = await entriesDb.getAll();
  const milestones = await milestonesDb.getAll();
  const journal = await journalDb.getAll();

  return {
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
  return importDataFromJsonText(await file.text());
}

export async function importLatestCloudBackup(): Promise<{
  profile: BabyProfile;
  entryCount: number;
  cloudBackup: CloudBackupMeta;
}> {
  const downloaded = await downloadLatestBackupFromCloud();
  if (!downloaded) {
    throw new Error('No CloudKit backup found.');
  }
  const imported = await importDataFromJsonText(downloaded.content);
  return {
    ...imported,
    cloudBackup: downloaded.meta,
  };
}

async function importDataFromJsonText(text: string): Promise<{ profile: BabyProfile; entryCount: number }> {
  let data: AppData;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  return runTwoPhaseImport(data);
}

async function runTwoPhaseImport(data: AppData): Promise<{ profile: BabyProfile; entryCount: number }> {
  const validated = validateAndNormalizeBackup(data);
  const previous = await snapshotCurrentData();
  const staged = await stageImport(validated);

  try {
    await commitImport(staged);
  } catch (error) {
    await restoreSnapshot(previous);
    const reason = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Import failed and previous data was restored. (${reason})`);
  }

  const totalCount = staged.entries.length + staged.milestones.length + staged.journal.length;
  return { profile: staged.profile, entryCount: totalCount };
}

function validateAndNormalizeBackup(data: AppData): Required<AppData> {
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

  return {
    profile: data.profile,
    entries: data.entries,
    milestones: Array.isArray(data.milestones) ? data.milestones : [],
    journal: Array.isArray(data.journal) ? data.journal : [],
  };
}

async function stageImport(data: Required<AppData>): Promise<Required<AppData>> {
  return {
    profile: await storeProfileImages(data.profile),
    entries: await Promise.all(data.entries.map(async entry => await storeFoodImages(entry))),
    milestones: await Promise.all(data.milestones.map(async milestone => await storeMilestoneImages(milestone))),
    journal: await Promise.all(data.journal.map(async entry => await storeJournalImages(entry))),
  };
}

async function snapshotCurrentData(): Promise<Required<AppData>> {
  const currentProfile = await profileDb.get();
  return {
    profile: currentProfile ?? {
      name: '',
      ageRange: '6–9 months',
      theme: 'Neutral',
      photo: null,
      onboardingComplete: false,
    },
    entries: await entriesDb.getAll(),
    milestones: await milestonesDb.getAll(),
    journal: await journalDb.getAll(),
  };
}

async function clearAllStoresForImport(): Promise<void> {
  await clearStoredImages();
  await profileDb.clear();
  await entriesDb.clear();
  await milestonesDb.clear();
  await journalDb.clear();
}

async function commitImport(data: Required<AppData>): Promise<void> {
  await clearAllStoresForImport();

  await profileDb.set(data.profile);
  for (const entry of data.entries) {
    await entriesDb.add(entry);
  }
  for (const milestone of data.milestones) {
    await milestonesDb.add(milestone);
  }
  for (const entry of data.journal) {
    await journalDb.add(entry);
  }
}

async function restoreSnapshot(data: Required<AppData>): Promise<void> {
  try {
    await clearAllStoresForImport();
    await profileDb.set(data.profile);
    for (const entry of data.entries) {
      await entriesDb.add(entry);
    }
    for (const milestone of data.milestones) {
      await milestonesDb.add(milestone);
    }
    for (const entry of data.journal) {
      await journalDb.add(entry);
    }
  } catch {
    console.error('Failed to restore data snapshot after import failure.');
  }
}
