"use client";

import { useEffect } from "react";
import { Stage } from "@/components/Stage";
import { ScrollTrack } from "@/components/ScrollTrack";
import { PALETTE } from "./palette";
import { INTRO_START, PAGES } from "./sections";
import { CameraRig } from "./CameraRig";
import { Furniture } from "./Furniture";
import { Lights } from "./Lights";
import { Room } from "./Room";
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
        <CameraRig />
      </Stage>
    </>
  );
}
