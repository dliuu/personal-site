"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { breathe } from "@/lib/ambient";
import { frameLerp } from "@/lib/drawIn";
import { lerp } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";
import { useRoomStore } from "./useRoomStore";

/**
 * The dog sitting on the rug: a rigid mesh, so it breathes and stirs rather
 * than moving its legs. Clicking makes it perk up and turn toward you for a
 * few seconds before settling again.
 */
const REST_YAW = -0.5;

let promise: Promise<Group> | null = null;
function loadDog(): Promise<Group> {
  promise ??= (async () => {
    const draco = new DRACOLoader().setDecoderPath("/draco/");
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const gltf = await loader.loadAsync("/models/dog.glb");
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const mat = m.material as MeshStandardMaterial;
      mat.envMapIntensity = 0.9;
      mat.needsUpdate = true;
    });
    return gltf.scene;
  })();
  return promise;
}

export function Dog({
  position,
  scale = 0.33,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const [dog, setDog] = useState<Group | null>(null);
  const root = useRef<Group>(null);
  const awake = useRef(0);
  const wake = useRoomStore((s) => s.wakePet);
  const setHover = useRoomStore((s) => s.setHover);

  useEffect(() => {
    let on = true;
    loadDog().then(
      (g) => {
        if (on) setDog(g);
      },
      () => {},
    );
    return () => {
      on = false;
    };
  }, []);

  useFrame(({ clock, camera }, delta) => {
    const r = root.current;
    if (!r) return;
    const t = clock.elapsedTime;
    const { reducedMotion } = useLabStore.getState();
    const until = useRoomStore.getState().petAwakeUntil;
    const target = until > performance.now() / 1000 ? 1 : 0;
    awake.current = lerp(awake.current, target, frameLerp(0.06, delta));
    const a = awake.current;
    // Breathing is a gentle swell of the whole body; waking lifts it and
    // turns it toward whoever clicked.
    const b = reducedMotion ? 1 : breathe(t);
    r.scale.set(scale * b, scale * (1 + (b - 1) * 0.7 + a * 0.04), scale * b);
    r.position.set(position[0], position[1] + a * 0.02, position[2]);
    const look = new Vector3().subVectors(camera.position, r.position);
    r.rotation.y = REST_YAW + a * (Math.atan2(look.x, look.z) - REST_YAW) * 0.6;
  });

  return dog ? (
    <group
      ref={root}
      position={position}
      rotation={[0, REST_YAW, 0]}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover({ label: "the dog", note: "click and he looks up" });
      }}
      onPointerOut={() => setHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        wake();
      }}
    >
      <primitive object={dog} />
    </group>
  ) : null;
}
