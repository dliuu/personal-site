# personal-site

A lab for trying 3D ideas before choosing a direction. See `docs/skeleton.md`
for how it is organised and `wiki/examples.md` for references.

```bash
npm install
npm run dev      # http://localhost:3000/lab
npm run check    # typecheck + lint + tests
```

`npm run geo` re-bakes `public/geo/land.json` (Natural Earth 110m land via
world-atlas) for the instruments globe; the output is committed.

Earth textures in `public/textures/earth` are the three.js example planet set
(MIT), derived from NASA Blue Marble imagery.

## The baked room

The intro room's static shell and furniture are modelled, lit and baked in
Blender by `scripts/room/build.py` (CC0 textures and an HDRI from Poly Haven,
fetched into `assets/room/cache`), then packed for the web:

```bash
brew install --cask blender     # once
blender -b --python scripts/room/build.py -- --samples 256 --preview
node scripts/room/pack.mjs      # Draco + WebP -> public/models/room.glb
```

`--preview` also renders `assets/room/out/preview.png` (day) and `preview_evening.png`
(lamp on) from the resting camera. The bake writes two atlases (day, evening) and
`garden.jpg`, the view through the glass, cut from the same HDRI.
Props: `node scripts/room/fetchProps.mjs <poly-haven-id> …` pulls CC0 models at 1k
into `assets/room/props/<id>/`; `assets/room/props/manifest.json` places them
(`{ file, position, rotationY, scale }`, three.js coordinates); rebake to include
them. Any GLB dropped there works the same way. The Draco decoder in
`public/draco` is copied from the three.js package.

To add an experiment: create `lab/<slug>/index.tsx` and `README.md`, add an
entry to `lab/registry.ts` and a loader to `lab/loaders.tsx`.

Deploy: `vercel.json` pins the framework because the Vercel project was
linked before the app existed.

## Screenshots

Render each chapter of a route to PNGs with headless Chromium (software WebGL), so
visual changes can be checked without a browser session:

```bash
npm run shots:install        # once: downloads Chromium for Playwright
npm run dev                  # in another terminal
npm run shots                # /lab/instruments at 1440×900, 1280×720, 390×844
npm run shots -- --route /lab/chapters --motion --full
```

Output lands in `shots/<route>/<w>x<h>/NN-<section>.png` (gitignored). Plate sections
(`data-kind="plate"`) are captured once per beat (60 % through it) as `NN-<section>-b0…bN.png`, plus `-in` and `-out` for the entry and exit.
Reduced motion is on by default for deterministic frames; `--motion` restores idle animation.
