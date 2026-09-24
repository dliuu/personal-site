# scene

The site: the professional profile as a codex. Five chapters (intro, Eisen, Meta,
Washington Capital Partners, contact), each job with an instrument of its trade: a
live agent network on the screen, a globe with 48 locale pins, a stone bridge whose
keystone drops in. One fixed canvas under a DOM column, engraving post effect,
heroes drawn in by scroll.

Chapter I is a full-screen 3D room (a scene chapter is its own plate, no text
column): a jointed figure types at a desk in an open, nature-facing studio in
golden-hour daylight, stands and waves on scroll, and the camera goes over the desk
into the monitor until the screen fills the viewport. The static shell and furniture
are baked in Blender (`scripts/room/build.py`) and fade in over the procedural room
after first paint; everything dynamic stays real time. Textures are canvas painters
(`lib/roomTextures.ts`) and all sound is Web Audio (`lib/roomAudio.ts`).

Eisen (chapter II) is the software factory as an orchestrator-worker network: five
orchestrator agents, meshed to each other, each spin up their own fan of worker
containers. Each container is a terminal card: its screen streams the task's log from
one canvas atlas (`lib/terminal.ts` for the templates and timing,
`scene/terminalAtlas.ts` for the painter and the per-instance windowing shader), a
task packet goes down the edge, a deterministic verdict prints PASS or FAIL on the
screen and lights the card green or red, the result packet comes back up, and a
failure flashes the orchestrator, which turns to face the slot it last dispatched to,
shows `retrying` above it, and spins up the next container. Pillars carry it all on a
substrate grid. Its plate has three beats, one per bullet, each anchored on a layer,
and a fourth slot that dives: one terminal (orchestrator 2, slot 0) grows and shows
the codex's next page, the camera flies in until the page fills the viewport, and the
Meta band is cut to behind it (every smoothed value snaps on that frame)
(`scene/Network.tsx`, pure logic in `lib/network.ts`).

Meta (chapter III) is the globe: an immersive plate where the engraving dissolves to
a photoreal Earth, scroll turns it once west → east through six beats, and callout
cards anchor on the surface (`lib/plateCamera.ts`, `scene/Callouts.tsx`).

Placeholders awaiting owner input: the Eisen bullet wording, the twelve task names
and their log lines, orchestrator and worker counts, pass rate and colours, the beat
captions, the 48 locale cities, book titles, notes, and the room's hotspot copy. The
balance instrument stays in the file, unused.

## How it is put together

- Pure logic lives in `lib/` with unit tests; anything that reads or writes per frame
  is imperative (`plateState`) rather than in a store.
- Instruments render twice, as a solid root and a line root, scaled about the
  instrument origin; each has its own FIT half-width so wide assemblies shrink into
  the hero region instead of sharing one scale.
- Contour opacity settles at 0.5 so ink hairlines survive the engraving pass.
- Draw-in uses a frame-rate-independent lerp (0.05 at 60 Hz reference).
- On phones, a section taller than the viewport fades every hero to a watermark as it
  is read (`depth` drives a smoothstep band 0.28–0.55, contours floor at 0.12,
  solids drop out below 0.6, and the fade itself is lerped so a section change does
  not pop); hero scale is capped at 0.5 and hotspots are hidden.
- `pointer-events: none` sits on `.instruments` (the content wrapper over the canvas),
  not the section, so the page still scrolls while markers stay clickable. Hotspot
  notes open on click or focus and close on Escape or a click outside.
- The r3f store's `viewport` is computed at camera z = 6 while the camera dollies to
  5.6, so heroes are up to ~7% larger than `heroPlacement` assumes.
