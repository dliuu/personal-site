"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Mesh, MeshStandardMaterial } from "three";
import { frameLerp } from "@/lib/drawIn";
import { loadModel } from "@/lib/loadModel";
import { lerp } from "@/lib/progress";
import { useRoomStore } from "./useRoomStore";

/**
 * The baked room: static shell and furniture modelled and lit in Blender
 * (scripts/room/build.py), delivered as one Draco GLB with the lightmap
 * carried as the glTF occlusion texture. Loaded after first paint and faded
 * in over the procedural room, which then hides its duplicates.
 */
async function loadRoom(): Promise<Group> {
  const room = await loadModel("room");
  // Start invisible; useFrame below fades the room in over the procedural one.
  room.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const mat = m.material as MeshStandardMaterial;
    mat.transparent = true;
    mat.opacity = 0;
  });
  return room;
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
  useFrame((_, delta) => {
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
