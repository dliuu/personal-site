"use client";

import {
  lazy,
  Suspense,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
  type RefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { frameLerp } from "@/lib/drawIn";
import { fanPose } from "@/lib/folio";
import { lerp } from "@/lib/progress";
import { useDeviceStore } from "@/store/useDeviceStore";
import { Callouts } from "./Callouts";
import { chapters } from "./chapters";
import { projects, type Project } from "./content";
import { Edged } from "./Instruments";
import { GOLD } from "./palette";
import { plateState } from "./plateState";

/**
 * MOCK of the projects hero, the folio: a stack of engraved plates, one per
 * project, fanned in the band. Opening a project (a click in the codex, not
 * a scroll) shrinks the stack away and grows that project's scene in its
 * place; the wheel then reads the scene's beats. The scenes here are
 * placeholders, one shape per project kind, until each project gets its own.
 */

/** A project's own scene, loaded the first time it opens; the rest use the placeholder. */
const SCENES: Record<
  NonNullable<Project["scene"]>,
  LazyExoticComponent<ComponentType<{ project: Project }>>
> = {
  stuga: lazy(() =>
    import("./projects/Stuga").then((m) => ({ default: m.Stuga })),
  ),
  trading: lazy(() =>
    import("./projects/Trading").then((m) => ({ default: m.Trading })),
  ),
};

const FAN = 0.6;
const FAN_LERP = 0.08;
const STILL_TIME = 2;
const FOLIO_PALETTE = chapters.find((c) => c.instrument === "folio")!.palette;

export function Folio({ mech }: { mech: RefObject<Group | null> }) {
  // The project on the plate, a scroll plate's or a clicked one; the scene
  // stays mounted while the plate shrinks back after it leaves.
  const [shown, setShown] = useState<string | null>(null);
  const project = useMemo(
    () => projects.find((p) => p.id === shown) ?? null,
    [shown],
  );
  const g = useMemo(() => ({ plate: new BoxGeometry(1.1, 0.02, 1.5) }), []);
  const stack = useRef<Group>(null);
  const scene = useRef<Group>(null);
  const plates = useRef<(Group | null)[]>(projects.map(() => null));
  const fan = useRef(FAN);

  useFrame(({ clock }, delta) => {
    const { reducedMotion } = useDeviceStore.getState();
    const time = reducedMotion ? STILL_TIME : clock.elapsedTime;
    const expand = plateState.instrument === "folio" ? plateState.expand : 0;
    const k = reducedMotion ? 1 : frameLerp(FAN_LERP, delta);
    fan.current = lerp(fan.current, FAN + 0.08 * Math.sin(time * 0.4), k);
    if (stack.current) {
      const s = Math.max(1e-4, 1 - expand);
      stack.current.scale.setScalar(s);
      stack.current.visible = s > 0.001;
    }
    plates.current.forEach((p, i) => {
      if (!p) return;
      const pose = fanPose(i, projects.length, fan.current);
      p.position.set(pose.x, pose.y, 0);
      p.rotation.set(0, 0, pose.rz);
    });
    if (scene.current) {
      scene.current.scale.setScalar(Math.max(1e-4, expand));
      scene.current.visible = expand > 0.001;
    }
    const on = plateState.project;
    if (on && on !== shown) setShown(on);
    if (!on && shown && expand < 0.01) setShown(null);
  });

  return (
    <group position={[0, -0.3, 0]}>
      <group ref={mech}>
        <group ref={stack} rotation={[0.55, 0, 0]}>
          {projects.map((p, i) => (
            <group
              key={p.id}
              ref={(el) => {
                plates.current[i] = el;
              }}
            >
              <Edged geometry={g.plate} />
            </group>
          ))}
        </group>
        <group ref={scene}>
          {project ? (
            project.scene ? (
              <Suspense fallback={null}>
                {(() => {
                  const Scene = SCENES[project.scene];
                  return <Scene project={project} />;
                })()}
              </Suspense>
            ) : (
              <PlaceholderScene project={project} />
            )
          ) : null}
        </group>
      </group>
    </group>
  );
}

/** A stand-in scene per project kind: an ML system is a mill, a product is a device on a stand. */
function PlaceholderScene({ project }: { project: Project }) {
  const g = useMemo(
    () => ({
      plinth: new BoxGeometry(1.6, 0.12, 1.0),
      wheel: new TorusGeometry(0.42, 0.06, 10, 48),
      axle: new CylinderGeometry(0.03, 0.03, 0.7, 10),
      hopper: new BoxGeometry(0.5, 0.35, 0.4),
      core: new IcosahedronGeometry(0.22, 1),
      screen: new BoxGeometry(1.2, 0.8, 0.05),
      bezel: new BoxGeometry(1.3, 0.9, 0.03),
      stand: new CylinderGeometry(0.05, 0.14, 0.5, 12),
    }),
    [],
  );
  const anchors = useMemo<(Vector3 | null)[]>(
    () =>
      project.kind === "ml"
        ? [
            new Vector3(-0.5, 0.75, 0.2),
            new Vector3(0.45, 0.35, 0.3),
            new Vector3(0, -0.4, 0.5),
          ]
        : [
            new Vector3(0, 0.75, 0.1),
            new Vector3(0.6, 0.2, 0.1),
            new Vector3(0, -0.5, 0.3),
          ],
    [project.kind],
  );
  const wheel = useRef<Group>(null);
  const core = useRef<Group>(null);
  useFrame(({ clock }) => {
    const { reducedMotion } = useDeviceStore.getState();
    const t = reducedMotion ? STILL_TIME : clock.elapsedTime;
    if (wheel.current) wheel.current.rotation.z = -t * 0.6;
    if (core.current) {
      core.current.rotation.y = t * 0.5;
      core.current.rotation.x = t * 0.2;
    }
  });
  return (
    <group>
      <Edged geometry={g.plinth} position={[0, -0.6, 0]} />
      {project.kind === "ml" ? (
        <>
          <Edged geometry={g.hopper} position={[-0.5, 0.5, 0]} color={GOLD} />
          <group ref={wheel} position={[0.45, 0.0, 0]}>
            <Edged geometry={g.wheel} threshold={1} />
            <Edged
              geometry={g.axle}
              rotation={[Math.PI / 2, 0, 0]}
              threshold={25}
            />
          </group>
          <group ref={core} position={[-0.5, 0.0, 0]}>
            <Edged geometry={g.core} color={GOLD} threshold={1} />
          </group>
        </>
      ) : (
        <>
          <Edged geometry={g.stand} position={[0, -0.3, 0]} threshold={25} />
          <Edged geometry={g.bezel} position={[0, 0.2, 0]} />
          <Edged geometry={g.screen} position={[0, 0.2, 0.03]} color={GOLD} />
        </>
      )}
      <Callouts
        beats={project.beats}
        anchors={anchors}
        projectId={project.id}
        palette={FOLIO_PALETTE}
      />
    </group>
  );
}
