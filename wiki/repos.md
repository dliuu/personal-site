# Reference Wiki: Portfolio Repos with Source

Companion to `examples.md` (live sites) and `best-practices.md`. These are
repositories you can read. Stars, licence and last push were checked against
the GitHub API on 2026-09-19; the notes column is curated.

**Licence key.** MIT: reuse freely with attribution. NONE: no licence file,
default copyright, read but do not lift. Custom: a non-standard licence file;
read it before copying anything (summarised per entry below).

## Index

| Repo                                                                                                        | Stars | Licence                          | Last push | Live                        | One thing to read it for                                                             |
| ----------------------------------------------------------------------------------------------------------- | ----- | -------------------------------- | --------- | --------------------------- | ------------------------------------------------------------------------------------ |
| [brunosimon/folio-2019](https://github.com/brunosimon/folio-2019)                                           | 4.7k  | MIT                              | 2024-05   |                             | Physics integration, scene structure of the original drivable-car folio              |
| [brunosimon/folio-2025](https://github.com/brunosimon/folio-2025)                                           | 1.9k  | MIT                              | 2026-04   | bruno-simon.com             | Modern asset pipeline (ETC1S/KTX2, Draco), 23-stage game loop, instancing            |
| [brunosimon/my-room-in-3d](https://github.com/brunosimon/my-room-in-3d)                                     | 4.5k  | NONE                             | 2023-09   | my-room-in-3d.vercel.app    | Baked-lighting room with live screens; the fast-warm-scene trick                     |
| [bizarro/bruno-arizio](https://github.com/bizarro/bruno-arizio)                                             | 465   | NONE                             | 2025-02   | brunoarizio.com             | Production creative-dev code behind a Codrops case study                             |
| [bizarro/bizar.ro](https://github.com/bizarro/bizar.ro)                                                     | 219   | NONE                             | 2025-02   | 2020.bizarro.dev            | Page transitions and WebGL image effects done properly                               |
| [HamishMW/portfolio](https://github.com/HamishMW/portfolio)                                                 | 3.5k  | MIT                              | 2024-11   | hamishw.com                 | Best-engineered reusable codebase here; 3D as accent, content in DOM                 |
| [davidhckh/portfolio-2025](https://github.com/davidhckh/portfolio-2025)                                     | 864   | Custom (permissive, attribution) | 2026-08   | david-hckh.com              | Three.js with Vue; shows what R3F abstracts away                                     |
| [MoncyDev/Portfolio-Website](https://github.com/MoncyDev/Portfolio-Website)                                 | 1.1k  | Custom (reference only)          | 2026-03   | moncy.dev                   | Heavier interaction-forward 3D with full source                                      |
| [ITomPoland/portfolio-itom](https://github.com/ITomPoland/portfolio-itom)                                   | 399   | MIT                              | 2026-09   | itomdev.com                 | Immersive R3F portfolio, permissive, actively maintained                             |
| [mohitvirli/mohitvirli.github.io](https://github.com/mohitvirli/mohitvirli.github.io)                       | 389   | NONE                             | 2026-09   | clevir.li                   | R3F + drei + GSAP, small enough to read in a sitting                                 |
| [Giats2498/giats-portfolio](https://github.com/Giats2498/giats-portfolio)                                   | 132   | Custom (MIT text)                | 2025-06   | giats.me                    | Next.js + R3F + GSAP developer portfolio, award-winning, closest in shape to ours    |
| [iTzRitual/folio-2026](https://github.com/iTzRitual/folio-2026)                                             | 21    | Custom (attribution)             | 2026-09   | folio-2026-alpha.vercel.app | WebGL-rendered UI with synced DOM, cursor-velocity shader; README is a real write-up |
| [levimackay/Portfolio](https://github.com/levimackay/Portfolio)                                             | 0     | MIT                              | 2026-09   | levimackay.com              | The floor: no-build HTML/CSS/JS, vendored Three, hidden terminal                     |
| [andrewwoan/aimee-rains-papercraft-world](https://github.com/andrewwoan/aimee-rains-papercraft-world)       | 188   | MIT                              | 2026-09   | aimees-papercraft-world.com | Baked illustration on geometry, Blender files included, written to be read           |
| [andrewwoan/abigail-bloom-portolio-bokoko33](https://github.com/andrewwoan/abigail-bloom-portolio-bokoko33) | 540   | MIT                              | 2024-03   | vercel demo                 | Annotated, legal recreation of bokoko33's private-source portfolio                   |
| [andrewwoan/woan-minecraft-folio](https://github.com/andrewwoan/woan-minecraft-folio)                       | 40    | MIT                              | 2025-08   | woanminecraftfolio.com      | Borrowing a visual language wholesale, small and complete                            |
| [brunosimon/three.js-tsl-sandbox](https://github.com/brunosimon/three.js-tsl-sandbox)                       | 207   | NONE                             | 2026-08   |                             | TSL examples: custom materials without hand-written GLSL                             |
| [brunosimon/infinite-world](https://github.com/brunosimon/infinite-world)                                   | 635   | NONE                             | 2023-02   | infinite-world.vercel.app   | Generation over assets                                                               |
| [brunosimon/threejs-template-complex](https://github.com/brunosimon/threejs-template-complex)               | 293   | NONE                             | 2022-12   |                             | Project scaffolding from someone who has built this many times                       |
| [brunosimon/three.js-tsl-template](https://github.com/brunosimon/three.js-tsl-template)                     | 93    | NONE                             | 2025-03   |                             | TSL-era scaffolding                                                                  |

Corrections to the notes we ingested: the Levi Mackay repo is `levimackay/Portfolio`
(no `b`), it has 0 stars, and it is MIT. `Giats2498/giats-portfolio` carries an
MIT-text licence file that GitHub does not auto-detect.

---

## Shipped, real sites with full source

### brunosimon/folio-2019

- **What it is**: the original drivable-car portfolio, complete. MIT.
- **What's good**: the most-studied Three.js portfolio in existence; the licence means you can actually reuse it, which is rare on this list.
- **What we can learn**: physics integration and scene structure. The code is older; read it for how the pieces fit, not for current practice.

### brunosimon/folio-2025

- **What it is**: the current bruno-simon.com. MIT.
- **What's good**: modern pipeline. `sources/`, `resources/`, `scripts/`, `static/`; a `compress` script (GLB ETC1S at quality 255, textures to ETC1S/WebP); Blender export presets; a 23-stage game loop from input to render to performance monitoring; instancing for repeated props. (Confirmed from the README, see `examples.md` entry 3.)
- **What we can learn**: the more useful of the two for modern practice. The stage-ordered loop and the compression script are directly liftable ideas.

### brunosimon/my-room-in-3d

- **What it is**: a baked-lighting 3D room whose screens display live content. No licence.
- **What's good**: pre-baked textures instead of real-time lighting is exactly the trick that lets a warm, detailed scene load fast. `best-practices.md` §Efficiency 1 is this repo in one sentence.
- **What we can learn**: the single most relevant repo to a "one desk object" direction if we ever return to it. Read it, don't lift it.

### bizarro/bruno-arizio and bizarro/bizar.ro

- **What they are**: Bruno Arizio's 2019 portfolio (behind the Codrops case study) and Luis Bizarro's 2020–2023 portfolio, both open-sourced. No licence.
- **What's good**: production creative-dev code from people who do this professionally. It reads very differently from tutorial code.
- **What we can learn**: page transitions and WebGL image effects done properly; how a pro structures a shipped site.

### HamishMW/portfolio

- **What it is**: React + Three.js personal site. MIT.
- **What's good**: unusually well-engineered for a personal site; the highest-quality reusable codebase here. Leans light: 3D as accent, real content in the DOM, which is our current direction.
- **What we can learn**: engineering conventions and how little 3D a good site needs. Last push late 2024, so expect dependency updates.

### davidhckh/portfolio-2025

- **What it is**: Three.js with Vue rather than React. Custom licence: permissive with attribution (copyright notice plus a link to the original portfolio).
- **What we can learn**: precisely because it is not R3F, it shows what the R3F abstraction does for you.

### MoncyDev/Portfolio-Website

- **What it is**: a heavier, interaction-forward 3D experience with full source. Custom "Personal Portfolio License": public for learning and reference only.
- **What we can learn**: read for mechanics; do not copy.

### ITomPoland/portfolio-itom

- **What it is**: immersive R3F portfolio. MIT, actively maintained (last push this month).
- **What we can learn**: one of the few recent ones with a permissive licence; a live reference for current R3F/drei idioms.

### mohitvirli/mohitvirli.github.io

- **What it is**: R3F, drei and GSAP. No licence.
- **What we can learn**: small enough to read in one sitting; a clean example of the three libraries together.

### Giats2498/giats-portfolio

- **What it is**: Next.js + R3F + GSAP, award-winning. MIT text in the licence file.
- **What we can learn**: closest in shape to what we are building: a developer portfolio rather than a world, on our stack.

### iTzRitual/folio-2026

- **What it is**: UI rendered in WebGL with a synced accessible DOM layer, a cursor-velocity shader, and a CRT-workstation reveal. Custom attribution licence.
- **What we can learn**: the README is a genuine technical write-up. The DOM/WebGL sync layer and the cursor-velocity shader are the liftable pieces (see `examples.md` entry 31).

### levimackay/Portfolio

- **What it is**: single-page, no-build HTML/CSS/JS with a Three.js hero and a hidden terminal easter egg, Three vendored under `assets/vendor/`. MIT.
- **What we can learn**: the floor of the format, and a sanity check on how much tooling you actually need.

## Andrew Woan's repos, written to be read

### andrewwoan/aimee-rains-papercraft-world

- MIT, updated this month, live, with the Blender files included. The baked-illustration-on-geometry technique is the cheapest route to real personality (`best-practices.md` §Interest 1).

### andrewwoan/abigail-bloom-portolio-bokoko33

- A full, annotated recreation of bokoko33's portfolio. MIT. A legal, readable clone of a site whose real source is private, which is why it has more stars than the original author's repos.

### andrewwoan/woan-minecraft-folio

- Small, complete, MIT. A clean example of borrowing a visual language wholesale.

## Bruno's non-portfolio repos worth stealing from

- **three.js-tsl-sandbox**: examples in TSL, Three's node-based shading language. If we want custom materials without hand-writing GLSL (our halftone effect is hand-written), this is the current path.
- **infinite-world**: procedurally generated terrain. Not a portfolio, but generation-over-assets is the philosophy we committed to.
- **threejs-template-complex** and **three.js-tsl-template**: scaffolding from someone who has built this many times.

## The trap

Searching "3D portfolio" on GitHub returns mostly the JS Mastery tutorial family:
[adrianhajdin/project_3D_developer_portfolio](https://github.com/adrianhajdin/project_3D_developer_portfolio) (7.1k stars, no licence, last push 2024-10), plus `3D_portfolio`, `threejs-portfolio` and hundreds of near-identical forks. Same for
[ladunjexa/reactjs18-3d-portfolio](https://github.com/ladunjexa/reactjs18-3d-portfolio) (763, MIT, 2024-12) and
[fireship-io/threejs-scroll-animation-demo](https://github.com/fireship-io/threejs-scroll-animation-demo) (1.7k, no licence, 2024-07).
They are fine tutorials and terrible references: a recruiter who has seen two of those sites has seen yours. Read them for mechanics if you want; don't let the aesthetic leak in.

## Legal note

- **MIT, reusable with attribution**: both Bruno Simon folios, all three Andrew Woan repos, HamishMW, ITomPoland, levimackay, ladunjexa.
- **No licence, read-only**: my-room-in-3d, both bizarro repos, mohitvirli, the four Bruno non-portfolio repos, adrianhajdin, fireship.
- **Custom licence, read the file first**: davidhckh (permissive with attribution), MoncyDev (reference only), Giats2498 (MIT text), iTzRitual (attribution).

Keita Yamada's copycats page (`examples.md` entry 27) exists for a reason. The community notices.

## What to read first for our direction

1. HamishMW/portfolio: 3D as accent, content in DOM, well engineered. Our model.
2. Giats2498/giats-portfolio: our stack, our shape.
3. iTzRitual/folio-2026 README: the cursor-velocity shader, for a possible motion motif.
4. brunosimon/three.js-tsl-sandbox: if the halftone or a future effect outgrows hand-written GLSL.
