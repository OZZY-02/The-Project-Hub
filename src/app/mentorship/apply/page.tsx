"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "../../../lib/i18n";
import { useTheme } from "../../../lib/theme";
import supabase from "../../../lib/supabaseClient";
import { CATEGORY_KEYS, CATEGORY_META, type MentorCategoryKey } from "../../../lib/mentorship-data";
import { MAX_RESUME_BYTES, uploadMentorResume } from "../../../lib/storage";
import {
  ArrowLeft, BadgeCheck, Check, Clock, FileText, Loader2, Lock, Plus, Upload, X,
} from "lucide-react";

const MIN_MOTIVATION = 80;
const MAX_MOTIVATION = 1000;

const AVAILABILITY_OPTIONS = [
  "1–2 hours a week",
  "3–5 hours a week",
  "5+ hours a week",
  "Depends on the project",
];

const LANGUAGE_OPTIONS = ["Arabic", "English", "Other"];

type ApplicationStatus = "pending" | "approved" | "rejected" | "withdrawn";

export default function MentorApplyPage() {
  const { t, locale } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [alreadyMentor, setAlreadyMentor] = useState(false);
  const [existingStatus, setExistingStatus] = useState<ApplicationStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [years, setYears] = useState("");
  const [location, setLocation] = useState("");
  /** One field for whichever link they have — LinkedIn, GitHub, or a site. */
  const [profileLink, setProfileLink] = useState("");
  const [categories, setCategories] = useState<MentorCategoryKey[]>([]);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [availability, setAvailability] = useState("");
  const [motivation, setMotivation] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  /* ── Midnight & Amber palette ── */
  const shellCls   = isLight ? "bg-ivory-100 text-midnight-700" : "bg-midnight-950 text-midnight-100";
  const cardCls    = isLight ? "border-ivory-300 bg-ivory-50 shadow-sm" : "border-midnight-700 bg-midnight-800";
  const titleCls   = isLight ? "text-midnight-900" : "text-ivory-50";
  const mutedCls   = isLight ? "text-slate-500" : "text-midnight-300";
  const dimCls     = isLight ? "text-slate-400" : "text-midnight-400";
  const accentCls  = isLight ? "text-amber-600" : "text-amber-400";
  const primaryBtn = isLight ? "bg-midnight-900 text-white hover:bg-midnight-700" : "bg-ivory-50 text-midnight-900 hover:bg-ivory-200";
  const outlineBtn = isLight ? "border-ivory-300 text-midnight-700 hover:border-ivory-400" : "border-midnight-700 text-midnight-200 hover:border-midnight-600";
  const chosenCls  = isLight ? "border-midnight-900 bg-midnight-900 text-white" : "border-ivory-50 bg-ivory-50 text-midnight-900";
  const focusRing  = "focus:outline-none focus:ring-2 focus:ring-amber-400";
  const inputCls   = `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
    isLight ? "border-ivory-300 bg-ivory-50 text-midnight-900 placeholder-slate-400"
            : "border-midnight-700 bg-midnight-800 text-ivory-50 placeholder-midnight-400"
  } ${focusRing}`;
  const labelCls = `mb-1.5 block text-xs font-semibold uppercase tracking-wider ${accentCls}`;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: ud } = await supabase.auth.getUser();
        const user = ud?.user ?? null;
        if (!mounted) return;
        setUserId(user?.id ?? null);
        if (!user) return;

        setEmail(user.email ?? "");

        // Prefill from the profile so nobody retypes what we already know.
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name,last_name,major_field,location_city,location_country,is_mentor")
          .eq("id", user.id)
          .single();

        if (!mounted) return;
        if (profile) {
          setAlreadyMentor(Boolean(profile.is_mentor));
          setFullName(`${profile.first_name || ""} ${profile.last_name || ""}`.trim());
          setLocation([profile.location_city, profile.location_country].filter(Boolean).join(", "));
          if (profile.major_field) setExpertise([profile.major_field]);
        }

        try {
          const { data: application } = await supabase
            .from("mentor_applications")
            .select("status")
            .eq("user_id", user.id)
            .maybeSingle();
          if (mounted && application) setExistingStatus(application.status as ApplicationStatus);
        } catch {
          /* table not migrated yet — the form still renders */
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter(item => item !== value) : [...list, value];

  const addExpertise = () => {
    const value = expertiseInput.trim();
    if (!value || expertise.some(e => e.toLowerCase() === value.toLowerCase())) return;
    setExpertise(prev => [...prev, value]);
    setExpertiseInput("");
  };

  const pickResume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setResumeError(null);
    if (!file) { setResume(null); return; }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setResumeError(t("apply.resume_type_error", "Please upload a PDF."));
      setResume(null);
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setResumeError(t("apply.resume_size_error", "That file is over 5 MB. Please upload a smaller PDF."));
      setResume(null);
      return;
    }
    setResume(file);
  };

  const motivationLength = motivation.trim().length;
  const canSubmit =
    fullName.trim().length >= 2 &&
    email.includes("@") &&
    jobTitle.trim().length >= 2 &&
    years !== "" &&
    location.trim().length >= 2 &&
    resume !== null &&
    categories.length > 0 &&
    availability !== "" &&
    motivationLength >= MIN_MOTIVATION &&
    agreed;

  const submit = async () => {
    if (!canSubmit || !userId) return;
    setSubmitting(true);
    setError(null);
    try {
      // Upload before the insert: a required resume that failed to store would
      // leave an application a reviewer cannot act on.
      const resumePath = await uploadMentorResume(userId, resume!);

      const link = profileLink.trim();
      const isLinkedIn = /(^|\.)linkedin\.com([/:]|$)/i.test(link);

      // Upsert so re-applying after a rejection updates the same row rather
      // than tripping the UNIQUE constraint on user_id.
      const { error: submitError } = await supabase.from("mentor_applications").upsert({
        user_id: userId,
        full_name: fullName.trim(),
        contact_email: email.trim(),
        job_title: jobTitle.trim(),
        organisation: organisation.trim() || null,
        years_experience: Number(years),
        location: location.trim(),
        resume_path: resumePath,
        // One input, two columns: keep LinkedIn distinguishable for reviewers
        // rather than filing every link under portfolio_url.
        linkedin_url: isLinkedIn ? link : null,
        portfolio_url: isLinkedIn ? null : link,
        categories,
        expertise,
        languages,
        availability,
        motivation: motivation.trim(),
        agreed_to_guidelines: agreed,
        status: "pending",
      }, { onConflict: "user_id" });

      if (submitError) throw submitError;
      setDone(true);
      setExistingStatus("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("apply.failed", "Could not send your application."));
      setResumeError(null);
    } finally {
      setSubmitting(false);
    }
  };

  const Banner = ({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) => (
    <div className={`rounded-2xl border p-10 text-center ${cardCls}`}>
      <div className={`mx-auto mb-4 ${dimCls}`}>{icon}</div>
      <p className={`font-semibold ${titleCls}`}>{title}</p>
      <p className={`mt-2 text-sm ${mutedCls}`}>{body}</p>
      <Link href="/mentorship"
        className={`mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${primaryBtn} ${focusRing}`}>
        {t("mentorship.back_to_mentorship", "Back to mentorship")}
      </Link>
    </div>
  );

  return (
    <div dir={dir} className={`min-h-screen ${shellCls}`}>
      <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">

        <Link href="/mentorship"
          className={`mb-6 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 ${outlineBtn} ${focusRing}`}>
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {t("mentorship.back_to_mentorship", "Back to mentorship")}
        </Link>

        <div className="mb-8">
          <h1 className={`font-display text-3xl font-bold tracking-tight sm:text-4xl ${titleCls}`}>
            {t("apply.title", "Apply to be a mentor")}
          </h1>
          <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${mutedCls}`}>
            {t("apply.subtitle", "Mentors are vetted before they appear in the hub. Tell us about your experience and what you can offer — we review every application by hand.")}
          </p>
        </div>

        {loading ? (
          <div className={`flex items-center justify-center gap-2 rounded-2xl border p-12 ${cardCls}`}>
            <Loader2 size={20} className="animate-spin" />
            <span className={mutedCls}>{t("apply.loading", "Loading…")}</span>
          </div>
        ) : !userId ? (
          <div className={`rounded-2xl border p-10 text-center ${cardCls}`}>
            <Lock size={32} className={`mx-auto mb-4 ${dimCls}`} />
            <p className={`font-semibold ${titleCls}`}>{t("apply.signin_title", "Sign in to apply")}</p>
            <p className={`mt-2 text-sm ${mutedCls}`}>
              {t("apply.signin_body", "You need an account so we can link the application to your profile.")}
            </p>
            <Link href="/auth/signin"
              className={`mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${primaryBtn} ${focusRing}`}>
              {t("header.sign_in", "Sign In")}
            </Link>
          </div>
        ) : alreadyMentor ? (
          <Banner icon={<BadgeCheck size={32} className="mx-auto" />}
            title={t("apply.already_mentor_title", "You are already a mentor")}
            body={t("apply.already_mentor_body", "Your profile appears in the hub and you can receive session requests.")} />
        ) : done || existingStatus === "pending" ? (
          <Banner icon={<Clock size={32} className="mx-auto" />}
            title={t("apply.pending_title", "Application received")}
            body={t("apply.pending_body", "We review applications by hand. You will hear back by email at the address you gave us.")} />
        ) : (
          <div className="space-y-6">

            {/* ── About you ── */}
            <section className={`rounded-2xl border p-6 ${cardCls}`}>
              <h2 className={`mb-5 text-sm font-bold ${titleCls}`}>{t("apply.section_about", "About you")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="full-name" className={labelCls}>{t("apply.full_name", "Full name")} *</label>
                  <input id="full-name" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="contact-email" className={labelCls}>{t("apply.email", "Contact email")} *</label>
                  <input id="contact-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                  <p className={`mt-1 text-xs ${dimCls}`}>{t("apply.email_hint", "How we reach you about your application.")}</p>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="location" className={labelCls}>{t("apply.location", "Location")} *</label>
                  <input id="location" value={location} onChange={e => setLocation(e.target.value)}
                    placeholder={t("apply.location_placeholder", "City, country")} className={inputCls} />
                </div>
              </div>
            </section>

            {/* ── Experience ── */}
            <section className={`rounded-2xl border p-6 ${cardCls}`}>
              <h2 className={`mb-5 text-sm font-bold ${titleCls}`}>{t("apply.section_experience", "Your experience")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="job-title" className={labelCls}>{t("apply.job_title", "Current role")} *</label>
                  <input id="job-title" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                    placeholder={t("apply.job_title_placeholder", "e.g. Senior Product Designer")} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="organisation" className={labelCls}>{t("apply.organisation", "Company or organisation")}</label>
                  <input id="organisation" value={organisation} onChange={e => setOrganisation(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="years" className={labelCls}>{t("apply.years", "Years of experience")} *</label>
                  <input id="years" type="number" min={0} max={60} value={years}
                    onChange={e => setYears(e.target.value)} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="profile-link" className={labelCls}>
                    {t("apply.profile_link", "LinkedIn, portfolio, GitHub, or personal site")}
                  </label>
                  <input id="profile-link" value={profileLink} onChange={e => setProfileLink(e.target.value)}
                    placeholder="https://linkedin.com/in/… " className={inputCls} />
                  <p className={`mt-1 text-xs ${dimCls}`}>
                    {t("apply.link_hint", "Optional, but it helps us verify your background faster.")}
                  </p>
                </div>
              </div>

              {/* Resume — required, and the main artefact a reviewer reads. */}
              <div className="mt-4">
                <label className={labelCls}>{t("apply.resume", "Resume")} *</label>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={pickResume}
                  className="hidden"
                />
                {resume ? (
                  <div className={`flex items-center gap-3 rounded-xl border p-3 ${outlineBtn}`}>
                    <FileText size={18} className={accentCls} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${titleCls}`}>{resume.name}</p>
                      <p className={`text-xs ${dimCls}`}>{(resume.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button type="button"
                      onClick={() => { setResume(null); if (resumeInputRef.current) resumeInputRef.current.value = ""; }}
                      aria-label={t("apply.resume_remove", "Remove resume")}
                      className={`cursor-pointer rounded-lg border p-2 ${outlineBtn} ${focusRing}`}>
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => resumeInputRef.current?.click()}
                    className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm font-medium transition-colors ${outlineBtn} ${focusRing}`}>
                    <Upload size={16} />
                    {t("apply.resume_upload", "Upload your resume (PDF)")}
                  </button>
                )}
                <p className={`mt-1 text-xs ${resumeError ? "text-red-500" : dimCls}`}>
                  {resumeError ?? t("apply.resume_hint", "PDF only, up to 5 MB. Kept private and seen only by reviewers.")}
                </p>
              </div>

              <div className="mt-4">
                <label htmlFor="expertise" className={labelCls}>{t("apply.expertise", "Areas of expertise")}</label>
                <div className="flex gap-2">
                  <input id="expertise" value={expertiseInput}
                    onChange={e => setExpertiseInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addExpertise(); } }}
                    placeholder={t("apply.expertise_placeholder", "e.g. Product Management, React, Hiring")}
                    className={inputCls} />
                  <button type="button" onClick={addExpertise}
                    aria-label={t("apply.expertise_add", "Add")}
                    className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl ${primaryBtn} ${focusRing}`}>
                    <Plus size={15} />
                  </button>
                </div>
                {expertise.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {expertise.map(item => (
                      <span key={item} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${outlineBtn}`}>
                        {item}
                        <button type="button" onClick={() => setExpertise(prev => prev.filter(e => e !== item))}
                          aria-label={`${t("apply.expertise_remove", "Remove")} ${item}`}
                          className="cursor-pointer opacity-60 hover:opacity-100">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* ── What you offer ── */}
            <section className={`rounded-2xl border p-6 ${cardCls}`}>
              <h2 className={`mb-1 text-sm font-bold ${titleCls}`}>{t("apply.section_offer", "What you can offer")}</h2>
              <p className={`mb-5 text-xs ${mutedCls}`}>{t("apply.offer_hint", "Pick everything you would be happy to help with.")}</p>

              <label className={labelCls}>{t("apply.categories", "Support types")} *</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_KEYS.map(key => {
                  const active = categories.includes(key);
                  return (
                    <button key={key} type="button" aria-pressed={active}
                      onClick={() => setCategories(prev => toggle(prev, key))}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active ? chosenCls : outlineBtn
                      } ${focusRing}`}>
                      {t(CATEGORY_META[key].labelKey, CATEGORY_META[key].fallback)}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <label className={labelCls}>{t("apply.languages", "Languages you can mentor in")}</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map(lang => {
                    const active = languages.includes(lang);
                    return (
                      <button key={lang} type="button" aria-pressed={active}
                        onClick={() => setLanguages(prev => toggle(prev, lang))}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active ? chosenCls : outlineBtn
                        } ${focusRing}`}>
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="availability" className={labelCls}>{t("apply.availability", "Time you can volunteer")} *</label>
                <select id="availability" value={availability} onChange={e => setAvailability(e.target.value)} className={inputCls}>
                  <option value="">{t("apply.availability_placeholder", "Select…")}</option>
                  {AVAILABILITY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </section>

            {/* ── Motivation ── */}
            <section className={`rounded-2xl border p-6 ${cardCls}`}>
              <h2 className={`mb-5 text-sm font-bold ${titleCls}`}>{t("apply.section_motivation", "Why you want to mentor")}</h2>
              <textarea
                value={motivation}
                onChange={e => setMotivation(e.target.value.slice(0, MAX_MOTIVATION))}
                rows={6}
                placeholder={t("apply.motivation_placeholder", "What drew you to this, who you most want to help, and what you would bring to a first session.")}
                className={`${inputCls} resize-none leading-relaxed`}
              />
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className={motivationLength >= MIN_MOTIVATION ? mutedCls : accentCls}>
                  {motivationLength >= MIN_MOTIVATION
                    ? t("apply.motivation_ok", "Looks good")
                    : t("apply.motivation_min", "At least {n} characters").replace("{n}", String(MIN_MOTIVATION))}
                </span>
                <span className={dimCls}>{motivationLength}/{MAX_MOTIVATION}</span>
              </div>

              <label className={`mt-5 flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${outlineBtn}`}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500" />
                <span className={`text-xs leading-relaxed ${mutedCls}`}>
                  {t("apply.agreement", "I confirm the information above is accurate, and I agree to respond to requests I accept and to treat every maker with respect.")}
                </span>
              </label>
            </section>

            {error && (
              <p role="alert" className={`rounded-xl px-4 py-3 text-sm ${isLight ? "bg-red-50 text-red-700" : "bg-red-500/10 text-red-300"}`}>
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={submit} disabled={!canSubmit || submitting}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${primaryBtn} ${focusRing}`}>
                {submitting
                  ? <><Loader2 size={15} className="animate-spin" /> {t("apply.sending", "Sending…")}</>
                  : <><Check size={15} /> {t("apply.submit", "Submit application")}</>}
              </button>
              {!canSubmit && (
                <span className={`text-xs ${dimCls}`}>{t("apply.incomplete", "Fill in the required fields marked *")}</span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
