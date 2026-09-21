export type InstrumentKind = "armillary" | "astrolabe" | "gears" | "quadrant";
export type Chapter = {
  id: string;
  numeral: string;
  title: string;
  instrument: InstrumentKind;
  note: string; // margin annotation
  spin: number;
  mech: "spinY" | "spinZ" | "swing";
};

export const chapters: Chapter[] = [
  {
    id: "intro",
    numeral: "I",
    title: "Hello",
    instrument: "armillary",
    note: "the heavens, in three rings",
    spin: 0.12,
    mech: "spinY",
  },
  {
    id: "work",
    numeral: "II",
    title: "Work",
    instrument: "astrolabe",
    note: "a rete for finding things",
    spin: 0.08,
    mech: "spinZ",
  },
  {
    id: "writing",
    numeral: "III",
    title: "Writing",
    instrument: "gears",
    note: "one turn moves the next",
    spin: 0.1,
    mech: "spinY",
  },
  {
    id: "contact",
    numeral: "IV",
    title: "Contact",
    instrument: "quadrant",
    note: "sight, then read the arc",
    spin: 0.06,
    mech: "swing",
  },
];
