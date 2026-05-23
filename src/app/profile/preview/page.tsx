"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Briefcase, Eye, MapPin, Star, Users } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useTranslation } from "@/lib/i18n";

interface Skill { name: string; level: number; }
interface Project { title: string; role: string; description: string; isTeam: boolean; images?: string[]; }

interface PreviewProfile {
  firstName: string;
  lastName: string;
  username: string;
  locationCity: string;
  locationCountry: string;
  majorField: string;
  passionSector: string;
  isMentor: boolean;
  bio: string;
  avatarDataUrl: string | null;
  skills?: Skill[];
  projects?: Project[];
}

const PROJECT_COLORS = ["5b7fdb", "0d9488", "e86c00"];
const PROJECT_TEXT = ["ffffff", "ffffff", "ffffff"];

export default function ProfilePreviewPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { locale } = useTranslation();
  const isLight = theme === "light";
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [profile, setProfile] = useState<PreviewProfile | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("profile_preview");
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      // sessionStorage not available
    }
  }, []);

  // Style tokens (matching /profile/[id])
  const shellClass = isLight
    ? "home-shell home-shell-light min-h-screen text-slate-950"
    : "home-shell home-shell-dark min-h-screen text-[#f5f7fb]";
  const titleClass = isLight ? "text-[#1b1918]" : "text-white";
  const secondaryTextClass = isLight ? "text-[#6c615c]" : "text-[#9eabc4]";
  const mutedClass = isLight ? "text-[#847770]" : "text-[#6f7e9d]";
  const cardClass = isLight
    ? "rounded-2xl border border-[#b7ada8]/25 bg-white/90 backdrop-blur-xl"
    : "rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl";
  const tagClass = isLight
    ? "inline-flex items-center rounded-full border border-[#b7ada8]/30 bg-[#f8f5f1] px-3 py-1 text-xs font-medium text-[#6c615c]"
    : "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[#d8e4ff]";
  const accentColor = isLight ? "text-[#5b7fdb]" : "text-[#8fb7ff]";

  const p = profile ?? {
    firstName: "Ahmed", lastName: "Omar", username: "ahmedomar",
    locationCity: "Khartoum", locationCountry: "Sudan",
    majorField: "Software Engineering", passionSector: "Fintech",
    isMentor: false,
    bio: "This is a preview of your profile. Fill in the form and click 'Complete profile' to see your own data here.",
    avatarDataUrl: null, skills: [], projects: [],
  };

  const userSkills: Skill[] = p.skills ?? [];
  const userProjects: Project[] = (p.projects ?? []).filter(pr => pr.title?.trim());
  const hasRealSkills = userSkills.length > 0;
  const hasRealProjects = userProjects.length > 0;

  const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Your Name";
  const initials = [p.firstName?.[0], p.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const location = [p.locationCity, p.locationCountry].filter(Boolean).join(", ");

  return (
    <div dir={dir} className={shellClass}>

      {/* Preview banner */}
      <div className={`sticky top-0 z-20 border-b ${isLight ? "border-[#5b7fdb]/20 bg-[#5b7fdb]/8" : "border-[#8fb7ff]/15 bg-[#8fb7ff]/8"}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-2.5">
          <div className="flex items-center gap-2.5">
            <Eye size={15} className={accentColor} />
            <p className={`text-sm font-medium ${isLight ? "text-[#1b1918]" : "text-white"}`}>
              Preview mode — this is how your profile will look
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                isLight ? "border-[#b7ada8]/40 text-[#6c615c] hover:bg-[#f2ede8]" : "border-white/15 text-[#9eabc4] hover:bg-white/8"
              }`}
            >
              Edit profile
            </button>
            <Link
              href="/auth/signup"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-colors duration-150 ${
                isLight ? "bg-[#1b1918] text-white hover:bg-[#2c2a29]" : "bg-white text-[#1b1918] hover:bg-slate-100"
              }`}
            >
              Sign up to publish
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-8">

        {/* Back link */}
        <button
          onClick={() => router.back()}
          className={`mb-8 inline-flex items-center gap-2 text-sm transition-colors duration-150 ${mutedClass} hover:${secondaryTextClass}`}
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* Sidebar */}
          <aside className="space-y-4">

            {/* Avatar + identity card */}
            <div className={`${cardClass} p-6 text-left`}>
              <div className="mb-5 flex flex-col items-center text-center">
                <div className={`h-24 w-24 overflow-hidden rounded-full border-2 ${isLight ? "border-[#b7ada8]/30 bg-[#f2ede8]" : "border-white/10 bg-white/5"}`}>
                  {p.avatarDataUrl ? (
                    <img src={p.avatarDataUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center text-2xl font-bold ${isLight ? "text-[#847770]" : "text-[#8fb7ff]"}`}>
                      {initials}
                    </div>
                  )}
                </div>
                <h1 className={`mt-4 text-xl font-bold ${titleClass}`}>{fullName}</h1>
                {p.username && (
                  <p className={`text-sm ${mutedClass}`}>@{p.username}</p>
                )}
                {p.isMentor && (
                  <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${isLight ? "bg-[#5b7fdb]/10 text-[#5b7fdb]" : "bg-[#8fb7ff]/15 text-[#8fb7ff]"}`}>
                    <Star size={11} aria-hidden="true" />
                    Mentor
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {location && (
                  <div className={`flex items-center gap-2 text-sm ${secondaryTextClass}`}>
                    <MapPin size={14} className={mutedClass} aria-hidden="true" />
                    <span>{location}</span>
                  </div>
                )}
                {p.majorField && (
                  <div className={`flex items-center gap-2 text-sm ${secondaryTextClass}`}>
                    <Briefcase size={14} className={mutedClass} aria-hidden="true" />
                    <span>{p.majorField}</span>
                  </div>
                )}
                {p.passionSector && (
                  <div className={`flex items-center gap-2 text-sm ${secondaryTextClass}`}>
                    <Users size={14} className={mutedClass} aria-hidden="true" />
                    <span>{p.passionSector}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Skills card */}
            {hasRealSkills && (
              <div className={`${cardClass} p-5`}>
                <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.22em] ${accentColor}`}>Skills</p>
                <div className="flex flex-wrap gap-2">
                  {userSkills.map(skill => (
                    <span key={skill.name} title={`Proficiency: ${skill.level}/5`} className={tagClass}>{skill.name}</span>
                  ))}
                </div>
              </div>
            )}
            {!hasRealSkills && (
              <div className={`${cardClass} p-5`}>
                <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.22em] ${accentColor}`}>Skills</p>
                <p className={`text-xs italic ${mutedClass}`}>No skills added — go back and add skills in step 3</p>
              </div>
            )}
          </aside>

          {/* Main content */}
          <div className="space-y-4">

            {/* Bio */}
            {p.bio && (
              <div className={`${cardClass} p-6`}>
                <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.22em] ${accentColor}`}>
                  About
                </p>
                <p className={`text-sm leading-7 ${secondaryTextClass}`}>{p.bio}</p>
              </div>
            )}

            {/* Projects */}
            <div>
              <p className={`mb-4 text-xs font-semibold uppercase tracking-[0.22em] ${accentColor}`}>Featured Projects</p>

              {hasRealProjects ? (
                <div className="space-y-4">
                  {userProjects.map((project, i) => {
                    const imgs = project.images ?? [];
                    return (
                    <article key={i} className={`${cardClass} overflow-hidden transition-all duration-200 hover:-translate-y-0.5`}>
                      {/* Images: show first as hero, rest as thumbnails */}
                      {imgs.length > 0 ? (
                        <div>
                          <img src={imgs[0]} alt={`${project.title} — image 1`} className="h-52 w-full object-cover" loading="lazy" />
                          {imgs.length > 1 && (
                            <div className={`flex gap-2 p-3 ${isLight ? "bg-[#f8f5f1]" : "bg-white/3"}`}>
                              {imgs.slice(1).map((src, ii) => (
                                <img key={ii} src={src} alt={`${project.title} — image ${ii + 2}`} className="h-16 w-24 rounded-lg object-cover" loading="lazy" />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-44 w-full flex items-center justify-center" style={{ background: `#${PROJECT_COLORS[i % PROJECT_COLORS.length]}` }}>
                          <span className="text-2xl font-bold opacity-30 text-white">
                            {project.title[0]?.toUpperCase() ?? "P"}
                          </span>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h2 className={`text-xl font-bold ${titleClass}`}>{project.title}</h2>
                          {project.isTeam && (
                            <span className={`${tagClass} shrink-0`}>
                              <Users size={11} className="me-1" aria-hidden="true" />
                              Team Project
                            </span>
                          )}
                        </div>
                        {project.role && (
                          <p className={`mt-1 text-sm font-medium ${accentColor}`}>Role: {project.role}</p>
                        )}
                        {project.description && (
                          <p className={`mt-3 text-sm leading-7 ${secondaryTextClass}`}>{project.description}</p>
                        )}
                      </div>
                    </article>
                    );
                  })}
                  <div className={`rounded-xl border p-4 ${isLight ? "border-[#5b7fdb]/20 bg-[#5b7fdb]/5" : "border-[#8fb7ff]/15 bg-[#8fb7ff]/8"}`}>
                    <p className={`text-xs leading-relaxed ${isLight ? "text-[#5b7fdb]" : "text-[#8fb7ff]"}`}>
                      <strong>Your projects are shown above.</strong> After signing up you can add images, links, and a resume to make them shine.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`${cardClass} p-8 text-center`}>
                  <p className={`text-sm ${mutedClass}`}>No projects added — go back and add projects in step 4</p>
                  <button onClick={() => router.back()} className={`mt-3 text-xs font-semibold ${accentColor} hover:underline cursor-pointer`}>
                    ← Add projects
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
