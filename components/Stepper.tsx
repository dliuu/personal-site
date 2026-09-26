"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Box3, Raycaster, Vector2, type Object3D } from "three";
import { STILL_STEP } from "@/lib/still";

export type Hit = {
  name: string;
  chain: string;
  distance: number;
  point: [number, number, number];
};

export type Box = {
  chain: string;
  geo: string;
  min: [number, number, number];
  max: [number, number, number];
};

export type Still = {
  step: (frames?: number) => number;
  pick: (x: number, y: number) => Hit[];
  boxes: () => Box[];
};

declare global {
  interface Window {
    __still?: Still;
  }
}

/**
 * Publishes `window.__still` in still mode, so the screenshot loop drives the
 * frameloop itself: each step advances the clock by exactly STILL_STEP and
 * renders once. Smoothed values settle over a fixed number of frames rather
 * than over however many the machine managed in a wall-clock wait.
 */
export function Stepper() {
  const advance = useThree((s) => s.advance);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    let t = 0;
    const ray = new Raycaster();
    const ndc = new Vector2();
    const box = new Box3();
    const chainOf = (o: Object3D) => {
      const parts = [];
      for (let n: Object3D | null = o; n; n = n.parent)
        parts.unshift(n.name || n.type);
      return parts.join("/");
    };
    window.__still = {
      step(frames = 1) {
        for (let i = 0; i < frames; i++) {
          t += STILL_STEP;
          advance(t);
        }
        return t;
      },
      boxes() {
        const out: Box[] = [];
        scene.traverseVisible((o) => {
          const m = o as Object3D & {
            isMesh?: boolean;
            geometry?: { type?: string; parameters?: Record<string, number> };
          };
          if (!m.isMesh || !m.geometry) return;
          box.setFromObject(o, true);
          if (box.isEmpty()) return;
          const par = m.geometry.parameters ?? {};
          const dims = [
            "width",
            "height",
            "depth",
            "radiusTop",
            "radiusBottom",
            "radius",
          ]
            .filter((k) => par[k] !== undefined)
            .map((k) => `${k}=${par[k]}`)
            .join(" ");
          out.push({
            chain: chainOf(o),
            geo: `${m.geometry.type ?? "?"} ${dims}`.trim(),
            min: box.min.toArray() as [number, number, number],
            max: box.max.toArray() as [number, number, number],
          });
        });
        return out;
      },
      pick(x, y) {
        ndc.set((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const shown = (o: Object3D) => {
          for (let n: Object3D | null = o; n; n = n.parent)
            if (!n.visible) return false;
          return true;
        };
        return ray
          .intersectObjects(scene.children, true)
          .filter(
            (i) => (i.object as { isMesh?: boolean }).isMesh && shown(i.object),
          )
          .map((i) => {
            const o = i.object as Object3D & {
              geometry?: { type?: string; parameters?: Record<string, number> };
              material?: {
                type?: string;
                opacity?: number;
                transparent?: boolean;
                color?: { getHexString: () => string };
              };
            };
            const par = o.geometry?.parameters ?? {};
            const dims = [
              "width",
              "height",
              "depth",
              "radiusTop",
              "radiusBottom",
            ]
              .filter((k) => par[k] !== undefined)
              .map((k) => `${k}=${par[k]}`)
              .join(" ");
            return {
              name: o.name || o.type,
              chain: chainOf(o),
              geo: `${o.geometry?.type ?? "?"} ${dims}`.trim(),
              mat: `${o.material?.type ?? "?"} #${o.material?.color?.getHexString?.() ?? "?"} op=${o.material?.opacity ?? "?"}${o.material?.transparent ? " transparent" : ""}`,
              distance: i.distance,
              point: i.point.toArray() as [number, number, number],
            };
          });
      },
    };
    return () => {
      delete window.__still;
    };
  }, [advance, scene, camera, size]);
  return null;
}
