/**
 * Canvas painters for the room. Each takes a 2D context and paints the whole
 * canvas; they are pure in (ctx size, seed, options) so the room downloads no
 * images. A tiny seeded RNG keeps every visit the same.
 */
export type Ctx = CanvasRenderingContext2D;

export function rng(seed: number): () => number {
  let x = (seed * 9301 + 49297) % 233280;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

/** Walnut: a warm base, curved grain lines, fine noise. */
export function paintWood(ctx: Ctx, seed = 1): void {
  const { width: w, height: h } = ctx.canvas;
  const r = rng(seed);
  ctx.fillStyle = "#5a3d2b";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 28; i++) {
    const y = (i / 28) * h + r() * 6;
    ctx.strokeStyle = `rgba(${30 + r() * 20}, ${18 + r() * 12}, ${10 + r() * 8}, ${0.25 + r() * 0.3})`;
    ctx.lineWidth = 1 + r() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += w / 8)
      ctx.quadraticCurveTo(
        x + w / 16,
        y + (r() - 0.5) * 10,
        x + w / 8,
        y + (r() - 0.5) * 6,
      );
    ctx.stroke();
  }
  for (let i = 0; i < w * h * 0.02; i++) {
    ctx.fillStyle = `rgba(0,0,0,${r() * 0.12})`;
    ctx.fillRect(r() * w, r() * h, 1, 1);
  }
}

/** A woven linen rug: soft stripes, a sage border, and noise. */
export function paintRug(ctx: Ctx, seed = 2): void {
  const { width: w, height: h } = ctx.canvas;
  const r = rng(seed);
  ctx.fillStyle = "#d9cdb8";
  ctx.fillRect(0, 0, w, h);
  const stripes = 14;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 ? "#e3d8c4" : "#cfc2ab";
    ctx.fillRect(0, (i / stripes) * h, w, h / stripes);
  }
  ctx.strokeStyle = "#7a8b6a";
  ctx.lineWidth = Math.max(2, w * 0.012);
  ctx.strokeRect(w * 0.04, h * 0.04, w * 0.92, h * 0.92);
  for (let i = 0; i < w * h * 0.03; i++) {
    ctx.fillStyle = `rgba(0,0,0,${r() * 0.05})`;
    ctx.fillRect(r() * w, r() * h, 1, 1);
  }
}

/** A night skyline: towers with lit windows, a few blinking, a sodium glow at the base. */
export function paintCity(ctx: Ctx, seed = 3): void {
  const { width: w, height: h } = ctx.canvas;
  const r = rng(seed);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#0b0d1a");
  sky.addColorStop(1, "#2a2140");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  let x = 0;
  while (x < w) {
    const bw = 18 + r() * 40;
    const bh = h * (0.25 + r() * 0.6);
    ctx.fillStyle = `rgb(${14 + r() * 10}, ${14 + r() * 10}, ${24 + r() * 12})`;
    ctx.fillRect(x, h - bh, bw, bh);
    for (let wy = h - bh + 6; wy < h - 6; wy += 9)
      for (let wx = x + 3; wx < x + bw - 4; wx += 7)
        if (r() < 0.45) {
          const warm = r() < 0.7;
          ctx.fillStyle = warm
            ? `rgba(255, ${190 + r() * 40}, ${120 + r() * 60}, ${0.5 + r() * 0.5})`
            : `rgba(${150 + r() * 60}, ${200 + r() * 40}, 255, ${0.4 + r() * 0.5})`;
          ctx.fillRect(wx, wy, 4, 5);
        }
    x += bw + 2 + r() * 6;
  }
  const glow = ctx.createLinearGradient(0, h * 0.7, 0, h);
  glow.addColorStop(0, "rgba(255,180,90,0)");
  glow.addColorStop(1, "rgba(255,180,90,0.35)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
}

/** A book spine with its title running up it. */
export function paintSpine(
  ctx: Ctx,
  title: string,
  color: string,
  font: string,
): void {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, w, h * 0.04);
  ctx.fillRect(0, h * 0.96, w, h * 0.04);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#efe4cc";
  ctx.font = `${Math.round(w * 0.55)}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, 0, 0, h * 0.9);
  ctx.restore();
}

/** A sticky note with a few handwritten lines. */
export function paintNote(
  ctx: Ctx,
  text: string,
  color: string,
  font: string,
): void {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, h * 0.9, w, h * 0.1);
  ctx.fillStyle = "#2b2118";
  ctx.font = `${Math.round(h * 0.16)}px ${font}`;
  const words = text.split(" ");
  let line = "";
  let y = h * 0.28;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > w * 0.84 && line) {
      ctx.fillText(line, w * 0.08, y);
      line = word;
      y += h * 0.2;
    } else line = test;
  }
  ctx.fillText(line, w * 0.08, y);
}

/** A soft radial gobo for the lamp: bright centre, dark edge. */
export function paintGobo(ctx: Ctx): void {
  const { width: w, height: h } = ctx.canvas;
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.55, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** A soft round sprite (dust, steam). */
export function paintSprite(ctx: Ctx, softness = 0.4): void {
  const { width: w, height: h } = ctx.canvas;
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(softness, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Neon: glowing script text on black (the plane is emissive; bloom does the halo). */
export function paintNeon(
  ctx: Ctx,
  text: string,
  color: string,
  font: string,
): void {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  ctx.font = `${Math.round(h * 0.6)}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = h * 0.15;
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2, w * 0.92);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.75;
  ctx.fillText(text, w / 2, h / 2, w * 0.92);
  ctx.globalAlpha = 1;
}

/** A photo in a frame: a soft two-tone gradient that reads as a picture from afar. */
export function paintPhoto(ctx: Ctx, seed = 4): void {
  const { width: w, height: h } = ctx.canvas;
  const r = rng(seed);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, `hsl(${200 + r() * 40}, 40%, 55%)`);
  g.addColorStop(1, `hsl(${20 + r() * 30}, 50%, 45%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(0, 0, w, h * 0.06);
  ctx.fillRect(0, h * 0.94, w, h * 0.06);
}

export type SkylineSide = "front" | "right";

/**
 * Manhattan at sunset, for the glass walls: a warm sky, the skyline in ink
 * with its landmarks, windows catching the last light, and the river giving
 * the sky back. `front` looks at Midtown with the sun going down behind it;
 * `right` looks downtown, where the sky is already cooling.
 */
export function paintSkyline(
  ctx: Ctx,
  side: SkylineSide = "front",
  seed = 6,
): void {
  const { width: w, height: h } = ctx.canvas;
  const front = side === "front";
  const r = rng(seed + (front ? 0 : 1));
  const hz = h * 0.68;
  const sunX = front ? w * 0.6 : w * 1.6;

  // Sky: indigo overhead falling to gold at the horizon.
  const sky = ctx.createLinearGradient(0, 0, 0, hz);
  for (const [at, c] of front
    ? ([
        [0, "#2c3262"],
        [0.28, "#6a4d86"],
        [0.52, "#c76a50"],
        [0.72, "#f0924b"],
        [0.9, "#ffd48c"],
        [1, "#ffe6ae"],
      ] as const)
    : ([
        [0, "#28305d"],
        [0.34, "#5a4b7f"],
        [0.62, "#ad6a6c"],
        [0.84, "#e6a06c"],
        [1, "#f6c98c"],
      ] as const))
    sky.addColorStop(at, c);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  if (front) {
    // Low enough that the towers cut into it.
    const sy = hz - h * 0.27;
    const glow = ctx.createRadialGradient(sunX, sy, 0, sunX, sy, w * 0.3);
    glow.addColorStop(0, "rgba(255, 225, 160, 0.95)");
    glow.addColorStop(0.15, "rgba(255, 175, 95, 0.5)");
    glow.addColorStop(1, "rgba(255, 150, 80, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, hz);
    ctx.fillStyle = "#fff3cc";
    ctx.beginPath();
    ctx.arc(sunX, sy, h * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  // Streaky clouds, lit from below.
  for (let i = 0; i < 10; i++) {
    const y = h * (0.06 + r() * 0.42);
    const len = w * (0.06 + r() * 0.22);
    ctx.fillStyle = `rgba(255, ${140 + r() * 70}, ${130 + r() * 70}, ${0.1 + r() * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(r() * w, y, len, h * (0.005 + r() * 0.012), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Towers are recorded so the river can mirror them.
  const towers: [number, number, number][] = [];
  const windows = (x: number, top: number, bw: number, lit: number) => {
    const sx = 6;
    const sy = 8;
    for (let wy = top + 5; wy < hz - 4; wy += sy)
      for (let wx = x + 3; wx < x + bw - 4; wx += sx)
        if (r() < lit) {
          ctx.fillStyle = `rgba(255, ${190 + r() * 50}, ${110 + r() * 70}, ${0.35 + r() * 0.55})`;
          ctx.fillRect(wx, wy, 3, 4);
        }
    // The facade toward the sun catches it.
    const toSun = sunX > x + bw / 2 ? x + bw - 2 : x;
    ctx.fillStyle = "rgba(255, 170, 100, 0.28)";
    ctx.fillRect(toSun, top, 2, hz - top);
  };
  const block = (x: number, bw: number, top: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, top, bw, hz - top);
    towers.push([x, bw, top]);
  };
  // A polygon in (x, y) pairs, bottomed on the horizon.
  const shape = (pts: [number, number][], color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], hz);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(pts[pts.length - 1][0], hz);
    ctx.closePath();
    ctx.fill();
  };
  // Stepped setbacks: tiers of (width fraction, top) from the base up.
  const tiers = (
    cx: number,
    bw: number,
    steps: [number, number][],
    color: string,
  ) => {
    ctx.fillStyle = color;
    let base = hz;
    for (const [f, top] of steps) {
      ctx.fillRect(cx - (bw * f) / 2, top, bw * f, base - top);
      base = top;
    }
    towers.push([cx - bw / 2, bw, steps[0][1]]);
  };

  // Far bank of buildings in the haze, then the skyline in ink.
  const haze = front ? "rgba(150, 100, 120, 0.55)" : "rgba(120, 95, 135, 0.55)";
  for (let x = -10; x < w + 10; x += 6 + r() * 14) {
    const bw = 10 + r() * 26;
    ctx.fillStyle = haze;
    ctx.fillRect(x, hz - h * (0.03 + r() * 0.1), bw, h);
  }
  const ink = "#23243a";
  const inkFar = "#332f4a";
  for (let x = -10; x < w + 10; x += 4 + r() * 10) {
    const bw = 22 + r() * 54;
    const top = hz - h * (0.06 + r() * 0.17);
    block(x, bw, top, r() < 0.4 ? inkFar : ink);
    if (r() < 0.35) {
      // A narrower storey or two on top, sometimes a water tank.
      ctx.fillRect(x + bw * 0.25, top - h * 0.02, bw * 0.5, h * 0.02);
      if (r() < 0.5) ctx.fillRect(x + bw * 0.4, top - h * 0.035, 6, h * 0.015);
    }
    windows(x, top, bw, 0.22);
  }

  if (front) {
    // Midtown from the south: Bank of America, the Empire State, One
    // Vanderbilt, the Chrysler, and the pencil towers off to the east.
    const boa = w * 0.29;
    shape(
      [
        [boa - w * 0.022, hz],
        [boa - w * 0.022, hz - h * 0.3],
        [boa + w * 0.006, hz - h * 0.36],
        [boa + w * 0.022, hz - h * 0.33],
        [boa + w * 0.022, hz],
      ],
      ink,
    );
    ctx.fillRect(boa + w * 0.002, hz - h * 0.42, 3, h * 0.07);
    towers.push([boa - w * 0.022, w * 0.044, hz - h * 0.3]);
    windows(boa - w * 0.022, hz - h * 0.3, w * 0.044, 0.3);
    const esb = w * 0.4;
    const ew = w * 0.06;
    tiers(
      esb,
      ew,
      [
        [1, hz - h * 0.14],
        [0.72, hz - h * 0.3],
        [0.5, hz - h * 0.37],
        [0.3, hz - h * 0.41],
        [0.14, hz - h * 0.44],
      ],
      ink,
    );
    ctx.fillRect(esb - 2, hz - h * 0.52, 4, h * 0.09);
    windows(esb - ew / 2, hz - h * 0.14, ew, 0.32);
    windows(esb - ew * 0.36, hz - h * 0.3, ew * 0.72, 0.32);
    const ov = w * 0.49;
    shape(
      [
        [ov - w * 0.02, hz],
        [ov - w * 0.02, hz - h * 0.2],
        [ov - w * 0.011, hz - h * 0.4],
        [ov - w * 0.004, hz - h * 0.44],
        [ov + w * 0.004, hz - h * 0.44],
        [ov + w * 0.011, hz - h * 0.4],
        [ov + w * 0.02, hz - h * 0.2],
        [ov + w * 0.02, hz],
      ],
      ink,
    );
    towers.push([ov - w * 0.02, w * 0.04, hz - h * 0.2]);
    windows(ov - w * 0.02, hz - h * 0.2, w * 0.04, 0.35);
    const chr = w * 0.56;
    const cw = w * 0.04;
    const crown: [number, number][] = [[1, hz - h * 0.25]];
    for (let k = 1; k <= 6; k++)
      crown.push([1 - k * 0.14, hz - h * (0.25 + k * 0.02)]);
    tiers(chr, cw, crown, ink);
    ctx.fillRect(chr - 1.5, hz - h * 0.43, 3, h * 0.07);
    windows(chr - cw / 2, hz - h * 0.25, cw, 0.3);
    for (const [u, hh, ww] of [
      [0.7, 0.42, 0.016],
      [0.76, 0.46, 0.024],
      [0.81, 0.38, 0.014],
    ] as const) {
      block(w * u, w * ww, hz - h * hh, ink);
      windows(w * u, hz - h * hh, w * ww, 0.3);
    }
  } else {
    // Downtown from the east: Woolworth, One World Trade with its neighbours,
    // 70 Pine and the towers of the financial district.
    const wool = w * 0.32;
    tiers(
      wool,
      w * 0.034,
      [
        [1, hz - h * 0.19],
        [0.6, hz - h * 0.28],
        [0.3, hz - h * 0.31],
      ],
      ink,
    );
    windows(wool - w * 0.017, hz - h * 0.19, w * 0.034, 0.3);
    const wtc = w * 0.46;
    const ww = w * 0.058;
    shape(
      [
        [wtc - ww / 2, hz],
        [wtc - ww / 2, hz - h * 0.05],
        [wtc - ww * 0.31, hz - h * 0.44],
        [wtc + ww * 0.31, hz - h * 0.44],
        [wtc + ww / 2, hz - h * 0.05],
        [wtc + ww / 2, hz],
      ],
      ink,
    );
    ctx.fillRect(wtc - 2, hz - h * 0.54, 4, h * 0.1);
    towers.push([wtc - ww / 2, ww, hz - h * 0.05]);
    windows(wtc - ww * 0.36, hz - h * 0.4, ww * 0.72, 0.36);
    // The glass of One World Trade takes the whole sky on its west face.
    const sheen = ctx.createLinearGradient(0, hz - h * 0.44, 0, hz);
    sheen.addColorStop(0, "rgba(255, 190, 140, 0.35)");
    sheen.addColorStop(1, "rgba(255, 150, 110, 0.05)");
    ctx.fillStyle = sheen;
    ctx.fillRect(wtc - ww * 0.3, hz - h * 0.43, ww * 0.16, h * 0.43);
    for (const [u, hh, bw] of [
      [0.52, 0.36, 0.04],
      [0.57, 0.3, 0.036],
      [0.4, 0.3, 0.03],
    ] as const) {
      block(w * u, w * bw, hz - h * hh, ink);
      windows(w * u, hz - h * hh, w * bw, 0.3);
    }
    ctx.fillStyle = ink;
    ctx.fillRect(w * 0.52 + 4, hz - h * 0.4, 3, h * 0.04);
    ctx.fillRect(w * 0.56 - 7, hz - h * 0.4, 3, h * 0.04);
    const pine = w * 0.66;
    tiers(
      pine,
      w * 0.03,
      [
        [1, hz - h * 0.2],
        [0.7, hz - h * 0.26],
        [0.4, hz - h * 0.3],
        [0.15, hz - h * 0.33],
      ],
      ink,
    );
    windows(pine - w * 0.015, hz - h * 0.2, w * 0.03, 0.3);
    for (const [u, hh, bw] of [
      [0.72, 0.24, 0.034],
      [0.24, 0.26, 0.028],
    ] as const) {
      block(w * u, w * bw, hz - h * hh, ink);
      windows(w * u, hz - h * hh, w * bw, 0.28);
    }
  }

  // The river: the sky again, darker and broken by ripples, with the towers
  // standing on their heads in it and the sun laid out in a path.
  const water = ctx.createLinearGradient(0, hz, 0, h);
  water.addColorStop(0, front ? "#d9895a" : "#c98a72");
  water.addColorStop(0.3, front ? "#7a5470" : "#6e5578");
  water.addColorStop(1, "#2a2a48");
  ctx.fillStyle = water;
  ctx.fillRect(0, hz, w, h - hz);
  ctx.fillStyle = "rgba(30, 30, 58, 0.3)";
  for (const [x, bw, top] of towers) ctx.fillRect(x, hz, bw, (hz - top) * 0.22);
  for (let i = 0; i < 260; i++) {
    const y = hz + r() * (h - hz);
    const d = (y - hz) / (h - hz);
    ctx.fillStyle = `rgba(255, ${170 + r() * 60}, ${120 + r() * 60}, ${(0.05 + r() * 0.16) * (1 - d * 0.6)})`;
    ctx.fillRect(r() * w, y, 8 + r() * 50, 1 + Math.round(r() * 1.5));
  }
  if (front) {
    for (let i = 0; i < 90; i++) {
      const y = hz + r() * (h - hz) * 0.7;
      const d = (y - hz) / (h - hz);
      ctx.fillStyle = `rgba(255, 220, 160, ${0.12 + r() * 0.3 * (1 - d)})`;
      ctx.fillRect(
        sunX + (r() - 0.5) * w * 0.08 * (1 + d * 3),
        y,
        6 + r() * 30,
        2,
      );
    }
  }
}
