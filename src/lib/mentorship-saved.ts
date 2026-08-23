import type { MentorCategoryKey, MentorProfile, MentorshipOffering } from "./mentorship-data";

/**
 * Saved mentors and programs, persisted per browser.
 *
 * This used to store bare id strings, which meant nothing could render a saved
 * item without re-fetching it — so there was no saved page at all. We now store
 * enough of each card to draw it offline.
 */

const STORAGE_KEY = "mentorship_saved";

export type SavedMentor = {
  kind: "mentor";
  id: string;
  name: string;
  bio: string;
  location: string;
  tags: string[];
  categories: MentorCategoryKey[];
};

export type SavedOffering = {
  kind: "offering";
  id: string;
  title: string;
  provider: string;
  url: string;
  category: MentorCategoryKey;
  recommendedBy: string;
  rating: number;
  review: string;
};

export type SavedItem = SavedMentor | SavedOffering;

export function toSavedMentor(mentor: MentorProfile): SavedMentor {
  return {
    kind: "mentor",
    id: mentor.id,
    name: mentor.name,
    bio: mentor.bio,
    location: mentor.location,
    tags: mentor.tags,
    categories: mentor.categories,
  };
}

export function toSavedOffering(offering: MentorshipOffering): SavedOffering {
  return {
    kind: "offering",
    id: offering.id,
    title: offering.title,
    provider: offering.provider,
    url: offering.url,
    category: offering.category,
    recommendedBy: offering.recommendedBy,
    rating: offering.rating,
    review: offering.review,
  };
}

export function loadSaved(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Legacy format was string[] of ids, which carries nothing renderable.
    return parsed.filter((item): item is SavedItem =>
      Boolean(item) && typeof item === "object" && "kind" in item && "id" in item
    );
  } catch {
    return [];
  }
}

function persist(items: SavedItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota or private mode — saving is a convenience, not critical */
  }
}

/** Add or remove an item, returning the new list. */
export function toggleSaved(item: SavedItem): SavedItem[] {
  const current = loadSaved();
  const exists = current.some((saved) => saved.id === item.id);
  const next = exists
    ? current.filter((saved) => saved.id !== item.id)
    : [item, ...current];
  persist(next);
  return next;
}

export function removeSaved(id: string): SavedItem[] {
  const next = loadSaved().filter((saved) => saved.id !== id);
  persist(next);
  return next;
}

export function savedIdSet(items: SavedItem[]): Set<string> {
  return new Set(items.map((item) => item.id));
}
