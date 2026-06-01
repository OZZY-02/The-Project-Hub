"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "../../../lib/i18n";
import { useTheme } from "../../../lib/theme";
import supabase from "../../../lib/supabaseClient";
import { ArrowLeft, BookmarkCheck, MapPin, Users } from "lucide-react";

type MatchCard = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  tags: string[];
  type: "maker" | "mentor" | "project";
};

export default function SavedMatchesPage() {
  const { t, locale } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "text-right" : "text-left";
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);

  const savedStorageKey = "matching_saved_matches";
  const cardCls = isLight ? "border-slate-900/8 bg-white shadow-sm" : "border-white/8 bg-white/3";
  const titleCls = isLight ? "text-slate-950" : "text-[#f5f7fb]";
  const mutedCls = isLight ? "text-slate-500" : "text-[#9eabc4]";
  const dimCls = isLight ? "text-slate-400" : "text-[#6f7e9d]";

  const typeLabel = (type: MatchCard["type"]) => {
    if (type === "maker") return t("matching.type_maker", "Maker");
    if (type === "mentor") return t("matching.type_mentor", "Mentor");
    return t("matching.type_project", "Project");
  };

  const removeSaved = async (matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    try {
      const raw = localStorage.getItem(savedStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as MatchCard[];
        const next = parsed.filter((m) => m.id !== matchId);
        localStorage.setItem(savedStorageKey, JSON.stringify(next));
      }
    } catch {}

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user || null;
      if (!user) return;
      await supabase.from("match_saves").delete().eq("user_id", user.id).eq("match_id", matchId);
    } catch {}
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      let localMatches: MatchCard[] = [];
      try {
        const raw = localStorage.getItem(savedStorageKey);
        if (raw) localMatches = JSON.parse(raw);
      } catch {}

      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user || null;
        if (user) {
          const { data } = await supabase
            .from("match_saves")
            .select("data")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          const saved = (data || []).map((row: { data?: MatchCard }) => row.data).filter(Boolean) as MatchCard[];
          const merged = [...saved, ...localMatches].filter(
            (item, index, arr) => arr.findIndex((m) => m.id === item.id) === index
          );
          if (mounted) setMatches(merged);
          setLoading(false);
          return;
        }
      } catch {}

      if (mounted) setMatches(localMatches);
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div dir={dir} className={`home-shell min-h-screen ${isLight ? "home-shell-light text-slate-950" : "home-shell-dark text-[#f5f7fb]"}`}>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/matching"
          className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
            isLight
              ? "border-slate-900/10 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              : "border-white/8 bg-white/4 text-[#9eabc4] hover:border-white/15 hover:text-[#f5f7fb]"
          }`}
        >
          <ArrowLeft size={15} />
          {t("matching.back_to_matching", "Back to matching")}
        </Link>

        <header className={`rounded-3xl border p-8 ${cardCls} ${align}`}>
          <div className={`flex items-center gap-3 ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>
            <BookmarkCheck size={20} />
            <p className="text-xs font-semibold uppercase tracking-[0.35em]">{t("matching.saved_kicker", "Saved matches")}</p>
          </div>
          <h1 className={`font-display mt-4 text-3xl ${titleCls}`}>{t("matching.saved_title", "Your saved matches")}</h1>
          <p className={`mt-2 text-sm ${mutedCls}`}>
            {t("matching.saved_subtitle", "Keep track of makers, mentors, and projects you want to revisit.")}
          </p>
        </header>

        <section className="mt-8">
          {loading ? (
            <p className={`text-sm ${mutedCls}`}>{t("matching.loading_saved", "Loading saved matches...")}</p>
          ) : matches.length === 0 ? (
            <div className={`rounded-2xl border p-6 text-sm ${cardCls} ${mutedCls}`}>
              <p>{t("matching.saved_empty", "You have no saved matches yet.")}</p>
              <Link
                href="/matching"
                className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-150 ${
                  isLight ? "text-[#2258d1] hover:text-[#1a46ab]" : "text-[#8fb7ff] hover:text-[#c8d4e8]"
                }`}
              >
                {t("matching.browse_matches", "Browse matches")}
                <ArrowLeft size={14} className="rtl:rotate-180" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {matches.map((match) => (
                <div key={match.id} className={`rounded-2xl border p-5 ${cardCls}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-lg font-semibold ${titleCls}`}>{match.title}</h3>
                      <p className={`mt-1 text-sm ${mutedCls}`}>{match.subtitle}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
                        isLight ? "border-slate-900/10 bg-slate-50 text-slate-600" : "border-white/10 bg-white/5 text-[#c8d8f0]"
                      }`}
                    >
                      {typeLabel(match.type)}
                    </span>
                  </div>
                  <div className={`mt-3 flex flex-wrap items-center gap-3 text-xs ${dimCls}`}>
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={14} className={isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"} />
                      {match.location}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Users size={14} className={isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"} />
                      {t("matching.match_strength", "High match")}
                    </span>
                  </div>
                  {match.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {match.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-full border px-3 py-1 text-xs ${
                            isLight ? "border-slate-900/10 bg-slate-50 text-slate-600" : "border-white/10 bg-white/5 text-[#c8d8f0]"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => removeSaved(match.id)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-150 ${
                        isLight
                          ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border border-red-500/20 bg-red-500/10 text-[#f0a37f] hover:bg-red-500/15"
                      }`}
                    >
                      {t("matching.remove_saved", "Remove")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
