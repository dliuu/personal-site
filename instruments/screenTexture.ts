"use client";

import { CanvasTexture, SRGBColorSpace } from "three";

/** What he is typing: this site's own camera code. */
const SOURCE = [
  "// Orbit the sphere's centre: rise to the anchor's",
  "// latitude, sit k radii out, and look at the centre.",
  "if (parent && plateState.instrument) {",
  "  tmp.current.set(0, -PLATE_LIFT, 0);",
  "  parent.localToWorld(tmp.current);",
  "  const R = 1.05 * parent.scale.x;",
  "  const { el, k } = plateState.cam;",
  "  plateGoal.current",
  "    .set(0, Math.sin(el), Math.cos(el))",
  "    .multiplyScalar(k * R)",
  "    .add(tmp.current);",
  "  goalPos.current.lerp(plateGoal.current, expand);",
  "  goalTgt.current.lerp(tmp.current, expand);",
  "}",
  "const ck = reducedMotion ? 1 : frameLerp(CAM_LERP, delta);",
  "camPos.current.lerp(goalPos.current, ck);",
  "camTgt.current.lerp(goalTgt.current, ck);",
  "camera.position.copy(camPos.current);",
  "camera.lookAt(camTgt.current);",
  "",
  "export function faceYaw(lon: number): number {",
  "  return -Math.PI / 2 - lon * D2R;",
  "}",
];
const TOTAL = SOURCE.reduce((n, l) => n + l.length + 1, 0);
const KEYWORDS =
  /\b(const|let|function|return|if|export|import|from|new|number)\b/g;

export type Screen = {
  texture: CanvasTexture;
  /** Redraw: `time` in seconds drives typing and the cursor; `fade` (0..1) covers the picture with `fadeColor`. */
  draw(
    time: number,
    typing: boolean,
    blink: boolean,
    fade: number,
    fadeColor: string,
  ): void;
};

export function makeScreen(): Screen {
  const W = 1024;
  const H = 640;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;

  const paintLine = (line: string, x: number, y: number) => {
    // Comments, strings, then keywords and numbers; plain text otherwise.
    if (line.trimStart().startsWith("//")) {
      ctx.fillStyle = "#5c6b7a";
      ctx.fillText(line, x, y);
      return;
    }
    let cx = x;
    const parts = line.split(/(".*?"|\b\d+(?:\.\d+)?\b)/g);
    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith('"')) ctx.fillStyle = "#c3e88d";
      else if (/^\d/.test(part)) ctx.fillStyle = "#f78c6c";
      else {
        // Keywords inside plain runs.
        let last = 0;
        for (const m of part.matchAll(KEYWORDS)) {
          ctx.fillStyle = "#d6deeb";
          ctx.fillText(part.slice(last, m.index), cx, y);
          cx += ctx.measureText(part.slice(last, m.index)).width;
          ctx.fillStyle = "#c792ea";
          ctx.fillText(m[0], cx, y);
          cx += ctx.measureText(m[0]).width;
          last = (m.index ?? 0) + m[0].length;
        }
        ctx.fillStyle = "#d6deeb";
        ctx.fillText(part.slice(last), cx, y);
        cx += ctx.measureText(part.slice(last)).width;
        continue;
      }
      ctx.fillText(part, cx, y);
      cx += ctx.measureText(part).width;
    }
  };

  return {
    texture,
    draw(time, typing, blink, fade, fadeColor) {
      ctx.fillStyle = "#12141a";
      ctx.fillRect(0, 0, W, H);
      // Title bar.
      ctx.fillStyle = "#1b1e26";
      ctx.fillRect(0, 0, W, 44);
      for (const [i, c] of ["#ff5f57", "#febc2e", "#28c840"].entries()) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(28 + i * 26, 22, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = "500 18px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "#8a93a3";
      ctx.fillText("HeroObjects.tsx — personal-site", 120, 29);
      // Gutter.
      ctx.fillStyle = "#171a21";
      ctx.fillRect(0, 44, 64, H - 44 - 36);
      // Code, revealed by typing.
      const shown = typing ? Math.floor(time * 14) % (TOTAL + 160) : TOTAL;
      ctx.font = "22px ui-monospace, SFMono-Regular, Menlo, monospace";
      let budget = shown;
      let cursor: [number, number] | null = null;
      for (let i = 0; i < SOURCE.length; i++) {
        const y = 80 + i * 24;
        ctx.fillStyle = "#3b4352";
        ctx.textAlign = "right";
        ctx.fillText(String(i + 1), 48, y);
        ctx.textAlign = "left";
        const line = SOURCE[i];
        if (budget <= 0) {
          cursor ??= [80, y];
          break;
        }
        const part = line.slice(0, budget);
        paintLine(part, 80, y);
        if (budget <= line.length) {
          cursor = [80 + ctx.measureText(part).width + 2, y];
        }
        budget -= line.length + 1;
      }
      if (!cursor) {
        const y = 80 + SOURCE.length * 24;
        cursor = [80, y];
      }
      if (!blink || Math.floor(time * 2) % 2 === 0) {
        ctx.fillStyle = "#d6deeb";
        ctx.fillRect(cursor[0], cursor[1] - 18, 2, 22);
      }
      // Status bar.
      ctx.fillStyle = "#1b1e26";
      ctx.fillRect(0, H - 36, W, 36);
      ctx.font = "500 16px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "#8a93a3";
      ctx.fillText(
        "TypeScript React   ·   main   ·   Ln 212, Col 7",
        24,
        H - 13,
      );
      const d = new Date();
      ctx.textAlign = "right";
      ctx.fillText(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
        W - 24,
        H - 13,
      );
      ctx.textAlign = "left";
      if (fade > 0) {
        ctx.globalAlpha = fade;
        ctx.fillStyle = fadeColor;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      texture.needsUpdate = true;
    },
  };
}
