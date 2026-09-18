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
    description: "A lit cube with sliders for light colour, intensity, and roughness.",
    added: "2026-09-18",
  },
];

export function findExperiment(slug: string): Experiment | undefined {
  return experiments.find((e) => e.slug === slug);
}
