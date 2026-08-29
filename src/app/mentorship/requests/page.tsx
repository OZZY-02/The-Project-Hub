"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "../../../lib/i18n";
import { useTheme } from "../../../lib/theme";
import supabase from "../../../lib/supabaseClient";
import {
  ArrowLeft, Check, Inbox, Loader2, Lock, Send, User, X,
} from "lucide-react";

type RequestStatus = "pending" | "accepted" | "declined" | "withdrawn";

type MentorRequest = {
  id: string;
  requester_id: string;
  mentor_id: string;
  mentor_name: string;
  reason: string;
  status: RequestStatus;
  created_at: string;
};

type RequesterProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  major_field: string | null;
  location_city: string | null;
  location_country: string | null;
};

const SELECT = "id, requester_id, mentor_id, mentor_name, reason, status, created_at";

export default function MentorRequestsPage() {
  const { t, locale } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [incoming, setIncoming] = useState<MentorRequest[]>([]);
  const [sent, setSent] = useState<MentorRequest[]>([]);
  const [requesters, setRequesters] = useState<Record<string, RequesterProfile>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const quoteCls   = isLight ? "border-ivory-200 bg-ivory-100/60" : "border-midnight-700 bg-midnight-900/60";

  const statusStyles: Record<RequestStatus, string> = {
    pending:  isLight ? "border-amber-200 bg-amber-50 text-amber-800" : "border-amber-700/50 bg-amber-900/30 text-amber-200",
    accepted: isLight ? "border-emerald-500/25 bg-emerald-50 text-emerald-700" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-400",
    declined: isLight ? "border-ivory-300 bg-ivory-100 text-slate-500" : "border-midnight-700 bg-midnight-900 text-midnight-400",
    withdrawn:isLight ? "border-ivory-300 bg-ivory-100 text-slate-500" : "border-midnight-700 bg-midnight-900 text-midnight-400",
  };

  const statusLabel = (status: RequestStatus) => ({
    pending:   t("requests.status_pending", "Pending"),
    accepted:  t("requests.status_accepted", "Accepted"),
    declined:  t("requests.status_declined", "Declined"),
    withdrawn: t("requests.status_withdrawn", "Withdrawn"),
  }[status]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(locale === "ar" ? "ar" : "en", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: ud } = await supabase.auth.getUser();
      const user = ud?.user ?? null;
      setSignedIn(Boolean(user));
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles").select("is_mentor").eq("id", user.id).single();
      setIsMentor(Boolean(profile?.is_mentor));

      // RLS scopes each of these to the current user; the filters mirror the
      // policies so the intent is readable here too.
      const [inRes, sentRes] = await Promise.all([
        supabase.from("mentor_requests").select(SELECT)
          .eq("mentor_id", user.id).order("created_at", { ascending: false }),
        supabase.from("mentor_requests").select(SELECT)
          .eq("requester_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (inRes.error) throw inRes.error;
      const incomingRows = (inRes.data || []) as MentorRequest[];
      setIncoming(incomingRows);
      setSent((sentRes.data || []) as MentorRequest[]);

      // mentor_requests references auth.users, not profiles, so there is no
      // relationship for PostgREST to embed — look the requesters up directly.
      const ids = Array.from(new Set(incomingRows.map(r => r.requester_id)));
      if (ids.length > 0) {
        const { data: people } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, username, major_field, location_city, location_country")
          .in("id", ids);
        setRequesters(Object.fromEntries(((people || []) as RequesterProfile[]).map(p => [p.id, p])));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("requests.load_failed", "Could not load requests."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const respond = async (id: string, status: RequestStatus) => {
    setBusyId(id);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("mentor_requests").update({ status }).eq("id", id);
      if (updateError) throw updateError;
      setIncoming(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
      setSent(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("requests.update_failed", "Could not update the request."));
    } finally {
      setBusyId(null);
    }
  };

  const requesterName = (req: MentorRequest) => {
    const p = requesters[req.requester_id];
    if (!p) return t("requests.unknown_maker", "A maker");
    const full = `${p.first_name || ""} ${p.last_name || ""}`.trim();
    return full || p.username || t("requests.unknown_maker", "A maker");
  };

  const requesterMeta = (req: MentorRequest) => {
    const p = requesters[req.requester_id];
    if (!p) return [];
    return [p.major_field, [p.location_city, p.location_country].filter(Boolean).join(", ")].filter(Boolean) as string[];
  };

  const StatusBadge = ({ status }: { status: RequestStatus }) => (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyles[status]}`}>
      {statusLabel(status)}
    </span>
  );

  return (
    <div dir={dir} className={`min-h-screen ${shellCls}`}>
      <main className="mx-auto w-full max-w-4xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">

        <Link href="/mentorship"
          className={`mb-6 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 ${outlineBtn} ${focusRing}`}>
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {t("mentorship.back_to_mentorship", "Back to mentorship")}
        </Link>

        <div className="mb-8">
          <h1 className={`font-display text-3xl font-bold tracking-tight sm:text-4xl ${titleCls}`}>
            {t("requests.title", "Session requests")}
          </h1>
          <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${mutedCls}`}>
            {t("requests.subtitle", "Requests people have sent you, and the ones you have sent to mentors.")}
          </p>
        </div>

        {error && (
          <p role="alert" className={`mb-6 rounded-xl px-4 py-3 text-sm ${isLight ? "bg-red-50 text-red-700" : "bg-red-500/10 text-red-300"}`}>
            {error}
          </p>
        )}

        {loading ? (
          <div className={`flex items-center justify-center gap-2 rounded-2xl border p-12 ${cardCls}`}>
            <Loader2 size={20} className="animate-spin" />
            <span className={mutedCls}>{t("requests.loading", "Loading requests…")}</span>
          </div>
        ) : !signedIn ? (
          <div className={`rounded-2xl border p-10 text-center ${cardCls}`}>
            <Lock size={32} className={`mx-auto mb-4 ${dimCls}`} />
            <p className={`font-semibold ${titleCls}`}>{t("requests.signin_title", "Sign in to see your requests")}</p>
            <Link href="/auth/signin"
              className={`mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${primaryBtn} ${focusRing}`}>
              {t("header.sign_in", "Sign In")}
            </Link>
          </div>
        ) : (
          <div className="space-y-10">

            {/* ── Incoming: only mentors receive these ── */}
            {(isMentor || incoming.length > 0) && (
              <section>
                <h2 className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${accentCls}`}>
                  <Inbox size={14} />
                  {t("requests.incoming", "Requests to you")} ({incoming.length})
                </h2>

                {incoming.length === 0 ? (
                  <div className={`rounded-2xl border p-8 text-center ${cardCls}`}>
                    <p className={`text-sm ${mutedCls}`}>
                      {t("requests.incoming_empty", "No one has requested a session with you yet.")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incoming.map(req => (
                      <article key={req.id} className={`rounded-2xl border p-5 ${cardCls}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className={`text-base font-semibold ${titleCls}`}>{requesterName(req)}</h3>
                            <p className={`mt-0.5 text-xs ${dimCls}`}>
                              {[...requesterMeta(req), formatDate(req.created_at)].join(" · ")}
                            </p>
                          </div>
                          <StatusBadge status={req.status} />
                        </div>

                        <div className={`mt-3 rounded-xl border p-3 ${quoteCls}`}>
                          <p className={`text-sm leading-relaxed ${mutedCls}`}>{req.reason}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {req.status === "pending" ? (
                            <>
                              <button type="button" disabled={busyId === req.id}
                                onClick={() => respond(req.id, "accepted")}
                                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${primaryBtn} ${focusRing}`}>
                                <Check size={13} /> {t("requests.accept", "Accept")}
                              </button>
                              <button type="button" disabled={busyId === req.id}
                                onClick={() => respond(req.id, "declined")}
                                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${outlineBtn} ${focusRing}`}>
                                <X size={13} /> {t("requests.decline", "Decline")}
                              </button>
                            </>
                          ) : (
                            <button type="button" disabled={busyId === req.id}
                              onClick={() => respond(req.id, "pending")}
                              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${outlineBtn} ${focusRing}`}>
                              {t("requests.reopen", "Reopen")}
                            </button>
                          )}

                          {requesters[req.requester_id] && (
                            <Link href={`/profile/${req.requester_id}`}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${outlineBtn} ${focusRing}`}>
                              <User size={13} /> {t("requests.view_profile", "View profile")}
                            </Link>
                          )}
                        </div>

                        {req.status === "accepted" && (
                          <p className={`mt-3 text-xs ${dimCls}`}>
                            {t("requests.accepted_note", "Accepted. There is no messaging yet — reach out using the contact details on their profile.")}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── Outgoing ── */}
            <section>
              <h2 className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${accentCls}`}>
                <Send size={14} />
                {t("requests.outgoing", "Requests you sent")} ({sent.length})
              </h2>

              {sent.length === 0 ? (
                <div className={`rounded-2xl border p-8 text-center ${cardCls}`}>
                  <p className={`text-sm ${mutedCls}`}>
                    {t("requests.outgoing_empty", "You have not requested a session yet.")}
                  </p>
                  <Link href="/mentorship"
                    className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${primaryBtn} ${focusRing}`}>
                    {t("requests.find_mentor", "Find a mentor")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {sent.map(req => (
                    <article key={req.id} className={`rounded-2xl border p-5 ${cardCls}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className={`text-base font-semibold ${titleCls}`}>{req.mentor_name}</h3>
                          <p className={`mt-0.5 text-xs ${dimCls}`}>{formatDate(req.created_at)}</p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className={`mt-3 rounded-xl border p-3 ${quoteCls}`}>
                        <p className={`text-sm leading-relaxed ${mutedCls}`}>{req.reason}</p>
                      </div>

                      {req.status === "pending" && (
                        <div className="mt-4">
                          <button type="button" disabled={busyId === req.id}
                            onClick={() => respond(req.id, "withdrawn")}
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${outlineBtn} ${focusRing}`}>
                            {t("requests.withdraw", "Withdraw")}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
