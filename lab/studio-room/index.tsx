"use client";

import { useEffect } from "react";
import { Stage } from "@/components/Stage";
import { ScrollTrack } from "@/components/ScrollTrack";
import { PALETTE } from "./palette";
import { INTRO_START, PAGES } from "./sections";
import { Room } from "./Room";
import { Furniture } from "./Furniture";
import { Lights } from "./Lights";
import { ProjectObjects } from "./ProjectObject";
import { CameraRig } from "./CameraRig";
import { Overlays } from "./Overlays";
import { useRoomStore } from "./useRoomStore";

export default function StudioRoom() {
  const reset = useRoomStore((s) => s.reset);
  useEffect(() => () => reset(), [reset]);

  return (
    <>
      <ScrollTrack pages={PAGES} />
      <Stage
        shadows
        frameloop="demand"
        background={PALETTE.wall}
        fog={{ color: PALETTE.wall, near: 7, far: 18 }}
        cameraPosition={INTRO_START}
      >
        <Lights />
        <Room />
        <Furniture />
        <ProjectObjects />
        <CameraRig />
      </Stage>
      <Overlays />
    </>
  );
}
