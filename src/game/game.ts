/* The game loop: clock, movement, camera, drawing, lighting, weather, and the restore drill. */
import { npc, sectionNames, sectionOrder, type SectionId } from '../content';
import { hooks, type TimeMode, type Weather } from '../bus';
import { flag, on, save, setFlag, unlock, visit } from '../state';
import { advance, closeDialog, dialogOpen, say } from '../ui/dialog';
import { irc, setWhere } from '../ui/hud';
import { modalOpen, openMenu, openSection, travel } from '../ui/panels';
import { sfx } from './audio';
import { initCats, killCat, listCats, scaleCats } from './cats';
import { PAL, R, TILE, clamp, hash, label, mk, pixelText, type Cv, type G } from './gfx';
import { axis, initInput, releaseAll } from './input';
import { BUILDINGS, SPAWN, buildMaps } from './maps';
import { CHARS, drawChar, makeChar, type CharSprites, type Dir } from './sprites';
import { drawTitle, updateTitle } from './title';
import { lit, world, type Ent, type Hot } from './world';

let cv: HTMLCanvasElement, g: G;
let vw = 320, vh = 180;
let lightCv: Cv, lg: G;
let mode: 'title' | 'arriving' | 'play' = 'title';
let titleK = 0;
let cam = { x: 0, y: 0 };
let fade = { a: 0, dir: 0, then: undefined as (() => void) | undefined };
let banner = { text: '', t: 9 };
let target: { label?: string; act: () => void; x: number; y: number } | null = null;
let sprPlayer: CharSprites;
let stepT = 0, walked = 0;
let targetHour: number | null = null;
let drill: { t: number } | null = null;
const parts: { x: number; y: number; s: number }[] = [];
export const callbacks = { section: (_id: SectionId | null) => {}, started: () => {} };

/* ------------------------------- the clock ------------------------------- */

function casaHour(): number {
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const n = (t: string) => Number(p.find((x) => x.type === t)?.value || 0);
    return (n('hour') % 24) + n('minute') / 60;
  } catch {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }
}
const FIXED: Record<Exclude<TimeMode, 'auto'>, number> = { dawn: 6.4, day: 12.5, dusk: 18.4, night: 22.5 };
// [hour, r, g, b, alpha] keyframes for the outdoor tint
const SKY = [[0, 16, 20, 70, 0.62], [5, 16, 20, 70, 0.62], [6.2, 200, 110, 120, 0.34], [7.5, 255, 190, 120, 0.1], [8.5, 255, 240, 200, 0], [16.5, 255, 240, 200, 0], [18, 255, 150, 60, 0.16], [19, 190, 80, 90, 0.32], [20.2, 40, 30, 100, 0.52], [21, 16, 20, 70, 0.62], [24, 16, 20, 70, 0.62]];
function sky(h: number): { c: string; a: number } {
  let i = 0;
  while (i < SKY.length - 2 && SKY[i + 1][0] <= h) i++;
  const A = SKY[i], B = SKY[i + 1], t = clamp((h - A[0]) / (B[0] - A[0]), 0, 1);
  const m = (k: number) => A[k] + (B[k] - A[k]) * t;
  return { c: `${m(1) | 0},${m(2) | 0},${m(3) | 0}`, a: m(4) };
}
const clockText = (): string => {
  const h = Math.floor(world.hour), m = Math.floor((world.hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
function tickClock(dt: number): void {
  const want = world.timeMode === 'auto' ? casaHour() : FIXED[world.timeMode];
  if (targetHour === null) world.hour = want;
  else {
    const diff = (want - world.hour + 24) % 24;
    if (diff < 0.05 || diff > 23.9 || world.reduce) world.hour = want;
    else world.hour = (world.hour + Math.min(diff, dt * 9)) % 24;
  }
  targetHour = want;
  world.night = clamp((sky(world.hour).a - 0.08) / 0.5, 0, 1);
}

/* ------------------------------ map changes ------------------------------ */

function enter(id: string, x: number, y: number, dir: Dir = 'down'): void {
  const m = world.maps[id];
  const from = world.map;
  world.map = m;
  Object.assign(world.player, { x, y, dir, moving: false });
  snapCam();
  banner = { text: m.name.toUpperCase(), t: 0 };
  target = null;
  document.getElementById('btn-read')!.hidden = !m.section;
  if (m.section) {
    const first = !save.visited.includes(m.section);
    visit(m.section);
    if (first) irc(`* ticket punched: ${sectionNames[m.section].place} (${save.visited.length}/${sectionOrder.length})`);
    callbacks.section(m.section);
  } else if (from?.section && id === 'campus') callbacks.section(null);
  initParticles();
}

function goto(id: string, x: number, y: number, dir: Dir = 'down'): void {
  if (fade.dir) return;
  sfx('door');
  releaseAll();
  if (world.reduce) return enter(id, x, y, dir);
  fade = { a: 0, dir: 1, then: () => enter(id, x, y, dir) };
}

/* -------------------------------- movement -------------------------------- */

function solidAt(px: number, py: number): boolean {
  const m = world.map, tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return true;
  return m.solid[ty * m.w + tx] === 1;
}
function blocked(x: number, y: number): boolean {
  if (solidAt(x - 4, y - 5) || solidAt(x + 4, y - 5) || solidAt(x - 4, y - 0.01) || solidAt(x + 4, y - 0.01)) return true;
  const p = world.player;
  for (const e of world.map.ents) {
    if (!e.solid || e.dead) continue;
    const d = Math.hypot(x - e.x, (y - e.y) * 1.4), was = Math.hypot(p.x - e.x, (p.y - e.y) * 1.4);
    if (d < e.solid + 4 && d < was) return true;
  }
  return false;
}

function findTarget(): typeof target {
  const p = world.player, m = world.map;
  const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir];
  const rx = p.x + v[0] * 11, ry = p.y - 4 + v[1] * 11;
  let best: typeof target = null, score = 1e9;
  const inside = (h: Hot, x: number, y: number) => x >= h.x - 2 && x <= h.x + h.w + 2 && y >= h.y - 2 && y <= h.y + h.h + 2;
  for (const h of m.hots) {
    if (!h.act) continue;
    if (inside(h, rx, ry) || inside(h, p.x, p.y - 4)) {
      const s = Math.hypot(h.x + h.w / 2 - rx, h.y + h.h / 2 - ry);
      if (s < score) { score = s; best = { label: h.label, act: h.act, x: h.x + h.w / 2, y: Math.max(h.y, 30) }; }
    }
  }
  for (const e of m.ents) {
    if (!e.act || e.dead) continue;
    const d = Math.hypot(e.x - rx, e.y - 4 - ry);
    if (d < (e.reach || 20) && d - 14 < score) { score = d - 14; best = { label: e.label, act: e.act, x: e.x, y: e.y - 22 }; }
  }
  return best;
}

const busy = (): boolean => dialogOpen() || modalOpen() || fade.dir !== 0 || !!drill || mode !== 'play';

function update(dt: number): void {
  world.t += dt;
  tickClock(dt);
  if (mode !== 'play') {
    if (mode === 'arriving') {
      titleK = Math.min(1, titleK + dt / 2.8);
      if (titleK >= 1 && !fade.dir) fade = { a: 0, dir: 1, then: () => { beginPlay(); afterArrival(); } };
    }
    updateTitle(dt, titleK);
  }
  if (fade.dir) {
    fade.a += fade.dir * dt * 5;
    if (fade.dir > 0 && fade.a >= 1) {
      fade.a = 1;
      fade.dir = -1;
      const f = fade.then;
      fade.then = undefined;
      f?.();
    } else if (fade.dir < 0 && fade.a <= 0) fade = { a: 0, dir: 0, then: undefined };
  }
  if (mode !== 'play') return;
  if (drill) return updateDrill(dt);
  banner.t += dt;
  const p = world.player, m = world.map;
  if (!busy()) {
    let vx = axis.x, vy = axis.y;
    if (vx && vy) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; }
    p.moving = !!(vx || vy);
    if (p.moving) {
      p.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : vy < 0 ? 'up' : 'down';
      const sp = flag('fez') ? 128 : 84;
      const nx = p.x + vx * sp * dt;
      if (!blocked(nx, p.y)) p.x = nx;
      const ny = p.y + vy * sp * dt;
      if (!blocked(p.x, ny)) p.y = ny;
      p.anim += dt;
      walked += dt;
      stepT -= dt;
      if (stepT <= 0) { stepT = 0.27; sfx('step'); }
      if (walked > 2.5) document.getElementById('hint')!.hidden = true;
      for (const h of m.hots) if (h.auto && (!h.dir || h.dir === p.dir) && p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h) { h.auto(); break; }
    }
    target = findTarget();
  } else {
    p.moving = false;
    if (modalOpen()) target = null;
  }
  if (!modalOpen()) {
    for (const e of m.ents) e.update?.(dt);
    if (m.ents.some((e) => e.dead)) m.ents = m.ents.filter((e) => !e.dead);
    if (m.id !== 'campus') for (const e of world.maps.campus.ents) e.update?.(dt);
  }
  if (m.outdoor && world.night > 0.7) unlock('night');
  const tx = clamp(p.x - vw / 2, 0, Math.max(0, m.w * TILE - vw)), ty = clamp(p.y - 12 - vh / 2, 0, Math.max(0, m.h * TILE - vh));
  const k = world.reduce ? 1 : 1 - Math.exp(-dt * 9);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  world.shake = Math.max(0, world.shake - dt * 6);
  updateParticles(dt);
  hudTick -= dt;
  if (hudTick <= 0) {
    hudTick = 1;
    setWhere(`${m.name} · ${clockText()}${world.timeMode === 'auto' ? '' : ' (sundial)'}`);
  }
}
let hudTick = 0;
let paused = false;
export const setPaused = (v: boolean): void => { paused = v; if (v) releaseAll(); };
export function readHere(): void { if (mode === 'play' && world.map.section && !busy()) openSection(world.map.section); }
export function menu(): void { if (mode === 'play' && !busy()) openMenu(); }

function snapCam(): void {
  const p = world.player, m = world.map;
  cam = { x: clamp(p.x - vw / 2, 0, Math.max(0, m.w * TILE - vw)), y: clamp(p.y - 12 - vh / 2, 0, Math.max(0, m.h * TILE - vh)) };
}

/* -------------------------------- weather -------------------------------- */

function initParticles(): void {
  parts.length = 0;
  if (world.reduce || !world.map?.outdoor) return;
  const n = world.weather === 'rain' ? 80 : world.weather === 'wind' ? 46 : 10;
  for (let i = 0; i < n; i++) parts.push({ x: Math.random() * vw, y: Math.random() * vh, s: 0.6 + Math.random() * 0.8 });
}
function updateParticles(dt: number): void {
  const w = world.weather;
  for (const q of parts) {
    if (w === 'rain') { q.x -= 60 * dt * q.s; q.y += 260 * dt * q.s; }
    else if (w === 'wind') { q.x += 190 * dt * q.s; q.y += Math.sin(world.t * 3 + q.s * 9) * 14 * dt; }
    else { q.x += Math.sin(world.t * 0.7 + q.s * 20) * 6 * dt; q.y += Math.cos(world.t * 0.5 + q.s * 30) * 5 * dt; }
    if (q.x < -4) q.x += vw + 8; else if (q.x > vw + 4) q.x -= vw + 8;
    if (q.y > vh + 4) q.y -= vh + 8; else if (q.y < -4) q.y += vh + 8;
  }
}
function drawParticles(): void {
  const w = world.weather;
  if (w === 'rain') R(g, 'rgba(40,60,110,.14)', 0, 0, vw, vh);
  for (const q of parts) {
    if (w === 'rain') { R(g, 'rgba(200,225,255,.75)', q.x, q.y, 1, 4); R(g, 'rgba(200,225,255,.5)', q.x + 1, q.y - 3, 1, 3); }
    else if (w === 'wind') R(g, 'rgba(250,225,170,.7)', q.x, q.y, 5 * q.s + 2, 1);
    else if (lit()) { if (Math.floor(world.t * 2 + q.s * 10) % 3) R(g, '#fff3a0', q.x, q.y, 1, 1); }
    else R(g, 'rgba(255,250,225,.5)', q.x, q.y, 1, 1);
  }
}

/* ---------------------------- the restore drill --------------------------- */

function startDrill(): void {
  if (drill) return;
  closeDialog();
  releaseAll();
  drill = { t: 0 };
  sfx('glitch');
  irc('* visitor ran rm -rf /campus');
}
function updateDrill(dt: number): void {
  if (!drill) return;
  const before = drill.t;
  drill.t += dt;
  const end = world.reduce ? 4 : 7.2;
  if (drill.t < 2.4 && !world.reduce) world.shake = 1;
  if (before < 1.2 && drill.t >= 1.2) sfx('glitch');
  if (before < 3.8 && drill.t >= 3.8) sfx('restore');
  if (drill.t >= end) {
    drill = null;
    world.shake = 0;
    setFlag('restored');
    unlock('restore');
    irc('* restore.sh: done. 0 tiles lost.');
    say('RESTORE.SH', npc.drill.done);
  }
}
function drawDrill(): void {
  if (!drill) return;
  const t = drill.t, c = 16;
  // how much of the screen is gone: grows to 1, holds, then shrinks as the backup comes back
  const gone = world.reduce ? (t < 0.6 ? t / 0.6 : t > 3.4 ? Math.max(0, 1 - (t - 3.4) / 0.6) : 1) : t < 2.4 ? t / 2.4 : t < 3.8 ? 1 : Math.max(0, 1 - (t - 3.8) / 2.9);
  const restoring = t >= 3.8;
  if (world.reduce) R(g, `rgba(8,8,16,${gone})`, 0, 0, vw, vh);
  else
    for (let y = 0; y < vh; y += c)
      for (let x = 0; x < vw; x += c) {
        const order = restoring ? (y / vh) * 0.85 + (hash(x, y) % 100) / 700 : (hash(x / c, y / c) % 1000) / 1000;
        if (restoring ? order > 1 - gone : order < gone) R(g, '#08080f', x, y, c, c);
        else if (!restoring && order < gone + 0.08) R(g, hash(x, Math.floor(t * 20)) % 2 ? '#ff3d6e' : '#3dffd2', x, y + (hash(y, x) % c), c, 2);
      }
  const D = npc.drill, top = Math.round(vh * 0.36);
  const lines = t < 2.4 ? D.deleting.slice(0, 1 + Math.floor((t / 2.4) * D.deleting.length)) : restoring ? [...D.gone, D.restoring] : D.gone.slice(0, 1 + Math.floor(((t - 2.4) / 1.4) * D.gone.length));
  lines.forEach((l, i) => {
    if (!l) return;
    const tc = pixelText(l.toUpperCase(), '#59d98a');
    R(g, 'rgba(8,8,15,.85)', 6, top - 1 + i * 12, tc.width + 4, 12);
    g.drawImage(tc, 8, top + i * 12);
  });
  if (restoring) {
    const pr = clamp((t - 3.8) / 2.9, 0, 1), bw = Math.min(160, vw - 24), by = top + lines.length * 12 + 2;
    R(g, '#59d98a', 8, by, bw, 7);
    R(g, '#08080f', 9, by + 1, bw - 2, 5);
    R(g, '#59d98a', 10, by + 2, (bw - 4) * pr, 3);
  }
}

/* --------------------------------- drawing -------------------------------- */

function drawLight(m: typeof world.map): void {
  const s = m.outdoor ? sky(world.hour) : { c: '10,12,40', a: m.dark || 0 };
  if (s.a < 0.01) return;
  lg.globalCompositeOperation = 'source-over';
  lg.globalAlpha = 1;
  lg.clearRect(0, 0, vw, vh);
  lg.fillStyle = `rgba(${s.c},${s.a})`;
  lg.fillRect(0, 0, vw, vh);
  if (!m.outdoor || lit()) {
    lg.globalCompositeOperation = 'destination-out';
    lg.fillStyle = '#000';
    const hole = (x: number, y: number, r: number) => {
      const sx = Math.round(x - cam.x), sy = Math.round(y - cam.y);
      if (sx < -r || sy < -r || sx > vw + r || sy > vh + r) return;
      for (const [k, a] of [[1, 0.2], [0.7, 0.26], [0.42, 0.32]]) {
        lg.globalAlpha = a;
        lg.beginPath();
        lg.arc(sx, sy, r * k, 0, Math.PI * 2);
        lg.fill();
      }
    };
    m.lights.forEach((l) => hole(l.x, l.y, l.r));
    m.wins.forEach((w) => hole(w.x + w.w / 2, w.y + w.h / 2, 13 + w.w * 0.3));
    hole(world.player.x, world.player.y - 8, m.outdoor ? 22 : 34);
    lg.globalAlpha = 1;
  }
  g.drawImage(lightCv, 0, 0);
  if (m.outdoor && lit()) {
    g.fillStyle = 'rgba(255,196,96,.10)';
    for (const l of m.lights) {
      const sx = Math.round(l.x - cam.x), sy = Math.round(l.y - cam.y);
      if (sx < -l.r || sy < -l.r || sx > vw + l.r || sy > vh + l.r) continue;
      for (const k of [0.75, 0.45]) {
        g.beginPath();
        g.arc(sx, sy, l.r * k, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
}

function draw(): void {
  if (mode !== 'play') {
    drawTitle(g, vw, vh, world.t, titleK);
  } else {
    const m = world.map, p = world.player, t = world.t;
    R(g, m.bg, 0, 0, vw, vh);
    const mw = m.w * TILE, mh = m.h * TILE;
    const sx = world.shake && !world.reduce ? Math.round((Math.random() - 0.5) * 6 * world.shake) : 0;
    const ox = (mw < vw ? Math.round((vw - mw) / 2) : -Math.round(cam.x)) + sx, oy = (mh < vh ? Math.round((vh - mh) / 2) : -Math.round(cam.y)) + sx;
    if (mw < vw) cam.x = -Math.round((vw - mw) / 2);
    if (mh < vh) cam.y = -Math.round((vh - mh) / 2);
    g.save();
    g.translate(ox, oy);
    g.drawImage(m.base, 0, 0);
    if (m.outdoor && lit()) for (const w of m.wins) R(g, w.color, w.x, w.y, w.w, w.h);
    m.under?.(g, t);
    const list: { y: number; draw: (g: G, t: number) => void }[] = [...m.props, ...m.ents.map((e: Ent) => ({ y: e.y, draw: e.draw }))];
    const step = p.moving && !world.reduce ? [1, 0, 2, 0][Math.floor(p.anim * 9) % 4] : 0;
    list.push({ y: p.y, draw: () => drawChar(g, sprPlayer, p.dir, step, p.x, p.y) });
    list.sort((a, b) => a.y - b.y);
    for (const s of list) s.draw(g, t);
    m.over?.(g, t);
    g.restore();
    if (m.outdoor) drawParticles();
    drawLight(m);
    if (target && !busy()) {
      const tx = Math.round(target.x + ox), ty = Math.round(target.y + oy);
      const bx = Math.round(p.x + ox), by = Math.round(p.y + oy) - 32 + (world.reduce ? 0 : Math.round(Math.sin(t * 5)));
      if (target.label) {
        let ly = ty - 13;
        if (Math.abs(tx - bx) < 46 && ly > by - 22 && ly < by + 10) ly = by - 22;
        label(g, target.label, clamp(tx, 30, vw - 30), Math.max(2, ly));
      }
      R(g, PAL.ink, bx - 6, by - 6, 12, 12);
      R(g, PAL.ink, bx - 2, by + 6, 4, 2);
      R(g, PAL.gold, bx - 5, by - 5, 10, 10);
      const k = pixelText(world.touch ? 'A' : 'E', PAL.ink);
      g.drawImage(k, bx - Math.floor(k.width / 2), by - 6);
    }
    drawDrill();
    if (banner.t < 2.4 && !drill) {
      const a = banner.t < 0.3 ? banner.t / 0.3 : banner.t > 1.9 ? (2.4 - banner.t) / 0.5 : 1;
      const tcv = pixelText(banner.text, PAL.cream);
      g.globalAlpha = clamp(a, 0, 1);
      const w = tcv.width * 2, x = Math.round((vw - w) / 2), y = Math.round(vh * 0.2);
      R(g, PAL.ink, x - 8, y - 3, w + 16, 24);
      R(g, PAL.maj, x - 6, y - 1, w + 12, 20);
      g.drawImage(tcv, x, y, w, tcv.height * 2);
      g.globalAlpha = 1;
    }
  }
  if (fade.a > 0) R(g, `rgba(10,8,20,${clamp(fade.a, 0, 1)})`, 0, 0, vw, vh);
}

/* ---------------------------------- setup --------------------------------- */

function resize(): void {
  const w = innerWidth, h = innerHeight;
  const scale = clamp(Math.floor(Math.min(w / (w > h ? 300 : 170), h / 170)), 1, 8);
  vw = Math.ceil(w / scale);
  vh = Math.ceil(h / scale);
  cv.width = vw;
  cv.height = vh;
  cv.style.width = vw * scale + 'px';
  cv.style.height = vh * scale + 'px';
  g.imageSmoothingEnabled = false;
  [lightCv, lg] = mk(vw, vh);
  if (world.map) { snapCam(); initParticles(); }
}

function beginPlay(): void {
  mode = 'play';
  document.documentElement.classList.add('playing');
  callbacks.started();
}

function action(): void {
  if (mode !== 'play' || modalOpen() || drill) return;
  if (dialogOpen()) return advance();
  if (target && !fade.dir) target.act();
}

/** Boots the engine and shows the title scene. */
export async function initGame(): Promise<void> {
  cv = document.getElementById('game') as HTMLCanvasElement;
  g = cv.getContext('2d')!;
  world.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  world.touch = matchMedia('(pointer: coarse)').matches;
  try {
    await Promise.race([Promise.all([document.fonts.load('8px Silkscreen'), document.fonts.load('16px VT323')]), new Promise((r) => setTimeout(r, 1200))]);
  } catch { /* fall back to monospace */ }
  const r = Math.random();
  world.weather = r < 0.74 ? 'clear' : r < 0.92 ? 'wind' : 'rain';
  buildMaps();
  initCats();
  sprPlayer = makeChar(flag('fez') ? CHARS.visitorFez : CHARS.visitor);
  world.goto = goto;
  world.map = world.maps.campus;
  Object.assign(world.player, { x: SPAWN.x, y: SPAWN.y, dir: 'up' });
  tickClock(0);
  resize();
  addEventListener('resize', resize);

  Object.assign(hooks, {
    setTime(mode2: TimeMode) { world.timeMode = mode2; },
    setWeather(w: Weather) { world.weather = w; initParticles(); },
    clock: clockText,
    cats: listCats,
    scaleCats(n: number) { const got = scaleCats(n); irc(`* deployment/cat scaled to ${got}`); return got; },
    killCat,
    restoreDrill: startDrill,
    irc,
    sfx,
  });
  travel.go = (id) => {
    const b = BUILDINGS.find((x) => x.id === id)!;
    if (mode !== 'play') startAt(id);
    else if (world.map.id === b.to) openSection(id);
    else goto(b.to, 6.5 * TILE, 8 * TILE + 10, 'up');
  };
  on('visit', () => {
    if (save.visited.length === sectionOrder.length) irc('<Segfault> full ticket. not bad, human.');
  });
  initInput({
    action,
    back: () => { if (dialogOpen()) closeDialog(true); },
    readAll: readHere,
    menu,
    konami: () => {
      if (mode !== 'play') return;
      const now = !flag('fez');
      setFlag('fez', now);
      sprPlayer = makeChar(now ? CHARS.visitorFez : CHARS.visitor);
      unlock('konami');
      sfx('item');
      irc(now ? '* visitor is now wearing a fez and walking suspiciously fast' : '* visitor took the fez off');
    },
    blocked: () => paused || modalOpen(),
  });
  cv.addEventListener('pointerdown', () => { if (dialogOpen()) advance(); });

  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__campus = { world, hooks, enter, step: (dt: number) => { update(dt); draw(); } };

  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!paused) {
      update(dt);
      draw();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** Title → the train pulls in → campus. */
export function arrive(): void {
  if (mode !== 'title') return;
  sfx('whistle');
  if (world.reduce) {
    titleK = 1;
    beginPlay();
    afterArrival();
    return;
  }
  mode = 'arriving';
}
function afterArrival(): void {
  enter('campus', SPAWN.x, SPAWN.y, 'up');
  unlock('arrived');
  irc('* visitor has joined #campus');
  document.getElementById('hint')!.hidden = false;
  setTimeout(() => {
    if (world.map.id === 'campus' && !dialogOpen() && !modalOpen()) world.maps.campus.ents.find((e) => e.label === npc.stationMaster.name)?.act?.();
  }, 700);
}

/** Deep link: skip the train and start inside a building with its panel open. */
export function startAt(id: SectionId): void {
  const b = BUILDINGS.find((x) => x.id === id)!;
  titleK = 1;
  beginPlay();
  enter(b.to, 6.5 * TILE, 8 * TILE + 10, 'up');
  openSection(id);
}

export const inGame = (): boolean => mode === 'play';
