"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import supabase from "../lib/supabaseClient";
import { Globe, Moon, Sun } from "lucide-react";
import { useTranslation } from "../lib/i18n";
import { useTheme } from "../lib/theme";

export default function SiteHeader() {
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();
  const isLight = theme === "light";

  const refreshProfile = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const u = data?.user || null;
      setUser(u);
      if (u) {
        const { data: profile } = await supabase.from("profiles").select("avatar_data_url,avatar_url").eq("id", u.id).single();
        const avatar = profile?.avatar_data_url || profile?.avatar_url || null;
        setAvatarUrl(avatar || null);
      } else {
        setAvatarUrl(null);
      }
    } catch (err) {
      console.warn("Failed to refresh profile", err);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await refreshProfile();
    })();
    const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
      if (!mounted) return;
      await refreshProfile();
    });
    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl ${isLight ? "border-b border-slate-900/8 bg-[#f8fbff]/80" : "border-b border-white/8 bg-[#050816]/80"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        <button
          onClick={async () => { await refreshProfile(); router.push('/'); }}
          className="group flex items-center gap-3"
        >
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-semibold shadow-[0_10px_30px_-18px_rgba(0,0,0,0.18)] ${isLight ? "border border-slate-900/8 bg-white text-slate-950" : "border border-white/10 bg-white/5 text-white shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)]"}`}>
            <span className="h-2 w-2 rounded-full bg-[#8fb7ff]" />
            <span className="mx-1 h-2 w-2 rounded-full bg-[#dfe8ff]" />
            <span className="h-2 w-2 rounded-full bg-[#18c29c]" />
          </span>
          <span className={`font-display text-lg transition ${isLight ? "text-slate-950 group-hover:text-slate-700" : "text-white group-hover:text-[#dfe8ff]"}`}>
            {t('site.title', 'The Project Hub')}
          </span>
        </button>

        <nav className={`hidden items-center gap-6 text-sm lg:flex ${isLight ? "text-slate-500" : "text-[#8d9ab5]"}`}>
          <Link href="/#how-it-works" className={`transition ${isLight ? "hover:text-slate-950" : "hover:text-white"}`}>
            {t("home.nav_how")}
          </Link>
          <Link href="/#features" className={`transition ${isLight ? "hover:text-slate-950" : "hover:text-white"}`}>
            {t("home.nav_features")}
          </Link>
          <Link href="/#trust" className={`transition ${isLight ? "hover:text-slate-950" : "hover:text-white"}`}>
            {t("home.nav_trust")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${isLight ? "border border-slate-900/8 bg-white text-slate-700 hover:bg-slate-100" : "border border-white/10 bg-white/5 text-[#d8e4ff] hover:border-[#234a7e] hover:bg-[#0a1528]"}`}
            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
            <span className="font-medium">{isLight ? "Dark" : "Light"}</span>
          </button>

          <button
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${isLight ? "border border-slate-900/8 bg-white text-slate-700 hover:bg-slate-100" : "border border-white/10 bg-white/5 text-[#d8e4ff] hover:border-[#234a7e] hover:bg-[#0a1528]"}`}
          >
            <Globe size={16} />
            <span className="font-medium">{locale === 'en' ? t('header.language_label_ar', 'العربية') : t('header.language_label_en', 'English')}</span>
          </button>

          {user ? (
            <Link href="/profile/settings" className="flex items-center gap-2">
              <div className={`h-9 w-9 overflow-hidden rounded-full ${isLight ? "border border-slate-900/8 bg-white" : "border border-white/10 bg-white/5"}`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#8fb7ff]">Me</div>
                )}
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin" className={`rounded-full px-4 py-1.5 text-sm transition ${isLight ? "border border-slate-900/8 text-slate-700 hover:bg-slate-100" : "border border-white/10 text-[#d8e4ff] hover:border-[#234a7e] hover:bg-[#0a1528]"}`}>
                {t('header.sign_in', 'Sign In')}
              </Link>
              <Link href="/auth/signup" className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${isLight ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-[#edf2ff] text-[#09111f] hover:bg-white"}`}>
                {t('header.sign_up', 'Sign Up')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
