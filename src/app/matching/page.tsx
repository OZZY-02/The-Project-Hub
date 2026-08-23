"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "../../lib/i18n";
import { useTheme } from "../../lib/theme";
import {
  MapPin, Users, Sparkles, ArrowRight, CheckCircle2, Circle,
  BookmarkPlus, BookmarkCheck, Plus, X, Search, SlidersHorizontal,
  FolderKanban, Zap, ArrowLeft, Loader2,
  UserCircle2, Trash2, Image as ImageIcon, ChevronDown, ChevronUp,
} from "lucide-react";
import supabase from "../../lib/supabaseClient";
import { getProfileBuilderHref } from "../../lib/utils";
import { ensureDemoProjectsSeeded } from "../../lib/demo-projects";
import { normalizeIntakeSkills } from "../../lib/intake";
import { uploadProjectImages } from "../../lib/storage";

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

/* ── Avatar initials ─────────────────────────────────────────────────────── */
function Avatar({ name, type, isLight }: { name: string; type: MatchCard["type"]; isLight: boolean }) {
  const initials = name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const gradients = {
    mentor:  isLight ? "from-[#2258d1] to-[#3d95ff]" : "from-[#3d95ff] to-[#2258d1]",
    maker:   isLight ? "from-[#0891b2] to-[#06b6d4]" : "from-[#22d3ee] to-[#0891b2]",
    project: isLight ? "from-[#7c3aed] to-[#a78bfa]" : "from-[#a78bfa] to-[#7c3aed]",
  };
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white ${gradients[type]}`}>
      {type === "project" ? <FolderKanban size={18} /> : initials}
    </div>
  );
}

/* ── Tag chip ────────────────────────────────────────────────────────────── */
function Chip({ label, onRemove, isLight }: { label: string; onRemove?: () => void; isLight: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ${
      isLight ? "border-slate-900/10 bg-white text-slate-600" : "border-white/10 bg-white/5 text-[#c8d8f0]"
    }`}>
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}
          className={`flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full transition-colors ${
            isLight ? "text-slate-400 hover:bg-red-500 hover:text-white" : "text-[#6f7e9d] hover:bg-red-600 hover:text-white"
          }`}>
          <X size={9} />
        </button>
      )}
    </span>
  );
}

/* ── Inline filter input row ─────────────────────────────────────────────── */
function FilterInput({ value, onChange, onAdd, placeholder, listId, isLight }: {
  value: string; onChange: (v: string) => void; onAdd: () => void;
  placeholder: string; listId?: string; isLight: boolean;
}) {
  return (
    <div className="flex gap-2">
      <input
        list={listId}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
        placeholder={placeholder}
        className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition-all duration-150 ${
          isLight
            ? "border-slate-900/10 bg-white text-slate-900 placeholder-slate-400 focus:border-[#2258d1] focus:shadow-[0_0_0_3px_rgba(34,88,209,0.08)]"
            : "border-white/8 bg-white/4 text-[#f5f7fb] placeholder-[#6f7e9d] focus:border-[#8fb7ff]/40 focus:shadow-[0_0_0_3px_rgba(143,183,255,0.08)]"
        }`}
      />
      <button type="button" onClick={onAdd}
        className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors duration-150 ${
          isLight ? "bg-slate-950 text-white hover:bg-slate-700" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
        }`}>
        <Plus size={15} />
      </button>
    </div>
  );
}

/* ── Type badge ──────────────────────────────────────────────────────────── */
function TypeBadge({ type, postTypes, isLight, t }: {
  type: MatchCard["type"]; postTypes?: string[]; isLight: boolean;
  t: (key: string, fallback: string) => string;
}) {
  const configs = {
    mentor:  { label: t("matching.type_mentor", "Mentor"), cls: isLight ? "border-[#2258d1]/20 bg-[#2258d1]/8 text-[#2258d1]"   : "border-[#8fb7ff]/20 bg-[#8fb7ff]/8 text-[#8fb7ff]" },
    maker:   { label: t("matching.type_maker", "Maker"),   cls: isLight ? "border-cyan-500/20 bg-cyan-50 text-cyan-700"            : "border-cyan-400/20 bg-cyan-400/8 text-cyan-400" },
    project: { label: postTypes?.join(" + ") || t("matching.type_project", "Project"), cls: isLight ? "border-purple-500/20 bg-purple-50 text-purple-700" : "border-purple-400/20 bg-purple-400/8 text-purple-400" },
  };
  const { label, cls } = configs[type];
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}

export default function MatchingPage() {
  const { t, locale } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dir = locale === "ar" ? "rtl" : "ltr";

  /* ── State ── */
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
  const [cityCountryOptions, setCityCountryOptions] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<MatchCard["type"]>>(new Set(["project", "maker"]));
  const [intakeSkills, setIntakeSkills] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "project" | "maker">("project");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const savedStorageKey = "matching_saved_matches";
  const projectsStorageKey = "matching_project_posts";
  const filtersStorageKey = "matching_filters";

  /* ── Helpers ── */
  const formatLocation = (row: ProfileRow) => {
    const parts = [row.location_city, row.location_country].filter(Boolean);
    return parts.length ? parts.join(", ") : t("matching.location_unknown", "Location not set");
  };
  const buildTags = (row: ProfileRow) => {
    const tags: string[] = [];
    if (row.major_field) tags.push(row.major_field);
    if (row.passion_sector) tags.push(row.passion_sector);
    if (row.is_mentor) tags.push("Mentor-ready");
    return tags.slice(0, 3);
  };
  const loadSavedLocal = () => {
    try { const raw = localStorage.getItem(savedStorageKey); if (!raw) return new Set<string>(); return new Set((JSON.parse(raw) as MatchCard[]).map(m => m.id)); } catch { return new Set<string>(); }
  };
  const saveLocal = (items: MatchCard[]) => { try { localStorage.setItem(savedStorageKey, JSON.stringify(items)); } catch {} };
  const loadProjectsLocal = () => { try { const raw = localStorage.getItem(projectsStorageKey); return raw ? JSON.parse(raw) as MatchCard[] : []; } catch { return []; } };
  const persistProjectsLocal = (items: MatchCard[]) => { try { localStorage.setItem(projectsStorageKey, JSON.stringify(items)); } catch {} };

  /* ── Save/unsave ── */
  const handleSave = async (match: MatchCard) => {
    const next = new Set(savedIds);
    const isSaved = next.has(match.id);
    isSaved ? next.delete(match.id) : next.add(match.id);
    setSavedIds(next);
    const local: MatchCard[] = (() => { try { const r = localStorage.getItem(savedStorageKey); return r ? JSON.parse(r) : []; } catch { return []; } })();
    const merged = isSaved ? local.filter(m => m.id !== match.id) : [...local.filter(m => m.id !== match.id), match];
    saveLocal(merged);
    try {
      const { data: ud } = await supabase.auth.getUser();
      const user = ud?.user;
      if (!user) return;
      if (isSaved) await supabase.from("match_saves").delete().eq("user_id", user.id).eq("match_id", match.id);
      else await supabase.from("match_saves").insert({ user_id: user.id, match_id: match.id, match_type: match.type, data: match });
    } catch {}
  };

  /* ── Add/delete project ── */
  const resetProjectForm = () => {
    setProjectTitle(""); setProjectSubtitle(""); setProjectLocation(""); setProjectTags("");
    setProjectSkillInput(""); setProjectSkills([]); setProjectNeeded(3); setProjectJoined(0);
    setProjectImages([]); setProjectPostTypes(["Project"]); setEditingProjectId(null); setShowProjectForm(false);
  };

  const handleAddProject = async () => {
    if (!projectTitle.trim()) return;

    // Provisional id — replaced by the database id once the row is written, so
    // the local copy and the shared copy never show up as two separate cards.
    const localId = editingProjectId || `project-${Date.now()}`;
    const images = currentUserId
      ? await uploadProjectImages(currentUserId, localId, projectImages.slice(0, 3))
      : projectImages.slice(0, 3);

    const proj: MatchCard = {
      id: localId, title: projectTitle.trim(),
      subtitle: projectSubtitle.trim() || t("matching.project_subtitle_default", "Looking for collaborators."),
      location: projectLocation.trim() || (currentProfile ? formatLocation(currentProfile) : t("matching.location_unknown", "Location not set")),
      tags: [...projectSkills, ...projectTags.split(",").map(tag => tag.trim()).filter(Boolean)].slice(0, 6),
      type: "project", needed: projectNeeded, joined: projectJoined,
      images: images.slice(0, 3), ownerId: currentUserId || undefined,
      postTypes: projectPostTypes.length ? projectPostTypes : ["Project"],
    };

    const savedProject = await persistProjectToDb(proj);
    const local = loadProjectsLocal().filter(p => p.id !== localId && p.id !== savedProject.id);
    const merged = [savedProject, ...local];
    persistProjectsLocal(merged);
    setProjectMatches(merged);
    resetProjectForm();
  };

  /**
   * Write a project to Supabase and return it carrying the database id. Falls
   * back to the local-only card when the user is signed out or the write fails,
   * so posting never silently drops the project.
   */
  const persistProjectToDb = async (proj: MatchCard): Promise<MatchCard> => {
    if (!currentUserId) return proj;
    try {
      const payload = {
        user_id: currentUserId, title: proj.title, subtitle: proj.subtitle,
        location: proj.location, tags: proj.tags, needed: proj.needed,
        joined: proj.joined, images: proj.images, data: proj,
      };

      const isExistingRow = Boolean(editingProjectId) && !editingProjectId!.startsWith("project-");
      const { data, error } = isExistingRow
        ? await supabase.from("match_projects").update(payload).eq("id", editingProjectId!).select("id").single()
        : await supabase.from("match_projects").insert(payload).select("id").single();

      if (error || !data?.id) throw error ?? new Error("No id returned");
      return { ...proj, id: data.id, ownerId: currentUserId };
    } catch (error) {
      console.warn("Could not save project to Supabase, keeping it local only.", error);
      return proj;
    }
  };

  const handleDeleteProject = async (project: MatchCard) => {
    const local = loadProjectsLocal().filter(p => p.id !== project.id);
    persistProjectsLocal(local); setProjectMatches(local);
    if (!currentUserId || project.ownerId !== currentUserId) return;
    try {
      await supabase.from("match_projects").delete().eq("id", project.id);
    } catch (error) {
      console.warn("Could not delete project from Supabase.", error);
    }
  };

  /* ── Filters ── */
  const addFilterPlace = (v?: string) => { const val = (v ?? filterPlaceInput).trim(); if (!val) return; setFilterPlaces(p => Array.from(new Set([...p, val]))); setFilterPlaceInput(""); };
  const addFilterSkill = () => { if (!filterSkillsInput.trim()) return; setFilterSkillTags(p => Array.from(new Set([...p, filterSkillsInput.trim()]))); setFilterSkillsInput(""); };
  const addFilterFocus = () => { if (!filterFocusInput.trim()) return; setFilterFocusTags(p => Array.from(new Set([...p, filterFocusInput.trim()]))); setFilterFocusInput(""); };
  const clearFilters = () => { setFilterPlaces([]); setFilterSkillTags([]); setFilterFocusTags([]); setFilterPlaceInput(""); setFilterSkillsInput(""); setFilterFocusInput(""); setSelectedTypes(new Set(["project", "maker"])); setSearchQuery(""); setActiveTab("project"); try { localStorage.removeItem(filtersStorageKey); } catch {} };
  const addProjectSkill = () => { if (!projectSkillInput.trim()) return; setProjectSkills(p => Array.from(new Set([...p, projectSkillInput.trim()]))); setProjectSkillInput(""); };
  const handleProjectImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, Math.max(0, 3 - projectImages.length));
    const urls = await Promise.all(files.map(f => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); })));
    setProjectImages(p => [...p, ...urls]);
  };

  /* ── Load ── */
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      ensureDemoProjectsSeeded();
      setSavedIds(loadSavedLocal());
      setProjectMatches(loadProjectsLocal());
      try { const f = localStorage.getItem(filtersStorageKey); if (f && mounted) { const p = JSON.parse(f); setFilterPlaces(p.filterPlaces || []); setFilterSkillTags(p.filterSkillTags || []); setFilterFocusTags(p.filterFocusTags || []); setSelectedTypes(new Set(p.selectedTypes || ["project", "maker"])); } } catch {}
      try {
        const { data: ud } = await supabase.auth.getUser();
        const user = ud?.user;
        if (mounted) setCurrentUserId(user?.id || null);
        if (!user) {
          if (mounted) setProjectMatches(loadProjectsLocal());
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase.from("profiles").select("id, first_name, last_name, location_city, location_country, major_field, passion_sector, is_mentor, bio").eq("id", user.id).single();
        if (mounted) setCurrentProfile(profile || null);
        try {
          const { data: intakeRows } = await supabase.from("profile_intakes").select("data").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1);
          // Intake skills may be plain strings or { name, level } objects
          // depending on which builder wrote the row.
          const skills = normalizeIntakeSkills(intakeRows?.[0]?.data).map(s => s.name);
          if (mounted) { setIntakeSkills(skills); if (skills.length > 0 && filterSkillTags.length === 0) setFilterSkillTags(skills.slice(0, 5)); }
        } catch {}
        let query = supabase.from("profiles").select("id, first_name, last_name, location_city, location_country, major_field, passion_sector, is_mentor, bio").neq("id", user.id).limit(20);
        if (profile?.location_country) query = query.eq("location_country", profile.location_country);
        const { data: candidates } = await query;
        const mapped = ((candidates || []) as ProfileRow[])
          .filter(row => !row.is_mentor)
          .map(row => ({
          id: row.id,
          title: `${row.first_name || ""} ${row.last_name || ""}`.trim() || t("matching.unnamed", "Maker"),
          subtitle: row.bio || t("matching.no_bio", "Emerging maker profile"),
          location: formatLocation(row), tags: buildTags(row),
          type: "maker" as MatchCard["type"],
        }));
        if (mounted) setMatches(mapped);
        try {
          const { data: projectRows } = await supabase.from("match_projects").select("id, user_id, title, subtitle, location, tags, needed, joined, images, data").order("created_at", { ascending: false }).limit(20);
          const projects = (projectRows || []).map((row: any) => ({ id: row.id || `p-${Math.random()}`, ownerId: row.user_id, title: row.title || row.data?.title, subtitle: row.subtitle || row.data?.subtitle, location: row.location || row.data?.location, tags: row.tags || row.data?.tags || [], type: "project" as const, needed: row.needed ?? row.data?.needed, joined: row.joined ?? row.data?.joined, images: row.images ?? row.data?.images ?? [], postTypes: row.data?.postTypes || ["Project"] }));
          if (mounted) setProjectMatches(prev => [...projects, ...prev].filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i));
        } catch {}
      } catch { if (mounted) setMatches([]); }
      finally { if (mounted) setLoading(false); }
    };
    load();
    const onFocus = () => { if (mounted) load(); };
    window.addEventListener("focus", onFocus);
    return () => { mounted = false; window.removeEventListener("focus", onFocus); };
  }, [t]);

  useEffect(() => {
    try { localStorage.setItem(filtersStorageKey, JSON.stringify({ filterPlaces, filterSkillTags, filterFocusTags, selectedTypes: Array.from(selectedTypes) })); } catch {}
  }, [filterPlaces, filterSkillTags, filterFocusTags, selectedTypes]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try { const res = await fetch("/api/locations"); const json = await res.json(); if (mounted) setCountryOptions(json.countries || []); } catch { setCountryOptions([]); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!filterPlaceInput) { setCityCountryOptions([]); return; }
      const lower = filterPlaceInput.toLowerCase();
      const country = countryOptions.find(c => c.toLowerCase().startsWith(lower)) || countryOptions.find(c => c.toLowerCase().includes(lower)) || currentProfile?.location_country;
      if (!country) return;
      try { const res = await fetch(`/api/locations?country=${encodeURIComponent(country)}`); const json = await res.json(); if (mounted) setCityCountryOptions(Array.from(new Set<string>((json.cities || []).map((c: string) => `${c}, ${country}`)))); } catch {}
    })();
    return () => { mounted = false; };
  }, [filterPlaceInput, countryOptions, currentProfile]);

  /* ── Derived ── */
  const allMatches = useMemo(() => [...projectMatches, ...matches].filter(m => m.type !== "mentor"), [projectMatches, matches]);

  const filteredMatches = useMemo(() => {
    const types = activeTab === "all" ? selectedTypes : new Set([activeTab as MatchCard["type"]]);
    const skillNeedles = filterSkillTags.map(s => s.toLowerCase());
    const placeNeedles = filterPlaces.map(p => p.toLowerCase());
    const focusNeedles = filterFocusTags.map(f => f.toLowerCase());
    const q = searchQuery.toLowerCase();
    return allMatches.filter(m => {
      if (m.type === "project") {
        const postTypes = (m.postTypes || ["Project"]).filter(pt => pt !== "Mentor");
        if (!postTypes.length) return false;
        if (!types.has("project")) return false;
      } else {
        if (!types.has(m.type)) return false;
      }
      if (q && !`${m.title} ${m.subtitle} ${m.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      if (placeNeedles.length && !placeNeedles.some(p => m.location.toLowerCase().includes(p))) return false;
      if (focusNeedles.length && !focusNeedles.some(f => m.tags.join(" ").toLowerCase().includes(f))) return false;
      if (skillNeedles.length && !skillNeedles.some(s => m.tags.join(" ").toLowerCase().includes(s))) return false;
      return true;
    });
  }, [allMatches, filterPlaces, filterFocusTags, filterSkillTags, selectedTypes, activeTab, searchQuery]);

  const profileBuilderHref = getProfileBuilderHref(currentUserId, currentProfile);

  const counts = useMemo(() => ({
    all: allMatches.length,
    project: allMatches.filter(m => m.type === "project").length,
    maker: allMatches.filter(m => m.type === "maker").length,
  }), [allMatches]);

  const hasActiveFilters = filterPlaces.length > 0 || filterSkillTags.length > 0 || filterFocusTags.length > 0 || searchQuery.length > 0;

  /* ── Input classes ── */
  const inputCls = isLight
    ? "w-full rounded-xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-150 focus:border-[#2258d1] focus:shadow-[0_0_0_3px_rgba(34,88,209,0.08)]"
    : "w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-[#f5f7fb] placeholder-[#6f7e9d] outline-none transition-all duration-150 focus:border-[#8fb7ff]/40 focus:shadow-[0_0_0_3px_rgba(143,183,255,0.08)]";
  const labelCls = `mb-1.5 block text-xs font-semibold uppercase tracking-wider ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`;
  const cardCls = isLight ? "border-slate-900/8 bg-white shadow-sm" : "border-white/8 bg-white/3";
  const titleCls = isLight ? "text-slate-950" : "text-[#f5f7fb]";
  const mutedCls = isLight ? "text-slate-500" : "text-[#9eabc4]";
  const dimCls   = isLight ? "text-slate-400" : "text-[#6f7e9d]";

  /* ── Render ── */
  return (
    <div dir={dir} className={`home-shell min-h-screen ${isLight ? "home-shell-light text-slate-950" : "home-shell-dark text-[#f5f7fb]"}`}>
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">

        {/* Back button */}
        <Link href="/"
          className={`mb-6 inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
            isLight ? "border-slate-900/10 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900" : "border-white/8 bg-white/4 text-[#9eabc4] hover:border-white/15 hover:text-[#f5f7fb]"
          }`}>
          <ArrowLeft size={15} /> {t("matching.back_home", "Back to home")}
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>
            {t("matching.kicker", "Matching Hub")}
          </p>
          <h1 className={`mt-2 font-display text-2xl font-bold sm:text-3xl ${titleCls}`}>
            {t("matching.title", "Find projects and collaborators")}
          </h1>
          <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${mutedCls}`}>
            {t("matching.subtitle", "Discover projects that need your skills and connect with makers building alongside you.")}
          </p>

          {/* Badges + saved link */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {[t("matching.badge_1","Early access"), t("matching.badge_2","Arabic + English"), t("matching.badge_3","Free to join")].map(b => (
              <span key={b} className={`rounded-full border px-3 py-1 text-xs font-medium ${isLight ? "border-slate-900/10 bg-white text-slate-600" : "border-white/10 bg-white/5 text-[#9eabc4]"}`}>{b}</span>
            ))}
            <Link href="/matching/saved"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                isLight ? "border-[#2258d1]/20 bg-[#2258d1]/5 text-[#2258d1] hover:bg-[#2258d1]/10" : "border-[#8fb7ff]/20 bg-[#8fb7ff]/5 text-[#8fb7ff] hover:bg-[#8fb7ff]/10"
              }`}>
              <BookmarkCheck size={12} />
              {savedIds.size > 0
                ? t("matching.saved_count", "{count} saved").replace("{count}", String(savedIds.size))
                : t("matching.view_saved", "View Saved Matches")}
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── Left sidebar ── */}
          <aside className="w-full space-y-4 lg:w-[280px] lg:shrink-0">

            {/* Profile readiness */}
            <div className={`rounded-2xl border p-5 ${cardCls}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>
                {t("matching.readiness_title", "Profile readiness")}
              </p>
              <p className={`mt-1 text-xs ${dimCls}`}>{t("matching.readiness_subtitle", "Complete your profile to unlock stronger matches.")}</p>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: t("matching.readiness_1", "Skills added"), done: intakeSkills.length > 0 },
                  { label: t("matching.readiness_2", "Location set"), done: !!currentProfile?.location_city },
                  { label: t("matching.readiness_3", "Add projects to boost visibility"), done: projectMatches.filter(p => p.ownerId === currentUserId).length > 0 },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    {done
                      ? <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                      : <Circle size={15} className={`shrink-0 ${isLight ? "text-slate-200" : "text-white/10"}`} />}
                    <span className={`text-sm ${done ? titleCls : dimCls}`}>{label}</span>
                  </div>
                ))}
              </div>
              <Link href={profileBuilderHref}
                className={`mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                  isLight ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
                }`}>
                {t("matching.cta_complete", "Build Your Profile")} <ArrowRight size={15} />
              </Link>
            </div>

            {/* Filters panel */}
            <div className={`rounded-2xl border ${cardCls}`}>
              <button type="button" onClick={() => setShowFilters(o => !o)}
                className="flex w-full cursor-pointer items-center justify-between p-5 text-left">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={15} className={isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"} />
                  <p className={`text-sm font-semibold ${titleCls}`}>{t("matching.filters_title", "Filters")}</p>
                  {hasActiveFilters && (
                    <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${isLight ? "bg-[#2258d1] text-white" : "bg-[#8fb7ff] text-[#09111f]"}`}>
                      {filterPlaces.length + filterSkillTags.length + filterFocusTags.length + (searchQuery ? 1 : 0)}
                    </span>
                  )}
                </div>
                {showFilters ? <ChevronUp size={15} className={dimCls} /> : <ChevronDown size={15} className={dimCls} />}
              </button>

              {showFilters && (
                <div className={`space-y-5 border-t px-5 pb-5 pt-4 ${isLight ? "border-slate-900/6" : "border-white/6"}`}>
                  {/* Location */}
                  <div>
                    <label className={labelCls}>{t("matching.filter_location", "Location")}</label>
                    <FilterInput value={filterPlaceInput} onChange={setFilterPlaceInput} onAdd={() => addFilterPlace()} placeholder={t("matching.filter_location_placeholder", "City or country…")} listId="place-list" isLight={isLight} />
                    <datalist id="place-list">
                      {countryOptions.map(c => <option key={c} value={c} />)}
                      {cityCountryOptions.map(c => <option key={c} value={c} />)}
                    </datalist>
                    {filterPlaces.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{filterPlaces.map(p => <Chip key={p} label={p} onRemove={() => setFilterPlaces(prev => prev.filter(x => x !== p))} isLight={isLight} />)}</div>}
                  </div>

                  {/* Skills */}
                  <div>
                    <label className={labelCls}>{t("matching.filter_skills", "Skills")}</label>
                    {intakeSkills.length > 0 && !filterSkillTags.length && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {intakeSkills.slice(0, 4).map(s => (
                          <button key={s} type="button" onClick={() => setFilterSkillTags(prev => Array.from(new Set([...prev, s])))}
                            className={`rounded-full border px-2.5 py-1 text-xs transition-colors cursor-pointer ${isLight ? "border-slate-900/10 text-slate-500 hover:border-[#2258d1] hover:text-[#2258d1]" : "border-white/8 text-[#6f7e9d] hover:border-[#8fb7ff]/40 hover:text-[#8fb7ff]"}`}>
                            + {s}
                          </button>
                        ))}
                      </div>
                    )}
                    <FilterInput value={filterSkillsInput} onChange={setFilterSkillsInput} onAdd={addFilterSkill} placeholder={t("matching.filter_skills_placeholder", "React, Figma…")} isLight={isLight} />
                    {filterSkillTags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{filterSkillTags.map(s => <Chip key={s} label={s} onRemove={() => setFilterSkillTags(prev => prev.filter(x => x !== s))} isLight={isLight} />)}</div>}
                  </div>

                  {/* Focus */}
                  <div>
                    <label className={labelCls}>{t("matching.filter_focus", "Focus area")}</label>
                    <FilterInput value={filterFocusInput} onChange={setFilterFocusInput} onAdd={addFilterFocus} placeholder={t("matching.filter_focus_placeholder", "EdTech, HealthTech…")} isLight={isLight} />
                    {filterFocusTags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{filterFocusTags.map(f => <Chip key={f} label={f} onRemove={() => setFilterFocusTags(prev => prev.filter(x => x !== f))} isLight={isLight} />)}</div>}
                  </div>

                  {hasActiveFilters && (
                    <button type="button" onClick={clearFilters}
                      className={`w-full cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                        isLight ? "border-slate-900/10 text-slate-500 hover:border-slate-300" : "border-white/8 text-[#9eabc4] hover:border-white/15"
                      }`}>
                      {t("matching.clear_filters", "Clear all filters")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Discovery boosts */}
            <div className={`rounded-2xl border p-5 ${cardCls}`}>
              <div className="flex items-center gap-2">
                <Zap size={15} className={isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"} />
                <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>
                  {t("matching.discovery_title", "Discovery boosts")}
                </p>
              </div>
              <p className={`mt-2 text-xs leading-relaxed ${dimCls}`}>{t("matching.discovery_body", "Add 2+ projects and a resume to be featured in the spotlight feed.")}</p>
              <div className="mt-3 space-y-1.5">
                {[t("matching.discovery_tag_1","Portfolio spotlight"), t("matching.discovery_tag_2","Mentor recommendations"), t("matching.discovery_tag_3","Project invitations")].map(tag => (
                  <div key={tag} className={`flex items-center gap-2 text-xs ${mutedCls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isLight ? "bg-[#2258d1]" : "bg-[#8fb7ff]"}`} />
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="min-w-0 flex-1">

            {/* Search bar + Add project */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className={`relative flex-1`}>
                <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dimCls}`} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t("matching.search_placeholder", "Search by name, skill, or keyword…")}
                  className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-150 ${
                    isLight
                      ? "border-slate-900/10 bg-white text-slate-900 placeholder-slate-400 focus:border-[#2258d1] focus:shadow-[0_0_0_3px_rgba(34,88,209,0.08)]"
                      : "border-white/8 bg-white/4 text-[#f5f7fb] placeholder-[#6f7e9d] focus:border-[#8fb7ff]/40 focus:shadow-[0_0_0_3px_rgba(143,183,255,0.08)]"
                  }`}
                />
              </div>
              <button type="button" onClick={() => setShowProjectForm(true)}
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                  isLight ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
                }`}>
                <Plus size={15} /> {t("matching.add_project", "Post a project")}
              </button>
            </div>

            {/* Tabs */}
            <div className={`mb-4 flex gap-1 rounded-xl border p-1 ${isLight ? "border-slate-900/8 bg-slate-100/60" : "border-white/6 bg-white/3"}`}>
              {([
                { key: "all",     label: t("matching.tab_all", "All"),           icon: <Sparkles size={13} /> },
                { key: "project", label: t("matching.tab_projects", "Projects"), icon: <FolderKanban size={13} /> },
                { key: "maker",   label: t("matching.tab_makers", "Makers"),     icon: <UserCircle2 size={13} /> },
              ] as const).map(({ key, label, icon }) => (
                <button key={key} type="button" onClick={() => setActiveTab(key)}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                    activeTab === key
                      ? isLight ? "bg-white text-slate-950 shadow-sm" : "bg-white/10 text-[#f5f7fb]"
                      : isLight ? "text-slate-500 hover:text-slate-700" : "text-[#6f7e9d] hover:text-[#9eabc4]"
                  }`}>
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                  <span className={`rounded-full px-1.5 text-xs font-bold ${
                    activeTab === key
                      ? isLight ? "bg-slate-100 text-slate-600" : "bg-white/10 text-[#9eabc4]"
                      : isLight ? "text-slate-400" : "text-[#6f7e9d]"
                  }`}>{counts[key]}</span>
                </button>
              ))}
            </div>

            {/* Cards */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`rounded-2xl border p-5 ${cardCls}`}>
                    <div className="flex items-start gap-4">
                      <div className={`h-11 w-11 rounded-xl ${isLight ? "bg-slate-100" : "bg-white/6"}`} style={{ animation: "skeleton-shimmer 1.5s infinite linear", backgroundImage: isLight ? "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)" : "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%" }} />
                      <div className="flex-1 space-y-2">
                        <div className={`h-4 w-40 rounded-lg ${isLight ? "bg-slate-100" : "bg-white/6"}`} style={{ animation: "skeleton-shimmer 1.5s infinite linear", backgroundImage: isLight ? "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)" : "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%" }} />
                        <div className={`h-3 w-full rounded-lg ${isLight ? "bg-slate-100" : "bg-white/6"}`} style={{ animation: "skeleton-shimmer 1.5s infinite linear", backgroundImage: isLight ? "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)" : "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className={`rounded-2xl border p-10 text-center ${cardCls}`}>
                <Search size={32} className={`mx-auto mb-4 ${dimCls}`} />
                <p className={`font-semibold ${titleCls}`}>{t("matching.no_matches", "No matches yet.")}</p>
                <p className={`mt-2 text-sm ${dimCls}`}>{t("matching.filtered_hint", "Try clearing filters or switching tabs.")}</p>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters}
                    className={`mt-4 cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                      isLight ? "border-slate-900/10 text-slate-600 hover:border-slate-300" : "border-white/8 text-[#9eabc4] hover:border-white/15"
                    }`}>
                    {t("matching.clear_filters", "Clear all filters")}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMatches.map(match => (
                  <article key={match.id}
                    className={`group rounded-2xl border p-5 transition-all duration-200 ${
                      isLight ? "border-slate-900/8 bg-white shadow-sm hover:border-[#2258d1]/20 hover:shadow-md" : "border-white/8 bg-white/3 hover:border-[#8fb7ff]/20 hover:bg-white/5"
                    }`}>
                    <div className="flex items-start gap-4">
                      <Avatar name={match.title} type={match.type} isLight={isLight} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className={`truncate text-base font-semibold ${titleCls}`}>{match.title}</h3>
                            <p className={`mt-0.5 line-clamp-2 text-sm ${mutedCls}`}>{match.subtitle}</p>
                          </div>
                          <TypeBadge type={match.type} postTypes={match.postTypes} isLight={isLight} t={t} />
                        </div>

                        <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs ${dimCls}`}>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={13} className={isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"} />
                            {match.location}
                          </span>
                          {match.type === "project" && (
                            <span className="inline-flex items-center gap-1.5">
                              <Users size={13} className={isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"} />
                              {match.joined ?? 0}/{match.needed ?? 0} {t("matching.project_people", "people")}
                            </span>
                          )}
                        </div>

                        {match.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {match.tags.map(tag => <Chip key={tag} label={tag} isLight={isLight} />)}
                          </div>
                        )}

                        {match.images && match.images.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            {match.images.slice(0, 3).map(img => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={img} src={img} alt="" className={`h-16 w-16 rounded-xl object-cover border ${isLight ? "border-slate-900/8" : "border-white/8"}`} />
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button type="button"
                            className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-colors duration-150 ${
                              isLight ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
                            }`}>
                            {t("matching.cta_connect", "Connect")}
                          </button>
                          <button type="button" onClick={() => handleSave(match)}
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition-colors duration-150 ${
                              savedIds.has(match.id)
                                ? isLight ? "border-[#2258d1]/20 bg-[#2258d1]/5 text-[#2258d1]" : "border-[#8fb7ff]/20 bg-[#8fb7ff]/5 text-[#8fb7ff]"
                                : isLight ? "border-slate-900/10 text-slate-600 hover:border-slate-300" : "border-white/8 text-[#9eabc4] hover:border-white/15"
                            }`}>
                            {savedIds.has(match.id) ? <BookmarkCheck size={13} /> : <BookmarkPlus size={13} />}
                            {savedIds.has(match.id) ? t("matching.cta_saved", "Saved") : t("matching.cta_save", "Save")}
                          </button>
                          {match.type === "project" && currentUserId && match.ownerId === currentUserId && (
                            <>
                              <button type="button" onClick={() => { setEditingProjectId(match.id); setProjectTitle(match.title || ""); setProjectSubtitle(match.subtitle || ""); setProjectLocation(match.location || ""); setProjectSkills(match.tags || []); setProjectNeeded(match.needed || 3); setProjectJoined(match.joined || 0); setProjectImages(match.images || []); setProjectPostTypes(match.postTypes || ["Project"]); setShowProjectForm(true); }}
                                className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-medium transition-colors duration-150 ${isLight ? "border-slate-900/10 text-slate-600 hover:border-slate-300" : "border-white/8 text-[#9eabc4] hover:border-white/15"}`}>
                                {t("matching.project_edit", "Edit")}
                              </button>
                              <button type="button" onClick={() => handleDeleteProject(match)}
                                className="cursor-pointer rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2 text-xs font-medium text-red-500 transition-colors duration-150 hover:bg-red-500/15">
                                {t("matching.project_delete", "Delete")}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add project modal ── */}
      {showProjectForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border p-6 ${
            isLight ? "border-slate-900/8 bg-white shadow-2xl" : "border-white/10 bg-[#101318]"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-base font-bold ${titleCls}`}>{editingProjectId ? t("matching.project_form_edit_title", "Edit project") : t("matching.project_form_title", "Post a project")}</h3>
                <p className={`mt-0.5 text-xs ${dimCls}`}>{t("matching.project_form_subtitle", "Share a project so makers nearby can join.")}</p>
              </div>
              <button type="button" onClick={() => { setShowProjectForm(false); setEditingProjectId(null); }}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border transition-colors ${isLight ? "border-slate-900/10 text-slate-500 hover:bg-slate-100" : "border-white/8 text-[#9eabc4] hover:bg-white/6"}`}>
                <X size={15} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className={labelCls}>{t("matching.project_title_label", "Project title")} *</label>
                <input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder={t("matching.project_title_placeholder", "What are you building?")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t("matching.project_description_label", "Description")}</label>
                <textarea value={projectSubtitle} onChange={e => setProjectSubtitle(e.target.value)} placeholder={t("matching.project_subtitle_placeholder", "What's the problem you're solving?")} rows={3} className={`${inputCls} resize-none leading-relaxed`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t("matching.project_location_label", "Location")}</label>
                  <input list="place-list" value={projectLocation} onChange={e => setProjectLocation(e.target.value)} placeholder={t("matching.project_location_placeholder", "City, country")} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t("matching.project_needed_label", "People needed")}</label>
                  <input type="number" min={1} max={20} value={projectNeeded} onChange={e => setProjectNeeded(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>{t("matching.project_skills_label", "Skills needed")}</label>
                <div className="flex gap-2">
                  <input value={projectSkillInput} onChange={e => setProjectSkillInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addProjectSkill(); } }} placeholder={t("matching.project_skills_placeholder", "React, Python…")} className={inputCls} />
                  <button type="button" onClick={addProjectSkill} className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors ${isLight ? "bg-slate-950 text-white hover:bg-slate-700" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"}`}><Plus size={15} /></button>
                </div>
                {projectSkills.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{projectSkills.map(s => <Chip key={s} label={s} onRemove={() => setProjectSkills(p => p.filter(x => x !== s))} isLight={isLight} />)}</div>}
              </div>
              <div>
                <label className={labelCls}>{t("matching.project_images_label", "Project images")} ({projectImages.length}/3)</label>
                <div className="flex flex-wrap gap-2">
                  {projectImages.map(url => (
                    <div key={url} className={`group relative h-16 w-16 overflow-hidden rounded-xl border ${isLight ? "border-slate-900/8" : "border-white/8"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => setProjectImages(p => p.filter(u => u !== url))} className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"><X size={14} className="text-white" /></button>
                    </div>
                  ))}
                  {projectImages.length < 3 && (
                    <label className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors ${isLight ? "border-slate-200 text-slate-300 hover:border-[#2258d1] hover:text-[#2258d1]" : "border-white/10 text-[#6f7e9d] hover:border-[#8fb7ff]/30 hover:text-[#8fb7ff]"}`}>
                      <ImageIcon size={18} />
                      <input type="file" accept="image/*" multiple onChange={handleProjectImages} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={handleAddProject} disabled={!projectTitle.trim()}
                className={`flex-1 cursor-pointer rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isLight ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
                }`}>
                {editingProjectId ? t("matching.project_save", "Save changes") : t("matching.project_publish", "Publish")}
              </button>
              <button type="button" onClick={() => { setShowProjectForm(false); setEditingProjectId(null); }}
                className={`cursor-pointer rounded-xl border px-5 py-3 text-sm font-medium transition-colors duration-150 ${
                  isLight ? "border-slate-900/10 text-slate-600 hover:border-slate-300" : "border-white/8 text-[#9eabc4] hover:border-white/15"
                }`}>
                {t("matching.project_cancel", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
