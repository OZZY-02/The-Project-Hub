"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';
import Link from 'next/link';
import { useTranslation } from '../../../lib/i18n';
import { useTheme } from '../../../lib/theme';
import { ArrowRight, BadgeCheck, Lock, Sparkles } from 'lucide-react';
import EmailInput from '../../../components/auth/EmailInput';

export default function SigninPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const align = locale === 'ar' ? 'text-right' : 'text-left';
  const isLight = theme === 'light';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsError(false);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setIsError(true);
        setLoading(false);
        return;
      }
      setLoading(false);
      router.push('/');
    } catch (err: any) {
      setMessage(err?.message || t('auth.signin_error', 'An error occurred during sign in.'));
      setIsError(true);
      setLoading(false);
    }
  };

  const shellClass = isLight
    ? 'home-shell home-shell-light min-h-screen text-slate-950'
    : 'home-shell home-shell-dark min-h-screen text-[#f5f7fb]';
  const titleClass = isLight ? 'text-slate-950' : 'text-white';
  const secondaryTextClass = isLight ? 'text-slate-600' : 'text-[#9eabc4]';
  const cardClass = isLight
    ? 'rounded-3xl border border-slate-900/8 bg-white/90 p-8 shadow-[0_22px_70px_-52px_rgba(15,23,42,0.18)] backdrop-blur-xl'
    : 'rounded-3xl border border-white/8 bg-white/[0.04] p-8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl';
  const inputClass = isLight
    ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:border-[#2258d1] focus:outline-none'
    : 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f5f7fb] placeholder:text-[#6f7e9d] transition-colors duration-150 focus:border-[#8fb7ff] focus:outline-none';
  const primaryBtnClass = isLight
    ? 'inline-flex min-w-[140px] items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:opacity-60'
    : 'inline-flex min-w-[140px] items-center justify-center rounded-full bg-[#2258d1] text-white px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1a46ab] disabled:translate-y-0 disabled:opacity-60';
  const badgeClass = isLight
    ? 'inline-flex items-center gap-2 rounded-full border border-slate-900/8 bg-white px-4 py-2 text-sm text-slate-700'
    : 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#d8e4ff]';
  const accentClass = isLight ? 'text-[#2258d1]' : 'text-[#8fb7ff]';

  return (
    <div dir={dir} className={shellClass}>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 sm:px-8 lg:flex-row lg:items-center lg:gap-16">

        {/* Left: branding */}
        <section className={`flex-1 ${align}`}>
          <p className="section-kicker">{t('auth.kicker', 'The Project Hub')}</p>
          <h1 className={`font-display mt-4 text-4xl leading-tight sm:text-5xl ${titleClass}`}>
            {t('auth.signin_title', 'Welcome back, maker')}
          </h1>
          <p className={`mt-5 text-lg leading-8 ${secondaryTextClass}`}>
            {t('auth.signin_subtitle', 'Pick up where you left off. Your community, projects, and opportunities are waiting.')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className={badgeClass}>
              <BadgeCheck size={14} className={accentClass} aria-hidden="true" />
              {t('auth.badge_1', 'Portfolio-ready profile')}
            </span>
            <span className={badgeClass}>
              <Lock size={14} className={accentClass} aria-hidden="true" />
              {t('auth.badge_2', 'Community-first privacy')}
            </span>
            <span className={badgeClass}>
              <Sparkles size={14} className={accentClass} aria-hidden="true" />
              {t('auth.badge_3', 'AI-powered matching')}
            </span>
          </div>

          <p className={`mt-10 text-sm ${secondaryTextClass}`}>
            {t('auth.no_account', "Don't have an account yet?")}{' '}
            <Link href="/auth/signup" className={`font-semibold underline underline-offset-2 transition-colors duration-150 ${isLight ? 'text-slate-950 hover:text-slate-700' : 'text-white hover:text-[#dfe8ff]'}`}>
              {t('auth.create_account', 'Create one for free')}
            </Link>
          </p>
        </section>

        {/* Right: form card */}
        <section className="flex-1">
          <div className={cardClass}>
            <div className={align}>
              <h2 className={`text-2xl font-semibold ${titleClass}`}>{t('auth.signin_header', 'Sign in to your account')}</h2>
              <p className={`mt-2 text-sm ${secondaryTextClass}`}>{t('auth.signin_helper', 'Enter your email and password below.')}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="signin-email" className={`block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-[#c8d4e8]'}`}>
                  {t('auth.email_label', 'Email address')}
                </label>
                <EmailInput
                  id="signin-email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={setEmail}
                  className={`mt-2 ${inputClass}`}
                />
              </div>

              <div>
                <label htmlFor="signin-password" className={`block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-[#c8d4e8]'}`}>
                  {t('auth.password_label', 'Password')}
                </label>
                <div className="relative mt-2">
                  <input
                    id="signin-password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-20`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold transition-colors duration-150 ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-[#8fb7ff] hover:text-[#c8d4e8]'}`}
                  >
                    {showPassword ? t('auth.hide_password', 'Hide') : t('auth.show_password', 'Show')}
                  </button>
                </div>
              </div>

              {message && (
                <p role={isError ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm ${isError ? (isLight ? 'bg-red-50 text-red-700' : 'bg-[#2a1916] text-[#f0a37f]') : (isLight ? 'bg-green-50 text-green-700' : 'bg-[#0f2a1c] text-[#b9e7c9]')}`}>
                  {message}
                </p>
              )}

              <div className="pt-1">
                <button type="submit" disabled={loading} className={`w-full ${primaryBtnClass}`}>
                  {loading ? t('auth.signing_in', 'Signing in…') : (
                    <>
                      {t('auth.signin_button', 'Sign In')}
                      <ArrowRight size={16} className="ms-2 rtl:rotate-180" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className={`mt-6 border-t pt-5 text-center text-sm ${isLight ? 'border-slate-100 text-slate-500' : 'border-white/8 text-[#6f7e9d]'}`}>
              <Link href="/" className={`transition-colors duration-150 ${isLight ? 'hover:text-slate-800' : 'hover:text-white'}`}>
                ← {t('auth.back_home', 'Back to home')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
