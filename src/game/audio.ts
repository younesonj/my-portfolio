/* All sound is synthesised with WebAudio. Nothing plays until the visitor turns sound on. */
import { music } from '../content';

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
let musicWanted = true;
let track = 0;
let timer: number | undefined;
let step = 0;
let nextAt = 0;
let el: HTMLAudioElement | null = null;

export const soundOn = (): boolean => enabled;
export const musicPlaying = (): boolean => enabled && musicWanted;
export const currentTrack = (): number => track;

function ctx(): AudioContext | null {
  if (!ac) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = 0.5;
    master.connect(ac.destination);
  }
  return ac;
}

export function setSound(on: boolean): void {
  enabled = on;
  const a = ctx();
  if (!a) return;
  if (on) void a.resume();
  syncMusic();
}

export function setMusic(on: boolean, t = track): void {
  musicWanted = on;
  track = t;
  syncMusic();
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.12, to?: number, at?: number): void {
  if (!enabled || !ac || !master) return;
  const t0 = at ?? ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

let noiseBuf: AudioBuffer | null = null;
function noise(dur: number, vol: number, freq: number, q = 1, at?: number, type: BiquadFilterType = 'bandpass'): void {
  if (!enabled || !ac || !master) return;
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = at ?? ac.currentTime;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf;
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t0, Math.random() * 0.5);
  s.stop(t0 + dur + 0.02);
}

let stepFlip = false;
export function sfx(name: string): void {
  if (!enabled || !ac) return;
  const t = ac.currentTime;
  switch (name) {
    case 'step': stepFlip = !stepFlip; noise(0.05, 0.05, stepFlip ? 900 : 700, 1.5); break;
    case 'blip': tone(620, 0.03, 'square', 0.03); break;
    case 'next': tone(520, 0.05, 'square', 0.06); tone(780, 0.07, 'square', 0.06, undefined, t + 0.05); break;
    case 'ok': [523, 659, 784].forEach((f, i) => tone(f, 0.09, 'square', 0.08, undefined, t + i * 0.07)); break;
    case 'bad': tone(160, 0.18, 'sawtooth', 0.1, 90); tone(120, 0.2, 'sawtooth', 0.1, 70, t + 0.16); break;
    case 'item': [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.08, 'square', 0.08, undefined, t + i * 0.06)); break;
    case 'ach': [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.14, undefined, t + i * 0.08)); break;
    case 'door': noise(0.12, 0.08, 300, 0.8); tone(200, 0.1, 'triangle', 0.08, 120); break;
    case 'tick': tone(1200, 0.03, 'square', 0.05); tone(900, 0.03, 'square', 0.05, undefined, t + 0.08); break;
    case 'pour': for (let i = 0; i < 8; i++) tone(700 + i * 90 + Math.random() * 60, 0.05, 'sine', 0.05, undefined, t + i * 0.05); break;
    case 'purr': for (let i = 0; i < 10; i++) noise(0.04, 0.06, 140, 4, t + i * 0.05); break;
    case 'meow': tone(700, 0.25, 'triangle', 0.1, 420); break;
    case 'whistle': tone(880, 0.5, 'square', 0.05, 860); tone(1100, 0.5, 'square', 0.04, 1080); break;
    case 'chug': noise(0.08, 0.07, 220, 1); break;
    case 'glitch': for (let i = 0; i < 10; i++) tone(80 + Math.random() * 900, 0.05, 'square', 0.06, undefined, t + i * 0.05); break;
    case 'restore': [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, undefined, t + i * 0.11)); break;
    case 'splash': noise(0.5, 0.1, 1800, 0.6); tone(300, 0.3, 'sine', 0.06, 900); break;
    case 'key': tone(1400, 0.02, 'square', 0.025); break;
  }
}

/* --- "Benguerir Sunset": an original loop in D Hijaz over a maqsum rhythm --- */
const SCALE = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33];
const LEAD = [
  0, -1, 1, 2, -1, 1, 0, -1, 2, 3, 4, -1, 3, 2, 1, -1, 4, -1, 5, 4, 3, -1, 2, 1, 0, -1, -1, 2, 1, -1, 0, -1,
  7, -1, 6, 5, 4, -1, 5, 4, 3, 2, 3, 4, -1, 2, 1, -1, 2, -1, 1, 0, 1, 2, -1, 1, 0, -1, -1, -1, 0, -1, -1, -1,
];
const BASS = [73.42, 73.42, 98.0, 73.42, 73.42, 98.0, 116.54, 73.42];
const DRUM = ['D', 'T', '', 'T', 'D', '', 'T', ''];
const EIGHTH = 60 / 104 / 2;

function schedule(): void {
  if (!ac || !enabled) return;
  while (nextAt < ac.currentTime + 0.25) {
    const s = step % LEAD.length, n = LEAD[s], d = DRUM[s % 8];
    if (n >= 0) {
      tone(SCALE[n], EIGHTH * 1.6, 'square', 0.035, undefined, nextAt);
      tone(SCALE[n] * 2, EIGHTH * 0.9, 'triangle', 0.02, undefined, nextAt);
    }
    if (s % 4 === 0) tone(BASS[Math.floor(s / 8) % BASS.length], EIGHTH * 3.2, 'triangle', 0.11, undefined, nextAt);
    if (d === 'D') tone(120, 0.16, 'sine', 0.2, 50, nextAt);
    if (d === 'T') noise(0.05, 0.06, 2600, 2, nextAt);
    step++;
    nextAt += EIGHTH;
  }
}

function syncMusic(): void {
  const want = enabled && musicWanted;
  const src = music.tracks[track]?.src || '';
  window.clearInterval(timer);
  timer = undefined;
  if (el) {
    el.pause();
    el = null;
  }
  if (!want) return;
  if (src) {
    el = new Audio(src);
    el.loop = true;
    el.volume = 0.5;
    void el.play().catch(() => {});
  } else if (ac) {
    step = 0;
    nextAt = ac.currentTime + 0.1;
    timer = window.setInterval(schedule, 80);
  }
}
