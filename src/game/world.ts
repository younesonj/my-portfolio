/* Shared world state and types. The game loop, the maps and the UI toys all meet here. */
import type { SectionId } from '../content';
import type { TimeMode, Weather } from '../bus';
import type { Win } from './buildings';
import type { Cv, G } from './gfx';
import type { Dir } from './sprites';

export interface Hot {
  x: number; y: number; w: number; h: number;
  label?: string;
  /** Runs when the player presses the action key next to it. */
  act?: () => void;
  /** Runs when the player walks onto it facing `dir` (doors). */
  auto?: () => void;
  dir?: Dir;
}
export interface Prop { y: number; draw: (g: G, t: number) => void }
export interface Ent {
  x: number; y: number;
  solid?: number;
  reach?: number;
  label?: string;
  dead?: boolean;
  draw: (g: G, t: number) => void;
  update?: (dt: number) => void;
  act?: () => void;
}
export interface Light { x: number; y: number; r: number }

export interface GameMap {
  id: string;
  name: string;
  section?: SectionId;
  w: number; h: number;
  solid: Uint8Array;
  base: Cv;
  hots: Hot[];
  props: Prop[];
  ents: Ent[];
  lights: Light[];
  wins: Win[];
  outdoor: boolean;
  /** Indoor darkness 0..1 (the server room). */
  dark?: number;
  bg: string;
  under?: (g: G, t: number) => void;
  over?: (g: G, t: number) => void;
}

export const world = {
  map: null as unknown as GameMap,
  maps: {} as Record<string, GameMap>,
  player: { x: 0, y: 0, dir: 'up' as Dir, moving: false, anim: 0 },
  t: 0,
  hour: 12,
  /** 0 = full day, 1 = full night. */
  night: 0,
  timeMode: 'auto' as TimeMode,
  weather: 'clear' as Weather,
  reduce: false,
  touch: false,
  /** Set by the game loop. */
  goto: (_map: string, _x: number, _y: number, _dir?: Dir) => {},
  shake: 0,
};

export const lit = (): boolean => world.night > 0.45;
