"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Compass,
  Dot,
  Lightbulb,
  Lock,
  MapPinned,
  Network,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import ProfileRegistrationForm from "../components/ProfileRegistrationForm";
import supabase from "../lib/supabaseClient";
import { useTranslation } from "../lib/i18n";
import { useTheme } from "../lib/theme";

type AudienceCard = {
  icon: React.ReactNode;
  title: string;
  body: string;
};

type StepCard = {
  index: string;
  title: string;
  body: string;
};

type FeatureCard = {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;
};

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
  const [showRegistration, setShowRegistration] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);

  const isArabic = locale === "ar";
  const isLight = theme === "light";
  const dir = isArabic ? "rtl" : "ltr";
  const align = isArabic ? "text-right" : "text-left";
  const heroActions = isArabic ? "sm:flex-row-reverse" : "sm:flex-row";
  const trustFlow = isArabic ? "lg:flex-row-reverse" : "lg:flex-row";

  const refetchProfile = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user || null;
      setUser(currentUser);

      if (!currentUser) {
        setProfileComplete(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "avatar_data_url,avatar_url,first_name,last_name,username,location_country,location_city,major_field,passion_sector,bio"
        )
        .eq("id", currentUser.id)
        .single();

      const filled = Boolean(
        profile &&
          (profile.username ||
            profile.first_name ||
            profile.avatar_data_url ||
            profile.location_country ||
            profile.location_city ||
            profile.major_field ||
            profile.passion_sector ||
            profile.bio)
      );

      setProfileComplete(filled);
    } catch (error) {
      console.warn("Failed to fetch profile", error);
      setProfileComplete(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await refetchProfile();
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const audienceCards: AudienceCard[] = [
    {
      icon: <BriefcaseBusiness size={18} />,
      title: t("home.audience_founders_title"),
      body: t("home.audience_founders_body"),
    },
    {
      icon: <Users size={18} />,
      title: t("home.audience_recruiters_title"),
      body: t("home.audience_recruiters_body"),
    },
    {
      icon: <Sparkles size={18} />,
      title: t("home.audience_investors_title"),
      body: t("home.audience_investors_body"),
    },
  ];

  const steps: StepCard[] = [
    {
      index: "01",
      title: t("home.step1_title"),
      body: t("home.step1_body"),
    },
    {
      index: "02",
      title: t("home.step2_title"),
      body: t("home.step2_body"),
    },
    {
      index: "03",
      title: t("home.step3_title"),
      body: t("home.step3_body"),
    },
  ];

  const features: FeatureCard[] = [
    {
      icon: <Search size={18} />,
      title: t("home.feature_search_title"),
      body: t("home.feature_search_body"),
      accent: "from-[#8fb7ff]/30 via-[#8fb7ff]/8 to-transparent",
    },
    {
      icon: <Network size={18} />,
      title: t("home.feature_graph_title"),
      body: t("home.feature_graph_body"),
      accent: "from-[#18c29c]/28 via-[#18c29c]/8 to-transparent",
    },
    {
      icon: <Radar size={18} />,
      title: t("home.feature_intro_title"),
      body: t("home.feature_intro_body"),
      accent: "from-[#ffb86a]/28 via-[#ffb86a]/8 to-transparent",
    },
    {
      icon: <BadgeCheck size={18} />,
      title: t("home.feature_context_title"),
      body: t("home.feature_context_body"),
      accent: "from-[#d7a6ff]/24 via-[#d7a6ff]/6 to-transparent",
    },
  ];

  const shellClass = isLight
    ? "home-shell home-shell-light min-h-screen text-slate-950"
    : "home-shell home-shell-dark min-h-screen text-[#f5f7fb]";
  const titleClass = isLight ? "text-slate-950" : "text-white";
  const secondaryTextClass = isLight ? "text-slate-600" : "text-[#9eabc4]";
  const mutedTextClass = isLight ? "text-slate-500" : "text-[#6f7e9d]";
  const primaryButtonClass = isLight
    ? "inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
    : "inline-flex items-center justify-center rounded-full bg-[#edf2ff] px-6 py-3 text-sm font-semibold text-[#09111f] transition duration-200 hover:-translate-y-0.5 hover:bg-white";
  const secondaryButtonClass = isLight
    ? "inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-800 transition duration-200 hover:-translate-y-0.5 hover:bg-white"
    : "inline-flex items-center justify-center rounded-full border border-white/12 bg-white/4 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/8";
  const cardIconClass = isLight
    ? "inline-flex rounded-2xl border border-slate-900/8 bg-white p-3 text-[#2258d1]"
    : "inline-flex rounded-2xl border border-white/10 bg-white/6 p-3 text-[#8fb7ff]";
  const sectionTitleClass = isLight
    ? "font-display mt-4 text-3xl text-slate-950 sm:text-4xl"
    : "font-display mt-4 text-3xl text-white sm:text-4xl";
  const finalTitleClass = isLight
    ? "font-display mt-4 text-3xl text-slate-950 sm:text-5xl"
    : "font-display mt-4 text-3xl text-white sm:text-5xl";

  return (
    <div dir={dir} className={shellClass}>
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 pb-16 pt-8 sm:px-8 sm:pb-24 sm:pt-12">
        <section className="home-hero-shell">
          <div className="relative flex flex-col gap-10 lg:items-start">
            <div className={align}>
              <div className="home-proofline">
                <span className="home-proof-bulb" aria-hidden="true">
                  <Lightbulb size={15} />
                </span>
                <span>{t("home.hero_proofline", "Built for the ambitious leaders of tomorrow")}</span>
              </div>
              <h1 className={`home-hero-title mt-8 max-w-5xl ${titleClass}`}>
                <span className="home-hero-skillline block">{t("home.hero_title_line_1", "Use Your Skills To")}</span>
              </h1>
              <div className="home-hero-bubbles" aria-hidden="true">
                <span className="home-hero-bubble bubble-one">{t("home.hero_title_line_2", "Build projects.")}</span>
                <span className="home-hero-bubble bubble-two">{t("home.hero_title_line_3", "Find your people.")}</span>
                <span className="home-hero-bubble bubble-three">{t("home.hero_title_line_4", "Create your future.")}</span>
              </div>
              <p className={`mt-6 max-w-3xl text-lg leading-8 sm:text-[1.55rem] sm:leading-[1.55] ${secondaryTextClass}`}>
                {t("home.hero_body_line_1", "You have the skills but you don't have real-life experience?")}
                <br />
                {t(
                  "home.hero_body_line_2",
                  "The Project Hub opens doors and opportunities for you to build experience, connect with people, and develop further."
                )}
              </p>

              <div className={`mt-10 flex flex-col gap-3 ${heroActions}`}>
                {!user || !profileComplete ? (
                  <button onClick={() => setShowRegistration(true)} className={primaryButtonClass}>
                    {t("home.primary_cta")}
                    <ArrowRight size={16} className="ms-2 rtl:rotate-180" />
                  </button>
                ) : (
                  <Link href="/profile/settings" className={primaryButtonClass}>
                    {t("header.edit_profile", "Edit Profile")}
                  </Link>
                )}
                <Link href="/matching" className={secondaryButtonClass}>
                  {t("home.secondary_cta_refined", "See how it works")}
                </Link>
              </div>

              <div className={`mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm ${mutedTextClass}`}>
                <div className="home-inline-meta">
                  <BadgeCheck size={14} />
                  <span>{t("home.inline_meta_1", "Fast profile setup")}</span>
                </div>
                <div className="home-inline-meta">
                  <Lock size={14} />
                  <span>{t("home.inline_meta_2", "Community-first privacy")}</span>
                </div>
                <div className="home-inline-meta">
                  <Sparkles size={14} />
                  <span>{t("home.inline_meta_3", "Actionable matching signal")}</span>
                </div>
              </div>
            </div>

            <div className="flex w-full justify-center">
              <div className="signal-stage animate-fade-up">
                <div className="home-process-label">{t("home.steps_kicker", "How it works")}</div>
                <h2 className={`home-process-title ${titleClass}`}>
                  {t("home.process_title_prefix", "Four steps from signal to ")}
                  <span>{t("home.process_title_emphasis", "action.")}</span>
                </h2>

                <div className="home-flow-board">
                  <div className="home-flow-left">
                    <div className="home-flow-pill home-flow-pill-sm">
                      <div className="home-flow-pill-icon">
                        <BadgeCheck size={16} />
                      </div>
                      <div>
                        <strong>{t("home.flow_profile_title", "Maker profile")}</strong>
                        <small>{t("home.flow_profile_body", "Show skills, interests, and what you want to build.")}</small>
                      </div>
                    </div>

                    <div className="home-flow-pill">
                      <div className="home-flow-pill-icon">
                        <MapPinned size={16} />
                      </div>
                      <div>
                        <strong>{t("home.flow_match_title", "Local + remote matchmaking")}</strong>
                        <small>{t("home.flow_match_body", "Find collaborators, teams, and opportunities across places.")}</small>
                      </div>
                    </div>

                    <div className="home-flow-pill">
                      <div className="home-flow-pill-icon">
                        <Compass size={16} />
                      </div>
                      <div>
                        <strong>{t("home.flow_mentorship_title", "Mentorship + skill development")}</strong>
                        <small>{t("home.flow_mentorship_body", "Build experience and get guidance while you grow.")}</small>
                      </div>
                    </div>
                  </div>

                  <div className="home-flow-center">
                    <div className="home-flow-hub">
                      <Dot className="home-graph-node node-a" />
                      <Dot className="home-graph-node node-b" />
                      <Dot className="home-graph-node node-c" />
                      <Dot className="home-graph-node node-d" />
                      <div className="home-flow-hub-core">
                        <strong>{t("home.flow_hub_title", "The Project Hub")}</strong>
                        <span>{t("home.flow_hub_body", "Turns disconnected signal into visible next steps.")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="home-flow-right">
                    <div className="home-flow-outcome-card">
                      <div className="home-target-avatar">You</div>
                      <div>
                        <strong>{t("home.flow_you_title", "You")}</strong>
                        <small>{t("home.flow_you_body", "More clarity, warmer intros, and better ways to build experience.")}</small>
                      </div>
                    </div>
                  </div>
                </div>

                <p className={`home-process-caption ${secondaryTextClass}`}>
                  {t(
                    "home.process_caption",
                    "Search your community's network like infrastructure, not spreadsheets. See who knows who and why the introduction matters."
                  )}
                </p>
              </div>
            </div>
          </div>

          {showRegistration && (
            <ProfileRegistrationForm
              onClose={() => setShowRegistration(false)}
              onSaved={async () => {
                await refetchProfile();
              }}
            />
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {audienceCards.map((card) => (
            <article key={card.title} className={`home-audience-card ${align}`}>
              <div className={cardIconClass}>{card.icon}</div>
              <h3 className={`mt-5 text-lg font-semibold ${titleClass}`}>{card.title}</h3>
              <p className={`mt-3 text-sm leading-6 ${secondaryTextClass}`}>{card.body}</p>
            </article>
          ))}
        </section>

        <section id="how-it-works" className="home-narrative-grid">
          <article className={`home-narrative-block ${align}`}>
            <p className="home-narrative-label">{t("home.problem_label", "The problem")}</p>
            <div className="problem-characters-row">
              <div className="problem-char-unit delay-one">
                <div className="problem-thought-bubble">
                  {t("home.problem_bubble_1", "I don't have any experience yet.")}
                </div>
                <div className="problem-dot-chain" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <svg className="problem-char-svg" viewBox="0 0 120 215" aria-hidden="true">
                  <ellipse cx="60" cy="210" rx="30" ry="5" fill="rgba(0,0,0,0.13)"/>
                  <ellipse cx="44" cy="204" rx="17" ry="6" fill="#1A0F05"/>
                  <ellipse cx="76" cy="204" rx="17" ry="6" fill="#1A0F05"/>
                  <rect x="29" y="158" width="23" height="50" rx="5" fill="#2A3560"/>
                  <rect x="68" y="158" width="23" height="50" rx="5" fill="#2A3560"/>
                  <path d="M22 100 C22 90 40 83 60 83 C80 83 98 90 98 100 L94 160 L26 160 Z" fill="#E8603A"/>
                  <path d="M23 102 Q7 128 10 148 L20 146 Q19 126 33 106 Z" fill="#E8603A"/>
                  <ellipse cx="15" cy="150" rx="8" ry="8" fill="#7C4520"/>
                  <path d="M97 102 Q113 128 110 148 L100 146 Q101 126 87 106 Z" fill="#E8603A"/>
                  <ellipse cx="105" cy="150" rx="8" ry="8" fill="#7C4520"/>
                  <rect x="51" y="79" width="18" height="12" rx="3" fill="#7C4520"/>
                  <circle cx="60" cy="57" r="29" fill="#7C4520"/>
                  <ellipse cx="60" cy="38" rx="36" ry="30" fill="#140800"/>
                  <ellipse cx="27" cy="52" rx="14" ry="18" fill="#140800"/>
                  <ellipse cx="93" cy="52" rx="14" ry="18" fill="#140800"/>
                  <circle cx="60" cy="57" r="26" fill="#7C4520"/>
                  <ellipse cx="60" cy="36" rx="28" ry="22" fill="#140800"/>
                  <ellipse cx="34" cy="57" rx="5.5" ry="7" fill="#7C4520"/>
                  <ellipse cx="86" cy="57" rx="5.5" ry="7" fill="#7C4520"/>
                  <ellipse cx="50" cy="55" rx="6" ry="6.5" fill="white"/>
                  <ellipse cx="70" cy="55" rx="6" ry="6.5" fill="white"/>
                  <circle cx="51" cy="56" r="3.8" fill="#140800"/>
                  <circle cx="71" cy="56" r="3.8" fill="#140800"/>
                  <circle cx="52.5" cy="54.5" r="1.3" fill="white"/>
                  <circle cx="72.5" cy="54.5" r="1.3" fill="white"/>
                  <ellipse cx="60" cy="66" rx="3.5" ry="2.5" fill="#5A2E0E"/>
                  <path d="M50 73 Q60 81 70 73" stroke="#3A1808" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <circle cx="34" cy="62" r="2.5" fill="#E8A832"/>
                  <circle cx="86" cy="62" r="2.5" fill="#E8A832"/>
                </svg>
              </div>

              <div className="problem-char-unit delay-two">
                <div className="problem-thought-bubble">
                  {t("home.problem_bubble_2", "I have experience, but I don't know where to apply it.")}
                </div>
                <div className="problem-dot-chain" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <svg className="problem-char-svg" viewBox="0 0 120 215" aria-hidden="true">
                  <ellipse cx="60" cy="210" rx="28" ry="5" fill="rgba(0,0,0,0.13)"/>
                  <ellipse cx="44" cy="204" rx="16" ry="6" fill="#0D0A1A"/>
                  <ellipse cx="76" cy="204" rx="16" ry="6" fill="#0D0A1A"/>
                  <rect x="30" y="158" width="22" height="50" rx="5" fill="#1E2850"/>
                  <rect x="68" y="158" width="22" height="50" rx="5" fill="#1E2850"/>
                  <path d="M20 96 C20 86 40 80 60 80 C80 80 100 86 100 96 L96 160 L24 160 Z" fill="#28B5A8"/>
                  <path d="M21 98 Q5 125 8 147 L18 145 Q18 123 32 100 Z" fill="#28B5A8"/>
                  <ellipse cx="13" cy="149" rx="8" ry="8" fill="#4A2C10"/>
                  <path d="M99 98 Q115 125 112 147 L102 145 Q102 123 88 100 Z" fill="#28B5A8"/>
                  <ellipse cx="107" cy="149" rx="8" ry="8" fill="#4A2C10"/>
                  <rect x="52" y="76" width="16" height="12" rx="3" fill="#4A2C10"/>
                  <ellipse cx="60" cy="52" rx="27" ry="31" fill="#4A2C10"/>
                  <ellipse cx="60" cy="26" rx="27" ry="16" fill="#140800"/>
                  <ellipse cx="35" cy="40" rx="8" ry="14" fill="#140800"/>
                  <ellipse cx="85" cy="40" rx="8" ry="14" fill="#140800"/>
                  <ellipse cx="33" cy="52" rx="5.5" ry="7" fill="#4A2C10"/>
                  <ellipse cx="87" cy="52" rx="5.5" ry="7" fill="#4A2C10"/>
                  <ellipse cx="50" cy="50" rx="6" ry="6" fill="white"/>
                  <ellipse cx="70" cy="50" rx="6" ry="6" fill="white"/>
                  <circle cx="51" cy="51" r="3.5" fill="#140800"/>
                  <circle cx="71" cy="51" r="3.5" fill="#140800"/>
                  <circle cx="52.5" cy="49.5" r="1.2" fill="white"/>
                  <circle cx="72.5" cy="49.5" r="1.2" fill="white"/>
                  <ellipse cx="60" cy="61" rx="3" ry="2.2" fill="#321A06"/>
                  <path d="M51 69 Q60 77 69 69" stroke="#280E02" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M40 62 Q40 80 60 84 Q80 80 80 62" fill="#140800" opacity="0.45"/>
                </svg>
              </div>

              <div className="problem-char-unit delay-three">
                <div className="problem-thought-bubble">
                  {t("home.problem_bubble_3", "I need mentorship, advice, and real opportunities, but I can't find them.")}
                </div>
                <div className="problem-dot-chain" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <svg className="problem-char-svg" viewBox="0 0 120 215" aria-hidden="true">
                  <ellipse cx="60" cy="210" rx="28" ry="5" fill="rgba(0,0,0,0.13)"/>
                  <ellipse cx="43" cy="204" rx="16" ry="6" fill="#050510"/>
                  <ellipse cx="77" cy="204" rx="16" ry="6" fill="#050510"/>
                  <rect x="30" y="158" width="22" height="50" rx="5" fill="#1B2855"/>
                  <rect x="68" y="158" width="22" height="50" rx="5" fill="#1B2855"/>
                  <path d="M40 158 L40 90 L60 85 L80 90 L80 158 Z" fill="#EEEEF8"/>
                  <path d="M57 85 L60 92 L63 85 L61.5 135 L60 140 L58.5 135 Z" fill="#E8603A"/>
                  <path d="M20 93 C20 84 40 78 60 78 C80 78 100 84 100 93 L96 160 L24 160 Z" fill="#1B2855"/>
                  <path d="M48 85 L60 92 L72 85 L68 78 L60 82 L52 78 Z" fill="#EEEEF8"/>
                  <path d="M20 93 L40 88 L48 78 L32 100 Z" fill="#1B2855"/>
                  <path d="M100 93 L80 88 L72 78 L88 100 Z" fill="#1B2855"/>
                  <path d="M21 95 Q5 122 8 144 L18 142 Q18 120 32 98 Z" fill="#1B2855"/>
                  <ellipse cx="13" cy="146" rx="8" ry="8" fill="#7A4A28"/>
                  <path d="M99 95 Q115 122 112 144 L102 142 Q102 120 88 98 Z" fill="#1B2855"/>
                  <ellipse cx="107" cy="146" rx="8" ry="8" fill="#7A4A28"/>
                  <path d="M75 108 L82 104 L84 112 L77 115 Z" fill="#E8A832"/>
                  <rect x="52" y="74" width="16" height="12" rx="3" fill="#7A4A28"/>
                  <circle cx="60" cy="52" r="29" fill="#7A4A28"/>
                  <ellipse cx="60" cy="28" rx="28" ry="15" fill="#1E0800"/>
                  <ellipse cx="31" cy="52" rx="5.5" ry="7" fill="#7A4A28"/>
                  <ellipse cx="89" cy="52" rx="5.5" ry="7" fill="#7A4A28"/>
                  <path d="M45 44 Q52 41 57 43" stroke="#1E0800" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                  <path d="M63 43 Q68 41 75 44" stroke="#1E0800" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="50" cy="51" rx="6" ry="6" fill="white"/>
                  <ellipse cx="70" cy="51" rx="6" ry="6" fill="white"/>
                  <circle cx="51" cy="52" r="3.5" fill="#1E0800"/>
                  <circle cx="71" cy="52" r="3.5" fill="#1E0800"/>
                  <circle cx="52.5" cy="50.5" r="1.2" fill="white"/>
                  <circle cx="72.5" cy="50.5" r="1.2" fill="white"/>
                  <ellipse cx="60" cy="62" rx="3.2" ry="2.4" fill="#5A3010"/>
                  <path d="M50 70 Q60 79 70 70" stroke="#301008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <h2 className={`home-narrative-title home-narrative-title-muted ${titleClass}`}>
              {t(
                "home.problem_title",
                "Too many talented people are ready to build, but they are missing signal, access, guidance, or a clear place to start."
              )}
            </h2>
            <p className={`home-narrative-body ${secondaryTextClass}`}>
              {t(
                "home.problem_body",
                "That leaves ambition trapped between no experience, unclear direction, and no warm path into the right community."
              )}
            </p>
          </article>

          <article className={`home-narrative-block ${align}`}>
            <p className="home-narrative-label">{t("home.solution_label", "The solution")}</p>
            <div className="solution-scene-wrap" aria-hidden="true">
              <div className="solution-left-pills">
                <div className="solution-left-pill show">{t("home.problem_bubble_1", "I don't have any experience yet.")}</div>
                <div className="solution-left-pill show">{t("home.problem_bubble_2", "I have experience, but I don't know where to apply it.")}</div>
                <div className="solution-left-pill show">{t("home.problem_bubble_3", "I need mentorship, advice, and real opportunities, but I can't find them.")}</div>
              </div>

              <div className="solution-belt-machine-row">
                <div className="solution-belt-track">
                  <div className="solution-belt-pill belt-pill-one">{t("home.problem_bubble_1", "I don't have any experience yet.")}</div>
                  <div className="solution-belt-pill belt-pill-two">{t("home.problem_bubble_2", "I have experience, but I don't know where to apply it.")}</div>
                  <div className="solution-belt-pill belt-pill-three">{t("home.problem_bubble_3", "I need mentorship, advice, and real opportunities, but I can't find them.")}</div>
                </div>

                <div className="solution-machine-unit processing">
                  <span className="solution-spark spark-one">✦</span>
                  <span className="solution-spark spark-two">✦</span>
                  <div className="solution-chimneys">
                    <div className="solution-chimney">
                      <div className="solution-chimney-cap" />
                      <div className="solution-smoke-puff" />
                    </div>
                    <div className="solution-chimney">
                      <div className="solution-chimney-cap" />
                      <div className="solution-smoke-puff" />
                    </div>
                  </div>
                  <div className="solution-machine-body">
                    <div className="solution-rivet tl" />
                    <div className="solution-rivet tr" />
                    <div className="solution-rivet bl" />
                    <div className="solution-rivet br" />
                    <div className="solution-porthole">
                      <div className="solution-gear gear-a">⚙</div>
                      <div className="solution-gear gear-b">⚙</div>
                    </div>
                    <div className="solution-machine-label">{t("home.solution_machine_label", "Mixer 3000")}</div>
                  </div>
                  <div className="solution-machine-base" />
                  <div className="solution-machine-legs">
                    <div className="solution-machine-leg" />
                    <div className="solution-machine-leg" />
                  </div>
                </div>

                <div className="solution-output-badge show">✦ {t("home.flow_hub_title", "The Project Hub")}</div>
              </div>
            </div>
            <h2 className={`home-narrative-title ${titleClass}`}>
              {t(
                "home.solution_title",
                "The Project Hub helps people build experience, foster stronger connections, apply what they know, and grow through mentorship and practical collaboration."
              )}
            </h2>
            <p className={`home-narrative-body ${secondaryTextClass}`}>
              {t(
                "home.solution_body",
                "Instead of leaving people to figure it out alone, it creates a path from profile to matching to mentorship to real momentum."
              )}
            </p>
          </article>
        </section>

        <section id="features" className={align}>
          <div>
            <div>
              <p className="section-kicker">{t("home.features_kicker")}</p>
              <TypingFeatureTitle locale={locale} className={sectionTitleClass} />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className={`home-feature-panel ${index === 0 ? "md:col-span-2" : ""}`}
              >
                <div className={`home-feature-glow bg-gradient-to-br ${feature.accent}`} />
                <div className="relative">
                  <div className={cardIconClass}>{feature.icon}</div>
                  <h3 className={`mt-5 text-lg font-semibold ${titleClass}`}>{feature.title}</h3>
                  <p className={`mt-3 max-w-2xl text-sm leading-6 ${secondaryTextClass}`}>{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.index} className={`home-step-card ${align}`}>
              <div className="home-step-index">{step.index}</div>
              <div>
                <h3 className={`text-lg font-semibold ${titleClass}`}>{step.title}</h3>
                <p className={`mt-2 text-sm leading-6 ${secondaryTextClass}`}>{step.body}</p>
              </div>
            </article>
          ))}
        </section>

        <section id="trust" className={`glass-panel flex flex-col gap-8 p-6 sm:p-8 lg:p-10 ${trustFlow}`}>
          <div className={`flex-1 ${align}`}>
            <p className="section-kicker">{t("home.trust_kicker")}</p>
            <h2 className={sectionTitleClass}>{t("home.trust_title")}</h2>
            <p className={`mt-4 max-w-2xl text-base leading-7 ${secondaryTextClass}`}>
              {t("home.trust_body")}
            </p>
          </div>

          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <article className="home-trust-card">
              <div className={cardIconClass}>
                <Lock size={18} />
              </div>
              <h3 className={`mt-5 text-lg font-semibold ${titleClass}`}>{t("home.privacy_title")}</h3>
              <p className={`mt-3 text-sm leading-6 ${secondaryTextClass}`}>{t("home.privacy_body")}</p>
            </article>
            <article className="home-trust-card">
              <div className={cardIconClass}>
                <ShieldCheck size={18} />
              </div>
              <h3 className={`mt-5 text-lg font-semibold ${titleClass}`}>{t("home.signal_title")}</h3>
              <p className={`mt-3 text-sm leading-6 ${secondaryTextClass}`}>{t("home.signal_body")}</p>
            </article>
          </div>
        </section>

        <section className={`final-cta ${align}`}>
          <p className="section-kicker">{t("home.final_kicker")}</p>
          <h2 className={finalTitleClass}>{t("home.final_title")}</h2>
          <p className={`mx-auto mt-4 max-w-2xl text-base leading-7 ${secondaryTextClass}`}>
            {t("home.final_body")}
          </p>
          <div className={`mt-8 flex flex-col justify-center gap-3 ${heroActions}`}>
            {!user || !profileComplete ? (
              <button onClick={() => setShowRegistration(true)} className={primaryButtonClass}>
                {t("home.primary_cta")}
              </button>
            ) : (
              <Link href="/profile/settings" className={primaryButtonClass}>
                {t("header.edit_profile", "Edit Profile")}
              </Link>
            )}
            <Link href="/profile/mock-id-123" className={secondaryButtonClass}>
              {t("home.sample_cta")}
            </Link>
          </div>
        </section>
      </main>

      <footer
        className={`border-t px-6 py-6 text-center text-sm ${
          isLight ? "border-slate-900/8 text-slate-500" : "border-white/8 text-[#6f7e9d]"
        }`}
      >
        &copy; {new Date().getFullYear()} The Project Hub. {t("home.footer")}
      </footer>
    </div>
  );
}
