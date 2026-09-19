"use client";

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import {
  EffectComposer,
  Vignette,
  wrapEffect,
} from "@react-three/postprocessing";
import { Effect } from "postprocessing";
import { Color, Uniform } from "three";
import { useLabStore } from "@/store/useLabStore";
import { INK, PAPER } from "./palette";

const fragment = /* glsl */ `
uniform vec3 ink;
uniform vec3 paper;
uniform float pitch;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float l = clamp(dot(inputColor.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
  vec2 p = mat2(0.7071, -0.7071, 0.7071, 0.7071) * (uv * resolution / pitch);
  float d = length(fract(p) - 0.5);
  float r = 0.62 * sqrt(1.0 - l);
  float k = 1.0 - smoothstep(r - 0.06, r + 0.06, d);
  outputColor = vec4(mix(paper, ink, k), inputColor.a);
}
`;

class HalftoneImpl extends Effect {
  constructor({
    ink,
    paper,
    pitch,
  }: {
    ink: string;
    paper: string;
    pitch: number;
  }) {
    super("HalftoneEffect", fragment, {
      uniforms: new Map<string, Uniform>([
        ["ink", new Uniform(new Color(ink))],
        ["paper", new Uniform(new Color(paper))],
        ["pitch", new Uniform(pitch)],
      ]),
    });
  }
}

const Halftone = wrapEffect(HalftoneImpl);

export function Effects() {
  const tier = useLabStore((s) => s.tier);
  const dpr = useThree((s) => s.viewport.dpr);
  const high = tier === "high";
  const pitch = useMemo(() => (high ? 8 : 6) * dpr, [high, dpr]);
  return (
    <EffectComposer multisampling={0}>
      <Halftone ink={INK} paper={PAPER} pitch={pitch} />
      {high ? <Vignette eskil={false} offset={0.2} darkness={0.35} /> : <></>}
    </EffectComposer>
  );
}
