"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { Stage } from "@/components/Stage";
import { ScrollTrack } from "@/components/ScrollTrack";
import { Overlay } from "@/components/Overlay";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useInvalidateOnScroll } from "@/hooks/useInvalidateOnScroll";
import { buildCurves, sampleAt, type Keyframe } from "@/lib/cameraPath";
import { progressToSection } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";

const BOX_X = [-4.5, -1.5, 1.5, 4.5];
const COLORS = ["#ffb454", "#7ad0ff", "#b6f07a", "#ff7ab6"];

const keyframes: Keyframe[] = BOX_X.map((x, i) => ({
  position: [x + (i % 2 === 0 ? -1.5 : 1.5), 2.2, 4.5],
  target: [x, 0.5, 0],
}));

function CameraRig() {
  const curves = useMemo(() => buildCurves(keyframes), []);
  const { step } = useScrollProgress();
  const pos = useRef(new Vector3());
  const tgt = useRef(new Vector3());
  useInvalidateOnScroll();
  useEffect(() => () => useLabStore.getState().setActiveSection(0), []);

  useFrame(({ camera, invalidate }) => {
    const s = step();
    sampleAt(curves, s.smoothed, pos.current, tgt.current);
    camera.position.copy(pos.current);
    camera.lookAt(tgt.current);
    const section = progressToSection(s.smoothed, keyframes.length);
    const store = useLabStore.getState();
    if (store.activeSection !== section) store.setActiveSection(section);
    if (!s.converged) invalidate();
  });
  return null;
}

function Boxes() {
  return (
    <>
      {BOX_X.map((x, i) => (
        <mesh key={x} castShadow position={[x, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={COLORS[i]} roughness={0.7} />
        </mesh>
      ))}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#26262c" roughness={1} />
      </mesh>
    </>
  );
}

const NOTES = [
  "Stop 0. The camera starts here and eases forward as you scroll.",
  "Stop 1. Progress is lerped each frame; the overlay switches at the nearest keyframe.",
  "Stop 2. With prefers-reduced-motion, the camera snaps instead of easing.",
  "Stop 3. The canvas runs on demand: no scroll, no frames.",
];

export default function ScrollPath() {
  const activeSection = useLabStore((s) => s.activeSection);
  return (
    <>
      <ScrollTrack pages={keyframes.length} />
      <Stage
        shadows
        frameloop="demand"
        background="#141418"
        cameraPosition={[-6, 2.2, 4.5]}
      >
        <ambientLight intensity={0.35} />
        <directionalLight
          castShadow
          intensity={2.5}
          position={[3, 8, 4]}
          shadow-mapSize={[1024, 1024]}
        />
        <Boxes />
        <CameraRig />
      </Stage>
      {NOTES.map((text, i) => (
        <Overlay
          key={i}
          visible={activeSection === i}
          side={i % 2 === 0 ? "left" : "right"}
        >
          <strong style={{ color: COLORS[i] }}>{i + 1} / 4</strong>
          <p style={{ margin: "8px 0 0", lineHeight: 1.5 }}>{text}</p>
        </Overlay>
      ))}
    </>
  );
}
