import { encounters } from './encounters';
import type { EncounterId } from './encounters';

export interface Progress { version: 1; completed: EncounterId[]; bonuses: EncounterId[] }
export const storageKey = 'holy-hell-progress-v1';
export function emptyProgress(): Progress { return { version: 1, completed: [], bonuses: [] }; }

export function parseProgress(raw: string | null): Progress {
  try {
    const data: unknown = JSON.parse(raw ?? 'null');
    if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1) return emptyProgress();
    const saved = data as Record<string, unknown>;
    const validIds = (list: unknown): EncounterId[] => Array.isArray(list) ? encounters.filter((encounter) => list.includes(encounter.id)).map((encounter) => encounter.id) : [];
    // Progress is a sequence; malformed storage cannot skip an encounter.
    const completed: EncounterId[] = [];
    for (const encounter of encounters) {
      if (!validIds(saved.completed).includes(encounter.id)) break;
      completed.push(encounter.id);
    }
    return { version: 1, completed, bonuses: validIds(saved.bonuses).filter((id) => completed.includes(id)) };
  } catch { return emptyProgress(); }
}

export function isUnlocked(progress: Progress, index: number): boolean {
  return index === 0 || progress.completed.includes(encounters[index - 1].id);
}

export function complete(progress: Progress, id: EncounterId, bonus: boolean): Progress {
  const index = encounters.findIndex((encounter) => encounter.id === id);
  if (index < 0 || !isUnlocked(progress, index)) return progress;
  return {
    version: 1,
    completed: encounters.filter((encounter) => encounter.id === id || progress.completed.includes(encounter.id)).map((encounter) => encounter.id),
    bonuses: encounters.filter((encounter) => progress.bonuses.includes(encounter.id) || (encounter.id === id && bonus)).map((encounter) => encounter.id),
  };
}
