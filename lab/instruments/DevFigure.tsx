"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { frameLerp } from "@/lib/drawIn";
import { greetBob, idleSway, swivelAmount } from "@/lib/introTimeline";
import { lerp } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";
import { plateState } from "./plateState";

/**
 * The seated figure: one rigid mesh fused to its own chair, so it cannot bend.
 * It is loaded at run time rather than baked into the room, because scroll
 * swivels the chair round to greet you. Its placement matches the numbers the
 * bake used while it lived in the manifest.
 */
const POSITION: [number, number, number] = [0.12, 0, 0.46];
const SCALE = 1.2;
const FACING = Math.PI;

let promise: Promise<Group> | null = null;
function loadFigure(): Promise<Group> {
  promise ??= (async () => {
    const draco = new DRACOLoader().setDecoderPath("/draco/");
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const gltf = await loader.loadAsync("/models/dev-figure.glb");
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const mat = m.material as MeshStandardMaterial;
      // Lit in real time while the room around it is baked, so it needs more
      // from the environment than the baked surfaces do.
      mat.envMapIntensity = 0.9;
      mat.needsUpdate = true;
    });
    return gltf.scene;
  })();
  return promise;
}

export function DevFigure() {
  const [figure, setFigure] = useState<Group | null>(null);
  const root = useRef<Group>(null);
  const yaw = useRef(FACING);
  const worldPos = useRef(new Vector3());
  const toCamera = useRef(new Vector3());
  useEffect(() => {
    let on = true;
    const start = () =>
      loadFigure().then(
        (g) => {
          if (on) setFigure(g);
          document.documentElement.dataset.devFigure = "1";
        },
        (e) => console.warn("figure unavailable", e),
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

  useFrame(({ clock, camera }, delta) => {
    const r = root.current;
    if (!r) return;
    const { reducedMotion } = useLabStore.getState();
    const active = plateState.instrument === "desk";
    const p = active ? plateState.p : 0;
    const t = clock.elapsedTime;
    const turn = swivelAmount(p);
    const bob = greetBob(p, reducedMotion ? 0 : t);
    // Turn the chair until he is actually looking at you, rather than by a
    // fixed angle: the camera moves during the sequence, so a fixed angle only
    // lands once. The turn is unwrapped to always go the same way round, which
    // is most of a full revolution from facing the desk.
    r.getWorldPosition(worldPos.current);
    toCamera.current.subVectors(camera.position, worldPos.current);
    let sweep = Math.atan2(toCamera.current.x, toCamera.current.z) - FACING;
    while (sweep > 0) sweep -= Math.PI * 2;
    const goal =
      FACING + sweep * turn + (reducedMotion ? 0 : idleSway(t) * (1 - turn));
    yaw.current = reducedMotion
      ? goal
      : lerp(yaw.current, goal, frameLerp(0.1, delta));
    r.rotation.set(0, yaw.current, bob.tilt);
    r.position.set(POSITION[0], POSITION[1] + bob.lift, POSITION[2]);
  });

  return figure ? (
    <group
      ref={root}
      position={POSITION}
      rotation={[0, FACING, 0]}
      scale={SCALE}
    >
      <primitive object={figure} />
    </group>
  ) : null;
}
