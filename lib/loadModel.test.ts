import { describe, expect, it } from "vitest";
import { Group, Mesh, MeshStandardMaterial, Texture } from "three";
import { modelUrl, prepare } from "./loadModel";

/** A mesh carrying the occlusion slot the bake uses for its lightmap. */
function bakedMesh(withAoMap: boolean): Mesh {
  const mat = new MeshStandardMaterial();
  if (withAoMap) mat.aoMap = new Texture();
  const mesh = new Mesh(undefined, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

describe("modelUrl", () => {
  it("resolves a name under /models", () => {
    expect(modelUrl("room")).toBe("/models/room.glb");
  });
});

describe("prepare", () => {
  it("lifts the occlusion slot into the lightmap and clears aoMap", () => {
    const root = new Group();
    const mesh = bakedMesh(true);
    const texture = (mesh.material as MeshStandardMaterial).aoMap;
    root.add(mesh);

    prepare(root);

    const mat = mesh.material as MeshStandardMaterial;
    expect(mat.lightMap).toBe(texture);
    expect(mat.aoMap).toBe(null);
    expect(mat.lightMapIntensity).toBeCloseTo(1 / 0.35);
  });

  it("turns shadows on and halves the environment for every mesh", () => {
    const root = new Group();
    const a = bakedMesh(true);
    const b = bakedMesh(false);
    root.add(a, b);

    prepare(root);

    for (const mesh of [a, b]) {
      expect(mesh.castShadow).toBe(true);
      expect(mesh.receiveShadow).toBe(true);
      expect((mesh.material as MeshStandardMaterial).envMapIntensity).toBe(
        0.35,
      );
    }
  });

  it("leaves a mesh without an occlusion slot unlit by a lightmap", () => {
    const root = new Group();
    const mesh = bakedMesh(false);
    root.add(mesh);

    prepare(root);

    expect((mesh.material as MeshStandardMaterial).lightMap).toBe(null);
  });
});
