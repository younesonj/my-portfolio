/* Entry point. The page is a plain resume by default (see index.html); this file layers the
   game on top and handles the two modes plus hash routing:
     #resume, #resume-work …  → plain resume
     #about #school #work #projects #skills #contact → straight into that building
     (nothing)               → title screen */
import '@fontsource/silkscreen/latin-400.css';
import '@fontsource/vt323/latin-400.css';
import './style.css';
import { sectionOrder, ui, type SectionId } from './content';

const root = document.documentElement;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const isSection = (h: string): h is SectionId => (sectionOrder as string[]).includes(h);
const hash = () => decodeURIComponent(location.hash.slice(1));
type Game = typeof import('./game/game');
let game: Game | null = null;
let loading: Promise<Game> | null = null;

function showResume(): void {
  root.classList.remove('play');
  game?.setPaused(true);
  const h = hash();
  const el = h.startsWith('resume-') ? document.getElementById(h) : null;
  if (el) el.scrollIntoView();
  else scrollTo(0, 0);
}

async function loadGame(): Promise<Game> {
  if (game) return game;
  loading ??= (async () => {
    const [g, audio, dialog, panels, hud] = await Promise.all([import('./game/game'), import('./game/audio'), import('./ui/dialog'), import('./ui/panels'), import('./ui/hud')]);
    dialog.initDialog();
    panels.initPanels();
    hud.initHud();
    await g.initGame();
    g.callbacks.section = (id) => history.replaceState(null, '', id ? '#' + id : location.pathname + location.search);
    const snd = $<HTMLButtonElement>('btn-sound');
    const sync = () => {
      snd.setAttribute('aria-pressed', String(audio.soundOn()));
      snd.textContent = audio.soundOn() ? 'Sound: on' : 'Sound: off';
    };
    panels.soundUi.sync = sync;
    snd.addEventListener('click', () => {
      audio.setSound(!audio.soundOn());
      sync();
      snd.blur();
    });
    $('btn-read').addEventListener('click', (e) => { g.readHere(); (e.currentTarget as HTMLElement).blur(); });
    $('btn-menu').addEventListener('click', (e) => { g.menu(); (e.currentTarget as HTMLElement).blur(); });
    $('btn-start').addEventListener('click', () => {
      $('title').hidden = true;
      g.arrive();
    });
    game = g;
    return g;
  })();
  return loading;
}

async function showGame(): Promise<void> {
  root.classList.add('play');
  scrollTo(0, 0);
  const g = await loadGame();
  g.setPaused(false);
  const h = hash();
  if (isSection(h)) {
    $('title').hidden = true;
    if (g.inGame()) (await import('./ui/panels')).travel.go(h);
    else g.startAt(h);
  } else if (!g.inGame()) $<HTMLButtonElement>('btn-start').focus();
}

function route(): void {
  if (hash().startsWith('resume')) showResume();
  else void showGame();
}

$('hint').textContent = matchMedia('(pointer: coarse)').matches ? ui.controlsTouch : ui.controlsKeyboard;
addEventListener('hashchange', route);
route();
