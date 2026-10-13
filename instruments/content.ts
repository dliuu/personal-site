export const profile = {
  name: "Danny Liu",
  line: "Backend and ML engineer. Financial infrastructure, AI translation at scale, lending platforms.",
};

export type Role = {
  id: "eisen" | "meta" | "wcp";
  company: string;
  url?: string;
  title: string;
  dates: string;
  location: string;
  summary: string;
  bullets: string[];
  skills: string[];
};

export const roles: Role[] = [
  {
    id: "eisen",
    company: "Eisen",
    url: "https://www.witheisen.com/",
    title: "Engineer",
    dates: "2026 – present",
    location: "",
    summary:
      "Building infrastructure for banks, exchanges and financing institutions.",
    // PLACEHOLDER wording (owner input): the three points the Eisen plate anchors.
    bullets: [
      "Building an AI agent orchestration flow: a software factory that spins up a container agent for every developer task, test run and client product feature.",
      "Financial compliance automation.",
      "Backend work.",
    ],
    skills: [],
  },
  {
    id: "meta",
    company: "Meta",
    title: "Backend / ML Engineer, AI for Translation",
    dates: "Jan 2025 – 2026",
    location: "Manhattan, New York",
    summary: "Launched AI Translation across Meta's Family of Apps.",
    bullets: [
      "Designed the distributed infrastructure that launched AI Translation across 48 new language-locales; $4.31M in annualized translation OPEX savings.",
      "Rebuilt the localization platform's billing analysis for post-AI translation; AI inference throttles down 84% in H2 2025.",
      "Ran six months of online experimentation across 23 live production metrics with human post-editing, and presented the data to leadership to green-light AI4T workflows in new locales.",
      "Designed machine-translation concurrency limits across new locale codebases; largest inference spike down 32%, peak inference threshold down 73%.",
      "Led offline and online benchmarks of Llama 3.1 and Llama 4 against Gemini, Claude and GPT across 48 languages.",
    ],
    skills: [
      "Python",
      "PyTorch",
      "Hack/PHP",
      "Presto",
      "Spark",
      "React",
      "Redis",
    ],
  },
  {
    id: "wcp",
    company: "Washington Capital Partners",
    title:
      "Senior Software Engineer · Team Lead, white-label private lending SaaS",
    dates: "2024 – Jan 2025",
    location: "Remote",
    summary:
      "Led the platform behind private hard-money construction lending across the U.S.",
    bullets: [
      "Led an 8-engineer team to build and deploy a stateless backend for FISH, a white-label lending platform; institutional onboarding contributed $1.3M ARR.",
      "Designed a multi-client backend for DSCR, hard-money, refinance and bridge loans with live admin customization for 12+ lending institutions.",
      "Shipped a project-management system for configurable loan calculations and guidelines across regions; scaled the fleet on traffic data, response times 56% faster year over year.",
      "Built live pipelines ingesting payment, disbursement and lending data into production Postgres.",
      // PLACEHOLDER wording (owner input): the categorization work the WCP plate's last beat anchors.
      "Built AI categorization for loan documents and payment transactions, filing each to its place in the loan record.",
    ],
    skills: [
      "Python/Flask",
      "Java",
      "Express",
      "SQL",
      "JavaScript",
      "Scala",
      "Kubernetes",
      "AWS Lightsail",
      "Spark",
      "Docker",
    ],
  },
];

export type Project = {
  id: string;
  title: string;
  line: string;
  kind: "product" | "ml";
  /** Three beats: the problem, the build, the result. */
  beats: {
    caption: string;
    sub?: string;
    lon?: number;
    lat?: number;
    zoom: "far" | "full" | "mid" | "close";
    side?: "left" | "right";
    at?: string;
  }[];
};

// PLACEHOLDER projects (owner input): titles, lines and beats are stand-ins
// until the real list arrives; each project will get its own scene.
export const projects: Project[] = [
  {
    id: "classifier",
    title: "Loan document classifier",
    line: "Reads every page of a loan file and files it where it belongs.",
    kind: "ml",
    beats: [
      {
        caption: "The problem: thousands of pages a week, sorted by hand.",
        sub: "The problem",
        at: "hopper",
        lon: -90,
        lat: 12,
        zoom: "full",
        side: "left",
      },
      {
        caption:
          "The build: a classifier over page text and layout, trained on the back office's own filing.",
        sub: "The build",
        at: "wheel",
        lon: -60,
        lat: 8,
        zoom: "mid",
        side: "left",
      },
      {
        caption:
          "The result: pages land in the right slot before anyone opens the file.",
        sub: "The result",
        at: "out",
        lon: -110,
        lat: 20,
        zoom: "close",
        side: "left",
      },
    ],
  },
  {
    id: "lender-portal",
    title: "Lender portal",
    line: "A white-label front door for twelve lending institutions.",
    kind: "product",
    beats: [
      {
        caption:
          "The problem: every lender wanted its own product, on one platform.",
        sub: "The problem",
        at: "screen",
        lon: -90,
        lat: 10,
        zoom: "full",
        side: "left",
      },
      {
        caption:
          "The build: one backend, live admin customization per institution.",
        sub: "The build",
        at: "edge",
        lon: -65,
        lat: 6,
        zoom: "mid",
        side: "left",
      },
      {
        caption: "The result: twelve brands, one codebase.",
        sub: "The result",
        at: "base",
        lon: -105,
        lat: 18,
        zoom: "close",
        side: "left",
      },
    ],
  },
  {
    id: "benchmarks",
    title: "Translation benchmarks",
    line: "Llama against Gemini, Claude and GPT across 48 languages.",
    kind: "ml",
    beats: [
      {
        caption: "The problem: which model, for which language, at what cost.",
        sub: "The problem",
        at: "hopper",
        lon: -90,
        lat: 12,
        zoom: "full",
        side: "left",
      },
      {
        caption:
          "The build: offline and online benchmarks with human post-editing.",
        sub: "The build",
        at: "wheel",
        lon: -60,
        lat: 8,
        zoom: "mid",
        side: "left",
      },
      {
        caption:
          "The result: the data that green-lit AI translation in new locales.",
        sub: "The result",
        at: "out",
        lon: -110,
        lat: 20,
        zoom: "close",
        side: "left",
      },
    ],
  },
  {
    id: "factory",
    title: "Agent software factory",
    line: "A container agent for every task, stamped by a compliance ring.",
    kind: "product",
    beats: [
      {
        caption: "The problem: a backlog that outgrew the team.",
        sub: "The problem",
        at: "screen",
        lon: -90,
        lat: 10,
        zoom: "full",
        side: "left",
      },
      {
        caption:
          "The build: an orchestrator that spins up an agent per task and a ring that stamps the work.",
        sub: "The build",
        at: "edge",
        lon: -65,
        lat: 6,
        zoom: "mid",
        side: "left",
      },
      {
        caption: "The result: work ships with its compliance trail attached.",
        sub: "The result",
        at: "base",
        lon: -105,
        lat: 18,
        zoom: "close",
        side: "left",
      },
    ],
  },
];

export const links = [
  { label: "Email", href: "mailto:you@example.com" },
  { label: "GitHub", href: "https://github.com/dliuu" },
  { label: "Resume", href: "#" },
];
