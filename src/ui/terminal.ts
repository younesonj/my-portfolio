/* The server-room terminal. A tiny fake shell over a virtual filesystem built from content.ts,
   with a few commands that really change the world outside. */
import { about, contact, education, meta, projects, school, skills, terminal as T, work, type Item } from '../content';
import { hooks, type TimeMode, type Weather } from '../bus';
import { resumeText } from '../render-html';
import { flag, unlock } from '../state';
import { world } from '../game/world';
import { closeModal, openModal } from './panels';

type Dir = { [name: string]: string | Dir };
const itemTxt = (i: Item) => `${i.name}\n${i.text}${i.tags ? '\n[' + i.tags.join(', ') + ']' : ''}${i.link ? '\n' + i.link.href : ''}\n`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const dirOf = (items: Item[]): Dir => Object.fromEntries(items.map((i) => [slug(i.id) + '.txt', itemTxt(i)]));

function buildFs(): Dir {
  return {
    'about.txt': about.paragraphs.join('\n') + '\n\n' + about.facts.map((f) => '- ' + f).join('\n') + '\nLanguages: ' + about.languages.join(', ') + '\n',
    'education.txt': education.steps.map((s) => `${s.name}: ${s.text}`).join('\n') + '\n',
    'skills.txt': skills.groups.map((g) => `${g.name}: ${g.items.join(', ')}`).join('\n') + '\n',
    'contact.txt': contact.links.map((l) => `${l.name}: ${l.href}`).join('\n') + (contact.email ? `\nEmail: ${contact.email}` : '') + '\n',
    'resume.txt': resumeText(),
    'restore.sh': '#!/bin/sh\n# pulls last night\'s dump from the R2 well and restores the campus\n# tested. that is the important word.\n',
    school: dirOf(school.projects),
    work: { 'role.txt': `${work.title}\n${work.subtitle}\n\n${work.intro}\n${work.outro}\n`, built: dirOf(work.built), production: dirOf(work.ops) },
    projects: dirOf(projects.items),
    '.ssh': { authorized_keys: 'ssh-ed25519 AAAAC3Nza...campus visitor@train-from-casablanca\n', config: 'PasswordAuthentication no\n' },
  };
}

const pad = (s: string, n: number) => (s + ' '.repeat(n)).slice(0, n);

export function openTerminal(): void {
  const fs = buildFs();
  let cwd: string[] = [];
  const hist: string[] = [];
  let hi = 0;
  const body = openModal({
    kicker: 'visitor@campus-prod-01',
    cls: 'term',
    html: `<div id="t-out" class="t-out" role="log" aria-live="polite"></div><form id="t-form" class="t-line" autocomplete="off"><label for="t-in" id="t-ps"></label><input id="t-in" type="text" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Terminal input"></form>`,
  });
  const out = body.querySelector('#t-out') as HTMLElement;
  const input = body.querySelector('#t-in') as HTMLInputElement;
  const ps = body.querySelector('#t-ps') as HTMLElement;
  const prompt = () => `visitor@campus:${cwd.length ? '~/' + cwd.join('/') : '~'}$`;
  const print = (text: string, cls = '') => {
    const p = document.createElement('pre');
    if (cls) p.className = cls;
    p.textContent = text;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
    return p;
  };
  const setPs = () => (ps.textContent = prompt());

  const resolve = (path: string): { node: string | Dir | undefined; parts: string[] } => {
    const parts = path.startsWith('/') || path.startsWith('~') ? [] : [...cwd];
    for (const seg of path.replace(/^~\/?/, '').split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    let node: string | Dir | undefined = fs;
    for (const p of parts) node = typeof node === 'object' ? node[p] : undefined;
    return { node, parts };
  };

  const pods = () => {
    const rows = [['NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE']];
    hooks.cats().forEach((c) => rows.push([c.name, '1/1', 'Running', '0', Math.max(1, Math.round(c.age)) + 's']));
    rows.push(flag('deployed') ? ['fountain-v1-6d8f9-plaza', '1/1', 'Running', '0', '1m'] : ['fountain-v0-5c7b2-plaza', '0/1', 'CrashLoopBackOff', '42', '6h']);
    for (let i = 0; i < 5; i++) rows.push([`philosopher-${i}`, '1/1', 'Running', '0', '2400y']);
    rows.push(['firewall-0', '1/1', 'Running', '0', '99d'], ['stork-nest-0', '1/1', 'Running', '0', '3y']);
    return rows.map((r) => pad(r[0], 26) + pad(r[1], 8) + pad(r[2], 19) + pad(r[3], 10) + r[4]).join('\n');
  };

  const kubectl = (a: string[]): string => {
    const [verb, kind, ...rest] = a;
    if (verb === 'get') {
      if (/^po(d|ds)?$/.test(kind || '')) return pods();
      if (/^deploy(ment|ments)?$/.test(kind || ''))
        return ['NAME          READY   UP-TO-DATE', pad('cat', 14) + `${hooks.cats().length}/${hooks.cats().length}     ${hooks.cats().length}`, pad('fountain', 14) + (flag('deployed') ? '1/1     1' : '0/1     1'), pad('philosophers', 14) + '5/5     5'].join('\n');
      if (/^no(de|des)?$/.test(kind || '')) return 'NAME             STATUS   ROLES           VERSION\ncampus-prod-01   Ready    control-plane   k3s';
      return 'try: kubectl get pods | deploy | nodes';
    }
    if (verb === 'scale') {
      const all = [kind, ...rest].join(' ');
      const m = all.match(/--replicas[= ](\d+)/);
      if (!/cat/.test(all) || !m) return 'usage: kubectl scale deployment cat --replicas=N';
      const want = Number(m[1]);
      const got = hooks.scaleCats(want);
      if (got !== 1) unlock('scale');
      return `deployment.apps/cat scaled` + (got < want ? `\nWarning: quota exceeded. The campus can only feed ${got} cats.` : got === 0 ? '\nThe campus feels empty. Scale it back up, you monster.' : '');
    }
    if (verb === 'delete') {
      const name = kind === 'pod' || kind === 'po' ? rest[0] : kind;
      if (name && hooks.killCat(name)) return `pod "${name}" deleted\n(the deployment noticed. a new one is already on its way.)`;
      if (name && /philosopher|firewall|stork|fountain/.test(name)) return `Error: pods "${name}" is protected by a PodDisruptionBudget and by common decency.`;
      return `Error: pods "${name || ''}" not found`;
    }
    if (verb === 'logs') {
      const n = kind || '';
      if (/^cat/.test(n)) return 'meow\nmeow\nsegmentation fault (core petted)\nmeow';
      if (/^fountain/.test(n)) return flag('deployed') ? 'listening on :8080\nsplash\nsplash' : 'npm error path /app/package.json\nnpm error code ENOENT\nBack-off restarting failed container';
      if (/^philosopher/.test(n)) return 'thinking\nwaiting for fork (lower id first)\neating\nthinking';
      if (/^firewall/.test(n)) return 'DENY password auth from visitor\nALLOW publickey from visitor';
      return `Error: pods "${n}" not found`;
    }
    if (verb === 'apply' || verb === 'edit') return 'error: this cluster is GitOps. Commit it to Git and let Argo CD sync.';
    return 'kubectl: try get | scale | delete | logs';
  };

  const sl = () => {
    unlock('sl');
    hooks.sfx('whistle');
    const art = ['      ====        ________                ___________ ', '  _D _|  |_______/        \\__I_I_____===__|_________| ', '   |(_)---  |   H\\________/ |   |        =|___ ___|   ', '   /     |  |   H  |  |     |   |         ||_| |_||   ', '  |      |  |   H  |__--------------------| [___] |   ', '  | ________|___H__/__|_____/[][]~\\_______|       |   ', '  |/ |   |-----------I_____I [][] []  D   |=======|__ ', '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ', ' |/-=|___|=    ||    ||    ||    |_____/~\\___/        ', '  \\_/      \\O=====O=====O=====O_/      \\_/            '];
    const p = print('', 'sl');
    if (world.reduce) {
      p.textContent = art.join('\n');
      return;
    }
    const w = 60;
    let x = w;
    const id = window.setInterval(() => {
      x -= 2;
      p.textContent = art.map((l) => (x >= 0 ? ' '.repeat(x) + l : l.slice(-x)).slice(0, w)).join('\n');
      if (x < -art[0].length || !p.isConnected) {
        window.clearInterval(id);
        p.textContent = 'Next stop: Benguerir.';
      }
    }, 50);
  };

  const run = (line: string): void => {
    const args = line.trim().split(/\s+/);
    const cmd = args.shift() || '';
    const arg = args.join(' ');
    switch (cmd) {
      case '': return;
      case 'help': case 'man': print(T.help.join('\n')); return;
      case 'ls': case 'll': {
        const { node } = resolve(args.find((a) => !a.startsWith('-')) || '.');
        if (node === undefined) return void print(`ls: no such file or directory`);
        if (typeof node === 'string') return void print(arg);
        const all = args.some((a) => /^-.*a/.test(a));
        print(Object.keys(node).filter((k) => all || !k.startsWith('.')).map((k) => (typeof node[k] === 'object' ? k + '/' : k)).join('  '));
        return;
      }
      case 'cat': case 'less': case 'more': case 'head': case 'tail': case 'bat': {
        if (!arg) return void print('cat: which file? Try "ls".');
        if (arg === 'cat') return void print('meow');
        const { node } = resolve(arg);
        if (node === undefined) return void print(`cat: ${arg}: No such file or directory`);
        if (typeof node === 'object') return void print(`cat: ${arg}: Is a directory`);
        print(node);
        return;
      }
      case 'cd': {
        const { node, parts } = resolve(arg || '~');
        if (typeof node !== 'object') return void print(`cd: ${arg}: Not a directory`);
        cwd = parts;
        setPs();
        return;
      }
      case 'pwd': print('/home/visitor' + (cwd.length ? '/' + cwd.join('/') : '')); return;
      case 'whoami': print('visitor (key-only, obviously)'); return;
      case 'id': print('uid=1337(visitor) gid=1337(campus) groups=1337(campus),42(network)'); return;
      case 'hostname': print('campus-prod-01'); return;
      case 'uname': print('Linux campus-prod-01 benguerir x86_64 GNU/Linux'); return;
      case 'uptime': print(` ${hooks.clock()} up ${Math.round(world.t)}s, 1 visitor, load average: 0.13, 0.37, 0.42`); return;
      case 'date': print(`${hooks.clock()} Africa/Casablanca (campus time)`); return;
      case 'echo': print(arg); return;
      case 'clear': out.innerHTML = ''; return;
      case 'history': print(hist.map((h, i) => `${String(i + 1).padStart(3)}  ${h}`).join('\n')); return;
      case 'exit': case 'logout': case 'quit': closeModal(); return;
      case 'kubectl': case 'k': print(kubectl(args)); return;
      case 'docker':
        print(args[0] === 'ps' || args[0] === 'compose' ? 'CONTAINER      IMAGE              STATUS\ncampus-nginx   nginx:alpine       Up (healthy)\ncampus-app     campus:latest      Up (healthy)\ncampus-db      postgres:16        Up (healthy)\ncampus-cat     segfault:orange    Up (napping)' : 'try: docker ps');
        return;
      case 'argocd':
        if (args[1] === 'sync') return void print(flag('deployed') ? 'fountain  Synced  Healthy' : 'sync failed: the pipeline is red. The console is in the Lab.');
        print('NAME      SYNC STATUS   HEALTH\ncampus    Synced        Healthy\n' + (flag('deployed') ? 'fountain  Synced        Healthy' : 'fountain  OutOfSync     Degraded'));
        return;
      case 'time': {
        const m = ['auto', 'dawn', 'day', 'dusk', 'night'].includes(arg) ? (arg as TimeMode) : null;
        if (!m) return void print('usage: time dawn|day|dusk|night|auto');
        hooks.setTime(m);
        print(m === 'auto' ? 'Synced to real Casablanca time.' : `It is now ${m}. Go outside and look.`);
        return;
      }
      case 'weather': {
        const w = ['clear', 'wind', 'rain'].includes(arg) ? (arg as Weather) : null;
        if (!w) return void print('usage: weather clear|wind|rain');
        hooks.setWeather(w);
        print(w === 'rain' ? 'Rain over Benguerir. The cat will have opinions.' : w === 'wind' ? 'Chergui incoming. Hold on to your palms.' : 'Clear skies.');
        return;
      }
      case 'sudo': print(T.sudo); return;
      case 'rm':
        if (/-[a-z]*r/.test(arg) || arg.includes('/')) {
          print(T.rmrf.join('\n'), 'bad');
          window.setTimeout(() => {
            closeModal();
            hooks.restoreDrill();
          }, 900);
        } else print('rm: missing operand (probably for the best)');
        return;
      case './restore.sh': case 'restore.sh': case 'sh': case 'bash':
        print('Nothing to restore: the campus is intact. Break something first.');
        return;
      case 'sl': sl(); return;
      case 'make': print(arg === 'tea' || arg === 'atay' ? T.tea.join('\n') : `make: *** No rule to make target '${arg}'. Try "make tea".`); return;
      case 'vim': case 'vi': case 'nano': case 'emacs': print(T.vim); return;
      case 'ssh': print('You are already in. Key-only, remember?'); return;
      case 'ping': print(`PING ${arg || 'casablanca'}: 64 bytes, time=0.42 ms (it is a very short train ride)`); return;
      case 'curl': print(/resume/.test(arg) ? resumeText() : 'curl: try "curl resume.txt". It also works on the real site.'); return;
      case 'top': case 'htop': case 'ps': print('PID  CPU  COMMAND\n  1  0.1  campus\n 42 99.9  philosophers (thinking)\n1337  0.0  cat (asleep)'); return;
      case 'neofetch': case 'fetch':
        print([` /\\_/\\    ${meta.name}`, `( o.o )   ${meta.role}`, ` > ^ <    ${meta.location}`, `          ${skills.groups[0].items.join(' · ')}`, `          ${skills.groups[3].items.slice(0, 5).join(' · ')}`].join('\n'));
        return;
      case 'git': print('On branch main. Nothing to commit, campus clean.'); return;
      default: print(`${cmd}: ${T.notFound}`);
    }
  };

  T.motd.forEach((l) => print(l, 'dim'));
  setPs();
  (body.querySelector('#t-form') as HTMLFormElement).addEventListener('submit', (e) => {
    e.preventDefault();
    const line = input.value;
    input.value = '';
    print(`${prompt()} ${line}`, 'cmd');
    if (line.trim()) {
      hist.push(line.trim());
      hi = hist.length;
    }
    run(line);
  });
  input.addEventListener('keydown', (e) => {
    hooks.sfx('key');
    if (e.key === 'ArrowUp' && hi > 0) {
      input.value = hist[--hi];
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      hi = Math.min(hist.length, hi + 1);
      input.value = hist[hi] || '';
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.value.split(' ');
      const last = parts.pop() || '';
      const slash = last.lastIndexOf('/');
      const { node } = resolve(slash >= 0 ? last.slice(0, slash) || '/' : '.');
      const stem = last.slice(slash + 1);
      if (typeof node === 'object') {
        const hits = Object.keys(node).filter((k) => k.startsWith(stem));
        if (hits.length === 1) input.value = [...parts, last.slice(0, slash + 1) + hits[0] + (typeof node[hits[0]] === 'object' ? '/' : '')].join(' ');
        else if (hits.length > 1) print(hits.join('  '), 'dim');
      }
    }
  });
  body.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('a,button,input') && !String(window.getSelection())) input.focus();
  });
  input.focus();
}
