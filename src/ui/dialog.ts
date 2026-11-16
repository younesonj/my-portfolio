/* The speech box. Lives in the DOM (not the canvas) so screen readers get every line. */
import { sfx } from '../game/audio';
import { world } from '../game/world';
import { esc } from '../render-html';

export interface Card {
  kicker?: string;
  title: string;
  text: string;
  tags?: string[];
  link?: { label: string; href: string };
}
export type Page = string | Card;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let queue: Page[] = [];
let done: (() => void) | undefined;
let typer: number | undefined;
let full = '';
let open = false;
let choosing = false;

export const dialogOpen = (): boolean => open;

export function say(who: string, pages: Page[], onDone?: () => void): void {
  queue = [...pages];
  done = onDone;
  open = true;
  choosing = false;
  $('d-who').textContent = who;
  $('dialog').hidden = false;
  next();
}

function finishTyping(): void {
  window.clearInterval(typer);
  typer = undefined;
  $('d-text').textContent = full;
  $('d-extra').hidden = false;
}

function next(): void {
  window.clearInterval(typer);
  typer = undefined;
  const page = queue.shift();
  if (page === undefined) return closeDialog(true);
  const card: Card = typeof page === 'string' ? { title: '', text: page } : page;
  $('d-kicker').textContent = card.kicker || '';
  $('d-kicker').hidden = !card.kicker;
  $('d-title').textContent = card.title;
  $('d-title').hidden = !card.title;
  $('d-choices').hidden = true;
  const extra = $('d-extra');
  extra.innerHTML =
    (card.tags?.length ? `<ul class="tags">${card.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '') +
    (card.link ? `<a class="d-link" href="${esc(card.link.href)}" target="_blank" rel="noopener">${esc(card.link.label)} ↗</a>` : '');
  $('d-more').textContent = queue.length ? '▼' : '■';
  full = card.text;
  const text = $('d-text');
  text.hidden = !full;
  if (world.reduce || !full) {
    text.textContent = full;
    extra.hidden = false;
    return;
  }
  extra.hidden = true;
  text.textContent = '';
  let i = 0;
  typer = window.setInterval(() => {
    i += 2;
    text.textContent = full.slice(0, i);
    if (i % 6 === 0) sfx('blip');
    if (i >= full.length) finishTyping();
  }, 22);
}

/** The action key: finish the line, or go to the next one. */
export function advance(): void {
  if (!open || choosing) return;
  if (typer !== undefined) return finishTyping();
  sfx('next');
  next();
}

export function closeDialog(runDone = false): void {
  window.clearInterval(typer);
  typer = undefined;
  open = false;
  choosing = false;
  queue = [];
  $('dialog').hidden = true;
  const d = done;
  done = undefined;
  if (runDone && d) d();
}

/** A yes/no question. Focus starts on "no". */
export function ask(who: string, question: string, yes: () => void, yesLabel = 'Press it', noLabel = 'Walk away'): void {
  say(who, [question]);
  finishTyping();
  choosing = true;
  $('d-more').textContent = '';
  const box = $('d-choices');
  box.hidden = false;
  box.innerHTML = '';
  const mk = (label: string, fn?: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.textContent = label;
    b.addEventListener('click', () => {
      closeDialog();
      fn?.();
    });
    box.appendChild(b);
    return b;
  };
  mk(yesLabel, yes);
  mk(noLabel).focus();
}

export function initDialog(): void {
  $('dialog').addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a,button')) return;
    advance();
  });
}
