# instruments

## Trying

A Renaissance variant of `chapters`: the same scroll-over-one-canvas model, but the heroes are
instruments (armillary sphere, astrolabe, gear train, quadrant) built from rings and rods; a
copperplate-engraving post effect replaces the halftone; each instrument draws itself in as
construction lines before the hatched solid fills; the DOM is a codex page (parchment,
iron-gall ink, gold rules, Fell type, script margin notes, Roman numerals).

Spec: `superpowers/specs/2026-09-20-instruments-design.md` (local).

What to judge, against `chapters`: (1) does the first chapter drawing itself feel like the
signature moment; (2) do the instruments read as instruments at engraving resolution;
(3) does turning the mechanism with scroll feel connected; (4) which page feels more like one idea.

Deviations from the spec:

- Contour opacity settles at 0.5 (spec said 0.15) so ink hairlines survive the engraving pass.
- Intro draw-in uses a frame-rate-independent lerp (0.05 at 60 Hz reference).
- Instruments render twice, as a solid root and a line root, scaled about the instrument origin.

## Result

_(fill in after viewing)_

## Keep / Drop

_(fill in)_
