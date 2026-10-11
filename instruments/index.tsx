"use client";

import { Stage } from "@/components/Stage";
import { Codex } from "./Codex";
import { Effects } from "./Effects";
import { HeroObjects } from "./HeroObjects";
import { PARCHMENT } from "./palette";

export default function Instruments() {
  return (
    <>
      <Stage
        shadows
        frameloop="always"
        background={PARCHMENT}
        cameraPosition={[0, 0, 6]}
      >
        <HeroObjects />
        <Effects />
      </Stage>
      <Codex />
    </>
  );
}
