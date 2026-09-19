# chapters

## Trying

The Shopify Editions "scroll + theme" model (wiki entry 1): real DOM chapters scroll over one
fixed canvas; one code-geometry hero object per chapter crossfades by scroll; a halftone
dot-screen post pass is the theme, echoed by paper grain, dotted rules, Fraunces + Inter and an
ink/paper/accent palette. No models, no interaction in 3D.

Spec: `superpowers/specs/2026-09-19-chapters-design.md` (local).

What to judge: (1) does the first frame look like a poster; (2) do the objects crossfade
legibly as you scroll; (3) does the halftone read as a deliberate print look at both tiers;
(4) is the type/palette carrying the theme as much as the shader.

Rendering is always-on because the objects idle-spin (spec §2.2); r3f pauses the loop on
hidden tabs. The halftone is a custom luminance-to-dot effect (the stock DotScreen clamps
paper to white). Measure the experiment chunk size in devtools and record it here.

## Result

_(fill in after viewing)_

## Keep / Drop

_(fill in)_
