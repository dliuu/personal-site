# Best practices: rendering 3D efficiently and with interest

Distilled 2026-09-19 from the 35 sites in `examples.md` plus their write-ups
(Codrops case studies for Weisdevice, Shader.se, Stefan Vitasović, Susurrus;
Utsubo's and Metabole's 2026 roundups; Hon Tran's technique breakdown; the
Bruno Simon and Aimee's Papercraft repos). Each practice names the sites that
prove it. The last section applies them to our own attempts.

## The one rule everything else serves

**Commit to one hard idea and budget everything around it.** Utsubo, Metabole,
Hubtown, Oryzo, Messenger, Bilal, Tiny Skies. The idea can be cheap. The
failure mode is the opposite: a stack of effects where every section tries to
be the hero. Metabole's SaaS client had exactly that; rebuilt with a quieter
pace and one signature moment, demo requests doubled. Five scenes beat fifteen.

## Efficiency: how the good ones stay fast

1. **Bake the lighting. Real-time shadows are the most expensive thing you can
   ask a browser to do.** Weisdevice: "all lighting is simulated", baked
   textures with hand-painted touch-ups on `MeshBasicMaterial`, 0.76 MB of
   models and 3 MB of textures for a whole island. Shopify Editions ships a
   `bg_diffuse` baked model per section and lights only the foreground props.
   Bruno Simon loads palette textures into materials rather than lighting
   geometry. Utsubo lists baked lighting as one of the four disciplines that
   separate winners from janky demos.
2. **Set a byte budget on day one and defer the 3D bundle behind the HTML.**
   Messenger: 5.7 MB initial, 17.5 MB total, for a multiplayer game.
   Weisdevice: ~5 MB all in. p5aholic and Levi Mackay: no models at all.
   Utsubo: the 3D bundle is deferred so meaningful HTML paints first and Core
   Web Vitals pass. Hon Tran: KTX2/Basis for textures, Draco for geometry, cap
   the device pixel ratio.
3. **Render only what is needed, only when needed.** Weisdevice runs the
   raycaster at 30 fps and cancels the animation frame the moment a project
   page opens. Shader.se skips the entire render pass for scenes outside the
   viewport ("no draw calls, no GPU work") and renders slightly ahead only to
   pre-warm transition textures. Hon Tran: render only when visible.
4. **Instance anything repeated.** Bruno Simon's benches, fences and crates;
   Tiny Skies' vegetation (heavy `InstancedMesh` use); Utsubo's list again.
5. **Let the style hide the resolution.** Susurrus renders its watercolor
   world at very low resolution because a Kuwahara filter makes low res look
   intentional. Tiny Skies uses fog (163 references in the bundle) to cull the
   world edge and toon materials that need no detail. A style choice is a
   performance choice.
6. **Code-split and degrade on purpose.** Vitasović dynamic-imports the WebGL
   layer and removes it entirely on mobile in favour of HTML5 video. Shopify
   ships quality tiers and a static-image fallback. Hon Tran: reduced-quality
   settings on phones, a graceful 2D fallback, respect `prefers-reduced-motion`.
   Metabole: design mobile-first with lighter scenes rather than retrofitting.
7. **Prefer a small vocabulary of effects.** Hon Tran, an Awwwards juror:
   most award sites are built from five techniques (image displacement,
   particle fields, scroll-driven 3D, custom GLSL, product configurators) and
   image displacement, the most reused, is a small sharp piece of shader code.

## Interest: how the good ones look like something

1. **Charm comes from illustration and texture, not polygons or shaders.**
   Aimee's Papercraft World bakes hand-drawn Krita art onto simple Blender
   geometry and won an FWA. Weisdevice paints on top of its bakes and keeps
   textures deliberately small so the world looks worn. Susurrus is a
   watercolor filter over Sketchfab models. None of these rely on real-time
   lighting for their look.
2. **Pick a committed stylisation; do not aim for realism with cheap
   geometry.** Realism needs real models. Toon (Tiny Skies), watercolor
   (Susurrus), papercraft (Aimee), glitch/retro (Weisdevice), Minecraft
   (JReyes), sculptural PBR with baked backgrounds and studio-made models
   (Shopify). A stylisation forgives boxes; "soft realistic" exposes them.
3. **One signature moment, everything else quiet.** Hubtown: a single glowing
   monolith and a mouse-reveal, Site of the Day. Metabole's rebuild. Ameen's
   loading screen is the art direction. Bilal: one motif (a music box) carried
   through.
4. **Motion motifs.** Vitasović: a repeated visual hook (characters assembling
   into words, noise drift) that costs no bytes makes a site feel authored
   rather than assembled.
5. **Atmosphere over spectacle.** Equinox holds attention with sound, pacing
   and mood. Tiny Skies swaps music by time of day. Susurrus layers light piano
   and hover sounds. Fog, palette and idle motion do more than particle counts.
6. **Structure it like a film.** Metabole: sequencing, reveals, breathing room;
   each transition performs an emotional move. Lempens cuts between camera
   setups. Shader.se spent "days before it actually feels good" on transition
   timing, per frame.
7. **Warmth comes from biography.** WoraWork tells a career through objects in
   a house. The objects mean something; that is why the room feels lived in.
8. **Restraint is a 3D skill.** Garden Eight uses 3D as an accent. Unseen and
   Merci-Michel make calm read as expensive. p5aholic puts a raw-GLSL
   background behind ordinary pages and has a page listing his copycats.
   Levi Mackay: one hero object, instant load, and that is enough.

## What the light sites have in common

They load a shader, a font, and some geometry generated in code. They do not
load a character or a world. That single decision is most of the difference
between 800 KB and 18 MB, and most of the difference between "charming" and
"janky demo".

## Applying this to our attempts

`lighting-bench` and `studio-room` were built the other way round: flat-colour
primitives lit in real time with cascaded shadows, contact shadows and an
environment map, plus intro, parallax, hover lift and four camera stops all at
once. That is the expensive path to a look no reference site uses. Boxes under
a real sun look like boxes. Against the practices above:

| Practice                        | Where we stand                                                              |
| ------------------------------- | --------------------------------------------------------------------------- |
| One hard idea                   | "A room" is a setting, not an idea. Nothing in it is the memorable thing.   |
| Bake lighting                   | Everything is real-time. Shadows on 30+ meshes every frame the loop runs.   |
| Style hides resolution          | No stylisation. Soft-realism asks the geometry to be good, and it is boxes. |
| Charm from texture/illustration | Zero textures. Flat colours only.                                           |
| Signature moment                | The intro pull-in exists, but there is no image worth pulling in to.        |
| Render only when needed         | Done (demand loop). This part is right.                                     |
| Quality tiers, reduced motion   | Done. Also right.                                                           |
| Small vocabulary                | Too many small effects, none of them the hook.                              |

The plumbing (demand rendering, tiers, DOM overlays, scroll-to-camera) is sound
and reusable. The picture is the problem.

## Three directions that follow from the references

1. **Stylise the room.** Keep the layout and plumbing; replace real-time PBR
   with a committed cheap style: toon shading with outlines and fog (Tiny
   Skies), or a watercolor/Kuwahara pass at low resolution (Susurrus). Palette
   and fog do the lighting. Cheapest change; keeps the scroll narrative.
2. **Paint it.** Aimee's method: model nothing more than we have, but bake
   hand-drawn (or generated, then hand-fixed) textures onto the boxes and use
   `MeshBasicMaterial`. Highest charm ceiling, needs an image pipeline
   (Blender UVs plus a paint tool, or careful procedural canvas textures).
3. **Drop the world, keep one object.** p5aholic / Hubtown / Levi Mackay: an
   ordinary well-typeset site with one hero object or a shader background that
   reacts to the cursor and scroll. Lightest, most reliably good, and the
   "creative showcase" can live in the craft of that one object.

Whichever direction, the test is the same: does a static screenshot of the
first frame look like a poster? If not, no amount of camera motion fixes it.
