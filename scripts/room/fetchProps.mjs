#!/usr/bin/env node
// Fetch Poly Haven CC0 models (glTF, 1k textures) into assets/room/props/<id>/.
// Usage: node scripts/room/fetchProps.mjs potted_plant_01 modern_arm_chair_01 ...
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const ids = process.argv.slice(2);
const UA = { "User-Agent": "personal-site-room-bake/1.0" };
const get = async (url) => {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r;
};
for (const id of ids) {
  const files = await (
    await get(`https://api.polyhaven.com/files/${id}`)
  ).json();
  const g = files.gltf?.["1k"]?.gltf;
  if (!g) {
    console.error(`${id}: no 1k glTF`);
    continue;
  }
  const dir = path.join("assets", "room", "props", id);
  await mkdir(dir, { recursive: true });
  const entries = [
    [`${id}.gltf`, g.url, g.size],
    ...Object.entries(g.include ?? {}).map(([p, v]) => [p, v.url, v.size]),
  ];
  let total = 0;
  for (const [rel, url, size] of entries) {
    const dest = path.join(dir, rel);
    total += size;
    try {
      if ((await stat(dest)).size === size) continue;
    } catch {}
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, Buffer.from(await (await get(url)).arrayBuffer()));
  }
  console.log(
    `${id}: ${entries.length} files, ${(total / 1048576).toFixed(2)} MB`,
  );
}
