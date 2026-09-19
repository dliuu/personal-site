"use client";

import {
  DotScreen,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useLabStore } from "@/store/useLabStore";

export function Effects() {
  const tier = useLabStore((s) => s.tier);
  const high = tier === "high";
  const effects = [
    <DotScreen
      key="dots"
      angle={Math.PI * 0.25}
      scale={high ? 1.6 : 2.2}
      blendFunction={BlendFunction.NORMAL}
    />,
    <Noise
      key="noise"
      opacity={high ? 0.12 : 0.08}
      blendFunction={BlendFunction.MULTIPLY}
    />,
  ];
  if (high)
    effects.push(
      <Vignette key="vignette" eskil={false} offset={0.2} darkness={0.55} />,
    );
  return <EffectComposer multisampling={0}>{effects}</EffectComposer>;
}
