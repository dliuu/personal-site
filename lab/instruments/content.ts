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
    location: "New York",
    summary:
      "Building infrastructure for banks, exchanges and financing institutions.",
    bullets: ["Details to come."],
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
      "Ran six months of online experimentation across 23 production metrics with human post-editing; the results green-lit AI4T workflows in new locales.",
      "Designed machine-translation concurrency limits per locale; largest inference spike down 32%, peak inference threshold down 73%.",
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

export const links = [
  { label: "Email", href: "mailto:you@example.com" },
  { label: "GitHub", href: "https://github.com/dliuu" },
  { label: "Resume", href: "#" },
];
