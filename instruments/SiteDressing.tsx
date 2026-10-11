"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
} from "three";
import { LAYOUT, fencePanels, pilePositions } from "@/lib/site";
import { useDeviceStore } from "@/store/useDeviceStore";
import { Edged } from "./Instruments";
import { SITE, Solid, siteMaterial } from "./siteParts";

/**
 * The site around the towers: dirt plot, access road and laydown yard,
 * hoarding with a gate, the foundation pit and its piles, spoil heaps, the
 * silo on its legs, a mixer truck whose drum turns, an excavator that nods,
 * stacked site offices, a dumpster, toilets, a generator, and the material
 * stacks in the yard.
 */

const L = LAYOUT;
const G = L.groundY;
const STILL_TIME = 3.2;

/** Instances laid out once: fence panels and posts, piles, wheels, stacked beams. */
function placed(
  geometry: BoxGeometry | CylinderGeometry,
  material: ReturnType<typeof siteMaterial>,
  items: {
    x: number;
    y: number;
    z: number;
    ry?: number;
    rx?: number;
    rz?: number;
  }[],
): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, items.length);
  const o = new Object3D();
  items.forEach((it, i) => {
    o.position.set(it.x, it.y, it.z);
    o.rotation.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  });
  mesh.frustumCulled = false;
  return mesh;
}

export function SiteDressing() {
  const g = useMemo(
    () => ({
      ground: new BoxGeometry(L.plotW, 0.04, L.plotD),
      road: new BoxGeometry(0.4, 0.012, 1.0),
      laydown: new BoxGeometry(L.laydown.w, 0.012, L.laydown.d),
      pit: new BoxGeometry(0.78, 0.04, 0.78),
      heap: new ConeGeometry(0.2, 0.16, 12),
      heapSmall: new ConeGeometry(0.13, 0.1, 10),
      container: new BoxGeometry(0.5, 0.18, 0.3),
      toilet: new BoxGeometry(0.08, 0.15, 0.08),
      generator: new BoxGeometry(0.16, 0.1, 0.1),
      dumpster: new BoxGeometry(0.3, 0.12, 0.18),
      siloLeg: new CylinderGeometry(0.012, 0.012, 0.3, 8),
      siloBody: new CylinderGeometry(0.18, 0.18, 0.5, 20),
      siloCone: new ConeGeometry(0.18, 0.16, 20),
      siloTop: new ConeGeometry(0.18, 0.1, 20),
      chassis: new BoxGeometry(0.42, 0.05, 0.16),
      cab: new BoxGeometry(0.12, 0.12, 0.16),
      drum: new CylinderGeometry(0.06, 0.09, 0.26, 16),
      track: new BoxGeometry(0.32, 0.07, 0.08),
      body: new BoxGeometry(0.22, 0.1, 0.2),
      exCab: new BoxGeometry(0.1, 0.1, 0.09),
      boom: new BoxGeometry(0.32, 0.05, 0.05),
      stick: new BoxGeometry(0.24, 0.04, 0.04),
      bucket: new BoxGeometry(0.07, 0.07, 0.1),
      pallet: new BoxGeometry(0.12, 0.1, 0.12),
      pipe: new CylinderGeometry(0.02, 0.02, 0.36, 10),
    }),
    [],
  );
  const m = useMemo(
    () => ({
      hoarding: siteMaterial(SITE.hoarding),
      post: siteMaterial(SITE.steel),
      pile: siteMaterial(SITE.concrete),
      wheel: siteMaterial("#2a2a2a"),
      beam: siteMaterial(SITE.steel, { metalness: 0.4, roughness: 0.5 }),
    }),
    [],
  );
  const statics = useMemo(() => {
    const panels = fencePanels();
    const { h, panel } = L.fence;
    const fence = placed(
      new BoxGeometry(panel - 0.01, h, 0.012),
      m.hoarding,
      panels.map((p) => ({ x: p.x, y: G + h / 2, z: p.z, ry: p.ry })),
    );
    const posts = placed(
      new CylinderGeometry(0.008, 0.008, h + 0.02, 6),
      m.post,
      panels.map((p) => ({
        x: p.x + (p.ry === 0 ? panel / 2 : 0),
        y: G + h / 2,
        z: p.z + (p.ry === 0 ? 0 : panel / 2),
      })),
    );
    const piles = placed(
      new CylinderGeometry(0.018, 0.018, 0.12, 8),
      m.pile,
      pilePositions().map(([x, z]) => ({ x, y: G + 0.02, z })),
    );
    const wheels = placed(
      new CylinderGeometry(0.035, 0.035, 0.03, 12),
      m.wheel,
      [-0.14, 0.02, 0.14].flatMap((x) =>
        [-0.085, 0.085].map((z) => ({
          x,
          y: 0.035,
          z,
          rx: Math.PI / 2,
        })),
      ),
    );
    const ly = L.laydown;
    const beams = placed(
      new BoxGeometry(0.4, 0.03, 0.03),
      m.beam,
      [0, 1, 2, 3, 4].map((i) => ({
        x: ly.x - 0.12,
        y: G + 0.015 + (i < 3 ? 0 : 0.03),
        z: ly.z - 0.15 + (i < 3 ? i * 0.035 : (i - 3) * 0.035 + 0.018),
      })),
    );
    return { fence, posts, piles, wheels, beams };
  }, [m]);

  const drum = useRef<Mesh>(null);
  const arm = useRef<Group>(null);
  const stick = useRef<Group>(null);

  useFrame(({ clock }) => {
    const { reducedMotion } = useDeviceStore.getState();
    const time = reducedMotion ? STILL_TIME : clock.elapsedTime;
    if (drum.current) drum.current.rotation.y = time * 1.2;
    if (arm.current) arm.current.rotation.z = 0.5 + 0.08 * Math.sin(time * 0.7);
    if (stick.current)
      stick.current.rotation.z = -1.3 + 0.12 * Math.sin(time * 0.7 + 1);
  });

  const ex = L.excavator;
  const ly = L.laydown;
  return (
    <group>
      {/* The ground: dirt, with the access road and the gravel yard. */}
      <Edged
        geometry={g.ground}
        position={[0, G - 0.02, 0]}
        color={SITE.dirt}
      />
      <Edged
        geometry={g.road}
        position={[0.8, G + 0.004, L.plotD / 2 - 0.5]}
        color={SITE.gravel}
      />
      <Edged
        geometry={g.laydown}
        position={[ly.x, G + 0.004, ly.z]}
        color={SITE.gravel}
      />
      {/* The foundation pit under the capped tower, and its piles. */}
      <Edged
        geometry={g.pit}
        position={[-0.4, G - 0.025, -0.35]}
        color="#6e5639"
      />
      <Solid>
        <primitive object={statics.piles} />
      </Solid>
      <Edged
        geometry={g.heap}
        position={[-1.35, G + 0.08, 0.85]}
        color="#75603f"
        threshold={25}
      />
      <Edged
        geometry={g.heapSmall}
        position={[0.0, G + 0.05, -0.85]}
        color="#75603f"
        threshold={25}
      />

      {/* Hoarding around the plot. */}
      <Solid>
        <primitive object={statics.fence} />
        <primitive object={statics.posts} />
      </Solid>

      {/* Site offices: two containers, one set back on top. */}
      <Edged
        geometry={g.container}
        position={[L.office.x, G + 0.09, L.office.z]}
        color={SITE.white}
      />
      <Edged
        geometry={g.container}
        position={[L.office.x - 0.04, G + 0.27, L.office.z + 0.02]}
        color={SITE.white}
      />
      <Edged
        geometry={g.generator}
        position={[L.office.x - 0.38, G + 0.05, L.office.z]}
        color={SITE.machine}
      />
      {[1.3, 1.42].map((x) => (
        <Edged
          key={x}
          geometry={g.toilet}
          position={[x, G + 0.075, 0.85]}
          color={SITE.blue}
        />
      ))}
      <Edged
        geometry={g.dumpster}
        position={[0.3, G + 0.06, 0.88]}
        color={SITE.green}
      />

      {/* The silo on its legs: the ledger. */}
      <group position={[L.silo.x, G, L.silo.z]}>
        {[-0.12, 0.12].flatMap((x) =>
          [-0.12, 0.12].map((z) => (
            <Edged
              key={`${x}${z}`}
              geometry={g.siloLeg}
              position={[x, 0.15, z]}
              color={SITE.steel}
            />
          )),
        )}
        <Edged
          geometry={g.siloCone}
          position={[0, 0.3, 0]}
          rotation={[Math.PI, 0, 0]}
          color={SITE.concrete}
          threshold={25}
        />
        <Edged
          geometry={g.siloBody}
          position={[0, 0.63, 0]}
          color={SITE.concrete}
          threshold={25}
        />
        <Edged
          geometry={g.siloTop}
          position={[0, 0.93, 0]}
          color={SITE.concrete}
          threshold={25}
        />
      </group>

      {/* The mixer truck, drum turning. */}
      <group position={[L.mixer.x, G, L.mixer.z]}>
        <Edged
          geometry={g.chassis}
          position={[0, 0.07, 0]}
          color={SITE.steel}
        />
        <Edged
          geometry={g.cab}
          position={[-0.15, 0.155, 0]}
          color={SITE.white}
        />
        <group position={[0.06, 0.19, 0]} rotation={[0, 0, 0.32]}>
          <Edged
            geometry={g.drum}
            meshRef={drum}
            color={SITE.white}
            threshold={25}
          />
        </group>
        <Solid>
          <primitive object={statics.wheels} />
        </Solid>
      </group>

      {/* The excavator at the pit edge, arm nodding. */}
      <group position={[ex.x, G, ex.z]} rotation={[0, -0.6, 0]}>
        {[-0.08, 0.08].map((z) => (
          <Edged
            key={z}
            geometry={g.track}
            position={[0, 0.035, z]}
            color="#3a3a3a"
          />
        ))}
        <Edged geometry={g.body} position={[0, 0.12, 0]} color={SITE.machine} />
        <Edged
          geometry={g.exCab}
          position={[-0.04, 0.22, 0.05]}
          color={SITE.machine}
        />
        <group ref={arm} position={[0.1, 0.16, -0.03]}>
          <Edged
            geometry={g.boom}
            position={[0.16, 0, 0]}
            color={SITE.machine}
          />
          <group ref={stick} position={[0.32, 0, 0]}>
            <Edged
              geometry={g.stick}
              position={[0.12, 0, 0]}
              color={SITE.machine}
            />
            <Edged
              geometry={g.bucket}
              position={[0.26, -0.02, 0]}
              color={SITE.steel}
            />
          </group>
        </group>
      </group>

      {/* Material stacks in the yard: beams, block pallets, pipes. */}
      <Solid>
        <primitive object={statics.beams} />
      </Solid>
      {[0, 1, 2].map((i) => (
        <Edged
          key={i}
          geometry={g.pallet}
          position={[
            ly.x + 0.1 + (i % 2) * 0.14,
            G + 0.05,
            ly.z + 0.1 - Math.floor(i / 2) * 0.14,
          ]}
          color={SITE.concrete}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <Edged
          key={i}
          geometry={g.pipe}
          position={[
            ly.x + 0.12,
            G + 0.02 + (i === 2 ? 0.035 : 0),
            ly.z - 0.13 + (i < 2 ? (i - 0.5) * 0.042 : 0),
          ]}
          rotation={[0, 0, Math.PI / 2]}
          color={SITE.blue}
          threshold={25}
        />
      ))}
    </group>
  );
}
