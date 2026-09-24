# scene

The site: the professional profile as a codex. Five chapters (intro, Eisen, Meta,
Washington Capital Partners, contact), each job with an instrument of its trade: a
live agent network on the screen, a globe with 48 locale pins, a construction drawing
that builds itself. One fixed canvas under a DOM column, engraving post effect,
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

Washington Capital (chapter IV) is hard-money construction lending as the thing the
money pays for: a construction sheet that draws itself, and the one plate that never
leaves the drawing. `Chapter.engraved` pins `reveal` at 0, so the hairlines hold at
full strength to full screen while the chroma wash (driven by `expand`, not `reveal`)
brings up the warm paper and the gold. The page carries a border rule inset 0.08
inside its trim, as a drawing sheet does. Four beats, one per bullet. i, the slab: the
camera rises to a near-plan 50° over the lot and the four walls hinge up off the sheet
on a stagger. ii, one frame twelve faces: the frame inks a floor at a time and the
cladding closes over it face by face, each institution told apart by hatch pattern and
never by colour — twelve hatches, six angles × two spacings, all windows onto one
canvas atlas, and four labels name the floors they stand against. iii, the dimension
line: a flat-on elevation with the two dimension runs standing clear beside it, the
second closing onto 56% of the first, its numeral and the note block beside them, and
structural bays marching off the lot as the fleet scales along an inked traffic curve.
iv, the draw schedule: the camera drops below grade, where the lot plane no longer
stands between it and the money, and gold draws travel as dashes down the rods
into the vault under the slab while the topping-out beam drops into its seat. The
travel reads only on the below-grade run; above the slab the rods are lost
against the cladding hatch. The rods map a full-height dash strip of the same
canvas atlas with a repeating wrap, and `s.draw` scrolls it three passes down the
beat — one pass is a whole number of dashes, so the reset at each pass boundary
cannot be seen. Beat iii's furniture (both dimension runs, the bays, the traffic
curve) is gated to the plate; in the chapter band the page is a hatched smear
with two stakes visible. The sheet's
lettering — title block, floor labels, notes, the 56% numeral — is aimed at the beat it
belongs to rather than made two-sided, because a plane read from behind reads
mirrored; the notes and the numeral are sized to be read at beat iii's distance,
which stands them beside the page rather than in a margin of it, the elevation
and its runs having already filled the paper inside the border. The whole
drawing hangs off the mech group, so the plate yaw turns it (`scene/Site.tsx`,
staging in `lib/site.ts`, the sheet's painters in `lib/sheet.ts` →
`scene/sheetAtlas.ts`).

Known limit, phone width: the plate rig sets the camera distance from the instrument's
radius alone and ignores aspect (`scene/HeroObjects.tsx:406`), so the visible
half-width is 1.772 · aspect in instrument units — 2.84 at 1440×900 but 0.82 at
390×844. Chapter IV is cropped to what stands within 0.82 of its centre, which at beat
iii is the cladding alone: the second dimension run (x 0.94), the 56% plate (1.35), the
note block (1.95) and bays 2–4 (1.0–1.28) are all off screen, so the beat's whole
instrument is lost and the docked caption carries it alone; beat i keeps the sheet but
loses most of the title block. Seen at 390×844 in `shots/`, and it ships this way. The
follow-up is an aspect-aware `k` in the shared plate rig, which would reframe Eisen and
Meta too.

Placeholders awaiting owner input: the Eisen bullet wording, the twelve task names
and their log lines, orchestrator and worker counts, pass rate and colours, the beat
captions, the 48 locale cities, book titles, notes, and the room's hotspot copy; on the
Washington Capital sheet, the FISH title block and its revision line, the four floor
labels, the note block, the dimension numerals and the four beat captions. The balance
instrument stays in the file, unused.

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
