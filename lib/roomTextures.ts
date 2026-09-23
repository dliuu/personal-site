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

/** A woven rug: two-colour stripes, a border, and noise. */
export function paintRug(ctx: Ctx, seed = 2): void {
  const { width: w, height: h } = ctx.canvas;
  const r = rng(seed);
  ctx.fillStyle = "#5a3a3a";
  ctx.fillRect(0, 0, w, h);
  const stripes = 14;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 ? "#6b4646" : "#4e3232";
    ctx.fillRect(0, (i / stripes) * h, w, h / stripes);
  }
  ctx.strokeStyle = "#c49a3c";
  ctx.lineWidth = Math.max(2, w * 0.012);
  ctx.strokeRect(w * 0.04, h * 0.04, w * 0.92, h * 0.92);
  for (let i = 0; i < w * h * 0.03; i++) {
    ctx.fillStyle = `rgba(255,255,255,${r() * 0.05})`;
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
