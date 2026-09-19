export type Project = {
  slug: string;
  title: string;
  blurb: string;
  url: string;
  slot: number; // index into PROJECT_SLOTS
};

export const profile = {
  name: "Your Name",
  line: "I build small, warm things for the web.",
};

export const projects: Project[] = [
  {
    slug: "one",
    title: "Project One",
    blurb: "A placeholder for the first project. Replace with a real one.",
    url: "#",
    slot: 0,
  },
  {
    slug: "two",
    title: "Project Two",
    blurb: "Something interactive. A few sentences about why it mattered.",
    url: "#",
    slot: 1,
  },
  {
    slug: "three",
    title: "Project Three",
    blurb: "A tool you shipped. What it does and who uses it.",
    url: "#",
    slot: 2,
  },
  {
    slug: "four",
    title: "Project Four",
    blurb: "An experiment that taught you something.",
    url: "#",
    slot: 3,
  },
];

export const posts = [
  {
    slug: "hello",
    title: "Why a room",
    date: "2026-09-01",
    summary: "On choosing one warm space over an explorable world.",
  },
  {
    slug: "lighting",
    title: "Lighting primitives",
    date: "2026-08-14",
    summary: "Getting boxes to look like furniture.",
  },
  {
    slug: "scroll",
    title: "Scroll as a camera dolly",
    date: "2026-07-30",
    summary: "Notes on demand-mode rendering.",
  },
];

export const links = [
  { label: "Email", href: "mailto:you@example.com" },
  { label: "GitHub", href: "https://github.com/dliuu" },
  { label: "Resume", href: "#" },
];
