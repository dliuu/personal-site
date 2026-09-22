"use client";

import {
  createContext,
  createRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { archVoussoirs } from "@/lib/arch";
import { pinTint, smooth, stagger, tickAlive } from "@/lib/beats";
import { latLonToVec3, rankByLongitude } from "@/lib/geo";
import { lerp } from "@/lib/progress";
import { useLabStore } from "@/store/useLabStore";
import {
  buildCoastGeometry,
  buildLandTexture,
  loadLand,
  type Land,
} from "./geo";
import {
  loadEarthTextures,
  makeAtmosphereMaterial,
  makeCloudMaterial,
  makeEarthMaterial,
  makeShadowTexture,
  type EarthTextures,
} from "./EarthMaterials";
import { locales, NYC } from "./locales";
import { BRASS, BRONZE, GOLD, INK, OCEAN, VERMILION } from "./palette";
import { plateState } from "./plateState";

export type EdgedMode = {
  mode: "solid" | "lines";
  lineMaterial?: LineBasicMaterial;
};
export const EdgedModeContext = createContext<EdgedMode>({ mode: "solid" });

/** Line segments for a torus outline: two circles at r±t in the XY plane (matches TorusGeometry's plane); partial arcs are closed at both ends. */
export function torusOutline(
  r: number,
  t: number,
  arc = Math.PI * 2,
  segments = 96,
): BufferGeometry {
  const pts: number[] = [];
  for (const radius of [r + t, r - t]) {
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * arc;
      const a1 = ((i + 1) / segments) * arc;
      pts.push(
        Math.cos(a0) * radius,
        Math.sin(a0) * radius,
        0,
        Math.cos(a1) * radius,
        Math.sin(a1) * radius,
        0,
      );
    }
  }
  if (arc < Math.PI * 2) {
    for (const a of [0, arc]) {
      pts.push(
        Math.cos(a) * (r - t),
        Math.sin(a) * (r - t),
        0,
        Math.cos(a) * (r + t),
        Math.sin(a) * (r + t),
        0,
      );
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pts, 3));
  return g;
}

export function Edged({
  geometry,
  position,
  rotation,
  threshold = 20,
  edges: edgesOverride,
  meshRef,
  linesOnly = false,
  color,
  material,
  lineMaterial,
}: {
  geometry: BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  threshold?: number;
  edges?: BufferGeometry;
  meshRef?: RefObject<Mesh | null>;
  /** Draw only in lines mode — `geometry` is then unused; pass the line set as `edges`. */
  linesOnly?: boolean;
  /** Solid colour (default bronze). */
  color?: string;
  /** Solid material override, so several parts can share and animate one. */
  material?: MeshStandardMaterial;
  /** Line material override for this part only. */
  lineMaterial?: LineBasicMaterial;
}) {
  const ctx = useContext(EdgedModeContext);
  const edges = useMemo(
    () => edgesOverride ?? new EdgesGeometry(geometry, threshold),
    [edgesOverride, geometry, threshold],
  );
  if (linesOnly && ctx.mode === "solid") return null;
  return (
    <group position={position} rotation={rotation}>
      {ctx.mode === "solid" ? (
        <mesh
          ref={meshRef}
          geometry={geometry}
          name="solid"
          material={material}
        >
          {material ? null : (
            <meshStandardMaterial
              color={color ?? BRONZE}
              roughness={0.6}
              metalness={0.15}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          )}
        </mesh>
      ) : (lineMaterial ?? ctx.lineMaterial) ? (
        <lineSegments
          geometry={edges}
          material={lineMaterial ?? ctx.lineMaterial}
          name="edge"
        />
      ) : (
        <lineSegments geometry={edges} name="edge">
          <lineBasicMaterial color={INK} transparent />
        </lineSegments>
      )}
    </group>
  );
}

const ring = (r: number, t: number) => new TorusGeometry(r, t, 10, 96);
const rod = (l: number, r: number) => new CylinderGeometry(r, r, l, 12);
const TICKS_24 = Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2);
const QUADRANT_TICKS = Array.from(
  { length: 10 },
  (_, i) => (i / 9) * (Math.PI / 2),
);

export function Armillary({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(() => {
    const tick = new BoxGeometry(0.04, 0.12, 0.04);
    return {
      outer: ring(1.5, 0.05),
      mid: ring(1.2, 0.045),
      inner: ring(0.9, 0.04),
      axis: rod(3.6, 0.03),
      globe: new SphereGeometry(0.22, 16, 12),
      tick,
      tickEdges: new EdgesGeometry(tick),
      outerLine: torusOutline(1.5, 0.05),
      midLine: torusOutline(1.2, 0.045),
      innerLine: torusOutline(0.9, 0.04),
    };
  }, []);
  return (
    <group>
      <group ref={mech}>
        <Edged
          geometry={g.outer}
          edges={g.outerLine}
          rotation={[Math.PI / 2, 0, 0]}
        />
        {TICKS_24.map((a) => (
          <Edged
            key={a}
            geometry={g.tick}
            edges={g.tickEdges}
            position={[Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5]}
            rotation={[0, -a, 0]}
          />
        ))}
      </group>
      <Edged
        geometry={g.mid}
        edges={g.midLine}
        rotation={[Math.PI / 2, 0.5, 0.4]}
      />
      <Edged geometry={g.inner} edges={g.innerLine} rotation={[0.3, 0, 1.0]} />
      <Edged geometry={g.axis} rotation={[0, 0, 0.42]} />
      <Edged geometry={g.globe} />
    </group>
  );
}

export function Balance({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(
    () => ({
      base: new CylinderGeometry(0.7, 0.8, 0.12, 48),
      pillar: rod(2.4, 0.05),
      finial: new SphereGeometry(0.09, 12, 10),
      beam: new BoxGeometry(2.6, 0.06, 0.08),
      chain: rod(0.7, 0.012),
      pan: new CylinderGeometry(0.42, 0.38, 0.05, 40),
    }),
    [],
  );
  return (
    <group position={[0, -1.2, 0]}>
      <Edged geometry={g.base} />
      <Edged geometry={g.pillar} position={[0, 1.26, 0]} />
      <Edged geometry={g.finial} position={[0, 2.55, 0]} />
      <group ref={mech} position={[0, 2.46, 0]}>
        <Edged geometry={g.beam} />
        {[-1.2, 1.2].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <Edged geometry={g.chain} position={[0, -0.35, 0]} />
            <Edged geometry={g.pan} position={[0, -0.72, 0]} />
          </group>
        ))}
      </group>
    </group>
  );
}

const PIN_DIRS = locales.map((l) => new Vector3(...latLonToVec3(l.lat, l.lon)));
/** Beat-0 drop order: rank by longitude, so the rollout sweeps west → east. */
const PIN_ORDER = rankByLongitude(locales);
/** Radius the pins sit at once seated: base near the surface, tip outward. */
const PIN_R = 1.18;
const NYC_DIR = new Vector3(...latLonToVec3(NYC.lat, NYC.lon));
/** Graticule latitudes: the equator and two parallels either side. */
const GRATICULE_LATS = [
  -Math.PI / 3,
  -Math.PI / 6,
  0,
  Math.PI / 6,
  Math.PI / 3,
];
const GRATICULE_R = 1.052;
const COAST_R = 1.056;
const MERIDIAN_COUNT = 6;
const GAUGE_R = 1.16;
const SATELLITES = [
  { r: 1.6, tilt: 0.5 },
  { r: 1.75, tilt: -0.4 },
  { r: 1.9, tilt: 0.9 },
];

/** A solid material with the Edged defaults, for parts that share and animate one. */
function partMaterial(color: string): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.15,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}
/**
 * Euler that turns local +y onto the unit direction d: three composes an XYZ
 * Euler as Rx*Ry*Rz, so with ry = 0 local +y lands on
 * (-sin rz, cos rx * cos rz, sin rx * cos rz); solving for d gives
 * rz = -asin(x) and rx = atan2(z, y).
 */
function radialEuler(d: Vector3): [number, number, number] {
  return [Math.atan2(d.z, d.y), 0, -Math.asin(d.x)];
}

export function Globe({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(() => {
    const tick = new BoxGeometry(0.02, 0.1, 0.02);
    return {
      sphere: new SphereGeometry(1.05, 32, 20),
      sphereLine: torusOutline(1.05, 0),
      equator: ring(1.06, 0.015),
      equatorLine: torusOutline(1.06, 0.015),
      meridian: ring(1.18, 0.035),
      meridianLine: torusOutline(1.18, 0.035),
      pin: new ConeGeometry(0.02, 0.16, 8),
      nyc: new ConeGeometry(0.035, 0.26, 10),
      stand: rod(0.9, 0.04),
      base: new CylinderGeometry(0.5, 0.6, 0.1, 40),
      tick,
      tickEdges: new EdgesGeometry(tick),
      latLines: GRATICULE_LATS.map((lat) =>
        torusOutline(GRATICULE_R * Math.cos(lat), 0),
      ),
      meridianLines: torusOutline(GRATICULE_R, 0),
      gauge: ring(GAUGE_R, 0.012),
      gaugeLine: torusOutline(GAUGE_R, 0.012),
      halo: ring(0.25, 0.008),
      satRings: SATELLITES.map((s) => ring(s.r, 0.008)),
      satRingLines: SATELLITES.map((s) => torusOutline(s.r, 0.008)),
      satBody: new SphereGeometry(0.06, 12, 10),
      earth: new SphereGeometry(1.055, 64, 40),
      clouds: new SphereGeometry(1.07, 48, 30),
      atmo: new SphereGeometry(1.1, 48, 30),
      shadow: new PlaneGeometry(1.8, 1.1),
    };
  }, []);
  const pinEdges = useMemo(() => new EdgesGeometry(g.pin, 20), [g.pin]);
  const nycEdges = useMemo(() => new EdgesGeometry(g.nyc, 20), [g.nyc]);
  const mats = useMemo(
    () => ({
      brass: partMaterial(BRASS),
      gold: partMaterial(GOLD),
      pin: partMaterial(VERMILION),
      nyc: partMaterial(VERMILION),
      halo: partMaterial(VERMILION),
      tickLive: partMaterial(VERMILION),
      tickDoomed: partMaterial(BRONZE),
    }),
    [],
  );
  const coastMat = useMemo(
    () => new LineBasicMaterial({ color: INK, transparent: true, opacity: 0 }),
    [],
  );
  const bronze = useMemo(() => new Color(BRONZE), []);
  const vermilion = useMemo(() => new Color(VERMILION), []);
  const pinRefs = useMemo(() => PIN_DIRS.map(() => createRef<Group>()), []);
  const tickRefs = useMemo(() => TICKS_24.map(() => createRef<Group>()), []);
  const satRefs = useMemo(() => SATELLITES.map(() => createRef<Group>()), []);
  const nycGroup = useRef<Group>(null);
  const haloRef = useRef<Group>(null);
  const gaugeRef = useRef<Group>(null);
  const tiltRef = useRef<Group>(null);
  const cloudsRef = useRef<Mesh>(null);
  const { mode } = useContext(EdgedModeContext);

  // Geography: the baked Natural Earth land becomes a land/ocean texture on
  // the solid sphere and coastline segments in the lines layer.
  const [land, setLand] = useState<Land | null>(null);
  useEffect(() => {
    let on = true;
    loadLand().then(
      (l) => {
        if (on) setLand(l);
      },
      () => {},
    );
    return () => {
      on = false;
    };
  }, []);
  const landTex = useMemo(
    () => (land && mode === "solid" ? buildLandTexture(land) : null),
    [land, mode],
  );
  const coast = useMemo(
    () => (land && mode === "lines" ? buildCoastGeometry(land, COAST_R) : null),
    [land, mode],
  );
  // A fresh sphere material once the land texture exists (once per mount).
  const sphereMat = useMemo(() => {
    const m = partMaterial(landTex ? "#ffffff" : OCEAN);
    m.map = landTex;
    return m;
  }, [landTex]);

  // The real Earth: a second sphere that fades in over the hatched one as the
  // engraving dissolves, so the chapter band never changes.
  const [earth, setEarth] = useState<EarthTextures | null>(null);
  useEffect(() => {
    if (mode !== "solid") return;
    let on = true;
    loadEarthTextures().then(
      (t) => {
        if (on) setEarth(t);
      },
      () => {},
    );
    return () => {
      on = false;
    };
  }, [mode]);
  const earthMat = useMemo(
    () => (earth ? makeEarthMaterial(earth) : null),
    [earth],
  );
  const cloudMat = useMemo(
    () => (earth ? makeCloudMaterial(earth) : null),
    [earth],
  );
  const atmoMat = useMemo(() => makeAtmosphereMaterial(), []);
  const shadowMat = useMemo(
    () =>
      new MeshBasicMaterial({
        map: makeShadowTexture(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  );

  // Both instruments (solid and lines) run this; every value is a pure
  // function of plateState, so the two stay in lockstep.
  /* eslint-disable react-hooks/immutability -- r3f pattern: mutate memoized materials and ref object3Ds in useFrame */
  useFrame((_, delta) => {
    const active = plateState.instrument === "globe";
    const { beat, t, expand, reveal } = plateState;
    coastMat.opacity = 0.7 * expand * (1 - reveal);

    // Reveal: hatched bronze becomes reflective metal, markers light up, the
    // real Earth, its clouds, atmosphere and shadow fade in. All zero in
    // chapters, so the engraving there is unchanged.
    mats.brass.metalness = reveal;
    mats.brass.roughness = lerp(0.6, 0.28, reveal);
    mats.gold.metalness = reveal;
    mats.gold.roughness = lerp(0.6, 0.25, reveal);
    if (earthMat) earthMat.opacity = reveal;
    if (cloudMat) cloudMat.opacity = 0.55 * reveal;
    if (cloudsRef.current && !useLabStore.getState().reducedMotion)
      cloudsRef.current.rotation.y += 0.008 * delta;
    atmoMat.uniforms.reveal.value = reveal;
    shadowMat.opacity = 0.35 * reveal;

    // Beat 0: the pins fall in west to east, from well above the surface. The
    // drop is faded in by `expand`, so pins stay seated outside the plate and
    // rise as it opens instead of popping to 2.2r.
    const dropping = active && beat === 0;
    for (let i = 0; i < PIN_DIRS.length; i++) {
      const dropR = dropping
        ? lerp(2.2, PIN_R, stagger(t, PIN_ORDER[i], PIN_DIRS.length, 0.6))
        : PIN_R;
      const r = lerp(PIN_R, dropR, expand);
      pinRefs[i].current?.position.copy(PIN_DIRS[i]).multiplyScalar(r);
    }
    const tint = active ? pinTint(beat, t) : 1;
    mats.pin.color.copy(bronze).lerp(vermilion, tint);
    mats.pin.emissive.copy(vermilion).multiplyScalar(tint);
    mats.pin.emissiveIntensity = 2.2 * reveal;

    // Beat 1: the Manhattan pin lifts off the surface and glows, a halo
    // spreads from its base, and the solid instrument publishes its world
    // point for the camera to push in on.
    const close = active && beat === 1;
    const lift = close ? 1.1 + 0.15 * smooth(0, 0.3, t) : 1.1;
    const nyc = nycGroup.current;
    if (nyc) {
      nyc.position.copy(NYC_DIR).multiplyScalar(lift);
      if (mode === "solid") {
        nyc.getWorldPosition(plateState.focus);
        plateState.hasFocus = true;
      }
    }
    const glow = close ? smooth(0, 0.3, t) : 0;
    mats.nyc.emissive.copy(vermilion);
    mats.nyc.emissiveIntensity = 0.6 * glow + reveal * (1.5 + 3 * glow);
    mats.halo.emissive.copy(vermilion);
    mats.halo.emissiveIntensity = 1.5 * reveal;
    if (haloRef.current) {
      haloRef.current.visible = close;
      haloRef.current.scale.setScalar(0.2 + 0.8 * smooth(0.1, 0.8, t));
    }

    // Beat 2: a brass gauge ring rises on the equator and its ticks die from
    // 24 down to the four cardinal survivors, which hold through beat 3.
    if (gaugeRef.current) {
      gaugeRef.current.visible = active && beat >= 2;
      gaugeRef.current.scale.setScalar(
        expand * (beat === 2 ? smooth(0, 0.15, t) : 1),
      );
    }
    tickRefs.forEach((ref, i) => {
      if (!ref.current) return;
      ref.current.visible = active && tickAlive(i, beat, t);
      // Scale with the plate so the gauge shrinks away instead of vanishing.
      ref.current.scale.setScalar(expand);
    });

    // Beat 3: three satellites come up on their brass rings while the globe
    // settles level; the closing expand → 0 restores the tilt.
    const sats = active && beat === 3;
    satRefs.forEach((ref, k) => {
      if (!ref.current) return;
      ref.current.visible = sats;
      ref.current.scale.setScalar(expand * smooth(0, 0.15, t));
      ref.current.rotation.y = t * Math.PI * 2 * (1 + k * 0.3) + k;
    });
    const level = sats ? smooth(0, 0.5, t) : 0;
    if (tiltRef.current)
      tiltRef.current.rotation.z = 0.41 * (1 - expand * level);
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group position={[0, -0.3, 0]}>
      {mode === "solid" ? (
        <>
          <mesh geometry={g.atmo} material={atmoMat} renderOrder={3} />
          <mesh
            geometry={g.shadow}
            material={shadowMat}
            position={[0, -1.72, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        </>
      ) : null}
      <Edged geometry={g.base} position={[0, -1.35, 0]} material={mats.brass} />
      <Edged
        geometry={g.stand}
        position={[0, -0.85, 0]}
        material={mats.brass}
      />
      <Edged
        geometry={g.meridian}
        edges={g.meridianLine}
        material={mats.brass}
      />
      <group ref={tiltRef} rotation={[0, 0, 0.41]}>
        <group ref={mech}>
          <Edged
            geometry={g.sphere}
            edges={g.sphereLine}
            material={sphereMat}
          />
          {earthMat ? (
            <mesh geometry={g.earth} material={earthMat} renderOrder={1} />
          ) : null}
          {cloudMat ? (
            <mesh
              ref={cloudsRef}
              geometry={g.clouds}
              material={cloudMat}
              renderOrder={2}
            />
          ) : null}
          <Edged
            geometry={g.equator}
            edges={g.equatorLine}
            rotation={[Math.PI / 2, 0, 0]}
            material={mats.brass}
          />
          {GRATICULE_LATS.map((lat, i) => (
            <Edged
              key={lat}
              linesOnly
              geometry={g.sphere}
              edges={g.latLines[i]}
              position={[0, GRATICULE_R * Math.sin(lat), 0]}
              rotation={[Math.PI / 2, 0, 0]}
            />
          ))}
          {Array.from({ length: MERIDIAN_COUNT }, (_, k) => (
            <Edged
              key={k}
              linesOnly
              geometry={g.sphere}
              edges={g.meridianLines}
              rotation={[0, (k * Math.PI) / MERIDIAN_COUNT, 0]}
            />
          ))}
          {coast ? (
            <Edged
              linesOnly
              geometry={g.sphere}
              edges={coast}
              lineMaterial={coastMat}
            />
          ) : null}
          {locales.map((l, i) => {
            const d = PIN_DIRS[i];
            return (
              <group
                key={l.id}
                ref={pinRefs[i]}
                position={[d.x * PIN_R, d.y * PIN_R, d.z * PIN_R]}
              >
                <Edged
                  geometry={g.pin}
                  edges={pinEdges}
                  rotation={radialEuler(d)}
                  material={mats.pin}
                />
              </group>
            );
          })}
          <group
            ref={nycGroup}
            position={[NYC_DIR.x * 1.1, NYC_DIR.y * 1.1, NYC_DIR.z * 1.1]}
          >
            <Edged
              geometry={g.nyc}
              edges={nycEdges}
              rotation={radialEuler(NYC_DIR)}
              material={mats.nyc}
            />
          </group>
          <group
            ref={haloRef}
            position={[NYC_DIR.x * 1.062, NYC_DIR.y * 1.062, NYC_DIR.z * 1.062]}
            rotation={radialEuler(NYC_DIR)}
            visible={false}
          >
            <Edged
              geometry={g.halo}
              material={mats.halo}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </group>
          <group ref={gaugeRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
            <Edged
              geometry={g.gauge}
              edges={g.gaugeLine}
              material={mats.brass}
            />
          </group>
          {TICKS_24.map((a, i) => (
            <group
              key={a}
              ref={tickRefs[i]}
              position={[Math.cos(a) * GAUGE_R, 0, Math.sin(a) * GAUGE_R]}
              rotation={[0, -a, 0]}
              visible={false}
            >
              <Edged
                geometry={g.tick}
                edges={g.tickEdges}
                material={i % 6 === 0 ? mats.tickLive : mats.tickDoomed}
              />
            </group>
          ))}
          {SATELLITES.map((s, k) => (
            <group
              key={s.r}
              ref={satRefs[k]}
              rotation={[s.tilt, 0, 0]}
              visible={false}
            >
              <Edged
                geometry={g.satRings[k]}
                edges={g.satRingLines[k]}
                rotation={[Math.PI / 2, 0, 0]}
                material={mats.brass}
              />
              <Edged
                geometry={g.satBody}
                position={[s.r, 0, 0]}
                material={mats.gold}
              />
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

const VOUSSOIRS = archVoussoirs(13, 1.3);
const KEYSTONE = 6;

export function Bridge({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(
    () => ({
      block: new BoxGeometry(0.3, 0.26, 0.5),
      pier: new BoxGeometry(0.34, 2.0, 0.6),
      deck: new BoxGeometry(3.6, 0.08, 0.6),
      post: rod(2.4, 0.03),
      rail: rod(3.8, 0.02),
    }),
    [],
  );
  const blockEdges = useMemo(() => new EdgesGeometry(g.block, 20), [g.block]);
  return (
    <group position={[0, -1.0, 0]}>
      {[-1.55, 1.55].map((x) => (
        <Edged key={x} geometry={g.pier} position={[x, 1.0, 0]} />
      ))}
      {VOUSSOIRS.map((v, i) =>
        i === KEYSTONE ? null : (
          <Edged
            key={i}
            geometry={g.block}
            edges={blockEdges}
            position={v.position}
            rotation={[0, 0, v.rotation]}
          />
        ),
      )}
      <group ref={mech}>
        <Edged
          geometry={g.block}
          edges={blockEdges}
          position={VOUSSOIRS[KEYSTONE].position}
          rotation={[0, 0, VOUSSOIRS[KEYSTONE].rotation]}
        />
      </group>
      <Edged geometry={g.deck} position={[0, 2.04, 0]} />
      {[-1.9, -0.65, 0.65, 1.9].map((x) => (
        <Edged key={x} geometry={g.post} position={[x, 1.2, 0.45]} />
      ))}
      {[0.9, 2.1].map((y) => (
        <Edged
          key={y}
          geometry={g.rail}
          position={[0, y, 0.45]}
          rotation={[0, 0, Math.PI / 2]}
        />
      ))}
    </group>
  );
}

export function Quadrant({ mech }: { mech: RefObject<Group | null> }) {
  const g = useMemo(() => {
    const tick = new BoxGeometry(0.03, 0.14, 0.03);
    return {
      arc: new RingGeometry(1.35, 1.6, 48, 1, 0, Math.PI / 2),
      side: new BoxGeometry(1.6, 0.06, 0.06),
      sight: rod(1.7, 0.035),
      tick,
      tickEdges: new EdgesGeometry(tick),
      bob: new SphereGeometry(0.07, 12, 10),
      thread: rod(1.5, 0.008),
    };
  }, []);
  return (
    <group position={[-0.6, -0.6, 0]}>
      <Edged geometry={g.arc} threshold={1} />
      <Edged geometry={g.side} position={[0.8, 0, 0]} />
      <Edged
        geometry={g.side}
        position={[0, 0.8, 0]}
        rotation={[0, 0, Math.PI / 2]}
      />
      <Edged
        geometry={g.sight}
        position={[0.85, 0.85, 0.08]}
        rotation={[0, 0, Math.PI / 4]}
      />
      {QUADRANT_TICKS.map((a) => (
        <Edged
          key={a}
          geometry={g.tick}
          edges={g.tickEdges}
          position={[Math.cos(a) * 1.47, Math.sin(a) * 1.47, 0.04]}
          rotation={[0, 0, a - Math.PI / 2]}
        />
      ))}
      <group ref={mech}>
        <Edged geometry={g.thread} position={[0, -0.75, 0.1]} />
        <Edged geometry={g.bob} position={[0, -1.5, 0.1]} />
      </group>
    </group>
  );
}
