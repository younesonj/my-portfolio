/* Hooks the game registers so UI toys (the terminal, the pipeline) can poke the world
   without importing the game loop. */
export type TimeMode = 'auto' | 'dawn' | 'day' | 'dusk' | 'night';
export type Weather = 'clear' | 'wind' | 'rain';

export interface Hooks {
  setTime(mode: TimeMode): void;
  setWeather(w: Weather): void;
  clock(): string;
  cats(): { name: string; age: number }[];
  scaleCats(n: number): number;
  killCat(name: string): boolean;
  restoreDrill(): void;
  irc(msg: string): void;
  sfx(name: string): void;
}

export const hooks = {} as Hooks;
