"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import supabase from "../lib/supabaseClient";
import { signOutUser } from "../lib/auth";
import { Globe, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useTranslation } from "../lib/i18n";
import { useTheme } from "../lib/theme";

export default function SiteHeader() {
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
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
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT") {
        setUser(null);
        setAvatarUrl(null);
        return;
      }
      void refreshProfile();
    });
    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const navLinkClass = `transition-colors duration-200 ${isLight ? "hover:text-[#1b1918]" : "hover:text-white"}`;
  const controlBtnClass = `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${isLight ? "border border-[#b7ada8]/35 bg-white text-[#6c615c] hover:bg-[#f2ede8]" : "border border-white/10 bg-white/5 text-[#d8e4ff] hover:border-[#234a7e] hover:bg-[#0a1528]"}`;
  const iconBtnClass = `flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 ${isLight ? "border border-[#b7ada8]/35 bg-white text-[#6c615c] hover:bg-[#f2ede8] hover:text-[#1b1918]" : "border border-white/10 bg-white/5 text-[#8d9ab5] hover:border-white/20 hover:text-[#d8e4ff]"}`;

  const handleSignOut = () => {
    setSigningOut(true);
    setUser(null);
    setAvatarUrl(null);
    setMobileOpen(false);
    signOutUser();
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl ${isLight ? "border-b border-[#b7ada8]/25 bg-[#f8f5f1]/90" : "border-b border-white/8 bg-[#050816]/80"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        {/* Logo */}
        <button
          onClick={async () => { await refreshProfile(); router.push('/'); }}
          className="group flex items-center gap-3"
          aria-label={t('site.title', 'The Project Hub') + ' — go home'}
        >
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${isLight ? "border border-slate-900/8 bg-white text-slate-950" : "border border-white/10 bg-white/5 text-white shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)]"}`}>
            <span className="h-2 w-2 rounded-full bg-[#8fb7ff]" />
            <span className="mx-1 h-2 w-2 rounded-full bg-[#dfe8ff]" />
            <span className="h-2 w-2 rounded-full bg-[#18c29c]" />
          </span>
          <span className={`font-display text-lg transition-colors duration-200 ${isLight ? "text-slate-950 group-hover:text-slate-700" : "text-white group-hover:text-[#dfe8ff]"}`}>
            {t('site.title', 'The Project Hub')}
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className={`hidden items-center gap-6 text-sm lg:flex ${isLight ? "text-slate-500" : "text-[#8d9ab5]"}`} aria-label="Main navigation">
          <Link href="/#portfolio" className={navLinkClass}>{t("home.nav_portfolio", "Portfolio")}</Link>
          <Link href="/mentorship" className={navLinkClass}>{t("home.nav_mentorship", "Mentorship")}</Link>
          <Link href="/matching" className={navLinkClass}>{t("home.nav_projects", "Find a Project")}</Link>
        </nav>

        {/* Desktop Controls */}
        <div className="hidden items-center gap-3 lg:flex">
          <button onClick={toggleTheme} className={iconBtnClass} aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}>
            {isLight ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
          </button>

          <button
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            className={controlBtnClass}
            aria-label={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          >
            <Globe size={15} aria-hidden="true" />
            <span className="text-xs font-semibold tracking-wide">{locale === 'en' ? 'AR' : 'EN'}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile/settings"
                className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition-opacity duration-200 hover:opacity-80 ${isLight ? "border border-slate-900/8 bg-white" : "border border-white/10 bg-white/5"}`}
                aria-label="Profile settings"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Your profile avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-[#8fb7ff]">Me</span>
                )}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className={controlBtnClass}
                aria-label={t("header.sign_out", "Sign Out")}
              >
                <LogOut size={15} aria-hidden="true" />
                <span>{signingOut ? t("header.signing_out", "Signing out…") : t("header.sign_out", "Sign Out")}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin" className={`rounded-lg px-4 py-1.5 text-sm transition-colors duration-200 ${isLight ? "border border-[#b7ada8]/35 text-[#6c615c] hover:bg-[#f2ede8]" : "border border-white/10 text-[#9eabc4] hover:border-white/20 hover:bg-white/5"}`}>
                {t('header.sign_in', 'Sign In')}
              </Link>
              <Link href="/auth/signup" className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${isLight ? "bg-[#1b1918] text-white hover:bg-[#2c2a29]" : "bg-white text-[#1b1918] hover:bg-slate-100"}`}>
                {t('header.join', 'Join')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile: right side controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <button onClick={toggleTheme} className={iconBtnClass} aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}>
            {isLight ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={controlBtnClass}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={`border-t px-6 py-4 lg:hidden ${isLight ? "border-slate-900/8 bg-[#f8fbff]/95" : "border-white/8 bg-[#050816]/95"}`}>
          <nav className={`flex flex-col gap-4 text-sm ${isLight ? "text-slate-600" : "text-[#8d9ab5]"}`} aria-label="Mobile navigation">
            <Link href="/#portfolio" onClick={() => setMobileOpen(false)} className={navLinkClass}>{t("home.nav_portfolio", "Portfolio")}</Link>
            <Link href="/mentorship" onClick={() => setMobileOpen(false)} className={navLinkClass}>{t("home.nav_mentorship", "Mentorship")}</Link>
            <Link href="/matching" onClick={() => setMobileOpen(false)} className={navLinkClass}>{t("home.nav_projects", "Find a Project")}</Link>
          </nav>
          <div className={`mt-4 flex flex-wrap items-center gap-2 border-t pt-4 ${isLight ? 'border-slate-900/8' : 'border-white/8'}`}>
            <button
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className={controlBtnClass}
              aria-label={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
            >
              <Globe size={16} aria-hidden="true" />
              <span>{locale === 'en' ? t('header.language_label_ar', 'العربية') : t('header.language_label_en', 'English')}</span>
            </button>
            {user ? (
              <>
                <Link href="/profile/settings" onClick={() => setMobileOpen(false)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${isLight ? "bg-[#1b1918] text-white hover:bg-[#2c2a29]" : "bg-white text-[#1b1918] hover:bg-slate-100"}`}>
                  {t('header.edit_profile', 'Edit Profile')}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className={controlBtnClass}
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span>{signingOut ? t("header.signing_out", "Signing out…") : t("header.sign_out", "Sign Out")}</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" onClick={() => setMobileOpen(false)} className={`rounded-lg px-4 py-1.5 text-sm transition-colors duration-200 ${isLight ? "border border-[#b7ada8]/35 text-[#6c615c] hover:bg-[#f2ede8]" : "border border-white/10 text-[#9eabc4] hover:bg-white/5"}`}>
                  {t('header.sign_in', 'Sign In')}
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileOpen(false)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${isLight ? "bg-[#1b1918] text-white hover:bg-[#2c2a29]" : "bg-white text-[#1b1918] hover:bg-slate-100"}`}>
                  {t('header.join', 'Join')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
