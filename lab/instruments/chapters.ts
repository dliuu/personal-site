export type InstrumentKind =
  "desk" | "armillary" | "balance" | "globe" | "bridge" | "quadrant";
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
  plate?: { beats: PlateBeat[] };
  /** A full-screen scene instead of a text chapter: the chapter is its plate. */
  scene?: "desk";
  /** Presented as a screen (the desktop inside the intro's monitor): drawn raw, never engraved. */
  screen?: boolean;
};
export type PlateBeat = {
  caption: string;
  sub?: string;
  /** Locale id, or "nyc", the card and camera anchor on the globe. */
  at?: string;
  /** Longitude to face when there is no anchor. */
  lon?: number;
  zoom: "far" | "full" | "mid" | "close";
  /** Which side of the anchor the card sits on. */
  side?: "left" | "right";
};

export const metaBeats: PlateBeat[] = [
  {
    caption:
      "From New York: AI Translation launched across 48 language-locales.",
    sub: "Manhattan",
    at: "nyc",
    zoom: "full",
    side: "right",
  },
  {
    caption:
      "Offline and online benchmarks: Llama 3.1 and Llama 4 against Gemini, Claude and GPT, across 48 languages.",
    sub: "Paris",
    at: "fr-FR",
    zoom: "close",
    side: "left",
  },
  {
    caption:
      "Six months of online experimentation across 23 live production metrics with human post-editing, presented to leadership to green-light AI4T in new locales.",
    sub: "New Delhi",
    at: "hi-IN",
    zoom: "close",
    side: "left",
  },
  {
    caption:
      "Concurrency limits across new locale codebases: largest inference spike down 32%, peak threshold down 73%.",
    sub: "Tokyo",
    at: "ja-JP",
    zoom: "close",
    side: "left",
  },
  {
    caption: "AI inference throttles down 84% in H2 2025.",
    sub: "The gauge",
    lon: -100,
    zoom: "full",
  },
  {
    caption: "$4.31M in annualized translation OPEX savings.",
    sub: "Savings",
    lon: -74,
    zoom: "far",
  },
];

export const chapters: Chapter[] = [
  {
    id: "intro",
    numeral: "I",
    title: "Hello",
    instrument: "desk",
    mech: "spinY",
    note: "a room, then the screen",
    spin: 0,
    palette: { paper: "#1a1720", ink: "#efe4cc", accent: "#c49a3c" },
    scene: "desk",
    plate: { beats: [] },
  },
  {
    id: "eisen",
    numeral: "II",
    title: "Eisen",
    instrument: "balance",
    mech: "tilt",
    note: "weigh, then settle",
    spin: 0,
    // Eisen is the desktop inside the intro's monitor: a screen, not a page.
    palette: { paper: "#14161c", ink: "#e6e9ef", accent: "#7fb0ff" },
    screen: true,
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
    plate: { beats: metaBeats },
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

export type Section = {
  id: string;
  chapter: number;
  kind: "chapter" | "plate";
};
export const sections: Section[] = chapters.flatMap((c, i) =>
  c.scene
    ? [{ id: `${c.id}-plate`, chapter: i, kind: "plate" as const }]
    : c.plate
      ? [
          { id: c.id, chapter: i, kind: "chapter" as const },
          { id: `${c.id}-plate`, chapter: i, kind: "plate" as const },
        ]
      : [{ id: c.id, chapter: i, kind: "chapter" as const }],
);
