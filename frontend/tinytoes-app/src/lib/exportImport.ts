import type { AppData, BabyProfile, FoodEntry, JournalEntry, Milestone, Reaction } from '@/types';
import { EMOJI_TO_REACTION } from '@/types';
import { profileDb, entriesDb, milestonesDb, journalDb } from './db';
import {
  clearStoredImages,
  createNativeCloudSharePackage,
  importLatestNativeCloudSharePackage,
  resolveImageForExport,
  shareOrDownloadFile,
  storeImageReference,
  type CloudShareAssetInput,
  type CloudShareAssetPayload,
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
  const data = await buildPortableExportData();

  const json = JSON.stringify(data, null, 2);
  const filename = `tinytoes-backup-${new Date().toISOString().split('T')[0]}.json`;
  await shareOrDownloadFile(filename, json, 'application/json');
}

export async function shareAppStateWithCloudKit(): Promise<void> {
  const { manifest, assets } = await buildCloudSharePackage();
  await createNativeCloudSharePackage(JSON.stringify(manifest), assets);
}

export async function importLatestCloudShare(): Promise<{ profile: BabyProfile; entryCount: number }> {
  const sharePackage = await importLatestNativeCloudSharePackage();
  if (!sharePackage) {
    throw new Error('No shared TinyToes memories were found in iCloud.');
  }

  const manifest = JSON.parse(sharePackage.manifestJson) as AppData;
  const restored = restoreCloudAssetReferences(manifest, sharePackage.assets);
  return importDataObject(restored);
}

async function buildPortableExportData(): Promise<AppData> {
  const profile = await profileDb.get();
  const entries = await entriesDb.getAll();
  const milestones = await milestonesDb.getAll();
  const journal = await journalDb.getAll();

  return {
    profile: profile ? {
      ...profile,
      photo: await resolveImageForExport(profile.photo),
    } : defaultProfile(),
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

async function buildCloudSharePackage(): Promise<{ manifest: AppData; assets: CloudShareAssetInput[] }> {
  const data = await buildPortableExportData();
  const assets: CloudShareAssetInput[] = [];
  let counter = 0;

  const replaceImage = async (value: string | null, prefix: string): Promise<string | null> => {
    const dataUrl = await resolveImageForExport(value);
    if (!dataUrl) return null;
    const assetId = `${prefix}-${counter++}`;
    assets.push({
      assetId,
      dataUrl,
      fileName: `${assetId}.${extensionForDataUrl(dataUrl)}`,
      contentType: contentTypeForDataUrl(dataUrl),
    });
    return `cloudkit-asset:${assetId}`;
  };

  return {
    manifest: {
      profile: {
        ...data.profile,
        photo: await replaceImage(data.profile.photo, 'profile-photo'),
      },
      entries: await Promise.all(data.entries.map(async entry => ({
        ...entry,
        image: await replaceImage(entry.image, `food-${entry.id}`),
      }))),
      milestones: await Promise.all((data.milestones ?? []).map(async milestone => ({
        ...milestone,
        image: await replaceImage(milestone.image, `milestone-${milestone.id}`),
      }))),
      journal: await Promise.all((data.journal ?? []).map(async entry => ({
        ...entry,
        image: await replaceImage(entry.image, `journal-${entry.id}-cover`),
        images: entry.images ? (await Promise.all(entry.images.map((image, idx) => replaceImage(image, `journal-${entry.id}-${idx}`)))).filter((image): image is string => !!image) : entry.images,
      }))),
    },
    assets,
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

  return importDataObject(data);
}

async function importDataObject(data: AppData): Promise<{ profile: BabyProfile; entryCount: number }> {
  validateBackup(data);

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

  if (Array.isArray(data.milestones)) {
    for (const milestone of data.milestones) {
      await milestonesDb.add(await storeMilestoneImages(milestone));
    }
  }

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

function validateBackup(data: AppData): void {
  if (!data.profile || !Array.isArray(data.entries)) {
    throw new Error('Invalid backup format. Missing profile or entries.');
  }

  if (!data.profile.name || !data.profile.ageRange || !data.profile.theme) {
    throw new Error('Invalid profile data in backup.');
  }

  for (const entry of data.entries) {
    if (!entry.id || !entry.food || !entry.reaction || typeof entry.createdAt !== 'number') {
      throw new Error('Invalid entry data in backup.');
    }
    (entry as FoodEntry).reaction = normalizeReaction(entry.reaction as string);
  }
}

function restoreCloudAssetReferences(data: AppData, assets: CloudShareAssetPayload[]): AppData {
  const byId = new Map(assets.map(asset => [`cloudkit-asset:${asset.assetId}`, asset.dataUrl]));
  const restoreImage = (value: string | null | undefined) => value ? byId.get(value) ?? value : null;

  return {
    profile: { ...data.profile, photo: restoreImage(data.profile.photo) },
    entries: data.entries.map(entry => ({ ...entry, image: restoreImage(entry.image) })),
    milestones: (data.milestones ?? []).map(milestone => ({ ...milestone, image: restoreImage(milestone.image) })),
    journal: (data.journal ?? []).map(entry => ({
      ...entry,
      image: restoreImage(entry.image),
      images: entry.images?.map(image => restoreImage(image) ?? image),
    })),
  };
}

function defaultProfile(): BabyProfile {
  return {
    name: '',
    ageRange: '6–9 months',
    theme: 'Neutral',
    photo: null,
    onboardingComplete: false,
  };
}

function contentTypeForDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? 'image/jpeg';
}

function extensionForDataUrl(dataUrl: string): string {
  const contentType = contentTypeForDataUrl(dataUrl);
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}
