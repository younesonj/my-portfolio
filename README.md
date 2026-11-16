# Terminus: Benguerir

Younes Ounajjar's portfolio. It is a small top-down pixel-art game: you take the train from
Casablanca, get off at Benguerir, and walk around a campus where every building is a part of
the CV. It is also, one click away and with JavaScript off, a perfectly normal resume.

- **Play:** arrows, WASD or ZQSD to walk · `E` / Space to talk and use · `R` to read the
  current building as a normal page · `T` for the ticket (fast travel, achievements, radio).
- **Don't play:** the "Plain resume" button, `/#resume`, or `curl https://<site>/resume.txt`.
- **Share a section:** `/#about` `/#school` `/#work` `/#projects` `/#skills` `/#contact`.

The design, the map and the reasoning behind every judgment call are in [DESIGN.md](DESIGN.md).

## Editing the content

Every word lives in **[`src/content.ts`](src/content.ts)**: part 1 is the facts (resume and
buildings), part 2 is game flavour (NPC lines, achievements, the pipeline game, music).
Search for `TODO(younes)` to find what is still blank.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build      # type-checks, then writes dist/
```

No runtime dependencies. Dev dependencies are Vite, TypeScript, ESLint and two self-hosted
OFL fonts (Silkscreen, VT323). All art is drawn by code at boot and all sound is synthesised
with WebAudio, so there are no image or audio files to load.

What ships (gzipped): about 4 kB of HTML with the whole resume in it, 4 kB of CSS, 47 kB of
JavaScript and 26 kB of fonts. The game code is a lazy chunk; the resume never waits for it.

## How this is deployed

The site is static, so the infrastructure is deliberately small and boring. The same
practices I use at work, at portfolio scale:

1. **Build once, in a container.** The [`Dockerfile`](Dockerfile) is multi-stage: a Node
   stage runs `npm ci && npm run build`, and the final image is `nginx-unprivileged` with
   only `dist/` in it. It runs as a non-root user on port 8080, with a read-only root
   filesystem and all capabilities dropped (see [`compose.yml`](compose.yml)).
2. **nginx config in the repo.** [`nginx/default.conf`](nginx/default.conf) serves
   fingerprinted assets with a one-year immutable cache and `index.html` with `no-cache`,
   so a deploy is visible immediately and never half-cached. It sets a strict
   Content-Security-Policy (`script-src 'self'`, no inline scripts), `nosniff`, frame denial
   and a referrer policy, and exposes `/healthz` for the container health check.
3. **CI on every push.** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint,
   type-check and build, checks that the built HTML still contains the resume without
   JavaScript, builds the Docker image, starts it, and smoke-tests `/healthz`, `/` and
   `/resume.txt`. On `main` it then pushes the image to GHCR, tagged with the commit SHA
   and `latest`.
4. **Deploy (not wired up yet).** The image is ready to run anywhere that runs containers.
   The intended setup is a VPS with Docker Compose behind nginx and a Let's Encrypt
   certificate, where a deploy is:

   ```bash
   docker compose pull && docker compose up -d
   ```

   and a rollback is redeploying the previous SHA tag.

   > TODO(younes): fill in the real target once it exists (domain, host, and whether the
   > image is pulled from GHCR or built on the box), then point `compose.yml`'s `image:` at
   > `ghcr.io/<you>/<repo>:latest` and rewrite this step in the past tense.

Try the production image locally:

```bash
docker compose up -d --build
```

```bash
curl -s localhost:8080/resume.txt | head
```

## Project layout

```
index.html              static shell; the resume is baked in here at build time
public/boot.js          picks resume or game mode before first paint
src/content.ts          all text
src/render-html.ts      content → resume HTML / section HTML / resume.txt
src/main.ts             modes and hash routing
src/state.ts            save file (localStorage) and achievements
src/game/               engine: gfx, sprites, buildings, maps, cats, title, audio, input, loop
src/ui/                 dialogue, panels, ticket, terminal, pipeline mini-game
nginx/ Dockerfile compose.yml .github/workflows/ci.yml
prototype/index.html    the original single-file sketch, kept for reference
```

## Accessibility

- The resume is real HTML in the page, not a canvas. It works with JavaScript disabled, in a
  screen reader, in print, and over `curl`.
- Everything in the game is reachable by keyboard; the ticket menu lists every building as a
  button; dialogue is DOM text in a live region; modals are native `<dialog>`.
- `prefers-reduced-motion` removes the train cut-scene, typewriter text, screen shake,
  weather particles and blinking.
- Sound is off until you turn it on.

## Credits and licences

Code, pixel art, sound and music: made for this project. Fonts: Silkscreen and VT323, SIL
Open Font License. No assets from any existing game.
