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
  MeshPhysicalMaterial,
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
import { useThing } from "./RoomSet";
import { rng } from "@/lib/roomTextures";
import { loadGarden, nature, sprite } from "./roomTextures";
import { useRoomStore } from "./useRoomStore";

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
    uniform float bright;
    uniform vec3 tint;
    uniform float time;
    uniform float rain;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      // Rain on the glass: per-column streaks at their own speeds, with the
      // occasional heavier run that bends the view behind it.
      float col = floor(uv.x * 90.0);
      float speed = 0.12 + 0.3 * hash(vec2(col, 1.0));
      float y = fract(uv.y * 2.5 + time * speed + hash(vec2(col, 2.0)));
      float streak = smoothstep(0.0, 0.06, y) * smoothstep(0.3, 0.06, y) * step(0.5, hash(vec2(col, 3.0)));
      float drop = pow(1.0 - fract(uv.y * 7.0 - time * (0.35 + 0.35 * hash(vec2(col, 4.0)))), 14.0) * step(0.88, hash(vec2(col, 5.0)));
      vec2 off = vec2(0.0, streak * 0.016 + drop * 0.026) * rain;
      vec3 c = texture2D(city, uv + off).rgb * bright * tint;
      c += vec3(0.18, 0.22, 0.3) * (streak * 0.3 + drop * 0.55) * rain;
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
  const natureTex = useMemo(() => (stage >= 1 ? nature() : null), [stage]);
  const pane = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          city: { value: null },
          bright: { value: 1 },
          tint: { value: new Color("#ffffff") },
          time: { value: 0 },
          rain: { value: 1 },
        },
        vertexShader: paneShader.vertex,
        fragmentShader: paneShader.fragment,
        toneMapped: false,
      }),
    [],
  );
  useEffect(() => {
    // The painted garden shows at once; the photographic one replaces it.
    // eslint-disable-next-line react-hooks/immutability -- r3f pattern: hand the memoized material its texture once it exists
    pane.uniforms.city.value = natureTex;
    let on = true;
    loadGarden().then(
      (t) => {
        if (on) pane.uniforms.city.value = t;
      },
      () => {},
    );
    return () => {
      on = false;
    };
  }, [pane, natureTex]);
  const nightTint = useMemo(() => new Color("#3d5170"), []);
  const duskTint = useMemo(() => new Color("#ffa478"), []);
  const glassMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#ffffff",
        roughness: 0.04,
        metalness: 0,
        transparent: true,
        opacity: 0.1,
        envMapIntensity: 1.2,
        depthWrite: false,
      }),
    [],
  );
  const curtainsCur = useRef(1);
  const curtainL = useRef<Mesh>(null);
  const curtainR = useRef<Mesh>(null);
  // Linen with folds: a fine plane displaced by a sine along its width, so
  // the folds bunch as the curtain gathers (scale.x shrinks).
  const curtainGeom = useMemo(() => {
    const g = new PlaneGeometry(1, 2.5, 64, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(
        i,
        0.035 * Math.sin(x * Math.PI * 16) + 0.012 * Math.sin(x * Math.PI * 37),
      );
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const curtainMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#efe6d8",
        roughness: 1,
        transparent: true,
        opacity: 0.93,
        side: 2,
      }),
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
      // Two shallow swags along the glass wall's header.
      const v = u * 2;
      const seg = Math.floor(v);
      const f = v - seg;
      pts.push([
        -2.2 + seg * 2.2 + f * 2.2,
        2.46 - 0.1 * Math.sin(f * Math.PI),
        -1.1,
      ]);
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
    () => new MeshStandardMaterial({ color: "#1c1d22", roughness: 0.45 }),
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
      garden: new PlaneGeometry(13.5, 6.75),
      glass: new PlaneGeometry(1.55, 2.6),
      rail: new CylinderGeometry(0.012, 0.012, 4.8, 8).rotateZ(Math.PI / 2),
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
      label: new MeshStandardMaterial({ color: "#c4795a", roughness: 0.8 }),
      brass: new MeshStandardMaterial({
        color: "#b08d4f",
        roughness: 0.3,
        metalness: 0.9,
      }),
      blade: new MeshStandardMaterial({ color: "#b89b74", roughness: 0.8 }),
    }),
    [],
  );

  const toggleCurtains = useRoomStore((s) => s.toggleCurtains);
  const toggleSound = useRoomStore((s) => s.toggleSound);
  const puff = useRoomStore((s) => s.puff);
  // The baked workstation brings its own keyboard; the pressing keys were the built one's.
  const baked = useRoomStore((s) => s.baked);
  const curtainsThing = useThing(
    "the curtains",
    "click to draw or open",
    toggleCurtains,
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

    // Curtains gather to the mullions when open and meet in the middle when
    // closed; the glass dims a little behind them.
    curtainsCur.current = lerp(
      curtainsCur.current,
      room.curtainsOpen ? 1 : 0,
      k,
    );
    const open = curtainsCur.current;
    const spread = lerp(2.4, 0.5, open);
    for (const [ref, side] of [
      [curtainL, -1],
      [curtainR, 1],
    ] as const) {
      const c = ref.current;
      if (!c) continue;
      c.scale.x = spread;
      c.position.x = side * (2.4 - spread / 2);
      c.rotation.y = side * 0.06 * open;
    }
    // Outside: dark and blue at night with rain on the glass, warm at dusk.
    const ev = 1 - lampLevel.current;
    pane.uniforms.time.value = reducedMotion ? 0 : t;
    pane.uniforms.rain.value = high ? 1 - ev : 0.4 * (1 - ev);
    pane.uniforms.bright.value = (0.85 + 0.15 * open) * (0.14 + 0.86 * ev);
    (pane.uniforms.tint.value as Color).copy(nightTint).lerp(duskTint, ev);

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
      {/* The glass wall: the garden well behind it for parallax, three sheets
          of glass with a faint reflection, linen curtains on a rail. */}
      {stage >= 1 ? (
        <mesh geometry={g.garden} material={pane} position={[0, 1.9, -3.8]} />
      ) : null}
      {[-1.6, 0, 1.6].map((x) => (
        <mesh
          key={x}
          geometry={g.glass}
          material={glassMat}
          position={[x, 1.3, -1.2]}
        />
      ))}
      <group position={[0, 1.32, -1.08]} {...curtainsThing}>
        <mesh ref={curtainL} geometry={curtainGeom} material={curtainMat} />
        <mesh ref={curtainR} geometry={curtainGeom} material={curtainMat} />
        <mesh geometry={g.rail} material={m.black} position={[0, 1.27, 0]} />
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
        </>
      ) : null}
      {stage >= 1 ? (
        <>
          <instancedMesh
            ref={keys}
            args={[keyGeom, keyMat, KEYS]}
            visible={!baked}
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
