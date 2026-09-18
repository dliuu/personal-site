# Decisions

One line per decision, newest last. Experiments record their own verdicts in
their README; this file records what changed the project's direction.

## Budgets

- Initial JS (home and /lab): under 600 KB gzipped.
- Any experiment route: under 1 MB gzipped first load.
- No single static asset over 1 MB.
- Check by reading `next build` output until it matters enough to automate.
- 2026-09-18 measured: `next build` (Next.js 16.3.5, Turbopack) prints only the
  route tree, no First Load JS/size column; not printed by next build 16,
  measure via browser devtools.

## Log

- 2026-09-18: Skeleton built. Next.js 16 + r3f 9 + drei + leva + zustand + vitest. npm, no Tailwind.
- 2026-09-18: Home page is a placeholder until a direction is chosen. Ideas go in /lab.
- 2026-09-18: The studio-room design (local spec) is demoted to a candidate; lighting-bench decides whether it proceeds.
- 2026-09-18: Vercel deployment protection is on; preview URLs need a logged-in browser. Curl checks see 302 to SSO.
