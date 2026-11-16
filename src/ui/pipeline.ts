/* "Deploy the fountain": the Lab mini-game. Read the log, pick the fix. */
import { pipeline as P } from '../content';
import { hooks } from '../bus';
import { esc } from '../render-html';
import { flag, setFlag, unlock } from '../state';
import { openModal } from './panels';

export function openPipeline(): void {
  let solved = flag('deployed') ? P.incidents.length : 0;
  const body = openModal({ kicker: P.title, cls: 'term pipe', html: '' });

  const stagesHtml = () => {
    const failing = solved < P.incidents.length ? P.incidents[solved].stage : 99;
    return `<ol class="stages" aria-label="Pipeline stages">${P.stages
      .map((s, i) => {
        const st = i < failing ? 'ok' : i === failing ? 'fail' : 'wait';
        return `<li class="${st}"><span class="dot" aria-hidden="true"></span>${esc(s)}<span class="sr"> ${st === 'ok' ? 'passed' : st === 'fail' ? 'failed' : 'waiting'}</span></li>`;
      })
      .join('')}</ol>`;
  };

  const render = (reply?: { text: string; right: boolean }) => {
    if (solved >= P.incidents.length) {
      const lines = flag('deployed') && !reply ? [P.already] : P.success;
      body.innerHTML = stagesHtml() + `<div class="log ok" role="status">${lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>`;
      return;
    }
    const inc = P.incidents[solved];
    body.innerHTML =
      stagesHtml() +
      (solved === 0 && !reply ? `<p class="p-intro">${esc(P.intro)}</p>` : '') +
      `<p class="file">${esc(inc.file)}</p><pre class="code">${inc.code.map(esc).join('\n')}</pre>` +
      `<pre class="log">${inc.log.map(esc).join('\n')}</pre>` +
      `<div role="status" class="reply ${reply ? (reply.right ? 'ok' : 'bad') : ''}">${reply ? esc(reply.text) : ''}</div>` +
      `<p class="q">${esc(inc.question)}</p><div class="opts">${inc.options.map((o, i) => `<button type="button" class="btn" data-i="${i}">${esc(o.text)}</button>`).join('')}</div>`;
    body.querySelectorAll<HTMLButtonElement>('[data-i]').forEach((b) =>
      b.addEventListener('click', () => {
        const o = inc.options[Number(b.dataset.i)];
        if (!o.right) {
          hooks.sfx('bad');
          render({ text: '✗ ' + o.reply, right: false });
          return;
        }
        hooks.sfx('ok');
        solved++;
        if (solved >= P.incidents.length) {
          setFlag('deployed');
          unlock('deploy');
          hooks.sfx('splash');
          hooks.irc('* argocd: fountain is now Synced / Healthy');
          render({ text: '', right: true });
        } else {
          render({ text: '✓ ' + o.reply + ' Next failure:', right: true });
        }
        (body.querySelector('button') as HTMLElement | null)?.focus();
      }),
    );
  };
  render();
  (body.querySelector('button') as HTMLElement | null)?.focus();
}
