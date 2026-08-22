import supabase from "./supabaseClient";
import {
  DEMO_PROJECTS,
  PROJECTS_STORAGE_KEY,
  demoToSampleProject,
  ensureDemoProjectsSeeded,
} from "./demo-projects";

export type SampleProject = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  tags: string[];
};

export { ensureDemoProjectsSeeded };

function loadProjectsLocal(): SampleProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{
      id?: string;
      title?: string;
      subtitle?: string;
      location?: string;
      tags?: string[];
    }>;
    return parsed
      .filter((p) => p.title?.trim())
      .map((p) => ({
        id: p.id || `local-${Math.random()}`,
        title: p.title || "Untitled project",
        subtitle: p.subtitle || "",
        location: p.location || "",
        tags: (p.tags || []).slice(0, 4),
      }));
  } catch {
    return [];
  }
}

function mapDbRow(row: {
  id?: string;
  title?: string;
  subtitle?: string;
  location?: string;
  tags?: string[];
  data?: {
    title?: string;
    subtitle?: string;
    location?: string;
    tags?: string[];
  };
}): SampleProject {
  return {
    id: row.id || `p-${Math.random()}`,
    title: row.title || row.data?.title || "Community project",
    subtitle: row.subtitle || row.data?.subtitle || "",
    location: row.location || row.data?.location || "",
    tags: (row.tags || row.data?.tags || []).slice(0, 4),
  };
}

function mergeUnique(projects: SampleProject[]): SampleProject[] {
  return projects.filter(
    (item, index, arr) => arr.findIndex((m) => m.id === item.id) === index
  );
}

/** All known projects for homepage cards (demo + storage + DB). Order is stable. */
export async function fetchAllSampleProjects(): Promise<SampleProject[]> {
  if (typeof window !== "undefined") {
    ensureDemoProjectsSeeded();
  }

  let fromDb: SampleProject[] = [];

  try {
    const { data: projectRows } = await supabase
      .from("match_projects")
      .select("id, title, subtitle, location, tags, data")
      .order("created_at", { ascending: false })
      .limit(20);

    fromDb = (projectRows || []).map(mapDbRow).filter((p) => p.title);
  } catch {
    fromDb = [];
  }

  const local = typeof window !== "undefined" ? loadProjectsLocal() : [];
  const demo = DEMO_PROJECTS.map(demoToSampleProject);

  return mergeUnique([...fromDb, ...local, ...demo]);
}

/** Pick first N projects in stable order (avoids hydration issues from random shuffle). */
export async function fetchSampleProjects(limit = 2): Promise<SampleProject[]> {
  const all = await fetchAllSampleProjects();
  return all.slice(0, limit);
}
