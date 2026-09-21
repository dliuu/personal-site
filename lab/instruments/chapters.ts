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
  },
  {
    id: "eisen",
    numeral: "II",
    title: "Eisen",
    instrument: "balance",
    mech: "tilt",
    note: "weigh, then settle",
    spin: 0,
  },
  {
    id: "meta",
    numeral: "III",
    title: "Meta",
    instrument: "globe",
    mech: "spinY",
    note: "forty-eight pins, one per tongue",
    spin: 0.08,
  },
  {
    id: "wcp",
    numeral: "IV",
    title: "Washington Capital",
    instrument: "bridge",
    mech: "drop",
    note: "the keystone last",
    spin: 0,
  },
  {
    id: "contact",
    numeral: "V",
    title: "Contact",
    instrument: "quadrant",
    mech: "swing",
    note: "sight, then read the arc",
    spin: 0.06,
  },
];
