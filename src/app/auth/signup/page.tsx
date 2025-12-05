"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';
import Link from 'next/link';
import { useTranslation } from '../../../lib/i18n';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // simple username validation
    const uname = username?.trim();
    if (!uname || uname.length < 3 || uname.length > 30) {
      setMessage('Username must be 3-30 characters long.');
      setLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(uname)) {
      setMessage('Username may only contain letters, numbers, dot, underscore and hyphen.');
      setLoading(false);
      return;
    }

    // check uniqueness (case-insensitive)
    try {
      const { data: existing } = await supabase.from('profiles').select('id').ilike('username', uname);
      if (existing && existing.length > 0) {
        setMessage('Username already taken. Please choose another.');
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
        setLoading(false);
        return;
      }

      // upsert initial profile with username if user id is available
      const userId = data?.user?.id;
      if (userId) {
        await supabase.from('profiles').upsert({ id: userId, username: uname });
      }

      setMessage('Signup successful. Check your email to confirm your account.');
      setLoading(false);
      // Optionally redirect to home or profile creation
      router.push('/');
    } catch (err: any) {
      setMessage(err?.message || 'An error occurred during signup.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">{t('auth.signup.title','Sign Up')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="text" placeholder={t('auth.username_placeholder','Username')} value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border rounded p-2" />
          <input required type="email" placeholder={t('auth.email_placeholder','Email')} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2" />
          <input required type="password" placeholder={t('auth.password_placeholder','Password')} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded p-2" />
          {message && <p className="text-sm text-gray-700">{message}</p>}
          <div className="flex justify-between items-center">
            <button type="submit" disabled={loading} className="bg-[#1e40af] text-white px-4 py-2 rounded">
              {loading ? t('auth.signing_up','Signing up...') : t('auth.signup_button','Sign Up')}
            </button>
            <Link href="/auth/signin" className="text-sm text-[#1e40af]">{t('auth.already_have_account','Already have an account? Sign in')}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
