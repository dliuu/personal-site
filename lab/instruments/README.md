# instruments

## Trying

The professional profile as a codex: five chapters (intro, Eisen, Meta, Washington Capital Partners, contact), each job with an instrument of its trade: a banker's balance, a globe with 48 locale pins, a stone bridge whose keystone drops in.

Spec: `superpowers/specs/2026-09-20-instruments-design.md` (local).
Spec: `superpowers/specs/2026-09-20-profile-design.md` (local).

What to judge: does each instrument read as its trade; does the hero hold while a long chapter is read; do the role chapters fit at 1280×720 and 390 px wide.

Deviations from the spec:

- Contour opacity settles at 0.5 (spec said 0.15) so ink hairlines survive the engraving pass.
- Intro draw-in uses a frame-rate-independent lerp (0.05 at 60 Hz reference).
- Instruments render twice, as a solid root and a line root, scaled about the instrument origin.
- Balance tilt is a damped single swing `0.22·sin(2πu)·(1−u)` that settles at the chapter centre (spec said `sin(base)·0.22`).

## Result

_(fill in after viewing)_

## Keep / Drop

_(fill in)_
