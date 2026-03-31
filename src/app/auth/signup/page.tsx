"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';
import Link from 'next/link';
import { useTranslation } from '../../../lib/i18n';

export default function SignupPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
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

    // simple username validation
    const uname = username?.trim();
    if (!uname || uname.length < 3 || uname.length > 30) {
      setMessage(t('auth.username_length_error', 'Username must be 3-30 characters long.'));
      setIsError(true);
      setLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(uname)) {
      setMessage(t('auth.username_charset_error', 'Username may only contain letters, numbers, dot, underscore and hyphen.'));
      setIsError(true);
      setLoading(false);
      return;
    }

    // check uniqueness (case-insensitive)
    try {
      const { data: existing } = await supabase.from('profiles').select('id').ilike('username', uname);
      if (existing && existing.length > 0) {
        setMessage(t('auth.username_taken_error', 'Username already taken. Please choose another.'));
        setIsError(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      // continue — server-side constraint will also enforce uniqueness
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
        setIsError(true);
        setLoading(false);
        return;
      }

      // upsert initial profile with username if user id is available
      const userId = data?.user?.id;
      if (userId) {
        await supabase.from('profiles').upsert({ id: userId, username: uname });
      }

      setMessage(t('auth.signup_success', 'Signup successful. Check your email to confirm your account.'));
      setLoading(false);
      // Optionally redirect to home or profile creation
      router.push('/');
    } catch (err: any) {
      setMessage(err?.message || t('auth.signup_error', 'An error occurred during signup.'));
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
          <h1 className="font-display mt-4 text-4xl text-[#f7f1e7]">{t('auth.signup_title', 'Join the makers collective')}</h1>
          <p className="mt-4 text-lg text-[#d6d0c6]">{t('auth.signup_subtitle', 'Create your maker profile and showcase your skills, projects, and location for the pilot program.')}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#2f3f39] bg-[#111f1c] p-4">
              <p className="text-sm text-[#e8dcc5]">{t('auth.signup_highlight_1', 'Connect with Sudanese talent nearby and in the diaspora.')}</p>
            </div>
            <div className="rounded-2xl border border-[#2f3f39] bg-[#111f1c] p-4">
              <p className="text-sm text-[#e8dcc5]">{t('auth.signup_highlight_2', 'Match into projects based on passion, major, and skills.')}</p>
            </div>
            <div className="rounded-2xl border border-[#2f3f39] bg-[#111f1c] p-4">
              <p className="text-sm text-[#e8dcc5]">{t('auth.signup_highlight_3', 'Get mentorship, resume feedback, and sponsorship pathways.')}</p>
            </div>
            <div className="rounded-2xl border border-[#2f3f39] bg-[#111f1c] p-4">
              <p className="text-sm text-[#e8dcc5]">{t('auth.signup_highlight_4', 'Bilingual experience in Arabic and English.')}</p>
            </div>
          </div>
        </section>

        <section className="flex-1">
          <div className="rounded-3xl border border-[#2e403a] bg-[#111f1c]/90 p-8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.8)]">
            <div className={`${align}`}>
              <h2 className="text-2xl font-semibold text-[#f7f1e7]">{t('auth.signup_header', 'Create your account')}</h2>
              <p className="mt-2 text-sm text-[#cfc8be]">{t('auth.signup_helper', 'Your username becomes your public profile URL.')}</p>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm text-[#e8dcc5]">
                {t('auth.username_label', 'Username')}
                <input
                  required
                  type="text"
                  placeholder={t('auth.username_placeholder', 'Username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7] placeholder:text-[#8b8a86]"
                />
              </label>
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
                  {loading ? t('auth.signing_up', 'Signing up...') : t('auth.signup_button', 'Sign Up')}
                </button>
                <Link href="/auth/signin" className="text-sm text-[#d9b88c] hover:text-[#f0d6a8]">
                  {t('auth.already_have_account', 'Already have an account? Sign in')}
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
