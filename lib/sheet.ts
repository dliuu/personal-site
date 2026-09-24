/**
 * Canvas painters for the Washington Capital sheet: the lettering a drawing
 * carries. Pure in (ctx size, colours) so the chapter downloads no images and
 * ships no font file. The wrapper that makes the texture is scene/sheetAtlas.
 *
 * PLACEHOLDER wording (owner input): the title block, the floor labels, the
 * note block and the dimension numerals.
 */
import { TENANTS } from "./site";

export type Ctx = CanvasRenderingContext2D;

export const ATLAS = 1024;

/** The four loan products the platform served, one per clad floor. */
export const FLOOR_LABELS = [
  "DSCR",
  "HARD MONEY",
  "REFINANCE",
  "BRIDGE",
] as const;

const TITLE = "FISH";
const SUBTITLE = "WHITE-LABEL LENDING PLATFORM";
const REVISION = "$1.3M ARR";
const NOTES = [
  "GUIDELINES CONFIGURED PER REGION",
  "CALCULATIONS SET BY ADMIN, LIVE",
  "12+ INSTITUTIONS ON ONE FRAME",
];

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Where each painter writes, in 0..1 UV space. Tested for overlap.
 *
 * `draw` is the one region sampled with a repeating wrap, and a wrap repeats
 * the whole texture rather than a sub-rect, so it takes a column of the
 * atlas's full height and its neighbours give up the width for it.
 */
export const RECTS: Record<
  "title" | "note" | "dim" | "floors" | "hatch" | "draw",
  Rect
> = {
  title: { x: 0, y: 0, w: 0.5, h: 0.25 },
  note: { x: 0.5, y: 0, w: 0.44, h: 0.22 },
  dim: { x: 0, y: 0.25, w: 0.5, h: 0.25 },
  hatch: { x: 0.5, y: 0.25, w: 0.44, h: 0.25 },
  floors: { x: 0, y: 0.5, w: 0.94, h: 0.5 },
  draw: { x: 0.94, y: 0, w: 0.06, h: 1 },
};

/** Dashes painted down the draw strip: the pattern the gold rods scroll. */
export const DRAW_DASHES = 4;

/** The hatch region is a grid, one cell per institution. */
const HATCH_COLS = 4;
const HATCH_ROWS = 3;

/** Institution `tenant`'s cell, wrapping so a 0..23 slot index can be passed straight in. */
export function hatchRect(tenant: number): Rect {
  const i = tenant % TENANTS;
  const b = RECTS.hatch;
  const w = b.w / HATCH_COLS;
  const h = b.h / HATCH_ROWS;
  return {
    x: b.x + (i % HATCH_COLS) * w,
    y: b.y + Math.floor(i / HATCH_COLS) * h,
    w,
    h,
  };
}

/** Pixel bounds of a rect on the atlas. */
function px(ctx: Ctx, r: Rect) {
  const { width: w, height: h } = ctx.canvas;
  return { x: r.x * w, y: r.y * h, w: r.w * w, h: r.h * h };
}

/** A drawn rule, the hairline a drawing is made of. */
function rule(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.strokeRect(x, y, w, h);
}

export function paintTitleBlock(ctx: Ctx, ink: string, accent: string): void {
  const b = px(ctx, RECTS.title);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  rule(ctx, b.x + 12, b.y + 12, b.w - 24, b.h - 24);
  ctx.fillStyle = ink;
  ctx.textBaseline = "top";
  ctx.font = "700 62px Georgia, serif";
  ctx.fillText(TITLE, b.x + 34, b.y + 40);
  ctx.font = "500 22px Georgia, serif";
  ctx.fillText(SUBTITLE, b.x + 34, b.y + 118);
  // The revision line carries the number the bullet claims.
  ctx.fillStyle = accent;
  ctx.font = "700 30px Georgia, serif";
  ctx.fillText(REVISION, b.x + 34, b.y + 158);
}

export function paintNoteBlock(ctx: Ctx, ink: string): void {
  const b = px(ctx, RECTS.note);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  rule(ctx, b.x + 12, b.y + 12, b.w - 24, b.h - 24);
  ctx.fillStyle = ink;
  ctx.textBaseline = "top";
  ctx.font = "600 24px Georgia, serif";
  ctx.fillText("NOTES", b.x + 30, b.y + 34);
  ctx.font = "400 20px Georgia, serif";
  NOTES.forEach((n, i) =>
    ctx.fillText(`${i + 1}. ${n}`, b.x + 30, b.y + 76 + i * 30),
  );
}

export function paintDimensions(ctx: Ctx, ink: string): void {
  const b = px(ctx, RECTS.dim);
  ctx.fillStyle = ink;
  ctx.textBaseline = "top";
  ctx.font = "700 54px Georgia, serif";
  ctx.fillText("56%", b.x + 30, b.y + 40);
  ctx.font = "400 20px Georgia, serif";
  ctx.fillText("RESPONSE TIME, YEAR OVER YEAR", b.x + 30, b.y + 110);
}

export function paintFloorLabels(ctx: Ctx, ink: string): void {
  const b = px(ctx, RECTS.floors);
  const rowH = b.h / FLOOR_LABELS.length;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.textBaseline = "middle";
  ctx.font = "600 40px Georgia, serif";
  FLOOR_LABELS.forEach((label, i) => {
    const y = b.y + i * rowH;
    ctx.fillText(label, b.x + 26, y + rowH / 2);
    ctx.beginPath();
    ctx.moveTo(b.x + 12, y + rowH);
    ctx.lineTo(b.x + b.w - 12, y + rowH);
    ctx.stroke();
  });
}

/** Institution `tenant`'s ruling: six angles, two spacings, no two alike. */
export function hatchStyle(tenant: number): { angle: number; step: number } {
  const i = tenant % TENANTS;
  return { angle: (i % 6) * (Math.PI / 6), step: 6 + Math.floor(i / 6) * 7 };
}

/**
 * Twelve institutions, twelve hatch patterns — never twelve colours. The
 * chapter is a drawing and gold is reserved for capital flow, so the faces are
 * told apart by the ruling on them: angle and spacing.
 */
export function paintHatches(ctx: Ctx, ink: string): void {
  const { width: W, height: H } = ctx.canvas;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < TENANTS; i++) {
    const r = hatchRect(i);
    const x = r.x * W;
    const y = r.y * H;
    const w = r.w * W;
    const h = r.h * H;
    const { angle, step } = hatchStyle(i);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const span = Math.hypot(w, h);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    for (let d = -span; d <= span; d += step) {
      ctx.beginPath();
      ctx.moveTo(
        x + w / 2 + dx * span - dy * d,
        y + h / 2 + dy * span + dx * d,
      );
      ctx.lineTo(
        x + w / 2 - dx * span - dy * d,
        y + h / 2 - dy * span + dx * d,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * The draw strip: evenly spaced dashes down a full-height column, the only
 * painted region meant to tile. A whole number of dashes fills the column, so
 * a rod that scrolls the strip by one atlas height is back where it started
 * and the phase reset at each pass boundary cannot be seen.
 */
export function paintDraws(ctx: Ctx, accent: string): void {
  const b = px(ctx, RECTS.draw);
  const period = b.h / DRAW_DASHES;
  ctx.fillStyle = accent;
  // Ink then paper: a run of payments travelling, not one bar sliding.
  for (let i = 0; i < DRAW_DASHES; i++)
    ctx.fillRect(b.x, b.y + i * period, b.w, period * 0.55);
}

export function paintSheet(ctx: Ctx, ink: string, accent: string): void {
  paintTitleBlock(ctx, ink, accent);
  paintNoteBlock(ctx, ink);
  paintDimensions(ctx, ink);
  paintHatches(ctx, ink);
  paintFloorLabels(ctx, ink);
  paintDraws(ctx, accent);
}
