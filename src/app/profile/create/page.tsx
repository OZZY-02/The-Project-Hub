"use client";

import React, { useEffect, useRef, useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Camera, Check, Loader2, MapPin,
  Plus, Star, Trash2, User, X,
} from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { useTheme } from "@/lib/theme";
import { useTranslation } from "@/lib/i18n";
import { uploadAvatar, uploadProjectImages } from "@/lib/storage";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAJOR_OPTIONS = [
  "Software Engineering", "Computer Science", "Data Science", "Product Management",
  "Mechanical Engineering", "Electrical Engineering", "Civil Engineering",
  "Architecture", "Industrial Design", "Graphic Design", "Information Technology",
  "Marketing", "Finance", "Business", "Entrepreneurship", "Economics",
  "Biotechnology", "Environmental Science", "Medicine", "Pharmacy", "Nursing",
  "Law", "Education", "Social Work", "Psychology", "Communications",
  "Journalism", "Film Studies", "Music", "Theater", "Mathematics",
  "Physics", "Chemistry", "Biology", "Political Science", "Sociology",
  "History", "Anthropology", "Design",
];

const PASSION_OPTIONS = [
  "Education", "Healthcare", "Agriculture", "Fintech", "Design", "Robotics",
  "Electronics", "Website Design", "Architecture", "AI & Machine Learning",
  "Sustainability", "Social Impact", "Media & Content", "E-commerce",
  "Gaming", "Cybersecurity", "Blockchain",
];

const SUGGESTED_SKILLS = [
  "Python", "JavaScript", "React", "Node.js", "TypeScript", "Figma",
  "SQL", "Git", "Docker", "Machine Learning", "UI/UX Design", "Project Management",
  "AutoCAD", "Adobe Photoshop", "Data Analysis", "Public Speaking",
];

const STEPS = [
  { key: "create.step_identity", label: "Identity" },
  { key: "create.step_focus", label: "Focus" },
  { key: "create.step_skills", label: "Skills" },
  { key: "create.step_projects", label: "Projects" },
  { key: "create.step_about", label: "About You" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Skill { name: string; level: number; }
interface Project { title: string; role: string; description: string; isTeam: boolean; images: string[]; }

const EMPTY_PROJECT: Project = { title: "", role: "", description: "", isTeam: false, images: [] };

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileCreatePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isLight = theme === "light";
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const projectImageRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 0 — Identity
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  // Step 1 — Focus
  const [majorField, setMajorField] = useState("");
  const [passionSector, setPassionSector] = useState("");
  const [isMentor, setIsMentor] = useState(false);

  // Step 2 — Skills
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Step 3 — Projects
  const [projects, setProjects] = useState<Project[]>([{ ...EMPTY_PROJECT }]);

  // Step 4 — About You
  const [bio, setBio] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);

  // ── Load user + prefill ──────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) { if (mounted) setLoading(false); return; }
        if (mounted) setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name,last_name,location_country,location_city,major_field,passion_sector,is_mentor,bio,avatar_data_url")
          .eq("id", user.id).single();
        if (!mounted) return;
        if (profile) {
          setFirstName(profile.first_name || "");
          setLastName(profile.last_name || "");
          setLocationCountry(profile.location_country || "");
          setLocationCity(profile.location_city || "");
          setMajorField(profile.major_field || "");
          setPassionSector(profile.passion_sector || "");
          setIsMentor(Boolean(profile.is_mentor));
          setBio(profile.bio || "");
          setAvatarDataUrl(profile.avatar_data_url || null);
        }
      } catch { /* ignore */ }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Country / city fetch ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    fetch("/api/locations").then(r => r.json()).then(j => { if (mounted) setCountryOptions(j.countries || []); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!locationCountry) { setCityOptions([]); return; }
    let mounted = true;
    fetch(`/api/locations?country=${encodeURIComponent(locationCountry)}`).then(r => r.json()).then(j => { if (mounted) setCityOptions(j.cities || []); }).catch(() => { setCityOptions([]); });
    return () => { mounted = false; };
  }, [locationCountry]);

  // ── Avatar ───────────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (typeof ev.target?.result === "string") setAvatarDataUrl(ev.target.result); };
    reader.readAsDataURL(file);
  };

  // ── Project images ────────────────────────────────────────────────────────
  const handleProjectImages = (projectIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const current = projects[projectIdx].images ?? [];
    const remaining = 3 - current.length;
    const toRead = files.slice(0, remaining);
    toRead.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          setProjects(prev => prev.map((p, i) =>
            i === projectIdx ? { ...p, images: [...(p.images ?? []), ev.target!.result as string].slice(0, 3) } : p
          ));
        }
      };
      reader.readAsDataURL(file);
    });
    // reset so same files can be re-selected
    e.target.value = "";
  };

  const removeProjectImage = (projectIdx: number, imgIdx: number) => {
    setProjects(prev => prev.map((p, i) =>
      i === projectIdx ? { ...p, images: p.images.filter((_, ii) => ii !== imgIdx) } : p
    ));
  };

  // ── Skills ───────────────────────────────────────────────────────────────
  const addSkill = (name: string, level = 3) => {
    const trimmed = name.trim();
    if (!trimmed || skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    setSkills(prev => [...prev, { name: trimmed, level }]);
    setSkillInput("");
  };

  const removeSkill = (name: string) => setSkills(prev => prev.filter(s => s.name !== name));

  const setSkillLevel = (name: string, level: number) =>
    setSkills(prev => prev.map(s => s.name === name ? { ...s, level } : s));

  const onSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); }
  };

  // ── Projects ─────────────────────────────────────────────────────────────
  const addProject = () => setProjects(prev => [...prev, { ...EMPTY_PROJECT }]);
  const removeProject = (i: number) => setProjects(prev => prev.filter((_, idx) => idx !== i));
  const updateProject = (i: number, field: keyof Project, value: string | boolean) =>
    setProjects(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  // ── Navigation ───────────────────────────────────────────────────────────
  const handleNext = () => {
    setError(null);
    if (step === 0 && !firstName.trim()) { setError(t("create.error_first_name", "First name is required.")); return; }
    if (step === 0 && !lastName.trim()) { setError(t("create.error_last_name", "Last name is required.")); return; }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const handleBack = () => { setError(null); setStep(s => Math.max(s - 1, 0)); };
  const canSkip = step > 0;

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);
    const previewData = { firstName, lastName, locationCity, locationCountry, majorField, passionSector, isMentor, bio, avatarDataUrl, skills, projects };

    if (!userId) {
      try { sessionStorage.setItem("profile_preview", JSON.stringify(previewData)); } catch { /* ignore */ }
      router.push("/profile/preview");
      return;
    }

    setSaving(true);
    try {
      // 1. Upsert base profile. Images go to Storage; the base64 columns are
      //    only written when the bucket is unavailable.
      const profileRow: Record<string, unknown> = {
        id: userId, first_name: firstName, last_name: lastName,
        location_country: locationCountry, location_city: locationCity,
        major_field: majorField, passion_sector: passionSector, is_mentor: isMentor, bio,
      };
      if (avatarDataUrl) {
        const { url, storedInBucket } = await uploadAvatar(userId, avatarDataUrl);
        profileRow.avatar_url = storedInBucket ? url : null;
        profileRow.avatar_data_url = storedInBucket ? null : url;
      }
      const { error: profileErr } = await supabase.from("profiles").upsert(profileRow);
      if (profileErr) throw profileErr;

      // 2. Save skills + projects into profile_intakes, which is what
      //    /profile/[id] reads back to render the public profile.
      const namedProjects = projects.filter(p => p.title.trim());
      const intakeProjects = await Promise.all(
        namedProjects.map(async (p, index) => ({
          name: p.title,
          description: p.description,
          user_role: p.role,
          is_team_project: p.isTeam,
          skills: [],
          toolsUsed: [],
          images: await uploadProjectImages(userId, `profile-${index}`, p.images),
        }))
      );
      const intakeData = {
        skills: skills.map(s => ({ name: s.name, level: s.level })),
        projects: intakeProjects,
      };
      const { error: intakeErr } = await supabase
        .from("profile_intakes")
        .upsert({ user_id: userId, data: intakeData }, { onConflict: "user_id" });
      if (intakeErr) throw intakeErr;

      try { window.dispatchEvent(new CustomEvent("app:toast", { detail: { message: "Profile created!" } })); } catch { /* ignore */ }
      router.push(`/profile/${userId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("create.error_save", "Failed to save. Please try again."));
    } finally { setSaving(false); }
  };

  // ── Preview values ────────────────────────────────────────────────────────
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || t("create.your_name", "Your Name");
  const displayLocation = [locationCity, locationCountry].filter(Boolean).join(", ") || t("create.your_location", "Your location");
  const displayFocus = [majorField, passionSector].filter(Boolean).join(" \u00b7 ") || t("create.your_focus", "Your focus area");
  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?";

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const bg = isLight ? "bg-[#f8f5f1]" : "bg-[#050816]";
  const cardBg = isLight ? "bg-white border-[#b7ada8]/25" : "bg-white/5 border-white/10";
  const titleColor = isLight ? "text-[#1b1918]" : "text-white";
  const mutedColor = isLight ? "text-[#847770]" : "text-[#8d9ab5]";
  const secondaryColor = isLight ? "text-[#6c615c]" : "text-[#9eabc4]";
  const accentColor = isLight ? "text-[#5b7fdb]" : "text-[#8fb7ff]";
  const inputClass = `w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors duration-150 outline-none focus:ring-2 focus:ring-offset-0 ${
    isLight ? "border-[#b7ada8]/40 bg-white text-[#1b1918] placeholder-[#b7ada8] focus:border-[#5b7fdb] focus:ring-[#5b7fdb]/15"
      : "border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-[#8fb7ff] focus:ring-[#8fb7ff]/15"
  }`;
  const labelClass = `block text-xs font-semibold tracking-wide mb-1.5 uppercase ${mutedColor}`;
  const primaryBtn = `inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] disabled:opacity-50 cursor-pointer ${
    isLight ? "bg-[#1b1918] text-white hover:bg-[#2c2a29]" : "bg-white text-[#1b1918] hover:bg-slate-100"
  }`;
  const ghostBtn = `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer ${
    isLight ? "border border-[#b7ada8]/40 text-[#6c615c] hover:bg-[#f2ede8]" : "border border-white/15 text-[#9eabc4] hover:bg-white/5"
  }`;
  const chipBase = `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-all duration-150 ${
    isLight ? "border border-[#b7ada8]/30 bg-[#f8f5f1] text-[#6c615c] hover:border-[#5b7fdb]/40 hover:bg-[#5b7fdb]/6"
      : "border border-white/10 bg-white/5 text-[#9eabc4] hover:border-[#8fb7ff]/30 hover:bg-[#8fb7ff]/8"
  }`;

  if (loading) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center`}>
        <Loader2 size={28} className={`animate-spin ${mutedColor}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg}`}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className={`sticky top-0 z-10 border-b backdrop-blur-xl ${isLight ? "border-[#b7ada8]/20 bg-[#f8f5f1]/90" : "border-white/8 bg-[#050816]/80"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className={`inline-flex items-center gap-2 text-sm font-medium transition-colors duration-150 ${secondaryColor} hover:${titleColor}`}>
            <ArrowLeft size={16} />
            {t("create.back_home", "Back to home")}
          </Link>

          {/* Step indicators */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {STEPS.map(({ key, label }, i) => (
              <React.Fragment key={key}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                    i < step ? (isLight ? "bg-[#1b1918] text-white" : "bg-white text-[#1b1918]")
                      : i === step ? (isLight ? "bg-[#5b7fdb] text-white" : "bg-[#8fb7ff] text-[#050816]")
                      : (isLight ? "border border-[#b7ada8]/40 text-[#847770]" : "border border-white/15 text-[#6f7e9d]")
                  }`}>
                    {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`hidden sm:block text-[9px] font-semibold tracking-wide uppercase ${i === step ? (isLight ? "text-[#1b1918]" : "text-white") : mutedColor}`}>
                    {t(key, label)}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mb-4 h-px w-6 sm:w-10 transition-colors duration-200 ${i < step ? (isLight ? "bg-[#1b1918]" : "bg-white") : (isLight ? "bg-[#b7ada8]/30" : "bg-white/10")}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <span className={`text-xs sm:text-sm ${mutedColor}`}>{step + 1}/{STEPS.length}</span>
        </div>
      </div>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">

          {/* ── Form ────────────────────────────────────────────────────── */}
          <div>
            {/* Heading */}
            <div className="mb-8">
              <p className={`text-xs font-semibold tracking-widest uppercase ${accentColor}`}>{t(STEPS[step].key, STEPS[step].label)}</p>
              <h1 className={`mt-2 text-3xl font-bold leading-tight ${titleColor}`}>
                {step === 0 && t("create.heading_identity", "Who are you?")}
                {step === 1 && t("create.heading_focus", "What drives you?")}
                {step === 2 && t("create.heading_skills", "What are your skills?")}
                {step === 3 && t("create.heading_projects", "Show your work")}
                {step === 4 && t("create.heading_about", "Tell your story")}
              </h1>
              <p className={`mt-2 text-sm leading-relaxed ${secondaryColor}`}>
                {step === 0 && t("create.sub_identity", "This is how people find and recognise you on the platform.")}
                {step === 1 && t("create.sub_focus", "Help us match you with the right opportunities and collaborators.")}
                {step === 2 && t("create.sub_skills", "Add the skills you have — type one and press Enter, or pick from suggestions.")}
                {step === 3 && t("create.sub_projects", "Add up to 3 projects to showcase your experience.")}
                {step === 4 && t("create.sub_about", "A photo and bio build trust and make your profile stand out.")}
              </p>
            </div>

            {/* ── Step 0: Identity ────────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{t("create.first_name", "First name")} *</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ahmed" className={inputClass} autoFocus />
                  </div>
                  <div>
                    <label className={labelClass}>{t("create.last_name", "Last name")} *</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Omar" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{t("create.country", "Country")}</label>
                    <input list="country-options" value={locationCountry} onChange={e => { setLocationCountry(e.target.value); setLocationCity(""); }} placeholder="Sudan" className={inputClass} />
                    <datalist id="country-options">{countryOptions.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                  <div>
                    <label className={labelClass}>{t("create.city", "City")}</label>
                    <input list="city-options" value={locationCity} onChange={e => setLocationCity(e.target.value)} placeholder="Khartoum" className={inputClass} disabled={!locationCountry} />
                    <datalist id="city-options">{cityOptions.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Focus ────────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>{t("create.major_field", "Major / Field")}</label>
                  <input list="major-options" value={majorField} onChange={e => setMajorField(e.target.value)} placeholder={t("create.major_placeholder", "e.g. Software Engineering")} className={inputClass} autoFocus />
                  <datalist id="major-options">{MAJOR_OPTIONS.map(o => <option key={o} value={o} />)}</datalist>
                </div>
                <div>
                  <label className={labelClass}>{t("create.passion_sector", "Passion / Sector")}</label>
                  <input list="passion-options" value={passionSector} onChange={e => setPassionSector(e.target.value)} placeholder={t("create.passion_placeholder", "e.g. Fintech, Education, Healthcare")} className={inputClass} />
                  <datalist id="passion-options">{PASSION_OPTIONS.map(o => <option key={o} value={o} />)}</datalist>
                </div>
                {/* Mentor toggle */}
                <button type="button" onClick={() => setIsMentor(v => !v)} className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 ${
                  isMentor ? (isLight ? "border-[#5b7fdb]/50 bg-[#5b7fdb]/5" : "border-[#8fb7ff]/40 bg-[#8fb7ff]/8")
                    : (isLight ? "border-[#b7ada8]/30 bg-white hover:border-[#5b7fdb]/30" : "border-white/10 bg-white/3 hover:border-[#8fb7ff]/20")
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-150 ${
                      isMentor ? (isLight ? "border-[#5b7fdb] bg-[#5b7fdb]" : "border-[#8fb7ff] bg-[#8fb7ff]") : (isLight ? "border-[#b7ada8]/60" : "border-white/20")
                    }`}>
                      {isMentor && <Check size={11} strokeWidth={3} className="text-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${titleColor}`}>{t("create.mentor_title", "I\u2019m available as a mentor")}</p>
                      <p className={`mt-0.5 text-xs leading-relaxed ${secondaryColor}`}>{t("create.mentor_body", "Help others grow by offering guidance and sharing your experience.")}</p>
                    </div>
                    <Star size={18} className={`ms-auto shrink-0 mt-0.5 ${isMentor ? accentColor : mutedColor}`} />
                  </div>
                </button>
              </div>
            )}

            {/* ── Step 2: Skills ───────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Input */}
                <div>
                  <label className={labelClass}>{t("create.add_skill", "Add a skill")}</label>
                  <div className="flex gap-2">
                    <input
                      ref={skillInputRef}
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={onSkillKeyDown}
                      placeholder={t("create.skill_placeholder", "e.g. Python, Figma, Project Management\u2026")}
                      className={`${inputClass} flex-1`}
                      autoFocus
                    />
                    <button type="button" onClick={() => addSkill(skillInput)} className={`${primaryBtn} px-3.5`} aria-label="Add skill">
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className={`mt-1.5 text-xs ${mutedColor}`}>{t("create.skill_hint", "Press Enter or click + to add")}</p>
                </div>

                {/* Suggestions */}
                <div>
                  <p className={`mb-2.5 text-xs font-semibold uppercase tracking-wide ${mutedColor}`}>{t("create.suggestions", "Suggestions")}</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_SKILLS.filter(s => !skills.some(sk => sk.name.toLowerCase() === s.toLowerCase())).map(s => (
                      <button key={s} type="button" onClick={() => addSkill(s)} className={chipBase}>
                        <Plus size={11} />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Added skills */}
                {skills.length > 0 && (
                  <div>
                    <p className={`mb-3 text-xs font-semibold uppercase tracking-wide ${mutedColor}`}>
                      {t("create.your_skills", "Your skills")} ({skills.length})
                    </p>
                    <div className="space-y-2.5">
                      {skills.map(skill => (
                        <div key={skill.name} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isLight ? "border-[#b7ada8]/25 bg-white" : "border-white/10 bg-white/4"}`}>
                          <span className={`flex-1 text-sm font-medium ${titleColor}`}>{skill.name}</span>
                          {/* Proficiency stars */}
                          <div className="flex items-center gap-0.5" role="group" aria-label={`${skill.name} proficiency`}>
                            {[1, 2, 3, 4, 5].map(lvl => (
                              <button key={lvl} type="button" onClick={() => setSkillLevel(skill.name, lvl)}
                                className={`h-5 w-5 transition-colors duration-100 cursor-pointer ${lvl <= skill.level ? (isLight ? "text-[#5b7fdb]" : "text-[#8fb7ff]") : (isLight ? "text-[#b7ada8]/40" : "text-white/15")}`}
                                aria-label={`Set ${skill.name} proficiency to ${lvl}`}>
                                <Star size={14} fill={lvl <= skill.level ? "currentColor" : "none"} strokeWidth={1.5} />
                              </button>
                            ))}
                          </div>
                          <span className={`w-12 text-right text-xs ${mutedColor}`}>
                            {t(`create.level_${skill.level}`, ["", "Beginner", "Basic", "Skilled", "Advanced", "Expert"][skill.level])}
                          </span>
                          <button type="button" onClick={() => removeSkill(skill.name)} className="rounded-md p-1 transition-colors duration-150 cursor-pointer text-[#847770] hover:bg-red-500 hover:text-white dark:text-[#6f7e9d]" aria-label={`Remove ${skill.name}`}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {skills.length === 0 && (
                  <div className={`rounded-xl border border-dashed py-8 text-center ${isLight ? "border-[#b7ada8]/35" : "border-white/10"}`}>
                    <p className={`text-sm ${mutedColor}`}>{t("create.skills_empty", "No skills added yet \u2014 type one above or pick from suggestions")}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Projects ─────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                {projects.map((project, i) => (
                  <div key={i} className={`rounded-2xl border p-5 space-y-4 ${isLight ? "border-[#b7ada8]/25 bg-white" : "border-white/10 bg-white/4"}`}>
                    {/* Card header */}
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${titleColor}`}>{t("create.project", "Project")} {i + 1}</p>
                      {projects.length > 1 && (
                        <button type="button" onClick={() => removeProject(i)} className="rounded-lg p-1.5 transition-colors duration-150 cursor-pointer text-[#847770] hover:bg-red-500 hover:text-white dark:text-[#6f7e9d]" aria-label="Remove project">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>{t("create.project_title", "Project title")}</label>
                        <input value={project.title} onChange={e => updateProject(i, "title", e.target.value)} placeholder={t("create.project_title_placeholder", "e.g. Community Dashboard")} className={inputClass} autoFocus={i === 0} />
                      </div>
                      <div>
                        <label className={labelClass}>{t("create.project_role", "Your role")}</label>
                        <input value={project.role} onChange={e => updateProject(i, "role", e.target.value)} placeholder={t("create.project_role_placeholder", "e.g. Lead Developer")} className={inputClass} />
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={() => updateProject(i, "isTeam", !project.isTeam)}
                          className={`w-full cursor-pointer rounded-xl border p-3 text-left transition-all duration-150 ${
                            project.isTeam ? (isLight ? "border-[#5b7fdb]/40 bg-[#5b7fdb]/5" : "border-[#8fb7ff]/30 bg-[#8fb7ff]/8")
                              : (isLight ? "border-[#b7ada8]/30 hover:border-[#5b7fdb]/25" : "border-white/10 hover:border-[#8fb7ff]/15")
                          }`}>
                          <div className="flex items-center gap-2">
                            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                              project.isTeam ? (isLight ? "border-[#5b7fdb] bg-[#5b7fdb]" : "border-[#8fb7ff] bg-[#8fb7ff]") : (isLight ? "border-[#b7ada8]/50" : "border-white/20")
                            }`}>
                              {project.isTeam && <Check size={9} strokeWidth={3} className="text-white" />}
                            </div>
                            <span className={`text-xs font-medium ${titleColor}`}>{t("create.team_project", "Team project")}</span>
                          </div>
                        </button>
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>{t("create.project_description", "Description")}</label>
                        <textarea value={project.description} onChange={e => updateProject(i, "description", e.target.value)} placeholder={t("create.project_description_placeholder", "What did you build? What was your contribution?")} rows={3} className={`${inputClass} resize-none`} />
                      </div>

                      {/* Image upload */}
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className={labelClass}>{t("create.project_images", "Project images")}</label>
                          <span className={`text-xs ${mutedColor}`}>{project.images.length}/3</span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {/* Uploaded thumbnails */}
                          {project.images.map((src, imgIdx) => (
                            <div key={imgIdx} className="relative group h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#b7ada8]/30">
                              <img src={src} alt={`Project ${i + 1} image ${imgIdx + 1}`} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeProjectImage(i, imgIdx)}
                                className="absolute inset-0 flex items-center justify-center bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer rounded-xl"
                                aria-label="Remove image"
                              >
                                <X size={18} className="text-white" />
                              </button>
                            </div>
                          ))}

                          {/* Upload slot */}
                          {project.images.length < 3 && (
                            <button
                              type="button"
                              onClick={() => projectImageRefs.current[i]?.click()}
                              className={`flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed transition-all duration-150 ${
                                isLight
                                  ? "border-[#b7ada8]/40 text-[#847770] hover:border-[#5b7fdb]/50 hover:bg-[#5b7fdb]/4 hover:text-[#5b7fdb]"
                                  : "border-white/15 text-[#6f7e9d] hover:border-[#8fb7ff]/30 hover:bg-[#8fb7ff]/6 hover:text-[#8fb7ff]"
                              }`}
                              aria-label="Upload image"
                            >
                              <Camera size={18} />
                              <span className="text-[10px] font-medium">{t("create.add_photo", "Add photo")}</span>
                            </button>
                          )}
                        </div>

                        <input
                          ref={el => { projectImageRefs.current[i] = el; }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={e => handleProjectImages(i, e)}
                        />
                        <p className={`mt-2 text-xs ${mutedColor}`}>{t("create.project_images_hint", "JPG or PNG \u00b7 up to 3 images per project")}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {projects.length < 3 && (
                  <button type="button" onClick={addProject} className={`w-full cursor-pointer rounded-2xl border border-dashed py-4 text-sm font-medium transition-all duration-150 ${isLight ? "border-[#b7ada8]/40 text-[#847770] hover:border-[#5b7fdb]/40 hover:text-[#5b7fdb] hover:bg-[#5b7fdb]/4" : "border-white/10 text-[#6f7e9d] hover:border-[#8fb7ff]/25 hover:text-[#8fb7ff] hover:bg-[#8fb7ff]/6"}`}>
                    <Plus size={15} className="inline me-1.5" />
                    {t("create.add_project", "Add another project")}
                  </button>
                )}
              </div>
            )}

            {/* ── Step 4: About You ────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-6">
                {/* Avatar */}
                <div>
                  <label className={labelClass}>{t("create.profile_photo", "Profile photo")}</label>
                  <div className="flex items-center gap-5">
                    <div className={`relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${isLight ? "border-[#b7ada8]/40 bg-[#f2ede8]" : "border-white/15 bg-white/8"}`}>
                      {avatarDataUrl ? (
                        <img src={avatarDataUrl} alt="Profile preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className={`text-xl font-bold ${isLight ? "text-[#847770]" : "text-[#6f7e9d]"}`}>{initials}</span>
                      )}
                      <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity duration-150 hover:opacity-100 cursor-pointer" aria-label="Upload avatar">
                        <Camera size={18} className="text-white" />
                      </button>
                    </div>
                    <div>
                      <button type="button" onClick={() => avatarInputRef.current?.click()} className={ghostBtn}>
                        <Camera size={15} />{t("create.upload_photo", "Upload photo")}
                      </button>
                      <p className={`mt-1.5 text-xs ${mutedColor}`}>{t("create.photo_hint", "JPG or PNG, max 4 MB")}</p>
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass}>{t("create.short_bio", "Short bio")}</label>
                    <span className={`text-xs ${bio.length > 450 ? "text-[#e86c00]" : mutedColor}`}>{bio.length}/500</span>
                  </div>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} rows={5} placeholder={t("create.bio_placeholder", "Tell the community who you are, what you\u2019re building, or what you\u2019re passionate about\u2026")} className={`${inputClass} resize-none`} autoFocus />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${isLight ? "border-[#e86c00]/30 bg-[#e86c00]/8 text-[#c45900]" : "border-[#e86c00]/20 bg-[#e86c00]/10 text-[#f59e0b]"}`}>
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={handleBack} className={`${ghostBtn} ${step === 0 ? "invisible" : ""}`}>
                <ArrowLeft size={15} />{t("create.back", "Back")}
              </button>
              <div className="flex items-center gap-3">
                {step < STEPS.length - 1 ? (
                  <>
                    {canSkip && (
                      <button type="button" onClick={() => { setError(null); setStep(s => s + 1); }} className={`text-sm transition-colors duration-150 cursor-pointer ${mutedColor} hover:${secondaryColor}`}>
                        {t("create.skip", "Skip for now")}
                      </button>
                    )}
                    <button type="button" onClick={handleNext} className={primaryBtn}>
                      {t("create.continue", "Continue")} <ArrowRight size={15} />
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={saving} className={primaryBtn}>
                    {saving ? <><Loader2 size={15} className="animate-spin" />{t("create.saving", "Saving\u2026")}</> : <><Check size={15} />{t("create.complete", "Complete profile")}</>}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Live Preview ──────────────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              <p className={`mb-3 text-xs font-semibold tracking-widest uppercase ${mutedColor}`}>{t("create.preview", "Preview")}</p>
              <div className={`rounded-2xl border p-5 ${cardBg}`}>
                <div className="flex flex-col items-center text-center">
                  <div className={`flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border-2 ${isLight ? "border-[#b7ada8]/30 bg-[#f2ede8]" : "border-white/10 bg-white/8"}`}>
                    {avatarDataUrl ? <img src={avatarDataUrl} alt="Avatar" className="h-full w-full object-cover" /> : <span className={`text-xl font-bold ${isLight ? "text-[#847770]" : "text-[#6f7e9d]"}`}>{initials}</span>}
                  </div>
                  <h2 className={`mt-3 text-base font-bold ${titleColor}`}>{displayName}</h2>
                  <p className={`text-xs ${secondaryColor}`}>{displayFocus}</p>
                  {(locationCity || locationCountry) && (
                    <p className={`mt-1 flex items-center gap-1 text-xs ${mutedColor}`}><MapPin size={10} />{displayLocation}</p>
                  )}
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {majorField && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isLight ? "bg-[#f2ede8] text-[#6c615c]" : "bg-white/8 text-[#9eabc4]"}`}>{majorField}</span>}
                    {passionSector && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isLight ? "bg-[#5b7fdb]/10 text-[#5b7fdb]" : "bg-[#8fb7ff]/10 text-[#8fb7ff]"}`}>{passionSector}</span>}
                    {isMentor && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${isLight ? "bg-[#0d9488]/10 text-[#0d9488]" : "bg-[#18c29c]/10 text-[#18c29c]"}`}><Star size={9} fill="currentColor" />Mentor</span>}
                  </div>
                  {bio && <p className={`mt-3 text-xs leading-relaxed line-clamp-3 ${secondaryColor}`}>{bio}</p>}
                </div>

                {skills.length > 0 && (
                  <>
                    <div className={`my-4 border-t ${isLight ? "border-[#b7ada8]/15" : "border-white/8"}`} />
                    <p className={`mb-2 text-[10px] font-semibold uppercase tracking-widest ${accentColor}`}>{t("create.preview_skills", "Skills")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map(s => (
                        <span key={s.name} className={`rounded-full px-2 py-0.5 text-xs font-medium ${isLight ? "border border-[#b7ada8]/25 bg-[#f8f5f1] text-[#6c615c]" : "border border-white/10 bg-white/5 text-[#9eabc4]"}`}>{s.name}</span>
                      ))}
                    </div>
                  </>
                )}

                {projects.filter(p => p.title).length > 0 && (
                  <>
                    <div className={`my-4 border-t ${isLight ? "border-[#b7ada8]/15" : "border-white/8"}`} />
                    <p className={`mb-2 text-[10px] font-semibold uppercase tracking-widest ${accentColor}`}>{t("create.preview_projects", "Projects")}</p>
                    <div className="space-y-2">
                      {projects.filter(p => p.title).map((p, i) => (
                        <div key={i} className={`overflow-hidden rounded-lg ${isLight ? "bg-[#f8f5f1]" : "bg-white/5"}`}>
                          {p.images.length > 0 && (
                            <div className="flex gap-1 p-1.5 pb-0">
                              {p.images.slice(0, 3).map((src, ii) => (
                                <img key={ii} src={src} alt="" className="h-12 flex-1 rounded object-cover" />
                              ))}
                            </div>
                          )}
                          <div className="p-2.5">
                            <p className={`text-xs font-semibold ${titleColor}`}>{p.title}</p>
                            {p.role && <p className={`text-[11px] ${accentColor}`}>{p.role}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {!bio && skills.length === 0 && projects.filter(p => p.title).length === 0 && !majorField && !passionSector && (
                  <p className={`mt-4 text-center text-xs italic ${mutedColor}`}>{t("create.preview_empty", "Fill in your details to see a preview")}</p>
                )}
              </div>

              {/* Step hint */}
              <div className={`mt-4 rounded-xl border p-4 ${isLight ? "border-[#b7ada8]/20 bg-white/60" : "border-white/8 bg-white/3"}`}>
                <div className="flex items-start gap-3">
                  <User size={15} className={`mt-0.5 shrink-0 ${accentColor}`} />
                  <div>
                    <p className={`text-xs font-semibold ${titleColor}`}>
                      {step === 0 && t("create.hint_identity_title", "Identity sets your presence")}
                      {step === 1 && t("create.hint_focus_title", "Focus drives your matches")}
                      {step === 2 && t("create.hint_skills_title", "Skills get you discovered")}
                      {step === 3 && t("create.hint_projects_title", "Projects prove your work")}
                      {step === 4 && t("create.hint_about_title", "A photo gets 3\u00d7 more views")}
                    </p>
                    <p className={`mt-0.5 text-xs leading-relaxed ${mutedColor}`}>
                      {step === 0 && t("create.hint_identity_body", "Add your name and location so collaborators can find you.")}
                      {step === 1 && t("create.hint_focus_body", "We use your field and passion to surface relevant projects.")}
                      {step === 2 && t("create.hint_skills_body", "Profiles with 5+ skills get significantly more matches.")}
                      {step === 3 && t("create.hint_projects_body", "Real projects are the strongest signal of your capabilities.")}
                      {step === 4 && t("create.hint_about_body", "Profiles with a photo and bio build trust faster.")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
