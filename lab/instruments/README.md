# instruments

## Trying

The professional profile as a codex: five chapters (intro, Eisen, Meta, Washington Capital Partners, contact), each job with an instrument of its trade: a live agent network on the screen, a globe with 48 locale pins, a stone bridge whose keystone drops in.

Eisen (chapter II) is a SKELETON of the software factory as an orchestrator-worker network: five orchestrator agents, meshed to each other, each spin up their own fan of worker containers. A task packet goes down the edge, the worker runs, a deterministic verdict lights it green or red, the result packet comes back up, and a failure flashes the orchestrator, which spins up the next container in that slot. Pillars carry it all on a substrate grid. Its plate has three beats, one per bullet, each anchored on a layer (`lab/instruments/Network.tsx`, pure logic in `lib/network.ts`). Placeholders: the Eisen bullet wording, orchestrator and worker counts, pass rate and colours, and the beat captions are owner input; the balance instrument stays in the file, unused.

Spec: `superpowers/specs/2026-09-20-instruments-design.md` (local).
Spec: `superpowers/specs/2026-09-20-profile-design.md` (local).

What to judge: does each instrument read as its trade; does the hero hold while a long chapter is read; do the role chapters fit at 1280×720 and 390 px wide.

Deviations from the spec:

- Contour opacity settles at 0.5 (spec said 0.15) so ink hairlines survive the engraving pass.
- Intro draw-in uses a frame-rate-independent lerp (0.05 at 60 Hz reference).
- Instruments render twice, as a solid root and a line root, scaled about the instrument origin.
- Balance tilt is a damped single swing `0.22·sin(2πu)·(1−u)` that settles at the chapter centre (spec said `sin(base)·0.22`).
- Each instrument has its own FIT half-width, so wide assemblies shrink into the hero region instead of sharing one scale.
- On phones, a section taller than the viewport fades every hero to a watermark as it is read: `depth` drives a smoothstep band 0.28–0.55, contours floor at 0.12 opacity, solids drop out below 0.6, and the fade itself is lerped so a section change does not pop.
- Phone hero scale is capped at 0.5.
- Hotspots are hidden on phones for sections taller than the viewport.
- `pointer-events: none` sits on `.instruments` (the content wrapper over the canvas), not the section, so the page still scrolls while markers stay clickable.
- Hotspot notes open on click or focus and close on Escape or a click outside the marker and its card.
- The r3f store's `viewport` is computed at camera z = 6 while the camera dollies to 5.6, so heroes are up to ~7% larger than `heroPlacement` assumes.

## Result

_(fill in after viewing)_

## Keep / Drop

_(fill in)_
