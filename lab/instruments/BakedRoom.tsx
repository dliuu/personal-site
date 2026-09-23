"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  ShaderChunk,
  SRGBColorSpace,
  type Texture,
} from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { frameLerp } from "@/lib/drawIn";
import { lerp } from "@/lib/progress";
import { useRoomStore } from "./useRoomStore";

/**
 * The baked room: static shell and furniture modelled and lit in Blender
 * (scripts/room/build.py), delivered as one Draco GLB with the lightmap
 * carried as the glTF occlusion texture. Loaded after first paint and faded
 * in over the procedural room, which then hides its duplicates.
 */
/** Shared by every baked material: 0 = day atlas, 1 = evening atlas. */
const lightMix = { value: 0 };
const LM_LINE = "vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );";

let promise: Promise<Group> | null = null;
function loadRoom(): Promise<Group> {
  promise ??= (async () => {
    const draco = new DRACOLoader().setDecoderPath("/draco/");
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const gltf = await loader.loadAsync("/models/room.glb");
    // The evening atlas rides in as the emissive map of a hidden carrier quad.
    let evening: Texture | null = null;
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && m.name.startsWith("lightmap_evening_carrier")) {
        evening = (m.material as MeshStandardMaterial).emissiveMap;
      }
    });
    const carrier = gltf.scene.getObjectByName("lightmap_evening_carrier");
    carrier?.removeFromParent();
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const mat = m.material as MeshStandardMaterial;
      if (mat.aoMap) {
        // The occlusion slot only exists to carry TEXCOORD_1; it is light.
        mat.lightMap = mat.aoMap;
        mat.lightMap.colorSpace = SRGBColorSpace;
        mat.lightMapIntensity = 1 / 0.35;
        mat.aoMap = null;
      }
      if (evening && mat.lightMap) {
        // Blend toward the evening atlas in the shader; one uniform for all.
        const ev = evening;
        mat.onBeforeCompile = (shader) => {
          shader.uniforms.lightMap2 = { value: ev };
          shader.uniforms.lightMix = lightMix;
          shader.fragmentShader =
            "uniform sampler2D lightMap2;\nuniform float lightMix;\n" +
            shader.fragmentShader.replace(
              "#include <lights_fragment_maps>",
              ShaderChunk.lights_fragment_maps.replace(
                LM_LINE,
                "vec4 lightMapTexel = mix( texture2D( lightMap, vLightMapUv ), texture2D( lightMap2, vLightMapUv ), lightMix );",
              ),
            );
        };
        mat.customProgramCacheKey = () => "baked-room-lm2";
      }
      mat.envMapIntensity = 0.35;
      mat.transparent = true;
      mat.opacity = 0;
      mat.needsUpdate = true;
    });
    return gltf.scene;
  })();
  return promise;
}

export function BakedRoom() {
  const [room, setRoom] = useState<Group | null>(null);
  const fade = useRef(0);
  const setBaked = useRoomStore((s) => s.setBaked);
  useEffect(() => {
    let on = true;
    // After first paint, and only when the browser is idle.
    const start = () =>
      loadRoom().then(
        (g) => {
          if (on) setRoom(g);
          // A hook for the screenshot loop, which waits for the room.
          document.documentElement.dataset.bakedRoom = "1";
        },
        (e) => console.warn("baked room unavailable", e),
      );
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    const id = w.requestIdleCallback
      ? w.requestIdleCallback(start, { timeout: 1500 })
      : window.setTimeout(start, 300);
    return () => {
      on = false;
      window.clearTimeout(id);
    };
  }, []);
  const duskMode = useRoomStore((s) => s.duskMode);
  useFrame((_, delta) => {
    // Night is the default atlas; the toggle crossfades to dusk.
    lightMix.value = lerp(
      lightMix.value,
      duskMode ? 1 : 0,
      frameLerp(0.06, delta),
    );
    if (!room || fade.current >= 1) return;
    fade.current = Math.min(
      1,
      lerp(fade.current, 1.02, frameLerp(0.08, delta)),
    );
    const done = fade.current >= 1;
    room.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const mat = m.material as MeshStandardMaterial;
      mat.opacity = fade.current;
      if (done) mat.transparent = false;
    });
    if (fade.current > 0.6) setBaked(true);
  });
  return room ? <primitive object={room} /> : null;
}
