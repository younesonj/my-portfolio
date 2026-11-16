/* ==========================================================================
   content.ts — EVERY word on the site lives in this one file.

   Part 1: facts about you (resume + buildings). Edit freely.
   Part 2: game flavour (NPC lines, achievements, the pipeline game, music).

   Search for "TODO(younes)" to find the blanks only you can fill.
   ========================================================================== */

export type SectionId = 'about' | 'school' | 'work' | 'projects' | 'skills' | 'contact';

export interface Item {
  id: string;
  name: string;
  text: string;
  tags?: string[];
  link?: { label: string; href: string };
}

/* ------------------------------ PART 1: FACTS ------------------------------ */

export const meta = {
  name: 'Younes Ounajjar',
  role: 'Software Engineer',
  headline: 'Software engineer in Casablanca. I build platforms, then run them in production.',
  focus: 'Looking for DevOps, cloud and infrastructure roles.',
  location: 'Casablanca, Morocco',
  /** TODO(younes): the final public URL, used for share links / og:url (e.g. https://younes.dev). */
  siteUrl: '',
};

export const about = {
  place: 'Dar Younes',
  title: 'About me',
  paragraphs: [
    "I'm Younes, a software engineer at Brandscan and a final-year student at 1337 Coding School (42 Network / UM6P, Benguerir campus).",
    'Backend-minded, with a soft spot for infrastructure: servers, deployments, backups and keeping production alive. That is where I want to work next: DevOps, cloud and infrastructure.',
  ],
  facts: [
    'Based in Casablanca, Morocco',
    'Software Engineer at Brandscan, full-time and remote',
    'Final year at 1337 (42 Network / UM6P)',
    'Open to DevOps, cloud and infrastructure roles',
  ],
  languages: ['English', 'French', 'Darija'],
};

export const education = {
  title: 'How I got here',
  steps: [
    { name: 'Baccalaureate', text: 'Physical sciences.' },
    { name: 'Faculty of Sciences', text: 'One year.' },
    { name: '1337 Coding School', text: 'Since 2023, because code is what I love. Common core and internship validated, now in the final year.' },
  ],
};

export const school = {
  place: '1337',
  title: '1337 Coding School',
  subtitle: '42 Network · UM6P · Benguerir campus · since 2023',
  intro:
    'I joined 1337 in 2023, after a bac in physical sciences and a year at the Faculty of Sciences, because code is what I love. Common core and internship validated, now in the final year.',
  projects: [
    { id: 'minishell', name: 'Minishell', text: 'A bash-like shell, written in C.', tags: ['C'] },
    { id: 'philosophers', name: 'Philosophers', text: 'The dining philosophers with threads and mutexes, in C.', tags: ['C', 'threads', 'mutexes'] },
    { id: 'ft_irc', name: 'ft_irc', text: 'An IRC server in C++98.', tags: ['C++98'] },
    { id: 'cpp', name: 'CPP modules 00–09', text: 'Ten modules of C++.', tags: ['C++'] },
    { id: 'netpractice', name: 'NetPractice', text: 'TCP/IP networking exercises.', tags: ['TCP/IP'] },
    { id: 'inception', name: 'Inception', text: 'A small infrastructure built with Docker.', tags: ['Docker'] },
    {
      id: 'transcendence',
      name: 'ft_transcendence · "42 Coloc"',
      text: 'A roommate finder built as microservices.',
      tags: ['NestJS', 'Prisma', 'PostgreSQL', 'Docker', 'OAuth2', 'FastAPI + Gemini'],
    },
    {
      id: 'iot',
      name: 'Inception-of-Things',
      text: 'Vagrant, K3s, K3d and Argo CD GitOps. My part was K3d + Argo CD.',
      tags: ['Vagrant', 'K3s', 'K3d', 'Argo CD'],
      link: { label: 'github.com/younesonj/younajja_iot_argocd', href: 'https://github.com/younesonj/younajja_iot_argocd' },
    },
  ] as Item[],
};

export const work = {
  place: 'Brandscan',
  title: 'Software Engineer at Brandscan',
  subtitle: 'Moroccan B2B social listening startup · full-time (remote) since September 2026',
  intro:
    'I joined Brandscan for my end-of-studies internship, built their internal platform from scratch as the only developer, and stayed on full-time (remote) since September 2026.',
  builtTitle: 'What I built',
  built: [
    { id: 'platform', name: 'The platform', text: 'The internal platform, from scratch, as the only developer.', tags: ['NestJS', 'Next.js', 'PostgreSQL', 'Prisma'] },
    { id: 'chat', name: 'Real-time chat', text: 'Real-time chat for the team.', tags: ['Socket.io'] },
    { id: 'extension', name: 'Chrome extension', text: 'A Chrome extension that captures social mentions, with AI auto-fill.', tags: ['Chrome extension', 'Gemini'] },
    { id: 'reports', name: 'Client reports', text: 'Automated client reports with PowerPoint export.', tags: ['PowerPoint export'] },
    { id: 'data', name: 'Data in, data out', text: 'CSV import and export, and analytics.', tags: ['CSV', 'analytics'] },
  ] as Item[],
  opsTitle: 'How I run it in production, myself',
  ops: [
    { id: 'vps', name: 'Hosting', text: 'A Hetzner VPS running Docker Compose.', tags: ['Hetzner', 'Docker Compose'] },
    { id: 'tls', name: 'Front door', text: "nginx with Let's Encrypt certificates.", tags: ['nginx', "Let's Encrypt"] },
    { id: 'backups', name: 'Backups', text: 'Nightly PostgreSQL backups to Cloudflare R2, with a tested restore.', tags: ['PostgreSQL', 'Cloudflare R2'] },
    { id: 'uploads', name: 'Uploads', text: 'File uploads stored on R2 behind signed URLs.', tags: ['R2', 'signed URLs'] },
    { id: 'security', name: 'Security', text: 'Key-only SSH, ufw, and rate limiting on login routes.', tags: ['SSH keys', 'ufw', 'rate limiting'] },
  ] as Item[],
  outro: 'The analyst team uses it daily.',
};

export const projects = {
  place: 'The Lab',
  title: 'Projects',
  intro: 'Things I built, at work, at school and at a hackathon.',
  items: [
    {
      id: 'brandscan',
      name: 'Brandscan platform',
      text: 'A social listening platform built from scratch as the only developer, and run in production by me. The analyst team uses it daily.',
      tags: ['NestJS', 'Next.js', 'PostgreSQL', 'Docker Compose', 'nginx'],
    },
    {
      id: 'iot',
      name: 'Inception-of-Things',
      text: 'GitOps on Kubernetes with Vagrant, K3s, K3d and Argo CD. My part was K3d + Argo CD.',
      tags: ['K3d', 'Argo CD', 'K3s', 'Vagrant'],
      link: { label: 'See the repo on GitHub', href: 'https://github.com/younesonj/younajja_iot_argocd' },
    },
    {
      id: 'coloc',
      name: '42 Coloc',
      text: 'ft_transcendence: a roommate finder built as microservices.',
      tags: ['NestJS', 'Prisma', 'PostgreSQL', 'Docker', 'OAuth2', 'FastAPI + Gemini'],
    },
    { id: 'inception', name: 'Inception', text: 'A Docker infrastructure, built at 1337.', tags: ['Docker'] },
    { id: 'ft_irc', name: 'ft_irc', text: 'An IRC server in C++98.', tags: ['C++98'] },
    {
      id: 'adly',
      name: 'Adly',
      text: 'FootTech Hackathon 2026, Technopark Casablanca. Team project: a marketplace for ads on football stadium screens across MENA.',
      tags: ['Hackathon', 'Team project'],
    },
  ] as Item[],
};

export const skills = {
  place: 'Hanout',
  title: 'Skills',
  intro: 'Everything in stock.',
  groups: [
    { id: 'languages', name: 'Languages', items: ['C', 'C++', 'TypeScript', 'Python', 'SQL'] },
    { id: 'backend', name: 'Backend', items: ['NestJS', 'Prisma', 'PostgreSQL', 'Socket.io', 'REST', 'JWT / OAuth2'] },
    { id: 'frontend', name: 'Frontend', items: ['Next.js', 'React', 'Tailwind'] },
    { id: 'infra', name: 'Infrastructure', items: ['Docker', 'Compose', 'Kubernetes (K3s / K3d)', 'Argo CD', 'Vagrant', 'nginx', "Let's Encrypt", 'Linux'] },
    { id: 'cloud', name: 'Cloud & services', items: ['Hetzner', 'Cloudflare (DNS, R2)', 'Vercel', 'Gemini API'] },
  ],
};

export const contact = {
  place: 'Post office',
  title: 'Contact',
  intro: "I'm open to DevOps, cloud and infrastructure roles. Write to me:",
  links: [
    { id: 'github', name: 'GitHub', label: 'github.com/younesonj', href: 'https://github.com/younesonj' },
    { id: 'linkedin', name: 'LinkedIn', label: 'linkedin.com/in/younes-ounajjar', href: 'https://www.linkedin.com/in/younes-ounajjar' },
  ],
  /** TODO(younes): your public email address, e.g. 'hello@example.com'. Leave '' to hide it. */
  email: '',
};

/** Order of the sections, in the resume and on the ticket. */
export const sectionOrder: SectionId[] = ['about', 'school', 'work', 'projects', 'skills', 'contact'];

export const sectionNames: Record<SectionId, { place: string; label: string }> = {
  about: { place: 'Dar Younes', label: 'About' },
  school: { place: '1337', label: 'School' },
  work: { place: 'Brandscan', label: 'Work' },
  projects: { place: 'The Lab', label: 'Projects' },
  skills: { place: 'Hanout', label: 'Skills' },
  contact: { place: 'Post office', label: 'Contact' },
};

/* --------------------------- PART 2: GAME FLAVOUR --------------------------- */
/* Nothing below states a fact about you. It is banter, jokes and game text.   */

export const ui = {
  titleKicker: 'Casablanca → Benguerir',
  titleSub: 'A portfolio you can walk around.',
  start: 'Arrive at Benguerir',
  resume: 'Plain resume',
  resumeHint: 'In a hurry? The plain resume has everything, no walking required.',
  controlsKeyboard: 'Walk: arrows, WASD or ZQSD · Talk / use: E or Space · Read this place: R · Ticket: T',
  controlsTouch: 'Walk with the stick · A to talk and use',
  resumeBanner: 'This resume is also a small game.',
  resumeBannerCta: 'Walk around the campus',
};

export const npc = {
  stationMaster: {
    name: 'STATION MASTER',
    first: [
      'Benguerir, terminus! Everybody off. Mind the gap between Casablanca and here.',
      'Six buildings on this campus, each one a piece of Younes. Your ticket gets punched at every door.',
      'The plaza is straight ahead. The fountain is... well. Ask the Lab about the fountain.',
    ],
    again: ['The train waits as long as you like. That is the nice thing about a pixel train.', 'In a hurry? The plain resume is top right. No shame in it.'],
    done: ['A full ticket! Six punches. The post office is where you write to him.', 'Safe travels back to Casablanca.'],
  },
  cat: {
    name: 'SEGFAULT',
    first: ['Meow. I am Segfault, the campus cat. I crash wherever I want.', 'Younes lives up north-west, studies up north, works up north-east.', 'Tip: he keeps a key in ~/.ssh at home. Some doors only open with keys. I prefer windows.'],
    hintKey: 'The guard at Brandscan wants a key, not a password. Keys live in ~/.ssh. ~ is home. You do the maths.',
    hintFountain: 'The fountain has been in CrashLoopBackOff since this morning. The Lab has a pipeline console. I have no thumbs.',
    hintServer: 'You have the key. The server room is behind the guard at Brandscan. There is a button in there. Do not press it. (Press it.)',
    hintTerminal: 'In the server room terminal, try: kubectl scale deployment cat --replicas=5. For science.',
    hintVisit: 'Still unvisited: {places}. I would show you, but I am busy doing nothing.',
    allDone: ['You saw everything. Not bad, for a human.', 'If you liked it, the yellow post office is how you reach him. Tell him the cat sent you.'],
    pet: ['Purrrr.', 'Acceptable.', 'Left a bit. LEFT.', 'I will allow it.', 'You may continue.'],
    rain: 'I am a pod, not a fish. Make it stop.',
    night: 'Zzz... kernel panic... zzz...',
    replica: ['I am also Segfault.', 'Meow. Replica reporting.', 'We are legion. We are hungry.', 'Same cat, different pod.'],
  },
  guard: {
    name: 'FIREWALL',
    noKey: ['Halt. Server room. Authorised keys only.', 'Password? We do not do passwords here. Key-only.'],
    noKeyAgain: ['No key, no entry.', 'Still no key. Still no entry.', 'I can do this all day. Default policy: deny.'],
    rateLimited: ['429. Too many attempts.', 'You are rate limited. Go for a walk. Come back with a key.'],
    withKey: ['...ed25519. Fingerprint matches.', 'Welcome. Do not touch the red button.'],
    open: ['Go ahead. And I mean it about the button.'],
  },
  student: {
    name: 'STUDENT',
    lines: [
      ['My minishell leaks. I have been here since Tuesday. What day is it?'],
      ['Every screen in here is one of his projects. Go on, press E in front of them.'],
      ['No teachers here. Just projects, and other students reviewing them. And the Black Hole.'],
      ['If you see the norminette, tell her I am sorry.'],
    ],
  },
  shopkeeper: {
    name: 'MOUL L7ANOUT',
    lines: [
      ['Salam! Welcome, welcome. Everything on the shelves is in stock.'],
      ['Fresh Docker this morning. The Kubernetes comes in small sizes: K3s, K3d.'],
      ['You want it on credit? Write it in the notebook. Everyone writes it in the notebook.'],
      ['C and C++ are in the heavy jars. Careful, no garbage collection.'],
    ],
  },
  postman: {
    name: 'POSTMAN',
    lines: [
      ["Letters for Younes? Use the boxes. He's open to DevOps, cloud and infrastructure roles."],
      ['GitHub on the left, LinkedIn on the right. The email box is in the middle.'],
      ['We deliver over TCP. No lost packets, only late ones.'],
    ],
  },
  philosophers: {
    name: 'PHILOSOPHER',
    thinking: ['I think, therefore I wait.', 'Is the tagine getting cold, or am I getting slow?', 'Thinking. Do not interrupt my thread.'],
    hungry: ['I need two forks. I have opinions and zero forks.', 'Waiting on a mutex. Politely.'],
    eating: ['Mmh. Critical section.', 'Do not talk to me, I hold two locks.'],
    table: 'Five philosophers, five forks, one tagine. Everyone picks up the lower-numbered fork first, so nobody deadlocks and nobody starves.',
  },
  signs: {
    well: ['THE R2 WELL', 'Bucket storage. Every night a bucket of PostgreSQL goes down the well.', 'And yes: pulling it back up has been tested.'],
    wellName: 'R2 BUCKET',
    fountainDown: ['fountain-v0   0/1   CrashLoopBackOff', 'The fountain is down. A pipe runs east to the Lab. The pipeline console is in there.'],
    fountainUp: ['fountain-v1   1/1   Running', 'Deployed by you. The plaza says thanks.'],
    sundial: {
      auto: 'The sundial is synced to real Casablanca time again. NTP is a beautiful thing.',
      dawn: 'You turn the sundial. Dawn.',
      day: 'You turn the sundial. Midday.',
      dusk: 'You turn the sundial. Golden hour.',
      night: 'You turn the sundial. Night. The lamps come on.',
    },
    bed: ['A bed. Tempting.', 'You should not nap in someone else\'s portfolio.'],
    key: ['On the desk, a laptop. In the laptop, ~/.ssh/id_ed25519.', 'You pocket the SSH key. Some door on this campus is key-only.'],
    keyAgain: ['The laptop hums. You already have the key.'],
    tea: ['You pour the mint tea from very high up, the way it should be done.', 'Not a drop spilled. Atay is served.'],
    teaAgain: ['Another glass. You are among friends.'],
    coffee: ['The coffee machine. Out of order since the last exam.'],
    radio: 'The radio. Press play in the Ticket menu, or right here.',
    train: ['The train back to Casablanca. It leaves when you close the tab.'],
    button: ['A big red button. A sticker says: DO NOT PRESS.', 'Below it, in smaller letters: "rm -rf /campus".'],
    buttonConfirm: 'Press it?',
    buttonAgain: ['You pressed it once already. Everything came back. That is the whole point of backups.'],
    spices: ['Cumin, paprika, ras el hanout. None of these are JavaScript frameworks, surprisingly.'],
    board: 'DEPARTURES',
    boardDelayed: 'delayed',
    emailTodo: 'The email box is still being painted. Use GitHub or LinkedIn for now.',
  },
  drill: {
    deleting: ['$ rm -rf /campus', 'removing plaza...', 'removing palms...', 'removing cat... (the cat objects)'],
    gone: ['ls: /campus: No such file or directory', '', '$ ./restore.sh --from r2://campus/nightly'],
    restoring: 'pulling last night\'s backup from the R2 well',
    done: ['Restore complete. Every tile is back where it was.', 'A backup you have never restored is a hope, not a backup. This one is tested.'],
  },
};

export const achievements: Record<string, { name: string; text: string }> = {
  arrived: { name: 'Terminus', text: 'Took the train to Benguerir.' },
  tour: { name: 'Full ticket', text: 'Visited all six buildings.' },
  pet: { name: 'Core petted', text: 'Petted Segfault.' },
  key: { name: 'Key-only', text: 'Found the SSH key.' },
  ratelimit: { name: '429', text: 'Got rate limited by the firewall.' },
  shell: { name: 'Shell access', text: 'Opened the server room terminal.' },
  deploy: { name: 'Green pipeline', text: 'Fixed the pipeline. The fountain runs.' },
  restore: { name: 'Tested restore', text: 'Deleted the campus, then restored it from backup.' },
  scale: { name: 'Horizontal Cat Autoscaler', text: 'Scaled the cat deployment.' },
  tea: { name: 'Atay', text: 'Poured the mint tea.' },
  konami: { name: 'Old school', text: 'Entered the Konami code.' },
  philo: { name: 'Nobody starves', text: 'Had a word with the philosophers.' },
  night: { name: 'Night shift', text: 'Walked the campus after dark.' },
  sl: { name: 'Choo choo', text: 'Typed sl. Classic.' },
  well: { name: 'Bucket storage', text: 'Found the R2 well.' },
};

/** The "deploy the fountain" mini-game in the Lab. Three incidents; pick the fix. */
export const pipeline = {
  title: 'fountain · deploy pipeline',
  intro: 'The plaza fountain is down. The pipeline is red. Read the log, pick the fix.',
  stages: ['lint', 'build', 'image', 'deploy', 'sync'],
  incidents: [
    {
      stage: 1,
      file: 'Dockerfile',
      code: ['FROM node:22-alpine AS build', 'WORKDIR /app', 'RUN npm ci', 'COPY package*.json ./', 'COPY . .', 'RUN npm run build'],
      log: ['#7 [build 3/6] RUN npm ci', 'npm error code ENOENT', "npm error path /app/package.json", 'ERROR: process "npm ci" did not complete: exit code 254'],
      question: 'The build stage fails. What do you change?',
      options: [
        { text: 'Copy package*.json before running npm ci', right: true, reply: 'Yes. Install needs the manifest first, and the layer caches properly now.' },
        { text: 'Run npm ci with sudo', right: false, reply: 'Still no package.json. Now with more privileges.' },
        { text: 'Delete node_modules and retry', right: false, reply: 'There is no node_modules. There is no package.json either. That is the problem.' },
      ],
    },
    {
      stage: 3,
      file: 'nginx.conf  +  compose.yml',
      code: ['location / {', '    proxy_pass http://fountain:3000;', '}', '', 'services:', '  fountain:', '    expose: ["8080"]'],
      log: ['fountain  | listening on :8080', 'nginx     | connect() failed (111: Connection refused)', 'nginx     | upstream: "http://fountain:3000/"', 'GET /  502 Bad Gateway'],
      question: 'The container is healthy, but nginx answers 502. The fix?',
      options: [
        { text: 'Restart nginx until it works', right: false, reply: 'It restarts beautifully. Still 502.' },
        { text: 'Point proxy_pass at port 8080, where the app listens', right: true, reply: 'Upstream and container finally agree on a port.' },
        { text: 'Open port 3000 in ufw', right: false, reply: 'Nothing listens on 3000. You opened a door onto a wall.' },
      ],
    },
    {
      stage: 4,
      file: 'argocd app get fountain',
      code: ['Sync Status:   OutOfSync', 'Health Status: Degraded', '', 'live:    image: fountain:hotfix-friday', 'git:     image: fountain:v1'],
      log: ['Someone ran kubectl edit on the live cluster.', 'Git says v1. The cluster says hotfix-friday.', 'Argo CD is confused, and frankly so are we.'],
      question: 'Live state drifted from Git. What is the GitOps answer?',
      options: [
        { text: 'kubectl edit it again, carefully this time', right: false, reply: 'Two wrongs. Still OutOfSync.' },
        { text: 'Turn off auto-sync so it stops complaining', right: false, reply: 'The smoke detector is quiet now. The kitchen is still on fire.' },
        { text: 'Git is the source of truth: commit the tag there and let Argo CD sync', right: true, reply: 'Synced. Healthy. Nobody touched prod by hand.' },
      ],
    },
  ],
  success: ['All stages green.', 'argocd: fountain  Synced  Healthy', 'Go look at the plaza.'],
  already: 'The pipeline is green and the fountain is running. Nothing to fix. Enjoy the feeling, it never lasts.',
};

export const terminal = {
  motd: ['campus-prod-01 · Benguerir · uptime: since you got off the train', 'Type "help". Type "exit" to leave. Do not type rm -rf /.'],
  help: [
    'ls, cat <file>, cd <dir>, pwd      look around',
    'whoami, uname, uptime, date        the usual',
    'kubectl get pods|deploy|nodes      what runs on campus',
    'kubectl scale deployment cat --replicas=N',
    'kubectl delete pod <name>          it comes back. that is the point',
    'kubectl logs <pod>',
    'docker ps, argocd app list',
    'time dawn|day|dusk|night|auto      move the sun',
    'weather clear|wind|rain            change the weather',
    'history, clear, exit',
    '...and a few commands that are not listed.',
  ],
  sudo: 'visitor is not in the sudoers file. This incident will be reported to the cat.',
  rmrf: ['rm: removing /campus ...', 'rm: this was a terrible idea'],
  tea: ['Pouring atay from a height of 40 cm...', 'Done. 0 drops spilled.'],
  vim: 'You are now in vim. Just kidding. Nobody should be trapped here.',
  notFound: 'command not found. Try "help".',
};

export const music = {
  title: 'Campus radio',
  tracks: [
    { title: 'Benguerir Sunset (built-in chiptune)', src: '' },
    /** TODO(younes): drop mp3/ogg files you have the rights to in public/music/ and list them here. */
    { title: 'TODO(younes): a song you like', src: '' },
    { title: 'TODO(younes): another song you like', src: '' },
  ],
};

export const credits = {
  line: 'Designed, drawn and synthesised in code. No engine, no image files, no borrowed assets.',
};
