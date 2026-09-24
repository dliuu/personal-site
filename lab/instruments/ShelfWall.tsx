"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BufferGeometry,
  InstancedMesh,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * The right wall: one shelf unit repeated on a grid.
 *
 * These are instanced at run time rather than baked with the room. Nine copies
 * of a scan each need their own space in the shared lightmap atlas, and asking
 * the packer for that collapsed every island in the room to nothing, which
 * bakes black. Instancing costs one draw call and one download instead, at the
 * price of real-time lighting rather than baked light on the shelves.
 */
const UNIT = { w: 0.977, h: 0.734, d: 0.273 };
const WALL_X = 2.4;
const ROWS = [0.35, 1.1, 1.85];
const COLUMNS = [-0.62, 0.4, 1.42];

let promise: Promise<{ geometry: BufferGeometry; material: Material }> | null =
  null;
function loadShelf() {
  promise ??= (async () => {
    const draco = new DRACOLoader().setDecoderPath("/draco/");
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const gltf = await loader.loadAsync("/models/shelf.glb");
    let found: Mesh | null = null;
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && !found) found = m;
    });
    const mesh = found as Mesh | null;
    if (!mesh) throw new Error("shelf has no mesh");
    const material = mesh.material as MeshStandardMaterial;
    material.envMapIntensity = 0.9;
    material.needsUpdate = true;
    return { geometry: mesh.geometry, material };
  })();
  return promise;
}

export function ShelfWall() {
  const [shelf, setShelf] = useState<{
    geometry: BufferGeometry;
    material: Material;
  } | null>(null);
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const count = ROWS.length * COLUMNS.length;

  useEffect(() => {
    let on = true;
    loadShelf().then(
      (s) => {
        if (on) setShelf(s);
      },
      (e) => console.warn("shelf wall unavailable", e),
    );
    return () => {
      on = false;
    };
  }, []);

  // Laid out once: the grid never moves.
  useEffect(() => {
    const m = ref.current;
    if (!m || !shelf) return;
    let i = 0;
    for (const y of ROWS) {
      for (const z of COLUMNS) {
        dummy.position.set(WALL_X - UNIT.d / 2, y, z);
        dummy.rotation.set(0, -Math.PI / 2, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        m.setMatrixAt(i++, dummy.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
    m.castShadow = true;
    m.receiveShadow = true;
  }, [shelf, dummy]);

  return shelf ? (
    <instancedMesh
      ref={ref}
      args={[shelf.geometry, shelf.material, count]}
      frustumCulled={false}
      castShadow
      receiveShadow
    />
  ) : null;
}
