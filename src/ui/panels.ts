/* Modal panels: "read this place", the ticket menu, the departures board. Built on <dialog>,
   so focus trapping and Esc come from the browser. */
import { achievements, contact, credits, meta, music, npc, sectionNames, sectionOrder, ui, type SectionId } from '../content';
import { currentTrack, musicPlaying, setMusic, setSound, soundOn } from '../game/audio';
import { world } from '../game/world';
import { esc, sectionHtml } from '../render-html';
import { resetSave, save } from '../state';

const dlg = () => document.getElementById('modal') as HTMLDialogElement;
let onClose: (() => void) | undefined;
/** Set by the game: fast-travel into a building. */
export const travel = { go: (_id: SectionId) => {} };
export const soundUi = { sync: () => {} };

export const modalOpen = (): boolean => dlg().open;

export function openModal(o: { kicker: string; html: string; cls?: string; onClose?: () => void }): HTMLElement {
  const d = dlg();
  if (d.open) d.close();
  onClose = o.onClose;
  d.className = 'modal ' + (o.cls || '');
  (d.querySelector('#m-kicker') as HTMLElement).textContent = o.kicker;
  const body = d.querySelector('#m-body') as HTMLElement;
  body.innerHTML = o.html;
  d.showModal();
  body.scrollTop = 0;
  return body;
}
export function closeModal(): void {
  if (dlg().open) dlg().close();
}

export function initPanels(): void {
  const d = dlg();
  d.addEventListener('close', () => {
    const f = onClose;
    onClose = undefined;
    f?.();
  });
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  });
  d.querySelector('#m-close')!.addEventListener('click', () => d.close());
}

export function openSection(id: SectionId, opts: { onClose?: () => void } = {}): void {
  const hint = world.touch ? 'Close this to keep exploring.' : 'Esc closes this. Then walk up to things and press E.';
  const body = openModal({
    kicker: sectionNames[id].place,
    cls: 'paper',
    onClose: opts.onClose,
    html: `<div class="prose">${sectionHtml(id, 2)}</div><p class="m-foot"><button type="button" class="btn small" id="m-copy">Copy link to this section</button><span>${esc(hint)}</span></p>`,
  });
  const copy = body.querySelector('#m-copy') as HTMLButtonElement;
  copy.addEventListener('click', () => {
    const url = location.origin + location.pathname + '#' + id;
    void navigator.clipboard?.writeText(url).then(() => (copy.textContent = 'Copied!'), () => (copy.textContent = url));
  });
}

export function openMenu(): void {
  const stops = sectionOrder
    .map((id) => {
      const seen = save.visited.includes(id);
      return `<li class="${seen ? 'punched' : ''}"><button type="button" data-go="${id}"><span class="punch" aria-hidden="true"></span><b>${esc(sectionNames[id].place)}</b><span>${esc(sectionNames[id].label)}${seen ? ' · visited' : ''}</span></button></li>`;
    })
    .join('');
  const ach = Object.entries(achievements)
    .map(([id, a]) => (save.ach.includes(id) ? `<li class="got"><b>${esc(a.name)}</b> ${esc(a.text)}</li>` : `<li><b>???</b> locked</li>`))
    .join('');
  const tracks = music.tracks
    .map((t, i) => (i > 0 && !t.src ? '' : `<li><button type="button" class="btn small" data-track="${i}" aria-pressed="${musicPlaying() && currentTrack() === i}">${esc(t.title)}</button></li>`))
    .join('');
  const body = openModal({
    kicker: 'Ticket',
    cls: 'paper',
    html:
      `<div class="ticket"><p class="t-route">${esc(ui.titleKicker)}</p><p class="t-name">Visitor pass · ${esc(meta.name)}'s campus</p>` +
      `<ol class="t-stops">${stops}</ol><p class="t-note">Pick a stop to go straight there. ${save.visited.length}/${sectionOrder.length} punched.</p></div>` +
      `<h3>${esc(music.title)}</h3><ul class="tracks">${tracks}<li><button type="button" class="btn small" data-track="-1">Stop</button></li></ul>` +
      `<h3>Achievements · ${save.ach.length}/${Object.keys(achievements).length}</h3><ul class="ach">${ach}</ul>` +
      `<h3>Controls</h3><p>${esc(ui.controlsKeyboard)}</p><p>${esc(ui.controlsTouch)}</p>` +
      `<p class="m-foot"><button type="button" class="btn small" id="m-reset">Reset progress</button><span>${esc(credits.line)}</span></p>`,
  });
  body.querySelectorAll<HTMLButtonElement>('[data-go]').forEach((b) =>
    b.addEventListener('click', () => {
      closeModal();
      travel.go(b.dataset.go as SectionId);
    }),
  );
  body.querySelectorAll<HTMLButtonElement>('[data-track]').forEach((b) =>
    b.addEventListener('click', () => {
      const i = Number(b.dataset.track);
      if (i < 0) setMusic(false);
      else {
        if (!soundOn()) setSound(true);
        setMusic(true, i);
      }
      soundUi.sync();
      body.querySelectorAll<HTMLButtonElement>('[data-track]').forEach((x) => x.setAttribute('aria-pressed', String(musicPlaying() && Number(x.dataset.track) === currentTrack())));
    }),
  );
  body.querySelector('#m-reset')!.addEventListener('click', () => {
    resetSave();
    location.hash = '';
    location.reload();
  });
}

export function openBoard(): void {
  const rows = contact.links.map((l, i) => `<tr><td>now</td><td><a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.name)} · ${esc(l.label)}</a></td><td>${i + 1}</td><td class="ok">on time</td></tr>`).join('');
  const email = contact.email
    ? `<tr><td>now</td><td><a href="mailto:${esc(contact.email)}">Email · ${esc(contact.email)}</a></td><td>3</td><td class="ok">on time</td></tr>`
    : `<tr><td>--:--</td><td>Email</td><td>3</td><td class="late">${esc(npc.signs.boardDelayed)}</td></tr>`;
  openModal({
    kicker: npc.signs.board,
    cls: 'board',
    html: `<table><thead><tr><th>Time</th><th>Destination</th><th>Plat.</th><th>Status</th></tr></thead><tbody>${rows}${email}<tr><td>later</td><td>Casablanca</td><td>—</td><td>${esc(npc.signs.train[0].split('. ')[1] || '')}</td></tr></tbody></table>`,
  });
}
