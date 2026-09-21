export type InstrumentKind =
  "armillary" | "balance" | "globe" | "bridge" | "quadrant";
export type MechKind = "spinY" | "spinZ" | "swing" | "tilt" | "drop";
export type Chapter = {
  id: "intro" | "eisen" | "meta" | "wcp" | "contact";
  numeral: string;
  title: string;
  instrument: InstrumentKind;
  mech: MechKind;
  note: string;
  spin: number;
  palette: { paper: string; ink: string; accent: string };
};

export const chapters: Chapter[] = [
  {
    id: "intro",
    numeral: "I",
    title: "Hello",
    instrument: "armillary",
    mech: "spinY",
    note: "the heavens, in three rings",
    spin: 0.12,
    palette: { paper: "#efe4cc", ink: "#2b2118", accent: "#c49a3c" },
  },
  {
    id: "eisen",
    numeral: "II",
    title: "Eisen",
    instrument: "balance",
    mech: "tilt",
    note: "weigh, then settle",
    spin: 0,
    palette: { paper: "#e7e3db", ink: "#1f2a36", accent: "#c49a3c" },
  },
  {
    id: "meta",
    numeral: "III",
    title: "Meta",
    instrument: "globe",
    mech: "spinY",
    note: "forty-eight pins, one per tongue",
    spin: 0.08,
    palette: { paper: "#e9e7e0", ink: "#1c2b4b", accent: "#b8432e" },
  },
  {
    id: "wcp",
    numeral: "IV",
    title: "Washington Capital",
    instrument: "bridge",
    mech: "drop",
    note: "the keystone last",
    spin: 0,
    palette: { paper: "#efe0cc", ink: "#3d2418", accent: "#c49a3c" },
  },
  {
    id: "contact",
    numeral: "V",
    title: "Contact",
    instrument: "quadrant",
    mech: "swing",
    note: "sight, then read the arc",
    spin: 0.06,
    palette: { paper: "#efe4cc", ink: "#2b2118", accent: "#c49a3c" },
  },
];
