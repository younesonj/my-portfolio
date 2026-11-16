/* Canvas helpers. All art in this project is drawn by code into offscreen canvases. */
export const TILE = 16;
export type Cv = HTMLCanvasElement;
export type G = CanvasRenderingContext2D;

export function mk(w: number, h: number): [Cv, G] {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return [c, g];
}

/** Filled rect at integer pixels. */
export function R(g: G, color: string, x: number, y: number, w: number, h: number): void {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function hash(x: number, y: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export const PAL = {
  ink: '#1b1530',
  cream: '#fbf0d6',
  white: '#fff8ea',
  sand: '#e3bd7f',
  sandD: '#d2a665',
  sandL: '#eccd96',
  stone: '#f0dfbc',
  stoneD: '#d6bd92',
  terra: '#c4683f',
  terraD: '#9c4b2c',
  terraL: '#d98558',
  maj: '#3d4fd8',
  majD: '#27349b',
  majL: '#6f80f0',
  green: '#2f8a5a',
  greenD: '#1f6440',
  leaf: '#3f9447',
  leafD: '#2c6e36',
  leafL: '#63b35a',
  ochre: '#e0a03a',
  gold: '#f6d36b',
  pink: '#e2578f',
  red: '#c8372f',
  wood: '#8d5a33',
  woodD: '#5f3b20',
  woodL: '#b07a47',
  night: '#141a4a',
};

/** Pixel map → canvas. Each char is looked up in `pal`; '.' and ' ' are transparent. */
export function sprite(rows: string[], pal: Record<string, string>): Cv {
  const w = Math.max(...rows.map((r) => r.length));
  const [c, g] = mk(w, rows.length);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x]];
      if (col) R(g, col, x, y, 1, 1);
    }
  });
  return c;
}

/** Adds a 1px outline around the opaque pixels (grows the canvas by 1px on each side). */
export function outline(src: Cv, color = PAL.ink): Cv {
  const w = src.width, h = src.height;
  const d = src.getContext('2d')!.getImageData(0, 0, w, h).data;
  const [c, g] = mk(w + 2, h + 2);
  const op = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  g.fillStyle = color;
  for (let y = -1; y <= h; y++)
    for (let x = -1; x <= w; x++) {
      if (op(x, y)) continue;
      if (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1)) g.fillRect(x + 1, y + 1, 1, 1);
    }
  g.drawImage(src, 1, 1);
  return c;
}

export function flipH(src: Cv): Cv {
  const [c, g] = mk(src.width, src.height);
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}

const textCache = new Map<string, Cv>();
/** Crisp bitmap text: renders the pixel font, then thresholds away the anti-aliasing. */
export function pixelText(text: string, color: string, size = 8): Cv {
  const key = `${size}|${color}|${text}`;
  const hit = textCache.get(key);
  if (hit) return hit;
  const font = `${size}px Silkscreen, monospace`;
  const [m, mg] = mk(1, 1);
  void m;
  mg.font = font;
  const w = Math.ceil(mg.measureText(text).width) + 2;
  const [c, g] = mk(w, size + 3);
  g.font = font;
  g.textBaseline = 'top';
  g.fillStyle = '#fff';
  g.fillText(text, 1, 1);
  const img = g.getImageData(0, 0, c.width, c.height);
  const cv = document.createElement('canvas').getContext('2d')!;
  cv.fillStyle = color;
  cv.fillRect(0, 0, 1, 1);
  const [r, gg, b] = cv.getImageData(0, 0, 1, 1).data;
  for (let i = 0; i < img.data.length; i += 4) {
    const on = img.data[i + 3] > 110;
    img.data[i] = r;
    img.data[i + 1] = gg;
    img.data[i + 2] = b;
    img.data[i + 3] = on ? 255 : 0;
  }
  g.putImageData(img, 0, 0);
  textCache.set(key, c);
  return c;
}

/** Text with a dark plate behind it, centred on x. Returns nothing; draws directly. */
export function label(g: G, text: string, cx: number, y: number, fg = PAL.cream, bg = PAL.ink): void {
  const t = pixelText(text, fg);
  const x = Math.round(cx - t.width / 2);
  R(g, bg, x - 2, y - 1, t.width + 4, t.height + 1);
  g.drawImage(t, x, Math.round(y));
}

/** A rectangle with a rounded (arched) top: Moorish doors and windows. */
export function arch(g: G, color: string, cx: number, bottom: number, w: number, h: number): void {
  const r = w / 2;
  g.fillStyle = color;
  for (let i = 0; i < h; i++) {
    const fromTop = i;
    let half = r;
    if (fromTop < r) half = Math.max(1, Math.round(Math.sqrt(r * r - (r - fromTop - 0.5) * (r - fromTop - 0.5))));
    g.fillRect(Math.round(cx - half), Math.round(bottom - h + i), Math.round(half * 2), 1);
  }
}

export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
