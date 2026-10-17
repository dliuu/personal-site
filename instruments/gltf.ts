import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let promise: Promise<GLTFLoader> | null = null;
/**
 * One GLTF loader for every model. The loaders' code is its own chunk,
 * fetched when the first model is asked for (after first paint), and one
 * Draco decoder, its wasm fetched up front, serves them all with one worker
 * pool instead of one per model.
 */
export function gltfLoader(): Promise<GLTFLoader> {
  promise ??= (async () => {
    const [{ DRACOLoader }, { GLTFLoader }] = await Promise.all([
      import("three/examples/jsm/loaders/DRACOLoader.js"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
    ]);
    const draco = new DRACOLoader().setDecoderPath("/draco/");
    draco.preload();
    return new GLTFLoader().setDRACOLoader(draco);
  })();
  return promise;
}
