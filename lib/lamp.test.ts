import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { LAMP_BASE, LAMP_LIGHT, LAMP_YAW, SHADE, SHADE_LOCAL } from "./lamp";

/**
 * The lamp prop's local bounds and its light surface, read once from
 * assets/room/props/desk_lamp_arm_01/desk_lamp_arm_01.gltf (a fixed CC0 asset).
 */
const PROP = {
  scale: 0.55,
  min: new Vector3(-0.1185, -0.088, -0.2966),
  max: new Vector3(0.0833, 0.8046, 0.3172),
  light: new Vector3(-0.0047, 0.6956, -0.1767),
};

/** The second monitor, as scene/RoomSet.tsx places it. */
const MONITOR = {
  centre: new Vector3(-0.55, 0.9, -0.55),
  yaw: 0.35,
  half: new Vector3(0.25, 0.15, 0.0125),
};

const DESK = { x: [-0.85, 0.85], z: [-0.735, 0.015], top: 0.7525 };
const UP = new Vector3(0, 1, 0);

/** The prop's eight corners, placed the way scripts/room/build.py places them. */
function propCorners(): Vector3[] {
  const out: Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    const v = new Vector3(
      i & 1 ? PROP.max.x : PROP.min.x,
      i & 2 ? PROP.max.y : PROP.min.y,
      i & 4 ? PROP.max.z : PROP.min.z,
    )
      .multiplyScalar(PROP.scale)
      .applyAxisAngle(UP, LAMP_YAW)
      .add(LAMP_BASE);
    // The manifest places the prop 0.05 above LAMP_BASE.
    out.push(v.setY(v.y + 0.05));
  }
  return out;
}

/** Signed distance from a point to the monitor's box; negative means inside. */
function clearance(p: Vector3): number {
  const d = p.clone().sub(MONITOR.centre).applyAxisAngle(UP, -MONITOR.yaw);
  const o = new Vector3(
    Math.abs(d.x) - MONITOR.half.x,
    Math.abs(d.y) - MONITOR.half.y,
    Math.abs(d.z) - MONITOR.half.z,
  );
  if (o.x <= 0 && o.y <= 0 && o.z <= 0) return Math.max(o.x, o.y, o.z);
  return new Vector3(
    Math.max(o.x, 0),
    Math.max(o.y, 0),
    Math.max(o.z, 0),
  ).length();
}

describe("the desk lamp", () => {
  it("is placed where the baked prop manifest places it", () => {
    const manifest = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "assets", "room", "props", "manifest.json"),
        "utf8",
      ),
    ) as { file: string; position: number[]; rotationY: number }[];
    const lamp = manifest.find((e) => e.file.startsWith("desk_lamp_arm_01/"));
    expect(lamp, "the lamp is in the prop manifest").toBeDefined();
    // The prop's origin is the desk surface; LAMP_BASE is the base's underside.
    expect(lamp!.position[0]).toBeCloseTo(LAMP_BASE.x, 6);
    expect(lamp!.position[1]).toBeCloseTo(LAMP_BASE.y + 0.05, 6);
    expect(lamp!.position[2]).toBeCloseTo(LAMP_BASE.z, 6);
    expect(lamp!.rotationY).toBeCloseTo(LAMP_YAW, 6);
  });

  it("stands clear of the second monitor", () => {
    for (const c of propCorners()) expect(clearance(c)).toBeGreaterThan(0.02);
  });

  it("stands on the desk, not through it or off it", () => {
    for (const c of propCorners()) {
      expect(c.y).toBeGreaterThanOrEqual(DESK.top - 0.001);
      expect(c.x).toBeGreaterThan(DESK.x[0]);
      expect(c.x).toBeLessThan(DESK.x[1]);
      expect(c.z).toBeGreaterThan(DESK.z[0]);
      expect(c.z).toBeLessThan(DESK.z[1]);
    }
  });

  it("puts the bulb on the prop's own light surface", () => {
    const fromProp = PROP.light
      .clone()
      .multiplyScalar(PROP.scale)
      .applyAxisAngle(UP, LAMP_YAW)
      .add(LAMP_BASE);
    fromProp.setY(fromProp.y + 0.05);
    expect(SHADE.distanceTo(fromProp)).toBeLessThan(0.002);
    // SHADE_LOCAL is that same point, before the yaw.
    expect(SHADE_LOCAL.y + LAMP_BASE.y).toBeCloseTo(fromProp.y, 3);
  });

  it("puts the spot just outside the shade, not inside the lamp", () => {
    const d = LAMP_LIGHT.distanceTo(SHADE);
    expect(d).toBeCloseTo(0.08, 6);
  });
});
