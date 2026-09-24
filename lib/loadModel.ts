/**
 * The one place the site loads a model. Every GLB under public/models comes
 * through here: a single GLTFLoader with the Draco decoder from public/draco,
 * one in-flight promise per URL so a second caller clones the cached graph
 * instead of fetching again, and the material fixes the bake needs applied on
 * the way out. scripts/assets/build.mjs writes the files this reads.
 */
import { Group, Mesh, MeshStandardMaterial, SRGBColorSpace } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** The bake was written at 0.35 exposure, so the lightmap is scaled back up. */
const LIGHTMAP_INTENSITY = 1 / 0.35;
/** The real-time sun and sky stay at half strength over a baked room. */
const ENV_MAP_INTENSITY = 0.35;

let loader: GLTFLoader | null = null;
function shared(): GLTFLoader {
  loader ??= new GLTFLoader().setDRACOLoader(
    new DRACOLoader().setDecoderPath("/draco/"),
  );
  return loader;
}

/**
 * Fold a loaded graph into what the scene expects: shadows on, and the glTF
 * occlusion slot lifted into `lightMap`. The bake carries its lightmap there
 * because occlusion is the only slot glTF gives a second UV channel, so
 * TEXCOORD_1 survives export; nothing in the room wants ambient occlusion.
 */
export function prepare(root: Group): Group {
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
    const mat = m.material as MeshStandardMaterial;
    if (mat.aoMap) {
      mat.lightMap = mat.aoMap;
      mat.lightMap.colorSpace = SRGBColorSpace;
      mat.lightMapIntensity = LIGHTMAP_INTENSITY;
      mat.aoMap = null;
    }
    mat.envMapIntensity = ENV_MAP_INTENSITY;
    mat.needsUpdate = true;
  });
  return root;
}

const cache = new Map<string, Promise<Group>>();

/** The URL a model name resolves to, relative to the site root. */
export function modelUrl(name: string): string {
  return `/models/${name}.glb`;
}

/**
 * Load `public/models/<name>.glb`. Repeat calls reuse the fetch and hand back
 * a clone carrying its own materials, so one caller fading itself in cannot
 * touch another's.
 */
export async function loadModel(name: string): Promise<Group> {
  const url = modelUrl(name);
  let pending = cache.get(url);
  if (!pending) {
    pending = shared()
      .loadAsync(url)
      .then((gltf) => prepare(gltf.scene));
    cache.set(url, pending);
  }
  const root = (await pending).clone();
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    m.material = (m.material as MeshStandardMaterial).clone();
  });
  return root;
}
