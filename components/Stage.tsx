"use client";

import { Canvas } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import { Leva } from "leva";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { pickInitialTier } from "@/lib/quality";
import { useLabStore } from "@/store/useLabStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { WebGLFallback } from "./WebGLFallback";

export type StageProps = {
  children: ReactNode;
  shadows?: boolean;
  fog?: { color: string; near: number; far: number };
  background?: string;
  frameloop?: "always" | "demand";
  cameraPosition?: [number, number, number];
};

const isProd = process.env.NODE_ENV === "production";

function detectWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Stage({
  children,
  shadows = false,
  fog,
  background,
  frameloop = "always",
  cameraPosition = [0, 2, 6],
}: StageProps) {
  const tier = useLabStore((s) => s.tier);
  const setTier = useLabStore((s) => s.setTier);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  useReducedMotion();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(detectWebGL());
    const nav = navigator as Navigator & { deviceMemory?: number };
    setTier(
      pickInitialTier({
        touch: window.matchMedia("(pointer: coarse)").matches,
        cores: nav.hardwareConcurrency,
        memory: nav.deviceMemory,
      }),
    );
  }, [setTier]);

  if (webgl === null) return null;
  if (!webgl) return <WebGLFallback />;

  const high = tier === "high";

  return (
    <>
      <Leva hidden={isProd} collapsed />
      <Canvas
        shadows={shadows && high}
        dpr={high ? [1, 2] : 1}
        frameloop={frameloop}
        camera={{ position: cameraPosition, fov: 45 }}
        style={{ position: "fixed", inset: 0 }}
      >
        {background ? <color attach="background" args={[background]} /> : null}
        {fog ? <fog attach="fog" args={[fog.color, fog.near, fog.far]} /> : null}
        <Suspense fallback={null}>{children}</Suspense>
        {isProd ? null : <Stats />}
      </Canvas>
    </>
  );
}
