"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  SphereGeometry,
} from "three";
import { keyPress, phonePulse, twinkle } from "@/lib/ambient";
import { lerp } from "@/lib/progress";
import { frameLerp } from "@/lib/drawIn";
import { useLabStore } from "@/store/useLabStore";
import { Cat } from "./Cat";
import { useThing } from "./RoomSet";
import { rng } from "@/lib/roomTextures";
import { city, sprite } from "./roomTextures";
import { useRoomStore } from "./useRoomStore";

const SLATS = 26;
const BULBS = 24;
const KEYS = 60;
const DUST = 240;
const STEAM = 6;

const paneShader = {
  vertex: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragment: /* glsl */ `
    uniform sampler2D city;
    uniform float time;
    uniform float bright;
    uniform float rain;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      float col = floor(uv.x * 60.0);
      float speed = 0.15 + 0.25 * hash(vec2(col, 1.0));
      float y = fract(uv.y * 3.0 + time * speed + hash(vec2(col, 2.0)));
      float streak = smoothstep(0.0, 0.08, y) * smoothstep(0.35, 0.08, y) * step(0.55, hash(vec2(col, 3.0)));
      float drop = pow(1.0 - fract(uv.y * 8.0 - time * (0.4 + 0.3 * hash(vec2(col, 4.0)))), 12.0) * step(0.85, hash(vec2(col, 5.0)));
      vec2 off = vec2(0.0, streak * 0.02 + drop * 0.03) * rain;
      vec3 c = texture2D(city, uv + off).rgb * bright;
      c += vec3(0.25, 0.3, 0.4) * (streak * 0.35 + drop * 0.6) * rain;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
};

/**
 * Everything in the room that moves on its own: blinds and the rain on the
 * glass, string lights, dust in the lamp cone, steam off the mug, keys that
 * press as he types, the phone, the record, the fan, the cat.
 */
export function RoomLife({
  stage,
  typing,
  lampLevel,
}: {
  stage: number;
  /** Ref: 1 while he is typing at rest. */
  typing: { current: number };
  /** Ref: 0..1 how lit the lamp is (drives dust and the fan). */
  lampLevel: { current: number };
}) {
  const tier = useLabStore((s) => s.tier);
  const high = tier === "high";
  const dummy = useMemo(() => new Object3D(), []);
  const tmpColor = useMemo(() => new Color(), []);

  // Blinds + pane
  const slats = useRef<InstancedMesh>(null);
  const cityTex = useMemo(() => (stage >= 1 ? city() : null), [stage]);
  const pane = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          city: { value: null },
          time: { value: 0 },
          bright: { value: 1 },
          rain: { value: high ? 1 : 0.4 },
        },
        vertexShader: paneShader.vertex,
        fragmentShader: paneShader.fragment,
      }),
    [high],
  );
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- r3f pattern: hand the memoized material its texture once it exists
    pane.uniforms.city.value = cityTex;
  }, [pane, cityTex]);
  const blindsCur = useRef(1);
  const slatGeom = useMemo(() => new BoxGeometry(0.86, 0.012, 0.05), []);
  const slatMat = useMemo(
    () => new MeshStandardMaterial({ color: "#d9d2c5", roughness: 0.6 }),
    [],
  );

  // String lights
  const bulbs = useRef<InstancedMesh>(null);
  const bulbGeom = useMemo(() => new SphereGeometry(0.02, 8, 6), []);
  const bulbMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color("#ffd08a").multiplyScalar(2.4),
        toneMapped: false,
      }),
    [],
  );
  const bulbPositions = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < BULBS; i++) {
      const u = i / (BULBS - 1);
      // A drooping run along the back wall above the desk, then down the
      // window's left frame.
      if (u < 0.6) {
        const v = u / 0.6;
        pts.push([
          -0.75 + v * 1.85,
          2.02 - 0.09 * Math.sin(v * Math.PI),
          -1.13,
        ]);
      } else {
        const v = (u - 0.6) / 0.4;
        pts.push([
          1.12 + 0.02 * Math.sin(v * Math.PI * 2),
          2.02 - v * 0.9,
          -1.13,
        ]);
      }
    }
    return pts;
  }, []);

  // Dust and steam
  const dust = useRef<Points>(null);
  const dustGeom = useMemo(() => {
    const g = new BufferGeometry();
    const n = high ? DUST : DUST / 2;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const r = rng(11);
    for (let i = 0; i < n; i++) {
      seed[i] = r();
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
    }
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("seed", new Float32BufferAttribute(seed, 1));
    return g;
  }, [high]);
  const dustMat = useMemo(
    () =>
      new PointsMaterial({
        size: 0.012,
        map: sprite(0.3),
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        color: "#ffc98a",
        opacity: 0.55,
      }),
    [],
  );
  const steamMat = useMemo(
    () =>
      new SpriteMaterial({
        map: sprite(0.5),
        transparent: true,
        depthWrite: false,
        opacity: 0.18,
        color: "#d8d2c8",
      }),
    [],
  );
  const steam = useRef<(Sprite | null)[]>([]);
  const steamSeeds = useMemo(() => {
    const r = rng(12);
    return Array.from({ length: STEAM }, () => r());
  }, []);

  // Keys, phone, record, fan, lamp cone
  const keys = useRef<InstancedMesh>(null);
  const keyGeom = useMemo(() => new BoxGeometry(0.024, 0.008, 0.024), []);
  const keyMat = useMemo(
    () => new MeshStandardMaterial({ color: "#2a2d36", roughness: 0.7 }),
    [],
  );
  const phoneScreen = useRef<Mesh>(null);
  const phoneLight = useRef<PointLight>(null);
  const phoneMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#050608",
        emissive: "#bcd4ff",
        emissiveIntensity: 0,
      }),
    [],
  );
  const platter = useRef<Mesh>(null);
  const fan = useRef<Group>(null);
  const cone = useRef<Mesh>(null);
  const coneMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#ffb36b",
        transparent: true,
        opacity: 0.06,
        blending: AdditiveBlending,
        depthWrite: false,
        side: 2,
      }),
    [],
  );
  const g = useMemo(
    () => ({
      pane: new PlaneGeometry(0.9, 1.1),
      cord: new CylinderGeometry(0.004, 0.004, 0.7, 6),
      knob: new SphereGeometry(0.012, 8, 6),
      phone: new BoxGeometry(0.07, 0.008, 0.14),
      phoneScreen: new PlaneGeometry(0.062, 0.13),
      platter: new CylinderGeometry(0.13, 0.13, 0.008, 40),
      label: new CylinderGeometry(0.045, 0.045, 0.01, 24),
      arm: new CylinderGeometry(0.006, 0.006, 0.2, 6),
      hub: new CylinderGeometry(0.05, 0.05, 0.04, 16),
      blade: new BoxGeometry(0.5, 0.01, 0.1),
      cone: new CylinderGeometry(0.04, 0.55, 0.62, 24, 1, true),
    }),
    [],
  );
  const m = useMemo(
    () => ({
      dark: new MeshStandardMaterial({
        color: "#1e2027",
        roughness: 0.5,
        metalness: 0.2,
      }),
      black: new MeshStandardMaterial({
        color: "#0c0d10",
        roughness: 0.35,
        metalness: 0.3,
      }),
      label: new MeshStandardMaterial({ color: "#b8432e", roughness: 0.8 }),
      brass: new MeshStandardMaterial({
        color: "#b08d4f",
        roughness: 0.3,
        metalness: 0.9,
      }),
      blade: new MeshStandardMaterial({ color: "#3a2f28", roughness: 0.8 }),
    }),
    [],
  );

  const toggleBlinds = useRoomStore((s) => s.toggleBlinds);
  const toggleSound = useRoomStore((s) => s.toggleSound);
  const puff = useRoomStore((s) => s.puff);
  const blindsThing = useThing(
    "the blinds",
    "click to open or close",
    toggleBlinds,
  );
  const recordThing = useThing(
    "the record player",
    "click for sound",
    toggleSound,
  );
  const phoneThing = useThing("the phone", "face up, mostly quiet");
  const mugThing = useThing("the mug", "click for steam", puff);

  /* eslint-disable react-hooks/immutability -- r3f pattern: drive instances, materials and refs in useFrame */
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const { reducedMotion } = useLabStore.getState();
    const room = useRoomStore.getState();
    const k = frameLerp(0.06, delta);

    // Blinds and the glass.
    blindsCur.current = lerp(blindsCur.current, room.blindsOpen ? 1 : 0, k);
    const open = blindsCur.current;
    if (slats.current) {
      for (let i = 0; i < SLATS; i++) {
        dummy.position.set(0, 0.52 - i * 0.042, 0);
        dummy.rotation.set((1 - open) * 1.35, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        slats.current.setMatrixAt(i, dummy.matrix);
      }
      slats.current.instanceMatrix.needsUpdate = true;
    }
    pane.uniforms.time.value = reducedMotion ? 0 : t;
    pane.uniforms.bright.value = 0.7 + 0.5 * open;

    // String lights: laid out each frame (24 is nothing), twinkling by
    // instance colour.
    if (bulbs.current) {
      for (let i = 0; i < BULBS; i++) {
        dummy.position.set(...bulbPositions[i]);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        bulbs.current.setMatrixAt(i, dummy.matrix);
        const v = reducedMotion ? 1 : twinkle(t, i * 1.37);
        bulbs.current.setColorAt(i, tmpColor.setScalar(v));
      }
      bulbs.current.instanceMatrix.needsUpdate = true;
      if (bulbs.current.instanceColor)
        bulbs.current.instanceColor.needsUpdate = true;
    }

    // Dust drifts down through the lamp cone; hidden when the lamp is off.
    const lit = lampLevel.current;
    if (dust.current) {
      dust.current.visible = lit > 0.05 && !reducedMotion;
      const pos = dustGeom.getAttribute("position") as Float32BufferAttribute;
      const seed = dustGeom.getAttribute("seed") as Float32BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const s = seed.getX(i);
        const life = (t * (0.04 + 0.04 * s) + s * 7) % 1;
        const r = 0.05 + 0.42 * life;
        const a = s * 6.283 + t * 0.15;
        pos.setXYZ(
          i,
          -0.5 + Math.cos(a) * r * 0.9,
          1.22 - life * 0.48,
          -0.35 + Math.sin(a) * r * 0.9,
        );
      }
      pos.needsUpdate = true;
      dustMat.opacity = 0.55 * lit;
    }
    if (cone.current) coneMat.opacity = 0.06 * lit;

    // Steam off the mug.
    const puffAge = t - room.steamPuff;
    const puffing = puffAge < 1.5 ? 1 - puffAge / 1.5 : 0;
    steam.current.forEach((sp, i) => {
      if (!sp) return;
      const s = steamSeeds[i];
      const life = reducedMotion ? 0.4 : (t * 0.35 + s) % 1;
      sp.position.set(
        0.55 + Math.sin(t * 1.3 + s * 9) * 0.02 * life,
        0.86 + life * (0.16 + 0.12 * puffing),
        -0.32,
      );
      sp.scale.setScalar(0.05 + life * 0.08);
      sp.material.opacity = (0.18 + 0.25 * puffing) * Math.sin(life * Math.PI);
    });

    // Keys press while he types.
    if (keys.current) {
      const typingNow = typing.current > 0.5 && !reducedMotion;
      for (let i = 0; i < KEYS; i++) {
        const col = i % 15;
        const row = Math.floor(i / 15);
        dummy.position.set(
          -0.19 + col * 0.027,
          0.772 - 0.003 * keyPress(t, i, typingNow),
          -0.19 + row * 0.028,
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        keys.current.setMatrixAt(i, dummy.matrix);
      }
      keys.current.instanceMatrix.needsUpdate = true;
    }

    // The phone lights now and then; the record turns with sound; the fan
    // with the lamp.
    const pulse = reducedMotion ? 0 : phonePulse(t, 2);
    phoneMat.emissiveIntensity = 1.4 * pulse;
    if (phoneLight.current) phoneLight.current.intensity = 0.6 * pulse;
    if (platter.current && room.soundOn && !reducedMotion)
      platter.current.rotation.y += delta * 3.49;
    if (fan.current && !reducedMotion)
      fan.current.rotation.y += delta * 0.8 * lit;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group>
      {/* Window glass and blinds */}
      <group position={[1.65, 1.75, -1.19]}>
        {stage >= 1 ? (
          <mesh geometry={g.pane} material={pane} position={[0, 0, -0.005]} />
        ) : null}
        <group position={[0, 0.02, 0.06]} {...blindsThing}>
          <instancedMesh
            ref={slats}
            args={[slatGeom, slatMat, SLATS]}
            castShadow
            frustumCulled={false}
          />
          <mesh
            geometry={g.cord}
            material={m.dark}
            position={[0.4, 0.1, 0.03]}
          />
          <mesh
            geometry={g.knob}
            material={m.brass}
            position={[0.4, -0.25, 0.03]}
          />
        </group>
      </group>
      {stage >= 2 ? (
        <instancedMesh
          ref={bulbs}
          args={[bulbGeom, bulbMat, BULBS]}
          frustumCulled={false}
        />
      ) : null}
      {stage >= 2 ? (
        <>
          <points
            ref={dust}
            geometry={dustGeom}
            material={dustMat}
            frustumCulled={false}
          />
          {Array.from({ length: STEAM }, (_, i) => (
            <sprite
              key={i}
              ref={(el) => {
                steam.current[i] = el;
              }}
              material={steamMat.clone()}
            />
          ))}
          <mesh
            ref={cone}
            geometry={g.cone}
            material={coneMat}
            position={[-0.5, 0.95, -0.33]}
            rotation={[0.08, 0, 0.1]}
          />
          <Cat position={[0.55, 0, 0.95]} />
        </>
      ) : null}
      {stage >= 1 ? (
        <>
          <instancedMesh
            ref={keys}
            args={[keyGeom, keyMat, KEYS]}
            castShadow
            frustumCulled={false}
          />
          <group
            position={[-0.38, 0.759, -0.1]}
            rotation={[0, 0.25, 0]}
            {...phoneThing}
          >
            <mesh geometry={g.phone} material={m.black} />
            <mesh
              ref={phoneScreen}
              geometry={g.phoneScreen}
              material={phoneMat}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.0045, 0]}
            />
            <pointLight
              ref={phoneLight}
              color="#bcd4ff"
              intensity={0}
              distance={0.6}
              decay={2}
              position={[0, 0.05, 0]}
            />
          </group>
          <group position={[2.25, 1.795, -0.52]} {...recordThing}>
            <mesh ref={platter} geometry={g.platter} material={m.black}>
              <mesh
                geometry={g.label}
                material={m.label}
                position={[0, 0.004, 0]}
              />
            </mesh>
            <mesh
              geometry={g.arm}
              material={m.brass}
              position={[0.12, 0.03, -0.08]}
              rotation={[0, 0, -0.9]}
            />
          </group>
          <mesh
            geometry={g.knob}
            material={m.dark}
            position={[0.55, 0.86, -0.32]}
            scale={2.4}
            visible={false}
            {...mugThing}
          />
        </>
      ) : null}
      {stage >= 2 ? (
        <group ref={fan} position={[0.3, 2.5, -0.2]}>
          <mesh geometry={g.hub} material={m.brass} />
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              geometry={g.blade}
              material={m.blade}
              position={[
                Math.cos((i * Math.PI) / 2) * 0.3,
                -0.01,
                Math.sin((i * Math.PI) / 2) * 0.3,
              ]}
              rotation={[0, (-i * Math.PI) / 2, 0.08]}
            />
          ))}
        </group>
      ) : null}
    </group>
  );
}
