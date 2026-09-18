# Skeleton Spec: a local lab for trying 3D ideas

Date: 2026-09-18
Status: proposed
Related: `wiki/examples.md` (references), `superpowers/specs/` (the current
candidate direction, local only)

## 1. Purpose

Get to a state where the loop is: chat with Claude Code, implement an idea,
run `npm run dev`, look at it in the browser, keep or discard. The skeleton
must make a new idea cheap to try and cheap to throw away, without deciding
the final direction of the site.

Success looks like this, verified by running it:

1. `npm run dev` starts in under 10 seconds and hot-reloads.
2. `/lab` lists every experiment with a one-line description.
3. `/lab/hello-cube` renders a lit spinning cube with a tuning panel.
4. `/lab/scroll-path` moves a camera along a curve as the page scrolls.
5. `npm run check` (typecheck + lint + unit tests) passes.
6. Pushing to `main` produces a Vercel preview URL.

## 2. What the skeleton is not

- Not the final site. The home route (`/`) is a placeholder that links to
  `/lab` until a direction is chosen.
- No 3D models, textures beyond procedural ones, audio, MDX, or CMS. Those
  arrive with a chosen direction, not before.
- No post-processing, physics, or WebGPU. Any experiment that needs one adds
  the dependency in its own commit so it can be reverted alone.

## 3. Stack

Pinned to the decisions already made, minus anything direction-specific.

| Layer       | Choice                                             | Why                                                                                            |
| ----------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Framework   | Next.js (App Router, TypeScript)                   | Vercel-native, code-splitting via `next/dynamic`, MDX later without a rewrite                  |
| 3D          | `three`, `@react-three/fiber`, `@react-three/drei` | Declarative scenes; drei covers cameras, shadows, environment, text, HTML anchors              |
| Live tuning | `leva`                                             | Sliders for lights, colours, camera keyframes while previewing. Removed from production builds |
| State       | `zustand`                                          | One small store shared by scene and DOM overlays                                               |
| Tests       | `vitest`                                           | Pure logic only (curves, progress mapping, tier selection)                                     |
| Lint/format | ESLint (next config) + Prettier                    | Keep diffs about the idea, not formatting                                                      |
| Hosting     | Vercel                                             | Preview URL per push                                                                           |

Styling: CSS Modules or plain global CSS. No Tailwind; the references we
liked most are hand-styled and the overlays are few.

## 4. Repository layout

```
app/
  layout.tsx                 # fonts, global CSS, nothing else
  page.tsx                   # placeholder home: title + link to /lab
  lab/
    page.tsx                 # lists experiments from lab/registry.ts
    [slug]/page.tsx          # loads one experiment by slug (dynamic, ssr: false)
components/
  Stage.tsx                  # the shared Canvas wrapper (see 5.1)
  Overlay.tsx                # DOM panel positioned over the canvas (see 5.3)
  ScrollTrack.tsx            # tall spacer + scroll listener -> store
hooks/
  useScrollProgress.ts       # reads progress from the store
  useReducedMotion.ts
lib/
  progress.ts                # clamp, lerp, progressToSection
  cameraPath.ts              # buildCurves(keyframes), sampleAt(t)
  quality.ts                 # pickInitialTier(signals)
store/
  useLabStore.ts             # { rawProgress, progress, tier, reducedMotion }
lab/
  registry.ts                # Experiment[] { slug, title, description, load }
  hello-cube/
    index.tsx                # export default function HelloCube()
    README.md                # what this tries, what we learned
  scroll-path/
    index.tsx
    README.md
docs/
  skeleton.md                # this file
  decisions.md               # running log: what we tried, kept, dropped
wiki/
  examples.md
```

## 5. Shared pieces (the only code that is not an experiment)

### 5.1 `Stage`

A `Canvas` with sensible defaults so every experiment starts from the same
baseline and only overrides what it is testing.

- Props: `children`, `shadows?`, `fog?: { color, near, far }`,
  `background?`, `frameloop?: 'always' | 'demand'`, `cameraPosition?`.
- Applies the quality tier from the store: `dpr` 1 on `low`, up to 2 on
  `high`; shadows only on `high`.
- Wraps children in `<Suspense>` and, in development, mounts drei
  `<Stats/>` and a `<Perf/>`-style frame-time readout.
- Wraps a `<Leva/>` panel that is hidden in production.
- Renders a `WebGLFallback` (plain text: "3D unavailable") when context
  creation fails.

### 5.2 `ScrollTrack` and `useScrollProgress`

- `ScrollTrack` takes `pages: number`, renders a spacer of `pages * 100vh`,
  and writes `rawProgress` in [0, 1] to the store on a passive scroll
  listener.
- `useScrollProgress()` returns `{ raw, smoothed }`. `smoothed` is lerped
  each frame inside the experiment's `useFrame`, not in React state, so it
  never re-renders the tree.
- Reduced motion: `smoothed === raw`.

### 5.3 `Overlay`

A DOM panel that sits over the canvas: `position: fixed`, pointer events
only on its own children, a translucent background for contrast, and an
`inert` attribute when `visible` is false. Used to prove the "3D behind,
real DOM in front" model works before any real content exists.

### 5.4 `lib/*` pure functions

Written first, with Vitest tests, because they are the parts that are easy
to get subtly wrong and hard to see:

- `clamp01`, `lerp`, `progressToSection(progress, count)`.
- `buildCurves(keyframes)` returning Catmull-Rom curves for position and
  target; `sampleAt(curves, t)`.
- `pickInitialTier({ touch, cores, memory })`.

## 6. The lab

### 6.1 Registry

```ts
export type Experiment = {
  slug: string;
  title: string;
  description: string; // one line, shown on /lab
  added: string; // ISO date
  load: () => Promise<{ default: React.ComponentType }>;
};
```

`/lab` renders the list. `/lab/[slug]` finds the entry, calls `load()` via
`next/dynamic` with `ssr: false`, and renders it full-viewport. Unknown slug
returns 404.

### 6.2 Experiment contract

An experiment is a folder under `lab/` with an `index.tsx` default export
and a `README.md`. It may use `Stage`, `ScrollTrack`, `Overlay`, the store,
and `lib/*`. It must not import from another experiment; copy instead.
Anything shared by two experiments gets promoted to `components/` or
`lib/` in its own commit.

The README has three headings: **Trying**, **Result**, **Keep / Drop**.
Filling in the last two is how an idea gets decided.

### 6.3 Starter experiments

Shipped with the skeleton so there is something to look at on day one, and
so each shared piece has a consumer that proves it works.

| Slug             | Trying                                                                                                                          | Proves                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `hello-cube`     | A lit cube with leva sliders for light colour, intensity, roughness                                                             | `Stage`, leva, tier DPR                                                                   |
| `scroll-path`    | Four boxes in a row; camera follows a Catmull-Rom path through four keyframes on scroll; an `Overlay` shows the active index    | `ScrollTrack`, `cameraPath`, `progressToSection`, `Overlay`, reduced motion               |
| `lighting-bench` | An empty room from primitives (floor, two walls, window hole) with one directional light, contact shadows, and fog, all on leva | Whether primitive geometry plus lighting can look "soft realistic" before we commit to it |

`lighting-bench` is the first real question from the current candidate
direction. If it fails to look good, the direction changes before any more
of it is built.

### 6.4 Adding an experiment (the loop)

1. Say the idea in chat.
2. Claude adds `lab/<slug>/index.tsx` and `README.md` (Trying filled in),
   registers it, and runs `npm run check`.
3. Open `/lab/<slug>` in the browser.
4. Decide. Fill in Result and Keep / Drop. One line in `docs/decisions.md`.
5. Dropped experiments stay in the repo until the direction is chosen, then
   get deleted in one sweep.

## 7. Scripts

| Script      | Does                                 |
| ----------- | ------------------------------------ |
| `dev`       | `next dev`                           |
| `build`     | `next build`                         |
| `typecheck` | `tsc --noEmit`                       |
| `lint`      | `next lint`                          |
| `test`      | `vitest run`                         |
| `check`     | typecheck, lint, test, in that order |

## 8. Performance guardrails from day one

Cheap to add now, expensive to retrofit. From the wiki's lighter entries.

- `next/dynamic` with `ssr: false` for every canvas; the DOM shell renders
  first.
- `frameloop="demand"` available on `Stage`; `scroll-path` uses it to prove
  the invalidate-on-change pattern.
- A byte budget written into `docs/decisions.md` at skeleton time: initial
  JS under 600 KB gzipped, no single asset over 1 MB. Checked by eye with
  `next build` output until it matters enough to automate.
- Quality tier picked at load; live downgrade via drei `PerformanceMonitor`
  is deferred until an experiment actually needs it.

## 9. Out of scope for the skeleton

- The final home page, content, MDX, or any real copy.
- Playwright. One smoke test can come with the chosen direction.
- Custom cursor, audio, post-processing, physics, models.
- Analytics, SEO beyond a title tag.

## 10. Build order

Each step ends with something you can run or see.

1. `create-next-app` with TypeScript, ESLint, App Router, no Tailwind.
   Verify: `npm run dev` serves the placeholder home.
2. Add three, r3f, drei, leva, zustand, vitest, prettier. Add `check`
   script. Verify: `npm run check` passes on the empty app.
3. `lib/progress.ts`, `lib/cameraPath.ts`, `lib/quality.ts` with tests.
   Verify: `npm test` green.
4. Store, `Stage`, `WebGLFallback`. Verify: nothing visible yet;
   typecheck passes.
5. Registry, `/lab`, `/lab/[slug]`, `hello-cube`. Verify: cube spins,
   sliders work, 404 on bad slug.
6. `ScrollTrack`, `useScrollProgress`, `Overlay`, `scroll-path`.
   Verify: scrolling moves the camera; overlay index changes; reduced
   motion snaps.
7. `lighting-bench`. Verify: by eye, against the wiki references.
8. `docs/decisions.md` with the byte budget and the first three entries.
   Push; confirm the Vercel preview builds.
