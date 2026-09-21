export type Experiment = {
  slug: string;
  title: string;
  description: string;
  added: string; // ISO date
};

export const experiments: Experiment[] = [
  {
    slug: "hello-cube",
    title: "Hello cube",
    description:
      "A lit cube with sliders for light colour, intensity, and roughness.",
    added: "2026-09-18",
  },
  {
    slug: "scroll-path",
    title: "Scroll path",
    description:
      "Camera follows a curve through four keyframes as the page scrolls; DOM overlay tracks the active stop.",
    added: "2026-09-18",
  },
  {
    slug: "lighting-bench",
    title: "Lighting bench",
    description:
      "An empty primitive room with a window, sun, lamp, contact shadows and fog, all on sliders. Does primitive plus lighting look soft-realistic?",
    added: "2026-09-18",
  },
  {
    slug: "chapters",
    title: "Chapters",
    description:
      "Editorial scroll: DOM chapters over one fixed canvas, one hero object per chapter crossfading by scroll, halftone post pass as the theme.",
    added: "2026-09-19",
  },
  {
    slug: "studio-room",
    title: "Studio room",
    description:
      "The approved design as an experiment: a primitive studio room, four scroll stops, intro pull-in, parallax, clickable project objects, DOM overlays.",
    added: "2026-09-18",
  },
  {
    slug: "instruments",
    title: "Instruments",
    description:
      "Renaissance variant of chapters: instrument heroes that draw themselves in, an engraving post effect, and a codex-page DOM.",
    added: "2026-09-20",
  },
];

export function findExperiment(slug: string): Experiment | undefined {
  return experiments.find((e) => e.slug === slug);
}
