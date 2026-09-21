#!/usr/bin/env node
// Render each chapter of a lab route to PNGs with headless Chromium + software WebGL.
// Usage: node scripts/shots.mjs [--route /lab/instruments] [--url http://localhost:3000] [--motion] [--full]
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--")
    ? args[i + 1]
    : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const route = opt("route", "/lab/instruments");
const base = opt("url", "http://localhost:3000").replace(/\/$/, "");
const motion = flag("motion");
const full = flag("full");
const url = base + route;
const slug = route.replace(/^\/+|\/+$/g, "").replace(/\//g, "-") || "root";

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

async function main() {
  await ensureServer();
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const written = [];
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
      await page.waitForTimeout(1200);

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
          if (kinds[i] === "plate") {
            for (const f of [0.1, 0.4, 0.7, 0.95]) {
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
              await page.waitForTimeout(700);
              const file = path.join(
                dir,
                `${String(i).padStart(2, "0")}-${ids[i]}-p${Math.round(f * 100)}.png`,
              );
              await page.screenshot({ path: file });
              written.push(file);
            }
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
            await page.waitForTimeout(600);
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
