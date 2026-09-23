#!/usr/bin/env node
// Pack the baked room for the web: Draco geometry, WebP textures, material
// maps at 1k, the lightmap kept at 2k. Usage: node scripts/room/pack.mjs
import { execSync } from "node:child_process";
import { statSync } from "node:fs";

const run = (cmd) =>
  execSync(`npx --yes @gltf-transform/cli ${cmd}`, { stdio: "inherit" });
const src = "assets/room/out/room.glb";
const a = "assets/room/out/room_a.glb";
const b = "assets/room/out/room_b.glb";
const out = "public/models/room.glb";
run(`resize ${src} ${a} --width 1024 --height 1024 --pattern "^(?!lightmap)"`);
run(`webp ${a} ${b}`);
run(`draco ${b} ${out}`);
console.log(`${out}: ${(statSync(out).size / 1048576).toFixed(2)} MB`);
