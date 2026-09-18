import { CatmullRomCurve3, Vector3 } from "three";
import { clamp01 } from "./progress";

export type Vec3 = [number, number, number];

export type Keyframe = {
  position: Vec3;
  target: Vec3;
};

export type Curves = {
  position: CatmullRomCurve3;
  target: CatmullRomCurve3;
  count: number;
};

export function buildCurves(keyframes: Keyframe[]): Curves {
  if (keyframes.length < 2) {
    throw new Error("buildCurves needs at least 2 keyframes");
  }
  const toVec = (v: Vec3) => new Vector3(v[0], v[1], v[2]);
  return {
    position: new CatmullRomCurve3(
      keyframes.map((k) => toVec(k.position)),
      false,
      "centripetal",
    ),
    target: new CatmullRomCurve3(
      keyframes.map((k) => toVec(k.target)),
      false,
      "centripetal",
    ),
    count: keyframes.length,
  };
}

export function sampleAt(
  curves: Curves,
  t: number,
  outPosition: Vector3 = new Vector3(),
  outTarget: Vector3 = new Vector3(),
): { position: Vector3; target: Vector3 } {
  const u = clamp01(t);
  // getPoint (not getPointAt) so keyframe i sits exactly at u = i / (count - 1)
  curves.position.getPoint(u, outPosition);
  curves.target.getPoint(u, outTarget);
  return { position: outPosition, target: outTarget };
}
