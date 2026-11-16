/* Keyboard (arrows, WASD, ZQSD) and touch (floating stick + A button). */
export const axis = { x: 0, y: 0 };
const held = { up: false, down: false, left: false, right: false };
const DIR: Record<string, keyof typeof held> = {
  arrowup: 'up', w: 'up', z: 'up',
  arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left', q: 'left',
  arrowright: 'right', d: 'right',
};
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

export interface Handlers {
  action: () => void;
  back: () => void;
  readAll: () => void;
  menu: () => void;
  konami: () => void;
  /** True while a modal owns the keyboard. */
  blocked: () => boolean;
}

function sync(): void {
  axis.x = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  axis.y = (held.down ? 1 : 0) - (held.up ? 1 : 0);
}
export function releaseAll(): void {
  held.up = held.down = held.left = held.right = false;
  sync();
}

export function initInput(h: Handlers): void {
  const recent: string[] = [];
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
    if (h.blocked()) return;
    const k = e.key.toLowerCase();
    if (!e.repeat) {
      recent.push(k);
      if (recent.length > KONAMI.length) recent.shift();
      if (recent.join() === KONAMI.join()) {
        recent.length = 0;
        h.konami();
      }
    }
    if (k === 'escape') return h.back();
    const d = DIR[k];
    if (d) {
      held[d] = true;
      sync();
      e.preventDefault();
      return;
    }
    const onControl = !!el && (el.tagName === 'BUTTON' || el.tagName === 'A');
    if (k === 'e' || ((k === ' ' || k === 'enter') && !onControl)) {
      e.preventDefault();
      if (!e.repeat) h.action();
    } else if (k === 'r' && !e.repeat) h.readAll();
    else if ((k === 't' || k === 'm') && !e.repeat) h.menu();
  });
  addEventListener('keyup', (e) => {
    const d = DIR[e.key.toLowerCase()];
    if (d) {
      held[d] = false;
      sync();
    }
  });
  addEventListener('blur', releaseAll);

  // touch: a stick that appears where the thumb lands
  const zone = document.getElementById('stick-zone')!, knob = document.getElementById('stick-knob')!, base = document.getElementById('stick-base')!;
  let id = -1, ox = 0, oy = 0;
  const end = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = -1;
    axis.x = axis.y = 0;
    base.hidden = true;
  };
  zone.addEventListener('pointerdown', (e) => {
    if (id !== -1) return;
    id = e.pointerId;
    ox = e.clientX;
    oy = e.clientY;
    zone.setPointerCapture(id);
    base.hidden = false;
    base.style.left = ox + 'px';
    base.style.top = oy + 'px';
    knob.style.transform = 'translate(-50%,-50%)';
    e.preventDefault();
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - ox, dy = e.clientY - oy, len = Math.hypot(dx, dy), max = 44;
    const cl = Math.min(len, max);
    const nx = len ? dx / len : 0, ny = len ? dy / len : 0;
    knob.style.transform = `translate(calc(-50% + ${nx * cl}px), calc(-50% + ${ny * cl}px))`;
    if (len < 10) axis.x = axis.y = 0;
    else {
      axis.x = Math.abs(nx) > 0.38 ? Math.sign(nx) : 0;
      axis.y = Math.abs(ny) > 0.38 ? Math.sign(ny) : 0;
    }
  });
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
  zone.addEventListener('contextmenu', (e) => e.preventDefault());
  document.getElementById('btn-a')!.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    h.action();
  });
}
