/* Save file (localStorage) + a tiny event bus for progress. */
import { achievements, sectionOrder } from './content';

const KEY = 'younes-campus-v1';

export interface Save {
  visited: string[];
  ach: string[];
  flags: Record<string, boolean>;
}

export const save: Save = { visited: [], ach: [], flags: {} };

try {
  const raw = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<Save> | null;
  if (raw) {
    if (Array.isArray(raw.visited)) save.visited = raw.visited.filter((v) => (sectionOrder as string[]).includes(v));
    if (Array.isArray(raw.ach)) save.ach = raw.ach.filter((a) => a in achievements);
    if (raw.flags && typeof raw.flags === 'object') save.flags = raw.flags;
  }
} catch {
  /* private mode, corrupted save: start fresh */
}

export function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* ignore */
  }
}

type Ev = 'ach' | 'visit' | 'flag';
const subs: Record<Ev, ((id: string) => void)[]> = { ach: [], visit: [], flag: [] };
export const on = (ev: Ev, fn: (id: string) => void): void => void subs[ev].push(fn);
const emit = (ev: Ev, id: string) => subs[ev].forEach((f) => f(id));

export function unlock(id: string): boolean {
  if (!(id in achievements) || save.ach.includes(id)) return false;
  save.ach.push(id);
  persist();
  emit('ach', id);
  return true;
}

export function visit(id: string): void {
  if (save.visited.includes(id)) return;
  save.visited.push(id);
  persist();
  emit('visit', id);
  if (save.visited.length === sectionOrder.length) unlock('tour');
}

export const flag = (k: string): boolean => !!save.flags[k];
export function setFlag(k: string, v = true): void {
  if (!!save.flags[k] === v) return;
  save.flags[k] = v;
  persist();
  emit('flag', k);
}

export function resetSave(): void {
  save.visited = [];
  save.ach = [];
  save.flags = {};
  persist();
}
