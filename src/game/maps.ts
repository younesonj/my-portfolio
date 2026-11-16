/* The campus and the interiors: geometry, props, and what happens when you poke things. */
import { about, contact, education, npc, projects, school, skills, work, type Item, type SectionId } from '../content';
import { hooks, type TimeMode } from '../bus';
import { flag, save, setFlag, unlock } from '../state';
import { ask, say, type Page } from '../ui/dialog';
import { openBoard, openMenu } from '../ui/panels';
import { openPipeline } from '../ui/pipeline';
import { openTerminal } from '../ui/terminal';
import { musicPlaying, sfx } from './audio';
import { drawBuilding, type BDef } from './buildings';
import { PAL, R, TILE, hash, label, mk, pixelText, type G } from './gfx';
import * as S from './sprites';
import { lit, world, type Ent, type GameMap, type Hot } from './world';

const T = TILE;

function newMap(id: string, name: string, w: number, h: number, outdoor: boolean, bg: string): GameMap {
  const [base] = mk(w * T, h * T);
  return { id, name, w, h, solid: new Uint8Array(w * h), base, hots: [], props: [], ents: [], lights: [], wins: [], outdoor, bg };
}
const solidRect = (m: GameMap, x: number, y: number, w: number, h: number): void => {
  for (let j = Math.floor(y); j < Math.ceil(y + h); j++)
    for (let i = Math.floor(x); i < Math.ceil(x + w); i++) if (i >= 0 && j >= 0 && i < m.w && j < m.h) m.solid[j * m.w + i] = 1;
};

const card = (kicker: string, i: Item): Page => ({ kicker, title: i.name, text: i.text, tags: i.tags, link: i.link });

/** A standing NPC. */
function person(pal: S.CharPal, x: number, y: number, dir: S.Dir, name: string, act: () => void, reach?: number): Ent {
  const spr = S.makeChar(pal);
  return { x, y, solid: 7, reach, label: name, act, draw: (g) => S.drawChar(g, spr, dir, 0, x, y) };
}

/** Cycles through line sets each time you talk. */
function chatter(name: string, sets: string[][]): () => void {
  let i = 0;
  return () => say(name, sets[i++ % sets.length]);
}

/* ================================ CAMPUS ================================ */

export const BUILDINGS: (BDef & { to: string })[] = [
  { id: 'about', to: 'home', style: 'home', x: 4, y: 5, w: 8, h: 5, sign: 'DAR YOUNES' },
  { id: 'school', to: 'school', style: 's1337', x: 18, y: 2, w: 12, h: 7, sign: '1337' },
  { id: 'work', to: 'work', style: 'brandscan', x: 35, y: 4, w: 10, h: 6, sign: 'BRANDSCAN' },
  { id: 'skills', to: 'hanout', style: 'hanout', x: 9, y: 23, w: 7, h: 5, sign: 'HANOUT' },
  { id: 'contact', to: 'post', style: 'post', x: 17, y: 23, w: 6, h: 5, sign: 'POST' },
  { id: 'projects', to: 'lab', style: 'lab', x: 34, y: 22, w: 10, h: 6, sign: 'THE LAB' },
];
export const doorOf = (id: string): { x: number; y: number } => {
  const b = BUILDINGS.find((b) => b.id === id || b.to === id)!;
  return { x: (b.x + b.w / 2) * T, y: (b.y + b.h) * T + 12 };
};
export const SPAWN = { x: 24 * T, y: 34 * T + 6 };
const FOUNTAIN = { x: 22, y: 17, w: 4, h: 3 };

const SAND = 0, PATH = 1, ZEL = 2, PLAT = 3, RAIL = 4, WALL = 5, PATIO = 6;

function drawGround(g: G, gr: Uint8Array, W: number, H: number): void {
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? WALL : gr[y * W + x]);
  const paved = (k: number) => k === PATH || k === ZEL || k === PLAT || k === PATIO;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const X = x * T, Y = y * T, k = at(x, y), r = hash(x, y);
      if (k === SAND || k === WALL || k === RAIL) {
        R(g, PAL.sand, X, Y, T, T);
        for (let i = 0; i < 5; i++) {
          const h = hash(x * 9 + i, y * 7 + i);
          R(g, i % 2 ? PAL.sandD : PAL.sandL, X + (h % 15), Y + ((h >> 5) % 15), 1 + ((h >> 9) % 2), 1);
        }
        if (r % 7 === 0) {
          const tx = X + 3 + ((r >> 4) % 9), ty = Y + 5 + ((r >> 8) % 8);
          R(g, '#a89a52', tx, ty, 1, 3);
          R(g, '#bfae62', tx + 2, ty + 1, 1, 2);
          R(g, '#a89a52', tx - 2, ty + 1, 1, 2);
        } else if (r % 11 === 0) {
          R(g, '#c9a877', X + 4 + ((r >> 4) % 8), Y + 6 + ((r >> 8) % 6), 3, 2);
          R(g, '#f0d6a6', X + 4 + ((r >> 4) % 8), Y + 6 + ((r >> 8) % 6), 2, 1);
        }
      }
      if (k === PATH) {
        R(g, PAL.stone, X, Y, T, T);
        R(g, PAL.stoneD, X, Y + 7, T, 1);
        R(g, PAL.stoneD, X + (y % 2 ? 4 : 11), Y, 1, 7);
        R(g, PAL.stoneD, X + (y % 2 ? 11 : 4), Y + 8, 1, 8);
        if (r % 5 === 0) R(g, '#f8ecd0', X + 2 + ((r >> 3) % 10), Y + 2 + ((r >> 6) % 3), 3, 1);
      } else if (k === ZEL) {
        for (let j = 0; j < T; j++)
          for (let i = 0; i < T; i++) {
            const dx = Math.abs(i - 7.5), dy = Math.abs(j - 7.5), d = dx + dy, c = Math.max(dx, dy);
            let col = PAL.cream;
            if (d < 2.5) col = PAL.ochre;
            else if (d < 8 && c < 5.5) col = (x + y) % 2 ? PAL.maj : PAL.green;
            else if (d < 8 || c < 5.5) col = '#f3e2bd';
            else if (dx > 6.6 && dy > 6.6) col = PAL.terra;
            R(g, col, X + i, Y + j, 1, 1);
          }
      } else if (k === PATIO) {
        R(g, PAL.terraL, X, Y, T, T);
        R(g, '#e39a6e', X + 1, Y + 1, 6, 6);
        R(g, '#e39a6e', X + 9, Y + 9, 6, 6);
        R(g, '#c97446', X + 7, Y, 1, T);
        R(g, '#c97446', X, Y + 7, T, 1);
        R(g, '#c97446', X + 15, Y, 1, T);
        R(g, '#c97446', X, Y + 15, T, 1);
      } else if (k === PLAT) {
        R(g, '#ded6c6', X, Y, T, T);
        R(g, '#c4baa6', X, Y + 15, T, 1);
        R(g, '#c4baa6', X + (y % 2 ? 7 : 15), Y, 1, T);
        if (at(x, y + 1) === RAIL || at(x, y + 1) === SAND) {
          R(g, '#f2c230', X, Y + 10, T, 2);
          R(g, '#8d8474', X, Y + 13, T, 3);
        }
      } else if (k === RAIL) {
        R(g, '#8a7b70', X, Y, T, T);
        for (let i = 0; i < 6; i++) {
          const h = hash(x * 5 + i, y * 3 + i);
          R(g, i % 2 ? '#75675d' : '#a09086', X + (h % 15), Y + ((h >> 5) % 15), 2, 1);
        }
        R(g, PAL.woodD, X + 2, Y, 3, T);
        R(g, PAL.woodD, X + 10, Y, 3, T);
        R(g, '#d6dae4', X, Y + 7, T, 2);
        R(g, '#8d909c', X, Y + 9, T, 1);
      } else if (k === WALL) {
        R(g, '#b85f38', X, Y, T, T);
        R(g, '#d98558', X, Y, T, 6);
        R(g, '#9c4b2c', X, Y + 6, T, 1);
        if (r % 3 === 0) R(g, '#a8552f', X + (r % 10), Y + 9 + ((r >> 4) % 5), 4, 1);
        R(g, '#e9a07a', X + 2, Y + 1, 5, 1);
        R(g, '#e9a07a', X + 10, Y + 3, 4, 1);
      }
      if (paved(k) && k !== PLAT) {
        if (!paved(at(x, y - 1))) R(g, 'rgba(120,80,40,.35)', X, Y, T, 1);
        if (!paved(at(x, y + 1))) R(g, 'rgba(120,80,40,.45)', X, Y + T - 1, T, 1);
        if (!paved(at(x - 1, y))) R(g, 'rgba(120,80,40,.35)', X, Y, 1, T);
        if (!paved(at(x + 1, y))) R(g, 'rgba(120,80,40,.35)', X + T - 1, Y, 1, T);
      }
    }
}

/** The pipe from the Lab to the fountain. */
function drawPipe(g: G): void {
  const seg = (x: number, y: number, w: number, h: number) => {
    R(g, 'rgba(60,30,20,.25)', x + 1, y + 2, w, h);
    R(g, '#2f8794', x, y, w, h);
    if (w > h) {
      R(g, '#62c6cf', x, y, w, 1);
      R(g, '#1f5f68', x, y + h - 1, w, 1);
      for (let i = x + 10; i < x + w - 4; i += 28) R(g, '#1f5f68', i, y - 1, 3, h + 2);
    } else {
      R(g, '#62c6cf', x, y, 1, h);
      R(g, '#1f5f68', x + w - 1, y, 1, h);
      for (let i = y + 10; i < y + h - 4; i += 28) R(g, '#1f5f68', x - 1, i, w + 2, 3);
    }
  };
  seg(26 * T + 6, 27 * T + 3, 34 * T - (26 * T + 6) + 4, 5);
  seg(26 * T + 6, 19 * T - 6, 5, 8 * T + 14);
  seg(26 * T - 2, 19 * T - 6, 12, 5);
  // valve wheel at the corner
  const vx = 26 * T + 8, vy = 27 * T + 5;
  R(g, '#c8372f', vx - 5, vy - 1, 11, 2);
  R(g, '#c8372f', vx - 1, vy - 5, 2, 11);
  R(g, '#7a1f1a', vx - 1, vy - 1, 2, 2);
}

function philosophers(m: GameMap, cx: number, cy: number): void {
  const N = 5;
  const forks = [true, true, true, true, true];
  const pos: [number, number, S.Dir][] = [[0, 20, 'up'], [27, 2, 'left'], [17, -22, 'down'], [-17, -22, 'down'], [-27, 2, 'right']];
  const state = pos.map((_, i) => ({ s: 0, timer: 1 + i * 0.9, has: [false, false] }));
  const sprs = S.CHARS.philo.map((p) => S.makeChar(p));
  const lines = npc.philosophers;
  let talked = 0;
  pos.forEach(([dx, dy, dir], i) => {
    const x = cx + dx, y = cy + dy, st = state[i];
    const lo = Math.min(i, (i + 1) % N), hi = Math.max(i, (i + 1) % N);
    m.ents.push({
      x, y, solid: 7, label: lines.name,
      update(dt) {
        st.timer -= dt;
        if (st.s === 0 && st.timer <= 0) st.s = 1;
        if (st.s === 1) {
          if (!st.has[0] && forks[lo]) { forks[lo] = false; st.has[0] = true; }
          if (st.has[0] && !st.has[1] && forks[hi]) { forks[hi] = false; st.has[1] = true; st.s = 2; st.timer = 2.5 + (hash(i, Math.floor(world.t)) % 20) / 10; }
        } else if (st.s === 2 && st.timer <= 0) {
          forks[lo] = forks[hi] = true;
          st.has = [false, false];
          st.s = 0;
          st.timer = 2 + (hash(i * 3, Math.floor(world.t)) % 35) / 10;
        }
      },
      draw(g, t) {
        const eat = st.s === 2;
        S.drawChar(g, sprs[i], dir, eat && !world.reduce && Math.floor(t * 5) % 2 ? 1 : 0, x, y);
        const bx = x + 7, by = y - 24;
        if (st.s === 1) {
          R(g, PAL.ink, bx - 1, by - 1, 5, 9);
          R(g, PAL.gold, bx, by, 3, 4);
          R(g, PAL.gold, bx + 1, by + 5, 1, 2);
          R(g, PAL.ink, bx + 1, by + 4, 1, 1);
        } else if (st.s === 0) {
          const n = world.reduce ? 3 : 1 + (Math.floor(t * 2 + i) % 3);
          for (let k = 0; k < n; k++) R(g, PAL.cream, bx + k * 3, by + 3, 2, 2);
        } else {
          R(g, '#e9e9f2', bx, by, 1, 6);
          R(g, '#e9e9f2', bx - 1, by, 3, 2);
          R(g, '#e9e9f2', bx + 4, by, 1, 6);
          R(g, '#e9e9f2', bx + 3, by, 3, 2);
        }
      },
      act() {
        const set = st.s === 0 ? lines.thinking : st.s === 1 ? lines.hungry : lines.eating;
        say(lines.name, [set[talked++ % set.length]], () => unlock('philo'));
      },
    });
  });
  m.props.push({ y: cy, draw: (g) => S.cafeTable(g, cx, cy, forks) });
  m.hots.push({
    x: cx - 16, y: cy - 28, w: 32, h: 30, label: 'CAFE DES PHILOSOPHES',
    act: () => say('CAFE DES PHILOSOPHES', [lines.table, card('Running live at this table', school.projects[1])], () => unlock('philo')),
  });
}

function buildCampus(): GameMap {
  const W = 48, H = 40;
  const m = newMap('campus', 'Benguerir', W, H, true, PAL.sand);
  const g = m.base.getContext('2d')!;
  const gr = new Uint8Array(W * H);
  const fill = (x: number, y: number, w: number, h: number, v: number) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) gr[j * W + i] = v;
  };
  fill(0, 0, W, 1, WALL); fill(0, 0, 1, H, WALL); fill(W - 1, 0, 1, H, WALL); fill(0, H - 1, W, 1, WALL);
  fill(1, 36, W - 2, 2, RAIL);
  fill(8, 33, 32, 3, PLAT);
  fill(23, 23, 2, 10, PATH);
  fill(5, 18, 12, 2, PATH); fill(31, 18, 12, 2, PATH);
  fill(23, 9, 2, 6, PATH);
  fill(7, 10, 2, 8, PATH);
  fill(39, 10, 2, 8, PATH);
  fill(5, 28, 38, 2, PATH);
  fill(7, 20, 2, 8, PATH);
  fill(10, 11, 6, 6, PATIO);
  fill(17, 15, 14, 8, ZEL);
  drawGround(g, gr, W, H);
  drawPipe(g);

  for (let i = 0; i < W * H; i++) if (gr[i] === WALL || gr[i] === RAIL) m.solid[i] = 1;
  solidRect(m, 1, 35, W - 2, 1);
  solidRect(m, FOUNTAIN.x, FOUNTAIN.y, FOUNTAIN.w, FOUNTAIN.h);

  BUILDINGS.forEach((b) => {
    m.wins.push(...drawBuilding(g, b));
    solidRect(m, b.x, b.y, b.w, b.h);
    const cx = (b.x + b.w / 2) * T, by = (b.y + b.h) * T;
    m.hots.push({ x: cx - 8, y: by, w: 16, h: 9, dir: 'up', auto: () => world.goto(b.to, 6.5 * T, 8 * T + 10, 'up') });
    m.lights.push({ x: cx, y: by - 4, r: 26 });
  });

  // ---- nature ----
  const prop = (x: number, y: number, draw: (g: G, t: number, px: number, py: number) => void, solid = true) => {
    const px = x * T + 8, py = y * T + 14;
    m.props.push({ y: py, draw: (g2, t) => draw(g2, t, px, py) });
    if (solid) m.solid[y * W + x] = 1;
  };
  const sway = (x: number) => (world.reduce ? 0 : Math.sin(world.t * (world.weather === 'wind' ? 3.2 : 1.1) + x) * (world.weather === 'wind' ? 1.6 : 0.6) + (world.weather === 'wind' ? 1 : 0));
  const palms: [number, number][] = [[21, 10], [26, 10], [2, 3], [14, 3], [32, 3], [45, 2], [3, 13], [45, 16], [16, 20], [31, 20], [2, 22], [45, 30], [5, 31], [20, 31], [27, 31], [42, 31], [11, 32], [36, 32], [33, 12], [2, 34]];
  palms.forEach(([x, y]) => prop(x, y, (g2, _t, px, py) => S.palm(g2, px, py, sway(x))));
  ([[2, 26], [4, 25], [3, 29], [45, 24], [44, 33], [14, 31], [33, 31], [30, 5], [16, 8]] as [number, number][]).forEach(([x, y]) => prop(x, y, (g2, _t, px, py) => S.olive(g2, px, py)));
  ([[46, 6], [45, 9], [46, 12], [1, 16], [2, 18], [46, 20], [1, 31], [46, 27], [12, 2], [33, 8]] as [number, number][]).forEach(([x, y]) => prop(x, y, (g2, _t, px, py) => S.cactus(g2, px, py)));
  ([[3, 10], [12, 10], [3, 7]] as [number, number][]).forEach(([x, y]) => prop(x, y, (g2, _t, px, py) => S.bush(g2, px, py)));
  ([[6, 10], [9, 10]] as [number, number][]).forEach(([x, y]) => prop(x, y, (g2, _t, px, py) => S.pot(g2, px, py)));
  ([[16, 26], [16, 27]] as [number, number][]).forEach(([x, y], i) => prop(x, y, (g2, _t, px, py) => S.crate(g2, px, py, i ? '#e8c53a' : '#f08a24')));
  ([[18, 21], [29, 21], [18, 16], [29, 16], [14, 34], [33, 34]] as [number, number][]).forEach(([x, y]) => prop(x, y, (g2, _t, px, py) => S.benchOut(g2, px, py)));
  const lamps: [number, number][] = [[17, 14], [30, 14], [16, 23], [30, 23], [25, 26], [22, 31], [25, 31], [6, 17], [41, 17], [22, 12], [25, 12], [6, 27], [32, 30], [9, 32], [38, 32]];
  lamps.forEach(([x, y]) => {
    prop(x, y, (g2, _t, px, py) => S.lamp(g2, px, py, lit()));
    m.lights.push({ x: x * T + 8, y: y * T - 8, r: 46 });
  });

  // ---- fountain ----
  const fx = FOUNTAIN.x * T, fy = FOUNTAIN.y * T;
  m.props.push({ y: fy + 44, draw: (g2, t) => S.fountain(g2, fx, fy, t, flag('deployed')) });
  m.hots.push({
    x: fx - 2, y: fy - 2, w: 68, h: 52, label: 'FOUNTAIN',
    act: () => say('FOUNTAIN', flag('deployed') ? npc.signs.fountainUp : npc.signs.fountainDown),
  });
  m.lights.push({ x: fx + 32, y: fy + 24, r: 40 });

  // ---- sundial (time control) ----
  prop(19, 18, (g2, _t, px, py) => S.sundial(g2, px, py, world.hour));
  const order: TimeMode[] = ['auto', 'dawn', 'day', 'dusk', 'night'];
  m.hots.push({
    x: 19 * T, y: 18 * T, w: T, h: T, label: 'SUNDIAL',
    act: () => {
      const next = order[(order.indexOf(world.timeMode) + 1) % order.length];
      hooks.setTime(next);
      sfx('tick');
      say('SUNDIAL', [npc.signs.sundial[next]]);
    },
  });

  // ---- the R2 well ----
  prop(43, 13, (g2, t, px, py) => S.well(g2, px, py, world.reduce ? 0 : t));
  solidRect(m, 42, 13, 3, 1);
  m.hots.push({ x: 42 * T, y: 12 * T, w: 3 * T, h: 2 * T, label: npc.signs.wellName, act: () => say(npc.signs.wellName, [...npc.signs.well, card('Brandscan · production', work.ops[2])], () => unlock('well')) });

  // ---- café des philosophes ----
  philosophers(m, 13 * T, 14 * T + 8);
  solidRect(m, 12, 13, 2, 2);
  m.over = (g2) => S.parasolTop(g2, 13 * T, 14 * T + 8);

  // ---- station ----
  const trainX = 10 * T, trainY = 35 * T + 2;
  m.props.push({ y: trainY + 34, draw: (g2) => S.trainTop(g2, trainX, trainY, 384, lit()) });
  m.hots.push({ x: trainX, y: 34 * T + 8, w: 384, h: 22, label: 'TRAIN TO CASABLANCA', act: () => say('TRAIN', npc.signs.train) });
  prop(13, 32, (g2, _t, px, py) => S.signpost(g2, px, py, 'BENGUERIR'));
  prop(30, 32, (g2, t, px, py) => S.board(g2, px, py, world.reduce ? 0 : t));
  solidRect(m, 29, 32, 3, 1);
  m.hots.push({ x: 29 * T, y: 31 * T, w: 3 * T, h: 2 * T, label: npc.signs.board, act: openBoard });
  const sm = npc.stationMaster;
  let met = false;
  m.ents.push(
    person(S.CHARS.master, 27 * T, 34 * T, 'down', sm.name, () => {
      if (save.visited.length >= 6) say(sm.name, sm.done);
      else if (!met) say(sm.name, sm.first);
      else say(sm.name, sm.again);
      met = true;
    }),
  );
  return m;
}

/* =============================== INTERIORS =============================== */

const RW = 13, RH = 10;
interface RoomLook { wall: string; wallD: string; trim: string; floor: (g: G, X: number, Y: number, x: number, y: number) => void; mat: string }

function room(id: string, name: string, section: SectionId | undefined, look: RoomLook, back: () => { map: string; x: number; y: number }): GameMap {
  const m = newMap(id, name, RW, RH, false, '#130f1f');
  m.section = section;
  const g = m.base.getContext('2d')!;
  R(g, look.wall, 0, 0, RW * T, 2 * T);
  R(g, look.wallD, 0, 0, RW * T, 3);
  R(g, look.trim, 0, 2 * T - 4, RW * T, 2);
  R(g, look.wallD, 0, 2 * T - 2, RW * T, 2);
  for (let y = 2; y < RH - 1; y++) for (let x = 0; x < RW; x++) look.floor(g, x * T, y * T, x, y);
  R(g, 'rgba(0,0,0,.18)', 0, 2 * T, RW * T, 3);
  R(g, '#130f1f', 0, (RH - 1) * T, RW * T, T);
  R(g, look.wallD, 0, (RH - 1) * T, RW * T, 3);
  look.floor(g, 6 * T, (RH - 1) * T, 6, RH - 1);
  R(g, look.mat, 6 * T + 1, (RH - 1) * T + 2, 14, 12);
  R(g, 'rgba(255,255,255,.25)', 6 * T + 3, (RH - 1) * T + 4, 10, 1);
  R(g, 'rgba(255,255,255,.25)', 6 * T + 3, (RH - 1) * T + 11, 10, 1);
  R(g, '#130f1f', 0, 0, 2, RH * T);
  R(g, '#130f1f', RW * T - 2, 0, 2, RH * T);
  solidRect(m, 0, 0, RW, 2);
  solidRect(m, 0, RH - 1, 6, 1);
  solidRect(m, 7, RH - 1, 6, 1);
  m.hots.push({
    x: 6 * T, y: (RH - 1) * T + 6, w: T, h: 12, dir: 'down',
    auto: () => {
      const b = back();
      world.goto(b.map, b.x, b.y, 'down');
    },
  });
  return m;
}

interface Put { x: number; y: number; w: number; h: number; draw: (g: G, t: number, px: number, py: number) => void; solid?: boolean; label?: string; act?: () => void; wall?: boolean }
/** Places furniture (tile units). Wall-mounted things get a hot zone reaching down to the floor line. */
function put(m: GameMap, o: Put): void {
  const px = o.x * T, py = o.y * T;
  m.props.push({ y: o.wall ? 2 * T - 1 : (o.y + o.h) * T, draw: (g, t) => o.draw(g, t, px, py) });
  if (o.solid !== false && !o.wall) solidRect(m, o.x, o.y, o.w, o.h);
  if (o.act) {
    const hot: Hot = o.wall ? { x: px, y: 0, w: o.w * T, h: 2 * T + 2, label: o.label, act: o.act } : { x: px - 2, y: py - 2, w: o.w * T + 4, h: o.h * T + 4, label: o.label, act: o.act };
    m.hots.push(hot);
  }
}

const floors = {
  terracotta: (g: G, X: number, Y: number, x: number, y: number) => {
    R(g, (x + y) % 2 ? '#d98f66' : '#cf8259', X, Y, T, T);
    R(g, '#b86b45', X, Y, T, 1);
    R(g, '#b86b45', X, Y, 1, T);
    R(g, 'rgba(255,255,255,.12)', X + 2, Y + 2, 5, 1);
  },
  carpet: (g: G, X: number, Y: number, x: number, y: number) => {
    R(g, '#3a3d4a', X, Y, T, T);
    for (let i = 0; i < 6; i++) {
      const h = hash(x * 5 + i, y * 9 + i);
      R(g, i % 2 ? '#434757' : '#32353f', X + (h % 15), Y + ((h >> 5) % 15), 2, 1);
    }
  },
  wood: (g: G, X: number, Y: number, x: number, y: number) => {
    R(g, '#c19463', X, Y, T, T);
    R(g, '#a87c4e', X, Y + 7, T, 1);
    R(g, '#a87c4e', X, Y + 15, T, 1);
    R(g, '#a87c4e', X + ((x * 7 + y * 3) % 12) + 2, Y, 1, 7);
    R(g, '#a87c4e', X + ((x * 5 + y * 11) % 12) + 2, Y + 8, 1, 7);
    R(g, '#cfa676', X + 2, Y + 2, 6, 1);
  },
  raised: (g: G, X: number, Y: number, x: number, y: number) => {
    R(g, '#2b3140', X, Y, T, T);
    R(g, '#1f2430', X, Y, T, 1);
    R(g, '#1f2430', X, Y, 1, T);
    if ((x + y * 3) % 4 === 0) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R(g, '#151923', X + 4 + i * 3, Y + 4 + j * 3, 2, 1);
  },
  lab: (g: G, X: number, Y: number, x: number, y: number) => {
    R(g, (x + y) % 2 ? '#e9ecf2' : '#dde1ea', X, Y, T, T);
    R(g, '#c9cedb', X, Y, T, 1);
    R(g, '#c9cedb', X, Y, 1, T);
  },
  checker: (g: G, X: number, Y: number) => {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) R(g, (i + j) % 2 ? '#f3e2bd' : '#c97446', X + i * 8, Y + j * 8, 8, 8);
    R(g, 'rgba(0,0,0,.08)', X, Y, T, 1);
  },
  post: (g: G, X: number, Y: number) => {
    R(g, '#f6eedb', X, Y, T, T);
    R(g, '#e3d6b6', X, Y, T, 1);
    R(g, '#e3d6b6', X, Y, 1, T);
    for (let i = 0; i < 3; i++) R(g, '#2d5fa8', X + 8 - i, Y + 6 + i, i * 2 + 1, 1);
    for (let i = 0; i < 2; i++) R(g, '#2d5fa8', X + 7 + i, Y + 10 - i, 3 - i * 2, 1);
  },
};

function buildHome(): GameMap {
  const m = room('home', about.place, 'about', { wall: '#f6eedb', wallD: '#d9cdb2', trim: PAL.maj, floor: floors.terracotta, mat: PAL.majD }, () => ({ map: 'campus', ...doorOf('about') }));
  const g = m.base.getContext('2d')!;
  for (let i = 0; i < RW * T; i += 4) R(g, [PAL.maj, PAL.cream, PAL.green, PAL.cream][(i / 4) % 4], i, 2 * T - 8, 4, 4);
  S.rug(g, 4 * T, 4 * T + 2, 5 * T, 3 * T - 4);

  put(m, { x: 0.75, y: 0.3, w: 1.2, h: 1.5, wall: true, draw: (g2, _t, px, py) => S.windowIn(g2, px, py, lit() ? '#1a2360' : world.night > 0.15 ? '#f29b6a' : '#9fd3f0') });
  put(m, { x: 2.6, y: 0.4, w: 1.7, h: 1.2, wall: true, label: 'THE JOURNEY', draw: (g2, _t, px, py) => S.wallFrame(g2, px, py, 'map'),
    act: () => say(education.title.toUpperCase(), education.steps.map((s) => ({ title: s.name, text: s.text }))) });
  put(m, { x: 5.3, y: 0.4, w: 1.4, h: 1.2, wall: true, label: 'CASABLANCA', draw: (g2, _t, px, py) => S.wallFrame(g2, px, py, 'casa'),
    act: () => say(about.title.toUpperCase(), [...about.paragraphs, about.facts.join(' · ')]) });
  put(m, { x: 8, y: 0.1, w: 2, h: 1.9, wall: true, label: 'LANGUAGES', draw: (g2, _t, px, py) => S.bookshelf(g2, px, py),
    act: () => say('BOOKSHELF', [{ title: 'Languages', text: about.languages.join(' · ') }]) });
  put(m, { x: 0, y: 2, w: 2, h: 3, label: 'BED', draw: (g2, _t, px, py) => S.bed(g2, px + 1, py + 2), act: () => say('BED', npc.signs.bed) });
  put(m, { x: 3, y: 2, w: 1, h: 1, label: 'RADIO', draw: (g2, t, px, py) => S.radio(g2, px, py - 2, t, musicPlaying()), act: () => say('RADIO', [npc.signs.radio], openMenu) });
  put(m, { x: 12, y: 2, w: 1, h: 1, draw: (g2, _t, px, py) => S.plant(g2, px, py) });
  put(m, { x: 5, y: 5, w: 2, h: 1, label: 'MINT TEA', draw: (g2, t, px, py) => S.teaTable(g2, px, py, world.reduce ? 0 : t),
    act: () => {
      sfx('pour');
      say('ATAY', flag('tea') ? npc.signs.teaAgain : npc.signs.tea, () => { setFlag('tea'); unlock('tea'); });
    } });
  put(m, { x: 10, y: 4, w: 2, h: 1, label: '~/.ssh', draw: (g2, t, px, py) => { S.desk(g2, px, py); S.laptop(g2, px + 4, py - 2, t); },
    act: () => {
      if (flag('key')) return say('LAPTOP', npc.signs.keyAgain);
      sfx('item');
      say('LAPTOP', npc.signs.key, () => { setFlag('key'); unlock('key'); hooks.irc('* visitor picked up id_ed25519'); });
    } });
  m.ents.push(person(S.CHARS.younes, 11.6 * T, 5 * T + 14, 'up', 'YOUNES', () => say('YOUNES', [...about.paragraphs, 'Languages: ' + about.languages.join(', ') + '.'])));
  return m;
}

function buildSchool(): GameMap {
  const m = room('school', school.place, 'school', { wall: '#2a2d36', wallD: '#1c1e25', trim: '#59d98a', floor: floors.carpet, mat: '#59d98a' }, () => ({ map: 'campus', ...doorOf('school') }));
  put(m, { x: 0.8, y: 0.3, w: 1.3, h: 1.3, wall: true, draw: (g2, _t, px, py) => S.wallFrame(g2, px, py, 'hole') });
  put(m, { x: 4.5, y: 0.3, w: 4, h: 1.5, wall: true, label: 'WHITEBOARD', draw: (g2, _t, px, py) => S.whiteboard(g2, px, py),
    act: () => say('1337', [{ kicker: school.subtitle, title: school.title, text: school.intro }, ...education.steps.map((s) => ({ title: s.name, text: s.text }))]) });
  put(m, { x: 11, y: 0.3, w: 1, h: 1.7, wall: true, label: 'COFFEE', draw: (g2, _t, px, py) => S.coffee(g2, px, py), act: () => say('COFFEE MACHINE', npc.signs.coffee) });
  school.projects.forEach((p, i) => {
    const x = 1 + (i % 4) * 3, y = 3 + Math.floor(i / 4) * 3;
    put(m, { x, y, w: 2, h: 1, label: p.name.split(' · ')[0].toUpperCase(), draw: (g2, t, px, py) => S.imacDesk(g2, px, py, world.reduce ? 0 : t, i * 45), act: () => say('1337 · PROJECT', [card('1337 project', p)]) });
  });
  m.ents.push(person(S.CHARS.student, 12.5 * T, 5 * T + 4, 'left', npc.student.name, chatter(npc.student.name, npc.student.lines)));
  return m;
}

function buildWork(): GameMap {
  const m = room('work', work.place, 'work', { wall: PAL.terra, wallD: PAL.terraD, trim: PAL.cream, floor: floors.wood, mat: PAL.terraD }, () => ({ map: 'campus', ...doorOf('work') }));
  put(m, { x: 0.8, y: 0.5, w: 1.7, h: 1, wall: true, label: 'MY ROLE', draw: (g2, _t, px, py) => S.wallFrame(g2, px, py, 'plaque'),
    act: () => say('BRANDSCAN', [{ kicker: work.subtitle, title: work.title, text: work.intro }, work.outro]) });
  put(m, { x: 5.5, y: 0.4, w: 1.2, h: 1.2, wall: true, draw: (g2, _t, px, py) => S.wallFrame(g2, px, py, 'ring') });
  put(m, { x: 0, y: 2, w: 1, h: 1, draw: (g2, _t, px, py) => S.plant(g2, px, py) });
  put(m, { x: 12, y: 2, w: 1, h: 1, draw: (g2, _t, px, py) => S.waterCooler(g2, px, py - 8) });
  const spots: [number, number][] = [[1, 4], [4, 4], [1, 7], [4, 7], [8, 6]];
  work.built.forEach((b, i) => {
    const [x, y] = spots[i];
    put(m, { x, y, w: 2, h: 1, label: b.name.toUpperCase(), draw: (g2, t, px, py) => S.imacDesk(g2, px, py, world.reduce ? 0 : t, 20 + i * 70), act: () => say('BRANDSCAN · ' + work.builtTitle.toUpperCase(), [card(work.builtTitle, b)]) });
  });
  // server room door + the firewall guard
  put(m, { x: 10, y: 0, w: 1, h: 2, wall: true, label: 'SERVER ROOM', draw: (g2, _t, px, py) => S.innerDoor(g2, px, py, flag('gate')),
    act: () => { if (!flag('gate')) guardTalk(); } });
  m.hots.push({ x: 10 * T, y: 2 * T, w: T, h: 8, dir: 'up', auto: () => { if (flag('gate')) world.goto('server', 6.5 * T, 8 * T + 10, 'up'); } });
  const gl = npc.guard;
  const knocks: number[] = [];
  let limitedUntil = 0, tries = 0;
  const guardTalk = () => {
    if (flag('gate')) return say(gl.name, gl.open);
    if (flag('key')) {
      sfx('ok');
      return say(gl.name, gl.withKey, () => { setFlag('gate'); hooks.irc('* FIREWALL allows visitor: publickey'); });
    }
    const now = world.t;
    if (now < limitedUntil) return say(gl.name, gl.rateLimited);
    knocks.push(now);
    while (knocks.length && now - knocks[0] > 12) knocks.shift();
    if (knocks.length >= 4) {
      limitedUntil = now + 10;
      knocks.length = 0;
      sfx('bad');
      return say(gl.name, gl.rateLimited, () => unlock('ratelimit'));
    }
    say(gl.name, tries++ === 0 ? gl.noKey : [gl.noKeyAgain[(tries - 2) % gl.noKeyAgain.length]]);
  };
  const gspr = S.makeChar(S.CHARS.guard);
  const guard: Ent = {
    x: 10.5 * T, y: 2 * T + 13, solid: 8, label: gl.name, act: guardTalk,
    update(dt) {
      const tx = flag('gate') ? 11.9 * T : 10.5 * T;
      guard.x += Math.sign(tx - guard.x) * Math.min(Math.abs(tx - guard.x), dt * 30);
    },
    draw: (g2) => S.drawChar(g2, gspr, 'down', 0, guard.x, guard.y),
  };
  m.ents.push(guard);
  return m;
}

function buildServer(): GameMap {
  const m = room('server', 'Server room', undefined, { wall: '#1a1e2b', wallD: '#0e1018', trim: '#59d98a', floor: floors.raised, mat: '#59d98a' }, () => ({ map: 'work', x: 10.5 * T, y: 3 * T + 12 }));
  m.dark = 0.55;
  const g = m.base.getContext('2d')!;
  for (let i = 0; i < 5; i++) {
    R(g, ['#c8372f', '#f2c230', '#2d7fd8'][i % 3], (2 + i * 2) * T - 3, 2 * T + 2, 1, 3 * T + i * 4);
    R(g, ['#c8372f', '#f2c230', '#2d7fd8'][i % 3], (2 + i * 2) * T - 3, 5 * T + 2 + i * 4, 11 * T - (2 + i * 2) * T + 6, 1);
  }
  work.ops.forEach((o, i) => {
    const x = 1 + i * 2;
    put(m, { x, y: 0, w: 1.15, h: 2, wall: true, label: o.name.toUpperCase(), draw: (g2, t, px, py) => S.rack(g2, px, py - 2, world.reduce ? 0 : t, i + 1), act: () => say('PRODUCTION · RACK ' + (i + 1), [card(work.opsTitle, o)]) });
    m.lights.push({ x: x * T + 9, y: 20, r: 24 });
  });
  put(m, { x: 10, y: 5, w: 2, h: 1, label: 'TERMINAL', draw: (g2, t, px, py) => S.termDesk(g2, px, py, world.reduce ? 0 : t), act: () => { unlock('shell'); openTerminal(); } });
  m.lights.push({ x: 11 * T, y: 5 * T, r: 34 });
  put(m, { x: 2, y: 6, w: 1, h: 1, label: 'DO NOT PRESS', draw: (g2, t, px, py) => S.redButton(g2, px, py, world.reduce ? 0 : t),
    act: () => {
      if (flag('restored')) return say('RED BUTTON', npc.signs.buttonAgain, () => ask('RED BUTTON', npc.signs.buttonConfirm, () => hooks.restoreDrill()));
      say('RED BUTTON', npc.signs.button, () => ask('RED BUTTON', npc.signs.buttonConfirm, () => hooks.restoreDrill()));
    } });
  m.lights.push({ x: 2.5 * T, y: 6 * T + 4, r: 22 });
  m.lights.push({ x: 6.5 * T, y: 9 * T, r: 26 });
  return m;
}

function buildLab(): GameMap {
  const m = room('lab', projects.place, 'projects', { wall: '#cfd4de', wallD: '#8d94a6', trim: '#2f8794', floor: floors.lab, mat: '#2f8794' }, () => ({ map: 'campus', ...doorOf('projects') }));
  const g = m.base.getContext('2d')!;
  R(g, '#2f8794', 0, 10, 10 * T, 4);
  R(g, '#62c6cf', 0, 10, 10 * T, 1);
  for (let i = 12; i < 10 * T; i += 30) R(g, '#1f5f68', i, 9, 3, 6);
  const spots: [number, number][] = [[1, 4], [4, 4], [7, 4], [1, 7], [4, 7], [7, 7]];
  projects.items.forEach((p, i) => {
    const [x, y] = spots[i];
    put(m, { x, y, w: 2, h: 1, label: p.name.toUpperCase(), draw: (g2, t, px, py) => S.labBench(g2, px, py, world.reduce ? 0 : t, i), act: () => say('THE LAB · PROJECT', [card('Project', p)]) });
  });
  put(m, { x: 10, y: -0.25, w: 2.5, h: 2.25, wall: true, label: 'PIPELINE', draw: (g2, t, px, py) => S.pipelineConsole(g2, px, py, world.reduce ? 0 : t, flag('deployed')), act: openPipeline });
  return m;
}

function buildHanout(): GameMap {
  const m = room('hanout', skills.place, 'skills', { wall: '#cf9d5e', wallD: '#a8763c', trim: PAL.green, floor: floors.checker, mat: PAL.greenD }, () => ({ map: 'campus', ...doorOf('skills') }));
  skills.groups.forEach((gr, i) => {
    put(m, { x: 0.25 + i * 2.5, y: 0, w: 2.125, h: 2, wall: true, label: gr.name.toUpperCase(), draw: (g2, _t, px, py) => S.shelf(g2, px, py, i),
      act: () => say('HANOUT · SHELF ' + (i + 1), [{ kicker: 'In stock', title: gr.name, text: '', tags: gr.items }]) });
  });
  put(m, { x: 4, y: 5, w: 5, h: 1, draw: (g2, _t, px, py) => { S.counter(g2, px, py, 5 * T); S.scale(g2, px + 6, py - 6); } });
  m.ents.push(person(S.CHARS.shop, 6.5 * T, 5 * T - 1, 'down', npc.shopkeeper.name, chatter(npc.shopkeeper.name, npc.shopkeeper.lines), 34));
  put(m, { x: 10, y: 7, w: 2, h: 1, label: 'SPICES', draw: (g2, _t, px, py) => S.spices(g2, px, py), act: () => say('SPICES', npc.signs.spices) });
  put(m, { x: 0, y: 7, w: 1, h: 1, draw: (g2, _t, px, py) => S.crate(g2, px + 8, py + 14) });
  put(m, { x: 1, y: 7, w: 1, h: 1, draw: (g2, _t, px, py) => S.crate(g2, px + 8, py + 14, '#7fbf4a') });
  return m;
}

function buildPost(): GameMap {
  const m = room('post', contact.place, 'contact', { wall: '#f2c230', wallD: '#d4a51c', trim: '#2d5fa8', floor: floors.post, mat: '#2d5fa8' }, () => ({ map: 'campus', ...doorOf('contact') }));
  const g = m.base.getContext('2d')!;
  R(g, '#2d5fa8', 0, 12, RW * T, 3);
  const t1 = pixelText('POST', '#1f4479');
  g.drawImage(t1, Math.round(RW * T / 2 - t1.width), 2, t1.width * 2, t1.height * 2);
  put(m, { x: 3, y: 4, w: 7, h: 1, draw: (g2, _t, px, py) => S.counter(g2, px, py, 7 * T, '#f6eedb', '#2d5fa8') });
  m.ents.push(person(S.CHARS.postman, 6.5 * T, 4 * T - 1, 'down', npc.postman.name, chatter(npc.postman.name, npc.postman.lines), 34));
  const [gh, li] = contact.links;
  const link = (l: typeof gh): Page => ({ kicker: contact.intro, title: l.name, text: '', link: { label: l.label, href: l.href } });
  put(m, { x: 2, y: 7, w: 1, h: 1, label: 'GITHUB', draw: (g2, _t, px, py) => S.letterbox(g2, px, py, '#3a3d48', '#22242b', '<>'), act: () => say('LETTERBOX', [link(gh)]) });
  put(m, { x: 10, y: 7, w: 1, h: 1, label: 'LINKEDIN', draw: (g2, _t, px, py) => S.letterbox(g2, px, py, '#2d7fd8', '#1f5aa0', 'IN'), act: () => say('LETTERBOX', [link(li)]) });
  put(m, { x: 6, y: 6, w: 1, h: 1, label: 'EMAIL', draw: (g2, _t, px, py) => S.letterbox(g2, px, py, '#f2c230', '#d4a51c', '@'),
    act: () => say('LETTERBOX', [contact.email ? { kicker: contact.intro, title: 'Email', text: '', link: { label: contact.email, href: 'mailto:' + contact.email } } : npc.signs.emailTodo]) });
  return m;
}

export function buildMaps(): void {
  [buildCampus(), buildHome(), buildSchool(), buildWork(), buildServer(), buildLab(), buildHanout(), buildPost()].forEach((m) => (world.maps[m.id] = m));
}

/** Floating name tag used by the game loop. */
export function nameTag(g: G, text: string, x: number, y: number): void {
  label(g, text, x, y);
}
