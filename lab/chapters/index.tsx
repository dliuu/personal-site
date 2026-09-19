"use client";

import { Stage } from "@/components/Stage";
import { PAPER } from "./palette";
import { Effects } from "./Effects";
import { HeroObjects } from "./HeroObjects";
import { Sections } from "./Sections";

export default function Chapters() {
  return (
    <>
      <Stage frameloop="always" background={PAPER} cameraPosition={[0, 0, 6]}>
        <HeroObjects />
        <Effects />
      </Stage>
      <Sections />
    </>
  );
}
