/** Decode a baked ring: flat [lon, lat, …] in hundredths of a degree. */
export function decodeRing(ints: number[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < ints.length; i += 2)
    out.push([ints[i] / 100, ints[i + 1] / 100]);
  return out;
}

const D2R = Math.PI / 180;

/**
 * Unit vector for a lat/lon, laid out like three's SphereGeometry UVs
 * (u = 0 at −x, increasing toward +z), so an equirectangular texture with
 * x = (lon + 180)/360 lands where the pins do.
 */
export function latLonToVec3(
  lat: number,
  lon: number,
): [number, number, number] {
  const phi = (lon + 180) * D2R;
  const c = Math.cos(lat * D2R);
  return [-Math.cos(phi) * c, Math.sin(lat * D2R), Math.sin(phi) * c];
}

/** Rank of each point by longitude: 0 for the westernmost. */
export function rankByLongitude(points: { lon: number }[]): number[] {
  const order = points
    .map((p, i) => ({ i, lon: p.lon }))
    .sort((a, b) => a.lon - b.lon);
  const rank = new Array<number>(points.length);
  order.forEach((o, r) => {
    rank[o.i] = r;
  });
  return rank;
}
