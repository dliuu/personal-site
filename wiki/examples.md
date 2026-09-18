# Reference Wiki: 3D Web Examples

A running log of sites we're studying for the personal site. Add a new entry
per example. Every entry answers three things: **what it is**, **what's good**,
and **what we can learn**. Keep "what we can learn" honest about what actually
transfers to a one-person, fast, charming site.

Status: **Verified** = we read the shipped HTML/JS ourselves. **Curated** =
ingested from research notes; stack and details not yet checked against source.

Weight: light / medium / heavy / very heavy, as a rough load-and-complexity
budget for the visitor.

## Index

| # | Site | Category | Weight | Stack (known) | One technique to steal | Status |
|---|------|----------|--------|---------------|------------------------|--------|
| 1 | [Shopify Editions W26](https://www.shopify.com/editions/winter2026#agentic) | Corporate launch | heavy | Three, Rive, Spline, Lenis, Motion | 3D as chapter opener; baked bg + fg props split; quality tiers | Verified |
| 2 | [Tiny Skies](https://tinyskies.vercel.app/) | Playable world | heavy | Vanilla Three, Vite | Fog + toon + tiny island for cheap charm | Verified |
| 3 | [Bruno Simon](https://bruno-simon.com) | Portfolio, open source | heavy | Three, Vite ([source](https://github.com/brunosimon/folio-2025)) | Scene organisation and asset pipeline | Curated |
| 4 | [Aimee's Papercraft World](https://aimees-papercraft-world.com) | Portfolio, open source | medium | R3F, Blender, Krita ([source](https://github.com/andrewwoan/aimee-rains-papercraft-world)) | Illustration baked onto simple geometry | Curated |
| 5 | [Bilal El Moussaoui](https://bilal.show) | Scroll narrative | medium | | One committed motif (music box) | Curated |
| 6 | [Sébastien Lempens](https://sebastien-lempens.com) | Scroll narrative | heavy | | Cinematic camera cuts | Curated |
| 7 | [The Monolith Project](https://themonolithproject.net) | Scroll narrative | very heavy | Three, R3F, GSAP, custom shaders | Sketch-to-3D progression; read the Codrops write-up | Curated |
| 8 | [Ameen Abdullah](https://ameen-abdullah.dev) | Scroll narrative | medium | Vue, WebGPU | Loading screen as art direction | Curated |
| 9 | [Jay Ransijn](https://jayransijn.com) | Playable world | very heavy | | Reflections and lighting carry it | Curated |
| 10 | [Thibault Introvigne](https://www.thibault-introvigne.com) | Playable world | heavy | | Collectibles as content reveal | Curated |
| 11 | [WoraWork](https://worawork.vercel.app) | Playable world | heavy | | Warmth: cosy house-and-garden | Curated |
| 12 | [JReyes MC](https://jreyes-mc-portfolio.com) | Playable world | heavy | | Borrowed visual language (Minecraft) does personality for free | Curated |
| 13 | [Weisdevice](https://weisdevice.xyz) | Engineering | medium | Three, GLSL, Howler, GSAP | Throttled raycast, paused render loop, lazy assets | Curated |
| 14 | [Samsy](https://samsy.ninja) | Engineering | very heavy | WebGPU | Know where the frontier is, then close it | Curated |
| 15 | [Lusion](https://lusion.co) | Studio | heavy | | Cursor-reactive abstract scene that still keeps case studies central | Curated |
| 16 | [Active Theory](https://activetheory.net) | Studio | heavy | | Production WebGL that ships to mobile | Curated |
| 17 | [Resn](https://resn.co.nz) | Studio | heavy | | Each page as a short film; humour as premium | Curated |
| 18 | [Unseen Studio](https://unseen.co) | Studio | medium | | Type-led motion; restraint reads as expensive | Curated |
| 19 | [Dogstudio](https://dogstudio.co) | Studio | heavy | | Permission to make a louder choice | Curated |
| 20 | [Garden Eight](https://garden-eight.com) | Studio | light | | 3D as accent, illustration carries story | Curated |
| 21 | [Merci-Michel](https://merci-michel.com) | Studio | medium | | Egg Hunt: one mechanic, no tutorial, no menu | Curated |
| 22 | [Utsubo](https://utsubo.com) | Studio | medium | WebGPU + WebGL fallback | Byte budgets, instancing, baked lighting, BVH | Curated |
| 23 | [Psychoactive Studios](https://psychoactive.co.nz) | Studio | medium | | Performance budgeting framed as the craft | Curated |
| 24 | [Messenger](https://messenger.abeto.co) | Experience | light | Three, three-mesh-bvh, Node WS | 5.7 MB initial load for a multiplayer world | Curated |
| 25 | [Equinox](https://equinox.space) | Experience | medium | | Atmosphere, sound, pacing over spectacle | Curated |
| 26 | [Mola Zone](https://mola-zone.com) | Experience | heavy | | Rotating diorama with almost no nav UI | Curated |
| 27 | [Keita Yamada (p5aholic)](https://p5aholic.me) | Light portfolio | light | Alpine.js, Three, raw GLSL, GSAP, Tweakpane | 3D as background texture behind ordinary pages | Verified (stack) |
| 28 | [Levi Mackay](https://levimackay.com) | Light portfolio, open source | very light | Vanilla Three ([source](https://github.com/levibmackay/Portfolio)) | The realistic floor: one WebGL hero, instant load | Curated |
| 29 | [Stefan Vitasović](https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/) | Light portfolio (Codrops) | light | Next.js, dynamic imports, shaders | "Motion motifs": repeated hooks that cost no bytes | Curated |
| 30 | [Shader.se](https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/) | Studio (Codrops) | medium | R3F, TSL, WebGPU + WebGL | Selective scene rendering per viewport | Curated |
| 31 | [iTzRitual folio-2026](https://github.com/iTzRitual/folio-2026) | Portfolio, open source | medium | Three, WebGL-rendered UI | DOM/WebGL sync layer; cursor-velocity shader | Curated |
| 32 | [Obys Agency](https://obys.agency) | Studio | medium | | Editorial type composition; frames that look like posters | Curated |
| 33 | [Metabole Studio](https://metabole.studio) | Studio | light | Next.js, Sanity | One signature moment, everything else quiet | Curated |
| 34 | [Hon Tran](https://hontran.dev) | Writing | light | | Technique-to-effort map of award WebGL effects | Curated |
| 35 | [Hubtown (Unseen Studio)](https://www.awwwards.com/sites/hubtown) | Company, one object | medium | WebGL, GSAP | Single well-lit hero object + mouse reveal | Curated |

---

# Verified entries

## 1. Shopify Editions Winter '26 ("The Renaissance Edition")

- URL: https://www.shopify.com/editions/winter2026#agentic
- Added: 2026-09-18
- Type: corporate product-launch microsite, ~12 full-viewport sections

### What it is
A long-scroll narrative page. Sticky anchor nav across sections (Sidekick,
Agentic, Online, Retail, Marketing, Shipping, Finance, Checkout, Shop App,
Developer, B2B, ...). Each section: bold hero statement + 3D scene, then
expandable feature cards with "Read help doc" / "Play video" links, then a
"Back to navigation" link. The "Agentic" section is about selling inside AI
chats (ChatGPT, Copilot, Perplexity) and is structured exactly like the others.

### Stack (from shipped HTML)
- **Three.js + WebGL** for ~30 `.glb` models. Naming reveals the pipeline:
  `EW26_<Section>_<date>_compressed-optimized.glb`, plus per-section
  `<Section>_bg_diffuse` and `<Section>_fg_smaller` pairs. So: one hero
  model, one foreground props model, one baked-diffuse background per section.
- **Rive** (`.riv`, ~20 files) for 2D vector animations inside feature cards.
- **Spline** references (embedded 3D scenes for some cards).
- **Lenis** smooth scroll (`data-lenis-prevent` on the nav drawer).
- **Motion** (Framer Motion) for DOM transitions.
- Tailwind utility classes throughout.
- Runtime flags in the config blob: `forceWebGL`, `useFallbackImages`,
  `quality`, `noBloom`. They ship a quality tier system and a static-image
  fallback for devices that can't run WebGL.

### What's good
- Renaissance metaphor: serif display type for the hero wordmark (rendered as
  SVG paths), neutral off-white grounds, 3D props styled like sculptural
  objects on a plinth.
- Rhythm: big statement -> 3D moment -> dense feature list -> repeat. The 3D
  is a chapter opener, not the whole page.
- Baked lighting (`bg_diffuse` models) keeps runtime cost low; the fg props
  are the only things that need real-time shading.

### What we can learn
- Chapter structure: 3D scene as the opener for each section, text below it.
- Per-section model split (hero / props / baked background) as an asset
  convention.
- Quality tiers + image fallback baked in from day one.
- Sticky section nav with "back to top of nav" affordance.
- Lenis + scroll-driven scene transitions.

### Avoid
- 30 models and 20 Rive files is a studio's worth of assets. A personal site
  should hit the same *feeling* with 3-6 scenes.
- Tailwind soup and a 1.4 MB HTML document.

---

## 2. Tiny Skies (Danny Limanseta)

- URL: https://tinyskies.vercel.app/
- Added: 2026-09-18
- Type: browser game, single fullscreen canvas, Vibe Jam 2026 entry
  ("Built with Cursor")

### What it is
"A cosy exploration game: fly a biplane, magic carpet, or boat around a tiny
world. Light the five eternal braziers and save it from the moon." The whole
page is one canvas. NPCs with dialogue, a day/evening/night/"end times" cycle,
upgrades, photo-mode selfies, races, fishing. It's a game that happens to be a
website, and it's charming because the world is small and dense.

### Stack (from the 1.5 MB Vite bundle)
- **Vanilla Three.js** (no React, no r3f). `WebGLRenderer`, `GLTFLoader`,
  `InstancedMesh` (lots, for vegetation/props), `ShaderMaterial`,
  `MeshToonMaterial` and `MeshStandardMaterial`, the Three `Sky` and `Water`
  addons, and heavy use of `Fog` (163 mentions) to hide the world edge.
- Vite build, single JS chunk.
- Assets: 8 `.glb` models (`capybara`, `moon`, `pyramid`, `statue`,
  `hotspring`, `eternal_flame`, `moonstone_*`), 2D PNG sprites, ~50 audio
  files (music per time of day + SFX).
- Custom PNG cursor, enabled only on `(pointer: fine) and (hover: hover)`.
- Fonts: **Domine** (serif body), **Darumadrop One** (playful display),
  Inter (UI). Self-hosted TTFs.
- `overflow: hidden`, `user-scalable=no`, `viewport-fit=cover`: it owns the
  viewport completely.

### What's good
- Toon shading + fog + a tiny island = low poly count, high charm.
- The world has a *story* (braziers, moon, NPCs), so exploring has purpose.
- Audio is a first-class layer: ambient loops change with time of day.
- Progressive disclosure through movement, not scrolling.

### What we can learn
- Tiny-world framing: one small, dense 3D space that holds everything.
- Fog as both aesthetic and performance tool.
- Toon/flat materials over PBR realism.
- Custom cursor gated on pointer capability.
- Giving the space a light narrative reason to explore.
- Serif + playful display type pairing.

### Avoid
- Full game mechanics (physics, upgrades, races). A visitor should find
  "about / work / contact" in under 30 seconds.
- Locking scroll and zoom on mobile; a personal site needs to stay accessible.
- 50 audio files.

---


---

# Curated entries

Ingested 2026-09-18 from research notes. Weight, stack and claims below are
from those notes; promote an entry to Verified once we've read its source.

## Individual portfolios with published source

### 3. Bruno Simon
- URL: https://bruno-simon.com (heavy)
- Source: https://github.com/brunosimon/folio-2025 (JavaScript, Vite, ~1.9k stars). Process documented on his YouTube channel.
- **What it is**: the drivable-car portfolio that started the genre, rebuilt in 2025 with better visuals and online functionality.
- **What's good**: the concept is proven, and the full code is public.
- **What we can learn**: read the repo for scene organisation and the asset pipeline (`sources/`, `resources/`, `scripts/`), not for the concept, which everyone has copied.

### 4. Aimee's Papercraft World (Andrew Woan)
- URL: https://aimees-papercraft-world.com (medium)
- Source: https://github.com/andrewwoan/aimee-rains-papercraft-world (includes Blender files). Stack: React Three Fiber, Blender, Krita. Shipped bundle references Vite and Three.
- **What it is**: a scroll-driven path through a hand-drawn papercraft world, built as an open tutorial project.
- **What's good**: illustrated 2D assets are baked onto 3D geometry for a notebook-paper look. The charm is carried by illustration, not by shaders or polygon count.
- **What we can learn**: the single most useful technique on this list for us. If our primitive room ever needs more character, paint it instead of modelling it.

## Scroll-driven narrative

### 5. Bilal El Moussaoui
- URL: https://bilal.show (medium)
- **What it is**: a scroll-driven story following a character through a music-box environment.
- **What's good**: the clearest demonstration that one committed motif beats a pile of features.
- **What we can learn**: closest structural match to our scroll-steered room. Study how it paces reveals per scroll distance.

### 6. Sébastien Lempens
- URL: https://sebastien-lempens.com (heavy)
- **What it is**: a scroll tour through 3D Paris that cuts between first-person, riding a scooter, and skydiving while revealing skills and projects.
- **What's good**: cinematic pacing and camera cuts.
- **What we can learn**: how to cut between camera setups on scroll. Bad model for load time.

### 7. The Monolith Project (Ethan Chiu)
- URL: https://themonolithproject.net (very heavy)
- Stack: Three.js, R3F, GSAP, custom shader framework, GPU particle system, custom renderer. Written up in detail on Codrops.
- **What it is**: thirteen scenes moving from hand-drawn sketches into fully lit 3D worlds.
- **What's good**: the ceiling for R3F narrative work.
- **What we can learn**: the Codrops post is the real artifact. Read it for how scenes hand off to each other.

### 8. Ameen Abdullah
- URL: https://ameen-abdullah.dev (medium)
- Stack: Vue, WebGPU. Awwwards winner.
- **What it is**: opens with a WebGPU sakura-petal loading screen, then a sakura tree on an island surrounded by water, with work revealed on scroll.
- **What's good**: the loading screen is part of the art direction rather than an apology.
- **What we can learn**: design our loading state as the first frame of the experience.

## Playable worlds (great, but the thing we're avoiding)

### 9. Jay Ransijn
- URL: https://jayransijn.com (very heavy)
- **What it is**: a fully playable world from a design engineer with fifteen years of experience: play fetch with a dog, ride a bike, hunt for a hidden car, knock past employers' logos over.
- **What's good**: reflections and lighting are what make it. It works because the site is the portfolio piece.
- **What we can learn**: lighting quality is what separates "3D site" from "premium 3D site". Relevant to our soft-realistic direction.

### 10. Thibault Introvigne
- URL: https://www.thibault-introvigne.com (heavy; bare domain without www does not resolve)
- **What it is**: control a spaceman through a world seeded with ten collectibles, each revealing past experience or a project. Draws on Blade Runner, Cyberpunk and The Witness for a calm atmosphere.
- **What's good**: calm mood in a genre that usually shouts. He only started creative development five years ago.
- **What we can learn**: content as collectibles is a clean way to gate reveals.

### 11. Worapat Supameteeworakul (WoraWork)
- URL: https://worawork.vercel.app (heavy)
- **What it is**: a cosy Zelda/Animal Crossing house-and-garden world; interacting with objects reveals the story of a Thai interior designer turned 3D artist turned developer.
- **What's good**: best-in-class at warmth, the hardest quality to fake.
- **What we can learn**: our studio room wants exactly this warmth. Study palette, light temperature, and how objects tell biography.

### 12. JReyes MC
- URL: https://jreyes-mc-portfolio.com (heavy)
- Awwwards Honorable Mention.
- **What it is**: a Minecraft-inspired circuit you travel through on scroll, each stop opening another section.
- **What's good**: a borrowed visual language does the personality work for free.
- **What we can learn**: scroll stops that open sections is our exact mechanic; see how they signal "you've arrived".

## Individual portfolios worth studying for engineering

### 13. Xianyao Wei (Weisdevice)
- URL: https://weisdevice.xyz (medium)
- Stack: Three.js, GLSL, Howler (audio), GSAP (transitions). Codrops case study.
- **What it is**: an island with a robot whose knobs, switches and Game Boy pad you can actually play with.
- **What's good**: engineering discipline. Raycasting throttled to 30 FPS, render loop paused when a project page opens, lazy-loaded assets.
- **What we can learn**: adopt all three habits. Pausing the render loop when an overlay/project panel is open is a direct fit.

### 14. Samuel Honigstein (Samsy)
- URL: https://samsy.ninja (very heavy)
- Stack: WebGPU.
- **What it is**: a cyberpunk cityscape with first-person controls, holographic interfaces and Japanese design elements, at 120+ FPS.
- **What's good**: shows where the frontier is.
- **What we can learn**: see it once, then close it. Not our lane.

## Studio and company sites

### 15. Lusion
- URL: https://lusion.co (heavy)
- **What it is**: an abstract 3D environment that responds to the cursor and morphs on scroll to reveal project thumbnails.
- **What's good**: stays navigable and keeps case studies as the focus. Widely treated as the most influential WebGL/shader studio; particle and material work is research-grade.
- **What we can learn**: cursor reactivity that never blocks the content.

### 16. Active Theory
- URL: https://activetheory.net (heavy)
- **What it is**: game-engine thinking applied to the browser, across a decade-plus of major interactive launches.
- **What's good**: production-grade WebGL that still ships to mobile.
- **What we can learn**: the reference point for our "same 3D, reduced quality on mobile" decision.

### 17. Resn
- URL: https://resn.co.nz (heavy)
- **What it is**: playful, character-driven work where each portfolio page is treated like a short film with its own transitions.
- **What's good**: proof that weird and funny can also be premium.
- **What we can learn**: give transitions production value, even small ones.

### 18. Unseen Studio
- URL: https://unseen.co (medium)
- **What it is**: refined, type-led motion with careful pacing.
- **What's good**: restraint reads as expensive. Closest studio aesthetic to what we want: simple, charming, not a game.
- **What we can learn**: typography and pacing for the overlay panels.
- **Also**: their Hubtown project (entry 35) is the concrete example of their aesthetic applied to a single hero object.

### 19. Dogstudio
- URL: https://dogstudio.co (heavy)
- **What it is**: bold creative paired with genuine technical chops and unmistakable signature moves.
- **What's good**: confidence.
- **What we can learn**: go here when we want permission to make a louder choice.

### 20. Garden Eight
- URL: https://garden-eight.com (light)
- **What it is**: minimal, illustration-driven storytelling with a refined Japanese sensibility; 3D used as an accent, not the whole stage.
- **What's good**: fast and charming.
- **What we can learn**: probably the most directly applicable studio reference. Shows how little 3D you need if the rest is well designed.
- **Also**: their site for The Shift won Awwwards Site of the Month, a tier only a handful of sites reach each year. Restraint is explicitly the feature, not a limitation. If the brief is "less, but better", this is the reference.

### 21. Merci-Michel
- URL: https://merci-michel.com (medium)
- **What it is**: premium restraint for luxury brands from a Paris studio making browser games since 2012.
- **What's good**: their Egg Hunt: one timing mechanic, no tutorial, no menu, endlessly replayable.
- **What we can learn**: if we ever add a playful beat to the room, make it one mechanic with zero instructions.
- **Also**: 3D used sparingly and exactly. Proof that restraint is itself a 3D skill; go here for calm confidence rather than spectacle.

### 22. Utsubo
- URL: https://utsubo.com (medium)
- Stack: WebGPU with WebGL fallback.
- **What it is**: a small engineering-led studio with performance budgets set from day one.
- **What's good**: their blog is candid about byte budgets, instancing, baked lighting and BVH collision as what separates an award winner from a janky demo.
- **What we can learn**: read the blog before writing the performance section of any plan.
- **Also**: their writing on instancing, baked lighting, BVH collision and byte budgets is the most useful free material on keeping a 3D site fast. Start: https://www.utsubo.com/blog/best-threejs-websites-2026

### 23. Psychoactive Studios
- URL: https://psychoactive.co.nz (medium)
- **What it is**: award-level 3D explicitly framed around performance budgeting.
- **What's good**: their agency roundup maps who's active right now (makemepulse, Noomo, OFF+BRAND, Immersive Garden).
- **What we can learn**: use the roundup to find the next entries for this wiki.
- **Also**: roundup adds Vide Infra; makemepulse is called out for playful and performant brand work, Noomo for storytelling. https://www.psychoactive.co.nz/content-hub/best-webgl-interactive-3d-agencies

## Non-portfolio experiences worth stealing from

### 24. Messenger (Abeto: Vicente Lucendo and Michael Sungaila)
- URL: https://messenger.abeto.co (light, for what it does)
- Stack: Three.js, three-mesh-bvh, Houdini and Blender models, WebSocket multiplayer on Node.
- **What it is**: a small multiplayer game delivering parcels around a tiny round planet.
- **What's good**: loads at 5.7 MB and tops out at 17.5 MB, smaller than most "simple" portfolios.
- **What we can learn**: set a byte budget now. Ours should be well under 5 MB initial since we ship no models.
- **Also**: Awwwards Developer Site of the Year 2025 while loading, running and delighting in seconds. Physics and lighting that would sit fine in a console game. When the mechanic is strong enough, the copy nearly disappears.

### 25. Equinox (Little Workshop)
- URL: https://equinox.space (medium)
- **What it is**: an interactive space story that leans on atmosphere, sound and pacing rather than spectacle.
- **What's good**: holds attention across a longer narrative without losing people.
- **What we can learn**: pacing between our four stops; when to slow the camera and when to move.

### 26. Mola Zone (Studio 9P for Yamê)
- URL: https://mola-zone.com (heavy)
- **What it is**: an album site: a rotating platform where the artist rides a motorcycle through desert, forest and palace settings, with easter eggs and unlockable content.
- **What's good**: proof that the rotating-diorama structure works with almost no navigation UI.
- **What we can learn**: a diorama needs less UI than we might assume.

## Personal portfolios that stay light

### 27. Keita Yamada (p5aholic)
- URL: https://p5aholic.me (light). Experiments library: https://experiments.p5aholic.me
- Stack (confirmed in shipped HTML): Alpine.js, Three.js, raw GLSL for the background effect, GSAP, Tweakpane. Repos are private; study the result, not the code.
- **What it is**: ordinary pages (home, projects, contact, FAQ) with the 3D living behind them as texture. No heavy React tree, no model loading.
- **What's good**: the best single reference for "3D, charming, fast". He keeps a "copycats" page listing sites that plagiarised his source, which tells you how effective the formula is.
- **What we can learn**: 3D as background texture is a valid, cheaper alternative to our room if the room ever feels heavy. Scroll the experiments site for animation ideas.

### 28. Levi Mackay
- URL: https://levimackay.com (very light). Source: https://github.com/levibmackay/Portfolio
- Stack: Three.js vendored directly. Note: the live site now ships a hashed `/assets/main-*.js` bundle, so "no build" describes the repo's spirit more than the current deploy.
- **What it is**: single page with a WebGL hero of a sphere of shards that assembles on load and reacts to scroll, plus a hidden interactive terminal easter egg.
- **What's good**: not award-winning, and that's the point. The realistic floor of "3D, charming, loads instantly".
- **What we can learn**: one hero object + scroll reaction is enough for a floor. Keep this as the fallback ambition if the room overruns budget.

### 29. Stefan Vitasović (Lead Creative Developer, 14islands)
- URL: Codrops case study https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/ (light)
- Stack: Next.js with dynamic imports and code-splitting so heavy parts load only where needed.
- **What it is**: minimalist design with glitchy shader effects, a noisy lo-fi background and infinite scroll.
- **What's good**: "motion motifs", repeating visual hooks like the catchy part of a song.
- **What we can learn**: the cheapest way to make a site feel authored rather than assembled, and it costs no bytes. Pick one or two motifs for the overlays and camera moves. Dynamic-import the Scene in Next.js.

### 30. Shader.se (Simon Hedlund, Filip Kantedal)
- URL: https://shader.se; Codrops write-up https://tympanus.net/codrops/2026/05/19/80s-business-tech-seamless-scene-transitions-inside-shader-ses-scroll-driven-webgpu-pipeline/ (medium)
- Stack: React Three Fiber, TSL node materials compiling to both WebGPU and WebGL.
- **What it is**: a scroll-driven WebGPU pipeline with selective scene rendering and seamless scene transitions.
- **What's good**: selective rendering: only draw the scene the viewport is actually looking at.
- **What we can learn**: the technique that makes multi-section 3D viable. Our single room is simpler, but the same idea applies to culling furniture the camera cannot see at a given stop.

### 31. iTzRitual folio-2026
- URL: https://github.com/iTzRitual/folio-2026 (medium, open source)
- **What it is**: hero, details and case studies rendered through WebGL with a synced accessible HTML layer alongside; the camera eventually pulls back to reveal the whole interface running on a CRT in a 3D workstation.
- **What's good**: the deliberate inverse of our approach, done well.
- **What we can learn**: two liftable pieces even if we reject the approach: the DOM/WebGL sync layer, and the cursor-velocity shader (chromatic aberration and grid distortion on fast movement, decaying back with `MathUtils.lerp` and exponential decay).

## Studios whose own sites practice restraint

### 32. Obys Agency
- URL: https://obys.agency (medium)
- **What it is**: a benchmark for editorial art direction and typographic motion; static frames already look like posters.
- **What's good**: composition.
- **What we can learn**: where to steal layout from if we go type-as-geometry or want the overlays to feel editorial.

### 33. Metabole Studio
- URL: https://metabole.studio (light)
- Stack: Next.js, Sanity.
- **What it is**: a Paris studio whose blog argues that heavy effects should live only where they matter, so the immersive moments land.
- **What's good**: the SaaS founder story: every section trying to be the hero, nothing breathing, visitors remembering the effort instead of the message. Rebuilt with a quieter pace and one signature moment, demo requests doubled.
- **What we can learn**: our room gets one signature moment (probably the intro pull-in). The other three stops should breathe.

### 34. Hon Tran
- URL: https://hontran.dev (light)
- **What it is**: an Awwwards juror who writes an honest technique-to-effort map of the effects behind award-winning WebGL sites.
- **What's good**: notes that most winners are built from a small vocabulary combined with taste, and that image displacement, the most reused effect, is a small sharp piece of shader code. Flags Iventions and Minh Pham's portfolio as WebGL used for atmosphere and framing rather than spectacle.
- **What we can learn**: read before choosing any effect. Cheap vocabulary + taste beats novel tech.

## Company sites where 3D is one object

### 35. Hubtown (Unseen Studio)
- URL: https://www.awwwards.com/sites/hubtown (medium). Awwwards Site of the Day and Developer Award, June 2026. Stack: WebGL, GSAP.
- **What it is**: corporate site for an Indian property developer: a glowing 3D monolith over a dark reflective landscape framing a 40-year portfolio as cinematic, with a signature mouse-reveal where the cursor uncovers detail in geometry and lighting.
- **What's good**: a single well-lit hero object plus reveal-on-interaction is enough.
- **What we can learn**: the lesson we most want: one confident centrepiece, not an explorable world. Our mouse parallax could become a mouse reveal on the desk.

## Galleries to keep browsing

- https://refs.gallery/category/webgl : fastest to scan (rate-limits automated fetches).
- https://www.awwwards.com/websites/three-js : the firehose.
- https://tympanus.net/codrops/tag/case-study : highest signal. The portfolio tag has write-ups of Anatole Touvron, Bruno Arizio, Ronin161's custom toon shader, Chang Liu's wavy distortion, and HAOQI.DESIGN on scroll sync and glass shaders with DOM/CSS/WebGL interplay.
- https://tympanus.net/codrops : the rest of Codrops.
- https://www.cssdesignawards.com/website-gallery?feature=webgl : filterable by "minimal".

## The one pattern

The 2026 standouts commit to one hard idea and budget everything else around
it: a drivable physics world, audio-reactive fluid, a single object rendered
with real weight. They don't stack effects. The light, charming version we're
after is the same principle with the idea chosen to be cheap. For us the idea
is: one warm room, lit well, that the camera travels through.

Across the light examples, almost none load a character or a world. They load
a shader, a font, and some geometry generated in code. That single decision is
most of the difference between 800 KB and 18 MB. Our primitives-only room is
on the right side of that line; keep it there.

---

## Cross-cutting takeaways (verified entries)

| Axis | Shopify Editions | Tiny Skies |
|---|---|---|
| 3D role | Chapter opener per section | The entire page |
| Navigation | Scroll + sticky anchors | Free movement (fly) |
| Render style | Sculptural PBR, baked lighting | Toon + fog, low poly |
| Lib | Three + Rive + Spline + Lenis + Motion | Vanilla Three |
| Fallback | Explicit quality tiers + images | None (game) |
| Asset count | ~30 glb, ~20 riv | 8 glb, ~50 audio |

The interesting design space for us is *between* these two: a small world
(Tiny Skies) that is navigated with the discipline of a scroll narrative
(Shopify).

## TODO
- Promote curated entries to Verified by reading their source (start with 3, 4, 13, 22, 24).
- Screenshots for both entries (Chrome extension wasn't connected when these
  were ingested).
