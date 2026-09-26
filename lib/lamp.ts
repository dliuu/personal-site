import { Vector3 } from "three";

/**
 * Where the desk lamp stands, in one place.
 *
 * The lamp is five things in three files that all have to agree: the baked prop
 * (`assets/room/props/manifest.json`), the procedural stand-in shown until the
 * bake arrives and the bulb that outlives it (`scene/DeskScene.tsx`), its spot
 * light, and the dust and beam cone (`scene/RoomLife.tsx`). They disagreed
 * once already — the prop was placed at x −0.55, straight through the second
 * monitor, because nothing showed both at once.
 *
 * It stands in the back-left corner, clearing the second monitor by 77 mm and
 * the nearest desk edge by 44 mm. LAMP_BASE and LAMP_YAW must match the
 * manifest entry, whose `position` is 0.05 higher (the prop's origin sits at
 * the desk surface, this group's at the base's underside).
 */
export const LAMP_YAW = 1.7;
export const LAMP_BASE = new Vector3(-0.65, 0.755, -0.66);

/**
 * The prop's own light surface — its `desk_lamp_arm_01_light` primitive,
 * centred at (−0.0047, 0.6956, −0.1767) in prop space, scaled by 0.55 — given
 * relative to LAMP_BASE and before LAMP_YAW.
 */
export const SHADE_LOCAL = new Vector3(-0.0026, 0.4326, -0.0972);

/** The shade's mouth in world space: where the light actually comes from. */
export const SHADE = SHADE_LOCAL.clone()
  .applyAxisAngle(new Vector3(0, 1, 0), LAMP_YAW)
  .add(LAMP_BASE);

/** What the lamp is aimed at: the near half of the desk, where the hands are. */
export const LAMP_TARGET = new Vector3(0, 0.75, -0.2);

/** Just outside the shade, so the lamp does not shadow its own beam. */
export const LAMP_LIGHT = LAMP_TARGET.clone()
  .sub(SHADE)
  .normalize()
  .multiplyScalar(0.08)
  .add(SHADE);

/**
 * The visible beam: a 0.62-long cone hung under the shade and leaned along the
 * aim, and the column of dust that drifts down through it.
 */
export const CONE = new Vector3(SHADE.x, SHADE.y - 0.275, SHADE.z);
export const CONE_TILT: [number, number, number] = [-0.07, 0, 0.12];
