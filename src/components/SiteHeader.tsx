"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "../lib/supabaseClient";
import { Globe } from "lucide-react";
import { useTranslation } from "../lib/i18n";

export default function SiteHeader() {
  const { t, locale, setLocale } = useTranslation();
  const [user, setUser] = useState<any | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();

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
    return () => { mounted = false; };
  }, []);

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <button onClick={async () => { await refreshProfile(); router.push('/'); }} className="text-2xl font-bold text-[#1e40af] hover:opacity-80">{t('site.title', 'The Project Hub')}</button>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          className="flex items-center space-x-2 bg-gray-100 text-[#1e40af] py-1 px-3 rounded-full text-sm hover:bg-gray-200 transition"
        >
          <Globe size={16} />
          <span className='font-medium'>{locale === 'en' ? t('header.language_label_ar', 'العربية') : t('header.language_label_en', 'English')}</span>
        </button>

        {user ? (
          <Link href="/profile/settings" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
              {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Me</div>}
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth/signin" className="px-3 py-1 rounded text-sm border">{t('header.sign_in', 'Sign In')}</Link>
            <Link href="/auth/signup" className="px-3 py-1 rounded bg-[#1e40af] text-white">{t('header.sign_up', 'Sign Up')}</Link>
          </div>
        )}
      </div>
    </header>
  );
}
