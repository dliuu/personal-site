export type InstrumentKind =
  | "desk"
  | "armillary"
  | "balance"
  | "network"
  | "globe"
  | "bridge"
  | "site"
  | "quadrant";
/** `face`: like spinY in the plate, but never turns with the scroll in the band (the scene has a front). */
export type MechKind = "spinY" | "spinZ" | "swing" | "tilt" | "drop" | "face";
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
  /** Locale id, or "nyc", the card and camera anchor on the globe; any other name marks a beat the instrument anchors itself (camera from lon/lat). */
  at?: string;
  /** Longitude to face when there is no anchor. */
  lon?: number;
  /** Camera elevation in degrees when there is no locale anchor (default 0). */
  lat?: number;
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

/**
 * Eisen's plate: one beat per bullet, each anchored on a layer of the
 * factory. Longitudes are chosen so the anchor faces the camera (Network.tsx
 * places the gate at −30° and the pillar at 210°).
 */
export const eisenBeats: PlateBeat[] = [
  {
    caption:
      "An AI agent orchestration flow: a software factory that spins up a container agent for every developer task, test run and client product feature.",
    sub: "The orchestrator",
    at: "core",
    lon: -90,
    lat: 22,
    zoom: "full",
    side: "right",
  },
  {
    caption:
      "Financial compliance automation: every piece of work crosses the ring and is stamped before it ships.",
    sub: "The compliance ring",
    at: "gate",
    lon: 30,
    lat: 8,
    zoom: "full",
    side: "left",
  },
  {
    caption:
      "Backend work: the substrate the factory stands on, for banks, exchanges and financing institutions.",
    sub: "The substrate",
    at: "pillar",
    lon: 150,
    lat: 38,
    zoom: "far",
    side: "right",
  },
];

/**
 * WCP's plate, the draw engine: one beat per bullet. The scene faces the
 * camera at lon −90 (faceYaw(−90) = 0), so beats sit around it.
 */
export const wcpBeats: PlateBeat[] = [
  {
    caption:
      "Led an 8-engineer team to build and deploy a stateless backend for FISH, a white-label lending platform; institutional onboarding contributed $1.3M ARR.",
    sub: "The site",
    at: "plot",
    lon: -90,
    lat: 18,
    zoom: "full",
    side: "right",
  },
  {
    caption:
      "A multi-client backend for DSCR, hard-money, refinance and bridge loans, with live admin customization for 12+ lending institutions.",
    sub: "The lenders",
    at: "tower",
    lon: -72,
    lat: 12,
    zoom: "mid",
    side: "right",
  },
  {
    caption:
      "A project-management system for configurable loan calculations and guidelines across regions; the fleet scaled on traffic data, response times 56% faster year over year.",
    sub: "The crane",
    at: "crane",
    lon: -104,
    lat: 22,
    zoom: "full",
    side: "left",
  },
  {
    caption:
      "Live pipelines ingesting payment, disbursement and lending data into production Postgres.",
    sub: "The ledger",
    at: "silo",
    lon: -80,
    lat: 20,
    zoom: "close",
    side: "right",
  },
  {
    caption:
      "AI categorization: every loan document and payment line read and filed to its place in the loan record.",
    sub: "The cap",
    lon: -96,
    lat: 14,
    zoom: "full",
    side: "left",
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
    palette: { paper: "#efe7da", ink: "#3a3128", accent: "#7a8b6a" },
    scene: "desk",
    plate: { beats: [] },
  },
  {
    id: "eisen",
    numeral: "II",
    title: "Eisen",
    instrument: "network",
    mech: "spinY",
    note: "a container for every task",
    spin: 0.05,
    // Eisen is the desktop inside the intro's monitor: a screen, not a page.
    palette: { paper: "#14161c", ink: "#e6e9ef", accent: "#7fb0ff" },
    screen: true,
    plate: { beats: eisenBeats },
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
    instrument: "site",
    mech: "face",
    note: "floors up, the cap last",
    spin: 0,
    palette: { paper: "#efe0cc", ink: "#3d2418", accent: "#c49a3c" },
    plate: { beats: wcpBeats },
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
