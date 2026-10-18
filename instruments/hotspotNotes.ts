import type { InstrumentKind } from "./chapters";

export type Hotspot = {
  position: [number, number, number];
  label: string;
  note: string;
};

export const hotspots: Record<InstrumentKind, Hotspot[]> = {
  desk: [],
  armillary: [
    {
      position: [1.5, 0, 0],
      label: "1",
      note: "Twenty-four ticks: hours on the outer ring.",
    },
    {
      position: [0, 0.3, 0],
      label: "2",
      note: "The globe at the centre is the only thing that does not turn.",
    },
  ],
  balance: [
    {
      position: [-1.2, 0.55, 0],
      label: "1",
      note: "Eisen: infrastructure for banks, exchanges and financing institutions.",
    },
    {
      position: [0, 1.4, 0],
      label: "2",
      note: "The beam swings, then settles level.",
    },
  ],
  // Eisen's hero is the Clearing Works figure, which carries its own labels;
  // 3D markers would float over an empty canvas.
  network: [],
  globe: [
    {
      position: [0.9, 0.55, 0.5],
      label: "1",
      note: "48 pins: one per language-locale launched with AI Translation.",
    },
    {
      position: [0, -1.0, 0],
      label: "2",
      note: "$4.31M in annualized translation OPEX savings.",
    },
  ],
  bridge: [
    {
      position: [0, 0.35, 0],
      label: "1",
      note: "The keystone goes in last: bridge loans, DSCR, hard-money, refinance.",
    },
    {
      position: [-1.55, 0.2, 0],
      label: "2",
      note: "$1.3M ARR from institutional onboarding.",
    },
  ],
  site: [
    {
      position: [0.18, 0.44, -0.03],
      label: "1",
      note: "The crane sets the cap last: the classifier that files every page and payment.",
    },
    {
      position: [0.58, -0.03, -0.14],
      label: "2",
      note: "Five towers, one block: each draw raises a floor.",
    },
  ],
  quadrant: [
    {
      position: [0.5, -0.4, 0],
      label: "1",
      note: "Sight the star, then read the arc. Email, GitHub, resume.",
    },
  ],
};
