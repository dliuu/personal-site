#!/usr/bin/env node
// Bake Natural Earth 110m land (world-atlas) into public/geo/land.json:
// { rings: number[][] } with each ring flat [lon, lat, …] in hundredths of a degree.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const topo = JSON.parse(
  await readFile(require.resolve("world-atlas/land-110m.json"), "utf8"),
);
const land = feature(topo, topo.objects.land);
const rings = [];
for (const f of land.features ?? [land]) {
  const geom = f.geometry;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys)
    for (const ring of poly) {
      const flat = [];
      for (const [lon, lat] of ring)
        flat.push(Math.round(lon * 100), Math.round(lat * 100));
      rings.push(flat);
    }
}
const out = path.join("public", "geo", "land.json");
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify({ rings }));
const points = rings.reduce((n, r) => n + r.length / 2, 0);
console.log(`${out}: ${rings.length} rings, ${points} points`);
