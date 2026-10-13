"use client";

import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { smooth } from "@/lib/beats";
import { latLonToVec3 } from "@/lib/geo";
import { useDeviceStore } from "@/store/useDeviceStore";
import { Callouts } from "./Callouts";
import { chapters, metaBeats, sections } from "./chapters";
import {
  loadEarthTextures,
  makeAtmosphereMaterial,
  makeCloudMaterial,
  makeEarthMaterial,
  makeShadowTexture,
  type EarthTextures,
} from "./EarthMaterials";
import { EdgedModeContext } from "./Instruments";
import { locales, NYC } from "./locales";
import { VERMILION } from "./palette";
import { plateState } from "./plateState";

/**
 * The Meta hero: the Earth itself, turning. Photoreal planet textures,
 * drifting clouds, a fresnel atmosphere and a contact shadow, drawn raw
 * (the chapter is never engraved). In the plate each beat's callout card
 * anchors on the locale it speaks of, with a vermilion marker under it.
 * No brass, no stand, no pins.
 */

const META_PLATE = sections.findIndex(
  (s) => s.kind === "plate" && chapters[s.chapter].instrument === "earth",
);
const META_PALETTE = chapters.find((c) => c.instrument === "earth")!.palette;
const NYC_DIR = new Vector3(...latLonToVec3(NYC.lat, NYC.lon));
/** Per beat: the anchor direction on the Earth, or null for a docked caption. */
const ANCHORS: (Vector3 | null)[] = metaBeats.map((b) => {
  if (b.at === "nyc") return NYC_DIR;
  const l = b.at ? locales.find((x) => x.id === b.at) : undefined;
  return l ? new Vector3(...latLonToVec3(l.lat, l.lon)) : null;
});
/** The axial tilt the Earth leans at in the band; it levels as the plate opens so the turn is about the vertical. */
const TILT = 0.41;
const CLOUD_DRIFT = 0.008;

/** Euler that turns local +y onto the unit direction d (see radialEuler in the old globe). */
function radialEuler(d: Vector3): [number, number, number] {
  return [Math.atan2(d.z, d.y), 0, -Math.asin(d.x)];
}

export function Earth({ mech }: { mech: RefObject<Group | null> }) {
  const { mode } = useContext(EdgedModeContext);
  const g = useMemo(
    () => ({
      earth: new SphereGeometry(1.055, 64, 40),
      clouds: new SphereGeometry(1.07, 48, 30),
      atmo: new SphereGeometry(1.1, 48, 30),
      shadow: new PlaneGeometry(1.8, 1.1),
      dot: new SphereGeometry(0.018, 12, 10),
      halo: new TorusGeometry(0.25, 0.008, 8, 48),
    }),
    [],
  );
  const [tex, setTex] = useState<EarthTextures | null>(null);
  useEffect(() => {
    if (mode !== "solid") return;
    let on = true;
    loadEarthTextures().then(
      (t) => {
        if (on) setTex(t);
      },
      () => {},
    );
    return () => {
      on = false;
    };
  }, [mode]);
  const m = useMemo(() => {
    const earth = tex ? makeEarthMaterial(tex) : null;
    const clouds = tex ? makeCloudMaterial(tex) : null;
    if (earth) earth.opacity = 1;
    if (clouds) clouds.opacity = 0.55;
    const atmo = makeAtmosphereMaterial();
    atmo.uniforms.reveal.value = 1;
    return {
      earth,
      clouds,
      atmo,
      shadow: new MeshBasicMaterial({
        map: makeShadowTexture(),
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
      marker: new MeshStandardMaterial({
        color: VERMILION,
        emissive: VERMILION,
        emissiveIntensity: 1.5,
      }),
    };
  }, [tex]);
  const tilt = useRef<Group>(null);
  const clouds = useRef<Mesh>(null);
  const marker = useRef<Group>(null);
  const halo = useRef<Group>(null);

  useFrame((_, delta) => {
    const active = plateState.instrument === "earth";
    const { beat, t, expand } = plateState;
    if (clouds.current && !useDeviceStore.getState().reducedMotion)
      clouds.current.rotation.y += CLOUD_DRIFT * delta;
    if (tilt.current) tilt.current.rotation.z = TILT * (1 - expand);
    // The marker follows whichever place the beat speaks of.
    const anchor = active ? ANCHORS[beat] : null;
    if (marker.current) {
      marker.current.visible = anchor !== null;
      if (anchor) {
        marker.current.position.copy(anchor).multiplyScalar(1.062);
        const [rx, , rz] = radialEuler(anchor);
        marker.current.rotation.set(rx, 0, rz);
      }
    }
    if (halo.current)
      halo.current.scale.setScalar(0.2 + 0.3 * smooth(0, 0.4, t));
  });

  // Drawn raw: no engraved twin, so the lines root is empty.
  if (mode !== "solid") return <group ref={mech} />;

  return (
    <group position={[0, -0.3, 0]}>
      <mesh geometry={g.atmo} material={m.atmo} renderOrder={3} />
      <mesh
        geometry={g.shadow}
        material={m.shadow}
        position={[0, -1.4, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <group ref={tilt} rotation={[0, 0, TILT]}>
        <group ref={mech}>
          {m.earth ? (
            <mesh geometry={g.earth} material={m.earth} renderOrder={1} />
          ) : null}
          {m.clouds ? (
            <mesh
              ref={clouds}
              geometry={g.clouds}
              material={m.clouds}
              renderOrder={2}
            />
          ) : null}
          <group ref={marker} visible={false}>
            <mesh geometry={g.dot} material={m.marker} />
            <group ref={halo}>
              <mesh
                geometry={g.halo}
                material={m.marker}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
          </group>
          <Callouts
            beats={metaBeats}
            anchors={ANCHORS}
            sectionIndex={META_PLATE}
            palette={META_PALETTE}
          />
        </group>
      </group>
    </group>
  );
}
