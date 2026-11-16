/* Building exteriors, drawn once into the campus base layer. */
import { PAL, R, TILE, arch, hash, pixelText, type G } from './gfx';

export type Style = 'home' | 's1337' | 'brandscan' | 'lab' | 'hanout' | 'post';
export interface BDef { id: string; style: Style; x: number; y: number; w: number; h: number; sign: string }
export interface Win { x: number; y: number; w: number; h: number; color: string }

function plate(g: G, text: string, cx: number, y: number, bg: string, fg: string, scale = 1): void {
  const t = pixelText(text, fg);
  const w = t.width * scale + 6, h = (t.height - 2) * scale + 4;
  R(g, 'rgba(0,0,0,.3)', cx - w / 2 + 1, y + 1, w, h);
  R(g, bg, cx - w / 2, y, w, h);
  g.drawImage(t, Math.round(cx - (t.width * scale) / 2), Math.round(y + 1), t.width * scale, t.height * scale);
}

function speckle(g: G, color: string, X: number, Y: number, W: number, H: number, n: number, seed: number): void {
  for (let i = 0; i < n; i++) {
    const h = hash(seed + i * 17, i);
    R(g, color, X + (h % W), Y + ((h >> 8) % H), 1 + ((h >> 4) % 2), 1);
  }
}

function merlons(g: G, X: number, Y: number, W: number, color: string, shade: string): void {
  for (let x = X; x < X + W - 3; x += 8) {
    R(g, color, x + 1, Y - 6, 6, 6);
    R(g, color, x + 2, Y - 8, 4, 2);
    R(g, color, x + 3, Y - 9, 2, 1);
    R(g, shade, x + 6, Y - 6, 1, 6);
  }
}

function zellige(g: G, X: number, Y: number, W: number, cols: string[]): void {
  for (let i = 0; i < W; i += 4) {
    R(g, cols[(i / 4) % cols.length], X + i, Y, Math.min(4, W - i), 4);
    R(g, 'rgba(255,255,255,.35)', X + i + 1, Y + 1, 2, 2);
  }
}

function archWin(g: G, wins: Win[], cx: number, bottom: number, w: number, h: number, frame: string, glass: string, glow: string): void {
  arch(g, frame, cx, bottom + 1, w + 4, h + 3);
  arch(g, glass, cx, bottom, w, h);
  R(g, 'rgba(255,255,255,.45)', cx - w / 2 + 1, bottom - h + 4, 2, 3);
  R(g, frame, cx - 0.5, bottom - h, 1, h);
  wins.push({ x: cx - w / 2, y: bottom - h + 2, w, h: h - 2, color: glow });
}

/** Draws the building and returns its lit-at-night windows. */
export function drawBuilding(g: G, b: BDef): Win[] {
  const X = b.x * TILE, Y = b.y * TILE, W = b.w * TILE, H = b.h * TILE, cx = X + W / 2, bottom = Y + H;
  const wins: Win[] = [];
  R(g, 'rgba(60,30,20,.25)', X + 3, bottom, W, 4);

  if (b.style === 'home') {
    const rh = 34;
    R(g, '#f6eedb', X, Y + rh, W, H - rh);
    speckle(g, '#e6dcc4', X, Y + rh, W, H - rh, 30, 1);
    R(g, '#d9cdb2', X, bottom - 4, W, 4);
    R(g, PAL.green, X - 3, Y + 2, W + 6, rh);
    for (let y = Y + 4; y < Y + rh - 2; y += 5)
      for (let x = X - 3 + ((y / 5) % 2 ? 0 : 3); x < X + W + 2; x += 6) {
        R(g, PAL.greenD, x, y, 1, 4);
        R(g, '#48a875', x + 2, y, 2, 1);
      }
    R(g, '#48a875', X - 3, Y + 2, W + 6, 2);
    R(g, PAL.greenD, X - 3, Y + rh - 1, W + 6, 3);
    zellige(g, X, Y + rh + 2, W, [PAL.maj, PAL.cream, PAL.green, PAL.cream]);
    arch(g, PAL.green, cx, bottom, 24, 30);
    arch(g, PAL.cream, cx, bottom, 20, 27);
    arch(g, PAL.maj, cx, bottom, 16, 24);
    R(g, PAL.majD, cx - 0.5, bottom - 22, 1, 22);
    for (let i = 0; i < 3; i++) {
      R(g, PAL.gold, cx - 5, bottom - 17 + i * 6, 1, 1);
      R(g, PAL.gold, cx + 4, bottom - 17 + i * 6, 1, 1);
    }
    R(g, PAL.gold, cx + 2, bottom - 9, 1, 2);
    [-40, -22, 22, 40].forEach((dx) => archWin(g, wins, cx + dx, bottom - 12, 10, 15, PAL.maj, '#9fd3e6', '#ffd98a'));
    for (let i = 0; i < 26; i++) {
      const h = hash(i, 77);
      R(g, i % 4 ? PAL.pink : '#f48fb8', X + W - 20 + (h % 22), Y + rh - 6 + ((h >> 5) % 26), 2, 2);
      if (i % 3 === 0) R(g, PAL.leaf, X + W - 19 + ((h >> 3) % 20), Y + rh - 4 + ((h >> 7) % 24), 2, 1);
    }
    plate(g, b.sign, cx, Y + 10, PAL.cream, PAL.greenD);
  } else if (b.style === 's1337') {
    const rh = 46;
    R(g, '#32353f', X, Y + rh, W, H - rh);
    R(g, '#1c1e25', X - 2, Y + 2, W + 4, rh);
    R(g, '#2a2d36', X + 2, Y + 5, W - 4, rh - 8);
    [[10, 9], [W - 34, 9]].forEach(([dx, dy]) => {
      R(g, '#4a4e5a', X + dx, Y + dy, 24, 12);
      R(g, '#343843', X + dx + 2, Y + dy + 2, 20, 8);
      for (let i = 0; i < 4; i++) R(g, '#5d6270', X + dx + 3 + i * 5, Y + dy + 3, 3, 6);
    });
    R(g, '#3fa0ae', X + 44, Y + 8, 18, 10);
    R(g, '#6fd0d8', X + 45, Y + 9, 6, 3);
    R(g, '#15161b', X - 2, Y + rh - 3, W + 4, 4);
    plate(g, b.sign, cx, Y + rh - 27, '#0c0c12', '#ffffff', 2);
    R(g, '#59d98a', cx + 30, Y + rh - 9, 8, 3);
    const gy = Y + rh + 6, gh = H - rh - 10;
    for (let x = X + 6; x < X + W - 20; x += 22) {
      if (Math.abs(x + 9 - cx) < 16) continue;
      R(g, '#1f2128', x - 1, gy - 1, 20, gh + 2);
      R(g, '#3fa0ae', x, gy, 18, gh);
      R(g, '#62c6cf', x, gy, 18, 8);
      R(g, '#2f8794', x, gy + gh - 10, 18, 10);
      for (let i = 0; i < 6; i++) R(g, 'rgba(255,255,255,.35)', x + 3 + i, gy + 12 - i * 2, 4, 1);
      R(g, '#1f2128', x + 8, gy, 1, gh);
      R(g, '#1f2128', x, gy + Math.floor(gh / 2), 18, 1);
      wins.push({ x, y: gy, w: 18, h: gh, color: '#8fe6ee' });
    }
    R(g, '#f4f5fa', cx - 15, bottom - 30, 30, 30);
    R(g, '#16181f', cx - 13, bottom - 28, 26, 28);
    R(g, '#2f8794', cx - 12, bottom - 27, 11, 27);
    R(g, '#2f8794', cx + 1, bottom - 27, 11, 27);
    R(g, '#62c6cf', cx - 12, bottom - 27, 11, 6);
    R(g, '#62c6cf', cx + 1, bottom - 27, 11, 6);
    R(g, '#f4f5fa', cx - 3, bottom - 14, 1, 5);
    R(g, '#f4f5fa', cx + 2, bottom - 14, 1, 5);
    R(g, '#22242b', X, bottom - 3, W, 3);
    R(g, '#16181f', cx - 13, bottom - 3, 26, 3);
  } else if (b.style === 'brandscan') {
    const rh = 40;
    R(g, PAL.terra, X, Y + rh, W, H - rh);
    speckle(g, PAL.terraD, X, Y + rh, W, H - rh, 60, 3);
    speckle(g, PAL.terraL, X, Y + rh, W, H - rh, 40, 9);
    R(g, PAL.terraD, X, bottom - 4, W, 4);
    R(g, '#b85f38', X - 2, Y + 2, W + 4, rh);
    R(g, '#dfa07a', X + 3, Y + 6, W - 6, rh - 9);
    speckle(g, '#d08e68', X + 3, Y + 6, W - 6, rh - 9, 40, 5);
    merlons(g, X - 2, Y + rh + 6, W + 4, PAL.terraL, PAL.terraD);
    R(g, PAL.terraL, X - 2, Y + rh, W + 4, 6);
    R(g, PAL.terraD, X - 2, Y + rh + 5, W + 4, 1);
    // dish + antenna
    R(g, '#8d909c', X + W - 30, Y + 20, 2, 10);
    R(g, '#e9ecf2', X + W - 38, Y + 10, 16, 10);
    R(g, '#e9ecf2', X + W - 36, Y + 8, 12, 14);
    R(g, '#b9bfcc', X + W - 34, Y + 12, 8, 6);
    R(g, '#3a3d48', X + W - 31, Y + 14, 2, 2);
    R(g, '#3a3d48', X + 18, Y + 6, 1, 22);
    R(g, '#3a3d48', X + 15, Y + 10, 7, 1);
    R(g, '#3a3d48', X + 16, Y + 14, 5, 1);
    plate(g, b.sign, cx, Y + 14, '#2a1710', '#f3e3d3');
    [-56, -34, 34, 56].forEach((dx) => archWin(g, wins, cx + dx, bottom - 12, 12, 18, '#7a3d25', '#f6d9b8', '#ffd98a'));
    arch(g, '#7a3d25', cx, bottom, 26, 32);
    arch(g, '#3b2416', cx, bottom, 20, 28);
    R(g, '#2a1710', cx - 0.5, bottom - 26, 1, 26);
    for (let i = 0; i < 4; i++) {
      R(g, PAL.gold, cx - 6, bottom - 22 + i * 5, 1, 1);
      R(g, PAL.gold, cx + 5, bottom - 22 + i * 5, 1, 1);
    }
    zellige(g, cx - 13, bottom - 36, 26, [PAL.maj, PAL.cream]);
  } else if (b.style === 'lab') {
    const rh = 38;
    R(g, '#dfe3ea', X, Y + rh, W, H - rh);
    R(g, '#b9bfcc', X, bottom - 4, W, 4);
    for (let x = X + 16; x < X + W; x += 32) R(g, '#cfd4de', x, Y + rh, 1, H - rh - 4);
    R(g, '#3d4c68', X - 2, Y + 2, W + 4, rh);
    R(g, '#4f6185', X + 2, Y + 5, W - 4, rh - 8);
    for (let i = 0; i < 4; i++) {
      const px = X + 8 + i * 22;
      R(g, '#1c2a4a', px, Y + 9, 18, 12);
      R(g, '#2f4f8f', px + 1, Y + 10, 16, 10);
      R(g, '#6f9ae0', px + 1, Y + 10, 16, 1);
      R(g, '#1c2a4a', px + 9, Y + 9, 1, 12);
      R(g, '#1c2a4a', px, Y + 15, 18, 1);
    }
    R(g, '#8d94a6', X + W - 28, Y + 6, 12, 14);
    R(g, '#5a6278', X + W - 26, Y + 8, 8, 4);
    R(g, '#2b3140', X - 2, Y + rh - 3, W + 4, 4);
    plate(g, b.sign, cx, Y + 24, '#14161f', '#59d98a');
    const wy = Y + rh + 8;
    [[X + 10, 44], [X + W - 54, 44]].forEach(([wx, ww]) => {
      R(g, '#8d94a6', wx - 1, wy - 1, ww + 2, 16);
      R(g, '#1b2230', wx, wy, ww, 14);
      for (let i = 0; i < 9; i++) R(g, ['#59d98a', '#ffb83d', '#ff6b6b', '#6f80f0'][hash(i, wx) % 4], wx + 3 + (i % 5) * 8, wy + 3 + Math.floor(i / 5) * 6, 3, 1);
      wins.push({ x: wx, y: wy, w: ww, h: 14, color: '#2f4f6f' });
    });
    R(g, '#8d94a6', cx - 14, bottom - 30, 28, 30);
    R(g, '#3a4256', cx - 12, bottom - 26, 24, 26);
    R(g, '#4f5a74', cx - 12, bottom - 26, 11, 26);
    for (let i = 0; i < 7; i++) R(g, i % 2 ? '#1b1530' : '#f2c230', cx - 14 + i * 4, bottom - 30, 4, 4);
    R(g, '#59d98a', cx + 5, bottom - 14, 2, 2);
    // the pipe leaving the west wall
    R(g, '#2f8794', X + 2, bottom - 14, 8, 8);
    R(g, '#62c6cf', X + 2, bottom - 14, 8, 2);
    R(g, '#1f5f68', X + 2, bottom - 7, 8, 1);
  } else if (b.style === 'hanout') {
    const rh = 30;
    R(g, '#cf9d5e', X, Y + rh, W, H - rh);
    speckle(g, '#b98648', X, Y + rh, W, H - rh, 50, 11);
    R(g, '#b98648', X, bottom - 4, W, 4);
    R(g, '#b98648', X - 2, Y + 2, W + 4, rh);
    R(g, '#e3b97c', X + 3, Y + 6, W - 6, rh - 9);
    speckle(g, '#d3a868', X + 3, Y + 6, W - 6, rh - 9, 25, 13);
    R(g, '#a8763c', X - 2, Y + rh - 2, W + 4, 3);
    plate(g, b.sign, cx, Y + 11, PAL.greenD, PAL.cream);
    // open shopfront
    R(g, '#2a1710', cx - 26, bottom - 30, 52, 30);
    for (let s = 0; s < 2; s++)
      for (let i = 0; i < 8; i++) {
        R(g, ['#e0603a', '#f2c230', '#59b06a', '#6f80f0', '#e9e9f2'][hash(i, s) % 5], cx - 23 + i * 6, bottom - 26 + s * 9, 4, 6);
      }
    R(g, PAL.wood, cx - 26, bottom - 20, 52, 1);
    R(g, PAL.wood, cx - 26, bottom - 11, 52, 1);
    R(g, '#3b2416', cx - 8, bottom - 12, 16, 12);
    // awning
    for (let i = 0; i < 14; i++) {
      R(g, i % 2 ? PAL.cream : PAL.green, cx - 28 + i * 4, bottom - 38, 4, 9);
      R(g, i % 2 ? '#e3d6b6' : PAL.greenD, cx - 28 + i * 4, bottom - 30, 4, 2);
    }
    R(g, PAL.greenD, cx - 28, bottom - 39, 56, 1);
    archWin(g, wins, X + 14, bottom - 14, 10, 14, '#7a4a22', '#f6d9b8', '#ffd98a');
    archWin(g, wins, X + W - 14, bottom - 14, 10, 14, '#7a4a22', '#f6d9b8', '#ffd98a');
    wins.push({ x: cx - 24, y: bottom - 28, w: 48, h: 16, color: '#ffcf7a' });
  } else {
    const rh = 26;
    R(g, '#f2c230', X, Y + rh, W, H - rh);
    speckle(g, '#e0b020', X, Y + rh, W, H - rh, 25, 21);
    R(g, '#d4a51c', X, bottom - 4, W, 4);
    R(g, '#2d5fa8', X - 3, Y + 2, W + 6, rh);
    for (let y = Y + 4; y < Y + rh - 2; y += 5)
      for (let x = X - 3 + ((y / 5) % 2 ? 0 : 3); x < X + W + 2; x += 6) R(g, '#1f4479', x, y, 1, 4);
    R(g, '#4a7fd0', X - 3, Y + 2, W + 6, 2);
    R(g, '#1f4479', X - 3, Y + rh - 1, W + 6, 3);
    R(g, PAL.white, X, Y + rh + 2, W, 2);
    plate(g, b.sign, cx, Y + 8, '#f2c230', '#1f4479');
    arch(g, PAL.white, cx, bottom, 22, 28);
    arch(g, '#2d5fa8', cx, bottom, 18, 25);
    R(g, '#1f4479', cx - 0.5, bottom - 23, 1, 23);
    R(g, PAL.gold, cx + 2, bottom - 10, 1, 2);
    [-30, 30].forEach((dx) => archWin(g, wins, cx + dx, bottom - 10, 12, 16, PAL.white, '#bfe0f5', '#ffd98a'));
    // envelope emblem
    R(g, PAL.white, cx - 5, Y + rh + 6, 10, 7);
    R(g, '#1f4479', cx - 5, Y + rh + 6, 10, 1);
    for (let i = 0; i < 4; i++) {
      R(g, '#1f4479', cx - 4 + i, Y + rh + 7 + i, 1, 1);
      R(g, '#1f4479', cx + 3 - i, Y + rh + 7 + i, 1, 1);
    }
  }
  return wins;
}
