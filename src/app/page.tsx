"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ProfileRegistrationForm from "../components/ProfileRegistrationForm";
import supabase from "../lib/supabaseClient";
import { Globe, Users, TrendingUp, Cpu, ArrowRight } from "lucide-react";
import { useTranslation } from "../lib/i18n";

export default function HomePage() {
    const { t, locale } = useTranslation();
    const [showRegistration, setShowRegistration] = useState(false);
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    const align = locale === 'ar' ? 'text-right' : 'text-left';
    const [user, setUser] = useState<any | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [profileComplete, setProfileComplete] = useState(false);

    const refetchProfile = async () => {
        try {
            const { data } = await supabase.auth.getUser();
            const u = data?.user || null;
            setUser(u);
            if (!u) {
                setAvatarUrl(null);
                setProfileComplete(false);
                return;
            }

            const { data: profile } = await supabase.from('profiles').select('avatar_data_url,avatar_url,first_name,last_name,username,location_country,location_city,major_field,passion_sector,bio').eq('id', u.id).single();
            const avatar = profile?.avatar_data_url || profile?.avatar_url || null;
            setAvatarUrl(avatar || null);

            const filled = Boolean(
                (profile && (
                    profile.username || profile.first_name || profile.avatar_data_url || profile.location_country || profile.location_city || profile.major_field || profile.passion_sector || profile.bio
                ))
            );
            setProfileComplete(filled);
        } catch (err) {
            console.warn('Failed to fetch profile', err);
            setProfileComplete(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!mounted) return;
            await refetchProfile();
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <div dir={dir} className="min-h-screen bg-gray-50 font-sans">
            {/* Header is rendered in the root layout now */}

            <main className="max-w-6xl mx-auto p-6 sm:p-10">
                {/* Hero Section */}
                <section className={`bg-[#e0e7ff] p-10 rounded-3xl shadow-lg mb-12 ${align}`}>
                    <h2 className="text-5xl font-extrabold text-[#1e40af] mb-4 leading-tight">
                        {t('slogan')}
                    </h2>
                    <p className="text-xl text-gray-700 max-w-3xl mb-8">
                        {t('mission_text')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        {( !user || !profileComplete ) ? (
                            <button onClick={() => setShowRegistration(true)} className="inline-flex items-center justify-center bg-[#1e40af] hover:bg-[#3730a3] text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105">
                                {t('header.start_profile', 'Start My Profile Now')}
                                <ArrowRight size={20} className={`ms-2 rtl:me-2`} />
                            </button>
                        ) : (
                            <Link href="/profile/settings" className="inline-flex items-center justify-center bg-white text-[#1e40af] border-2 border-[#1e40af] font-semibold py-3 px-8 rounded-full transition duration-300 hover:bg-gray-100">
                                {t('header.edit_profile', 'Edit Profile')}
                            </Link>
                        )}
                        <Link href="/profile/mock-id-123" passHref>
                            <span className="inline-flex items-center justify-center bg-white text-[#1e40af] border-2 border-[#1e40af] font-semibold py-3 px-8 rounded-full transition duration-300 hover:bg-gray-100">
                                {t('cta_sample')}
                            </span>
                        </Link>
                    </div>

                    {showRegistration && (
                        <ProfileRegistrationForm onClose={() => setShowRegistration(false)} onSaved={async () => { await refetchProfile(); }} />
                    )}
                </section>

                {/* Features Section */}
                <section className="mb-12">
                            <h3 className={`text-3xl font-bold text-gray-800 mb-8 ${align}`}>
                        {t('mission_title', 'How it Works')}
                    </h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#4f46e5]">
                            <Cpu size={32} className="text-[#4f46e5] mb-3" />
                            <h4 className={`text-xl font-bold text-gray-900 mb-2 ${align}`}>{t('feature1_title')}</h4>
                            <p className={`text-gray-600 ${align}`}>{t('feature1_desc')}</p>
                        </div>
                        {/* Feature 2 */}
                        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#4f46e5]">
                            <Users size={32} className="text-[#4f46e5] mb-3" />
                            <h4 className={`text-xl font-bold text-gray-900 mb-2 ${align}`}>{t('feature2_title')}</h4>
                            <p className={`text-gray-600 ${align}`}>{t('feature2_desc')}</p>
                        </div>
                        {/* Feature 3 */}
                        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#4f46e5]">
                            <TrendingUp size={32} className="text-[#4f46e5] mb-3" />
                            <h4 className={`text-xl font-bold text-gray-900 mb-2 ${align}`}>{t('feature3_title')}</h4>
                            <p className={`text-gray-600 ${align}`}>{t('feature3_desc')}</p>
                        </div>
                    </div>
                </section>

                {/* Pilot Callout */}
                <section className={`bg-gray-100 p-8 rounded-xl shadow-inner ${align}`}>
                        <h3 className={`text-2xl font-bold text-gray-800 mb-2`}>
                        {t('mission_title', 'Pilot Program: Egypt Focus')}
                    </h3>
                    <p className="text-gray-600">
                        {t('mission_text', 'We are starting small with 100 makers in Egypt to ensure high-quality matching and support before expanding globally.')}
                    </p>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white p-4 text-center mt-8">
                <p className="text-sm">&copy; {new Date().getFullYear()} The Project Hub. {locale === 'en' ? 'Empowering Sudanese Makers.' : 'لتمكين المبدعين السودانيين.'}</p>
            </footer>
        </div>
    );
}