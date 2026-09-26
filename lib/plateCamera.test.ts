import { describe, expect, it } from "vitest";
import { faceYaw, plateCamera, unwrapDescending, ZOOM_K } from "./plateCamera";

describe("faceYaw", () => {
  it("is 0 for lon -90 (the +z meridian) and turns negative going east", () => {
    expect(faceYaw(-90)).toBeCloseTo(0, 6);
    expect(faceYaw(-74)).toBeLessThan(0);
    expect(faceYaw(0)).toBeCloseTo(-Math.PI / 2, 6);
  });
});
describe("unwrapDescending", () => {
  it("only decreases and one lap east totals -2π", () => {
    const lons = [-105, -74, 2.35, 77.21, 139.69, -100, -74];
    const y = unwrapDescending(lons.map(faceYaw));
    for (let i = 1; i < y.length; i++)
      expect(y[i]).toBeLessThanOrEqual(y[i - 1]);
    expect(y[y.length - 1] - y[1]).toBeCloseTo(-2 * Math.PI, 6);
  });
});
describe("plateCamera", () => {
  const entry = { lon: -105, lat: 10, k: ZOOM_K.full };
  const keys = [
    { lon: -74, lat: 40.7, k: ZOOM_K.mid },
    { lon: 2.35, lat: 48.9, k: ZOOM_K.close },
  ];
  it("starts at the entry key and arrives by TRAVEL", () => {
    const a = plateCamera(entry, keys, 0, 0);
    expect(a.k).toBeCloseTo(ZOOM_K.full, 6);
    expect(a.el).toBeCloseTo((10 * Math.PI) / 180, 6);
    const b = plateCamera(entry, keys, 0, 0.3);
    expect(b.k).toBeCloseTo(ZOOM_K.mid, 6);
    expect(b.yaw).toBeCloseTo(faceYaw(-74), 6);
  });
  it("drifts east after arriving", () => {
    const b = plateCamera(entry, keys, 0, 0.3);
    const c = plateCamera(entry, keys, 0, 1);
    expect(c.yaw).toBeLessThan(b.yaw);
    expect(c.k).toBeCloseTo(b.k, 6);
  });
  it("travels from the previous beat's place to the next", () => {
    const a = plateCamera(entry, keys, 1, 0);
    expect(a.k).toBeCloseTo(ZOOM_K.mid, 6);
    const b = plateCamera(entry, keys, 1, 0.5);
    expect(b.k).toBeCloseTo(ZOOM_K.close, 6);
    expect(b.yaw).toBeLessThan(a.yaw);
  });
});
