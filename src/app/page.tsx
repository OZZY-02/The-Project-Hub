"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  BadgeCheck,
  GraduationCap,
  Globe,
  Layers,
  Lightbulb,
  Lock,
  MapPin,
  Network,
  Play,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

import dynamic from "next/dynamic";
const CobeGlobe = dynamic(() => import("../components/ui/cobe-globe").then(m => ({ default: m.CobeGlobe })), { ssr: false });
import { InfiniteGrid } from "../components/ui/the-infinite-grid";
import supabase from "../lib/supabaseClient";
import { useTranslation } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { getProfileBuilderHref, isProfileComplete } from "../lib/utils";
import { fetchSampleProjects, type SampleProject } from "../lib/sample-projects";
import { CATEGORY_LABELS, pickHomeMentorshipCards } from "../lib/mentorship-data";

function TypingFeatureTitle({
  locale,
  className,
}: {
  locale: "en" | "ar";
  className?: string;
}) {
  const isArabic = locale === "ar";
  const prefix = isArabic ? "مصمم للصنّاع لا لـ" : "Built for makers, not ";
  const words = useMemo(
    () =>
      isArabic
        ? ["التصفح", "الضوضاء", "الإخفاء", "الفوضى"]
        : ["browsing", "noise", "being hidden", "clutter"],
    [isArabic]
  );

  const [wordIndex, setWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const isComplete = displayedText === currentWord;
    const isCleared = displayedText.length === 0;

    const delay = isDeleting ? 45 : isComplete ? 1200 : 80;

    const timer = window.setTimeout(() => {
      if (!isDeleting && !isComplete) {
        setDisplayedText(currentWord.slice(0, displayedText.length + 1));
        return;
      }
      if (!isDeleting && isComplete) {
        setIsDeleting(true);
        return;
      }
      if (isDeleting && !isCleared) {
        setDisplayedText(currentWord.slice(0, displayedText.length - 1));
        return;
      }
      setIsDeleting(false);
      setWordIndex((currentIndex) => (currentIndex + 1) % words.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [displayedText, isDeleting, wordIndex, words]);

  return (
    <h2 className={className}>
      <span>{prefix}</span>
      <span className="typing-accent">
        {displayedText || "\u00A0"}
        <span className="typing-caret" aria-hidden="true" />
      </span>
    </h2>
  );
}

export default function HomePage() {
  const { t, locale } = useTranslation();
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [sampleProjects, setSampleProjects] = useState<SampleProject[]>([]);
  const [mentorshipCards, setMentorshipCards] = useState<
    ReturnType<typeof pickHomeMentorshipCards>
  >([]);

  const isArabic = locale === "ar";
  const isLight = theme === "light";
  const dir = isArabic ? "rtl" : "ltr";
  const align = isArabic ? "text-right" : "text-left";

  const refetchProfile = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user || null;
      setUser(currentUser);
      if (!currentUser) { setProfileComplete(false); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_data_url,avatar_url,first_name,last_name,username,location_country,location_city,major_field,passion_sector,bio")
        .eq("id", currentUser.id)
        .single();
      setProfileComplete(isProfileComplete(profile));
    } catch (error) {
      console.warn("Failed to fetch profile", error);
      setProfileComplete(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => { if (!mounted) return; await refetchProfile(); })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setMentorshipCards(pickHomeMentorshipCards());
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const projects = await fetchSampleProjects(2);
      if (mounted) setSampleProjects(projects);
    })();
    return () => { mounted = false; };
  }, []);

  const shellClass = isLight
    ? "home-shell home-shell-light home-shell-clean min-h-screen text-slate-900"
    : "home-shell home-shell-dark home-shell-clean min-h-screen text-[#f5f7fb]";
  const titleClass = isLight ? "text-slate-900" : "text-white";
  const secondaryTextClass = isLight ? "text-slate-600" : "text-[#9eabc4]";
  const mutedTextClass = isLight ? "text-slate-500" : "text-[#6f7e9d]";

  const sectionClass = `home-section ${isLight ? "home-section-light" : "home-section-dark"}`;
  const primaryButtonClass = `home-btn ${isLight ? "home-btn-primary-light" : "home-btn-primary-dark"}`;
  const outlineButtonClass = `home-btn ${isLight ? "home-btn-secondary-light" : "home-btn-secondary-dark"}`;
  const pipelineCardClass = `home-pipeline-card ${isLight ? "home-pipeline-card-light" : "home-pipeline-card-dark"}`;

  const sectionTitleClass = isLight
    ? "font-display mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
    : "font-display mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl";

  const bubbleClass = isLight
    ? "rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
    : "rounded-2xl border border-white/12 bg-slate-800/95 text-white shadow-lg";

  const mentorCardClass = isLight ? "home-mini-card-light" : "home-mini-card-dark";

  const portfolioBuilderHref = getProfileBuilderHref(user?.id ?? null, profileComplete);

  return (
    <div dir={dir} className={shellClass}>
      <InfiniteGrid isLight={isLight} className="pointer-events-none opacity-[0.22]" />
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-2 px-6 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-14">

        {/* ── HERO (no box) ── */}
        <section className="home-hero-shell">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] items-center gap-8 lg:gap-4 w-full">
            {/* Left */}
            <div className={align}>
              <div className="home-proofline">
                <span className="home-proof-bulb" aria-hidden="true">
                  <Lightbulb size={15} />
                </span>
                <span>{t("home.hero_proofline", "For the ambitious leaders of tomorrow")}</span>
              </div>

              <h1 className={`home-hero-title mt-8 max-w-5xl ${titleClass}`}>
                <span className="home-hero-skillline block">{t("site.title", "The Project Hub")}</span>
              </h1>

              {/* Floating animated bubbles */}
              <div className="home-hero-bubbles" aria-hidden="true">
                <span className="home-hero-bubble bubble-one">{t("home.pill_portfolio", "Build your portfolio")}</span>
                <span className="home-hero-bubble bubble-two">{t("home.pill_mentor", "Find your mentor")}</span>
                <span className="home-hero-bubble bubble-three">{t("home.pill_project", "Join a project")}</span>
              </div>

              <p className={`mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl sm:leading-8 ${secondaryTextClass}`}>
                {t("home.hero_body_line_1", "Build a profile in Arabic or English that shows your skills, projects, and what you're working toward.")}
                <br />
                {t("home.hero_body_line_2", "Connect with makers in your city, mentors in the diaspora, and companies looking for talent like yours.")}
              </p>

              {/* CTA buttons */}
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="#platform-features" className={primaryButtonClass}>
                  {t("home.cta_portfolio", "Build your Portfolio")}
                  <ArrowRight size={16} className="ms-2 rtl:rotate-180" />
                </Link>
                <Link href="/mentorship" className={outlineButtonClass}>
                  {t("home.cta_mentor", "Find a Mentor")}
                </Link>
                <Link href="/matching" className={outlineButtonClass}>
                  {t("home.cta_projects", "Browse Projects")}
                </Link>
              </div>

              {/* Meta row */}
              <div className={`mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm ${mutedTextClass}`}>
                <div className="home-inline-meta">
                  <BadgeCheck size={14} />
                  <span>{t("home.inline_meta_1", "Free to Join")}</span>
                </div>
                <div className="home-inline-meta">
                  <Globe size={14} />
                  <span>{t("home.inline_meta_2", "English & Arabic")}</span>
                </div>
                <div className="home-inline-meta">
                  <Lock size={14} />
                  <span>{t("home.inline_meta_3", "Secure")}</span>
                </div>
              </div>
            </div>

            {/* Right: Globe */}
            <div className="hidden lg:flex items-center justify-center py-4">
              <CobeGlobe
                markers={[{ id: "sudan", location: [15.5, 32.5], label: "Sudan" }]}
                dark={isLight ? 1 : 0}
                baseColor={isLight ? [1, 1, 1] : [0.04, 0.04, 0.06]}
                glowColor={isLight ? [0.6, 0.7, 1.0] : [0.88, 0.90, 0.95]}
                markerColor={isLight ? [1, 1, 1] : [0.04, 0.04, 0.06]}
                mapBrightness={isLight ? 10 : 11}
                markerSize={0.05}
                markerElevation={0.01}
                diffuse={isLight ? 1.2 : 1.5}
                speed={0.004}
                theta={0.25}
                mapSamples={16000}
                className="w-[320px]"
              />
            </div>
          </div>
        </section>

        {/* ── PROBLEM + SOLUTION ── */}
        <section className={sectionClass}>
          <h2 className={`text-center text-2xl font-semibold tracking-tight sm:text-3xl ${titleClass}`}>
            {t("home.problem_question", "Do you find yourself in a similar situation?")}
          </h2>

          {/* Characters row — all 3 visible simultaneously */}
          <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-8">
            {([
              { img: "/images/woman-char.png", bubble: t("home.char_bubble_1", "I don't have experience yet.") },
              { img: "/images/man-char.png", bubble: t("home.char_bubble_2", "Where do I start?") },
              { img: "/images/glasses-char.png", bubble: t("home.char_bubble_3", "I have skills, no network.") },
            ] as { img: string; bubble: string }[]).map(({ img, bubble }, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                {/* Speech bubble */}
                <div className={`relative rounded-2xl px-3 py-2.5 text-xs font-semibold leading-snug text-center max-w-[160px] ${bubbleClass}`}>
                  {bubble}
                  <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                      bottom: -9, width: 0, height: 0,
                      borderLeft: "7px solid transparent",
                      borderRight: "7px solid transparent",
                      borderTop: `9px solid ${isLight ? "white" : "rgb(30,41,59)"}`,
                    }}
                    aria-hidden="true"
                  />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  draggable={false}
                  style={{ height: 160, width: "auto", objectFit: "contain", display: "block" }}
                />
              </div>
            ))}
          </div>

          {/* Solution title */}
          <h2 className={`mt-16 text-center text-2xl font-semibold tracking-tight sm:text-3xl ${titleClass}`}>
            {t("home.solution_question", "Then this is the right place to be")}
          </h2>

          {/* 5-col solution grid — symmetric flanking cols (1fr each side) guarantee hub is always centered */}
          <div className="mt-10 w-full grid grid-cols-1 lg:grid-cols-[1fr_100px_200px_100px_1fr] gap-y-4 lg:gap-y-4 lg:gap-x-0">

            {/* ── Box 01 — AI Portfolio ── */}
            <div className={`lg:col-start-1 lg:row-start-1 ${pipelineCardClass}`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isLight ? "bg-[#5b7fdb]/10 text-[#5b7fdb]" : "bg-[#8fb7ff]/15 text-[#8fb7ff]"}`}>
                <Layers size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold leading-snug ${titleClass}`}>
                  {t("home.pipeline_1", "AI customizable Portfolio")}
                </h3>
                <p className={`mt-0.5 text-xs leading-5 ${secondaryTextClass}`}>
                  {t("home.pipeline_1_desc", "Showcase skills, projects & goals")}
                </p>
              </div>
            </div>

            {/* ── CSS connector (col 2, spans all 3 rows) ── */}
            {/* Box centers at 15/50/85%. Hub (self-centered square) top≈27%, bottom≈73% */}
            <div className="hidden lg:block lg:col-start-2 lg:row-start-1 lg:row-span-3 relative" aria-hidden="true">
              {/* Top branch — horizontal from box-1 center to turn point */}
              <div className={`absolute h-px ${isLight ? "bg-slate-200" : "bg-slate-700"}`} style={{top:"15%",left:0,width:"62%"}} />
              {/* Top branch — vertical from box-1 center down to hub top */}
              <div className={`absolute w-px ${isLight ? "bg-slate-200" : "bg-slate-700"}`} style={{left:"62%",top:"15%",height:"12%"}} />
              {/* Top branch — horizontal from turn point to hub left edge, with arrow */}
              <div className="absolute flex items-center" style={{top:"27%",left:"62%",right:0,transform:"translateY(-50%)"}}>
                <div className={`flex-1 h-px ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />
                <ArrowRight size={9} className={`shrink-0 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
              </div>

              {/* Middle branch — straight across with arrow */}
              <div className="absolute flex items-center" style={{top:"50%",left:0,right:0,transform:"translateY(-50%)"}}>
                <div className={`flex-1 h-px ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />
                <ArrowRight size={9} className={`shrink-0 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
              </div>

              {/* Bottom branch — horizontal from box-3 center to turn point */}
              <div className={`absolute h-px ${isLight ? "bg-slate-200" : "bg-slate-700"}`} style={{top:"85%",left:0,width:"62%"}} />
              {/* Bottom branch — vertical from hub bottom up to box-3 center */}
              <div className={`absolute w-px ${isLight ? "bg-slate-200" : "bg-slate-700"}`} style={{left:"62%",top:"73%",height:"12%"}} />
              {/* Bottom branch — horizontal from turn point to hub left edge, with arrow */}
              <div className="absolute flex items-center" style={{top:"73%",left:"62%",right:0,transform:"translateY(-50%)"}}>
                <div className={`flex-1 h-px ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />
                <ArrowRight size={9} className={`shrink-0 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
              </div>
            </div>

            {/* ── Box 02 — Smart Matches ── */}
            <div className={`lg:col-start-1 lg:row-start-2 ${pipelineCardClass}`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isLight ? "bg-[#0d9488]/10 text-[#0d9488]" : "bg-[#18c29c]/15 text-[#18c29c]"}`}>
                <Zap size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold leading-snug ${titleClass}`}>
                  {t("home.pipeline_2", "Smart Matches")}
                </h3>
                <p className={`mt-0.5 text-xs leading-5 ${secondaryTextClass}`}>
                  {t("home.pipeline_2_desc", "Connect with the right people & projects")}
                </p>
              </div>
            </div>

            {/* ── Box 03 — Mentorship Programs ── */}
            <div className={`lg:col-start-1 lg:row-start-3 ${pipelineCardClass}`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isLight ? "bg-[#e86c00]/10 text-[#e86c00]" : "bg-[#a78bfa]/15 text-[#a78bfa]"}`}>
                <GraduationCap size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold leading-snug ${titleClass}`}>
                  {t("home.pipeline_mentorship", "Mentorship Programs")}
                </h3>
                <p className={`mt-0.5 text-xs leading-5 ${secondaryTextClass}`}>
                  {t("home.pipeline_mentorship_desc", "Guided by people who've been there")}
                </p>
              </div>
            </div>

            {/* ── Hub card (col 3, rows 1–3) ── */}
            <div className={`lg:col-start-3 lg:row-start-1 lg:row-span-3 self-center aspect-square w-full flex flex-col items-center justify-center rounded-2xl p-5 text-center ${isLight ? "home-hub-card-light" : "home-hub-card-dark"}`}>
              <div className={`inline-flex items-center gap-1.5 rounded-2xl border px-4 py-3 ${isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-white/5"}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${isLight ? "bg-[#5b7fdb]" : "bg-[#8fb7ff]"}`} />
                <span className={`h-2.5 w-2.5 rounded-full ${isLight ? "bg-[#847770]" : "bg-[#dfe8ff]"}`} />
                <span className="h-2.5 w-2.5 rounded-full bg-[#18c29c]" />
              </div>
              <h3 className={`mt-4 font-display text-2xl font-bold ${isLight ? "text-[#2563eb]" : "text-[#8fb7ff]"}`}>
                {t("site.title", "The Project Hub")}
              </h3>
              <p className={`mt-2 text-xs leading-5 max-w-[160px] ${secondaryTextClass}`}>
                {t("home.pipeline_3_desc", "Your platform for real connections")}
              </p>
            </div>

            {/* ── Hub → Person connector (col 4, rows 1–3) ── */}
            <div className="hidden lg:flex lg:col-start-4 lg:row-start-1 lg:row-span-3 items-center px-2">
              <div className={`flex-1 h-px ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />
              <ArrowRight size={9} className={`shrink-0 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
            </div>

            {/* ── Person (col 5 = right 1fr, rows 1–3) — centered in its symmetric column ── */}
            <div className="lg:col-start-5 lg:row-start-1 lg:row-span-3 flex flex-col items-center justify-center gap-1">
              <p className={`text-base font-bold tracking-wide ${titleClass}`}>
                {t("home.pipeline_you", "You")}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cartoon-person-nobg.png"
                alt=""
                draggable={false}
                className="h-52 w-auto object-contain"
              />
            </div>
          </div>
        </section>

        {/* ── WHAT THE PLATFORM DOES (outside box) ── */}
        <div id="platform-features" className={`scroll-mt-24 ${align} px-2`}>
          <p className="home-platform-label">
            {t("home.platform_label", "What the platform does")}
          </p>
          <TypingFeatureTitle locale={locale} className={sectionTitleClass} />
        </div>

        {/* ── PORTFOLIO ── */}
        <section id="portfolio" className={sectionClass}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className={align}>
              <h2 className={`text-2xl font-semibold tracking-tight leading-tight sm:text-3xl ${titleClass}`}>
                {t("home.portfolio_title", "Start by making a portfolio first")}
              </h2>
              <p className={`mt-4 text-sm font-semibold ${titleClass}`}>
                {t("home.portfolio_subtitle", "Build a customizable portfolio, powered by AI")}
              </p>
              <p className={`mt-2 text-sm leading-6 ${secondaryTextClass}`}>
                {t("home.portfolio_body", "LinkedIn profiles are lame, you don't know how to code or don't want to spend time to create your own portfolio.")}
              </p>
              {!user || !profileComplete ? (
                <Link href="/profile/create" className={`mt-6 ${outlineButtonClass}`}>
                  {t("home.portfolio_cta", "Build your profile")} <ArrowRight size={14} className="ms-1.5" />
                </Link>
              ) : (
                <Link href="/profile/settings" className={`mt-6 ${outlineButtonClass}`}>
                  {t("header.edit_profile", "Edit Profile")} <ArrowRight size={14} className="ms-1.5" />
                </Link>
              )}
            </div>

            {/* Browser window mockup */}
            <div className={`overflow-hidden rounded-2xl border shadow-sm ${isLight ? "border-slate-200" : "border-white/10"}`}>
              {/* Title bar */}
              <div className={`flex items-center gap-2 border-b px-4 py-3 ${isLight ? "border-slate-900/8 bg-slate-100/80" : "border-white/8 bg-white/5"}`}>
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <span className="h-3 w-3 rounded-full bg-green-400/80" />
                <div className={`ml-2 flex-1 rounded-full px-3 py-1 text-xs ${isLight ? "bg-white text-slate-400" : "bg-white/10 text-white/30"}`}>
                  theprojecthub.io
                </div>
                <div className={`h-5 w-5 rounded ${isLight ? "bg-slate-200" : "bg-white/8"}`} />
              </div>
              {/* Content */}
              <div className={`flex flex-col items-center justify-center gap-3 py-16 ${isLight ? "bg-slate-50/60" : "bg-white/2"}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${isLight ? "border-slate-900/15 bg-white" : "border-white/15 bg-white/8"}`}>
                  <Play size={20} className={mutedTextClass} />
                </div>
                <p className={`text-sm ${mutedTextClass}`}>{t("home.screen_recording", "Screen Recording")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROJECTS ── */}
        <section id="projects" className={sectionClass}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className={align}>
              <h2 className={`text-2xl font-semibold tracking-tight leading-tight sm:text-3xl ${titleClass}`}>
                {t("home.projects_title", "Ready to create impact and work on projects?")}
              </h2>
              <p className={`mt-4 text-sm leading-6 ${secondaryTextClass}`}>
                {t("home.projects_body_1", "Have a project but need people to work on it.")}{" "}
                <strong className={titleClass}>OR</strong>
              </p>
              <p className={`mt-2 text-sm leading-6 ${secondaryTextClass}`}>
                {t("home.projects_body_2", "Have the experience but no projects or the budget to work on one")}
              </p>
              <Link href="/matching" className={`mt-6 ${outlineButtonClass}`}>
                {t("home.projects_cta", "Explore Projects")} <ArrowRight size={14} className="ms-1.5" />
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              {sampleProjects.length > 0 ? (
                sampleProjects.map((project) => (
                  <Link
                    key={project.id}
                    href="/matching"
                    className={`block rounded-2xl border p-5 transition-all duration-150 hover:-translate-y-0.5 ${isLight ? "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md" : "border-white/10 bg-white/3 hover:bg-white/5"}`}
                  >
                    <p className={`text-sm font-semibold ${titleClass}`}>{project.title}</p>
                    {project.subtitle && (
                      <p className={`mt-1 line-clamp-2 text-xs leading-relaxed ${secondaryTextClass}`}>{project.subtitle}</p>
                    )}
                    {project.location && (
                      <p className={`mt-2 flex items-center gap-1.5 text-xs ${mutedTextClass}`}>
                        <MapPin size={12} aria-hidden="true" />
                        {project.location}
                      </p>
                    )}
                    {project.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${isLight ? "border-slate-900/10 bg-white text-slate-600" : "border-white/10 bg-white/5 text-[#9eabc4]"}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))
              ) : (
                [0, 1].map((i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-6 h-28 flex items-center justify-center ${isLight ? "border-slate-900/10 bg-slate-50/60" : "border-white/10 bg-white/3"}`}
                  >
                    <span className={`text-sm ${mutedTextClass}`}>
                      {t("home.projects_empty_preview", "Post a project on the matching hub to see it here.")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── MENTORSHIP ── */}
        <section id="mentorship" className={sectionClass}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className={align}>
              <h2 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${titleClass}`}>
                {t("home.mentorship_title_short", "Mentorship")}
              </h2>
              <p className={`mt-4 text-sm leading-6 ${secondaryTextClass}`}>
                {t("home.mentorship_body_1", "Learn from people who've been where you want to go.")}
              </p>
              <p className={`mt-2 text-sm leading-6 ${secondaryTextClass}`}>
                {t("home.mentorship_body_2", "Connect with Sudanese professionals in the diaspora — no cold emails, just real guidance.")}
              </p>
              <Link href="/mentorship" className={`mt-6 ${outlineButtonClass}`}>
                {t("home.mentorship_cta", "Browse Mentors")} <ArrowRight size={14} className="ms-1.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {mentorshipCards.length === 0
                ? [0, 1, 2, 3].map((i) => (
                    <div key={`mentorship-skeleton-${i}`} className={`${mentorCardClass} animate-pulse`} aria-hidden="true">
                      <div className={`h-2.5 w-24 rounded-full ${isLight ? "bg-slate-200" : "bg-white/10"}`} />
                      <div className={`mt-3 h-4 w-full rounded-full ${isLight ? "bg-slate-200" : "bg-white/10"}`} />
                      <div className={`mt-2 h-3 w-4/5 rounded-full ${isLight ? "bg-slate-100" : "bg-white/5"}`} />
                      <div className={`mt-3 h-2.5 w-32 rounded-full ${isLight ? "bg-slate-100" : "bg-white/5"}`} />
                    </div>
                  ))
                : mentorshipCards.map((card) =>
                    card.type === "offering" ? (
                      <Link
                        key={card.data.id}
                        href="/mentorship"
                        className={`block ${mentorCardClass} transition-colors duration-150 hover:border-[#2258d1]/25`}
                      >
                        <p className={`text-[10px] font-semibold uppercase tracking-wide ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>
                          {CATEGORY_LABELS[card.data.category]}
                        </p>
                        <p className={`mt-2 text-sm font-semibold leading-snug ${titleClass}`}>{card.data.title}</p>
                        <p className={`mt-1 line-clamp-2 text-xs leading-relaxed ${secondaryTextClass}`}>{card.data.description}</p>
                        <p className={`mt-3 text-xs ${mutedTextClass}`}>
                          {card.data.mentorName} · {card.data.duration}
                        </p>
                      </Link>
                    ) : (
                      <div key={card.data.id} className={mentorCardClass}>
                        <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${card.data.rating} out of 5 stars`}>
                          {Array.from({ length: card.data.rating }).map((_, i) => (
                            <Star key={i} size={12} fill="currentColor" aria-hidden="true" />
                          ))}
                        </div>
                        <p className={`mt-2 line-clamp-3 text-xs leading-relaxed italic ${secondaryTextClass}`}>
                          &ldquo;{card.data.quote}&rdquo;
                        </p>
                        <p className={`mt-3 text-xs font-semibold ${titleClass}`}>{card.data.author}</p>
                        <p className={`text-[10px] ${mutedTextClass}`}>
                          {card.data.role} · {card.data.offeringTitle}
                        </p>
                      </div>
                    )
                  )}
            </div>
          </div>
        </section>

      </main>

      <footer className={`mt-8 border-t ${isLight ? "border-slate-200 bg-slate-50/50" : "border-white/8"}`}>
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${isLight ? "border border-slate-900/8 bg-white" : "border border-white/10 bg-white/5"}`}>
                  <span className="h-2 w-2 rounded-full bg-[#8fb7ff]" />
                  <span className="mx-1 h-2 w-2 rounded-full bg-[#dfe8ff]" />
                  <span className="h-2 w-2 rounded-full bg-[#18c29c]" />
                </span>
                <span className={`font-display text-lg ${titleClass}`}>{t("site.title", "The Project Hub")}</span>
              </div>
              <p className={`mt-4 max-w-xs text-sm leading-6 ${secondaryTextClass}`}>
                {t("home.footer_tagline", "Empowering Sudan's next generation of makers — one project, one connection, one opportunity at a time.")}
              </p>
              <div className="mt-6 flex gap-4">
                {[
                  { label: "X / Twitter", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                  { label: "LinkedIn", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                  { label: "Instagram", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                  { label: "YouTube", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
                ].map(({ label, svg }) => (
                  <a key={label} href="#" aria-label={label}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-200 ${isLight ? "border-slate-900/8 text-slate-500 hover:border-slate-300 hover:text-slate-800" : "border-white/10 text-[#6f7e9d] hover:border-white/20 hover:text-[#d8e4ff]"}`}>
                    {svg}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className={`text-sm font-semibold ${titleClass}`}>{t("footer.platform", "Platform")}</p>
              <ul className="mt-4 space-y-3">
                {[
                  [t("footer.discover_makers", "Discover Makers"), "/matching"],
                  [t("footer.browse_projects", "Browse Projects"), "/matching"],
                  [t("footer.matching_hub", "Matching Hub"), "/matching"],
                  [t("footer.mentor_network", "Mentor Network"), "/mentorship"],
                  [t("footer.portfolio_builder", "Portfolio Builder"), portfolioBuilderHref],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className={`text-sm transition-colors duration-150 ${secondaryTextClass} ${isLight ? "hover:text-slate-950" : "hover:text-white"}`}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className={`text-sm font-semibold ${titleClass}`}>{t("footer.community", "Community")}</p>
              <ul className="mt-4 space-y-3">
                {[
                  [t("footer.about", "About the Project"), "#"],
                  [t("footer.pilot", "Pilot Program"), "#"],
                  [t("footer.blog", "Blog"), "#"],
                  [t("footer.sponsors", "Sponsors & Donors"), "#"],
                  [t("footer.partners", "Partners"), "#"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className={`text-sm transition-colors duration-150 ${secondaryTextClass} ${isLight ? "hover:text-slate-950" : "hover:text-white"}`}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className={`text-sm font-semibold ${titleClass}`}>{t("footer.support", "Support")}</p>
              <ul className="mt-4 space-y-3">
                {[
                  [t("footer.help", "Help Center"), "#"],
                  [t("footer.contact", "Contact Us"), "#"],
                  [t("footer.community_forum", "Community Forum"), "#"],
                  [t("footer.faq", "FAQ"), "#"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className={`text-sm transition-colors duration-150 ${secondaryTextClass} ${isLight ? "hover:text-slate-950" : "hover:text-white"}`}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={`border-t ${isLight ? "border-slate-900/8" : "border-white/8"}`}>
          <div className={`mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-sm sm:flex-row sm:px-8 ${mutedTextClass}`}>
            <p>&copy; {new Date().getFullYear()} The Project Hub. {t("home.footer", "All rights reserved.")}</p>
            <div className="flex gap-5">
              {[
                [t("footer.privacy", "Privacy"), "#"],
                [t("footer.terms", "Terms"), "#"],
                [t("footer.cookies", "Cookies"), "#"],
              ].map(([label, href]) => (
                <Link key={label} href={href} className={`transition-colors duration-150 ${isLight ? "hover:text-slate-800" : "hover:text-[#9eabc4]"}`}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
