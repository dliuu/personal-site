import type { Keyframe, Vec3 } from "@/lib/cameraPath";

export const SECTION_IDS = ["intro", "work", "writing", "contact"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

// Room: floor y=0, back wall z=-4, left wall x=-4. Desk at (0.2, 0, -2.6).
export const keyframes: Keyframe[] = [
  { position: [3.2, 1.9, 4.8], target: [-0.3, 1.0, -2.0] }, // intro
  { position: [0.5, 1.7, -0.3], target: [-0.2, 1.2, -3.0] }, // work: desk + shelf above it
  { position: [-0.4, 1.8, -0.6], target: [-3.0, 2.0, -3.3] }, // writing: notes (left) + shelf corner (right)
  { position: [0.6, 1.5, -1.2], target: [2.0, 1.3, -3.8] }, // contact: window + side table
];

export const INTRO_START: Vec3 = [4.6, 1.9, 7.2];
export const INTRO_DURATION = 1.5;
export const PAGES = 4.2;
export const PARALLAX_AMOUNT = 0.15;

// Desk top is at y≈0.77; shelf at y≈1.85 on the left wall.
export const PROJECT_SLOTS: Vec3[] = [
  [-0.6, 0.83, -2.45],
  [0.85, 0.83, -2.35],
  [-0.35, 1.93, -3.79],
  [0.05, 1.93, -3.79],
];
