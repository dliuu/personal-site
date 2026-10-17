# instruments

The professional profile as a codex: five chapters (intro, Eisen, Meta, Washington Capital Partners, contact), each job with an instrument of its trade: a clearing-house machine on the screen, a globe with 48 locale pins, a construction site whose towers rise and whose crane sets the cap last.

Eisen (chapter II) is the Clearing Works: an Anatomy-style isometric SVG figure drawn on the chapter's dark screen (`instruments/ClearingWorks.tsx`, pure logic in `lib/clearingWorks.ts`), replacing the network skeleton (`instruments/Network.tsx` and `lib/network.ts` stay in the tree, unused, as the balance does). A dispatch turret seats container agents into twelve workcells (least-loaded first; overflow waits in a lit queue), every job rides the rail through a dual-key assay press that stamps it and prints the audit ledger (every fifth diverts to the review siding, reworks and re-enters), and stamped work drops through chutes into five client vaults on a pillared substrate. All motion and every readout derive from one deterministic schedule, tested for cell and press exclusivity, retry, determinism and the conservation invariant (dispatched = queued + running + in flight + in review + settled; the books close before the cycle wraps). The plate keeps three beats, one per bullet, each framing a station; captions dock (no 3D anchors). Placeholders: the Eisen bullet wording is owner input.

Washington Capital Partners (chapter IV) is a construction site: five steel-frame towers rise floor by floor through a five-beat plate as the loans fund them, under a lattice tower crane that sets the gold cap (the classifier) on the tallest tower on the last beat (`instruments/Site.tsx`, yard in `SiteDressing.tsx`, pure layout and timing in `lib/site.ts`). The fifth bullet, the AI categorization work, is placeholder wording (owner input).

Spec: `superpowers/specs/2026-09-20-instruments-design.md` (local).
Spec: `superpowers/specs/2026-09-20-profile-design.md` (local).

## Implementation notes

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
