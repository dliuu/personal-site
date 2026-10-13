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
  /** What the placeholder scene stands in as, until a project has its own. */
  kind: "product" | "ml";
  /** The hairline emblem on its card. */
  emblem: "cabin" | "candles" | "mill" | "screen";
  /** Its own scene module (instruments/projects/*), loaded on first open. */
  scene?: "stuga" | "trading";
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

export const projects: Project[] = [
  {
    id: "stuga",
    title: "Stuga",
    line: "Co-own a vacation home: shares of a house, and a year with no double bookings.",
    kind: "product",
    emblem: "cabin",
    scene: "stuga",
    // PLACEHOLDER wording (owner input): the facts are from the Stuga page.
    beats: [
      {
        caption:
          "The problem: a vacation home costs one owner everything and sits empty fifty weeks a year.",
        sub: "The problem",
        at: "house",
        lon: -90,
        lat: 14,
        zoom: "full",
        side: "left",
      },
      {
        caption:
          "The build: shares of a home for eight co-owners, and a booking engine that gives each their weeks with no two overlapping. Full stack, launched August 2023.",
        sub: "The build",
        at: "ring",
        lon: -70,
        lat: 22,
        zoom: "full",
        side: "left",
      },
      {
        caption:
          "The result: beach, mountain and countryside homes, each owned by a group and booked through the year.",
        sub: "The result",
        at: "neighbours",
        lon: -100,
        lat: 16,
        zoom: "far",
        side: "left",
      },
    ],
  },
  {
    id: "trading",
    title: "Trading agents",
    line: "An agent loop that researches, decides, checks risk and places the order.",
    kind: "ml",
    emblem: "candles",
    scene: "trading",
    // PLACEHOLDER wording (owner input): no returns are claimed until the owner says what the run was.
    beats: [
      {
        caption:
          "The problem: markets move faster than a person can read them, and a bad trade is one click away.",
        sub: "The problem",
        lon: -90,
        lat: 16,
        zoom: "full",
        side: "left",
      },
      {
        caption:
          "The build: four agents in a loop, research, strategy, risk and execution, and every order through the risk gate.",
        sub: "The build",
        at: "carousel",
        lon: -75,
        lat: 20,
        zoom: "full",
        side: "left",
      },
      {
        caption:
          "The result: orders placed and logged across the run, each one flagged where it happened.",
        sub: "The result",
        at: "flags",
        lon: -105,
        lat: 12,
        zoom: "mid",
        side: "left",
      },
    ],
  },
  // PLACEHOLDER projects (owner input): two more to come.
  {
    id: "project-three",
    title: "Project three",
    line: "A third build, to be named.",
    kind: "ml",
    emblem: "mill",
    beats: [
      {
        caption: "The problem.",
        sub: "The problem",
        at: "a",
        lon: -90,
        lat: 12,
        zoom: "full",
        side: "left",
      },
      {
        caption: "The build.",
        sub: "The build",
        at: "b",
        lon: -60,
        lat: 8,
        zoom: "mid",
        side: "left",
      },
      {
        caption: "The result.",
        sub: "The result",
        at: "c",
        lon: -110,
        lat: 20,
        zoom: "close",
        side: "left",
      },
    ],
  },
  {
    id: "project-four",
    title: "Project four",
    line: "A fourth build, to be named.",
    kind: "product",
    emblem: "screen",
    beats: [
      {
        caption: "The problem.",
        sub: "The problem",
        at: "a",
        lon: -90,
        lat: 10,
        zoom: "full",
        side: "left",
      },
      {
        caption: "The build.",
        sub: "The build",
        at: "b",
        lon: -65,
        lat: 6,
        zoom: "mid",
        side: "left",
      },
      {
        caption: "The result.",
        sub: "The result",
        at: "c",
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
