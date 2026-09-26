# personal-site

One scene, served at `/`: the professional profile as a codex — a 3D studio room you
are pulled into, then Eisen's software factory, then Meta's globe. See `scene/README.md`
for what it is made of, `docs/decisions.md` for how it got there, and `wiki/examples.md`
for the references it is built against.

```bash
npm install
npm run dev      # http://localhost:3000
npm run check    # typecheck + lint + format + tests
```

`npm run geo` re-bakes `public/geo/land.json` (Natural Earth 110m land via
world-atlas) for the globe; the output is committed.

Earth textures in `public/textures/earth` are the three.js example planet set
(MIT), derived from NASA Blue Marble imagery.

## The baked room

The intro room's static shell and furniture are modelled, lit and baked in
Blender by `scripts/room/build.py` (CC0 textures and an HDRI from Poly Haven,
fetched into `assets/room/cache`), then packed for the web:

```bash
brew install --cask blender     # once
blender -b --python scripts/room/build.py -- --samples 256 --preview
npm run assets                  # Draco + WebP -> public/models/room.glb
```

`--preview` also renders `assets/room/out/preview.png` from the resting camera.
Props: `node scripts/room/fetchProps.mjs <poly-haven-id> …` pulls CC0 models at 1k
into `assets/room/props/<id>/`; `assets/room/props/manifest.json` places them
(`{ file, position, rotationY, scale }`, three.js coordinates); rebake to include
them. Any GLB dropped there works the same way. The Draco decoder in
`public/draco` is copied from the three.js package.

`npm run assets` is the only way models are built, and `lib/loadModel.ts` is the
only place they are loaded. It holds every model to **2 MiB** (8 MiB for all of
them) and exits non-zero if one is over; `npm run assets:check` checks the
committed files without needing Blender. See `assets/MANIFEST.md` for the
inventory, the source chain and how to add an asset.

Deploy: `vercel.json` pins the framework because the Vercel project was
linked before the app existed.

## Screenshots

Render each chapter to PNGs with headless Chromium on the real GPU, so visual
changes can be checked without a browser session:

```bash
npm run shots:install        # once: downloads Chromium for Playwright
npm run dev                  # in another terminal
npm run shots                # / at 1440×900, 1280×720, 390×844 (~30 s)
npm run shots -- --section intro-plate   # one section, while iterating on it
npm run shots -- --motion --full
```

Output lands in `shots/<route>/<w>x<h>/NN-<section>.png` (gitignored). Plate sections
(`data-kind="plate"`) are captured once per beat (60 % through it) as `NN-<section>-b0…bN.png`, plus `-in` and `-out` for the entry and exit.
Reduced motion is on by default for deterministic frames; `--motion` restores idle animation.

Each plate also gets `NN-<section>-sheet.png`: its frames as one labelled grid,
so a beat arc can be read as a whole instead of as a folder of stills.

**Frames are stepped, not waited for.** The script loads the page with `?still`,
which puts the frameloop under its control (`lib/still.ts`,
`components/Stepper.tsx`): each capture advances the clock by exactly
`--settle` frames (60 by default) of 1/60 s and renders, so the same commit
gives byte-identical PNGs on any machine, and the Leva and stats panels stay
out of frame. `--live` gives that up for the old wall-clock waits.

Chromium reaches the GPU through ANGLE's platform default — Metal on macOS,
about 2 ms a frame against SwiftShader's 300, and the same renderer the site is
looked at in. `--swiftshader` falls back to software for a machine without a
usable GPU.

`window.__still` also answers questions about the frame on screen, which is
otherwise guesswork from a PNG:

- `window.__still.pick(x, y)` — what is under this pixel: every visible mesh the
  ray hits, nearest first, with its geometry, material and world hit point.
- `window.__still.boxes()` — the world bounding box of every visible mesh, for
  finding things that intersect each other or float.

Both are how the desk lamp was found standing inside the second monitor.
