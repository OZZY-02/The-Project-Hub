"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';
import Link from 'next/link';
import { useTranslation } from '../../../lib/i18n';

export default function SigninPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const align = locale === 'ar' ? 'text-right' : 'text-left';
  const flow = locale === 'ar' ? 'lg:flex-row-reverse' : 'lg:flex-row';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setIsError(true);
        setLoading(false);
        return;
      }

      setMessage(t('auth.signin_success', 'Signed in successfully.'));
      setLoading(false);
      router.push('/');
    } catch (err: any) {
      setMessage(err?.message || t('auth.signin_error', 'An error occurred during sign in.'));
      setIsError(true);
      setLoading(false);
    }
  };

  return (
    <div
      dir={dir}
      className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#243a34_0%,transparent_45%),radial-gradient(circle_at_80%_0%,#3b2e25_0%,transparent_40%),linear-gradient(180deg,#0b1413_0%,#0f1c1a_40%,#141a17_100%)] text-[#f4efe6]"
    >
      <main className={`mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 ${flow}`}>
        <section className={`flex-1 ${align}`}>
          <p className="text-xs uppercase tracking-[0.35em] text-[#d9b88c]">{t('auth.kicker', 'The Project Hub')}</p>
          <h1 className="font-display mt-4 text-4xl text-[#f7f1e7]">{t('auth.signin_title', 'Welcome back, maker')}</h1>
          <p className="mt-4 text-lg text-[#d6d0c6]">{t('auth.signin_subtitle', 'Pick up your profile, meet your community, and keep building with your team.')}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-[#3b4b44] bg-[#172421] px-4 py-2 text-sm text-[#e8dcc5]">{t('auth.badge_1', 'Portfolio-ready')}</span>
            <span className="rounded-full border border-[#3b4b44] bg-[#172421] px-4 py-2 text-sm text-[#e8dcc5]">{t('auth.badge_2', 'Local matches')}</span>
            <span className="rounded-full border border-[#3b4b44] bg-[#172421] px-4 py-2 text-sm text-[#e8dcc5]">{t('auth.badge_3', 'Arabic + English')}</span>
          </div>
        </section>

        <section className="flex-1">
          <div className="rounded-3xl border border-[#2e403a] bg-[#111f1c]/90 p-8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.8)]">
            <div className={`${align}`}>
              <h2 className="text-2xl font-semibold text-[#f7f1e7]">{t('auth.signin_header', 'Sign in')}</h2>
              <p className="mt-2 text-sm text-[#cfc8be]">{t('auth.signin_helper', 'Use the email and password you used to create your maker profile.')}</p>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm text-[#e8dcc5]">
                {t('auth.email_label', 'Email')}
                <input
                  required
                  type="email"
                  placeholder={t('auth.email_placeholder', 'Email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7] placeholder:text-[#8b8a86]"
                />
              </label>
              <label className="block text-sm text-[#e8dcc5]">
                {t('auth.password_label', 'Password')}
                <div className="relative mt-2">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.password_placeholder', 'Password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 pr-24 text-[#f7f1e7] placeholder:text-[#8b8a86]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#d9b88c] hover:text-[#f0d6a8]"
                  >
                    {showPassword ? t('auth.hide_password', 'Hide') : t('auth.show_password', 'Show')}
                  </button>
                </div>
              </label>
              {message && (
                <p className={`text-sm ${isError ? 'text-[#f0a37f]' : 'text-[#b9e7c9]'}`}>{message}</p>
              )}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full bg-[#d6784d] px-6 py-3 font-semibold text-[#1b120e] transition hover:translate-y-[-1px] hover:bg-[#e0875e]"
                >
                  {loading ? t('auth.signing_in', 'Signing in...') : t('auth.signin_button', 'Sign In')}
                </button>
                <Link href="/auth/signup" className="text-sm text-[#d9b88c] hover:text-[#f0d6a8]">
                  {t('auth.create_account', 'Create an account')}
                </Link>
              </div>
              <Link href="/" className={`mt-6 inline-flex text-sm text-[#93b3a8] hover:text-[#c7e5da] ${align}`}>
                {t('auth.back_home', 'Back to home')}
              </Link>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
