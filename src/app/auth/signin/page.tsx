"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';
import Link from 'next/link';
import { useTranslation } from '../../../lib/i18n';

export default function SigninPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage('Signed in successfully.');
      setLoading(false);
      router.push('/');
    } catch (err: any) {
      setMessage(err?.message || 'An error occurred during sign in.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">{t('auth.signin.title','Sign In')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="email" placeholder={t('auth.email_placeholder','Email')} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2" />
          <input required type="password" placeholder={t('auth.password_placeholder','Password')} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded p-2" />
          {message && <p className="text-sm text-gray-700">{message}</p>}
          <div className="flex justify-between items-center">
            <button type="submit" disabled={loading} className="bg-[#1e40af] text-white px-4 py-2 rounded">
              {loading ? t('auth.signing_in','Signing in...') : t('auth.signin_button','Sign In')}
            </button>
            <Link href="/auth/signup" className="text-sm text-[#1e40af]">{t('auth.create_account','Create an account')}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
