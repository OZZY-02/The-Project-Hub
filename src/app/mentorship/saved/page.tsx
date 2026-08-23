"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "../../../lib/i18n";
import { useTheme } from "../../../lib/theme";
import { CATEGORY_META } from "../../../lib/mentorship-data";
import { loadSaved, removeSaved, type SavedItem } from "../../../lib/mentorship-saved";
import {
  ArrowLeft, BookmarkCheck, ExternalLink, GraduationCap, MapPin, Star, Trash2,
} from "lucide-react";

function RatingStars({ rating, label }: { rating: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${label}: ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} fill={i < rating ? "currentColor" : "none"} strokeWidth={1.5} aria-hidden="true" />
      ))}
    </span>
  );
}

export default function SavedMentorshipPage() {
  const { t, locale } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // localStorage is only readable after mount, so render a loading state first
  // rather than flashing the empty state at everyone. Deferred by a frame to
  // match how ThemeProvider and I18nProvider hydrate client-only state.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setItems(loadSaved());
      setLoading(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  /* ── Midnight & Amber palette ── */
  const shellCls   = isLight ? "bg-ivory-100 text-midnight-700" : "bg-midnight-950 text-midnight-100";
  const cardCls    = isLight ? "border-ivory-300 bg-ivory-50 shadow-sm" : "border-midnight-700 bg-midnight-800";
  const titleCls   = isLight ? "text-midnight-900" : "text-ivory-50";
  const mutedCls   = isLight ? "text-slate-500" : "text-midnight-300";
  const dimCls     = isLight ? "text-slate-400" : "text-midnight-400";
  const accentCls  = isLight ? "text-amber-600" : "text-amber-400";
  const primaryBtn = isLight ? "bg-midnight-900 text-white hover:bg-midnight-700" : "bg-ivory-50 text-midnight-900 hover:bg-ivory-200";
  const outlineBtn = isLight ? "border-ivory-300 text-midnight-700 hover:border-ivory-400" : "border-midnight-700 text-midnight-200 hover:border-midnight-600";
  const focusRing  = "focus:outline-none focus:ring-2 focus:ring-amber-400";

  const mentors = items.filter((item): item is Extract<SavedItem, { kind: "mentor" }> => item.kind === "mentor");
  const offerings = items.filter((item): item is Extract<SavedItem, { kind: "offering" }> => item.kind === "offering");

  return (
    <div dir={dir} className={`min-h-screen ${shellCls}`}>
      <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">

        <Link href="/mentorship"
          className={`mb-6 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 ${outlineBtn} ${focusRing}`}>
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {t("mentorship.back_to_mentorship", "Back to mentorship")}
        </Link>

        <div className="mb-8">
          <h1 className={`font-display text-3xl font-bold tracking-tight sm:text-4xl ${titleCls}`}>
            {t("mentorship.saved_title", "Saved mentors & programs")}
          </h1>
          <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${mutedCls}`}>
            {t("mentorship.saved_subtitle", "Everything you bookmarked, kept on this device.")}
          </p>
        </div>

        {loading ? (
          <p className={`text-sm ${mutedCls}`}>{t("mentorship.loading", "Loading mentorship…")}</p>
        ) : items.length === 0 ? (
          <div className={`rounded-2xl border p-10 text-center ${cardCls}`}>
            <BookmarkCheck size={32} className={`mx-auto mb-4 ${dimCls}`} />
            <p className={`font-semibold ${titleCls}`}>
              {t("mentorship.saved_empty", "You have not saved anything yet.")}
            </p>
            <p className={`mt-2 text-sm ${dimCls}`}>
              {t("mentorship.saved_empty_hint", "Save a mentor or a program and it will appear here.")}
            </p>
            <Link href="/mentorship"
              className={`mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${primaryBtn} ${focusRing}`}>
              {t("mentorship.saved_browse", "Browse mentorship")}
            </Link>
          </div>
        ) : (
          <div className="space-y-8">

            {mentors.length > 0 && (
              <section>
                <h2 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${accentCls}`}>
                  {t("mentorship.tab_mentors", "Mentors")} ({mentors.length})
                </h2>
                <div className="space-y-3">
                  {mentors.map(mentor => (
                    <article key={mentor.id} className={`rounded-2xl border p-5 ${cardCls}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className={`text-base font-semibold ${titleCls}`}>{mentor.name}</h3>
                          <p className={`mt-1 text-sm ${mutedCls}`}>{mentor.bio}</p>
                          <div className={`mt-3 flex items-center gap-1.5 text-xs ${dimCls}`}>
                            <MapPin size={13} className={accentCls} />
                            {mentor.location}
                          </div>
                          {mentor.tags.length > 0 && (
                            <p className={`mt-2 text-xs ${mutedCls}`}>{mentor.tags.join(" · ")}</p>
                          )}
                          {mentor.categories.length > 0 && (
                            <p className={`mt-1 text-xs ${dimCls}`}>
                              {mentor.categories.map(cat => t(CATEGORY_META[cat].labelKey, CATEGORY_META[cat].fallback)).join(" · ")}
                            </p>
                          )}
                        </div>
                        <button type="button" onClick={() => setItems(removeSaved(mentor.id))}
                          aria-label={`${t("mentorship.saved_remove", "Remove")} ${mentor.name}`}
                          className={`shrink-0 cursor-pointer rounded-lg border p-2 transition-colors ${outlineBtn} ${focusRing}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="mt-4">
                        <Link href="/mentorship"
                          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${primaryBtn} ${focusRing}`}>
                          {t("mentorship.cta_request", "Request Session")}
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {offerings.length > 0 && (
              <section>
                <h2 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${accentCls}`}>
                  {t("mentorship.tab_offerings", "Programs & Lessons")} ({offerings.length})
                </h2>
                <div className="space-y-3">
                  {offerings.map(offering => (
                    <article key={offering.id} className={`rounded-2xl border p-5 ${cardCls}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className={`text-base font-semibold ${titleCls}`}>{offering.title}</h3>
                          <p className={`mt-1 text-xs ${dimCls}`}>
                            {offering.provider}
                            <span aria-hidden="true" className="mx-1.5 opacity-40">·</span>
                            {t(CATEGORY_META[offering.category].labelKey, CATEGORY_META[offering.category].fallback)}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <RatingStars rating={offering.rating} label={offering.title} />
                            <span className={`text-xs font-medium ${isLight ? "text-midnight-700" : "text-midnight-200"}`}>
                              {t("mentorship.recommended_by", "Recommended by")} {offering.recommendedBy}
                            </span>
                          </div>
                          <p className={`mt-1.5 text-xs leading-relaxed italic ${mutedCls}`}>
                            &ldquo;{offering.review}&rdquo;
                          </p>
                        </div>
                        <button type="button" onClick={() => setItems(removeSaved(offering.id))}
                          aria-label={`${t("mentorship.saved_remove", "Remove")} ${offering.title}`}
                          className={`shrink-0 cursor-pointer rounded-lg border p-2 transition-colors ${outlineBtn} ${focusRing}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="mt-4">
                        <a href={offering.url} target="_blank" rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${primaryBtn} ${focusRing}`}>
                          {t("mentorship.cta_access", "Access")}
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {!loading && items.length > 0 && (
          <p className={`mt-8 flex items-center gap-2 text-xs ${dimCls}`}>
            <GraduationCap size={13} />
            {t("mentorship.saved_device_note", "Saved items are stored in this browser only.")}
          </p>
        )}
      </main>
    </div>
  );
}
