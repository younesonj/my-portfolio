/* Segfault, the campus cat. Also a Kubernetes deployment: `kubectl scale deployment cat`. */
import { npc, sectionNames, sectionOrder } from '../content';
import { flag, save, unlock } from '../state';
import { say } from '../ui/dialog';
import { sfx } from './audio';
import { PAL, R, TILE } from './gfx';
import { makeCat, shadow, type CatSprites } from './sprites';
import { lit, world, type Ent } from './world';

interface Cat extends Ent { name: string; born: number }
const cats: Cat[] = [];
let spr: CatSprites;
let desired = 1;
let talked = 0;
const MAX = 9;

const rid = (n: number) => Array.from({ length: n }, () => 'bcdfghjklmnpqrstvwxz2456789'[Math.floor(Math.random() * 27)]).join('');
const free = (x: number, y: number): boolean => {
  const m = world.maps.campus, tx = Math.floor(x / TILE), ty = Math.floor((y - 2) / TILE);
  return tx > 0 && ty > 0 && tx < m.w - 1 && ty < 34 && !m.solid[ty * m.w + tx];
};

function hint(): string {
  const c = npc.cat;
  if (!flag('deployed')) return c.hintFountain;
  if (!flag('key')) return c.hintKey;
  if (!save.ach.includes('shell')) return c.hintServer;
  if (!save.ach.includes('scale')) return c.hintTerminal;
  const missing = sectionOrder.filter((id) => !save.visited.includes(id));
  if (missing.length) return c.hintVisit.replace('{places}', missing.map((id) => sectionNames[id].place).join(', '));
  return c.allDone.join(' ');
}

function spawn(x = 27 * TILE, y = 21 * TILE): Cat {
  if (!spr) spr = makeCat();
  let state: 'sit' | 'walk' | 'sleep' = 'sit', timer = 1 + Math.random() * 3, tx = x, ty = y, left = false, love = 0;
  const cat: Cat = {
    name: `cat-7f9c4-${rid(5)}`, born: world.t, x, y, solid: 5, label: npc.cat.name,
    update(dt) {
      timer -= dt;
      love -= dt;
      if (state === 'walk') {
        const dx = tx - cat.x, dy = ty - cat.y, d = Math.hypot(dx, dy);
        const nx = cat.x + (dx / (d || 1)) * 30 * dt, ny = cat.y + (dy / (d || 1)) * 30 * dt;
        const p = world.player, near = world.map.id === 'campus' && Math.hypot(nx - p.x, ny - p.y) < 12;
        if (d < 3 || timer <= 0 || !free(nx, ny) || near) {
          state = 'sit';
          timer = 2 + Math.random() * 5;
        } else {
          left = dx < 0;
          cat.x = nx;
          cat.y = ny;
        }
      } else if (timer <= 0) {
        if (lit() && Math.random() < 0.7) {
          state = 'sleep';
          timer = 6 + Math.random() * 8;
        } else {
          const p = world.player, follow = world.map.id === 'campus' && Math.random() < 0.35 && Math.hypot(p.x - cat.x, p.y - cat.y) < 140;
          tx = follow ? p.x + (Math.random() - 0.5) * 40 : cat.x + (Math.random() - 0.5) * 120;
          ty = follow ? p.y + 14 : cat.y + (Math.random() - 0.5) * 90;
          state = 'walk';
          timer = 4;
        }
      }
    },
    draw(g, t) {
      shadow(g, cat.x, cat.y, 12);
      const img = state === 'sleep' ? spr.sleep : state === 'walk' ? (left ? spr.walkL : spr.walk)[world.reduce ? 0 : Math.floor(t * 7) % 2] : left ? spr.sitL : spr.sit;
      g.drawImage(img, Math.round(cat.x - img.width / 2), Math.round(cat.y - img.height + 1));
      if (state === 'sleep' && !world.reduce) {
        const f = Math.floor(t * 1.5) % 3;
        R(g, PAL.cream, cat.x + 6 + f, cat.y - 12 - f * 3, 2, 1);
        R(g, PAL.cream, cat.x + 7 + f, cat.y - 11 - f * 3, 1, 1);
        R(g, PAL.cream, cat.x + 6 + f, cat.y - 10 - f * 3, 2, 1);
      }
      if (love > 0) {
        const hy = cat.y - 16 - (1.2 - love) * 8;
        R(g, PAL.pink, cat.x - 2, hy, 2, 2);
        R(g, PAL.pink, cat.x + 1, hy, 2, 2);
        R(g, PAL.pink, cat.x - 1, hy + 2, 3, 1);
        R(g, PAL.pink, cat.x, hy + 3, 1, 1);
      }
    },
    act() {
      const c = npc.cat, primary = cats[0] === cat;
      love = 1.2;
      sfx('purr');
      unlock('pet');
      if (state === 'sleep') return say(c.name, [c.night]);
      state = 'sit';
      timer = 4;
      if (world.weather === 'rain') return say(c.name, [c.rain]);
      if (!primary) return say(c.name, [c.replica[talked++ % c.replica.length]]);
      const n = talked++;
      if (n === 0) return say(c.name, c.first);
      say(c.name, n % 2 ? [hint()] : [c.pet[(n / 2) % c.pet.length | 0], hint()]);
    },
  };
  cats.push(cat);
  world.maps.campus.ents.push(cat);
  return cat;
}

function remove(cat: Cat): void {
  cat.dead = true;
  cats.splice(cats.indexOf(cat), 1);
  const m = world.maps.campus;
  const x = cat.x, y = cat.y, t0 = world.t;
  const puff: Ent = {
    x, y,
    draw(g, t) {
      const k = (t - t0) / 0.5;
      if (k > 1) return void (puff.dead = true);
      for (let i = 0; i < 6; i++) R(g, PAL.cream, x + Math.cos(i * 1.05) * k * 12 - 1, y - 6 + Math.sin(i * 1.05) * k * 9 - 1, 3 - k * 2, 3 - k * 2);
    },
  };
  m.ents.push(puff);
}

const spot = (): [number, number] => {
  for (let i = 0; i < 30; i++) {
    const x = (17 + Math.random() * 14) * TILE, y = (15 + Math.random() * 8) * TILE;
    if (free(x, y)) return [x, y];
  }
  return [27 * TILE, 21 * TILE];
};

export function initCats(): void {
  spawn();
}
export const listCats = (): { name: string; age: number }[] => cats.map((c) => ({ name: c.name, age: world.t - c.born }));
export function scaleCats(n: number): number {
  desired = Math.max(0, Math.min(MAX, Math.floor(n)));
  while (cats.length > desired) remove(cats[cats.length - 1]);
  while (cats.length < desired) spawn(...spot());
  return desired;
}
export function killCat(name: string): boolean {
  const c = cats.find((c) => c.name === name);
  if (!c) return false;
  remove(c);
  sfx('meow');
  window.setTimeout(() => {
    if (cats.length < desired) spawn(...spot());
  }, 1500);
  return true;
}
