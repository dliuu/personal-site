"use client";

import {
  CanvasTexture,
  Color,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NoColorSpace,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
} from "three";
import { INK } from "./palette";

/** The three.js example planet set (MIT), derived from NASA Blue Marble. */
export type EarthTextures = {
  color: Texture;
  normal: Texture;
  roughness: Texture;
  clouds: Texture;
};

let promise: Promise<EarthTextures> | null = null;
/** Loads the four maps once (no Suspense: the Stage fallback would blank the hero). */
export function loadEarthTextures(): Promise<EarthTextures> {
  promise ??= (async () => {
    const loader = new TextureLoader();
    const load = (f: string) => loader.loadAsync(`/textures/earth/${f}`);
    const [color, normal, spec, clouds] = await Promise.all([
      load("earth_atmos_2048.jpg"),
      load("earth_normal_2048.jpg"),
      load("earth_specular_2048.jpg"),
      load("earth_clouds_1024.png"),
    ]);
    color.colorSpace = SRGBColorSpace;
    color.anisotropy = 4;
    normal.colorSpace = NoColorSpace;
    normal.anisotropy = 4;
    clouds.colorSpace = SRGBColorSpace;
    const roughness = specularToRoughness(spec);
    spec.dispose();
    return { color, normal, roughness, clouds };
  })();
  return promise;
}

/** Ocean is white in the specular mask; roughness wants it darker: rough = 255 − 0.55·spec (ocean ≈ 0.45, land 1). */
function specularToRoughness(spec: Texture): Texture {
  const img = spec.image as HTMLImageElement;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = 255 - 0.55 * px[i];
    px[i] = px[i + 1] = px[i + 2] = r;
  }
  ctx.putImageData(data, 0, 0);
  const t = new CanvasTexture(c);
  t.colorSpace = NoColorSpace;
  return t;
}

export function makeEarthMaterial(t: EarthTextures): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    map: t.color,
    normalMap: t.normal,
    normalScale: new Vector2(0.6, 0.6),
    roughnessMap: t.roughness,
    roughness: 1,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.5,
    transparent: true,
    opacity: 0,
  });
}

/** The cloud map is white with the clouds in its alpha channel; unlit is fine for something this bright. */
export function makeCloudMaterial(t: EarthTextures): MeshBasicMaterial {
  return new MeshBasicMaterial({
    map: t.clouds,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
}

/** A faint limb glow that sits on light paper: normal blending, fresnel alpha. */
export function makeAtmosphereMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      reveal: { value: 0 },
      tint: { value: new Color("#6f93c4") },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float reveal;
      uniform vec3 tint;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = 1.0 - max(dot(normalize(vN), normalize(vV)), 0.0);
        float a = 0.6 * pow(f, 3.0) * reveal;
        gl_FragColor = vec4(tint, a);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
}

/** A soft radial shadow, ink at the centre fading to nothing, for the plane under the base. */
export function makeShadowTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const ink = new Color(INK);
  const rgb = `${Math.round(ink.r * 255)}, ${Math.round(ink.g * 255)}, ${Math.round(ink.b * 255)}`;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, `rgba(${rgb}, 1)`);
  grad.addColorStop(0.5, `rgba(${rgb}, 0.35)`);
  grad.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
