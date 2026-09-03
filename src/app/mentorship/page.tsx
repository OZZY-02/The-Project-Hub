"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "../../lib/i18n";
import { useTheme } from "../../lib/theme";
import supabase from "../../lib/supabaseClient";
import { isProfileComplete } from "../../lib/utils";
import {
  CATEGORY_KEYS,
  CATEGORY_META,
  MENTORSHIP_OFFERINGS,
  SEED_MENTORS,
  type MentorCategoryKey,
  type MentorProfile,
  type MentorshipOffering,
} from "../../lib/mentorship-data";
import {
  loadSaved,
  savedIdSet,
  toSavedMentor,
  toSavedOffering,
  toggleSaved,
  type SavedItem,
} from "../../lib/mentorship-saved";
import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, BookmarkCheck, BookmarkPlus,
  Check, ExternalLink, FileText, GraduationCap, Inbox, Loader2, MapPin, MessageCircle,
  Mic, Presentation, Search, ShieldCheck, Sparkles, Star, UserPlus, X,
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

type RequestStatus = "pending" | "accepted" | "declined" | "withdrawn";

/** Matches the CHECK constraint on mentor_requests.reason. */
const MIN_REASON_LENGTH = 40;
const MAX_REASON_LENGTH = 600;

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
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white ${
      isLight ? "from-midnight-800 to-midnight-600" : "from-midnight-600 to-midnight-400"
    }`}>
      {initials}
    </div>
  );
}

/**
 * Metadata as plain text rather than pills.
 *
 * Every attribute used to be a bordered bubble, which made static information
 * look identical to the filter buttons and the save button. The rule now is:
 * rounded pill = clickable filter, squared button = action, plain text = data.
 */
function MetaLine({ items, className }: { items: string[]; className: string }) {
  if (items.length === 0) return null;
  return (
    <p className={`text-xs ${className}`}>
      {items.map((item, i) => (
        <React.Fragment key={item}>
          {i > 0 && <span aria-hidden="true" className="mx-1.5 opacity-40">·</span>}
          {item}
        </React.Fragment>
      ))}
    </p>
  );
}

function RatingStars({ rating, label }: { rating: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${label}: ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} fill={i < rating ? "currentColor" : "none"} strokeWidth={1.5} aria-hidden="true" />
      ))}
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
  const [activeCategory, setActiveCategory] = useState<MentorCategory>("all");
  const [activeTab, setActiveTab] = useState<"mentors" | "offerings">("mentors");
  const [searchQuery, setSearchQuery] = useState("");
  const [saved, setSaved] = useState<SavedItem[]>([]);

  // Session requests
  const [requestMentor, setRequestMentor] = useState<MentorProfile | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  /**
   * Status of this user's request per mentor. A withdrawn or declined request
   * must not read as "Requested" — the row still exists, but it is no longer
   * live, and the person should be able to ask again.
   */
  const [requestStatus, setRequestStatus] = useState<Record<string, RequestStatus>>({});
  const [withdrawMentor, setWithdrawMentor] = useState<MentorProfile | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  /** Null until checked, so the "build your portfolio" nudge never flashes. */
  const [portfolioReady, setPortfolioReady] = useState<boolean | null>(null);
  /** Pending requests addressed to this user, when they are a mentor. */
  const [pendingIncoming, setPendingIncoming] = useState(0);
  /** Already-approved mentors do not need the apply card. */
  const [alreadyMentor, setAlreadyMentor] = useState(false);

  /* ── Midnight & Amber palette — trialled on this page only ──
     Amber is accent-only: links, focus rings, ratings. Never a CTA background. */
  const shellCls   = isLight ? "bg-ivory-100 text-midnight-700" : "bg-midnight-950 text-midnight-100";
  const cardCls    = isLight ? "border-ivory-300 bg-ivory-50 shadow-sm" : "border-midnight-700 bg-midnight-800";
  const cardHover  = isLight ? "hover:border-ivory-400 hover:shadow-md" : "hover:border-midnight-600";
  const titleCls   = isLight ? "text-midnight-900" : "text-ivory-50";
  const mutedCls   = isLight ? "text-slate-500" : "text-midnight-300";
  const dimCls     = isLight ? "text-slate-400" : "text-midnight-400";
  const accentCls  = isLight ? "text-amber-600" : "text-amber-400";
  const primaryBtn = isLight ? "bg-midnight-900 text-white hover:bg-midnight-700" : "bg-ivory-50 text-midnight-900 hover:bg-ivory-200";
  const outlineBtn = isLight ? "border-ivory-300 text-midnight-700 hover:border-ivory-400" : "border-midnight-700 text-midnight-200 hover:border-midnight-600";
  const savedBtn   = isLight ? "border-amber-200 bg-amber-50 text-amber-800" : "border-amber-700/50 bg-amber-900/30 text-amber-200";
  const focusRing  = "focus:outline-none focus:ring-2 focus:ring-amber-400";
  const inputCls   = isLight
    ? "border-ivory-300 bg-ivory-50 text-midnight-900 placeholder-slate-400"
    : "border-midnight-700 bg-midnight-800 text-ivory-50 placeholder-midnight-400";

  const categories: MentorCategory[] = ["all", ...CATEGORY_KEYS];
  const savedIds = useMemo(() => savedIdSet(saved), [saved]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      if (mounted) setSaved(loadSaved());

      try {
        const { data: ud } = await supabase.auth.getUser();
        const user = ud?.user ?? null;
        if (mounted) setSignedIn(Boolean(user));

        if (!user) {
          setPortfolioReady(false);
        } else {
          // Hide the portfolio nudge once they have actually built one.
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name,location_country,location_city,major_field,passion_sector,is_mentor")
              .eq("id", user.id)
              .single();
            if (mounted) setPortfolioReady(isProfileComplete(profile));

            if (mounted) setAlreadyMentor(Boolean(profile?.is_mentor));

            // Mentors get a count of what is waiting for them.
            if (profile?.is_mentor) {
              const { count } = await supabase
                .from("mentor_requests")
                .select("id", { count: "exact", head: true })
                .eq("mentor_id", user.id)
                .eq("status", "pending");
              if (mounted && typeof count === "number") setPendingIncoming(count);
            }
          } catch {
            if (mounted) setPortfolioReady(false);
          }

          // Show "Requested" on mentors this person has already contacted.
          try {
            const { data: reqs } = await supabase
              .from("mentor_requests").select("mentor_id, status").eq("requester_id", user.id);
            if (mounted && reqs) {
              setRequestStatus(Object.fromEntries(
                reqs.map(r => [r.mentor_id as string, r.status as RequestStatus])
              ));
            }
          } catch {
            /* table not migrated yet — requests simply show as unsent */
          }
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

  const handleToggleSave = (item: SavedItem) => setSaved(toggleSaved(item));

  const openRequest = (mentor: MentorProfile) => {
    setRequestMentor(mentor);
    setReason("");
    setRequestError(null);
  };

  const submitRequest = async () => {
    if (!requestMentor) return;
    const trimmed = reason.trim();
    if (trimmed.length < MIN_REASON_LENGTH) return;

    setSubmitting(true);
    setRequestError(null);
    try {
      const { data: ud } = await supabase.auth.getUser();
      const user = ud?.user;
      if (!user) {
        setRequestError(t("mentorship.request_signin", "Please sign in to request a session."));
        return;
      }

      // UNIQUE (requester_id, mentor_id) means a withdrawn or declined request
      // still occupies the row, so asking again has to update it rather than
      // insert a second one.
      const { error } = await supabase.from("mentor_requests").upsert({
        requester_id: user.id,
        mentor_id: requestMentor.id,
        mentor_name: requestMentor.name,
        reason: trimmed,
        status: "pending",
      }, { onConflict: "requester_id,mentor_id" });

      if (error) {
        setRequestError(error.message);
        return;
      }

      setRequestStatus(prev => ({ ...prev, [requestMentor.id]: "pending" }));
      setRequestMentor(null);
      try {
        window.dispatchEvent(new CustomEvent("app:toast", {
          detail: { message: t("mentorship.request_sent", "Request sent.") },
        }));
      } catch { /* ignore */ }
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : t("mentorship.request_failed", "Could not send the request."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmWithdraw = async () => {
    if (!withdrawMentor) return;
    setWithdrawing(true);
    try {
      const { data: ud } = await supabase.auth.getUser();
      const user = ud?.user;
      if (!user) return;

      const { error } = await supabase
        .from("mentor_requests")
        .update({ status: "withdrawn" })
        .eq("requester_id", user.id)
        .eq("mentor_id", withdrawMentor.id);
      if (error) throw error;

      setRequestStatus(prev => ({ ...prev, [withdrawMentor.id]: "withdrawn" }));
      setWithdrawMentor(null);
      try {
        window.dispatchEvent(new CustomEvent("app:toast", {
          detail: { message: t("mentorship.withdraw_done", "Request withdrawn.") },
        }));
      } catch { /* ignore */ }
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : t("requests.update_failed", "Could not update the request."));
    } finally {
      setWithdrawing(false);
    }
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
      if (q && !`${o.title} ${o.description} ${o.provider} ${o.recommendedBy}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeCategory, searchQuery]);

  const reasonLength = reason.trim().length;
  const reasonValid = reasonLength >= MIN_REASON_LENGTH;

  return (
    <div dir={dir} className={`min-h-screen ${shellCls}`}>
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/"
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 ${outlineBtn} ${focusRing}`}>
            <ArrowLeft size={15} className="rtl:rotate-180" /> {t("mentorship.back_home", "Back to home")}
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {signedIn && (
              <Link href="/mentorship/requests"
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  pendingIncoming > 0 ? savedBtn : outlineBtn
                } ${focusRing}`}>
                <Inbox size={15} />
                {pendingIncoming > 0
                  ? t("requests.pending_count", "{count} pending").replace("{count}", String(pendingIncoming))
                  : t("requests.link", "Requests")}
              </Link>
            )}

            <Link href="/mentorship/saved"
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              saved.length > 0 ? savedBtn : outlineBtn
            } ${focusRing}`}>
            <BookmarkCheck size={15} />
            {saved.length > 0
              ? t("mentorship.saved_count", "{count} saved").replace("{count}", String(saved.length))
              : t("mentorship.view_saved", "Saved")}
            </Link>
          </div>
        </div>

        {/* Page title. "Mentorship Hub" leads; the old h1 is now the standfirst. */}
        <div className="mb-8">
          <h1 className={`font-display text-3xl font-bold tracking-tight sm:text-4xl ${titleCls}`}>
            {t("mentorship.kicker", "Mentorship Hub")}
          </h1>
          <p className={`mt-2 max-w-2xl text-lg font-medium leading-snug sm:text-xl ${isLight ? "text-midnight-700" : "text-midnight-100"}`}>
            {t("mentorship.title", "Find mentors, lessons, and career support")}
          </p>
          <p className={`mt-3 max-w-2xl text-sm leading-relaxed ${mutedCls}`}>
            {t("mentorship.subtitle", "Connect with certified Sudanese professionals for resume reviews, career conversations, interview prep, referrals, and guided courses.")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* The one badge that carries meaning. Everything else here is text. */}
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              isLight ? "border-emerald-500/25 bg-emerald-50 text-emerald-700" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-400"
            }`}>
              <BadgeCheck size={13} /> {t("mentorship.certified_badge", "Certified")}
            </span>
            <MetaLine className={dimCls}
              items={[t("mentorship.badge_2", "Early access"), t("mentorship.badge_3", "Arabic + English")]} />
          </div>
        </div>

        {/* Filters. Pills are round because they are the clickable control here. */}
        <div className="mb-6">
          <p className={`mb-2 text-xs font-semibold uppercase tracking-wider ${dimCls}`}>
            {t("mentorship.filter_label", "Filter by")}
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const active = activeCategory === cat;
              const label = cat === "all"
                ? t("mentorship.cat_all", "All")
                : t(CATEGORY_META[cat].labelKey, CATEGORY_META[cat].fallback);
              return (
                <button key={cat} type="button" onClick={() => setActiveCategory(cat)} aria-pressed={active}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    active
                      ? isLight ? "border-midnight-900 bg-midnight-900 text-white" : "border-ivory-50 bg-ivory-50 text-midnight-900"
                      : isLight ? "border-ivory-300 bg-ivory-50 text-midnight-700 hover:border-amber-400" : "border-midnight-700 bg-midnight-800 text-midnight-200 hover:border-amber-400"
                  } ${focusRing}`}>
                  {cat !== "all" && CATEGORY_ICONS[cat]}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="w-full space-y-4 lg:w-[280px] lg:shrink-0">
            <div className={`rounded-2xl border p-5 ${cardCls}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={accentCls} />
                <p className={`text-xs font-semibold uppercase tracking-wider ${accentCls}`}>
                  {t("mentorship.certified_title", "Certified mentors")}
                </p>
              </div>
              <p className={`mt-2 text-xs leading-relaxed ${dimCls}`}>
                {t("mentorship.certified_body", "Every mentor is vetted for professional experience and commitment to supporting Sudanese makers.")}
              </p>
              <ul className="mt-4 space-y-2">
                {CATEGORY_KEYS.map((key) => (
                  <li key={key} className={`flex items-center gap-2 text-xs ${mutedCls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isLight ? "bg-amber-500" : "bg-amber-400"}`} />
                    {t(CATEGORY_META[key].labelKey, CATEGORY_META[key].fallback)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Only shown to people who have not built a portfolio yet.
                `=== false` rather than `!portfolioReady` so the nudge stays
                hidden while the check is still in flight. */}
            {/* Becoming a mentor had no entry point anywhere in the product. */}
            {!alreadyMentor && (
              <div className={`rounded-2xl border p-5 ${cardCls}`}>
                <div className="flex items-center gap-2">
                  <UserPlus size={15} className={accentCls} />
                  <p className={`text-xs font-semibold uppercase tracking-wider ${accentCls}`}>
                    {t("apply.card_title", "Become a mentor")}
                  </p>
                </div>
                <p className={`mt-2 text-xs leading-relaxed ${dimCls}`}>
                  {t("apply.card_body", "Been where these makers want to go? Apply to join the mentor network.")}
                </p>
                <Link href="/mentorship/apply"
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${primaryBtn} ${focusRing}`}>
                  {t("apply.cta", "Apply to be a Mentor")} <ArrowRight size={15} className="rtl:rotate-180" />
                </Link>
              </div>
            )}

            {portfolioReady === false && (
              <div className={`rounded-2xl border p-5 ${cardCls}`}>
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className={accentCls} />
                  <p className={`text-xs font-semibold uppercase tracking-wider ${accentCls}`}>
                    {t("mentorship.tip_title", "Get matched faster")}
                  </p>
                </div>
                <p className={`mt-2 text-xs leading-relaxed ${dimCls}`}>
                  {t("mentorship.tip_body", "Complete your portfolio so mentors can see your skills, projects, and goals before your first session.")}
                </p>
                {/* Goes to the portfolio builder (skills + projects), not account settings. */}
                <Link href="/profile/create"
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${primaryBtn} ${focusRing}`}>
                  {t("mentorship.cta_profile", "Build My Portfolio")} <ArrowRight size={15} className="rtl:rotate-180" />
                </Link>
              </div>
            )}
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 relative">
              <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dimCls}`} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t("mentorship.search_placeholder", "Search mentors, topics, or skills…")}
                className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-150 ${inputCls} ${focusRing}`}
              />
            </div>

            <div className={`mb-4 flex gap-1 rounded-xl border p-1 ${isLight ? "border-ivory-300 bg-ivory-200/50" : "border-midnight-700 bg-midnight-900"}`}>
              {([
                { key: "mentors" as const, label: t("mentorship.tab_mentors", "Mentors"), icon: <GraduationCap size={13} /> },
                { key: "offerings" as const, label: t("mentorship.tab_offerings", "Programs & Lessons"), icon: <BookOpen size={13} /> },
              ]).map(({ key, label, icon }) => (
                <button key={key} type="button" onClick={() => setActiveTab(key)}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                    activeTab === key
                      ? isLight ? "bg-ivory-50 text-midnight-900 shadow-sm" : "bg-midnight-700 text-ivory-50"
                      : isLight ? "text-slate-500 hover:text-midnight-700" : "text-midnight-400 hover:text-midnight-200"
                  } ${focusRing}`}>
                  {icon}
                  <span>{label}</span>
                  <span className={activeTab === key ? "" : "opacity-60"}>
                    ({key === "mentors" ? filteredMentors.length : filteredOfferings.length})
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
                  {filteredMentors.map(mentor => {
                    const isSaved = savedIds.has(mentor.id);
                    const status = requestStatus[mentor.id];
                    const isPending = status === "pending";
                    const isAccepted = status === "accepted";
                    return (
                      <article key={mentor.id} className={`rounded-2xl border p-5 transition-all duration-150 ${cardHover} ${cardCls}`}>
                        <div className="flex items-start gap-4">
                          <MentorAvatar name={mentor.name} isLight={isLight} />
                          <div className="min-w-0 flex-1">
                            <h3 className={`text-base font-semibold ${titleCls}`}>{mentor.name}</h3>
                            <p className={`mt-1 text-sm ${mutedCls}`}>{mentor.bio}</p>

                            <div className={`mt-3 flex items-center gap-1.5 text-xs ${dimCls}`}>
                              <MapPin size={13} className={accentCls} />
                              {mentor.location}
                            </div>

                            {/* Skills and categories as text, not bubbles. */}
                            <MetaLine className={`mt-2 ${mutedCls}`} items={mentor.tags} />
                            <MetaLine className={`mt-1 ${dimCls}`}
                              items={mentor.categories.map(cat => t(CATEGORY_META[cat].labelKey, CATEGORY_META[cat].fallback))} />

                            <div className="mt-4 flex flex-wrap gap-2">
                              {isAccepted ? (
                                <span className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold ${
                                  isLight ? "border-emerald-500/25 bg-emerald-50 text-emerald-700" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-400"
                                }`}>
                                  <Check size={13} /> {t("mentorship.cta_accepted", "Accepted")}
                                </span>
                              ) : isPending ? (
                                /* Clickable so a request can be withdrawn from here,
                                   rather than only from the requests page. */
                                <button type="button" onClick={() => setWithdrawMentor(mentor)}
                                  title={t("mentorship.withdraw_hint", "Click to withdraw")}
                                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors ${savedBtn} ${focusRing}`}>
                                  <Check size={13} /> {t("mentorship.cta_requested", "Requested")}
                                </button>
                              ) : (
                                <button type="button" onClick={() => openRequest(mentor)}
                                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${primaryBtn} ${focusRing}`}>
                                  {t("mentorship.cta_request", "Request Session")}
                                </button>
                              )}
                              <button type="button" onClick={() => handleToggleSave(toSavedMentor(mentor))}
                                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                                  isSaved ? savedBtn : outlineBtn
                                } ${focusRing}`}>
                                {isSaved ? <BookmarkCheck size={13} /> : <BookmarkPlus size={13} />}
                                {isSaved ? t("mentorship.saved", "Saved") : t("mentorship.save", "Save")}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            ) : filteredOfferings.length === 0 ? (
              <div className={`rounded-2xl border p-10 text-center ${cardCls}`}>
                <BookOpen size={32} className={`mx-auto mb-4 ${dimCls}`} />
                <p className={`font-semibold ${titleCls}`}>{t("mentorship.no_offerings", "No programs match your filters.")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOfferings.map((offering: MentorshipOffering) => {
                  const isSaved = savedIds.has(offering.id);
                  return (
                    <article key={offering.id} className={`rounded-2xl border p-5 transition-all duration-150 ${cardHover} ${cardCls}`}>
                      <div className="flex items-start gap-4">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          isLight ? "bg-amber-50 text-amber-800" : "bg-amber-900/30 text-amber-200"
                        }`}>
                          {CATEGORY_ICONS[offering.category]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`text-base font-semibold ${titleCls}`}>{offering.title}</h3>
                          <MetaLine className={`mt-1 ${dimCls}`}
                            items={[offering.provider, offering.format, offering.duration, offering.cost]} />
                          <p className={`mt-2 text-sm ${mutedCls}`}>{offering.description}</p>

                          {/* The mentor's own verdict — the reason this is listed at all. */}
                          <div className={`mt-3 rounded-xl border p-3 ${isLight ? "border-ivory-200 bg-ivory-100/60" : "border-midnight-700 bg-midnight-900/60"}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <RatingStars rating={offering.rating} label={offering.title} />
                              <span className={`text-xs font-medium ${isLight ? "text-midnight-700" : "text-midnight-200"}`}>
                                {t("mentorship.recommended_by", "Recommended by")} {offering.recommendedBy}
                              </span>
                            </div>
                            <p className={`mt-1.5 text-xs leading-relaxed italic ${mutedCls}`}>
                              &ldquo;{offering.review}&rdquo;
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <a href={offering.url} target="_blank" rel="noopener noreferrer"
                              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${primaryBtn} ${focusRing}`}>
                              {t("mentorship.cta_access", "Access")}
                              <ExternalLink size={13} />
                            </a>
                            <button type="button" onClick={() => handleToggleSave(toSavedOffering(offering))}
                              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                                isSaved ? savedBtn : outlineBtn
                              } ${focusRing}`}>
                              {isSaved ? <BookmarkCheck size={13} /> : <BookmarkPlus size={13} />}
                              {isSaved ? t("mentorship.saved", "Saved") : t("mentorship.save", "Save")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Withdraw confirmation ─────────────────────────────────────────── */}
      {withdrawMentor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog" aria-modal="true" aria-labelledby="withdraw-title">
          <div className={`w-full max-w-md rounded-2xl border p-6 ${isLight ? "border-ivory-300 bg-ivory-50" : "border-midnight-700 bg-midnight-900"}`}>
            <h2 id="withdraw-title" className={`text-base font-bold ${titleCls}`}>
              {t("mentorship.withdraw_title", "Withdraw your request?")}
            </h2>
            <p className={`mt-2 text-sm leading-relaxed ${mutedCls}`}>
              {t("mentorship.withdraw_body", "Your request to {name} will be withdrawn. You can send a new one later.")
                .replace("{name}", withdrawMentor.name)}
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={confirmWithdraw} disabled={withdrawing}
                className={`flex-1 cursor-pointer rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${primaryBtn} ${focusRing}`}>
                {withdrawing ? t("mentorship.withdraw_working", "Withdrawing…") : t("mentorship.withdraw_yes", "Yes, withdraw")}
              </button>
              <button type="button" onClick={() => setWithdrawMentor(null)} disabled={withdrawing}
                className={`flex-1 cursor-pointer rounded-xl border px-5 py-3 text-sm font-medium transition-colors ${outlineBtn} ${focusRing}`}>
                {t("mentorship.withdraw_no", "No, keep it")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request session modal ─────────────────────────────────────────── */}
      {requestMentor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog" aria-modal="true" aria-labelledby="request-title">
          <div className={`w-full max-w-lg rounded-2xl border p-6 ${isLight ? "border-ivory-300 bg-ivory-50" : "border-midnight-700 bg-midnight-900"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="request-title" className={`text-base font-bold ${titleCls}`}>
                  {t("mentorship.request_title", "Request a session with")} {requestMentor.name}
                </h2>
                <p className={`mt-1 text-xs leading-relaxed ${mutedCls}`}>
                  {t("mentorship.request_help", "Mentors volunteer their time. Tell them what you need help with so they can prepare — vague requests usually go unanswered.")}
                </p>
              </div>
              <button type="button" onClick={() => setRequestMentor(null)}
                aria-label={t("mentorship.request_cancel", "Cancel")}
                className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border ${outlineBtn} ${focusRing}`}>
                <X size={15} />
              </button>
            </div>

            <div className="mt-5">
              <label htmlFor="request-reason" className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${accentCls}`}>
                {t("mentorship.request_reason_label", "Why are you reaching out?")} *
              </label>
              <textarea
                id="request-reason"
                value={reason}
                onChange={e => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
                rows={5}
                autoFocus
                placeholder={t("mentorship.request_reason_placeholder", "What are you working on, what are you stuck on, and what would a good session look like for you?")}
                className={`w-full resize-none rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none ${inputCls} ${focusRing}`}
              />
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className={reasonValid ? mutedCls : accentCls}>
                  {reasonValid
                    ? t("mentorship.request_ready", "Ready to send")
                    : t("mentorship.request_min", "At least {n} characters").replace("{n}", String(MIN_REASON_LENGTH))}
                </span>
                <span className={dimCls}>{reasonLength}/{MAX_REASON_LENGTH}</span>
              </div>
            </div>

            {!signedIn && (
              <p className={`mt-4 rounded-xl border px-4 py-3 text-xs ${isLight ? "border-amber-200 bg-amber-50 text-amber-800" : "border-amber-700/50 bg-amber-900/30 text-amber-200"}`}>
                {t("mentorship.request_signin", "Please sign in to request a session.")}{" "}
                <Link href="/auth/signin" className="font-semibold underline underline-offset-2">
                  {t("header.sign_in", "Sign In")}
                </Link>
              </p>
            )}

            {requestError && (
              <p role="alert" className={`mt-4 rounded-xl px-4 py-3 text-xs ${isLight ? "bg-red-50 text-red-700" : "bg-red-500/10 text-red-300"}`}>
                {requestError}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={submitRequest} disabled={!reasonValid || submitting || !signedIn}
                className={`flex-1 cursor-pointer rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${primaryBtn} ${focusRing}`}>
                {submitting ? t("mentorship.request_sending", "Sending…") : t("mentorship.request_send", "Send request")}
              </button>
              <button type="button" onClick={() => setRequestMentor(null)}
                className={`cursor-pointer rounded-xl border px-5 py-3 text-sm font-medium transition-colors ${outlineBtn} ${focusRing}`}>
                {t("mentorship.request_cancel", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
