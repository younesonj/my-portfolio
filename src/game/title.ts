/* Title scene: the train from Casablanca crossing the plain, side view. */
import { PAL, R, hash, pixelText, type G } from './gfx';
import { world } from './world';

let scroll = 0;
type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB): string => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
/** day → dusk → night blend, driven by world.night. */
function tone(day: string, dusk: string, night: string): RGB {
  const n = world.night;
  return n < 0.35 ? mix(hex(day), hex(dusk), n / 0.35) : mix(hex(dusk), hex(night), (n - 0.35) / 0.65);
}

export function updateTitle(dt: number, k: number): void {
  if (world.reduce) return;
  scroll += dt * 150 * Math.pow(1 - k, 1.6);
}

function wheel(g: G, x: number, y: number): void {
  R(g, '#2b2b35', x + 1, y, 4, 6);
  R(g, '#2b2b35', x, y + 1, 6, 4);
  const f = Math.floor(scroll / 3) % 2;
  R(g, '#8d909c', x + 2 + f, y + 2, 1, 2);
  R(g, '#8d909c', x + 2, y + 2 + f, 2, 1);
}

function car(g: G, x: number, y: number, w: number, glow: boolean, loco: boolean): void {
  R(g, '#e9dfc6', x, y, w, 12);
  R(g, '#fbf3df', x, y, w, 2);
  R(g, '#d8743a', x, y + 12, w, 8);
  R(g, PAL.maj, x, y + 17, w, 2);
  R(g, '#3a3340', x + 2, y + 20, w - 4, 3);
  const win = glow ? '#ffe9a3' : '#3a4a66';
  if (loco) {
    for (let i = 0; i < 12; i++) {
      const top = y + Math.round(i * 0.95);
      R(g, '#e9dfc6', x + w + i, top, 1, y + 12 - top);
      R(g, '#fbf3df', x + w + i, top, 1, 1);
      R(g, '#d8743a', x + w + i, y + 12, 1, 8 - Math.max(0, i - 8));
      R(g, PAL.maj, x + w + i, y + 17, 1, i > 10 ? 1 : 2);
    }
    for (let i = -9; i < 8; i++) {
      const top = y + 3 + Math.max(0, Math.round(i * 0.95));
      if (y + 10 - top > 0) R(g, i === -9 ? '#3a3340' : win, x + w + i, top, 1, y + 10 - top);
    }
    R(g, PAL.gold, x + w + 8, y + 13, 3, 2);
    for (let i = 0; i < 3; i++) R(g, win, x + 8 + i * 14, y + 4, 9, 5);
    R(g, '#3a3340', x + 20, y - 5, 1, 5);
    R(g, '#3a3340', x + 34, y - 5, 1, 5);
    R(g, '#3a3340', x + 16, y - 6, 24, 1);
    R(g, '#b9ad90', x + 44, y + 13, 14, 5);
  } else {
    for (let i = 0; i < Math.floor((w - 10) / 12); i++) {
      R(g, win, x + 7 + i * 12, y + 4, 8, 6);
      if (!glow) R(g, '#6f86b0', x + 7 + i * 12, y + 4, 8, 1);
    }
    // a visitor at the window: you
    R(g, '#d9a273', x + 32, y + 6, 4, 4);
    R(g, '#3a2416', x + 32, y + 5, 4, 2);
    R(g, '#1fa59a', x + 31, y + 9, 6, 1);
    R(g, '#3a3340', x - 3, y + 14, 3, 3);
  }
  [8, 18, w - 24, w - 14].forEach((dx) => wheel(g, x + dx, y + 20));
}

/** k = 0 cruising … 1 stopped at Benguerir. */
export function drawTitle(g: G, vw: number, vh: number, t: number, k: number): void {
  const horizon = Math.round(vh * 0.56), ty = Math.round(vh * 0.72);
  const top = tone('#6fc0ee', '#e8855a', '#0b1034'), bot = tone('#d5eef6', '#f7d9a0', '#2c3470');
  const bands = 9;
  for (let i = 0; i < bands; i++) R(g, css(mix(top, bot, i / (bands - 1))), 0, Math.floor((horizon * i) / bands), vw, Math.ceil(horizon / bands) + 1);

  const n = world.night;
  if (n > 0.5) {
    for (let i = 0; i < 46; i++) {
      const h = hash(i, 9);
      if (world.reduce || (h + Math.floor(t * 2)) % 7) R(g, '#fff8ea', h % vw, (h >> 9) % Math.max(1, horizon - 20), 1, 1);
    }
    const mx = Math.round(vw * 0.1) + 6, my = Math.round(vh * 0.12) + 8;
    g.fillStyle = '#fff3d0';
    g.beginPath(); g.arc(mx, my, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = css(mix(top, bot, 0.25));
    g.beginPath(); g.arc(mx + 4, my - 2, 8, 0, Math.PI * 2); g.fill();
  } else {
    const sx = Math.round(vw * 0.1) + 6, sy = Math.round(horizon * (0.22 + n * 1.6)) + 8;
    g.fillStyle = n > 0.12 ? '#ffd27a' : '#fff6c8';
    g.beginPath(); g.arc(sx, sy, 10, 0, Math.PI * 2); g.fill();
  }

  // Atlas, far away
  const mt = css(tone('#9fb6d6', '#b9728a', '#1a2150')), snow = css(tone('#ffffff', '#ffd9c0', '#5a66a8'));
  for (let x = 0; x < vw; x += 2) {
    const wx = x + scroll * 0.04;
    const h = 16 + 11 * Math.sin(wx * 0.021) + 7 * Math.sin(wx * 0.053 + 2) + 3 * Math.sin(wx * 0.11);
    R(g, mt, x, horizon - h, 2, h);
    if (h > 26) R(g, snow, x, horizon - h, 2, Math.min(4, h - 26));
  }
  // dunes
  const dune = css(tone('#d9a868', '#c98452', '#3a3466'));
  for (let x = 0; x < vw; x += 2) {
    const wx = x + scroll * 0.22;
    const h = 7 + 5 * Math.sin(wx * 0.03) + 3 * Math.sin(wx * 0.011 + 1);
    R(g, dune, x, horizon - h, 2, h + 1);
  }
  const ground = css(tone(PAL.sand, '#d99a5e', '#454072')), groundD = css(tone(PAL.sandD, '#b97c48', '#353060'));
  R(g, ground, 0, horizon, vw, vh - horizon);

  // things passing by: palms, a kasbah, olive trees
  const sil = css(tone('#7a8f4a', '#5a4a3a', '#1c1c44')), silD = css(tone('#b9703f', '#8a4a3a', '#22204a'));
  const off = scroll * 0.45, gap = 170;
  for (let i = Math.floor(off / gap) - 1; i < (off + vw) / gap + 1; i++) {
    const x = Math.round(i * gap - off + (hash(i, 1) % 90)), kind = hash(i, 2) % 4, y = horizon + 6 + (hash(i, 3) % 8);
    if (kind === 0) {
      R(g, silD, x, y - 16, 26, 16);
      for (let m = 0; m < 4; m++) R(g, silD, x + m * 7, y - 19, 4, 3);
      R(g, silD, x + 18, y - 26, 8, 10);
      R(g, css(tone('#5a3a22', '#3a2416', '#ffd98a')), x + 5, y - 10, 2, 4);
      R(g, css(tone('#5a3a22', '#3a2416', '#ffd98a')), x + 20, y - 21, 2, 3);
    } else if (kind === 3) {
      R(g, silD, x + 3, y - 6, 2, 6);
      R(g, sil, x - 2, y - 13, 12, 8);
      R(g, sil, x, y - 15, 8, 3);
    } else {
      R(g, silD, x + 4, y - 18, 2, 18);
      for (let f = 0; f < 5; f++) for (let s = 0; s < 6; s++) R(g, sil, x + 5 + Math.cos(f * 0.8 + 0.2) * s * 1.6 * (f % 2 ? 1 : -1), y - 19 + s * s * 0.25 - Math.sin(f * 0.8) * s * 0.6, 2, 2);
    }
  }
  for (let i = Math.floor(scroll / 23) - 1; i < (scroll + vw) / 23 + 1; i++) {
    const x = Math.round(i * 23 - scroll + (hash(i, 5) % 12)), y = horizon + 12 + (hash(i, 6) % Math.max(4, ty - horizon - 4));
    R(g, groundD, x, y, 3 + (hash(i, 7) % 4), 1);
  }

  // telegraph poles
  const pole = css(tone('#6a4a2e', '#4a3020', '#15142e'));
  const poff = scroll * 0.9;
  for (let i = Math.floor(poff / 150) - 1; i < (poff + vw) / 150 + 1; i++) {
    const x = Math.round(i * 150 - poff);
    R(g, pole, x, ty - 30, 2, 44);
    R(g, pole, x - 5, ty - 28, 12, 1);
    R(g, pole, x - 4, ty - 24, 10, 1);
  }

  // Benguerir station sliding in
  const total = 78 + 76 * 2 + 8;
  const x0 = Math.round(vw / 2 - total / 2);
  if (k > 0) {
    const e = 1 - Math.pow(1 - k, 2.2);
    const px = Math.round(vw + 30 + (x0 - 40 - (vw + 30)) * e);
    R(g, '#c4baa6', px, ty + 10, total + 90, 8);
    R(g, '#ded6c6', px, ty + 8, total + 90, 4);
    R(g, '#f2c230', px, ty + 11, total + 90, 1);
    const sgn = pixelText('BENGUERIR', PAL.cream);
    const sx = px + 60;
    R(g, PAL.woodD, sx + 4, ty - 38, 2, 48);
    R(g, PAL.woodD, sx + sgn.width, ty - 38, 2, 48);
    R(g, PAL.majD, sx - 2, ty - 44, sgn.width + 10, 15);
    R(g, PAL.maj, sx - 1, ty - 43, sgn.width + 8, 13);
    g.drawImage(sgn, sx + 3, ty - 42);
    for (const lx of [px + 20, px + total + 60]) {
      R(g, '#2b2b35', lx, ty - 26, 2, 36);
      R(g, '#2b2b35', lx - 3, ty - 32, 8, 6);
      R(g, n > 0.45 ? '#ffe9a3' : '#c9a25a', lx - 2, ty - 31, 6, 4);
    }
  }

  // track
  R(g, '#8a7b70', 0, ty + 18, vw, 7);
  for (let x = -(Math.floor(scroll) % 8); x < vw; x += 8) R(g, PAL.woodD, x, ty + 19, 3, 5);
  R(g, '#d6dae4', 0, ty + 17, vw, 1);
  R(g, '#8d909c', 0, ty + 18, vw, 1);

  // the train
  const bob = world.reduce || k >= 1 ? 0 : Math.round(Math.sin(t * 11) * 0.6 * (1 - k));
  const by = ty - 6 + bob, glow = n > 0.3;
  R(g, 'rgba(40,20,20,.25)', x0 - 2, ty + 19, total + 12, 3);
  car(g, x0, by, 76, glow, false);
  car(g, x0 + 80, by, 76, glow, false);
  car(g, x0 + 160, by, 78, glow, true);
  if (glow) {
    g.fillStyle = 'rgba(255,233,163,.18)';
    g.beginPath();
    g.moveTo(x0 + 248, by + 14);
    g.lineTo(x0 + 320, by + 6);
    g.lineTo(x0 + 320, by + 26);
    g.closePath();
    g.fill();
  }

  // foreground tufts, fast
  const foff = scroll * 1.5;
  for (let i = Math.floor(foff / 61) - 1; i < (foff + vw) / 61 + 1; i++) {
    const x = Math.round(i * 61 - foff + (hash(i, 8) % 30)), y = vh - 6 - (hash(i, 9) % Math.max(2, vh - ty - 34));
    R(g, css(tone('#a89a52', '#8a6a3a', '#2a2a55')), x, y - 4, 1, 4);
    R(g, css(tone('#bfae62', '#9a7a4a', '#34346a')), x + 2, y - 3, 1, 3);
    R(g, css(tone('#a89a52', '#8a6a3a', '#2a2a55')), x - 2, y - 2, 1, 2);
  }
}
