#!/usr/bin/env node
// The one asset build. Every GLB the Blender bake leaves in assets/room/out is
// packed for the web into public/models: material scans to 1k, roughness and
// scanned props to 512, the 2k lightmap untouched, WebP textures, Draco
// geometry. Prints a size table and fails if anything breaks the budget.
//
//   node scripts/assets/build.mjs [--force] [--check]
//
// --force  repack even when the output is newer than its source
// --check  only check what is already in public/models (no Blender needed)
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const SRC_DIR = "assets/room/out";
const OUT_DIR = "public/models";
const TMP_DIR = "assets/room/out/.pack";

/** Per GLB, and for every model the site ships. Textures stay at or under 2k. */
const BUDGET_PER = 2 * 1024 * 1024;
const BUDGET_TOTAL = 8 * 1024 * 1024;

const args = process.argv.slice(2);
const force = args.includes("--force");
const checkOnly = args.includes("--check");

const MiB = (bytes) => `${(bytes / 1048576).toFixed(2)} MiB`;
const size = (file) => statSync(file).size;
const exists = (file) => {
  try {
    statSync(file);
    return true;
  } catch {
    return false;
  }
};

const gltf = (...argv) =>
  execFileSync("npx", ["--yes", "@gltf-transform/cli", ...argv], {
    stdio: ["ignore", "ignore", "inherit"],
  });

/**
 * The passes, in order; each takes the previous file. Patterns are globs over
 * texture names, so they match by suffix: `rough_linen` is a material name and
 * `_rough_1k` is a roughness map, and conflating the two silently softens the
 * linen's relief. The lightmap matches nothing, so it stays at 2k.
 */
const PASSES = [
  // Material scans at 1k, scanned props at 512 — they are small on screen.
  ["resize", "--width", "1024", "--height", "1024", "--pattern", "{plastered,oak,rough_linen}*"], // prettier-ignore
  ["resize", "--width", "512", "--height", "512", "--pattern", "{potted,dining,desk_lamp}*"], // prettier-ignore
  // Roughness and ARM are low frequency; half resolution does not show.
  ["resize", "--width", "512", "--height", "512", "--pattern", "*{_rough,_arm}_1k"], // prettier-ignore
  // The rug, seen across the floor at a glancing angle. Dropping this one
  // normal map is what brings the room inside the 2 MiB budget.
  ["resize", "--width", "512", "--height", "512", "--pattern", "rough_linen_nor_gl*"], // prettier-ignore
  ["webp"],
  ["draco"],
];

function build(name) {
  const src = path.join(SRC_DIR, name);
  const out = path.join(OUT_DIR, name);
  if (!force && exists(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) {
    console.log(`  ${name}: up to date (--force to repack)`);
    return { name, raw: size(src), built: size(out), skipped: true };
  }
  mkdirSync(TMP_DIR, { recursive: true });
  let input = src;
  PASSES.forEach((pass, i) => {
    const last = i === PASSES.length - 1;
    const target = last ? out : path.join(TMP_DIR, `${i}-${name}`);
    gltf(pass[0], input, target, ...pass.slice(1));
    input = target;
  });
  rmSync(TMP_DIR, { recursive: true, force: true });
  return { name, raw: size(src), built: size(out), skipped: false };
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const sources = exists(SRC_DIR)
    ? readdirSync(SRC_DIR).filter((f) => f.endsWith(".glb"))
    : [];

  let rows = [];
  if (checkOnly || sources.length === 0) {
    if (!checkOnly)
      console.log(
        `No bake in ${SRC_DIR}/. Checking what is committed instead; to rebuild:\n` +
          `  blender -b --python scripts/room/build.py -- --samples 256\n`,
      );
    rows = readdirSync(OUT_DIR)
      .filter((f) => f.endsWith(".glb"))
      .map((name) => ({ name, built: size(path.join(OUT_DIR, name)) }));
  } else {
    rows = sources.map(build);
  }

  let total = 0;
  const over = [];
  console.log("");
  for (const row of rows) {
    total += row.built;
    const bad = row.built > BUDGET_PER;
    if (bad) over.push(row.name);
    const from = row.raw ? `${MiB(row.raw)} → ` : "";
    console.log(
      `  ${row.name.padEnd(16)} ${from}${MiB(row.built)}${bad ? "  OVER BUDGET" : ""}`,
    );
  }
  console.log(
    `  ${"total".padEnd(16)} ${MiB(total)} of ${MiB(BUDGET_TOTAL)} allowed\n`,
  );

  if (over.length) {
    console.error(
      `Over the ${MiB(BUDGET_PER)} per-model budget: ${over.join(", ")}`,
    );
    process.exit(1);
  }
  if (total > BUDGET_TOTAL) {
    console.error(`Over the ${MiB(BUDGET_TOTAL)} total budget.`);
    process.exit(1);
  }
}

main();
