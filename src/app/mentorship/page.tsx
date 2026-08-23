"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "../../lib/i18n";
import { useTheme } from "../../lib/theme";
import supabase from "../../lib/supabaseClient";
import { getProfileBuilderHref } from "../../lib/utils";
import {
  CATEGORY_KEYS,
  CATEGORY_META,
  MENTORSHIP_OFFERINGS,
  SEED_MENTORS,
  type MentorCategoryKey,
  type MentorProfile,
} from "../../lib/mentorship-data";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BookmarkCheck,
  BookmarkPlus,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  MessageCircle,
  Mic,
  Presentation,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

type MentorCategory = "all" | MentorCategoryKey;

/** Icons live here rather than in the data module, which stays framework-free. */
const CATEGORY_ICONS: Record<MentorCategoryKey, React.ReactNode> = {
  resume_review: <FileText size={14} />,
  career_conversation: <MessageCircle size={14} />,
  interview_prep: <Mic size={14} />,
  referral: <UserPlus size={14} />,
  course: <BookOpen size={14} />,
  workshop: <Presentation size={14} />,
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  location_city: string | null;
  location_country: string | null;
  major_field: string | null;
  passion_sector: string | null;
  bio: string | null;
};

function MentorAvatar({ name, isLight }: { name: string; isLight: boolean }) {
  const initials = name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white ${
        isLight ? "from-[#2258d1] to-[#3d95ff]" : "from-[#3d95ff] to-[#2258d1]"
      }`}
    >
      {initials}
    </div>
  );
}

function Chip({ label, isLight }: { label: string; isLight: boolean }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${
      isLight ? "border-slate-900/10 bg-white text-slate-600" : "border-white/10 bg-white/5 text-[#c8d8f0]"
    }`}>
      {label}
    </span>
  );
}

function CategoryBadge({
  category,
  isLight,
  t,
}: {
  category: MentorCategoryKey;
  isLight: boolean;
  t: (k: string, f: string) => string;
}) {
  const cfg = CATEGORY_META[category];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
      isLight ? "border-[#2258d1]/20 bg-[#2258d1]/8 text-[#2258d1]" : "border-[#8fb7ff]/20 bg-[#8fb7ff]/8 text-[#8fb7ff]"
    }`}>
      {CATEGORY_ICONS[category]}
      {t(cfg.labelKey, cfg.fallback)}
    </span>
  );
}

export default function MentorshipPage() {
  const { t, locale } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<ProfileRow | null>(null);
  const [activeCategory, setActiveCategory] = useState<MentorCategory>("all");
  const [activeTab, setActiveTab] = useState<"mentors" | "offerings">("mentors");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const savedStorageKey = "mentorship_saved";
  const cardCls = isLight ? "border-slate-900/8 bg-white shadow-sm" : "border-white/8 bg-white/3";
  const titleCls = isLight ? "text-slate-950" : "text-[#f5f7fb]";
  const mutedCls = isLight ? "text-slate-500" : "text-[#9eabc4]";
  const dimCls = isLight ? "text-slate-400" : "text-[#6f7e9d]";
  const categories: MentorCategory[] = ["all", ...CATEGORY_KEYS];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem(savedStorageKey);
        if (raw) setSavedIds(new Set(JSON.parse(raw) as string[]));
      } catch {}

      try {
        const { data: ud } = await supabase.auth.getUser();
        const user = ud?.user;
        if (mounted) setCurrentUserId(user?.id ?? null);
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, location_city, location_country, major_field, passion_sector, bio")
            .eq("id", user.id)
            .single();
          if (mounted) setCurrentProfile(profile || null);
        } else if (mounted) {
          setCurrentProfile(null);
        }
        let query = supabase
          .from("profiles")
          .select("id, first_name, last_name, location_city, location_country, major_field, passion_sector, bio, is_mentor")
          .eq("is_mentor", true)
          .limit(20);
        if (user) query = query.neq("id", user.id);
        const { data: rows } = await query;
        const mapped = ((rows || []) as ProfileRow[]).map(row => {
          const tags: string[] = [];
          if (row.major_field) tags.push(row.major_field);
          if (row.passion_sector) tags.push(row.passion_sector);
          const mentorCategories: MentorCategoryKey[] = ["career_conversation"];
          if (tags.some(tag => /engineer|software|tech|developer/i.test(tag))) mentorCategories.push("interview_prep");
          if (tags.some(tag => /product|business|management/i.test(tag))) {
            mentorCategories.push("resume_review", "referral");
          }
          return {
            id: row.id,
            name: `${row.first_name || ""} ${row.last_name || ""}`.trim() || t("mentorship.unnamed_mentor", "Certified Mentor"),
            bio: row.bio || t("mentorship.default_bio", "Volunteer mentor supporting Sudanese makers."),
            location: [row.location_city, row.location_country].filter(Boolean).join(", ") || t("mentorship.location_global", "Diaspora"),
            tags: tags.slice(0, 4),
            categories: Array.from(new Set(mentorCategories)),
            certified: true,
          } satisfies MentorProfile;
        });
        if (mounted) setMentors(mapped.length ? mapped : SEED_MENTORS);
      } catch {
        if (mounted) setMentors(SEED_MENTORS);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [t]);

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem(savedStorageKey, JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  };

  const filteredMentors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mentors.filter(m => {
      if (activeCategory !== "all" && !m.categories.includes(activeCategory)) return false;
      if (q && !`${m.name} ${m.bio} ${m.tags.join(" ")} ${m.location}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mentors, activeCategory, searchQuery]);

  const filteredOfferings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return MENTORSHIP_OFFERINGS.filter(o => {
      if (activeCategory !== "all" && o.category !== activeCategory) return false;
      if (q && !`${o.title} ${o.description} ${o.mentorName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeCategory, searchQuery]);

  const profileBuilderHref = getProfileBuilderHref(currentUserId, currentProfile);

  return (
    <div dir={dir} className={`home-shell min-h-screen ${isLight ? "home-shell-light text-slate-950" : "home-shell-dark text-[#f5f7fb]"}`}>
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        <Link href="/"
          className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
            isLight ? "border-slate-900/10 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900" : "border-white/8 bg-white/4 text-[#9eabc4] hover:border-white/15 hover:text-[#f5f7fb]"
          }`}>
          <ArrowLeft size={15} /> {t("mentorship.back_home", "Back to home")}
        </Link>

        <div className="mb-8">
          <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>
            {t("mentorship.kicker", "Mentorship Hub")}
          </p>
          <h1 className={`mt-2 font-display text-2xl font-bold sm:text-3xl ${titleCls}`}>
            {t("mentorship.title", "Find mentors, lessons, and career support")}
          </h1>
          <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${mutedCls}`}>
            {t("mentorship.subtitle", "Connect with certified Sudanese professionals for resume reviews, career conversations, interview prep, referrals, and guided courses.")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {[t("mentorship.badge_1", "Certified mentors"), t("mentorship.badge_2", "Early access"), t("mentorship.badge_3", "Arabic + English")].map(b => (
              <span key={b} className={`rounded-full border px-3 py-1 text-xs font-medium ${isLight ? "border-slate-900/10 bg-white text-slate-600" : "border-white/10 bg-white/5 text-[#9eabc4]"}`}>{b}</span>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(cat => {
            const active = activeCategory === cat;
            const label = cat === "all"
              ? t("mentorship.cat_all", "All")
              : t(CATEGORY_META[cat].labelKey, CATEGORY_META[cat].fallback);
            return (
              <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  active
                    ? isLight ? "border-[#2258d1] bg-[#2258d1] text-white" : "border-[#8fb7ff] bg-[#8fb7ff] text-[#09111f]"
                    : isLight ? "border-slate-900/10 bg-white text-slate-600 hover:border-slate-300" : "border-white/8 bg-white/4 text-[#9eabc4] hover:border-white/15"
                }`}>
                {cat !== "all" && CATEGORY_ICONS[cat]}
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="w-full space-y-4 lg:w-[280px] lg:shrink-0">
            <div className={`rounded-2xl border p-5 ${cardCls}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"} />
                <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>
                  {t("mentorship.certified_title", "Certified mentors")}
                </p>
              </div>
              <p className={`mt-2 text-xs leading-relaxed ${dimCls}`}>
                {t("mentorship.certified_body", "Every mentor is vetted for professional experience and commitment to supporting Sudanese makers.")}
              </p>
              <ul className="mt-4 space-y-2">
                {CATEGORY_KEYS.map((key) => (
                  <li key={key} className={`flex items-center gap-2 text-xs ${mutedCls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isLight ? "bg-[#2258d1]" : "bg-[#8fb7ff]"}`} />
                    {t(CATEGORY_META[key].labelKey, CATEGORY_META[key].fallback)}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`rounded-2xl border p-5 ${cardCls}`}>
              <div className="flex items-center gap-2">
                <Sparkles size={15} className={isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"} />
                <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>
                  {t("mentorship.tip_title", "Get matched faster")}
                </p>
              </div>
              <p className={`mt-2 text-xs leading-relaxed ${dimCls}`}>
                {t("mentorship.tip_body", "Complete your portfolio so mentors can see your skills, projects, and goals before your first session.")}
              </p>
              <Link href={profileBuilderHref}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                  isLight ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
                }`}>
                {t("mentorship.cta_profile", "Build Your Profile")} <ArrowRight size={15} />
              </Link>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4">
              <div className="relative">
                <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dimCls}`} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t("mentorship.search_placeholder", "Search mentors, topics, or skills…")}
                  className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-150 ${
                    isLight
                      ? "border-slate-900/10 bg-white text-slate-900 placeholder-slate-400 focus:border-[#2258d1] focus:shadow-[0_0_0_3px_rgba(34,88,209,0.08)]"
                      : "border-white/8 bg-white/4 text-[#f5f7fb] placeholder-[#6f7e9d] focus:border-[#8fb7ff]/40 focus:shadow-[0_0_0_3px_rgba(143,183,255,0.08)]"
                  }`}
                />
              </div>
            </div>

            <div className={`mb-4 flex gap-1 rounded-xl border p-1 ${isLight ? "border-slate-900/8 bg-slate-100/60" : "border-white/6 bg-white/3"}`}>
              {([
                { key: "mentors" as const, label: t("mentorship.tab_mentors", "Mentors"), icon: <GraduationCap size={13} /> },
                { key: "offerings" as const, label: t("mentorship.tab_offerings", "Programs & Lessons"), icon: <BookOpen size={13} /> },
              ]).map(({ key, label, icon }) => (
                <button key={key} type="button" onClick={() => setActiveTab(key)}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                    activeTab === key
                      ? isLight ? "bg-white text-slate-950 shadow-sm" : "bg-white/10 text-[#f5f7fb]"
                      : isLight ? "text-slate-500 hover:text-slate-700" : "text-[#6f7e9d] hover:text-[#9eabc4]"
                  }`}>
                  {icon}
                  <span>{label}</span>
                  <span className={`rounded-full px-1.5 text-xs font-bold ${
                    activeTab === key
                      ? isLight ? "bg-slate-100 text-slate-600" : "bg-white/10 text-[#9eabc4]"
                      : isLight ? "text-slate-400" : "text-[#6f7e9d]"
                  }`}>
                    {key === "mentors" ? filteredMentors.length : filteredOfferings.length}
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className={`flex items-center justify-center gap-2 rounded-2xl border p-12 ${cardCls}`}>
                <Loader2 size={20} className="animate-spin" />
                <span className={mutedCls}>{t("mentorship.loading", "Loading mentorship…")}</span>
              </div>
            ) : activeTab === "mentors" ? (
              filteredMentors.length === 0 ? (
                <div className={`rounded-2xl border p-10 text-center ${cardCls}`}>
                  <GraduationCap size={32} className={`mx-auto mb-4 ${dimCls}`} />
                  <p className={`font-semibold ${titleCls}`}>{t("mentorship.no_mentors", "No mentors match your filters.")}</p>
                  <p className={`mt-2 text-sm ${dimCls}`}>{t("mentorship.no_mentors_hint", "Try a different category or clear your search.")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMentors.map(mentor => (
                    <article key={mentor.id} className={`rounded-2xl border p-5 transition-all duration-150 ${isLight ? "hover:border-[#2258d1]/20 hover:shadow-md" : "hover:border-[#8fb7ff]/20 hover:bg-white/5"} ${cardCls}`}>
                      <div className="flex items-start gap-4">
                        <MentorAvatar name={mentor.name} isLight={isLight} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className={`text-base font-semibold ${titleCls}`}>{mentor.name}</h3>
                            {mentor.certified && (
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                isLight ? "border-emerald-500/25 bg-emerald-50 text-emerald-700" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-400"
                              }`}>
                                <BadgeCheck size={11} /> {t("mentorship.certified_badge", "Certified")}
                              </span>
                            )}
                          </div>
                          <p className={`mt-1 text-sm ${mutedCls}`}>{mentor.bio}</p>
                          <div className={`mt-3 flex items-center gap-1.5 text-xs ${dimCls}`}>
                            <MapPin size={13} className={isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"} />
                            {mentor.location}
                          </div>
                          {mentor.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {mentor.tags.map(tag => <Chip key={tag} label={tag} isLight={isLight} />)}
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {mentor.categories.map(cat => (
                              <CategoryBadge key={cat} category={cat} isLight={isLight} t={t} />
                            ))}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                              isLight ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
                            }`}>
                              {t("mentorship.cta_request", "Request Session")}
                            </button>
                            <button type="button" onClick={() => toggleSave(mentor.id)}
                              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                                savedIds.has(mentor.id)
                                  ? isLight ? "border-[#2258d1]/20 bg-[#2258d1]/5 text-[#2258d1]" : "border-[#8fb7ff]/20 bg-[#8fb7ff]/5 text-[#8fb7ff]"
                                  : isLight ? "border-slate-900/10 text-slate-600 hover:border-slate-300" : "border-white/8 text-[#9eabc4] hover:border-white/15"
                              }`}>
                              {savedIds.has(mentor.id) ? <BookmarkCheck size={13} /> : <BookmarkPlus size={13} />}
                              {savedIds.has(mentor.id) ? t("mentorship.saved", "Saved") : t("mentorship.save", "Save")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : filteredOfferings.length === 0 ? (
              <div className={`rounded-2xl border p-10 text-center ${cardCls}`}>
                <BookOpen size={32} className={`mx-auto mb-4 ${dimCls}`} />
                <p className={`font-semibold ${titleCls}`}>{t("mentorship.no_offerings", "No programs match your filters.")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOfferings.map(offering => (
                  <article key={offering.id} className={`rounded-2xl border p-5 transition-all duration-150 ${isLight ? "hover:border-[#2258d1]/20 hover:shadow-md" : "hover:border-[#8fb7ff]/20 hover:bg-white/5"} ${cardCls}`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isLight ? "bg-[#2258d1]/10 text-[#2258d1]" : "bg-[#8fb7ff]/15 text-[#8fb7ff]"
                      }`}>
                        {CATEGORY_ICONS[offering.category]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`text-base font-semibold ${titleCls}`}>{offering.title}</h3>
                              {offering.certified && (
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                  isLight ? "border-emerald-500/25 bg-emerald-50 text-emerald-700" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-400"
                                }`}>
                                  <BadgeCheck size={11} /> {t("mentorship.certified_badge", "Certified")}
                                </span>
                              )}
                            </div>
                            <p className={`mt-1 text-sm ${mutedCls}`}>{offering.description}</p>
                          </div>
                          <CategoryBadge category={offering.category} isLight={isLight} t={t} />
                        </div>
                        <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs ${dimCls}`}>
                          <span className="inline-flex items-center gap-1.5">
                            <Users size={13} />
                            {offering.mentorName}
                          </span>
                          <span>{offering.format}</span>
                          <span>{offering.duration}</span>
                          {offering.spots != null && (
                            <span>{offering.spots} {t("mentorship.spots_left", "spots")}</span>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button type="button" className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                            isLight ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
                          }`}>
                            {t("mentorship.cta_enroll", "Request Access")}
                          </button>
                          <button type="button" onClick={() => toggleSave(offering.id)}
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                              savedIds.has(offering.id)
                                ? isLight ? "border-[#2258d1]/20 bg-[#2258d1]/5 text-[#2258d1]" : "border-[#8fb7ff]/20 bg-[#8fb7ff]/5 text-[#8fb7ff]"
                                : isLight ? "border-slate-900/10 text-slate-600 hover:border-slate-300" : "border-white/8 text-[#9eabc4] hover:border-white/15"
                            }`}>
                            {savedIds.has(offering.id) ? <BookmarkCheck size={13} /> : <BookmarkPlus size={13} />}
                            {savedIds.has(offering.id) ? t("mentorship.saved", "Saved") : t("mentorship.save", "Save")}
                          </button>
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
    </div>
  );
}
