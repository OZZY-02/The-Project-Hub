/**
 * `profile_intakes.data` is free-form JSON that has been written by more than one
 * builder over the life of the project, so shapes vary:
 *
 *   skills:   ["React"]                       | [{ name, level }]
 *   projects: [{ name, description, ... }]    | [{ title, role, ... }]
 *
 * Everything that reads an intake should go through these normalizers rather than
 * indexing into the raw JSON, so a legacy row never renders as blank or crashes.
 */

export type IntakeSkill = {
  name: string;
  /** 1–5 where the writer recorded it; null when unknown. */
  level: number | null;
};

export type IntakeProject = {
  name: string;
  description: string;
  role: string;
  isTeam: boolean;
  images: string[];
  tags: string[];
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asString).filter(Boolean);
}

function firstString(source: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = asString(source[key]);
    if (value) return value;
  }
  return "";
}

export function normalizeIntakeSkills(intake: unknown): IntakeSkill[] {
  if (!isRecord(intake) || !Array.isArray(intake.skills)) return [];

  const skills: IntakeSkill[] = [];
  for (const entry of intake.skills) {
    if (typeof entry === "string") {
      const name = entry.trim();
      if (name) skills.push({ name, level: null });
      continue;
    }
    if (isRecord(entry)) {
      const name = firstString(entry, ["name", "skill_name", "label"]);
      if (!name) continue;
      const rawLevel = entry.level ?? entry.proficiency_level;
      const level = typeof rawLevel === "number" && rawLevel > 0 ? rawLevel : null;
      skills.push({ name, level });
    }
  }

  // De-duplicate case-insensitively, keeping the first occurrence.
  const seen = new Set<string>();
  return skills.filter((skill) => {
    const key = skill.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeIntakeProjects(intake: unknown): IntakeProject[] {
  if (!isRecord(intake) || !Array.isArray(intake.projects)) return [];

  return intake.projects
    .filter(isRecord)
    .map((project) => ({
      name: firstString(project, ["name", "title", "project_title_en", "project_title"]),
      description: firstString(project, ["description", "description_en", "summary"]),
      role: firstString(project, ["user_role", "role"]),
      isTeam: Boolean(project.is_team_project ?? project.isTeam),
      images: asStringArray(project.images).slice(0, 3),
      tags: [...asStringArray(project.skills), ...asStringArray(project.toolsUsed)].slice(0, 6),
    }))
    .filter((project) => project.name.length > 0);
}
