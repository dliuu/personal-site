"use client";

import {
  CanvasTexture,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  MeshBasicMaterial,
  SRGBColorSpace,
} from "three";
import {
  ATLAS_H,
  ATLAS_W,
  COL_W,
  header,
  LINE_H,
  logLines,
  PAGE_Y,
  STATUS_STRIPS,
  STATUS_Y,
  statusText,
  STRIP_STRIDE,
  taskTemplates,
  templateOrigin,
  VERDICT_Y,
  VIEW_LINES,
} from "@/lib/terminal";
import { chapters } from "./chapters";
import { roomFonts } from "./roomTextures";

/**
 * The worker screens: one canvas atlas of every task's terminal column, the
 * two verdict strips and the orchestrator status strips, plus a basic
 * material patched to window into it per instance. Attributes per instance:
 * `aOrigin` (uv of the column's top-left) and `aState` (scroll in lines,
 * lines printed, verdict 0/1/2).
 */

export const SCREEN_BG = "#0b0e14";
const KIND_COLOUR = { DEV: "#7fb0ff", TEST: "#7fe0c8", FEAT: "#ffc46b" };
const TEXT = "#c9d3e0";
const FONT = "600 17px ui-monospace, Menlo, Consolas, monospace";
const PAD = 10;

export function paintTerminalAtlas(
  ctx: CanvasRenderingContext2D,
  codexFont = "Georgia, serif",
): void {
  ctx.fillStyle = SCREEN_BG;
  ctx.fillRect(0, 0, ATLAS_W, ATLAS_H);
  ctx.font = FONT;
  ctx.textBaseline = "middle";
  const mid = (row: number) => row * LINE_H + LINE_H / 2;

  taskTemplates.forEach((t, i) => {
    const o = templateOrigin(i);
    // Header: the kind badge in its colour, then the task name.
    const badge = t.kind;
    ctx.fillStyle = KIND_COLOUR[t.kind];
    ctx.fillText(badge, o.x + PAD, o.y + mid(0));
    const bw = ctx.measureText(badge + " ").width;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(header(t).slice(badge.length), o.x + PAD + bw, o.y + mid(0));
    // Log: the first token (the command word) in blue, the rest in grey;
    // prompt lines in white.
    logLines(t).forEach((line, k) => {
      const y = o.y + mid(1 + k);
      if (line.startsWith("$")) {
        ctx.fillStyle = "#ffffff";
        ctx.fillText(line, o.x + PAD, y);
        return;
      }
      const sp = line.indexOf(" ");
      const head = sp > 0 ? line.slice(0, sp) : line;
      const rest = sp > 0 ? line.slice(sp) : "";
      ctx.fillStyle = KIND_COLOUR.DEV;
      ctx.fillText(head, o.x + PAD, y);
      ctx.fillStyle = TEXT;
      ctx.fillText(rest, o.x + PAD + ctx.measureText(head).width, y);
    });
  });

  // Verdict strips.
  ctx.fillStyle = "#123321";
  ctx.fillRect(0, VERDICT_Y, COL_W, LINE_H);
  ctx.fillStyle = "#8ef0a0";
  ctx.fillText("✓ PASS  all checks", PAD, VERDICT_Y + LINE_H / 2);
  ctx.fillStyle = "#3a1a18";
  ctx.fillRect(0, VERDICT_Y + STRIP_STRIDE, COL_W, LINE_H);
  ctx.fillStyle = "#ff6b5e";
  ctx.fillText("✗ FAIL  assertion", PAD, VERDICT_Y + STRIP_STRIDE + LINE_H / 2);

  // Status strips, centred.
  ctx.textAlign = "center";
  for (let s = 0; s < STATUS_STRIPS; s++) {
    const y = STATUS_Y + s * STRIP_STRIDE + LINE_H / 2;
    ctx.fillStyle = s === STATUS_STRIPS - 1 ? "#ff6b5e" : "#9cc0ff";
    ctx.fillText(statusText(s), COL_W / 2, y);
  }

  // The page: the codex's next chapter on its own paper, in its own face,
  // so the screen the plate dives into matches the band it cuts to.
  const pageH = VIEW_LINES * LINE_H;
  ctx.fillStyle = PAGE.palette.paper;
  ctx.fillRect(0, PAGE_Y, COL_W, pageH);
  ctx.textAlign = "left";
  ctx.fillStyle = PAGE.palette.accent;
  ctx.font = `20px ${codexFont}`;
  ctx.fillText(`Chapter ${PAGE.numeral}`, 24, PAGE_Y + 52);
  ctx.fillStyle = PAGE.palette.ink;
  ctx.font = `72px ${codexFont}`;
  ctx.fillText(PAGE.title, 22, PAGE_Y + 128);
  ctx.fillStyle = PAGE.palette.accent;
  ctx.fillRect(24, PAGE_Y + 146, 96, 2);
}

/** The chapter the Eisen plate's page shows: the one after it. */
const PAGE = chapters[chapters.findIndex((c) => c.id === "eisen") + 1];

export function terminalAtlas(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = ATLAS_W;
  c.height = ATLAS_H;
  paintTerminalAtlas(c.getContext("2d")!, roomFonts().fell);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Per-instance screen attributes for `count` screens, to set on the plane geometry. */
export function screenAttributes(count: number): {
  origin: InstancedBufferAttribute;
  state: InstancedBufferAttribute;
} {
  const origin = new InstancedBufferAttribute(new Float32Array(count * 2), 2);
  const state = new InstancedBufferAttribute(new Float32Array(count * 3), 3);
  origin.setUsage(DynamicDrawUsage);
  state.setUsage(DynamicDrawUsage);
  return { origin, state };
}

/** Point instance i's window at template `t`'s column. */
export function setTemplate(
  origin: InstancedBufferAttribute,
  i: number,
  t: number,
): void {
  const o = templateOrigin(t);
  origin.setXY(i, o.x / ATLAS_W, 1 - o.y / ATLAS_H);
}

/** Point instance i's window at the page. */
export function setPage(origin: InstancedBufferAttribute, i: number): void {
  origin.setXY(i, 0, 1 - PAGE_Y / ATLAS_H);
}

/** Point instance i's one-line window at status strip `s`. */
export function setStatus(
  origin: InstancedBufferAttribute,
  i: number,
  s: number,
): void {
  origin.setXY(i, 0, 1 - (STATUS_Y + s * STRIP_STRIDE) / ATLAS_H);
}

/**
 * A basic material that windows `viewLines` rows of the atlas per instance:
 * rows below the printed count are blank, and the verdict strip overlays the
 * bottom row once there is a verdict. With `cutout`, the dark ground is
 * discarded so only the glyphs draw (floating labels, no box).
 */
export function screenMaterial(
  atlas: CanvasTexture,
  viewLines: number,
  cutout = false,
): MeshBasicMaterial {
  const m = new MeshBasicMaterial({ map: atlas, toneMapped: false });
  const f = (n: number) => n.toFixed(6);
  const consts = `
const float ROWS = ${f(viewLines)};
const float COL_UW = ${f(COL_W / ATLAS_W)};
const float LINE_VH = ${f(LINE_H / ATLAS_H)};
const float PASS_V0 = ${f(1 - VERDICT_Y / ATLAS_H)};
const float FAIL_V0 = ${f(1 - (VERDICT_Y + STRIP_STRIDE) / ATLAS_H)};
`;
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute vec2 aOrigin;
attribute vec3 aState;
varying vec2 vOrigin;
varying vec3 vState;`,
      )
      .replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
vOrigin = aOrigin;
vState = aState;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec2 vOrigin;
varying vec3 vState;
${consts}`,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
#ifdef USE_MAP
  float rowF = (1.0 - vMapUv.y) * ROWS;
  float absLine = rowF + vState.x;
  vec2 auv = vec2(vOrigin.x + vMapUv.x * COL_UW, vOrigin.y - absLine * LINE_VH);
  vec4 sampledDiffuseColor = texture2D(map, auv);
  if (floor(absLine) + 1.0 > vState.y) sampledDiffuseColor = vec4(0.043, 0.055, 0.078, 1.0);
  if (vState.z > 0.5 && rowF > ROWS - 1.0) {
    float v0 = vState.z > 1.5 ? FAIL_V0 : PASS_V0;
    vec2 vuv = vec2(vMapUv.x * COL_UW, v0 - fract(rowF) * LINE_VH);
    sampledDiffuseColor = texture2D(map, vuv);
  }
  ${cutout ? "if (dot(sampledDiffuseColor.rgb, vec3(0.333)) < 0.08) discard;" : ""}
  diffuseColor *= sampledDiffuseColor;
#endif
`,
      );
  };
  m.customProgramCacheKey = () =>
    `screen-${viewLines}-${cutout ? "cut" : "box"}`;
  return m;
}
