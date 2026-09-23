"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  SMAA,
  Vignette,
  wrapEffect,
} from "@react-three/postprocessing";
import {
  Effect,
  type BloomEffect,
  type DepthOfFieldEffect,
} from "postprocessing";
import { Color, SRGBColorSpace, Uniform } from "three";
import { washAmount } from "@/lib/beats";
import { frameLerp } from "@/lib/drawIn";
import { lerp } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";
import { useSectionsStore } from "@/store/useSectionsStore";
import { chapters, sections } from "./chapters";
import { INK, PARCHMENT } from "./palette";
import { plateState } from "./plateState";
import { ToonGradeImpl } from "./toonGrade";

const fragment = /* glsl */ `
uniform vec3 ink;
uniform vec3 paper;
uniform float pitch;
uniform float wash;
uniform float reveal;

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
  // Hand-tint: the scene colour's chroma (luminance divided out) multiplies
  // the paper under the hatching; hatch density itself still follows light.
  vec3 chroma = min(inputColor.rgb / max(l, 0.02), vec3(1.6));
  vec3 base = paper * mix(vec3(1.0), chroma, wash);
  // Reveal: the engraving dissolves into the real render (the plate's globe).
  vec3 engraved = mix(base, ink, k);
  outputColor = vec4(mix(engraved, inputColor.rgb, reveal), inputColor.a);
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
        ["wash", new Uniform(0)],
        ["reveal", new Uniform(0)],
      ]),
    });
    this.inputColorSpace = SRGBColorSpace;
  }
}

const Engraving = wrapEffect(EngravingImpl);
const ToonGrade = wrapEffect(ToonGradeImpl);

export function Effects() {
  const tier = useLabStore((s) => s.tier);
  const dpr = useThree((s) => s.viewport.dpr);
  const scene = useThree((s) => s.scene);
  const high = tier === "high";
  const pitch = useMemo(() => (high ? 7 : 9) * dpr, [high, dpr]);
  const effectRef = useRef<EngravingImpl | null>(null);
  const bloomRef = useRef<BloomEffect | null>(null);
  const dofRef = useRef<DepthOfFieldEffect | null>(null);
  const toonRef = useRef<ToonGradeImpl | null>(null);
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
    const tgt = targets[sections[active]?.chapter ?? 0];
    const k = reducedMotion ? 1 : frameLerp(0.08, delta);
    cur.ink.lerp(tgt.ink, k);
    cur.paper.lerp(tgt.paper, k);
    const e = effectRef.current;
    if (e) {
      (e.uniforms.get("ink")!.value as Color).copy(cur.ink);
      (e.uniforms.get("paper")!.value as Color).copy(cur.paper);
      // A finer pitch as the plate hero expands, so the engraving keeps its
      // weight against a much larger subject.
      e.uniforms.get("pitch")!.value =
        (high ? lerp(7, 6, plateState.expand) : 9) * dpr;
      e.uniforms.get("wash")!.value = washAmount(plateState.expand);
      e.uniforms.get("reveal")!.value = plateState.reveal;
    }
    if (scene.background instanceof Color) scene.background.copy(cur.paper);
    // Bloom only exists for the revealed globe's emissives; chapters get none.
    // The illustrated look belongs to the room; chapters keep their engraving.
    if (toonRef.current) {
      const inScene = Boolean(chapters[sections[active]?.chapter ?? 0].scene);
      toonRef.current.uniforms.get("strength")!.value = inScene ? 1 : 0;
      toonRef.current.uniforms.get("grain")!.value = high ? 0.016 : 0.01;
      toonRef.current.uniforms.get("time")!.value = performance.now() / 1000;
    }
    // The room gets a lens: focus follows the camera's target (the figure at
    // rest, the screen on the way in), so the garden and foreground soften.
    if (dofRef.current) {
      const inScene = Boolean(chapters[sections[active]?.chapter ?? 0].scene);
      dofRef.current.bokehScale = inScene ? 2.4 : 0;
      dofRef.current.target = inScene ? plateState.introCam.tgt : null;
    }
    if (bloomRef.current) {
      bloomRef.current.intensity = 0.8 * plateState.reveal;
      // A scene (the room) wants its small lights to glow; the globe does not.
      bloomRef.current.luminanceMaterial.threshold = chapters[
        sections[active]?.chapter ?? 0
      ].scene
        ? 1.0
        : 1.3;
    }
  });

  return (
    <EffectComposer multisampling={0}>
      {/* Edges are smoothed on the raw render, before the hatching; bloom
          only lights the revealed globe's emissives. Both are high-tier. */}
      {high ? <SMAA /> : <></>}
      {high ? (
        <DepthOfField
          ref={dofRef}
          focalLength={0.05}
          worldFocusRange={2.2}
          bokehScale={0}
        />
      ) : (
        <></>
      )}
      {high ? (
        <Bloom
          ref={bloomRef}
          mipmapBlur
          luminanceThreshold={1.3}
          luminanceSmoothing={0.2}
          intensity={0}
        />
      ) : (
        <></>
      )}
      <Engraving ref={effectRef} ink={INK} paper={PARCHMENT} pitch={pitch} />
      <ToonGrade ref={toonRef} />
      {high ? <Vignette eskil={false} offset={0.2} darkness={0.3} /> : <></>}
    </EffectComposer>
  );
}
