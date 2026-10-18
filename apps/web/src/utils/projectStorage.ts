// =============================================================================
// projectStorage — Unified project persistence for Desktop (Tauri) and Web
// =============================================================================
// Automatically detects if running inside Tauri or a standard web browser.
// When inside Tauri, projects are stored in AppData/projects/*.json.
// When in a web browser (e.g. local dev server), localStorage is used.
// =============================================================================

import type { CalendarProject } from '@calendar-creator/shared-types';

export interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_KEY_PREFIX = 'calendar_creator_proj_';
const LOCAL_STORAGE_INDEX_KEY = 'calendar_creator_index';

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
};

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

  // Web fallback (localStorage)
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
        } catch (e) {
          console.error('Error parsing local storage project', id, e);
        }
      }
    }
    loadedProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return loadedProjects;
  } catch (e) {
    console.error('Failed to load projects from localStorage', e);
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

  // Web fallback
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + id);
  if (!raw) return null;
  return JSON.parse(raw);
}

/**
 * Save or update a project
 */
export async function saveProjectData(project: CalendarProject): Promise<void> {
  if (!project.id) return;

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

  // Web fallback
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + project.id, JSON.stringify(project));
    const indexRaw = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
    const ids: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    if (!ids.includes(project.id)) {
      ids.push(project.id);
      localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, JSON.stringify(ids));
    }
  } catch (e) {
    console.error('Failed to save project to localStorage', e);
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

  // Web fallback
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
