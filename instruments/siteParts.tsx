"use client";

import { useContext, useMemo, type ReactNode } from "react";
import {
  BoxGeometry,
  InstancedMesh,
  Material,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import type { Seg } from "@/lib/site";
import { EdgedModeContext } from "./Instruments";

/** Site colours, seen once the plate reveals the render; the band hatches them grey. */
export const SITE = {
  dirt: "#8a6f4e",
  gravel: "#b3ab9c",
  concrete: "#d2cbbd",
  core: "#b6ad9f",
  steel: "#5f6670",
  glass: "#8db2c8",
  net: "#e8742c",
  crane: "#e3a93b",
  machine: "#e0a030",
  white: "#e9e6df",
  hoarding: "#dcd6ca",
  hivis: "#f08a2c",
  helmet: "#f2d33a",
  blue: "#4f7fb5",
  green: "#5f7d4a",
  beacon: "#ff3b2f",
} as const;

/** Children drawn in the solid root only: instanced and transparent parts have no engraved twin, the post pass hatches them. */
export function Solid({ children }: { children: ReactNode }) {
  const { mode } = useContext(EdgedModeContext);
  return mode === "solid" ? <>{children}</> : null;
}

export function siteMaterial(
  color: string,
  extra: Partial<MeshStandardMaterial> = {},
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness: 0.75,
    metalness: 0.1,
    ...extra,
  });
}

const UNIT = new BoxGeometry(1, 1, 1);

/** One instanced mesh of square-section members, one per segment: lattice, scaffold, rails. */
export function segmentsMesh(
  segs: Seg[],
  thickness: number,
  material: Material,
): InstancedMesh {
  const mesh = new InstancedMesh(UNIT, material, segs.length);
  const o = new Object3D();
  const a = new Vector3();
  const b = new Vector3();
  segs.forEach(([p, q], i) => {
    a.set(p[0], p[1], p[2]);
    b.set(q[0], q[1], q[2]);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.lookAt(b);
    o.scale.set(thickness, thickness, a.distanceTo(b));
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  });
  mesh.frustumCulled = false;
  return mesh;
}

/** A static instanced mesh built once from segments. */
export function Members({
  segs,
  thickness,
  material,
}: {
  segs: Seg[];
  thickness: number;
  material: Material;
}) {
  const mesh = useMemo(
    () => segmentsMesh(segs, thickness, material),
    [segs, thickness, material],
  );
  return <primitive object={mesh} />;
}
