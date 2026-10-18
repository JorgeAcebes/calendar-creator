// =============================================================================
// projectStorage — Unified project persistence for Desktop (Tauri) and Web
// =============================================================================
// Automatically detects if running inside Tauri or a standard web browser.
// When inside Tauri, projects are stored in AppData/projects/*.json.
// When in a web browser (e.g. local dev server), IndexedDB is used with
// localStorage fallback to comfortably support high-resolution photos.
// =============================================================================

import type { CalendarProject } from '@calendar-creator/shared-types';
import { imagePreviewDataCache } from './imageCache';

export interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_KEY_PREFIX = 'calendar_creator_proj_';
const LOCAL_STORAGE_INDEX_KEY = 'calendar_creator_index';
const IDB_NAME = 'CalendarCreatorDB';
const IDB_VERSION = 1;
const IDB_STORE = 'projects';

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
};

// -----------------------------------------------------------------------------
// IndexedDB Helpers (Native Promises, Zero External Dependencies)
// -----------------------------------------------------------------------------

function openIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to localStorage');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

async function idbGetAll(): Promise<CalendarProject[]> {
  const db = await openIDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result as CalendarProject[]) || []);
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function idbGet(id: string): Promise<CalendarProject | null> {
  const db = await openIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as CalendarProject) || null);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut(project: CalendarProject): Promise<boolean> {
  const db = await openIDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const request = store.put(project);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function idbDelete(id: string): Promise<boolean> {
  const db = await openIDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

// -----------------------------------------------------------------------------
// Unified Storage API
// -----------------------------------------------------------------------------

/**
 * List all saved projects
 */
export async function listProjects(): Promise<ProjectListItem[]> {
  if (isTauri()) {
    try {
      const { readDir, readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const entries = await readDir('projects', { baseDir: BaseDirectory.AppData });
      const loadedProjects: ProjectListItem[] = [];
      for (const entry of entries) {
        if (entry.name && entry.name.endsWith('.json')) {
          try {
            const data = await readTextFile(`projects/${entry.name}`, { baseDir: BaseDirectory.AppData });
            const proj: CalendarProject = JSON.parse(data);
            loadedProjects.push({
              id: proj.id,
              name: proj.name,
              createdAt: proj.createdAt || new Date().toISOString(),
              updatedAt: proj.updatedAt || new Date().toISOString(),
            });
          } catch (e) {
            console.error('Error parsing project file', entry.name, e);
          }
        }
      }
      loadedProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return loadedProjects;
    } catch (e) {
      console.warn('No appdata dir found or error reading from Tauri fs', e);
      return [];
    }
  }

  // Web mode: Try IndexedDB first
  try {
    const idbProjects = await idbGetAll();
    if (idbProjects && idbProjects.length > 0) {
      return idbProjects
        .map((proj) => ({
          id: proj.id,
          name: proj.name,
          createdAt: proj.createdAt || new Date().toISOString(),
          updatedAt: proj.updatedAt || new Date().toISOString(),
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  } catch (e) {
    console.warn('Error reading from IndexedDB, checking localStorage', e);
  }

  // Fallback to localStorage (and migrate any existing localStorage projects to IndexedDB)
  try {
    const indexRaw = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
    const ids: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    const loadedProjects: ProjectListItem[] = [];

    for (const id of ids) {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + id);
      if (raw) {
        try {
          const proj: CalendarProject = JSON.parse(raw);
          loadedProjects.push({
            id: proj.id,
            name: proj.name,
            createdAt: proj.createdAt || new Date().toISOString(),
            updatedAt: proj.updatedAt || new Date().toISOString(),
          });
          // Migrate to IndexedDB in background
          idbPut(proj).catch(() => {});
        } catch (e) {
          console.error('Error parsing local storage project', id, e);
        }
      }
    }
    loadedProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return loadedProjects;
  } catch (e) {
    console.error('Failed to load projects from storage', e);
    return [];
  }
}

/**
 * Load a single project by ID
 */
export async function loadProjectData(id: string): Promise<CalendarProject | null> {
  if (isTauri()) {
    const { readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const data = await readTextFile(`projects/${id}.json`, { baseDir: BaseDirectory.AppData });
    return JSON.parse(data);
  }

  // Web mode: Try IndexedDB first
  try {
    const idbProject = await idbGet(id);
    if (idbProject) return idbProject;
  } catch (e) {
    console.warn('Error loading from IndexedDB', e);
  }

  // Fallback to localStorage
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + id);
  if (!raw) return null;
  try {
    const project = JSON.parse(raw);
    // Migrate to IndexedDB
    idbPut(project).catch(() => {});
    return project;
  } catch {
    return null;
  }
}

/**
 * Save or update a project
 */
export async function saveProjectData(project: CalendarProject): Promise<void> {
  if (!project.id) return;

  // Ensure heavy previewDataUrls from in-memory cache are restored before persisting
  if (project.images) {
    for (const [imgId, img] of Object.entries(project.images)) {
      if (!img.previewDataUrl) {
        const cached = imagePreviewDataCache.get(imgId);
        if (cached) {
          img.previewDataUrl = cached;
        }
      }
    }
  }

  if (isTauri()) {
    const { writeTextFile, BaseDirectory, mkdir } = await import('@tauri-apps/plugin-fs');
    try {
      await mkdir('projects', { baseDir: BaseDirectory.AppData, recursive: true });
    } catch (_) {}
    await writeTextFile(`projects/${project.id}.json`, JSON.stringify(project), {
      baseDir: BaseDirectory.AppData,
    });
    return;
  }

  // Web mode: Save to IndexedDB (supports large blobs/photos)
  const savedToIdb = await idbPut(project);
  if (savedToIdb) {
    // Keep index updated in localStorage as lightweight reference
    try {
      const indexRaw = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
      const ids: string[] = indexRaw ? JSON.parse(indexRaw) : [];
      if (!ids.includes(project.id)) {
        ids.push(project.id);
        localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(ids));
      }
    } catch (_) {}
    return;
  }

  // Fallback to localStorage if IndexedDB not available
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + project.id, JSON.stringify(project));
    const indexRaw = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
    const ids: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    if (!ids.includes(project.id)) {
      ids.push(project.id);
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(ids));
    }
  } catch (e) {
    console.error('Failed to save project to storage', e);
  }
}

/**
 * Delete a project by ID
 */
export async function deleteProjectData(id: string): Promise<void> {
  if (isTauri()) {
    const { remove, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    await remove(`projects/${id}.json`, { baseDir: BaseDirectory.AppData });
    return;
  }

  // Web mode: Delete from IndexedDB and localStorage
  await idbDelete(id).catch(() => {});

  localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + id);
  const indexRaw = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
  if (indexRaw) {
    const ids: string[] = JSON.parse(indexRaw);
    const filtered = ids.filter((x) => x !== id);
    localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(filtered));
  }
}

/**
 * Duplicate an existing project
 */
export async function duplicateProjectData(id: string): Promise<CalendarProject | null> {
  const original = await loadProjectData(id);
  if (!original) return null;

  const duplicate: CalendarProject = {
    ...original,
    id: crypto.randomUUID(),
    name: `${original.name} (Copia)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveProjectData(duplicate);
  return duplicate;
}
