/** Stable sample projects — same on server and client (no Math.random). */
export type DemoProject = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  tags: string[];
  needed?: number;
  joined?: number;
  postTypes?: Array<"Project" | "Mentor">;
};

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: "demo-project-solar-khartoum",
    title: "Community Solar Toolkit",
    subtitle: "Building open-source designs for affordable rooftop solar in Khartoum neighborhoods.",
    location: "Khartoum, Sudan",
    tags: ["Sustainability", "Hardware", "Open Source"],
    needed: 4,
    joined: 2,
    postTypes: ["Project"],
  },
  {
    id: "demo-project-health-app",
    title: "Rural Clinic Queue App",
    subtitle: "Lightweight SMS-first app to reduce wait times at understaffed clinics.",
    location: "Alexandria, Egypt",
    tags: ["Healthcare", "React Native", "Social Impact"],
    needed: 3,
    joined: 1,
    postTypes: ["Project"],
  },
  {
    id: "demo-project-agritech",
    title: "Nile Delta Crop Monitor",
    subtitle: "Sensor + dashboard trial helping small farms track soil moisture and pests.",
    location: "Tanta, Egypt",
    tags: ["Agriculture", "IoT", "Data Science"],
    needed: 5,
    joined: 3,
    postTypes: ["Project"],
  },
  {
    id: "demo-project-edtech",
    title: "Arabic STEM Micro-lessons",
    subtitle: "Short bilingual video lessons for high-school students preparing for engineering tracks.",
    location: "Cairo, Egypt",
    tags: ["Education", "Content", "Arabic"],
    needed: 2,
    joined: 0,
    postTypes: ["Project"],
  },
  {
    id: "demo-project-fintech",
    title: "Maker Savings Circle Ledger",
    subtitle: "Transparent group savings tool for informal cooperatives — mobile-first, low data.",
    location: "Omdurman, Sudan",
    tags: ["Fintech", "Mobile", "Community"],
    needed: 4,
    joined: 2,
    postTypes: ["Project"],
  },
  {
    id: "demo-project-design",
    title: "Refugee Skills Portfolio Hub",
    subtitle: "Template portfolio site helping displaced makers showcase work to remote employers.",
    location: "Remote · MENA",
    tags: ["Design", "Careers", "Web"],
    needed: 3,
    joined: 1,
    postTypes: ["Project"],
  },
];

export const PROJECTS_STORAGE_KEY = "matching_project_posts";

export function demoToMatchCard(project: DemoProject) {
  return {
    ...project,
    type: "project" as const,
    images: [] as string[],
    ownerId: "demo",
  };
}

export function demoToSampleProject(project: DemoProject) {
  return {
    id: project.id,
    title: project.title,
    subtitle: project.subtitle,
    location: project.location,
    tags: project.tags,
  };
}

/** Merge sample projects into localStorage once (skipped if already present). */
export function ensureDemoProjectsSeeded(): void {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as Array<{ id?: string }>) : [];
    const existingIds = new Set(existing.map((p) => p.id));
    const missing = DEMO_PROJECTS.filter((p) => !existingIds.has(p.id)).map(demoToMatchCard);
    if (missing.length === 0) return;
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([...missing, ...existing]));
  } catch {
    localStorage.setItem(
      PROJECTS_STORAGE_KEY,
      JSON.stringify(DEMO_PROJECTS.map(demoToMatchCard))
    );
  }
}
