import { openDB, type IDBPDatabase } from 'idb';
import type { BabyProfile, FoodEntry, Milestone, JournalEntry, AppData, BookProject } from '@/types';
import { EMOJI_TO_REACTION } from '@/types';
import { clearStoredImages, isNativeApp, storeImageReference } from './storage-adapter';

// =============================================================================
// Native storage helpers — route through Swift bridge when in iOS wrapper
// =============================================================================

const ns = () => window.nativeStorage!;

async function nativeGet<T>(store: string, key: string): Promise<T | undefined> {
  const result = await ns().get(store, key);
  return (result === null || result === undefined) ? undefined : result as T;
}

async function nativeGetAll<T>(store: string, sortKey?: string, reverse = true): Promise<T[]> {
  const items = (await ns().getAll(store)) as T[];
  if (sortKey) {
    items.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey] as number;
      const bv = (b as Record<string, unknown>)[sortKey] as number;
      return reverse ? bv - av : av - bv;
    });
  }
  return items;
}

async function nativePut<T>(store: string, key: string, value: T): Promise<void> {
  await ns().put(store, key, value);
}

async function withStoredProfileImages(profile: BabyProfile): Promise<BabyProfile> {
  return { ...profile, photo: await storeImageReference(profile.photo) };
}

async function withStoredFoodImages(entry: FoodEntry): Promise<FoodEntry> {
  return { ...entry, image: await storeImageReference(entry.image) };
}

async function withStoredMilestoneImages(milestone: Milestone): Promise<Milestone> {
  return { ...milestone, image: await storeImageReference(milestone.image) };
}

async function withStoredJournalImages(entry: JournalEntry): Promise<JournalEntry> {
  return {
    ...entry,
    image: await storeImageReference(entry.image),
    images: entry.images ? await Promise.all(entry.images.map(async image => await storeImageReference(image) ?? image)) : entry.images,
  };
}

async function withStoredBookProjectImages(project: BookProject): Promise<BookProject> {
  return {
    ...project,
    cover: {
      ...project.cover,
      photo: await storeImageReference(project.cover.photo),
    },
    pages: await Promise.all(project.pages.map(async page => ({
      ...page,
      items: await Promise.all(page.items.map(async item => ({
        ...item,
        image: await storeImageReference(item.image),
      }))),
    }))),
  };
}

async function nativeDelete(store: string, key: string): Promise<void> {
  await ns().delete(store, key);
}

async function nativeClear(store: string): Promise<void> {
  await ns().clear(store);
}

// =============================================================================
// IndexedDB setup (browser/PWA path)
// =============================================================================

const DB_NAME = 'tinytoes';
const DB_VERSION = 5;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          db.createObjectStore('profile');
          const store = db.createObjectStore('entries', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
        if (oldVersion < 2) {
          const backupStore = db.createObjectStore('autoBackups', { keyPath: 'id' });
          backupStore.createIndex('createdAt', 'createdAt');
        }
        if (oldVersion < 3) {
          const milestoneStore = db.createObjectStore('milestones', { keyPath: 'id' });
          milestoneStore.createIndex('achievedAt', 'achievedAt');
          milestoneStore.createIndex('category', 'category');

          const journalStore = db.createObjectStore('journal', { keyPath: 'id' });
          journalStore.createIndex('monthKey', 'monthKey', { unique: true });
          journalStore.createIndex('createdAt', 'createdAt');
        }
        if (oldVersion < 4) {
          // Migrate reaction emoji values → string keys
          const entryStore = tx.objectStore('entries');
          let cursor = await entryStore.openCursor();
          while (cursor) {
            const entry = cursor.value as FoodEntry & { reaction: string };
            const mapped = EMOJI_TO_REACTION[entry.reaction];
            if (mapped) {
              entry.reaction = mapped;
              await cursor.update(entry);
            }
            cursor = await cursor.continue();
          }

          // Also migrate auto-backup data so restored backups use new keys
          const backupStore = tx.objectStore('autoBackups');
          let bCursor = await backupStore.openCursor();
          while (bCursor) {
            const backup = bCursor.value;
            let changed = false;
            if (backup.data?.entries) {
              for (const e of backup.data.entries) {
                const m = EMOJI_TO_REACTION[e.reaction];
                if (m) { e.reaction = m; changed = true; }
              }
            }
            if (changed) await bCursor.update(backup);
            bCursor = await bCursor.continue();
          }
        }
        if (oldVersion < 5) {
          const bookStore = db.createObjectStore('bookProjects', { keyPath: 'id' });
          bookStore.createIndex('updatedAt', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
}

// =============================================================================
// Profile DB
// =============================================================================

export const profileDb = {
  async get(): Promise<BabyProfile | undefined> {
    if (isNativeApp()) return nativeGet<BabyProfile>('profile', 'current');
    const db = await getDb();
    return db.get('profile', 'current');
  },

  async set(profile: BabyProfile): Promise<void> {
    if (isNativeApp()) { await nativePut('profile', 'current', await withStoredProfileImages(profile)); return; }
    const db = await getDb();
    await db.put('profile', profile, 'current');
  },

  async clear(): Promise<void> {
    if (isNativeApp()) { await nativeDelete('profile', 'current'); return; }
    const db = await getDb();
    await db.delete('profile', 'current');
  },
};

// =============================================================================
// Entries DB
// =============================================================================

export const entriesDb = {
  async getAll(): Promise<FoodEntry[]> {
    if (isNativeApp()) return nativeGetAll<FoodEntry>('entries', 'createdAt', true);
    const db = await getDb();
    const entries = await db.getAllFromIndex('entries', 'createdAt');
    return entries.reverse();
  },

  async get(id: string): Promise<FoodEntry | undefined> {
    if (isNativeApp()) return nativeGet<FoodEntry>('entries', id);
    const db = await getDb();
    return db.get('entries', id);
  },

  async add(entry: FoodEntry): Promise<void> {
    if (isNativeApp()) { await nativePut('entries', entry.id, await withStoredFoodImages(entry)); return; }
    const db = await getDb();
    await db.add('entries', entry);
  },

  async update(entry: FoodEntry): Promise<void> {
    if (isNativeApp()) { await nativePut('entries', entry.id, await withStoredFoodImages(entry)); return; }
    const db = await getDb();
    await db.put('entries', entry);
  },

  async delete(id: string): Promise<void> {
    if (isNativeApp()) { await nativeDelete('entries', id); return; }
    const db = await getDb();
    await db.delete('entries', id);
  },

  async clear(): Promise<void> {
    if (isNativeApp()) { await nativeClear('entries'); return; }
    const db = await getDb();
    await db.clear('entries');
  },
};

export async function clearAllData(): Promise<void> {
  await profileDb.clear();
  await entriesDb.clear();
  await milestonesDb.clear();
  await journalDb.clear();
  await clearStoredImages();
}

// =============================================================================
// Milestones DB
// =============================================================================

export const milestonesDb = {
  async getAll(): Promise<Milestone[]> {
    if (isNativeApp()) return nativeGetAll<Milestone>('milestones', 'achievedAt', true);
    const db = await getDb();
    const milestones = await db.getAllFromIndex('milestones', 'achievedAt');
    return milestones.reverse();
  },

  async get(id: string): Promise<Milestone | undefined> {
    if (isNativeApp()) return nativeGet<Milestone>('milestones', id);
    const db = await getDb();
    return db.get('milestones', id);
  },

  async add(milestone: Milestone): Promise<void> {
    if (isNativeApp()) { await nativePut('milestones', milestone.id, await withStoredMilestoneImages(milestone)); return; }
    const db = await getDb();
    await db.add('milestones', milestone);
  },

  async update(milestone: Milestone): Promise<void> {
    if (isNativeApp()) { await nativePut('milestones', milestone.id, await withStoredMilestoneImages(milestone)); return; }
    const db = await getDb();
    await db.put('milestones', milestone);
  },

  async delete(id: string): Promise<void> {
    if (isNativeApp()) { await nativeDelete('milestones', id); return; }
    const db = await getDb();
    await db.delete('milestones', id);
  },

  async clear(): Promise<void> {
    if (isNativeApp()) { await nativeClear('milestones'); return; }
    const db = await getDb();
    await db.clear('milestones');
  },
};

// =============================================================================
// Journal DB
// =============================================================================

export const journalDb = {
  async getAll(): Promise<JournalEntry[]> {
    if (isNativeApp()) return nativeGetAll<JournalEntry>('journal', 'createdAt', true);
    const db = await getDb();
    const entries = await db.getAllFromIndex('journal', 'createdAt');
    return entries.reverse();
  },

  async getByMonth(monthKey: string): Promise<JournalEntry | undefined> {
    if (isNativeApp()) {
      // Native: scan all and find by monthKey
      const all = await nativeGetAll<JournalEntry>('journal');
      return all.find(e => e.monthKey === monthKey);
    }
    const db = await getDb();
    return db.getFromIndex('journal', 'monthKey', monthKey);
  },

  async get(id: string): Promise<JournalEntry | undefined> {
    if (isNativeApp()) return nativeGet<JournalEntry>('journal', id);
    const db = await getDb();
    return db.get('journal', id);
  },

  async add(entry: JournalEntry): Promise<void> {
    if (isNativeApp()) { await nativePut('journal', entry.id, await withStoredJournalImages(entry)); return; }
    const db = await getDb();
    await db.add('journal', entry);
  },

  async update(entry: JournalEntry): Promise<void> {
    if (isNativeApp()) { await nativePut('journal', entry.id, await withStoredJournalImages(entry)); return; }
    const db = await getDb();
    await db.put('journal', entry);
  },

  async delete(id: string): Promise<void> {
    if (isNativeApp()) { await nativeDelete('journal', id); return; }
    const db = await getDb();
    await db.delete('journal', id);
  },

  async clear(): Promise<void> {
    if (isNativeApp()) { await nativeClear('journal'); return; }
    const db = await getDb();
    await db.clear('journal');
  },
};

// =============================================================================
// Book Projects DB
// =============================================================================

export const bookProjectsDb = {
  async getAll(): Promise<BookProject[]> {
    if (isNativeApp()) return nativeGetAll<BookProject>('bookProjects', 'updatedAt', true);
    const db = await getDb();
    const projects = await db.getAllFromIndex('bookProjects', 'updatedAt');
    return projects.reverse();
  },

  async get(id: string): Promise<BookProject | undefined> {
    if (isNativeApp()) return nativeGet<BookProject>('bookProjects', id);
    const db = await getDb();
    return db.get('bookProjects', id);
  },

  async add(project: BookProject): Promise<void> {
    if (isNativeApp()) { await nativePut('bookProjects', project.id, await withStoredBookProjectImages(project)); return; }
    const db = await getDb();
    await db.add('bookProjects', project);
  },

  async update(project: BookProject): Promise<void> {
    const updated = { ...project, updatedAt: Date.now() };
    if (isNativeApp()) { await nativePut('bookProjects', updated.id, await withStoredBookProjectImages(updated)); return; }
    const db = await getDb();
    await db.put('bookProjects', updated);
  },

  async delete(id: string): Promise<void> {
    if (isNativeApp()) { await nativeDelete('bookProjects', id); return; }
    const db = await getDb();
    await db.delete('bookProjects', id);
  },

  async clear(): Promise<void> {
    if (isNativeApp()) { await nativeClear('bookProjects'); return; }
    const db = await getDb();
    await db.clear('bookProjects');
  },
};

// =============================================================================
// Auto-backup system
// =============================================================================

export interface AutoBackup {
  id: string;
  createdAt: number;
  entryCount: number;
  data: AppData;
}

const MAX_AUTO_BACKUPS = 5;

export const autoBackupsDb = {
  async getAll(): Promise<AutoBackup[]> {
    if (isNativeApp()) return nativeGetAll<AutoBackup>('autoBackups', 'createdAt', true);
    const db = await getDb();
    const backups = await db.getAllFromIndex('autoBackups', 'createdAt');
    return backups.reverse();
  },

  async save(backup: AutoBackup): Promise<void> {
    if (isNativeApp()) {
      await nativePut('autoBackups', backup.id, backup);
      // Prune old backups
      const all = await nativeGetAll<AutoBackup>('autoBackups', 'createdAt', false);
      if (all.length > MAX_AUTO_BACKUPS) {
        const toRemove = all.slice(0, all.length - MAX_AUTO_BACKUPS);
        for (const old of toRemove) {
          await nativeDelete('autoBackups', old.id);
        }
      }
      return;
    }
    const db = await getDb();
    await db.put('autoBackups', backup);

    // Prune old backups beyond MAX_AUTO_BACKUPS
    const all = await db.getAllFromIndex('autoBackups', 'createdAt');
    if (all.length > MAX_AUTO_BACKUPS) {
      const toRemove = all.slice(0, all.length - MAX_AUTO_BACKUPS);
      for (const old of toRemove) {
        await db.delete('autoBackups', old.id);
      }
    }
  },

  async delete(id: string): Promise<void> {
    if (isNativeApp()) { await nativeDelete('autoBackups', id); return; }
    const db = await getDb();
    await db.delete('autoBackups', id);
  },

  async clear(): Promise<void> {
    if (isNativeApp()) { await nativeClear('autoBackups'); return; }
    const db = await getDb();
    await db.clear('autoBackups');
  },
};

let backupTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleAutoBackup(): void {
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    runAutoBackup();
  }, 3000); // debounce 3s after last mutation
}

export async function runAutoBackup(): Promise<void> {
  try {
    const profile = await profileDb.get();
    if (!profile || !profile.onboardingComplete) return; // nothing to backup yet

    const entries = await entriesDb.getAll();
    const milestones = await milestonesDb.getAll();
    const journal = await journalDb.getAll();
    if (entries.length === 0 && milestones.length === 0 && journal.length === 0) return;

    const data: AppData = { profile, entries, milestones, journal };
    const backup: AutoBackup = {
      id: `auto-${Date.now()}`,
      createdAt: Date.now(),
      entryCount: entries.length + milestones.length + journal.length,
      data,
    };

    await autoBackupsDb.save(backup);
  } catch {
    // Silent fail — auto-backup should never break the app
  }
}
