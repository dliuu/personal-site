import { PHASE } from "./network";
import { smooth } from "./beats";

/**
 * What a worker's screen shows and when. Pure: the task templates, the log
 * lines each one prints, how many lines are printed at a cycle fraction, how
 * far the window has scrolled, and the atlas layout the painter and shader
 * share. The canvas painter (scene/terminalAtlas.ts) draws it.
 */

export type Kind = "DEV" | "TEST" | "FEAT";
export type TaskTemplate = {
  kind: Kind;
  name: string;
  file: string;
  n: number;
};

/** PLACEHOLDER tasks (owner input): four of each kind, all fintech-shaped. */
export const taskTemplates: TaskTemplate[] = [
  { kind: "DEV", name: "ledger rounding", file: "ledger/round.py", n: 4821 },
  { kind: "DEV", name: "settlement retry", file: "settle/retry.py", n: 4830 },
  { kind: "DEV", name: "kyc webhook", file: "kyc/webhook.py", n: 4837 },
  { kind: "DEV", name: "rate limiter", file: "api/limits.py", n: 4842 },
  { kind: "TEST", name: "kyc-suite", file: "tests/kyc", n: 4822 },
  { kind: "TEST", name: "ledger-invariants", file: "tests/ledger", n: 4828 },
  { kind: "TEST", name: "api-contract", file: "tests/contract", n: 4835 },
  { kind: "TEST", name: "e2e-onboarding", file: "tests/e2e", n: 4840 },
  { kind: "FEAT", name: "statement export", file: "stmt/export.py", n: 4825 },
  { kind: "FEAT", name: "audit trail", file: "audit/trail.py", n: 4831 },
  { kind: "FEAT", name: "multi-entity", file: "org/entity.py", n: 4838 },
  { kind: "FEAT", name: "sanctions screen", file: "risk/screen.py", n: 4844 },
];

/** Log lines per template, after the header. */
export const LOG_LINES = 12;
/** Lines a screen shows at once. */
export const VIEW_LINES = 8;
/** Widest line the painter will draw at its font (chars). */
export const MAX_CHARS = 26;

/** The header line: kind badge and task name. */
export function header(t: TaskTemplate): string {
  return `${t.kind} · ${t.name}`;
}

/** The twelve lines a task prints, by kind, deterministic per template. */
export function logLines(t: TaskTemplate): string[] {
  const base = t.file.split("/").pop() ?? t.file;
  const stem = base.replace(/\.py$/, "");
  const lines =
    t.kind === "DEV"
      ? [
          `$ agent run --task ${t.n}`,
          `read  ${t.file}`,
          "plan  3 steps",
          `edit  ${base} +14 −6`,
          `edit  test_${stem}.py +22`,
          `run   pytest -q ${stem}`,
          "........  8 passed",
          "lint  ruff · clean",
          "diff  2 files, +36 −6",
          "self-review ok",
          `push  agent/${t.n}`,
          `open  PR #${1900 + (t.n % 100)}`,
        ]
      : t.kind === "TEST"
        ? [
            `$ agent test --task ${t.n}`,
            `load  ${t.file}/*`,
            "found 41 cases",
            "seed  fixtures · 12",
            "run   1/41 ok",
            "run   17/41 ok",
            "run   29/41 ok",
            "run   38/41 ok",
            "cover 94.1%",
            "flaky 0",
            "report junit.xml",
            "done  41 cases",
          ]
        : [
            `$ agent ship --task ${t.n}`,
            `spec  ${t.name}`,
            "scaffold 4 files",
            `edit  ${base} +88`,
            "edit  schema.sql +19",
            "migrate up · ok",
            `run   pytest -q ${stem}`,
            "........  14 passed",
            "flag  rollout 5%",
            "docs  changelog +1",
            `push  agent/${t.n}`,
            "ready for review",
          ];
  return lines.map((l) => l.slice(0, MAX_CHARS));
}

/**
 * Lines printed at cycle fraction f: nothing before spin up, the header at
 * spin up, then the log streams in through the run to the verdict.
 */
export function printedLines(f: number): number {
  if (f < PHASE.up) return 0;
  const u = Math.min(1, (f - PHASE.up) / (PHASE.verdict - PHASE.up));
  return 1 + LOG_LINES * u;
}

/** Window scroll (lines from the column top) so the last printed line stays in view. */
export function screenScroll(printed: number): number {
  return Math.max(
    0,
    Math.min(1 + LOG_LINES - VIEW_LINES, printed - VIEW_LINES),
  );
}

/** Verdict row: 0 none yet, 1 pass, 2 fail. */
export function verdictCode(f: number, ok: boolean): 0 | 1 | 2 {
  if (f < PHASE.verdict) return 0;
  return ok ? 1 : 2;
}

/** Screen brightness: full while it runs, dark through teardown. */
export function screenDim(f: number): number {
  return 1 - 0.85 * smooth(PHASE.down, PHASE.gap, f);
}

/** Orchestrator status strips: `N running` for N in 0..7, then `retrying`. */
export const STATUS_STRIPS = 9;
export function statusStrip(running: number, retrying: boolean): number {
  if (retrying) return STATUS_STRIPS - 1;
  return Math.max(0, Math.min(STATUS_STRIPS - 2, running));
}
export function statusText(strip: number): string {
  return strip === STATUS_STRIPS - 1 ? "retrying" : `${strip} running`;
}

/**
 * Atlas layout, in pixels. Template columns tile in a grid; below them two
 * verdict strips (pass, fail) and the status strips. Every row is LINE_H
 * tall and every column COL_W wide, so the shader addresses lines directly.
 */
export const COL_W = 256;
export const LINE_H = 24;
export const COLS = 4;
export const COL_LINES = 1 + LOG_LINES;
export const ATLAS_W = COLS * COL_W;
const TEMPLATE_ROWS = Math.ceil(taskTemplates.length / COLS);
export const VERDICT_Y = TEMPLATE_ROWS * COL_LINES * LINE_H;
/**
 * Strips are one line of text on a two-line stride: the blank line between
 * them keeps mipmaps from bleeding a neighbour's text into a strip drawn small.
 */
export const STRIP_STRIDE = 2 * LINE_H;
export const STATUS_Y = VERDICT_Y + 2 * STRIP_STRIDE;
/**
 * The page: one screen's worth of rows (VIEW_LINES) painted as the codex's
 * next page, for the terminal the Eisen plate dives into.
 */
export const PAGE_Y = STATUS_Y + STATUS_STRIPS * STRIP_STRIDE;
export const ATLAS_H = PAGE_Y + VIEW_LINES * LINE_H;

/** Top-left pixel of template i's column. */
export function templateOrigin(i: number): { x: number; y: number } {
  return {
    x: (i % COLS) * COL_W,
    y: Math.floor(i / COLS) * COL_LINES * LINE_H,
  };
}
