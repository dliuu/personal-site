"""
Prepare generated or downloaded models for the room bake.

    blender -b --python scripts/room/prepProps.py -- FILE [FILE ...] [options]
    blender -b --python scripts/room/prepProps.py -- ~/Downloads/*.glb

For each input it joins the meshes into one object, stands it on the floor
centred on its own footprint, decimates it to a triangle budget, shrinks its
textures, and writes it to `assets/room/props/<slug>/<slug>.gltf` where the
bake's manifest can pick it up. It prints each model's measured size and a
ready-to-paste manifest entry, so placement stays a deliberate decision
rather than something the script guesses.

Options:
    --tris N        triangle budget per model (default 40000)
    --tex N         longest texture edge (default 2048)
    --height M      scale so the model stands M metres tall
    --skip-existing leave a prop alone if its folder is already there
"""

import os
import re
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
PROPS = ROOT / "assets" / "room" / "props"

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def opt(name, cast, default):
    return cast(argv[argv.index(name) + 1]) if name in argv else default


TRIS = opt("--tris", int, 40000)
TEX = opt("--tex", int, 2048)
HEIGHT = opt("--height", float, 0.0)
SKIP = "--skip-existing" in argv
FLAGS = {"--tris", "--tex", "--height", "--skip-existing"}
files = [
    a
    for i, a in enumerate(argv)
    if not a.startswith("--") and (i == 0 or argv[i - 1] not in FLAGS - {"--skip-existing"})
]
if not files:
    print("PREP no input files")
    sys.exit(0)


def slugify(path: Path) -> str:
    return re.sub(r"[^a-z0-9]+", "_", path.stem.lower()).strip("_") or "prop"


def bounds(obj):
    lo = Vector((1e9,) * 3)
    hi = Vector((-1e9,) * 3)
    for v in obj.bound_box:
        w = obj.matrix_world @ Vector(v)
        lo = Vector(map(min, lo, w))
        hi = Vector(map(max, hi, w))
    return lo, hi


for raw in files:
    src = Path(raw).expanduser()
    if not src.exists():
        print(f"PREP missing {src}")
        continue
    slug = slugify(src)
    out = PROPS / slug
    if SKIP and (out / f"{slug}.gltf").exists():
        print(f"PREP skip {slug}")
        continue
    out.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    if src.suffix.lower() in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=str(src))
    elif src.suffix.lower() == ".fbx":
        bpy.ops.import_scene.fbx(filepath=str(src))
    elif src.suffix.lower() == ".obj":
        bpy.ops.wm.obj_import(filepath=str(src))
    else:
        print(f"PREP unsupported {src.name}")
        continue

    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    if not meshes:
        print(f"PREP no mesh in {src.name}")
        continue
    bpy.context.view_layer.objects.active = meshes[0]
    for m in meshes:
        m.select_set(True)
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = slug

    # Stand it on the floor, centred on its own footprint, so a manifest
    # position means "where its feet go".
    lo, hi = bounds(obj)
    obj.location -= Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if HEIGHT > 0:
        lo, hi = bounds(obj)
        s = HEIGHT / max(hi.z - lo.z, 1e-6)
        obj.scale = (s, s, s)
        bpy.ops.object.transform_apply(scale=True)

    before = len(obj.data.polygons)
    if before > TRIS:
        mod = obj.modifiers.new("dec", "DECIMATE")
        mod.ratio = TRIS / before
        mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier="dec")

    for img in bpy.data.images:
        if img.size[0] == 0:
            continue
        if max(img.size) > TEX:
            img.scale(TEX, TEX)
        # A GLB's textures arrive packed, and saving a packed image writes the
        # original bytes back rather than the buffer we just scaled.
        if img.packed_file:
            try:
                img.unpack(method="REMOVE")
            except RuntimeError:
                pass
        base = re.sub(
            r"[^A-Za-z0-9]+", "_", os.path.splitext(os.path.basename(img.filepath or img.name))[0]
        )
        ext = ".png" if "normal" in base.lower() else ".jpg"
        img.filepath_raw = str(out / (base + ext))
        img.file_format = "PNG" if ext == ".png" else "JPEG"
        img.save()

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(out / f"{slug}.gltf"),
        export_format="GLTF_SEPARATE",
        use_selection=True,
        export_image_format="AUTO",
    )
    d = obj.dimensions
    print(
        f"PREP {slug}: {before} -> {len(obj.data.polygons)} tris, "
        f"w={d.x:.3f} d={d.y:.3f} h={d.z:.3f} m"
    )
    print(
        f'PREP manifest {{ "file": "{slug}/{slug}.gltf", '
        f'"position": [0, 0, 0], "rotationY": 0, "scale": 1 }}'
    )
