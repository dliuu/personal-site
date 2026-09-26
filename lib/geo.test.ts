import { describe, expect, it } from "vitest";
import { decodeRing, latLonToVec3, rankByLongitude } from "./geo";

describe("decodeRing", () => {
  it("turns hundredths into [lon, lat] pairs", () => {
    expect(decodeRing([-7400, 4071, 1000, -2050])).toEqual([
      [-74, 40.71],
      [10, -20.5],
    ]);
  });
});
describe("latLonToVec3", () => {
  it("matches three's sphere UV layout: lon -180 is -x, lon -90 is +z, lon 0 is +x", () => {
    const [x0, , z0] = latLonToVec3(0, -180);
    expect(x0).toBeCloseTo(-1, 6);
    expect(z0).toBeCloseTo(0, 6);
    const [x1, , z1] = latLonToVec3(0, -90);
    expect(x1).toBeCloseTo(0, 6);
    expect(z1).toBeCloseTo(1, 6);
    const [x2] = latLonToVec3(0, 0);
    expect(x2).toBeCloseTo(1, 6);
  });
  it("puts the poles on y and New York facing +z", () => {
    expect(latLonToVec3(90, 0)[1]).toBeCloseTo(1, 6);
    const [x, y, z] = latLonToVec3(40.71, -74.01);
    expect(y).toBeCloseTo(Math.sin((40.71 * Math.PI) / 180), 6);
    expect(z).toBeGreaterThan(0.7);
    expect(x).toBeGreaterThan(0);
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6);
  });
});
describe("rankByLongitude", () => {
  it("ranks west to east", () => {
    expect(rankByLongitude([{ lon: 10 }, { lon: -74 }, { lon: 139 }])).toEqual([
      1, 0, 2,
    ]);
  });
});
