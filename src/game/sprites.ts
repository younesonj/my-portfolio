/* Characters, the cat, and every prop. Drawn by code; nothing is loaded from disk. */
import { PAL, R, arch, flipH, hash, outline, pixelText, sprite, type Cv, type G } from './gfx';

/* ------------------------------- characters ------------------------------- */

const BODY = {
  down: ['...hhhhhh...', '..hhhhhhhh..', '..hhhhhhhh..', '..hssssssh..', '..sesssses..', '..ssssssss..', '...ssssss...', '..tttttttt..', '.tttttttttt.', '.sTttttttTs.', '.sTttttttTs.', '..tttttttt..', '..pppppppp..'],
  up: ['...hhhhhh...', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '...ssssss...', '..tttttttt..', '.tttttttttt.', '.sTttttttTs.', '.sTttttttTs.', '..tttttttt..', '..pppppppp..'],
  side: ['...hhhhhh...', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhsssss..', '..hhsssses..', '..hsssssss..', '...ssssss...', '...tttttt...', '..tttttttt..', '..tttTTttt..', '..tttssttt..', '..tttttttt..', '...pppppp...'],
};
const LEGS = {
  front: [
    ['..ppp..ppp..', '..ppp..ppp..', '..ppp..ppp..', '..bbb..bbb..'],
    ['..ppp..ppp..', '..bbb..ppp..', '.......ppp..', '.......bbb..'],
    ['..ppp..ppp..', '..ppp..bbb..', '..ppp.......', '..bbb.......'],
  ],
  side: [
    ['....pppp....', '....pppp....', '....pppp....', '....bbbbb...'],
    ['...pppppp...', '..ppp..ppp..', '..pp....pp..', '..bbb...bbb.'],
    ['....pppp....', '....ppp.....', '....ppp.....', '....bbbb....'],
  ],
  robeFront: [
    ['..tttttttt..', '..tttttttt..', '..TttttttT..', '...bb..bb...'],
    ['..tttttttt..', '..tttttttt..', '..TttttttT..', '...bb.......'],
    ['..tttttttt..', '..tttttttt..', '..TttttttT..', '.......bb...'],
  ],
  robeSide: [
    ['...tttttt...', '...tttttt...', '...TttttT...', '....bbb.....'],
    ['...tttttt...', '...tttttt...', '...TttttT...', '...bb..bb...'],
    ['...tttttt...', '...tttttt...', '...TttttT...', '.....bb.....'],
  ],
};

export interface CharPal {
  skin: string;
  hair: string;
  shirt: string;
  shirtD: string;
  pants: string;
  shoes: string;
  hat?: 'cap' | 'fez' | 'taqiyah' | 'hood';
  hatColor?: string;
  robe?: boolean;
}
export type Dir = 'down' | 'up' | 'left' | 'right';
export type CharSprites = Record<Dir, Cv[]>;

function hatRows(rows: string[], hat?: CharPal['hat']): string[] {
  if (!hat) return rows;
  const upto = hat === 'cap' ? 3 : hat === 'hood' ? 5 : 1;
  return rows.map((r, i) => (i <= upto ? r.replace(/h/g, hat === 'hood' ? 't' : 'H') : r));
}

export function makeChar(p: CharPal): CharSprites {
  const pal: Record<string, string> = { h: p.hair, s: p.skin, e: '#1d140f', t: p.shirt, T: p.shirtD, p: p.pants, b: p.shoes, H: p.hatColor || p.hair };
  const build = (body: string[], legs: string[][]) => legs.map((l) => outline(sprite([...hatRows(body, p.hat), ...l], pal)));
  const right = build(BODY.side, p.robe ? LEGS.robeSide : LEGS.side);
  return {
    down: build(BODY.down, p.robe ? LEGS.robeFront : LEGS.front),
    up: build(BODY.up, p.robe ? LEGS.robeFront : LEGS.front),
    right,
    left: right.map(flipH),
  };
}

/** Draws a character with its feet at (x, y). `step` is 0 (stand), 1 or 2. */
export function drawChar(g: G, s: CharSprites, dir: Dir, step: number, x: number, y: number): void {
  R(g, 'rgba(20,10,30,.28)', x - 5, y - 2, 10, 3);
  const img = s[dir][step];
  g.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height + 1 - (step ? 1 : 0)));
}

export const CHARS = {
  visitor: { skin: '#d9a273', hair: '#3a2416', shirt: '#1fa59a', shirtD: '#157a72', pants: '#3b3550', shoes: '#f4ead6' },
  visitorFez: { skin: '#d9a273', hair: '#3a2416', shirt: '#1fa59a', shirtD: '#157a72', pants: '#3b3550', shoes: '#f4ead6', hat: 'fez', hatColor: '#c8372f' },
  younes: { skin: '#c98b5e', hair: '#1d140f', shirt: '#3d4fd8', shirtD: '#27349b', pants: '#2a2a38', shoes: '#f2f2f2' },
  master: { skin: '#b97a4e', hair: '#3b3b3b', shirt: '#2f4a7a', shirtD: '#22365a', pants: '#22365a', shoes: '#1d140f', hat: 'cap', hatColor: '#c8372f' },
  guard: { skin: '#c98b5e', hair: '#1d140f', shirt: '#4a4f5c', shirtD: '#343843', pants: '#2a2d36', shoes: '#111', hat: 'cap', hatColor: '#e0603a' },
  student: { skin: '#e0b48a', hair: '#1d140f', shirt: '#2b2b2b', shirtD: '#1a1a1a', pants: '#5b6b8c', shoes: '#eee', hat: 'hood' },
  shop: { skin: '#b97a4e', hair: '#777', shirt: '#e9e1cf', shirtD: '#cfc5ad', pants: '#e9e1cf', shoes: '#e0a03a', hat: 'taqiyah', hatColor: '#fff8ea', robe: true },
  postman: { skin: '#d9a273', hair: '#3a2416', shirt: '#f2c230', shirtD: '#d4a51c', pants: '#2d5fa8', shoes: '#1d140f', hat: 'cap', hatColor: '#2d5fa8' },
  philo: [
    { skin: '#c98b5e', hair: '#eee', shirt: '#7a4e9c', shirtD: '#5d3a7a', pants: '#7a4e9c', shoes: '#e0a03a', robe: true, hat: 'fez', hatColor: '#c8372f' },
    { skin: '#b97a4e', hair: '#1d140f', shirt: '#2f8a5a', shirtD: '#1f6440', pants: '#2f8a5a', shoes: '#e0a03a', robe: true },
    { skin: '#e0b48a', hair: '#999', shirt: '#c4683f', shirtD: '#9c4b2c', pants: '#c4683f', shoes: '#e0a03a', robe: true, hat: 'taqiyah', hatColor: '#fff8ea' },
    { skin: '#a86b42', hair: '#1d140f', shirt: '#2d5fa8', shirtD: '#1f4479', pants: '#2d5fa8', shoes: '#e0a03a', robe: true, hat: 'hood' },
    { skin: '#d9a273', hair: '#5a3a22', shirt: '#e0a03a', shirtD: '#b97f22', pants: '#e0a03a', shoes: '#8d5a33', robe: true },
  ],
} satisfies Record<string, CharPal | CharPal[]>;

/* ---------------------------------- cat ---------------------------------- */

const CATPAL = { o: '#e39a3b', d: '#b8701f', e: '#1d140f', p: '#f29bb1', w: '#fff3dd' };
const CAT_ROWS = {
  walkA: ['o........o.o.', 'o........oooo', '.o.......oeoe', '.ooooooooooop', '..ddoodooooo.', '..oooooooooo.', '..oooooooooo.', '..o.o....o.o.', '..w.w....w.w.'],
  walkB: ['.........o.o.', 'oo.......oooo', '..o......oeoe', '..oooooooooop', '..ddoodooooo.', '..oooooooooo.', '..oooooooooo.', '...oo....oo..', '...ww....ww..'],
  sit: ['.........o.o.', '.........oooo', '.........oeoe', '....oooooooop', '...ooodooooo.', '..oooodooooo.', '.ooooooooooo.', 'oo.ooooo.oo..', 'o..www...ww..'],
  sleep: ['.............', '.............', '.........o.o.', '....oooooooo.', '..oooddooddo.', '.oooooooooooo', 'ooooooooooooo', 'o.ooooooooo..', '.............'],
};
export interface CatSprites { walk: Cv[]; walkL: Cv[]; sit: Cv; sitL: Cv; sleep: Cv }
export function makeCat(): CatSprites {
  const a = outline(sprite(CAT_ROWS.walkA, CATPAL)), b = outline(sprite(CAT_ROWS.walkB, CATPAL));
  const sit = outline(sprite(CAT_ROWS.sit, CATPAL));
  return { walk: [a, b], walkL: [flipH(a), flipH(b)], sit, sitL: flipH(sit), sleep: outline(sprite(CAT_ROWS.sleep, CATPAL)) };
}

/* ----------------------------- outdoor props ------------------------------ */
/* Every prop takes (x, y) = bottom-centre of its base, so it can be y-sorted. */

export function shadow(g: G, x: number, y: number, w: number): void {
  R(g, 'rgba(60,30,20,.22)', x - w / 2, y - 2, w, 4);
}

export function palm(g: G, x: number, y: number, sway = 0): void {
  shadow(g, x + 2, y, 16);
  for (let i = 0; i < 9; i++) {
    const ox = x - 2 + Math.round(Math.sin(i * 0.45) * 1.6);
    R(g, i % 2 ? PAL.wood : PAL.woodL, ox, y - 3 - i * 3, 4, 3);
    R(g, PAL.woodD, ox, y - 1 - i * 3, 4, 1);
  }
  const cx = x + Math.round(Math.sin(8 * 0.45) * 1.6), cy = y - 30;
  const fronds: [number, number][] = [[-1, -0.9], [1, -0.9], [0, -1.15], [-1.05, -0.25], [1.05, -0.25], [-0.7, 0.4], [0.7, 0.4]];
  fronds.forEach(([dx, dy], k) => {
    for (let i = 0; i < 9; i++) {
      const px = cx + dx * i * 1.7 + sway * (i / 8) * 2.5, py = cy + dy * i * 1.1 + i * i * 0.12;
      R(g, k < 3 ? PAL.leafD : i > 6 ? PAL.leafD : PAL.leaf, px - 1, py, 3, 2);
      if (k >= 3 && i > 1 && i < 6) R(g, PAL.leafL, px - 1, py, 2, 1);
    }
  });
  R(g, PAL.leaf, cx - 2, cy - 2, 5, 4);
  R(g, PAL.ochre, cx - 3, cy + 2, 2, 2);
  R(g, PAL.ochre, cx + 2, cy + 2, 2, 2);
}

export function olive(g: G, x: number, y: number): void {
  shadow(g, x, y, 18);
  R(g, PAL.woodD, x - 2, y - 8, 4, 8);
  R(g, PAL.wood, x - 1, y - 8, 2, 7);
  R(g, '#6f8f5a', x - 9, y - 19, 18, 10);
  R(g, '#6f8f5a', x - 7, y - 23, 14, 16);
  R(g, '#8aa870', x - 6, y - 22, 8, 5);
  R(g, '#8aa870', x - 8, y - 17, 5, 3);
  R(g, '#57764a', x + 2, y - 12, 6, 4);
  R(g, '#57764a', x - 5, y - 10, 4, 2);
  R(g, '#2b2b35', x - 3, y - 15, 1, 1);
  R(g, '#2b2b35', x + 4, y - 18, 1, 1);
}

export function cactus(g: G, x: number, y: number): void {
  shadow(g, x, y, 14);
  const pad = (px: number, py: number, w: number, h: number) => {
    R(g, '#4f9a5a', px + 1, py, w - 2, h);
    R(g, '#4f9a5a', px, py + 1, w, h - 2);
    R(g, '#6fb872', px + 1, py + 1, 2, h - 3);
    R(g, '#2f6e3c', px + w - 2, py + 2, 1, h - 4);
  };
  pad(x - 4, y - 10, 8, 10);
  pad(x - 9, y - 15, 6, 8);
  pad(x + 2, y - 17, 7, 9);
  R(g, PAL.pink, x - 7, y - 17, 2, 2);
  R(g, PAL.pink, x + 5, y - 19, 2, 2);
  R(g, PAL.ochre, x - 1, y - 12, 2, 2);
}

export function bush(g: G, x: number, y: number): void {
  shadow(g, x, y, 14);
  R(g, PAL.leafD, x - 7, y - 8, 14, 8);
  R(g, PAL.leaf, x - 6, y - 10, 12, 8);
  for (let i = 0; i < 7; i++) {
    const h = hash(x + i, y);
    R(g, i % 3 ? PAL.pink : '#f48fb8', x - 6 + (h % 11), y - 10 + ((h >> 4) % 7), 2, 2);
  }
}

export function lamp(g: G, x: number, y: number, lit: boolean): void {
  shadow(g, x, y, 8);
  R(g, '#2b2b35', x - 1, y - 20, 2, 20);
  R(g, '#2b2b35', x - 2, y - 2, 4, 2);
  R(g, '#2b2b35', x - 3, y - 27, 6, 1);
  R(g, '#2b2b35', x - 4, y - 26, 8, 6);
  R(g, lit ? '#ffe9a3' : '#c9a25a', x - 3, y - 25, 6, 4);
  R(g, '#2b2b35', x - 1, y - 25, 1, 4);
  R(g, '#2b2b35', x - 1, y - 29, 2, 2);
  if (lit) R(g, '#fff6d6', x - 2, y - 24, 1, 2);
}

export function benchOut(g: G, x: number, y: number): void {
  shadow(g, x, y, 22);
  R(g, PAL.woodD, x - 11, y - 12, 22, 3);
  R(g, PAL.wood, x - 11, y - 8, 22, 4);
  R(g, PAL.woodL, x - 11, y - 8, 22, 1);
  R(g, PAL.woodD, x - 10, y - 4, 2, 4);
  R(g, PAL.woodD, x + 8, y - 4, 2, 4);
  R(g, PAL.woodD, x - 10, y - 10, 1, 2);
  R(g, PAL.woodD, x + 9, y - 10, 1, 2);
}

/** Plaza fountain; (x, y) is the top-left of its 64×48 footprint. */
export function fountain(g: G, x: number, y: number, t: number, on: boolean): void {
  const W = 64, H = 48;
  R(g, 'rgba(60,30,20,.22)', x + 3, y + H - 2, W - 4, 4);
  const cols = [PAL.maj, PAL.cream, PAL.green, PAL.cream];
  for (let j = 0; j < H; j += 4)
    for (let i = 0; i < W; i += 4) {
      const edge = i < 8 || j < 8 || i >= W - 8 || j >= H - 8;
      const corner = (i < 4 || i >= W - 4) && (j < 4 || j >= H - 4);
      if (edge && !corner) R(g, cols[(i / 4 + j / 4) % 4], x + i, y + j, 4, 4);
    }
  R(g, PAL.majD, x + 8, y + 8, W - 16, H - 16);
  if (on) {
    R(g, '#2f7fc4', x + 9, y + 9, W - 18, H - 18);
    R(g, '#4a9ee0', x + 10, y + 10, W - 20, H - 21);
    for (let k = 0; k < 9; k++) {
      const sx = x + 11 + ((hash(k, 1) % (W - 26)) + Math.floor(t * 6 + k * 5)) % (W - 26);
      const sy = y + 11 + (hash(k, 2) % (H - 24));
      R(g, '#cfeaff', sx, sy, 3, 1);
    }
  } else {
    R(g, '#b9a37a', x + 9, y + 9, W - 18, H - 18);
    R(g, '#a38c62', x + 14, y + 30, 9, 1);
    R(g, '#a38c62', x + 22, y + 31, 5, 1);
    R(g, '#a38c62', x + 42, y + 14, 7, 1);
    R(g, '#8a9a4a', x + 46, y + 32, 3, 2);
  }
  const cx = x + W / 2, cy = y + H / 2;
  R(g, PAL.cream, cx - 6, cy - 4, 12, 9);
  R(g, PAL.cream, cx - 4, cy - 6, 8, 13);
  R(g, PAL.maj, cx - 4, cy - 4, 8, 9);
  R(g, PAL.cream, cx - 2, cy - 12, 4, 12);
  R(g, PAL.stoneD, cx + 1, cy - 12, 1, 12);
  R(g, PAL.green, cx - 4, cy - 14, 8, 3);
  if (on) {
    const f = Math.floor(t * 8) % 3;
    R(g, '#cfeaff', cx - 1, cy - 22 - f, 2, 8 + f);
    R(g, '#cfeaff', cx - 4, cy - 19 + f, 1, 4);
    R(g, '#cfeaff', cx + 3, cy - 19 + (2 - f), 1, 4);
    R(g, '#cfeaff', cx - 6, cy - 15 + f, 1, 3);
    R(g, '#cfeaff', cx + 5, cy - 15 + (2 - f), 1, 3);
    R(g, '#3fd07a', cx - 1, cy - 1, 2, 2);
  } else {
    R(g, Math.floor(t * 2) % 2 ? '#ff5a4d' : '#7a1f1a', cx - 1, cy - 1, 2, 2);
  }
}

export function sundial(g: G, x: number, y: number, hour: number): void {
  shadow(g, x, y, 16);
  R(g, PAL.stoneD, x - 7, y - 9, 14, 9);
  R(g, PAL.stone, x - 8, y - 12, 16, 6);
  R(g, PAL.white, x - 7, y - 12, 14, 4);
  for (let i = 0; i < 5; i++) R(g, PAL.maj, x - 6 + i * 3, y - 12, 1, 1);
  const a = ((hour - 6) / 12) * Math.PI;
  const sx = Math.round(Math.cos(a) * -5);
  R(g, 'rgba(40,30,60,.55)', Math.min(x, x + sx), y - 10, Math.abs(sx) + 1, 1);
  R(g, PAL.ochre, x, y - 15, 1, 5);
  R(g, PAL.gold, x - 1, y - 16, 3, 1);
}

export function well(g: G, x: number, y: number, t: number): void {
  shadow(g, x, y, 22);
  R(g, '#9a8f86', x - 10, y - 10, 20, 10);
  R(g, '#b7aca2', x - 10, y - 12, 20, 4);
  for (let i = 0; i < 5; i++) R(g, '#7d736b', x - 9 + i * 4 + (i % 2), y - 6 + (i % 2) * 3, 3, 1);
  R(g, '#14203a', x - 7, y - 11, 14, 2);
  R(g, PAL.woodD, x - 10, y - 28, 2, 18);
  R(g, PAL.woodD, x + 8, y - 28, 2, 18);
  R(g, PAL.terra, x - 13, y - 32, 26, 4);
  R(g, PAL.terraD, x - 13, y - 29, 26, 1);
  R(g, PAL.wood, x - 8, y - 25, 16, 2);
  const bob = Math.round(Math.sin(t * 1.5) * 1);
  R(g, '#d9cfc0', x, y - 23, 1, 6 + bob);
  R(g, '#f38020', x - 3, y - 17 + bob, 7, 5);
  R(g, '#c8641a', x - 3, y - 13 + bob, 7, 1);
  R(g, '#7fc4f0', x - 2, y - 17 + bob, 5, 1);
}

/** Café table with a tagine; forks[i] true = fork i is on the table. */
export function cafeTable(g: G, x: number, y: number, forks: boolean[]): void {
  R(g, 'rgba(60,30,20,.22)', x - 15, y - 3, 30, 5);
  R(g, PAL.woodD, x - 2, y - 8, 4, 8);
  R(g, PAL.majD, x - 14, y - 22, 28, 16);
  R(g, PAL.majD, x - 11, y - 25, 22, 22);
  R(g, PAL.maj, x - 13, y - 23, 26, 13);
  R(g, PAL.maj, x - 10, y - 25, 20, 18);
  R(g, PAL.cream, x - 6, y - 19, 12, 7);
  R(g, PAL.terra, x - 5, y - 21, 10, 5);
  R(g, PAL.terraL, x - 3, y - 24, 6, 4);
  R(g, PAL.terraL, x - 1, y - 27, 2, 3);
  R(g, PAL.terraD, x - 5, y - 17, 10, 1);
  const spots: [number, number][] = [[0, -11], [10, -16], [7, -24], [-8, -24], [-11, -16]];
  spots.forEach(([dx, dy], i) => {
    if (forks[i]) {
      R(g, '#e9e9f2', x + dx, y + dy, 1, 4);
      R(g, '#e9e9f2', x + dx - 1, y + dy, 3, 1);
    }
  });
}

export function stork(g: G, x: number, y: number, t: number): void {
  R(g, '#6b4a2a', x - 9, y - 3, 18, 5);
  R(g, '#8d6a3e', x - 8, y - 4, 16, 2);
  R(g, '#4a3018', x - 6, y - 1, 4, 1);
  R(g, '#4a3018', x + 2, y, 5, 1);
  R(g, '#c8372f', x - 1, y - 8, 1, 5);
  R(g, '#c8372f', x + 2, y - 8, 1, 5);
  R(g, '#fff8ea', x - 4, y - 13, 8, 6);
  R(g, '#1b1530', x - 5, y - 11, 4, 4);
  R(g, '#fff8ea', x + 2, y - 18, 2, 6);
  R(g, '#fff8ea', x + 2, y - 20, 3, 3);
  R(g, '#1b1530', x + 3, y - 19, 1, 1);
  const clap = Math.floor(t * 0.4) % 5 === 0 && Math.floor(t * 9) % 2;
  R(g, '#e0603a', x + 5, y - 19, 5, 1);
  R(g, '#e0603a', x + 5, y - 18 + (clap ? 1 : 0), 4, 1);
}

export function pot(g: G, x: number, y: number): void {
  shadow(g, x, y, 10);
  R(g, PAL.terra, x - 4, y - 7, 8, 7);
  R(g, PAL.terraL, x - 5, y - 8, 10, 2);
  R(g, PAL.leaf, x - 4, y - 13, 8, 5);
  R(g, PAL.leafL, x - 2, y - 15, 4, 3);
  R(g, PAL.pink, x - 3, y - 12, 2, 2);
  R(g, PAL.pink, x + 2, y - 14, 2, 2);
}

export function crate(g: G, x: number, y: number, fruit = '#f08a24'): void {
  shadow(g, x, y, 14);
  R(g, PAL.wood, x - 6, y - 8, 12, 8);
  R(g, PAL.woodD, x - 6, y - 5, 12, 1);
  R(g, PAL.woodD, x - 6, y - 1, 12, 1);
  for (let i = 0; i < 3; i++) {
    R(g, fruit, x - 5 + i * 4, y - 11, 3, 3);
    R(g, '#ffc27a', x - 5 + i * 4, y - 11, 1, 1);
  }
}

export function mailboxOut(g: G, x: number, y: number): void {
  shadow(g, x, y, 10);
  R(g, '#d4a51c', x - 4, y - 14, 8, 14);
  R(g, '#f2c230', x - 4, y - 14, 7, 13);
  R(g, '#f2c230', x - 3, y - 16, 6, 2);
  R(g, PAL.ink, x - 2, y - 11, 4, 1);
  R(g, '#2d5fa8', x - 2, y - 8, 4, 3);
}

export function signpost(g: G, x: number, y: number, text: string): void {
  const t = pixelText(text, PAL.cream);
  const w = t.width + 6;
  shadow(g, x, y, 12);
  R(g, PAL.woodD, x - w / 2 + 3, y - 12, 2, 12);
  R(g, PAL.woodD, x + w / 2 - 5, y - 12, 2, 12);
  R(g, PAL.majD, x - w / 2, y - 25, w, 14);
  R(g, PAL.maj, x - w / 2 + 1, y - 24, w - 2, 12);
  g.drawImage(t, Math.round(x - t.width / 2), y - 23);
}

export function board(g: G, x: number, y: number, t: number): void {
  shadow(g, x, y, 30);
  R(g, '#2b2b35', x - 13, y - 10, 2, 10);
  R(g, '#2b2b35', x + 11, y - 10, 2, 10);
  R(g, '#2b2b35', x - 17, y - 34, 34, 25);
  R(g, '#11131c', x - 15, y - 32, 30, 21);
  for (let i = 0; i < 3; i++) {
    R(g, '#ffb83d', x - 13, y - 30 + i * 6, 12 + ((i * 5) % 7), 1);
    R(g, i === 2 ? (Math.floor(t * 2) % 2 ? '#ff5a4d' : '#7a1f1a') : '#59d98a', x + 10, y - 30 + i * 6, 3, 1);
    R(g, '#7a6a3a', x - 13, y - 28 + i * 6, 18, 1);
  }
}

/** Top-down train, (x, y) = top-left. Length in px. */
export function trainTop(g: G, x: number, y: number, len: number, lit: boolean): void {
  const cars = Math.round(len / 96);
  R(g, 'rgba(40,20,20,.28)', x + 2, y + 30, len - 4, 4);
  for (let c = 0; c < cars; c++) {
    const cx = x + c * 96, w = 94, loco = c === cars - 1;
    R(g, '#3a3340', cx + 6, y + 26, 14, 5);
    R(g, '#3a3340', cx + w - 20, y + 26, 14, 5);
    R(g, '#e9dfc6', cx, y + 2, w, 14);
    R(g, '#fbf3df', cx + 2, y + 3, w - 4, 4);
    R(g, '#cfc3a6', cx, y + 14, w, 2);
    for (let v = 0; v < 3; v++) R(g, '#b9ad90', cx + 14 + v * 28, y + 7, 10, 4);
    R(g, '#d8743a', cx, y + 16, w, 12);
    R(g, PAL.maj, cx, y + 24, w, 2);
    R(g, '#a8552a', cx, y + 28, w, 1);
    if (loco) {
      R(g, '#e9dfc6', cx + w, y + 5, 2, 9);
      R(g, '#d8743a', cx + w, y + 16, 2, 10);
      R(g, lit ? '#ffe9a3' : '#3a4a66', cx + w - 14, y + 18, 11, 6);
      R(g, PAL.gold, cx + w - 2, y + 23, 3, 2);
      R(g, '#3a3340', cx + 30, y + 4, 22, 2);
    } else {
      for (let k = 0; k < 6; k++) {
        R(g, lit ? '#ffe9a3' : '#3a4a66', cx + 8 + k * 14, y + 18, 9, 5);
        if (!lit) R(g, '#6f86b0', cx + 8 + k * 14, y + 18, 3, 1);
      }
      R(g, '#3a3340', cx - 2, y + 19, 2, 4);
    }
  }
}

/* ------------------------------ indoor props ------------------------------ */
/* Indoor props take (x, y) = top-left of their footprint. */

export function desk(g: G, x: number, y: number, w = 32): void {
  R(g, 'rgba(0,0,0,.18)', x + 1, y + 15, w, 3);
  R(g, PAL.woodL, x, y + 2, w, 8);
  R(g, PAL.wood, x, y + 9, w, 6);
  R(g, PAL.woodD, x, y + 14, w, 1);
  R(g, '#c79060', x, y + 2, w, 1);
  R(g, PAL.woodD, x + 1, y + 15, 2, 2);
  R(g, PAL.woodD, x + w - 3, y + 15, 2, 2);
}

export function screen(g: G, x: number, y: number, t: number, hue: number, lines = true): void {
  R(g, '#d9dbe3', x, y, 16, 11);
  R(g, '#14161f', x + 1, y + 1, 14, 8);
  R(g, '#b9bcc8', x + 6, y + 11, 4, 2);
  R(g, '#b9bcc8', x + 4, y + 13, 8, 1);
  if (lines) {
    const cols = [`hsl(${hue},80%,65%)`, `hsl(${(hue + 60) % 360},70%,70%)`, '#e9e9f2'];
    for (let i = 0; i < 3; i++) R(g, cols[i], x + 2 + (i % 2) * 2, y + 2 + i * 2, 4 + ((hash(hue, i) % 6)), 1);
    if (Math.floor(t * 2 + hue) % 2) R(g, '#e9e9f2', x + 11, y + 7, 2, 1);
  }
}

export function imacDesk(g: G, x: number, y: number, t: number, hue: number): void {
  desk(g, x, y);
  screen(g, x + 8, y - 9, t, hue);
  R(g, '#e9e9f2', x + 9, y + 6, 12, 2);
  R(g, '#e9e9f2', x + 23, y + 6, 2, 2);
}

export function laptop(g: G, x: number, y: number, t: number): void {
  R(g, '#b9bcc8', x, y + 6, 12, 3);
  R(g, '#8d909c', x, y + 8, 12, 1);
  R(g, '#3a3d48', x + 1, y - 2, 10, 8);
  R(g, '#14161f', x + 2, y - 1, 8, 6);
  R(g, '#59d98a', x + 3, y, 3, 1);
  R(g, '#59d98a', x + 3, y + 2, 5, 1);
  if (Math.floor(t * 2) % 2) R(g, '#59d98a', x + 3, y + 4, 1, 1);
}

export function bookshelf(g: G, x: number, y: number): void {
  R(g, PAL.woodD, x, y, 32, 30);
  const cols = [PAL.maj, PAL.terra, PAL.green, PAL.ochre, PAL.cream, PAL.pink, '#7a4e9c'];
  for (let s = 0; s < 3; s++) {
    R(g, '#3d2413', x + 2, y + 2 + s * 9, 28, 8);
    let bx = x + 3;
    for (let b = 0; bx < x + 27; b++) {
      const h = hash(s * 31 + b, x);
      const bw = 2 + (h % 2), bh = 5 + ((h >> 3) % 3);
      R(g, cols[(h >> 5) % cols.length], bx, y + 10 + s * 9 - bh, bw, bh);
      bx += bw + ((h >> 8) % 4 === 0 ? 2 : 0);
    }
  }
  R(g, PAL.wood, x, y, 32, 2);
}

export function bed(g: G, x: number, y: number): void {
  R(g, 'rgba(0,0,0,.18)', x + 1, y + 42, 30, 3);
  R(g, PAL.woodD, x, y, 30, 8);
  R(g, PAL.wood, x + 1, y + 1, 28, 5);
  R(g, PAL.white, x + 1, y + 7, 28, 34);
  R(g, '#e9dfc6', x + 4, y + 9, 22, 7);
  R(g, PAL.maj, x + 1, y + 19, 28, 20);
  R(g, PAL.majL, x + 1, y + 19, 28, 2);
  for (let i = 0; i < 4; i++) R(g, PAL.cream, x + 4 + i * 7, y + 26, 3, 3);
  R(g, PAL.woodD, x, y + 40, 30, 3);
}

export function rug(g: G, x: number, y: number, w: number, h: number): void {
  R(g, '#a8322c', x, y, w, h);
  R(g, PAL.cream, x + 2, y + 2, w - 4, 1);
  R(g, PAL.cream, x + 2, y + h - 3, w - 4, 1);
  R(g, PAL.ink, x + 2, y + 4, w - 4, 1);
  R(g, PAL.ink, x + 2, y + h - 5, w - 4, 1);
  for (let cx = x + 12; cx < x + w - 8; cx += 16)
    for (let i = 0; i < 6; i++) {
      R(g, i < 2 ? PAL.gold : PAL.cream, cx - i, y + h / 2 - 6 + i, i * 2 + 1, 1);
      R(g, i < 2 ? PAL.gold : PAL.cream, cx - i, y + h / 2 + 5 - i, i * 2 + 1, 1);
    }
  for (let i = 0; i < w; i += 2) {
    R(g, PAL.cream, x + i, y - 2, 1, 2);
    R(g, PAL.cream, x + i, y + h, 1, 2);
  }
}

export function teaTable(g: G, x: number, y: number, t: number): void {
  R(g, 'rgba(0,0,0,.2)', x + 2, y + 13, 28, 3);
  R(g, '#c9a25a', x + 2, y + 2, 28, 9);
  R(g, '#e9cf8a', x + 3, y + 3, 26, 6);
  R(g, '#a8823f', x + 2, y + 10, 28, 3);
  R(g, '#d9dbe3', x + 12, y - 2, 7, 7);
  R(g, '#f4f5fa', x + 13, y - 1, 2, 3);
  R(g, '#d9dbe3', x + 14, y - 4, 3, 2);
  R(g, '#d9dbe3', x + 19, y, 3, 1);
  R(g, '#d9dbe3', x + 9, y + 1, 3, 1);
  [6, 23].forEach((dx) => {
    R(g, '#bfe6c8', x + dx, y + 3, 3, 4);
    R(g, '#8a9a3a', x + dx, y + 5, 3, 2);
  });
  const f = Math.floor(t * 3) % 3;
  R(g, 'rgba(255,255,255,.7)', x + 15 + (f === 1 ? 1 : 0), y - 8 - f, 1, 2);
  R(g, 'rgba(255,255,255,.45)', x + 14 + (f === 2 ? 1 : 0), y - 11 - f, 1, 2);
}

export function radio(g: G, x: number, y: number, t: number, playing: boolean): void {
  R(g, PAL.woodD, x, y + 8, 16, 8);
  R(g, PAL.wood, x, y + 8, 16, 2);
  R(g, '#7a3b2a', x + 2, y, 12, 8);
  R(g, '#e9cf8a', x + 3, y + 1, 6, 5);
  for (let i = 0; i < 3; i++) R(g, '#7a3b2a', x + 3, y + 2 + i * 2, 6, 1);
  R(g, PAL.cream, x + 10, y + 2, 3, 3);
  R(g, '#2b2b35', x + 13, y - 5, 1, 5);
  if (playing) {
    const f = Math.floor(t * 4) % 2;
    R(g, PAL.gold, x + 16 + f, y - 6 - f * 2, 2, 2);
    R(g, PAL.gold, x + 17 + f, y - 9 - f * 2, 1, 3);
  }
}

export function plant(g: G, x: number, y: number): void {
  R(g, 'rgba(0,0,0,.18)', x + 2, y + 14, 12, 3);
  R(g, PAL.terra, x + 4, y + 8, 8, 7);
  R(g, PAL.terraL, x + 3, y + 7, 10, 2);
  R(g, PAL.leafD, x + 2, y - 4, 12, 11);
  R(g, PAL.leaf, x + 4, y - 7, 8, 12);
  R(g, PAL.leafL, x + 5, y - 5, 2, 6);
  R(g, PAL.leafL, x + 9, y - 2, 2, 5);
}

export function wallFrame(g: G, x: number, y: number, kind: 'casa' | 'map' | 'plaque' | 'ring' | 'hole'): void {
  if (kind === 'casa') {
    R(g, PAL.woodD, x, y, 22, 17);
    R(g, '#f7c9a0', x + 2, y + 2, 18, 13);
    R(g, '#f29b6a', x + 2, y + 8, 18, 3);
    R(g, '#2f7fc4', x + 2, y + 11, 18, 4);
    R(g, PAL.white, x + 11, y + 3, 3, 9);
    R(g, PAL.green, x + 11, y + 2, 3, 2);
    R(g, PAL.white, x + 4, y + 8, 7, 4);
    R(g, PAL.white, x + 14, y + 9, 5, 3);
    R(g, '#fff3b0', x + 5, y + 4, 3, 3);
  } else if (kind === 'map') {
    R(g, PAL.woodD, x, y, 26, 17);
    R(g, '#efe2c0', x + 1, y + 1, 24, 15);
    R(g, PAL.terraD, x + 4, y + 11, 2, 2);
    R(g, PAL.terraD, x + 12, y + 7, 2, 2);
    R(g, PAL.maj, x + 20, y + 3, 3, 3);
    for (let i = 0; i < 3; i++) R(g, '#8d7a5a', x + 7 + i * 2, y + 10 - i, 1, 1);
    for (let i = 0; i < 3; i++) R(g, '#8d7a5a', x + 15 + i * 2, y + 6 - i, 1, 1);
  } else if (kind === 'plaque') {
    R(g, '#2a1c14', x, y, 26, 15);
    R(g, PAL.gold, x + 1, y + 1, 24, 13);
    R(g, '#2a1c14', x + 4, y + 4, 18, 1);
    R(g, '#2a1c14', x + 4, y + 7, 14, 1);
    R(g, '#2a1c14', x + 4, y + 10, 16, 1);
  } else if (kind === 'ring') {
    g.strokeStyle = '#f3e3d3';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x + 9, y + 9, 6, 0.8, Math.PI * 2 - 0.2);
    g.stroke();
    R(g, '#f3e3d3', x + 13, y + 12, 2, 2);
    R(g, '#f3e3d3', x + 15, y + 14, 2, 2);
  } else {
    R(g, '#0c0c12', x, y, 20, 20);
    g.fillStyle = '#000';
    g.beginPath();
    g.arc(x + 10, y + 10, 5, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#f08a24';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(x + 10, y + 10, 8, 3, -0.3, 0, Math.PI * 2);
    g.stroke();
  }
}

export function windowIn(g: G, x: number, y: number, sky: string): void {
  arch(g, PAL.majD, x + 9, y + 22, 18, 22);
  arch(g, sky, x + 9, y + 21, 14, 19);
  R(g, PAL.majD, x + 8, y + 2, 2, 20);
  R(g, PAL.majD, x + 2, y + 12, 14, 1);
}

export function whiteboard(g: G, x: number, y: number): void {
  R(g, '#9a9daa', x, y, 64, 22);
  R(g, '#f6f7fb', x + 1, y + 1, 62, 19);
  const t = pixelText('1337', '#1b1530');
  g.drawImage(t, x + 4, y + 2);
  R(g, '#c8372f', x + 4, y + 12, 16, 1);
  R(g, '#2d5fa8', x + 26, y + 5, 10, 6);
  R(g, '#2d5fa8', x + 44, y + 5, 10, 6);
  R(g, '#1b1530', x + 36, y + 8, 8, 1);
  R(g, '#2f8a5a', x + 28, y + 14, 24, 1);
  R(g, '#2f8a5a', x + 28, y + 16, 16, 1);
  R(g, '#1b1530', x + 56, y + 20, 5, 2);
}

export function coffee(g: G, x: number, y: number): void {
  R(g, '#3a3d48', x + 2, y, 12, 26);
  R(g, '#5a5e6c', x + 3, y + 1, 10, 8);
  R(g, '#c8372f', x + 4, y + 3, 8, 3);
  R(g, '#14161f', x + 4, y + 12, 8, 8);
  R(g, PAL.cream, x + 6, y + 16, 4, 4);
  R(g, '#f08a24', x + 11, y + 10, 1, 1);
}

export function rack(g: G, x: number, y: number, t: number, seed: number): void {
  R(g, '#0e1018', x, y, 18, 36);
  R(g, '#262a38', x + 1, y + 1, 16, 33);
  for (let u = 0; u < 7; u++) {
    const uy = y + 3 + u * 4;
    R(g, '#141722', x + 2, uy, 14, 3);
    for (let k = 0; k < 3; k++) {
      const on = hash(seed * 13 + u, k + Math.floor(t * (2 + ((seed + u + k) % 3)))) % 4 !== 0;
      R(g, on ? (k === 2 ? '#ffb83d' : '#59d98a') : '#1f3a2c', x + 3 + k * 2, uy + 1, 1, 1);
    }
    R(g, '#3a4056', x + 10, uy + 1, 5, 1);
  }
  R(g, '#0e1018', x, y + 34, 18, 2);
}

export function termDesk(g: G, x: number, y: number, t: number): void {
  desk(g, x, y);
  R(g, '#cfc7b0', x + 7, y - 12, 18, 15);
  R(g, '#0c1410', x + 9, y - 10, 14, 10);
  R(g, '#59d98a', x + 10, y - 9, 6, 1);
  R(g, '#59d98a', x + 10, y - 7, 9, 1);
  R(g, '#59d98a', x + 10, y - 5, 4, 1);
  if (Math.floor(t * 2) % 2) R(g, '#59d98a', x + 15, y - 5, 2, 1);
  R(g, '#cfc7b0', x + 9, y + 5, 14, 3);
}

export function redButton(g: G, x: number, y: number, t: number): void {
  R(g, 'rgba(0,0,0,.25)', x + 1, y + 14, 14, 3);
  R(g, '#f2c230', x + 1, y + 2, 14, 13);
  for (let i = 0; i < 4; i++) R(g, '#1b1530', x + 1 + i * 4, y + 12, 2, 3);
  R(g, '#8d909c', x + 3, y + 3, 10, 6);
  const p = Math.floor(t * 2) % 2;
  R(g, p ? '#ff5a4d' : '#c8372f', x + 4, y - 1, 8, 6);
  R(g, '#ff9a8f', x + 5, y, 3, 1);
}

/** Lab workbench with one of six gizmos on top. */
export function labBench(g: G, x: number, y: number, t: number, kind: number): void {
  R(g, 'rgba(0,0,0,.18)', x + 1, y + 15, 32, 3);
  R(g, '#5f7a9c', x, y + 2, 32, 8);
  R(g, '#7f9abc', x, y + 2, 32, 1);
  R(g, '#3f5878', x, y + 9, 32, 6);
  R(g, '#2f4460', x, y + 14, 32, 1);
  R(g, '#2f4460', x + 2, y + 15, 2, 2);
  R(g, '#2f4460', x + 28, y + 15, 2, 2);
  const bx = x + 8, by = y - 8;
  if (kind === 0) {
    screen(g, bx, by, t, 200, false);
    for (let i = 0; i < 4; i++) R(g, ['#59d98a', '#ffb83d', '#6f80f0', '#e2578f'][i], bx + 3 + i * 3, by + 7 - (hash(i, Math.floor(t)) % 5), 2, 1 + (hash(i, Math.floor(t)) % 5));
  } else if (kind === 1) {
    g.strokeStyle = '#326ce5';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(bx + 8, by + 6, 6, 0, Math.PI * 2);
    g.stroke();
    const a = t * 0.8;
    for (let i = 0; i < 6; i++) R(g, '#326ce5', bx + 8 + Math.cos(a + i * 1.047) * 8 - 1, by + 6 + Math.sin(a + i * 1.047) * 8 - 1, 2, 2);
    R(g, '#e9e9f2', bx + 7, by + 5, 2, 2);
  } else if (kind === 2) {
    R(g, PAL.terra, bx, by + 4, 7, 7);
    R(g, PAL.terraD, bx - 1, by + 2, 9, 2);
    R(g, PAL.maj, bx + 9, by + 3, 7, 8);
    R(g, PAL.majD, bx + 8, by + 1, 9, 2);
    R(g, PAL.gold, bx + 2, by + 7, 2, 2);
    R(g, PAL.gold, bx + 11, by + 6, 2, 2);
    R(g, PAL.ink, bx + 7, by + 7, 2, 1);
  } else if (kind === 3) {
    const cols = ['#2d7fd8', '#e0603a', '#59b06a', '#e0a03a', '#7a4e9c', '#2d7fd8'];
    for (let i = 0; i < 6; i++) {
      const cxp = bx - 2 + (i % 3) * 7, cyp = by + 6 - Math.floor(i / 3) * 5;
      R(g, cols[i], cxp, cyp, 6, 4);
      R(g, 'rgba(0,0,0,.25)', cxp + 2, cyp, 1, 4);
      R(g, 'rgba(0,0,0,.25)', cxp + 4, cyp, 1, 4);
    }
  } else if (kind === 4) {
    R(g, '#2b2b35', bx + 7, by - 4, 1, 12);
    R(g, '#c8372f', bx + 6, by - 5, 3, 2);
    R(g, PAL.cream, bx - 1, by + 1, 8, 5);
    R(g, PAL.cream, bx + 1, by + 6, 2, 2);
    R(g, '#59d98a', bx + 10, by + 4, 8, 5);
    R(g, '#59d98a', bx + 15, by + 9, 2, 2);
    if (Math.floor(t * 2) % 2) R(g, PAL.ink, bx + 1, by + 3, 4, 1);
  } else {
    R(g, '#2b2b35', bx - 3, by + 9, 22, 2);
    R(g, '#3f9447', bx - 2, by + 3, 20, 6);
    R(g, '#63b35a', bx + 2, by + 3, 4, 6);
    R(g, '#63b35a', bx + 10, by + 3, 4, 6);
    R(g, '#14161f', bx - 3, by - 3, 22, 6);
    const hue = (Math.floor(t * 1.5) % 3) * 110;
    R(g, `hsl(${hue},80%,60%)`, bx - 2, by - 2, 20, 4);
    R(g, '#fff', bx + 1 + (Math.floor(t * 6) % 10), by - 1, 4, 2);
  }
}

export function pipelineConsole(g: G, x: number, y: number, t: number, ok: boolean): void {
  R(g, '#2b3140', x, y, 40, 40);
  R(g, '#3a4256', x + 1, y + 1, 38, 30);
  R(g, '#0c1410', x + 4, y + 4, 32, 14);
  for (let i = 0; i < 5; i++) {
    const bad = !ok && i >= 1;
    const blink = !ok && i === 1 && Math.floor(t * 3) % 2;
    R(g, ok ? '#59d98a' : bad ? (blink ? '#ff5a4d' : '#7a1f1a') : '#59d98a', x + 6 + i * 6, y + 8, 4, 4);
    if (i < 4) R(g, '#5a6278', x + 10 + i * 6, y + 10, 2, 1);
  }
  R(g, ok ? '#59d98a' : '#ffb83d', x + 6, y + 14, ok ? 28 : 10, 1);
  R(g, '#5a6278', x + 4, y + 22, 10, 6);
  R(g, '#c8372f', x + 18, y + 22, 5, 5);
  R(g, '#f2c230', x + 26, y + 22, 5, 5);
  R(g, '#1c2130', x, y + 31, 40, 9);
  R(g, '#4a8fd0', x + 30, y + 33, 10, 4);
}

/** Hanout shelf; `kind` picks the stock colours. */
export function shelf(g: G, x: number, y: number, kind: number): void {
  R(g, PAL.woodD, x, y, 34, 32);
  const sets = [
    ['#5a6fd8', '#8d909c', '#3178c6', '#f2c230', '#e0603a'],
    ['#e0234e', '#2d3748', '#336791', '#e9e9f2', '#59b06a'],
    ['#14161f', '#61dafb', '#38bdf8', '#e9e9f2', '#61dafb'],
    ['#2d7fd8', '#326ce5', '#ef7b4d', '#009639', '#f2c230'],
    ['#d50c2d', '#f38020', '#e9e9f2', '#6f80f0', '#f38020'],
  ];
  const cols = sets[kind % sets.length];
  for (let s = 0; s < 3; s++) {
    R(g, '#3d2413', x + 2, y + 2 + s * 10, 30, 8);
    for (let b = 0; b < 5; b++) {
      const h = hash(kind * 7 + s, b), col = cols[(b + s) % cols.length];
      const jx = x + 3 + b * 6;
      if (h % 3 === 0) {
        R(g, col, jx, y + 4 + s * 10, 5, 6);
        R(g, 'rgba(255,255,255,.35)', jx, y + 4 + s * 10, 1, 6);
        R(g, PAL.cream, jx + 1, y + 6 + s * 10, 3, 2);
      } else if (h % 3 === 1) {
        R(g, 'rgba(255,255,255,.25)', jx, y + 5 + s * 10, 4, 5);
        R(g, col, jx, y + 7 + s * 10, 4, 3);
        R(g, PAL.wood, jx, y + 4 + s * 10, 4, 1);
      } else {
        R(g, col, jx, y + 3 + s * 10, 4, 7);
        R(g, 'rgba(0,0,0,.25)', jx + 3, y + 3 + s * 10, 1, 7);
      }
    }
    R(g, PAL.wood, x + 1, y + 10 + s * 10, 32, 2);
  }
  R(g, PAL.wood, x, y, 34, 2);
}

export function counter(g: G, x: number, y: number, w: number, top = '#e9cf8a', front = PAL.wood): void {
  R(g, 'rgba(0,0,0,.18)', x + 1, y + 16, w, 3);
  R(g, top, x, y, w, 9);
  R(g, 'rgba(255,255,255,.35)', x, y, w, 1);
  R(g, front, x, y + 9, w, 7);
  R(g, 'rgba(0,0,0,.25)', x, y + 15, w, 1);
  for (let i = 8; i < w; i += 16) R(g, 'rgba(0,0,0,.18)', x + i, y + 10, 1, 5);
}

export function spices(g: G, x: number, y: number): void {
  R(g, PAL.woodD, x, y + 8, 30, 8);
  R(g, PAL.wood, x, y + 8, 30, 2);
  ['#c8372f', '#e0a03a', '#8a5a2a', '#f2c230'].forEach((c, i) => {
    for (let k = 0; k < 6; k++) R(g, c, x + 1 + i * 7 + (5 - k) / 2, y + 3 + k, k + 1, 1);
  });
}

export function scale(g: G, x: number, y: number): void {
  R(g, '#c9a25a', x + 7, y, 2, 8);
  R(g, '#c9a25a', x + 1, y + 1, 14, 1);
  R(g, '#e9cf8a', x, y + 4, 5, 2);
  R(g, '#e9cf8a', x + 11, y + 5, 5, 2);
  R(g, '#c9a25a', x + 4, y + 8, 8, 2);
}

export function letterbox(g: G, x: number, y: number, col: string, colD: string, mark: string): void {
  R(g, 'rgba(0,0,0,.2)', x + 1, y + 14, 14, 3);
  R(g, colD, x + 1, y - 8, 14, 23);
  R(g, col, x + 1, y - 8, 13, 22);
  R(g, col, x + 3, y - 10, 10, 2);
  R(g, PAL.ink, x + 4, y - 4, 8, 2);
  const m = pixelText(mark, PAL.ink);
  g.drawImage(m, Math.round(x + 8 - m.width / 2), y + 1);
}

export function innerDoor(g: G, x: number, y: number, open: boolean): void {
  R(g, '#14161f', x - 1, y + 4, 18, 28);
  R(g, open ? '#0c1410' : '#5a6278', x + 1, y + 6, 14, 26);
  if (!open) {
    R(g, '#3a4256', x + 3, y + 9, 10, 8);
    R(g, PAL.gold, x + 12, y + 20, 2, 2);
  } else {
    R(g, '#59d98a', x + 3, y + 12, 2, 1);
    R(g, '#59d98a', x + 9, y + 18, 2, 1);
    R(g, '#ffb83d', x + 6, y + 24, 2, 1);
  }
  R(g, '#c8372f', x + 2, y, 12, 4);
}

export function waterCooler(g: G, x: number, y: number): void {
  R(g, '#e9ecf2', x + 4, y + 6, 8, 18);
  R(g, '#9fd3f0', x + 5, y - 4, 6, 10);
  R(g, '#cfeaff', x + 6, y - 3, 2, 6);
  R(g, '#c8372f', x + 5, y + 11, 2, 2);
  R(g, '#2d5fa8', x + 9, y + 11, 2, 2);
}
