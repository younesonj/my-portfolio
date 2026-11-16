# DESIGN.md — "Terminus: Benguerir"

## The concept in one line

**The campus is a production system, and you're the visitor who gets shell access.**

The prototype was a map with six doors. This version keeps the walk-around-my-campus idea but
gives it a point of view: Younes is the person who *builds the thing and then keeps it alive*.
So the campus itself behaves like infrastructure. The fountain is a deployment that is down
until you fix its pipeline. The cat is a pod you can scale. The backups are a literal well with
a bucket. There is a red button that deletes the campus, and a restore that brings it back,
because "nightly backups with a tested restore" is the most DevOps sentence in the whole CV and
it deserved to be playable.

A recruiter who never plays still gets everything: the page *is* the plain resume (pre-rendered
HTML), and the game is layered on top of it.

## Art direction

- **Place, not genre.** Benguerir is dry and ochre, so the ground is sand, not RPG grass.
  Paths are pale stone, the plaza is zellige, walls are pisé red, doors are Majorelle blue,
  roofs are green glazed tile. Palms, olive trees, prickly pears, bougainvillea.
- **Palette.** Sand `#e3bd7f`, terracotta `#c4683f`, Majorelle `#3d4fd8`, tile green
  `#2f8a5a`, cream `#fbf0d6`, ink `#1b1530`. One accent per building so each reads at a glance.
- **All art is code.** No image files. Characters are 12×17 pixel maps with palette swaps and an
  automatic 1px outline; buildings, props and tiles are drawn procedurally to offscreen
  canvases at boot. Nothing is borrowed from any game.
- **Camera.** A real scrolling world (48×40 tiles) with a follow camera at integer scale,
  full-bleed, instead of the prototype's fixed single screen. Portrait phones get a taller view.
- **Type.** Silkscreen (display, canvas labels) and VT323 (dialogue, terminal), both OFL and
  self-hosted. The plain resume uses the system font, because it is for reading.
- **Sound.** Synthesised with WebAudio: footsteps, blips, a train, and one original chiptune
  loop in a Hijaz scale over a darbuka *maqsum* rhythm. Off by default.

## The map

```
            N
   ┌─────────────────────────────────────────────┐
   │  DAR YOUNES        1337            BRANDSCAN │
   │  (about)        (school)            (work)   │
   │     │   café des   │                  │  ⊚ R2 well
   │     │ philosophes  │                  │      │
   │ ────┴────────  ZELLIGE PLAZA ─────────┴────  │
   │                 fountain + sundial           │
   │                    │    ╔═ pipeline ══╗      │
   │   HANOUT           │   POST          LAB     │
   │   (skills)         │  (contact)   (projects) │
   │ ───────────────────┼───────────────────────  │
   │                 platform                     │
   │ ═══════════ train from Casablanca ══════════ │
   └─────────────────────────────────────────────┘
```

You arrive at the bottom and the story reads upward: station → plaza → the three "who I am"
buildings in the north (home, school, work) → the three "what I can do for you" buildings in
the south (skills, projects, contact) on the way back to the train.

Every building has a **real interior** you walk around in. Objects are the content: at 1337
each iMac is a project, in the hanout each shelf is a skill category, in the server room each
rack is a production practice. A "Read this place" button (key `R`) opens the same content as
one normal panel, for people who would rather read than poke furniture.

| Building | Section | Inside |
|---|---|---|
| Dar Younes | `#about` | Riad room: photo, bookshelf (languages), journey map, mint tea, radio, and `~/.ssh` on the desk |
| 1337 | `#school` | A cluster room: eight iMacs = eight projects, whiteboard, a student in pain |
| Brandscan | `#work` | Office: five desks = what I built. A guard and a door to the server room |
| ↳ Server room | — | Five racks = how I run production. The terminal. The red button |
| The Lab | `#projects` | Six workbenches and the deploy pipeline console |
| Hanout | `#skills` | A corner shop: skills are stock on the shelves |
| Post | `#contact` | Three letterboxes and a postman |

## Original ideas (not in the brief)

1. **The fountain is a broken deployment.** The plaza fountain is dry (`CrashLoopBackOff`)
   and a pipe runs from the Lab to it. Fix the pipeline in the Lab and the water physically
   turns on outside. The mini-game changes the world, it isn't a pop-up quiz. ✅ built
2. **The restore drill.** A big red button in the server room (or `rm -rf /` in the terminal)
   deletes the campus tile by tile, then `restore.sh` pulls last night's backup and rebuilds
   it. The joke is the point: a backup you never restored is a hope, not a backup. ✅ built
3. **The cat is a Kubernetes deployment.** `kubectl scale deployment cat --replicas=5` puts five
   cats on campus. `kubectl delete pod cat-…` removes one and a replacement respawns, because
   that is what a deployment does. The cat is named **Segfault**. ✅ built
4. **Key-only server room.** A firewall guard blocks the server room: no passwords, key only.
   The key is where it should be, in `~/.ssh` on the desk at home. Knock too often without it
   and he rate-limits you with a 429. Three real security practices turned into one small
   quest. ✅ built
5. **Café des Philosophes.** Five philosophers share five forks around one tagine, running a
   real dining-philosophers simulation (ordered fork pickup, so nobody deadlocks or starves).
   The Philosophers project, running live outdoors. ✅ built
6. **The R2 well.** Bucket storage is a well with a bucket. Every night a bucket of PostgreSQL
   goes down; yes, we tested pulling it back up. ✅ built
7. **The log is an IRC channel.** Achievements and gossip scroll by as `#campus` messages,
   a nod to ft_irc. ✅ built
8. **The page is a resume first.** `index.html` ships the full CV as static HTML and
   `/resume.txt` as plain text, so `curl` works and so does a browser with JavaScript off.
   The game is an enhancement, never a gate. ✅ built
9. **The sundial is NTP.** Time of day follows the real clock in Casablanca; touching the
   sundial steps through dawn/day/dusk/night, and one more touch re-syncs to real time. ✅ built
10. **The departures board is the contact page.** On the platform, GitHub and LinkedIn are
    listed as departing trains. Email is "delayed" until the TODO is filled. ✅ built
11. **`sl`.** Typing `sl` in the terminal runs a train across it. Of course it does. ✅ built
12. **Night-shift courier**: a triporteur that physically carries the 03:00 backup crate from
    Brandscan to the well. ❌ cut: charming, but the well already tells that story.
13. **Visitor guestbook** stored server-side. ❌ cut: it would need a backend and moderation,
    and a static site that can't go down is the better infra story here.

From the seed list I took: the train arrival (it is the title screen), real-time day/night
with lit windows and lamps, the cat, the terminal, the pipeline game, achievements, Konami
code, a music player with TODO slots, and the Moroccan details.

## Judgment calls, and why

- **Title screen is the train.** The landing view is the train crossing the plain between
  Casablanca and Benguerir with two buttons: arrive, or plain resume. The intro is therefore
  never in the way, and the resume is one click from second zero.
- **Interiors, not modals.** More work, but "enter a building" should mean entering it. The
  panel still exists as "Read this place".
- **Secrets never hide CV content.** The server room is behind a small quest, so everything
  in it is also in the Brandscan panel and the resume. Only toys are gated: the terminal,
  the red button.
- **No engine.** Canvas 2D plus about 4,500 lines of TypeScript and CSS. No runtime dependencies; the
  only assets are two small font files.
- **No invented facts.** Everything about Younes comes from `src/content.ts`. NPC banter is
  flavour and never states a fact about him. The prototype's "10+ query endpoints" was dropped
  because it isn't in the brief. Anything missing is a `TODO(younes)`.
- **No real brands in the art.** The station, train and post office are generic (cream train,
  yellow post office) rather than ONCF or Barid Al-Maghrib livery.
- **Prayer calls, flags, politics:** left out. Morocco shows up as craft and daily life
  (zellige, tea, the hanout, storks on the roof), not as symbols.
- **Reduced motion.** No screen shake, no typewriter, no train cut-scene, weather particles
  off, restore drill becomes a simple fade.

## Structure

```
index.html            static shell; the resume is injected here at build time
public/boot.js        picks resume or game mode before first paint (keeps the CSP free of inline scripts)
src/content.ts        ALL text: facts about Younes, then game flavour
src/render-html.ts    content → resume / section HTML / resume.txt (shared by build and runtime)
src/main.ts           modes (resume | game), hash routing
src/state.ts          save file (localStorage), achievements
src/bus.ts            hooks so UI toys (terminal) can poke the world
src/game/             gfx, sprites, buildings, maps, title scene, audio, input, game loop
src/ui/               dialogue, panels, ticket menu, terminal, pipeline mini-game
```
