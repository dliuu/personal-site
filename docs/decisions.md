# Decisions

One line per decision, newest last. Experiments record their own verdicts in
their README; this file records what changed the project's direction.

## Budgets

- Initial JS (home and /lab): under 600 KB gzipped.
- Any experiment route: under 1 MB gzipped first load.
- No single static asset over 1 MB.
- Check by reading `next build` output until it matters enough to automate.
- 2026-09-18 measured: `next build` on Next 16 prints no size table; measure first-load JS in browser devtools (Network, JS, gzipped) when it matters.

## Log

- 2026-09-18: Skeleton built. Next.js 16 + r3f 9 + drei + leva + zustand + vitest. npm, no Tailwind.
- 2026-09-18: Home page is a placeholder until a direction is chosen. Ideas go in /lab.
- 2026-09-18: The studio-room design (local spec) is demoted to a candidate; lighting-bench decides whether it proceeds.
- 2026-09-18: Vercel deployment protection is on; preview URLs need a logged-in browser. Curl checks see 302 to SSO.
- 2026-09-18: Implementation deviates from docs/skeleton.md §4/§5.2/§6.1 on purpose: registry metadata (`lab/registry.ts`) and dynamic loaders (`lab/loaders.tsx`) are split because `ssr:false` must live in a client module; `useScrollProgress` returns `{ step }` for use inside `useFrame`; `lint` is `eslint .` because Next 16 removed `next lint`.
- 2026-09-19: Direction changed from a 3D room to editorial chapters over one fixed canvas (Shopify Editions model, wiki entry 1). Theme is a halftone post pass carried into type and palette. studio-room stays in the lab (PR #2) as the rejected comparison. Added postprocessing + @react-three/postprocessing.
- 2026-09-18: studio-room experiment added as the candidate direction. Reduced-motion transition kill-switch added to globals.css for all experiments.
- 2026-09-20: instruments experiment added as a Renaissance variant of chapters (instrument heroes, engraving post effect, draw-in, codex DOM). Section store and hook promoted to shared code.
- 2026-09-20: instruments: draw-in scales whole solid/line roots (per-part scaling exploded the assemblies); mech axis is per instrument; engraving AA is box-filtered.
- 2026-09-20: instruments carries the professional profile (five chapters). Astrolabe and gear train retired; balance, globe and bridge added.
- 2026-09-20: Added a headless screenshot loop (Playwright + SwiftShader WebGL) so visual fixes can be made by sight; outputs in shots/ are gitignored.
- 2026-09-20: explore: hero region reserved beside the column (lib/heroRegion.ts); per-chapter palette via canvas uniforms and inline CSS variables; hotspot notes via drei Html; drag-to-turn; .instruments is pointer-transparent again (chapters removed the same scaffolding in dc2fa70 when nothing in the canvas was interactive).
- 2026-09-21: plates: a chapter may own a plate section (`kind: "plate"`, 300vh, linear pinned progress) where its instrument expands to full screen and scroll scrubs beats read from an imperative `plateState` singleton (not the store: it is written and read inside `useFrame`). Only Meta has a plate for now; Eisen and WCP plates are storyboarded in the spec. Plate captions sit in a paper cartouche because the beat-1 close-up puts hatching behind the text.
