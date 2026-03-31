"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "../../lib/i18n";
import { MapPin, Users, Sparkles, ArrowRight, CheckCircle, BookmarkPlus, BookmarkCheck, Plus, X } from "lucide-react";
import supabase from "../../lib/supabaseClient";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  location_city: string | null;
  location_country: string | null;
  major_field: string | null;
  passion_sector: string | null;
  is_mentor: boolean | null;
  bio: string | null;
};

type MatchCard = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  tags: string[];
  type: "maker" | "mentor" | "project";
  needed?: number;
  joined?: number;
  images?: string[];
  ownerId?: string;
  postTypes?: Array<"Project" | "Mentor">;
  projectType?: string;
};

export default function MatchingPage() {
  const { t, locale } = useTranslation();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "text-right" : "text-left";
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<ProfileRow | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [projectMatches, setProjectMatches] = useState<MatchCard[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectSubtitle, setProjectSubtitle] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectTags, setProjectTags] = useState("");
  const [projectSkillInput, setProjectSkillInput] = useState("");
  const [projectSkills, setProjectSkills] = useState<string[]>([]);
  const [projectNeeded, setProjectNeeded] = useState(3);
  const [projectJoined, setProjectJoined] = useState(0);
  const [projectImages, setProjectImages] = useState<string[]>([]);
  const [projectPostTypes, setProjectPostTypes] = useState<Array<"Project" | "Mentor">>(["Project"]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [filterPlaceInput, setFilterPlaceInput] = useState("");
  const [filterPlaces, setFilterPlaces] = useState<string[]>([]);
  const [filterSkillsInput, setFilterSkillsInput] = useState("");
  const [filterSkillTags, setFilterSkillTags] = useState<string[]>([]);
  const [filterFocusInput, setFilterFocusInput] = useState("");
  const [filterFocusTags, setFilterFocusTags] = useState<string[]>([]);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [cityCountryOptions, setCityCountryOptions] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<MatchCard["type"]>>(new Set(["mentor", "project"]));
  const [intakeSkills, setIntakeSkills] = useState<string[]>([]);

  const savedStorageKey = "matching_saved_matches";
  const projectsStorageKey = "matching_project_posts";
  const filtersStorageKey = "matching_filters";
  const storageBucket = "match-projects";

  const formatLocation = (row: ProfileRow) => {
    const parts = [row.location_city, row.location_country].filter(Boolean);
    return parts.length ? parts.join(", ") : t("matching.location_unknown", "Location not set");
  };

  const buildTags = (row: ProfileRow) => {
    const tags = [];
    if (row.major_field) tags.push(row.major_field);
    if (row.passion_sector) tags.push(row.passion_sector);
    if (row.is_mentor) tags.push(t("matching.tag_mentor_ready", "Mentor-ready"));
    return tags.slice(0, 3);
  };

  const loadSavedLocal = () => {
    try {
      const raw = localStorage.getItem(savedStorageKey);
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw) as MatchCard[];
      return new Set(parsed.map((item) => item.id));
    } catch {
      return new Set<string>();
    }
  };

  const saveLocal = (items: MatchCard[]) => {
    try {
      localStorage.setItem(savedStorageKey, JSON.stringify(items));
    } catch (e) {}
  };

  const handleSave = async (match: MatchCard) => {
    const next = new Set(savedIds);
    const isSaved = next.has(match.id);
    if (isSaved) next.delete(match.id);
    else next.add(match.id);
    setSavedIds(next);

    const localItems: MatchCard[] = [];
    try {
      const raw = localStorage.getItem(savedStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as MatchCard[];
        localItems.push(...parsed);
      }
    } catch {}

    const merged = isSaved
      ? localItems.filter((m) => m.id !== match.id)
      : [...localItems.filter((m) => m.id !== match.id), match];
    saveLocal(merged);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user || null;
      if (!user) return;
      if (isSaved) {
        await supabase.from("match_saves").delete().eq("user_id", user.id).eq("match_id", match.id);
      } else {
        await supabase.from("match_saves").insert({
          user_id: user.id,
          match_id: match.id,
          match_type: match.type,
          data: match,
        });
      }
    } catch (e) {
      // fallback already saved locally
    }
  };

  const uploadDataUrlToStorage = async (path: string, dataUrl: string) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const { error } = await supabase.storage.from(storageBucket).upload(path, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: true,
      });
      if (error) throw error;
      const { data: publicData } = supabase.storage.from(storageBucket).getPublicUrl(path);
      return publicData?.publicUrl || null;
    } catch (err) {
      console.warn("Image upload failed", err);
      return null;
    }
  };

  const loadProjectsLocal = () => {
    try {
      const raw = localStorage.getItem(projectsStorageKey);
      if (!raw) return [];
      return JSON.parse(raw) as MatchCard[];
    } catch {
      return [];
    }
  };

  const persistProjectsLocal = (items: MatchCard[]) => {
    try {
      localStorage.setItem(projectsStorageKey, JSON.stringify(items));
    } catch {}
  };

  const handleAddProject = async () => {
    if (!projectTitle.trim()) return;
    const newProjectId = editingProjectId || `project-${Date.now()}`;
    let finalImages = projectImages.slice(0, 3);
    if (currentUserId) {
      const uploaded: string[] = [];
      for (const [idx, img] of finalImages.entries()) {
        if (img.startsWith("data:")) {
          const path = `projects/${currentUserId}/${newProjectId}-${idx}.jpg`;
          const url = await uploadDataUrlToStorage(path, img);
          if (url) uploaded.push(url);
        } else {
          uploaded.push(img);
        }
      }
      finalImages = uploaded.length ? uploaded : finalImages;
    }

    const newProject: MatchCard = {
      id: newProjectId,
      title: projectTitle.trim(),
      subtitle: projectSubtitle.trim() || t("matching.project_subtitle_default", "Looking for collaborators."),
      location: projectLocation.trim() || (currentProfile ? formatLocation(currentProfile) : t("matching.location_unknown", "Location not set")),
      tags: [
        ...projectSkills,
        ...projectTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      ].slice(0, 6),
      type: "project",
      needed: projectNeeded,
      joined: projectJoined,
      images: finalImages.slice(0, 3),
      ownerId: currentUserId || undefined,
      postTypes: projectPostTypes.length ? projectPostTypes : ["Project"],
    };

    const localProjects = loadProjectsLocal();
    const merged = [newProject, ...localProjects.filter((p) => p.id !== newProject.id)];
    persistProjectsLocal(merged);
    setProjectMatches(merged);

    setProjectTitle("");
    setProjectSubtitle("");
    setProjectLocation("");
    setProjectTags("");
    setProjectSkillInput("");
    setProjectSkills([]);
    setProjectNeeded(3);
    setProjectJoined(0);
    setProjectImages([]);
    setProjectPostTypes(["Project"]);
    setEditingProjectId(null);
    setShowProjectForm(false);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user || null;
      if (!user) return;
      const payload = {
        user_id: user.id,
        title: newProject.title,
        subtitle: newProject.subtitle,
        location: newProject.location,
        tags: newProject.tags,
        needed: newProject.needed,
        joined: newProject.joined,
        images: newProject.images,
        data: newProject,
      };
      if (editingProjectId) {
        await supabase.from("match_projects").update(payload).eq("id", editingProjectId);
      } else {
        await supabase.from("match_projects").insert(payload);
      }
    } catch (e) {
      // fallback already saved locally
    }
  };

  const handleDeleteProject = async (project: MatchCard) => {
    const localProjects = loadProjectsLocal().filter((p) => p.id !== project.id);
    persistProjectsLocal(localProjects);
    setProjectMatches(localProjects);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user || null;
      if (!user || project.ownerId !== user.id) return;
      await supabase.from("match_projects").delete().eq("id", project.id);
      if (project.images && project.images.length > 0) {
        const prefix = `projects/${user.id}/${project.id}`;
        const { data: list } = await supabase.storage.from(storageBucket).list(`projects/${user.id}`);
        const files = (list || []).filter((f) => f.name.startsWith(project.id));
        if (files.length > 0) {
          await supabase.storage.from(storageBucket).remove(files.map((f) => `projects/${user.id}/${f.name}`));
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const addFilterSkill = () => {
    const value = filterSkillsInput.trim();
    if (!value) return;
    setFilterSkillTags((prev) => Array.from(new Set([...prev, value])));
    setFilterSkillsInput("");
  };

  const removeFilterSkill = (skill: string) => {
    setFilterSkillTags((prev) => prev.filter((s) => s !== skill));
  };

  const addFilterPlace = (value?: string) => {
    const v = (value ?? filterPlaceInput).trim();
    if (!v) return;
    setFilterPlaces((prev) => Array.from(new Set([...prev, v])));
    setFilterPlaceInput("");
  };

  const removeFilterPlace = (place: string) => {
    setFilterPlaces((prev) => prev.filter((p) => p !== place));
  };

  const addFilterFocus = () => {
    const value = filterFocusInput.trim();
    if (!value) return;
    setFilterFocusTags((prev) => Array.from(new Set([...prev, value])));
    setFilterFocusInput("");
  };

  const clearFilters = () => {
    setFilterPlaces([]);
    setFilterSkillTags([]);
    setFilterFocusTags([]);
    setFilterPlaceInput("");
    setFilterSkillsInput("");
    setFilterFocusInput("");
    setSelectedTypes(new Set(["mentor", "project"]));
    try {
      localStorage.removeItem(filtersStorageKey);
    } catch {}
  };

  const addProjectSkill = () => {
    const value = projectSkillInput.trim();
    if (!value) return;
    setProjectSkills((prev) => Array.from(new Set([...prev, value])));
    setProjectSkillInput("");
  };

  const removeProjectSkill = (value: string) => {
    setProjectSkills((prev) => prev.filter((s) => s !== value));
  };

  const handleProjectImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const allowed = Math.max(0, 3 - projectImages.length);
    const toAdd = files.slice(0, allowed);
    const dataUrls = await Promise.all(
      toAdd.map(
        (file) =>
          new Promise<string | null>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
          })
      )
    );
    setProjectImages((prev) => [...prev, ...dataUrls.filter(Boolean) as string[]]);
  };

  const removeProjectImage = (url: string) => {
    setProjectImages((prev) => prev.filter((img) => img !== url));
  };

  const removeFilterFocus = (value: string) => {
    setFilterFocusTags((prev) => prev.filter((f) => f !== value));
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      console.time('matching.load');
      const savedLocal = loadSavedLocal();
      if (mounted) setSavedIds(savedLocal);
      const localProjects = loadProjectsLocal();
      if (mounted) setProjectMatches(localProjects);
      try {
        const rawFilters = localStorage.getItem(filtersStorageKey);
        if (rawFilters && mounted) {
          const parsed = JSON.parse(rawFilters);
          setFilterPlaces(parsed.filterPlaces || []);
          setFilterSkillTags(parsed.filterSkillTags || []);
          setFilterFocusTags(parsed.filterFocusTags || []);
          setSelectedTypes(new Set(parsed.selectedTypes || ["mentor", "project"]));
        }
      } catch {}

      try {
      console.time('matching.supabase.getUser');
      const { data: userData } = await supabase.auth.getUser();
      console.timeEnd('matching.supabase.getUser');
      const user = userData?.user || null;
        if (mounted) setCurrentUserId(user?.id || null);
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, location_city, location_country, major_field, passion_sector, is_mentor, bio")
          .eq("id", user.id)
          .single();

        if (mounted) setCurrentProfile(profile || null);
        if (profile && mounted) {
          const locationLabel = formatLocation(profile);
          if (locationLabel && filterPlaces.length === 0) setFilterPlaces([locationLabel]);
          if (profile.passion_sector && filterFocusTags.length === 0) setFilterFocusTags([profile.passion_sector]);
        }

        try {
          console.time('matching.profile_intakes_query');
          const { data: intakeRows } = await supabase
            .from("profile_intakes")
            .select("data")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1);
          console.timeEnd('matching.profile_intakes_query');
          const intake = intakeRows && intakeRows.length > 0 ? intakeRows[0].data : null;
          const skills = intake?.skills || [];
          if (mounted) setIntakeSkills(skills);
          if (skills.length > 0 && filterSkillTags.length === 0 && mounted) {
            setFilterSkillTags(skills.slice(0, 5));
          }
        } catch (err) {
          console.warn('Failed to load profile_intakes in matching page', err);
        }

        let query = supabase
          .from("profiles")
          .select("id, first_name, last_name, location_city, location_country, major_field, passion_sector, is_mentor, bio")
          .neq("id", user.id)
          .limit(20);

        if (profile?.location_country) {
          query = query.eq("location_country", profile.location_country);
        }

        const { data: candidates } = await query;
        const rows = (candidates || []) as ProfileRow[];

        const mapped = rows.map((row) => ({
          id: row.id,
          title: `${row.first_name || ""} ${row.last_name || ""}`.trim() || t("matching.unnamed", "Maker"),
          subtitle: row.bio || t("matching.no_bio", "Emerging maker profile"),
          location: formatLocation(row),
          tags: buildTags(row),
          type: row.is_mentor ? "mentor" : "maker",
        }));

        if (mounted) setMatches(mapped);

        try {
          const { data: projectRows } = await supabase
            .from("match_projects")
            .select("id, user_id, title, subtitle, location, tags, needed, joined, images, data")
            .order("created_at", { ascending: false })
            .limit(20);
          const projects = (projectRows || []).map((row: any) => ({
            id: row.id || row.data?.id || `project-${Math.random()}`,
            ownerId: row.user_id || row.data?.ownerId,
            title: row.title || row.data?.title,
            subtitle: row.subtitle || row.data?.subtitle,
            location: row.location || row.data?.location,
            tags: row.tags || row.data?.tags || [],
            type: "project" as const,
            needed: row.needed ?? row.data?.needed,
            joined: row.joined ?? row.data?.joined,
            images: row.images ?? row.data?.images ?? [],
            postTypes: row.data?.postTypes || row.postTypes || ["Project"],
          }));
          if (mounted) setProjectMatches((prev) => {
            const merged = [...projects, ...prev].filter((item, index, arr) => arr.findIndex((m) => m.id === item.id) === index);
            return merged;
          });
        } catch {}
      } catch (e) {
        if (mounted) setMatches([]);
      } finally {
        if (mounted) setLoading(false);
        console.timeEnd('matching.load');
      }
    };

    load();
    const onFocus = () => {
      if (!mounted) return;
      load();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [t]);

  useEffect(() => {
    try {
      const payload = {
        filterPlaces,
        filterSkillTags,
        filterFocusTags,
        selectedTypes: Array.from(selectedTypes),
      };
      localStorage.setItem(filtersStorageKey, JSON.stringify(payload));
    } catch {}
  }, [filterPlaces, filterSkillTags, filterFocusTags, selectedTypes]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/locations");
        const json = await res.json();
        if (!mounted) return;
        const names: string[] = json.countries || [];
        setCountryOptions(names);
      } catch (err) {
        setCountryOptions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!filterPlaceInput) {
        setCityOptions([]);
        setCityCountryOptions([]);
        return;
      }
      const lower = filterPlaceInput.toLowerCase();
      const matchedCountry = countryOptions.find((c) => c.toLowerCase().startsWith(lower)) ||
        countryOptions.find((c) => c.toLowerCase().includes(lower));
      const fallbackCountry = currentProfile?.location_country || null;
      const maybeCountry = matchedCountry || fallbackCountry;
      if (!maybeCountry) {
        setCityOptions([]);
        setCityCountryOptions([]);
        return;
      }
      try {
        const res = await fetch(`/api/locations?country=${encodeURIComponent(maybeCountry)}`);
        const json = await res.json();
        if (!mounted) return;
        const list: string[] = Array.from(new Set(json.cities || []));
        setCityOptions(list);
        setCityCountryOptions(Array.from(new Set(list.map((city) => `${city}, ${maybeCountry}`))));
      } catch {
        setCityOptions([]);
        setCityCountryOptions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [filterPlaceInput, countryOptions, currentProfile]);

  const allMatches = useMemo(() => [...projectMatches, ...matches], [projectMatches, matches]);
  const filteredMatches = useMemo(() => {
    const types = selectedTypes;
    const skillNeedles = filterSkillTags.map((s) => s.toLowerCase());
    const placeNeedles = filterPlaces.map((p) => p.toLowerCase());
    const focusNeedles = filterFocusTags.map((f) => f.toLowerCase());
    return allMatches.filter((m) => {
      if (m.type === "project") {
        const postTypes = m.postTypes || ["Project"];
        const wantsProject = types.has("project");
        const wantsMentor = types.has("mentor");
        if (!wantsProject && !wantsMentor) return false;
        if (!postTypes.some((pt) => (pt === "Project" && wantsProject) || (pt === "Mentor" && wantsMentor))) return false;
      } else {
        if (!types.has(m.type)) return false;
      }
      if (placeNeedles.length > 0) {
        const loc = m.location.toLowerCase();
        if (!placeNeedles.some((p) => loc.includes(p))) return false;
      }
      if (focusNeedles.length > 0) {
        const tags = m.tags.join(" ").toLowerCase();
        if (!focusNeedles.some((f) => tags.includes(f))) return false;
      }
      if (skillNeedles.length > 0) {
        const hay = m.tags.join(" ").toLowerCase();
        if (!skillNeedles.some((s) => hay.includes(s))) return false;
      }
      return true;
    });
  }, [allMatches, filterPlaces, filterFocusTags, filterSkillTags, selectedTypes]);

  return (
    <div
      dir={dir}
      className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#223a34_0%,transparent_45%),linear-gradient(180deg,#0b1413_0%,#0f1c1a_50%,#141a17_100%)] text-[#f4efe6]"
    >
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className={`rounded-[28px] border border-[#2e403a] bg-gradient-to-br from-[#0f2a25] via-[#132f2a] to-[#0c1c19] p-8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.8)] ${align}`}>
          <p className="text-xs uppercase tracking-[0.35em] text-[#d9b88c]">{t("matching.kicker", "Matching Hub")}</p>
          <h1 className="font-display mt-4 text-3xl text-[#f7f1e7] sm:text-4xl">{t("matching.title", "Find your team, mentors, and projects")}</h1>
          <p className="mt-3 text-sm text-[#cfc8be]">{t("matching.subtitle", "Based on your location, skills, and passion, we recommend makers and projects built for the pilot cohort in Egypt.")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-[#3b4b44] bg-[#172421] px-4 py-2 text-xs text-[#e8dcc5]">{t("matching.badge_1", "Pilot: 100 makers")}</span>
            <span className="rounded-full border border-[#3b4b44] bg-[#172421] px-4 py-2 text-xs text-[#e8dcc5]">{t("matching.badge_2", "Arabic + English")}</span>
            <span className="rounded-full border border-[#3b4b44] bg-[#172421] px-4 py-2 text-xs text-[#e8dcc5]">{t("matching.badge_3", "Cairo + Alexandria")}</span>
          </div>
          {savedIds.size > 0 && (
            <div className="mt-6">
              <a
                href="/matching/saved"
                className="inline-flex items-center gap-2 rounded-full border border-[#2e403a] bg-[#111f1c] px-4 py-2 text-xs text-[#e8dcc5] hover:border-[#3a4a44] hover:text-[#f0d6a8]"
              >
                <BookmarkCheck size={14} />
                {t("matching.saved_title", "Your saved matches")}
              </a>
            </div>
          )}
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-[#2e403a] bg-[#111f1c]/90 p-6">
              <h2 className={`text-lg font-semibold text-[#f7f1e7] ${align}`}>{t("matching.filters_title", "Your matching filters")}</h2>
              <p className={`mt-2 text-xs text-[#9ca3af] ${align}`}>{t("matching.filters_subtitle", "These will adapt as your profile grows.")}</p>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#bda985]">{t("matching.filter_location", "Location")}</p>
                  {currentProfile ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                        {formatLocation(currentProfile)}
                      </span>
                    </div>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <input
                      list="place-list"
                      value={filterPlaceInput}
                      onChange={(e) => setFilterPlaceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFilterPlace();
                        }
                      }}
                      placeholder={t("matching.filter_location_placeholder", "Filter by city or country")}
                      className="w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-sm text-[#f7f1e7] placeholder:text-[#8b8a86]"
                    />
                    <button
                      type="button"
                      onClick={() => addFilterPlace()}
                      className="rounded-full bg-[#007a3d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b8d49]"
                    >
                      {t("matching.filter_add_location", "Add")}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {filterPlaces.map((place) => (
                      <span
                        key={place}
                        className="group inline-flex items-center gap-2 rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]"
                      >
                        {place}
                        <button
                          type="button"
                          onClick={() => removeFilterPlace(place)}
                          className="opacity-0 transition group-hover:opacity-100 text-[#f0a37f]"
                          aria-label={t("matching.filter_remove_location", "Remove")}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <datalist id="place-list">
                    {countryOptions.map((c) => (
                      <option key={`country-${c}`} value={c} />
                    ))}
                    {cityCountryOptions.map((c, idx) => (
                      <option key={`city-${c}-${idx}`} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#bda985]">{t("matching.filter_skills", "Core skills")}</p>
                  {intakeSkills.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {intakeSkills.slice(0, 5).map((skill) => (
                        <span key={skill} className="rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <input
                      value={filterSkillsInput}
                      onChange={(e) => setFilterSkillsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFilterSkill();
                        }
                      }}
                      placeholder={t("matching.filter_skills_placeholder", "Filter by skills")}
                      className="w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-sm text-[#f7f1e7] placeholder:text-[#8b8a86]"
                    />
                    <button
                      type="button"
                      onClick={addFilterSkill}
                      className="rounded-full bg-[#007a3d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b8d49]"
                    >
                      {t("matching.filter_add_skill", "Add")}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {filterSkillTags.map((skill) => (
                      <span
                        key={skill}
                        className="group inline-flex items-center gap-2 rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeFilterSkill(skill)}
                          className="opacity-0 transition group-hover:opacity-100 text-[#f0a37f]"
                          aria-label={t("matching.filter_remove_skill", "Remove")}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#bda985]">{t("matching.filter_focus", "Focus")}</p>
                  {currentProfile?.passion_sector ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                        {currentProfile.passion_sector}
                      </span>
                    </div>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <input
                      value={filterFocusInput}
                      onChange={(e) => setFilterFocusInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFilterFocus();
                        }
                      }}
                      placeholder={t("matching.filter_focus_placeholder", "Filter by focus area")}
                      className="w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-sm text-[#f7f1e7] placeholder:text-[#8b8a86]"
                    />
                    <button
                      type="button"
                      onClick={addFilterFocus}
                      className="rounded-full bg-[#007a3d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b8d49]"
                    >
                      {t("matching.filter_add_focus", "Add")}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {filterFocusTags.map((focus) => (
                      <span
                        key={focus}
                        className="group inline-flex items-center gap-2 rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]"
                      >
                        {focus}
                        <button
                          type="button"
                          onClick={() => removeFilterFocus(focus)}
                          className="opacity-0 transition group-hover:opacity-100 text-[#f0a37f]"
                          aria-label={t("matching.filter_remove_focus", "Remove")}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#bda985]">{t("matching.filter_type", "Type")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["mentor", "project"] as MatchCard["type"][]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const next = new Set(selectedTypes);
                          if (next.has(type)) next.delete(type);
                          else next.add(type);
                          setSelectedTypes(next);
                        }}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                          selectedTypes.has(type)
                            ? "border-[#ce1126] bg-[#2a1916] text-[#f7f1e7]"
                            : "border-[#2e403a] bg-[#172421] text-[#e8dcc5]"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${selectedTypes.has(type) ? "bg-[#ce1126]" : "bg-[#2e403a]"}`} />
                        {type === "maker" && t("matching.type_maker", "Maker")}
                        {type === "mentor" && t("matching.type_mentor", "Mentor")}
                        {type === "project" && t("matching.type_project", "Project")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#2e403a] bg-[#111f1c]/90 p-6">
              <h3 className={`text-lg font-semibold text-[#f7f1e7] ${align}`}>{t("matching.readiness_title", "Profile readiness")}</h3>
              <p className={`mt-2 text-xs text-[#9ca3af] ${align}`}>{t("matching.readiness_subtitle", "Complete your intake to unlock stronger matches.")}</p>
              <div className="mt-4 space-y-2 text-sm text-[#e8dcc5]">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#007a3d]" /> {t("matching.readiness_1", "Skills added")}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#007a3d]" /> {t("matching.readiness_2", "Location set")}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#d9b88c]" /> {t("matching.readiness_3", "Add projects to boost visibility")}
                </div>
              </div>
              <a href="/profile/mock-id-123" className="mt-4 inline-flex items-center rounded-full bg-[#ce1126] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e32636]">
                {t("matching.cta_complete", "Complete Intake")}
                <ArrowRight size={16} className="ml-2" />
              </a>
            </div>
          </aside>

          <section className="lg:col-span-8">
            <div className="rounded-2xl border border-[#2e403a] bg-[#111f1c]/90 p-6">
              <div className={`flex flex-col gap-2 ${align}`}>
                <h2 className="font-display text-2xl text-[#f7f1e7]">{t("matching.recommended_title", "Recommended for you")}</h2>
                <p className="text-sm text-[#cfc8be]">{t("matching.recommended_subtitle", "We prioritize local collaboration and pilot partners first.")}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#007a3d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b8d49]"
                >
                  <Plus size={14} />
                  {t("matching.add_project", "Add project")}
                </button>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-full border border-[#2e403a] px-4 py-2 text-xs text-[#e8dcc5] hover:border-[#3a4a44] hover:text-[#f0d6a8]"
                >
                  {t("matching.clear_filters", "Clear filters")}
                </button>
                {savedIds.size > 0 && (
                  <a
                    href="/matching/saved"
                    className="inline-flex items-center gap-2 rounded-full border border-[#2e403a] px-4 py-2 text-xs text-[#e8dcc5] hover:border-[#3a4a44] hover:text-[#f0d6a8]"
                  >
                    <BookmarkCheck size={14} />
                    {t("matching.saved_title", "Your saved matches")}
                  </a>
                )}
              </div>

              {loading ? (
                <div className="mt-6 text-sm text-[#cfc8be]">{t("matching.loading", "Loading matches...")}</div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {filteredMatches.length === 0 && (
                    <div className="rounded-2xl border border-[#2e403a] bg-[#0f1a17] p-5 text-sm text-[#cfc8be]">
                      {t("matching.no_matches", "No matches yet. Update your profile to unlock more recommendations.")}
                      <div className="mt-3 text-xs text-[#9ca3af]">
                        {t("matching.filtered_hint", "Try clearing filters or selecting Project in the type filter.")}
                      </div>
                    </div>
                  )}
                  {filteredMatches.map((match) => (
                  <div key={match.id} className="rounded-2xl border border-[#2e403a] bg-[#0f1a17] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[#f7f1e7]">{match.title}</h3>
                        <p className="mt-1 text-sm text-[#cfc8be]">{match.subtitle}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                        {match.type === "project" && (match.postTypes || ["Project"]).join(" + ")}
                        {match.type === "mentor" && t("matching.type_mentor", "Mentor")}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#9ca3af]">
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={14} className="text-[#d9b88c]" />
                        {match.location}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Users size={14} className="text-[#d9b88c]" />
                        {t("matching.match_strength", "High match")}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {match.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {match.type === "project" && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#9ca3af]">
                        <span className="inline-flex items-center gap-2">
                          <Users size={14} className="text-[#d9b88c]" />
                          {t("matching.project_people", "People")}: {match.joined ?? 0}/{match.needed ?? 0}
                        </span>
                      </div>
                    )}
                    {match.type === "project" && match.images && match.images.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {match.images.slice(0, 3).map((img) => (
                          <img
                            key={img}
                            src={img}
                            alt="project"
                            className="h-16 w-16 rounded-xl object-cover border border-[#2e403a]"
                          />
                        ))}
                      </div>
                    )}
                    {match.type === "project" && match.postTypes && (
                      <div className="mt-2 text-xs text-[#d9b88c]">
                        {t("matching.post_type_label", "Post type")}: {match.postTypes.join(" + ")}
                      </div>
                    )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="rounded-full bg-[#007a3d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b8d49]">
                      {t("matching.cta_connect", "Connect")}
                    </button>
                    <button
                      onClick={() => handleSave(match)}
                      className="rounded-full border border-[#2e403a] px-4 py-2 text-xs text-[#e8dcc5] hover:border-[#3a4a44] hover:text-[#f0d6a8] inline-flex items-center gap-2"
                    >
                      {savedIds.has(match.id) ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
                      {savedIds.has(match.id) ? t("matching.cta_saved", "Saved") : t("matching.cta_save", "Save for later")}
                    </button>
                    {match.type === "project" && currentUserId && match.ownerId === currentUserId && (
                      <button
                        onClick={() => {
                          setEditingProjectId(match.id);
                          setProjectTitle(match.title || "");
                          setProjectSubtitle(match.subtitle || "");
                          setProjectLocation(match.location || "");
                          setProjectSkills(match.tags || []);
                          setProjectTags("");
                          setProjectNeeded(match.needed || 3);
                          setProjectJoined(match.joined || 0);
                          setProjectImages(match.images || []);
                          setProjectPostTypes(match.postTypes || ["Project"]);
                          setShowProjectForm(true);
                        }}
                        className="rounded-full border border-[#2e403a] px-4 py-2 text-xs text-[#e8dcc5] hover:border-[#3a4a44] hover:text-[#f0d6a8]"
                      >
                        {t("matching.project_edit", "Edit")}
                      </button>
                    )}
                    {match.type === "project" && currentUserId && match.ownerId === currentUserId && (
                      <button
                        onClick={() => handleDeleteProject(match)}
                        className="rounded-full bg-[#ce1126] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e32636]"
                      >
                        {t("matching.project_delete", "Delete")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-[#2e403a] bg-[#111f1c]/90 p-6">
              <div className="flex items-center gap-3 text-[#d9b88c]">
                <Sparkles size={20} />
                <h3 className="text-lg font-semibold">{t("matching.discovery_title", "Discovery boosts")}</h3>
              </div>
              <p className={`mt-3 text-sm text-[#cfc8be] ${align}`}>{t("matching.discovery_body", "Add 2+ projects and a resume to be featured in the pilot spotlight feed.")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">{t("matching.discovery_tag_1", "Portfolio spotlight")}</span>
                <span className="rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">{t("matching.discovery_tag_2", "Mentor recommendations")}</span>
                <span className="rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">{t("matching.discovery_tag_3", "Project invitations")}</span>
              </div>
            </div>
          </section>
        </section>
        {showProjectForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
            <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-[#2e403a] bg-[#111f1c] p-6 text-[#f4efe6]">
              <h3 className="text-lg font-semibold">{t("matching.project_form_title", "Add a project")}</h3>
              <p className="mt-2 text-xs text-[#9ca3af]">{t("matching.project_form_subtitle", "Share a project so makers nearby can join.")}</p>
              <div className="mt-5 grid gap-4">
                <input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder={t("matching.project_title_placeholder", "Project title")}
                  className="w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-sm text-[#f7f1e7] placeholder:text-[#8b8a86]"
                />
                <textarea
                  value={projectSubtitle}
                  onChange={(e) => setProjectSubtitle(e.target.value)}
                  placeholder={t("matching.project_subtitle_placeholder", "Short description")}
                  className="h-24 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-sm text-[#f7f1e7] placeholder:text-[#8b8a86]"
                />
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-[#bda985]">
                    {t("matching.project_location_label", "Location")}
                  </label>
                  <input
                    list="place-list"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    placeholder={t("matching.project_location_placeholder", "Location")}
                    className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-sm text-[#f7f1e7] placeholder:text-[#8b8a86]"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-[#bda985]">
                    {t("matching.post_type_label", "Post type")}
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["Project", "Mentor"] as Array<"Project" | "Mentor">).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setProjectPostTypes((prev) => {
                            const next = new Set(prev);
                            if (next.has(type)) next.delete(type);
                            else next.add(type);
                            return Array.from(next);
                          });
                        }}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                          projectPostTypes.includes(type)
                            ? "border-[#ce1126] bg-[#2a1916] text-[#f7f1e7]"
                            : "border-[#2e403a] bg-[#172421] text-[#e8dcc5]"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${projectPostTypes.includes(type) ? "bg-[#ce1126]" : "bg-[#2e403a]"}`} />
                        {type === "Project" ? t("matching.post_type_project", "Project") : t("matching.post_type_mentor", "Mentor")}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-[#bda985]">
                    {t("matching.project_skills_label", "Looking for skills")}
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={projectSkillInput}
                      onChange={(e) => setProjectSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addProjectSkill();
                        }
                      }}
                      placeholder={t("matching.project_skills_placeholder", "Add skill")}
                      className="w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-sm text-[#f7f1e7] placeholder:text-[#8b8a86]"
                    />
                    <button
                      type="button"
                      onClick={addProjectSkill}
                      className="rounded-full bg-[#007a3d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b8d49]"
                    >
                      {t("matching.project_add_skill", "Add")}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {projectSkills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-2 rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeProjectSkill(skill)}
                          className="text-[#f0a37f]"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-[#bda985]">
                    {t("matching.project_tags_label", "Tags")}
                  </label>
                  <input
                    value={projectTags}
                    onChange={(e) => setProjectTags(e.target.value)}
                    placeholder={t("matching.project_tags_placeholder", "Tags (comma-separated)")}
                    className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-sm text-[#f7f1e7] placeholder:text-[#8b8a86]"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.25em] text-[#bda985]">
                      {t("matching.project_needed_label", "People needed")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={projectNeeded}
                      onChange={(e) => setProjectNeeded(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-sm text-[#f7f1e7]"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.25em] text-[#bda985]">
                      {t("matching.project_joined_label", "People joined")}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={projectNeeded}
                      value={projectJoined}
                      onChange={(e) => setProjectJoined(Number(e.target.value))}
                      className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-sm text-[#f7f1e7]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-[#bda985]">
                    {t("matching.project_images_label", "Project images (up to 3)")}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleProjectImages}
                    className="mt-2 text-sm text-[#cfc8be]"
                  />
                  <div className="mt-3 flex flex-wrap gap-3">
                    {projectImages.map((img) => (
                      <div key={img} className="relative h-20 w-20 overflow-hidden rounded-xl border border-[#2e403a]">
                        <img src={img} alt="project" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeProjectImage(img)}
                          className="absolute right-1 top-1 rounded-full bg-[#0b1413]/80 px-2 text-xs text-[#f0a37f]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowProjectForm(false)}
                  className="rounded-full border border-[#2e403a] px-4 py-2 text-xs text-[#e8dcc5] hover:border-[#3a4a44] hover:text-[#f0d6a8]"
                >
                  {t("matching.project_cancel", "Cancel")}
                </button>
                <button
                  onClick={handleAddProject}
                  className="rounded-full bg-[#ce1126] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e32636]"
                >
                  {t("matching.project_publish", "Publish")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
