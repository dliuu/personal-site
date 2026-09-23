"""
Build, bake and export the intro room.

    blender -b --python scripts/room/build.py -- [--samples 256] [--preview]

Rebuilds the static shell and furniture of the intro room from the same
coordinates the code uses (three.js: y up, +z toward the camera; here
Blender: z up, so three (x, y, z) -> Blender (x, -z, y)), dresses it in CC0
PBR materials from Poly Haven, unwraps a second UV channel, bakes sun + sky
lighting with Cycles into one lightmap atlas, and exports a Draco GLB with
the lightmap carried as the glTF occlusion texture (so TEXCOORD_1 survives
the export; the runtime moves it to lightMap). Everything that moves or
toggles stays real time in the app: the screen, lamp, plants, curtains, cat.

Inputs are fetched into assets/room/cache (gitignored); outputs land in
assets/room/out (gitignored) and public/models/room.glb (committed).
"""
import json
import math
import os
import sys
import urllib.request
from pathlib import Path

import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "assets" / "room" / "cache"
OUT = ROOT / "assets" / "room" / "out"
CACHE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
SAMPLES = int(argv[argv.index("--samples") + 1]) if "--samples" in argv else 256
PREVIEW = "--preview" in argv
LIGHTMAP_SIZE = 2048

# ---------------------------------------------------------------- assets
PH = "https://dl.polyhaven.org/file/ph-assets"
TEXTURES = {
    "plaster": ("plastered_wall", ["diff", "nor_gl", "rough"]),
    "oak": ("oak_veneer_01", ["diff", "nor_gl", "rough"]),
    "linen": ("rough_linen", ["diff", "nor_gl", "rough"]),
}
HDRI = ("meadow_2", "2k")


def fetch(url: str, dest: Path) -> Path:
    if dest.exists():
        return dest
    req = urllib.request.Request(url, headers={"User-Agent": "personal-site-room-bake/1.0"})
    with urllib.request.urlopen(req) as r, open(dest, "wb") as f:
        f.write(r.read())
    print("fetched", dest.name)
    return dest


def texture_paths(key: str) -> dict:
    slug, maps = TEXTURES[key]
    out = {}
    for m in maps:
        out[m] = fetch(f"{PH}/Textures/jpg/1k/{slug}/{slug}_{m}_1k.jpg", CACHE / f"{slug}_{m}_1k.jpg")
    return out


hdri_path = fetch(f"{PH}/HDRIs/hdr/{HDRI[1]}/{HDRI[0]}_{HDRI[1]}.hdr", CACHE / f"{HDRI[0]}_{HDRI[1]}.hdr")

# ---------------------------------------------------------------- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.view_settings.view_transform = "Standard"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "METAL"
prefs.refresh_devices()
for d in prefs.devices:
    d.use = d.type == "METAL"
scene.cycles.device = "GPU" if any(d.type == "METAL" for d in prefs.devices) else "CPU"
print("device", scene.cycles.device)


def V(x, y, z):
    """three.js (x, y, z) -> Blender (x, -z, y)."""
    return (x, -z, y)


def load_image(path: Path, non_color=False):
    img = bpy.data.images.load(str(path), check_existing=True)
    if non_color:
        img.colorspace_settings.name = "Non-Color"
    return img


LIGHTMAP = bpy.data.images.new("lightmap", LIGHTMAP_SIZE, LIGHTMAP_SIZE, float_buffer=True)
LIGHTMAP.colorspace_settings.name = "Non-Color"

# The glTF exporter reads occlusion from a node group by this name.
gltf_out = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
gltf_out.interface.new_socket("Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
gltf_out.nodes.new("NodeGroupInput")


def make_material(name, *, textures=None, color=(0.8, 0.8, 0.8, 1), tint=None, roughness=0.8, metallic=0.0, scale=1.0, use_diffuse=True):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Base Color"].default_value = color
    if textures:
        paths = texture_paths(textures)
        uv = nt.nodes.new("ShaderNodeUVMap")
        uv.uv_map = "UVMap"
        mapping = nt.nodes.new("ShaderNodeMapping")
        mapping.inputs["Scale"].default_value = (scale, scale, scale)
        nt.links.new(uv.outputs["UV"], mapping.inputs["Vector"])
        diff = nt.nodes.new("ShaderNodeTexImage")
        diff.image = load_image(paths["diff"])
        nt.links.new(mapping.outputs["Vector"], diff.inputs["Vector"])
        if not use_diffuse:
            # Flat colour with the photo's relief and sheen only: cleaner for
            # painted plaster and dyed fabric than a scanned sample's own hue.
            pass
        elif tint:
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = 1.0
            nt.links.new(diff.outputs["Color"], mix.inputs[6])
            mix.inputs[7].default_value = tint
            nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
        elif use_diffuse:
            nt.links.new(diff.outputs["Color"], bsdf.inputs["Base Color"])
        rough = nt.nodes.new("ShaderNodeTexImage")
        rough.image = load_image(paths["rough"], non_color=True)
        nt.links.new(mapping.outputs["Vector"], rough.inputs["Vector"])
        nt.links.new(rough.outputs["Color"], bsdf.inputs["Roughness"])
        nor = nt.nodes.new("ShaderNodeTexImage")
        nor.image = load_image(paths["nor_gl"], non_color=True)
        nt.links.new(mapping.outputs["Vector"], nor.inputs["Vector"])
        nmap = nt.nodes.new("ShaderNodeNormalMap")
        nmap.inputs["Strength"].default_value = 0.6
        nt.links.new(nor.outputs["Color"], nmap.inputs["Color"])
        nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    # Lightmap atlas: the bake target, and the exported occlusion texture on UV 1.
    lm_uv = nt.nodes.new("ShaderNodeUVMap")
    lm_uv.uv_map = "lightmap"
    lm = nt.nodes.new("ShaderNodeTexImage")
    lm.image = LIGHTMAP
    lm.name = "LIGHTMAP"
    nt.links.new(lm_uv.outputs["UV"], lm.inputs["Vector"])
    grp = nt.nodes.new("ShaderNodeGroup")
    grp.node_tree = gltf_out
    nt.links.new(lm.outputs["Color"], grp.inputs["Occlusion"])
    nt.nodes.active = lm
    lm.select = True
    return mat


M = {
    "plaster": make_material("plaster", textures="plaster", color=(0.86, 0.81, 0.73, 1), scale=0.5, use_diffuse=False),
    "ceiling": make_material("ceiling", textures="plaster", color=(0.92, 0.89, 0.84, 1), scale=0.5, use_diffuse=False),
    "oak": make_material("oak", textures="oak", tint=(1.0, 0.92, 0.78, 1), scale=1.0),
    "floor": make_material("floor", textures="oak", tint=(1.0, 0.94, 0.82, 1), scale=0.35),
    "linen": make_material("linen", textures="linen", color=(0.84, 0.76, 0.62, 1), scale=2.0, use_diffuse=False),
    "sage": make_material("sage", textures="linen", color=(0.45, 0.53, 0.36, 1), scale=3.0, use_diffuse=False),
    "terracotta": make_material("terracotta", textures="linen", color=(0.72, 0.4, 0.28, 1), scale=3.0, use_diffuse=False),
    "steel": make_material("steel", color=(0.03, 0.03, 0.03, 1), roughness=0.45, metallic=0.6),
    "dark": make_material("dark", color=(0.05, 0.045, 0.04, 1), roughness=0.5, metallic=0.2),
    "door": make_material("door", textures="oak", tint=(0.85, 0.8, 0.72, 1), scale=1.0),
}

STATIC = []


def finish(obj, mat, uv_scale=1.0):
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    me = obj.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    me.uv_layers.new(name="lightmap")
    me.uv_layers.active = me.uv_layers["UVMap"]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.cube_project(cube_size=uv_scale, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    STATIC.append(obj)
    return obj


def box(name, size, center, mat, rot_y=0.0, uv_scale=1.0):
    """A three.js box: size (w, h, d), centre (x, y, z), optional rotation about three's y."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=V(*center))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0], size[2], size[1])
    obj.rotation_euler = (0, 0, rot_y)
    return finish(obj, mat, uv_scale)


def cyl(name, r_top, r_bottom, h, center, mat, segments=32, uv_scale=1.0):
    bpy.ops.mesh.primitive_cone_add(radius1=r_bottom, radius2=r_top, depth=h, vertices=segments, location=V(*center))
    obj = bpy.context.active_object
    obj.name = name
    return finish(obj, mat, uv_scale)


# ---------------------------------------------------------------- the room (three.js coordinates)
box("floor", (4.8, 0.02, 6.0), (0, -0.01, 1.8), M["floor"])
box("wallL", (0.02, 2.6, 6.0), (-2.41, 1.3, 1.8), M["plaster"])
box("wallR", (0.02, 2.6, 6.0), (2.41, 1.3, 1.8), M["plaster"])
box("wallF", (4.84, 2.6, 0.02), (0, 1.3, 4.81), M["plaster"])  # behind the camera; closes the light
box("ceiling", (4.8, 0.02, 6.0), (0, 2.61, 1.8), M["ceiling"])
for i in range(9):
    box(f"slat{i}", (4.8, 0.03, 0.06), (0, 2.56, -0.9 + i * 0.5), M["oak"])
box("baseL", (0.02, 0.06, 6.0), (-2.39, 0.03, 1.8), M["ceiling"])
box("baseR", (0.02, 0.06, 6.0), (2.39, 0.03, 1.8), M["ceiling"])
for x in (-2.4, -0.8, 0.8, 2.4):
    box(f"mullion{x}", (0.05, 2.6, 0.05), (x, 1.3, -1.2), M["steel"])
box("header", (4.9, 0.06, 0.08), (0, 2.57, -1.2), M["steel"])
box("threshold", (4.9, 0.02, 0.1), (0, 0.01, -1.2), M["steel"])
box("rug", (2.8, 0.012, 2.0), (0.2, 0.006, 0.55), M["linen"], uv_scale=0.5)
box("doorFrame", (0.04, 2.12, 0.95), (2.39, 1.03, 1.6), M["ceiling"])
box("door", (0.02, 2.05, 0.85), (2.37, 1.03, 1.6), M["door"])
box("shelf1", (0.26, 0.03, 1.0), (2.27, 1.25, -0.3), M["oak"])
box("shelf2", (0.26, 0.03, 1.0), (2.27, 1.75, -0.3), M["oak"])
box("bench", (1.2, 0.05, 0.35), (1.4, 0.42, -0.95), M["oak"])
box("benchLegL", (0.04, 0.4, 0.3), (0.85, 0.2, -0.95), M["oak"])
box("benchLegR", (0.04, 0.4, 0.3), (1.95, 0.2, -0.95), M["oak"])
box("deskTop", (1.7, 0.035, 0.75), (0, 0.735, -0.36), M["oak"])
box("deskLegL", (0.05, 0.72, 0.7), (-0.8, 0.36, -0.36), M["oak"])
box("deskLegR", (0.05, 0.72, 0.7), (0.8, 0.36, -0.36), M["oak"])
# The chair and lamp come from assets/room/props (see the manifest).
box("monitorFoot", (0.28, 0.015, 0.16), (0, 0.76, -0.5), M["dark"])
box("monitorStem", (0.05, 0.16, 0.04), (0, 0.84, -0.5), M["dark"])
box("monitorPanel", (0.63, 0.37, 0.03), (0, 1.05, -0.46), M["dark"])
box("keyboard", (0.44, 0.012, 0.15), (0, 0.759, -0.15), M["dark"])
box("mouse", (0.06, 0.025, 0.1), (0.32, 0.765, -0.15), M["dark"])
cyl("cushion", 0.28, 0.3, 0.12, (1.75, 0.06, 0.25), M["terracotta"], segments=24, uv_scale=0.5)
cyl("standTop", 0.16, 0.16, 0.02, (-1.9, 0.5, 0.6), M["oak"], segments=20)
for i in range(3):
    cyl(f"standLeg{i}", 0.01, 0.01, 0.5, (-1.9 + math.cos(i * 2.1) * 0.12, 0.25, 0.6 + math.sin(i * 2.1) * 0.12), M["steel"], segments=6)

# Extra props dropped into assets/room/props/<name>/ with a manifest are merged
# here: placed, flattened to world-space meshes, given the lightmap channel and
# the atlas node, and baked with the room.
manifest = ROOT / "assets" / "room" / "props" / "manifest.json"
if manifest.exists():
    import mathutils

    for entry in json.loads(manifest.read_text()):
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(manifest.parent / entry["file"]))
        new = [o for o in bpy.data.objects if o not in before]
        roots = [o for o in new if o.parent is None or o.parent not in new]
        p = entry.get("position", [0, 0, 0])
        place = (
            mathutils.Matrix.Translation(mathutils.Vector(V(*p)))
            @ mathutils.Matrix.Rotation(entry.get("rotationY", 0), 4, "Z")
            @ mathutils.Matrix.Scale(entry.get("scale", 1), 4)
        )
        for r in roots:
            r.matrix_world = place @ r.matrix_world
        bpy.context.view_layer.update()
        meshes = [o for o in new if o.type == "MESH"]
        bpy.ops.object.select_all(action="DESELECT")
        for o in meshes:
            o.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        for o in new:
            if o.type != "MESH":
                bpy.data.objects.remove(o)
        # Scanned props arrive at film density; keep about 40k triangles each.
        for o in meshes:
            n = len(o.data.polygons)
            if n > 40000:
                bpy.context.view_layer.objects.active = o
                mod = o.modifiers.new("decimate", "DECIMATE")
                mod.ratio = 40000 / n
                mod.use_collapse_triangulate = True
                bpy.ops.object.modifier_apply(modifier=mod.name)
                print("decimated", o.name, n, "->", len(o.data.polygons))
        for o in meshes:
            o.name = entry["file"].split("/")[0] + "_" + o.name
            if not o.data.uv_layers.get("lightmap"):
                o.data.uv_layers.new(name="lightmap")
            for slot in o.material_slots:
                m = slot.material
                if not m or not m.use_nodes or m.node_tree.nodes.get("LIGHTMAP"):
                    continue
                nt = m.node_tree
                lm_uv = nt.nodes.new("ShaderNodeUVMap")
                lm_uv.uv_map = "lightmap"
                lm = nt.nodes.new("ShaderNodeTexImage")
                lm.image = LIGHTMAP
                lm.name = "LIGHTMAP"
                nt.links.new(lm_uv.outputs["UV"], lm.inputs["Vector"])
                grp = nt.nodes.new("ShaderNodeGroup")
                grp.node_tree = gltf_out
                nt.links.new(lm.outputs["Color"], grp.inputs["Occlusion"])
                for n in nt.nodes:
                    n.select = False
                lm.select = True
                nt.nodes.active = lm
            STATIC.append(o)
        print("prop", entry["file"], len(meshes), "meshes")

# ---------------------------------------------------------------- light
world = bpy.data.worlds.new("world")
scene.world = world
world.use_nodes = True
wn = world.node_tree
env = wn.nodes.new("ShaderNodeTexEnvironment")
env.image = load_image(hdri_path)
bg = wn.nodes["Background"]
bg.inputs["Strength"].default_value = 1.3
wn.links.new(env.outputs["Color"], bg.inputs["Color"])
# Turn the HDRI so its brighter half sits beyond the glass wall (-z in three = +y here).
wmap = wn.nodes.new("ShaderNodeMapping")
wmap.inputs["Rotation"].default_value = (0, 0, math.radians(90))
wtex = wn.nodes.new("ShaderNodeTexCoord")
wn.links.new(wtex.outputs["Generated"], wmap.inputs["Vector"])
wn.links.new(wmap.outputs["Vector"], env.inputs["Vector"])

sun_data = bpy.data.lights.new("sun", "SUN")
sun_data.energy = 4.0
sun_data.angle = math.radians(2.5)
sun_data.color = (1.0, 0.9, 0.76)
sun = bpy.data.objects.new("sun", sun_data)
scene.collection.objects.link(sun)
sun.location = V(1.6, 3.2, -4.5)
# Aim at the code's target (0, 0.6, 0.4).
import mathutils

direction = mathutils.Vector(V(0, 0.6, 0.4)) - mathutils.Vector(V(1.6, 3.2, -4.5))
sun.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

# ---------------------------------------------------------------- lightmap UVs: unwrap each, pack across all
for obj in STATIC:
    obj.data.uv_layers.active = obj.data.uv_layers["lightmap"]
bpy.ops.object.select_all(action="DESELECT")
for obj in STATIC:
    obj.select_set(True)
bpy.context.view_layer.objects.active = STATIC[0]
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003, scale_to_bounds=False)
bpy.ops.uv.select_all(action="SELECT")
bpy.ops.uv.pack_islands(rotate=True, margin=0.004, margin_method="FRACTION")
bpy.ops.object.mode_set(mode="OBJECT")

# ---------------------------------------------------------------- bake
scene.render.bake.use_pass_direct = True
scene.render.bake.use_pass_indirect = True
scene.render.bake.use_pass_color = False
scene.render.bake.margin = 6
scene.render.bake.use_clear = True
bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, uv_layer="lightmap", margin=6, use_clear=True)
print("baked")

# Store at half range so sunlit areas survive an 8-bit sRGB JPEG; the runtime uses lightMapIntensity 2.
px = np.array(LIGHTMAP.pixels[:], dtype=np.float32).reshape(-1, 4)
px[:, :3] = np.clip(px[:, :3] * 0.35, 0, 1)
px[:, 3] = 1
LIGHTMAP.pixels.foreach_set(px.ravel())
LIGHTMAP.update()
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 90
scene.render.image_settings.color_mode = "RGB"
lm_path = OUT / "lightmap.jpg"
LIGHTMAP.save_render(str(lm_path), scene=scene)
print("lightmap", lm_path.stat().st_size)
# Point every material's lightmap node at the saved JPEG so the exporter embeds it.
lm_img = bpy.data.images.load(str(lm_path))
lm_img.colorspace_settings.name = "Non-Color"
for mat in bpy.data.materials:
    if mat.use_nodes and mat.node_tree.nodes.get("LIGHTMAP"):
        mat.node_tree.nodes["LIGHTMAP"].image = lm_img

# ---------------------------------------------------------------- preview from the code's resting camera
if PREVIEW:
    cam_data = bpy.data.cameras.new("cam")
    cam_data.sensor_fit = "VERTICAL"
    cam_data.angle_y = math.radians(45)
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = V(-1.6, 1.5, 2.6)
    look = mathutils.Vector(V(0.1, 0.95, 0.2)) - cam.location
    cam.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    scene.render.resolution_x = 1440
    scene.render.resolution_y = 900
    scene.cycles.samples = 96
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(OUT / "preview.png")
    bpy.ops.render.render(write_still=True)
    print("preview", scene.render.filepath)

# ---------------------------------------------------------------- export
bpy.ops.object.select_all(action="DESELECT")
for obj in STATIC:
    obj.select_set(True)
glb = OUT / "room.glb"
bpy.ops.export_scene.gltf(
    filepath=str(glb),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_texcoords=True,
    export_normals=True,
    export_materials="EXPORT",
    export_image_format="JPEG",
    export_jpeg_quality=82,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_yup=True,
)
print("glb", glb.stat().st_size)
