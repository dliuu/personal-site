#!/usr/bin/env node
// Render each chapter of the site to PNGs with headless Chromium on the real GPU.
// Frames are stepped, not waited for (`?still`, lib/still.ts), so the same
// commit renders the same pixels every run.
// Usage: node scripts/shots.mjs [--route /] [--url http://localhost:3000]
//        [--section <id>] [--settle <frames>] [--motion] [--full] [--live]
//        [--swiftshader]
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--")
    ? args[i + 1]
    : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const route = opt("route", "/");
const base = opt("url", "http://localhost:3000").replace(/\/$/, "");
const motion = flag("motion");
const full = flag("full");
// --live gives up determinism for speed: the page runs its own frameloop and
// each capture waits on the wall clock, as it did before ?still existed.
const still = !flag("live");
// Frames to step before a capture. `frameLerp(0.08)` is within 1 % of its
// target after 60, which is what most of the scene smooths at.
const settleFrames = Number(opt("settle", "60"));
const only = opt("section", null);
const swiftshader = flag("swiftshader");
const url = base + route + (still ? "?still" : "");
const slug = route.replace(/^\/+|\/+$/g, "").replace(/\//g, "-") || "root";

/** Let a frame reach rest: stepped frames in still mode, wall clock in --live. */
const settle = (page, ms) =>
  still
    ? page.evaluate((n) => window.__still?.step(n), settleFrames)
    : page.waitForTimeout(ms);

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 390, height: 844, isMobile: true, hasTouch: true },
];

async function ensureServer() {
  try {
    const res = await fetch(url, { redirect: "manual" });
    if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    console.error(
      `No server at ${url} (${e.message}). Start one with \`npm run dev\` first.`,
    );
    process.exit(2);
  }
}

/**
 * One labelled grid of a plate's frames, so its beat arc reads as a whole
 * rather than as a folder of stills. Composed as a file:// page and
 * screenshotted, which keeps the script dependency-free.
 */
async function contactSheet(browser, { dir, id, index, frames }) {
  const cols = Math.min(3, frames.length);
  const name = `${String(index).padStart(2, "0")}-${id}-sheet`;
  const cells = frames
    .map(
      ({ file, label }) =>
        `<figure><img src="${path.basename(file)}" alt="${label}"><figcaption>${label}</figcaption></figure>`,
    )
    .join("");
  const html = `<!doctype html><meta charset="utf-8"><title>${name}</title>
<style>
  body { margin: 0; padding: 16px; background: #1b1b1b; color: #e8e4dc;
         font: 13px ui-monospace, monospace; }
  h1 { font-size: 14px; font-weight: 500; margin: 0 0 12px; letter-spacing: .04em; }
  .grid { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 12px; }
  figure { margin: 0; }
  img { width: 100%; display: block; border: 1px solid #3a3a3a; }
  figcaption { padding-top: 4px; color: #a8a29a; }
</style>
<h1>${id} &middot; ${path.basename(dir)}</h1>
<div class="grid">${cells}</div>`;
  const htmlPath = path.join(dir, `${name}.html`);
  await writeFile(htmlPath, html);
  const context = await browser.newContext({
    // Short, so the full-page shot crops to the grid rather than to a viewport.
    viewport: { width: 1500, height: 200 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`file://${path.resolve(htmlPath)}`);
  const file = path.join(dir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await context.close();
  return file;
}

async function main() {
  await ensureServer();
  const browser = await chromium.launch({
    headless: true,
    // Headless Chromium reaches the real GPU through ANGLE's platform default
    // (Metal on macOS): ~2 ms a frame against SwiftShader's ~300, and the same
    // renderer the site is looked at in. --swiftshader is the fallback for a
    // machine with no usable GPU.
    args: swiftshader
      ? [
          "--use-gl=angle",
          "--use-angle=swiftshader",
          "--enable-unsafe-swiftshader",
          "--ignore-gpu-blocklist",
        ]
      : ["--use-gl=angle", "--ignore-gpu-blocklist"],
  });
  const written = [];
  const sheets = [];
  let glErrors = 0;
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: Boolean(vp.isMobile),
        hasTouch: Boolean(vp.hasTouch),
        deviceScaleFactor: 1,
        reducedMotion: motion ? "no-preference" : "reduce",
      });
      const page = await context.newPage();
      page.on("console", (msg) => {
        if (msg.type() === "error" && /WebGL|THREE/.test(msg.text())) {
          glErrors++;
          console.error(`[console] ${msg.text()}`);
        }
      });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts?.ready);
      await page.waitForSelector("canvas", { timeout: 15000 }).catch(() => {});
      if (still) {
        await page.waitForFunction(() => Boolean(window.__still), null, {
          timeout: 20000,
        });
      }
      // The intro's baked room arrives after first paint; give it a moment.
      await page
        .waitForSelector("html[data-baked-room]", { timeout: 25000 })
        .catch(() => {});
      // Real time, for the mount work the frameloop has no say over.
      await page.waitForTimeout(1200);
      // Then the fade-in, which does run on stepped frames.
      if (still) await page.evaluate(() => window.__still?.step(180));

      const dir = path.join("shots", slug, `${vp.width}x${vp.height}`);
      await mkdir(dir, { recursive: true });

      const ids = await page.$$eval("section[id]", (els) =>
        els.map((e) => e.id),
      );
      const kinds = await page.$$eval("section[id]", (els) =>
        els.map((e) => e.dataset.kind ?? "chapter"),
      );
      if (ids.length === 0) {
        const file = path.join(dir, "00-page.png");
        await page.screenshot({ path: file });
        written.push(file);
      } else {
        for (let i = 0; i < ids.length; i++) {
          if (only && ids[i] !== only) continue;
          if (kinds[i] === "plate") {
            // One frame per beat (60 % through it), plus the entry and exit.
            const beats = await page.$eval(`section[id="${ids[i]}"]`, (e) =>
              Number(e.dataset.beats ?? 0),
            );
            const scene = await page.$eval(`section[id="${ids[i]}"]`, (e) =>
              Boolean(e.dataset.scene),
            );
            // A dive plate has one slot past its beats: two frames of the
            // fly-in, mid-way and just before the cut.
            const dive = await page.$eval(`section[id="${ids[i]}"]`, (e) =>
              Boolean(e.dataset.dive),
            );
            const slots = beats + (dive ? 1 : 0);
            const fracs = scene
              ? [0.02, 0.2, 0.45, 0.75, 0.97]
              : beats > 0
                ? [
                    0.02,
                    ...Array.from(
                      { length: beats },
                      (_, b) => (b + 0.6) / slots,
                    ),
                    ...(dive
                      ? [(beats + 0.5) / slots, (beats + 0.95) / slots]
                      : []),
                    0.98,
                  ]
                : [0.1, 0.4, 0.7, 0.82, 0.95];
            const label = (f, j) =>
              beats > 0 && !scene
                ? j === 0
                  ? "in"
                  : j === fracs.length - 1
                    ? "out"
                    : j - 1 < beats
                      ? `b${j - 1}`
                      : `d${j - 1 - beats}`
                : `p${Math.round(f * 100)}`;
            const sheet = { dir, id: ids[i], index: i, frames: [] };
            for (const [j, f] of fracs.entries()) {
              await page.evaluate(
                ([id, frac]) => {
                  const el = document.getElementById(id);
                  if (!el) return;
                  const r = el.getBoundingClientRect();
                  const top = window.scrollY + r.top;
                  window.scrollTo({
                    top: top + (r.height - window.innerHeight) * frac,
                    behavior: "instant",
                  });
                },
                [ids[i], f],
              );
              await settle(page, 700);
              const file = path.join(
                dir,
                `${String(i).padStart(2, "0")}-${ids[i]}-${label(f, j)}.png`,
              );
              await page.screenshot({ path: file });
              written.push(file);
              sheet.frames.push({ file, label: label(f, j) });
            }
            sheets.push(sheet);
          } else {
            await page.evaluate((id) => {
              const el = document.getElementById(id);
              if (!el) return;
              const r = el.getBoundingClientRect();
              const target =
                window.scrollY + r.top + r.height / 2 - window.innerHeight / 2;
              window.scrollTo({
                top: Math.max(0, target),
                behavior: "instant",
              });
            }, ids[i]);
            await settle(page, 600);
            const file = path.join(
              dir,
              `${String(i).padStart(2, "0")}-${ids[i]}.png`,
            );
            await page.screenshot({ path: file });
            written.push(file);
          }
        }
      }
      if (full) {
        const file = path.join(dir, "full.png");
        await page.screenshot({ path: file, fullPage: true });
        written.push(file);
      }
      await context.close();
    }
    for (const sheet of sheets)
      written.push(await contactSheet(browser, sheet));
  } finally {
    await browser.close();
  }
  for (const f of written) console.log(f);
  if (glErrors > 0) {
    console.error(`${glErrors} WebGL/THREE console error(s)`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
