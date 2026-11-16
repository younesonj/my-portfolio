/* Heads-up display: where you are, and the #campus IRC ticker. */
import { achievements } from '../content';
import { sfx } from '../game/audio';
import { on } from '../state';

const $ = (id: string) => document.getElementById(id)!;

export function setWhere(text: string): void {
  $('hud-where').textContent = text;
}

let ircTimer: number | undefined;
/** Prints a line in the #campus channel (bottom-left), IRC style. */
export function irc(msg: string, cls = ''): void {
  const box = $('irc');
  const line = document.createElement('p');
  if (cls) line.className = cls;
  line.textContent = msg;
  box.appendChild(line);
  while (box.children.length > 4) box.firstElementChild!.remove();
  box.classList.add('show');
  window.clearTimeout(ircTimer);
  ircTimer = window.setTimeout(() => box.classList.remove('show'), 7000);
}

export function initHud(): void {
  on('ach', (id) => {
    const a = achievements[id];
    sfx('ach');
    irc(`*** achievement unlocked: ${a.name} — ${a.text}`, 'ach');
  });
}
