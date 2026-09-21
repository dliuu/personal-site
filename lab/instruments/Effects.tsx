"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  EffectComposer,
  Vignette,
  wrapEffect,
} from "@react-three/postprocessing";
import { Effect } from "postprocessing";
import { Color, SRGBColorSpace, Uniform } from "three";
import { frameLerp } from "@/lib/drawIn";
import { useLabStore } from "@/store/useLabStore";
import { useSectionsStore } from "@/store/useSectionsStore";
import { chapters } from "./chapters";
import { INK, PARCHMENT } from "./palette";

const fragment = /* glsl */ `
uniform vec3 ink;
uniform vec3 paper;
uniform float pitch;

float lineSet(float coord, float width) {
  float hw = 0.5 * width;
  float x = abs(fract(coord + 0.5) - 0.5);
  float aa = max(length(vec2(dFdx(coord), dFdy(coord))), 1e-5);
  return (clamp(x + 0.5 * aa, -hw, hw) - clamp(x - 0.5 * aa, -hw, hw)) / aa;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float l = clamp(dot(inputColor.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
  float dark = clamp((0.88 - l) / 0.88, 0.0, 1.0);
  vec2 p = uv * resolution / pitch;
  float a = lineSet(p.x + p.y, 0.75 * smoothstep(0.0, 1.0, dark));
  float b = lineSet(p.x - p.y, 0.7 * smoothstep(0.35, 1.0, dark));
  float c = lineSet(p.y * 1.5, 0.6 * smoothstep(0.7, 1.0, dark));
  float k = max(a, max(b, c));
  outputColor = vec4(mix(paper, ink, k), inputColor.a);
}
`;

class EngravingImpl extends Effect {
  constructor({
    ink,
    paper,
    pitch,
  }: {
    ink: string;
    paper: string;
    pitch: number;
  }) {
    super("EngravingEffect", fragment, {
      uniforms: new Map<string, Uniform>([
        ["ink", new Uniform(new Color(ink))],
        ["paper", new Uniform(new Color(paper))],
        ["pitch", new Uniform(pitch)],
      ]),
    });
    this.inputColorSpace = SRGBColorSpace;
  }
}

const Engraving = wrapEffect(EngravingImpl);

export function Effects() {
  const tier = useLabStore((s) => s.tier);
  const dpr = useThree((s) => s.viewport.dpr);
  const scene = useThree((s) => s.scene);
  const high = tier === "high";
  const pitch = useMemo(() => (high ? 7 : 9) * dpr, [high, dpr]);
  const effectRef = useRef<EngravingImpl | null>(null);
  const cur = useMemo(
    () => ({ ink: new Color(INK), paper: new Color(PARCHMENT) }),
    [],
  );
  const targets = useMemo(
    () =>
      chapters.map((c) => ({
        ink: new Color(c.palette.ink),
        paper: new Color(c.palette.paper),
      })),
    [],
  );

  useFrame((_, delta) => {
    const { active } = useSectionsStore.getState();
    const { reducedMotion } = useLabStore.getState();
    const tgt = targets[active] ?? targets[0];
    const k = reducedMotion ? 1 : frameLerp(0.08, delta);
    cur.ink.lerp(tgt.ink, k);
    cur.paper.lerp(tgt.paper, k);
    const e = effectRef.current;
    if (e) {
      (e.uniforms.get("ink")!.value as Color).copy(cur.ink);
      (e.uniforms.get("paper")!.value as Color).copy(cur.paper);
    }
    if (scene.background instanceof Color) scene.background.copy(cur.paper);
  });

  return (
    <EffectComposer multisampling={0}>
      <Engraving ref={effectRef} ink={INK} paper={PARCHMENT} pitch={pitch} />
      {high ? <Vignette eskil={false} offset={0.2} darkness={0.3} /> : <></>}
    </EffectComposer>
  );
}
