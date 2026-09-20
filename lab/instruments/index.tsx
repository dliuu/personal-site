"use client";

import { Stage } from "@/components/Stage";
import { Codex } from "./Codex";
import { HeroObjects } from "./HeroObjects";
import { PARCHMENT } from "./palette";

export default function Instruments() {
  return (
    <>
      <Stage
        frameloop="always"
        background={PARCHMENT}
        cameraPosition={[0, 0, 6]}
      >
        <HeroObjects />
      </Stage>
      <Codex />
    </>
  );
}
