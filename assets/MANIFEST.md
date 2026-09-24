# Assets

Every 3D asset the site ships, where it comes from, and what loads it. One
source chain, one build command (`npm run assets`), one loader
(`lib/loadModel.ts`).

## Models

| Asset  | Built path               | Size     | Triangles | Loaded by                                   | Decision |
| ------ | ------------------------ | -------- | --------- | ------------------------------------------- | -------- |
| `room` | `public/models/room.glb` | 1.94 MiB | ~194,980  | `scene/BakedRoom.tsx` → `loadModel("room")` | keep     |

`room.glb` is the intro's static shell and furniture: walls, floor, ceiling,
desk, shelves, rug, plus four CC0 Poly Haven scans (two potted plants, a dining
chair, a desk lamp arm). It carries a 2k lightmap in the glTF occlusion slot,
which is the only slot that gives a second UV channel, so `TEXCOORD_1` survives
export; `loadModel` lifts it back into `material.lightMap` on load.

Everything else in the scene — screen, lamp, curtains, plants, keys, cat,
avatar, the Eisen factory and the Meta globe — is procedural geometry built in
code, with canvas-painted textures (`lib/roomTextures.ts`). No files involved.

### Sources

`room.glb` has no raw GLB original, because it is not an export: it is baked
from a Blender scene that is itself built by a script. The source of truth is
therefore the script, not a mesh file.

| Source                            | Tracked?   | What it is                                              |
| --------------------------------- | ---------- | ------------------------------------------------------- |
| `scripts/room/build.py`           | yes        | Builds, lights and bakes the room in Blender            |
| `assets/room/props/manifest.json` | yes        | Where each scanned prop sits (three.js coords)          |
| `assets/room/props/<id>/`         | gitignored | Poly Haven CC0 props, via `scripts/room/fetchProps.mjs` |
| `assets/room/cache/`              | gitignored | Poly Haven CC0 PBR maps and HDRI                        |
| `assets/room/out/room.glb`        | gitignored | The bake's output — the build input                     |

Because `assets/room/out/` is gitignored, a fresh clone has no build input.
`npm run assets` then checks the committed output against the budget instead of
repacking, and prints the Blender command needed to rebuild. There is no
`assets/raw/` to keep read-only: re-baking is how you get a new original.

### Textures loaded separately

| Files                         | Size   | Loaded by                    | Decision |
| ----------------------------- | ------ | ---------------------------- | -------- |
| `public/textures/earth/*` (4) | 1.6 MB | `scene/EarthMaterials.ts:30` | keep     |

The three.js example planet set (MIT, from NASA Blue Marble), used by the Meta
globe: `earth_atmos_2048.jpg`, `earth_normal_2048.jpg`,
`earth_specular_2048.jpg`, `earth_clouds_1024.png`. All four are referenced.
These are plain textures with no geometry, so they load through `TextureLoader`
rather than `loadModel`.

`public/draco/` holds the Draco decoder copied from the three.js package.
`lib/loadModel.ts` points the loader at it. Not an asset of its own.

Nothing is marked `drop?` — every file above is referenced by code.

## Pipeline

### Adding or changing an asset

A new model is a new object in the Blender scene, not a file you drop in:

1. Add it to `scripts/room/build.py`, or, for a scanned prop, fetch it with
   `node scripts/room/fetchProps.mjs <poly-haven-id>` and place it in
   `assets/room/props/manifest.json`.
2. Re-bake: `blender -b --python scripts/room/build.py -- --samples 256`.
   This writes `assets/room/out/room.glb`.
3. `npm run assets` packs it to `public/models/` and checks the budget.
   `npm run assets:force` repacks even when the output is newer than the bake;
   `npm run assets:check` only checks what is committed, and needs no Blender.
4. Load it with `loadModel("<name>")`. Never reference a `.glb` path directly.
5. Commit the built GLB — `public/models/` is committed, as nothing builds
   assets in CI.

### Budget

**≤ 2 MiB per GLB, ≤ 8 MiB for all models, textures ≤ 2048px.** `npm run assets`
exits non-zero if a model or the total breaks it.

The room sits at 1.94 MiB. Getting there costs two deliberate downscales, both
in `scripts/assets/build.mjs`:

- roughness and ARM maps to 512 — low-frequency data, invisible at half size;
- the rug's normal map (`rough_linen_nor_gl`) to 512 — it is seen across the
  floor at a glancing angle.

Colour and normal maps for the wall plaster and oak stay at 1k, and the
lightmap stays at 2k. Two Poly Haven maps are 1022×1024 rather than square, so
the validator reports `IMAGE_NPOT_DIMENSIONS`; that predates this pipeline and
WebGL2 handles it.

Watch out: patterns match texture _names_, and `rough_linen` is a material
while `_rough_1k` is a roughness map. A pattern like `*rough*` catches the
linen's normal map by accident.

With all normal maps left at 1k the room lands at 2.08 MiB, so 2 MiB is a real
constraint rather than a comfortable one. If a future asset cannot fit, the
honest lever is geometry: one scanned prop, the potted-plant leaves
(`Box.001`), is ~1.09 MB of accessors on its own, nearly half the file.
`simplify` barely dents it — the lightmap's second UV channel pins the
topology — so replacing or decimating that prop in Blender is the way.

### Why Draco, not Meshopt

Draco already ships here, with its decoder committed in `public/draco/`, and it
is much smaller on this asset. Re-encoding the same textures with Meshopt gives
3.61 MiB at `--level high` and 4.43 MiB at `medium`, against Draco's 1.94 MiB —
Meshopt alone would break the budget.

### Blender repair

There is none, and none is needed. The geometry comes out of Blender rather
than a scan-to-mesh service, so it has no flipped normals or stray specks to
repair: `dedup`, `prune` and `weld` were each measured at zero bytes saved, and
the validator reports no errors. If a future asset does need repair, add
`scripts/assets/repair.sh` and prefer `assets/repaired/X.glb` over the bake in
`build.mjs`.

For the same reason `loadModel` does not force `DoubleSide` or disable
mipmaps. Both are fixes for generated meshes: on this room they would double
shadow cost and make the wall and lightmap textures shimmer as the intro camera
moves.

## Verification

- `npx @gltf-transform/cli validate public/models/room.glb` — no errors. The
  warnings are `UNUSED_OBJECT` (×67), `MESH_PRIMITIVE_GENERATED_TANGENT_SPACE`
  (×39), `TEXCOORD_*` (×14), `IMAGE_NPOT_DIMENSIONS` (×2) and
  `UNSUPPORTED_EXTENSION` (×1, `EXT_texture_webp`). The same set, at the same
  counts, was already reported before this pipeline existed.
- `npm run shots` renders the scene to `shots/` (gitignored). Its frames are
  **not** reproducible enough to diff: the baked room fades in on
  `requestIdleCallback`, so consecutive runs of the same build differ by
  6.8–48 dB PSNR. Where frames happen to align, before/after this change
  measures 52–61 dB, i.e. no visible difference. Check the intro by eye.
