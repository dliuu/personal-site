"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useInvalidateOnScroll } from "@/hooks/useInvalidateOnScroll";
import { buildCurves, sampleAt } from "@/lib/cameraPath";
import { progressToSection } from "@/lib/progress";
import { introBlend, parallaxOffset, shouldInvalidate } from "@/lib/roomMotion";
import { useLabStore } from "@/store/useLabStore";
import {
  INTRO_DURATION,
  INTRO_START,
  PARALLAX_AMOUNT,
  keyframes,
} from "./sections";
import { useRoomStore } from "./useRoomStore";

const PARALLAX_EPS = 0.0005;

export function CameraRig() {
  const curves = useMemo(() => buildCurves(keyframes), []);
  const { step } = useScrollProgress();
  const invalidate = useThree((s) => s.invalidate);
  useInvalidateOnScroll();

  const pathPos = useRef(new Vector3());
  const target = useRef(new Vector3());
  const introFrom = useRef(new Vector3(...INTRO_START));
  const pointer = useRef({ x: 0, y: 0 });
  const parallax = useRef(new Vector3());
  const parallaxGoal = useRef(new Vector3());
  const introElapsed = useRef(0);

  // Pointer parallax: track normalised pointer on the window; ignore while a panel is open.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (useRoomStore.getState().openProject) return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
      invalidate();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [invalidate]);

  useEffect(() => () => useLabStore.getState().setActiveSection(0), []);

  useEffect(
    () =>
      useRoomStore.subscribe((state, prev) => {
        if (state.openProject !== prev.openProject) invalidate();
      }),
    [invalidate],
  );

  useFrame(({ camera }, delta) => {
    const { reducedMotion } = useLabStore.getState();
    const room = useRoomStore.getState();

    // 1. Scroll progress → path sample
    const s = step();
    sampleAt(curves, s.smoothed, pathPos.current, target.current);

    // 2. Intro pull-in (skipped under reduced motion, or if already scrolled on load)
    let introDone = room.introDone;
    if (!introDone) {
      if (reducedMotion || (introElapsed.current === 0 && s.raw > 0.02)) {
        introDone = true;
      } else {
        introElapsed.current += Math.min(delta, 1 / 30);
        const { t, done } = introBlend(introElapsed.current, INTRO_DURATION);
        pathPos.current.lerpVectors(introFrom.current, pathPos.current, t);
        introDone = done;
      }
      if (introDone) {
        room.setIntroDone(true);
        room.setLampOn(true);
      }
    }

    // 3. Parallax (lerped toward the pointer goal; frozen while a panel is open)
    const [px, py, pz] = parallaxOffset(
      pointer.current,
      PARALLAX_AMOUNT,
      reducedMotion,
    );
    if (!room.openProject) parallaxGoal.current.set(px, py, pz);
    parallax.current.lerp(parallaxGoal.current, 0.1);
    const parallaxSettled =
      parallax.current.distanceTo(parallaxGoal.current) < PARALLAX_EPS;
    if (parallaxSettled) parallax.current.copy(parallaxGoal.current);

    // 4. Apply
    camera.position.copy(pathPos.current).add(parallax.current);
    camera.lookAt(target.current);

    // 5. Active section
    const section = progressToSection(s.smoothed, keyframes.length);
    const lab = useLabStore.getState();
    if (lab.activeSection !== section) lab.setActiveSection(section);

    // 6. Demand loop
    if (
      shouldInvalidate({
        converged: s.converged,
        introDone,
        parallaxSettled,
        panelOpen: Boolean(room.openProject),
      })
    ) {
      invalidate();
    }
  });

  return null;
}
