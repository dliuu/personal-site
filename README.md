# personal-site

A lab for trying 3D ideas before choosing a direction. See `docs/skeleton.md`
for how it is organised and `wiki/examples.md` for references.

```bash
npm install
npm run dev      # http://localhost:3000/lab
npm run check    # typecheck + lint + tests
```

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

Output lands in `shots/<route>/<w>x<h>/NN-<section>.png` (gitignored). Reduced motion is
on by default for deterministic frames; `--motion` restores idle animation.
