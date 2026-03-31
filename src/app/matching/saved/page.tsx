"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "../../../lib/i18n";
import supabase from "../../../lib/supabaseClient";
import { MapPin, Users, BookmarkCheck } from "lucide-react";

type MatchCard = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  tags: string[];
  type: "maker" | "mentor";
};

export default function SavedMatchesPage() {
  const { t, locale } = useTranslation();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "text-right" : "text-left";
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);

  const savedStorageKey = "matching_saved_matches";

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
          const saved = (data || []).map((row: any) => row.data).filter(Boolean) as MatchCard[];
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
    <div
      dir={dir}
      className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#223a34_0%,transparent_45%),linear-gradient(180deg,#0b1413_0%,#0f1c1a_50%,#141a17_100%)] text-[#f4efe6]"
    >
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <header className={`rounded-[28px] border border-[#2e403a] bg-[#111f1c]/90 p-8 ${align}`}>
          <div className="flex items-center gap-3 text-[#d9b88c]">
            <BookmarkCheck size={20} />
            <p className="text-xs uppercase tracking-[0.35em]">{t("matching.saved_kicker", "Saved matches")}</p>
          </div>
          <h1 className="font-display mt-4 text-3xl text-[#f7f1e7]">{t("matching.saved_title", "Your saved matches")}</h1>
          <p className="mt-2 text-sm text-[#cfc8be]">{t("matching.saved_subtitle", "Keep track of makers, mentors, and projects you want to revisit.")}</p>
        </header>

        <section className="mt-8">
          {loading ? (
            <p className="text-sm text-[#cfc8be]">{t("matching.loading_saved", "Loading saved matches...")}</p>
          ) : matches.length === 0 ? (
            <div className="rounded-2xl border border-[#2e403a] bg-[#111f1c]/90 p-6 text-sm text-[#cfc8be]">
              {t("matching.saved_empty", "You have no saved matches yet.")}
            </div>
          ) : (
            <div className="grid gap-4">
              {matches.map((match) => (
                <div key={match.id} className="rounded-2xl border border-[#2e403a] bg-[#0f1a17] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#f7f1e7]">{match.title}</h3>
                      <p className="mt-1 text-sm text-[#cfc8be]">{match.subtitle}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                      {match.type === "maker" ? t("matching.type_maker", "Maker") : t("matching.type_mentor", "Mentor")}
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
                  <div className="mt-4">
                    <button
                      onClick={() => removeSaved(match.id)}
                      className="rounded-full bg-[#ce1126] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e32636]"
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
