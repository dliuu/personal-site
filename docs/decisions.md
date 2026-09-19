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
- 2026-09-19: Direction changed from a 3D room to editorial chapters over one fixed canvas (Shopify Editions model, wiki entry 1). Theme is a halftone post pass carried into type and palette. studio-room lives on its own branch (PR #2) as the rejected comparison. Added postprocessing + @react-three/postprocessing.
