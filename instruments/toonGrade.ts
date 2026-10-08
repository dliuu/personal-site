"use client";

import { Effect, EffectAttribute } from "postprocessing";
import { Uniform } from "three";

/**
 * The illustrated look: shading quantised into bands with the colour kept,
 * ink outlines from depth and luminance, then a warm lofi grade with grain,
 * vignette and a touch of chromatic aberration. Gated by `strength`, so the
 * engraved codex chapters pass through untouched.
 */
const fragment = /* glsl */ `
uniform float strength;
uniform float bands;
uniform float outline;
uniform float grain;
uniform float time;

float luma(const in vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

/** Linear eye distance, so outline thresholds mean the same at any depth. */
float dist(const in vec2 uv) {
  float d = readDepth(uv);
  return (2.0 * cameraNear * cameraFar) /
    (cameraFar + cameraNear - (2.0 * d - 1.0) * (cameraFar - cameraNear));
}

float hash(const in vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 px = 1.0 / resolution;
  vec3 col = inputColor.rgb;

  // A whisper of chromatic aberration at the frame edge, not a fringe.
  vec2 fromCentre = uv - 0.5;
  float edge = dot(fromCentre, fromCentre);
  vec2 ca = fromCentre * edge * px.x * 9.0 * strength;
  col.r = texture2D(inputBuffer, uv + ca).r;
  col.b = texture2D(inputBuffer, uv - ca).b;

  // Quantise the shading but keep the hue, and only part of the way, so the
  // room reads illustrated rather than flattened.
  float l = max(luma(col), 1e-4);
  float steps = max(bands, 2.0);
  float lb = floor(l * steps) / steps;
  lb += smoothstep(0.7, 1.0, fract(l * steps)) / steps;
  vec3 toned = col * mix(1.0, mix(l, lb, 0.6) / l, strength);

  // Outlines from a depth Laplacian: comparing a pixel with the average of
  // its neighbours cancels the steady ramp of a floor or wall seen at an
  // angle, so only real discontinuities draw a line.
  float dc = dist(uv);
  float dl = dist(uv - vec2(px.x, 0.0));
  float dr = dist(uv + vec2(px.x, 0.0));
  float dd = dist(uv - vec2(0.0, px.y));
  float du = dist(uv + vec2(0.0, px.y));
  float lap = abs((dl + dr + dd + du) * 0.25 - dc) / max(dc, 0.5);
  float depthEdge = smoothstep(0.0035, 0.016, lap);
  // Luminance only helps where the surface is continuous, and only for a
  // strong step, otherwise wood grain and leaves become noise.
  float lumaStep = abs(luma(texture2D(inputBuffer, uv + vec2(px.x, px.y)).rgb)
                     - luma(texture2D(inputBuffer, uv - vec2(px.x, px.y)).rgb));
  float lumaEdge = smoothstep(0.42, 0.72, lumaStep) * (1.0 - depthEdge);
  float falloff = 1.0 - smoothstep(4.0, 9.0, dc);
  float ink = clamp(depthEdge + lumaEdge * 0.35, 0.0, 1.0) * falloff * outline * strength;
  vec3 lined = mix(toned, vec3(0.07, 0.06, 0.08), ink);

  // Lofi grade: lift the shadows warm, ease the saturation, warm the light.
  float lg = luma(lined);
  vec3 lift = vec3(0.03, 0.022, 0.03);
  vec3 graded = lined * (1.0 - lift) + lift;
  graded = mix(vec3(lg), graded, 0.88);
  graded *= mix(vec3(1.0), vec3(1.05, 1.0, 0.94), smoothstep(0.35, 1.0, lg));
  graded = mix(lined, graded, strength);

  // Fine grain and a gentle vignette.
  float g = (hash(uv * resolution + fract(time) * 137.0) - 0.5) * grain * strength;
  graded += g;
  float vig = 1.0 - edge * 0.38 * strength;
  outputColor = vec4(clamp(graded * vig, 0.0, 1.0), inputColor.a);
}
`;

export class ToonGradeImpl extends Effect {
  constructor() {
    super("ToonGradeEffect", fragment, {
      attributes: EffectAttribute.CONVOLUTION | EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform>([
        ["strength", new Uniform(0)],
        ["bands", new Uniform(9)],
        ["outline", new Uniform(0.55)],
        ["grain", new Uniform(0.016)],
        ["time", new Uniform(0)],
      ]),
    });
  }
}
