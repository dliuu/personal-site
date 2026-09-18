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

What to judge: (1) does the intro pull-in feel like a signature moment; (2) do the four stops
frame the room well; (3) does hover/click on the desk objects feel responsive; (4) does the
room look warm enough to keep. Tune camera keyframes in `sections.ts`, palette in `palette.ts`.

## Result

_(fill in after viewing)_

## Keep / Drop

_(fill in)_
