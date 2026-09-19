export type HeroKind = "knot" | "cluster" | "slabs" | "ribbon";
export type Chapter = {
  id: string;
  title: string;
  hero: HeroKind;
  spin: number;
};

export const chapters: Chapter[] = [
  { id: "intro", title: "Hello", hero: "knot", spin: 0.25 },
  { id: "work", title: "Work", hero: "cluster", spin: 0.18 },
  { id: "writing", title: "Writing", hero: "slabs", spin: 0.12 },
  { id: "contact", title: "Contact", hero: "ribbon", spin: 0.3 },
];
