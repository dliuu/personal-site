# studio-room

## Trying

The approved studio-room design (local spec `superpowers/specs/2026-09-18-personal-site-design.md`)
built as a lab experiment: one primitive room, four scroll stops (intro, work, writing, contact),
an intro pull-in as the single signature moment, mouse parallax, hoverable and clickable project
objects with DOM panels, demand-mode rendering, tiered lighting.

Adaptations for the lab: placeholder content in `content.ts`, no MDX, no pre-rendered fallback
image, one generic project object shape.

Live tier downgrade (PerformanceMonitor) is omitted: under demand-mode rendering its fps sampling
is meaningless. Initial tier still applies.

- Reduced motion: the camera tracks scroll continuously (no lerp) rather than snapping to the nearest keyframe as the spec says; continuous felt calmer. Revisit if judged otherwise.
- Monitor screen roughness 0.3 is the one exemption from the 0.7–0.95 band, for the spec's "reflections on the monitor".
- Walls cast shadows so the sun enters only through the window; the hemisphere fill was raised to 0.6 to compensate. Tune in Lights.tsx.
- Intro pull-in is skipped when the page loads already scrolled.

What to judge: (1) does the intro pull-in feel like a signature moment; (2) do the four stops
frame the room well; (3) does hover/click on the desk objects feel responsive; (4) does the
room look warm enough to keep. Tune camera keyframes in `sections.ts`, palette in `palette.ts`.

## Result

_(fill in after viewing)_

## Keep / Drop

_(fill in)_
