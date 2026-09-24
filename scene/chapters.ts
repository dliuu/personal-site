export type InstrumentKind =
  "desk" | "armillary" | "balance" | "network" | "globe" | "site" | "quadrant";
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
  /**
   * A plate scrubs beats; with `exit: "dive"` it gains one more slot in which
   * the camera flies into the hero (a screen showing the next page) and the
   * next section is cut to behind the fill instead of shrinking back.
   */
  plate?: { beats: PlateBeat[]; exit?: "dive" };
  /** A full-screen scene instead of a text chapter: the chapter is its plate. */
  scene?: "desk";
  /** Presented as a screen (the desktop inside the intro's monitor): drawn raw, never engraved. */
  screen?: boolean;
  /** Hold the engraving at full strength through the plate: this chapter is a drawing, and never dissolves to a real render. */
  engraved?: boolean;
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
  zoom: "far" | "full" | "near" | "mid" | "close";
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
 * places orchestrator 0 at 90°, the anchored worker near −30° and the pillar
 * at 210°).
 */
export const eisenBeats: PlateBeat[] = [
  {
    caption:
      "An AI agent orchestration flow: a software factory where orchestrator agents spin up their own containers for every developer task, test run and client product feature.",
    sub: "The orchestrators",
    at: "orchestrator",
    lon: -90,
    // High enough that the near orchestrator projects below centre, so its
    // card has room above it.
    lat: 42,
    zoom: "near",
    side: "right",
  },
  {
    caption:
      "Financial compliance automation: every container runs against deterministic success and failure criteria, and returns its result for the orchestrator to iterate on.",
    sub: "Pass or fail",
    at: "worker",
    lon: 30,
    lat: 10,
    zoom: "near",
    side: "left",
  },
  {
    caption:
      "Backend work: the substrate the factory stands on, for banks, exchanges and financing institutions.",
    sub: "The substrate",
    at: "pillar",
    lon: 150,
    lat: 38,
    zoom: "full",
    side: "right",
  },
];

/**
 * Washington Capital's plate: the drawing builds itself, one beat per bullet.
 * The camera walks east in one direction, 120° then 60° then 60°, and every
 * longitude is chosen for what it puts in the clear: the lot (i), the corner
 * where two clad faces meet, which is the twelve the caption promises (ii),
 * the dimension runs beside the elevation rather than behind it (iii), and the
 * draws and the vault (iv). Beat i's 50° is a near-plan view, deliberately
 * neither 90° nor the 72° this chapter was first drawn at: overhead, a hinging
 * wall only foreshortens and reads as shrinking, but the camera holds its
 * elevation once it arrives, so the same number decides what a wall that has
 * *finished* hinging looks like — it keeps cos(lat) of its height, 0.31 at 72°
 * and 0.64 at 50°. Every beat holds `full`: the drawing is 2.04 tall on a rig
 * that frames a 1.05 sphere, so the beats differ by angle, not distance. No
 * `at`: `Site` draws no callouts, and an anchored beat's docked caption is
 * hidden above 721px, so these four use the dock.
 */
export const wcpBeats: PlateBeat[] = [
  {
    caption:
      "Led an 8-engineer team to build and deploy a stateless backend for FISH, a white-label lending platform; institutional onboarding contributed $1.3M ARR.",
    sub: "The slab",
    lon: -90,
    lat: 50,
    zoom: "full",
  },
  {
    caption:
      "A multi-client backend for DSCR, hard-money, refinance and bridge loans, with live admin customization for 12+ lending institutions.",
    sub: "One frame, twelve faces",
    lon: 30,
    lat: 18,
    zoom: "full",
  },
  {
    caption:
      "Configurable loan calculations and guidelines across regions; the fleet scaled on traffic data, response times 56% faster year over year.",
    sub: "56%",
    lon: 90,
    lat: 4,
    zoom: "full",
  },
  {
    caption:
      "Live pipelines ingesting payment, disbursement and lending data into production Postgres.",
    sub: "The draw schedule",
    lon: 150,
    // Below grade, where the lot plane no longer stands between the camera and
    // the vault. The eye does not cross the sheet at 0°: the orbit target sits
    // 0.53 above the lot, so it passes the paper at about −9.4°, a quarter of
    // the way into the beat, and the crossing hides the sub-grade run of the
    // draws rather than opening it as an image. −12° clears the sheet by 2.6°;
    // the cull itself cannot pop, since a plane turns over exactly when its
    // projected area is zero.
    lat: -12,
    zoom: "full",
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
    plate: { beats: eisenBeats, exit: "dive" },
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
    // spinY, not drop: `case "drop"` never reaches the default branch that
    // applies the plate yaw, so a drop chapter cannot orbit in its plate. The
    // topping-out beam is driven inside Site instead.
    mech: "spinY",
    note: "the last beam",
    spin: 0,
    palette: { paper: "#efe0cc", ink: "#3d2418", accent: "#c49a3c" },
    engraved: true,
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
  dive?: boolean;
};
export const sections: Section[] = chapters.flatMap((c, i): Section[] =>
  c.scene
    ? [{ id: `${c.id}-plate`, chapter: i, kind: "plate" as const }]
    : c.plate
      ? [
          { id: c.id, chapter: i, kind: "chapter" as const },
          {
            id: `${c.id}-plate`,
            chapter: i,
            kind: "plate" as const,
            dive: c.plate.exit === "dive",
          },
        ]
      : [{ id: c.id, chapter: i, kind: "chapter" as const }],
);

/** Scroll slots in a chapter's plate: its beats, plus one for a dive. */
export function plateSlots(c: Chapter): number {
  if (!c.plate) return 0;
  return c.plate.beats.length + (c.plate.exit === "dive" ? 1 : 0);
}
