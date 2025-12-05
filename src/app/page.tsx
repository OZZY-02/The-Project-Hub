'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProfileRegistrationForm from '../components/ProfileRegistrationForm';
import supabase from '../lib/supabaseClient';
import { Globe, Users, TrendingUp, Cpu, ArrowRight } from 'lucide-react';

export default function HomePage() {
    const [language, setLanguage] = useState<'en' | 'ar'>('en'); 
    const [showRegistration, setShowRegistration] = useState(false);
    
    // --- Mock Translations for the Homepage ---
    const t = (key: string) => {
        const translations: any = {
            'en': {
                'slogan': 'Empowering Sudan\'s Next Generation of Makers.',
                'mission_title': 'Join The Project Hub',
                'mission_text': 'A platform built to connect Sudanese talent in Egypt and the diaspora. Build your professional portfolio, connect with complementary skills locally, and attract global mentorship and sponsorship.',
                'feature1_title': 'AI-Driven Portfolio',
                'feature1_desc': 'Automatically arrange your projects, skills, and resume data into a professional, scannable online profile.',
                'feature2_title': 'Local Team Matching',
                'feature2_desc': 'Connect with makers and professionals in your city (starting with Egypt) who have complementary skills for your projects.',
                'feature3_title': 'Mentorship & Exposure',
                'feature3_desc': 'Gain visibility to sponsors and mentors offering internships, resume reviews, and career insights.',
                'cta_signup': 'Start My Profile Now',
                'cta_sample': 'View Sample Maker Profile',
                'welcome': 'Welcome to The Project Hub',
            },
            'ar': {
                'slogan': 'تمكين الجيل القادم من المبدعين في السودان.',
                'mission_title': 'انضم إلى مركز المشاريع',
                'mission_text': 'منصة مصممة لربط المواهب السودانية في مصر والمهجر. أنشئ ملفك المهني، وتواصل مع أصحاب المهارات المكملة محلياً، واجذب الإرشاد والرعاية العالمية.',
                'feature1_title': 'ملف مهني مدعوم بالذكاء الاصطناعي',
                'feature1_desc': 'تنظيم مشاريعك ومهاراتك وسيرتك الذاتية تلقائياً في ملف شخصي احترافي وقابل للمسح الضوئي عبر الإنترنت.',
                'feature2_title': 'مطابقة الفرق المحلية',
                'feature2_desc': 'تواصل مع صناع ومهنيين في مدينتك (بدءاً من مصر) يمتلكون مهارات مكملة لمشاريعك.',
                'feature3_title': 'إرشاد وفرص عرض',
                'feature3_desc': 'اكتسب رؤية للرعاة والموجهين الذين يقدمون تدريبات داخلية ومراجعات للسيرة الذاتية ورؤى مهنية.',
                'cta_signup': 'ابدأ ملفي الشخصي الآن',
                'cta_sample': 'عرض ملف تعريفي نموذجي',
                'welcome': 'أهلاً بك في مركز المشاريع',
            }
        };
        return translations[language][key] || key;
    };

    const dir = language === 'ar' ? 'rtl' : 'ltr';
    const align = language === 'ar' ? 'text-right' : 'text-left';

    const [user, setUser] = useState<any | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const { data } = await supabase.auth.getUser();
            const u = data?.user || null;
            if (!mounted) return;
            setUser(u);
            if (u) {
                const { data: profile } = await supabase.from('profiles').select('avatar_data_url,avatar_url').eq('id', u.id).single();
                const avatar = profile?.avatar_data_url || profile?.avatar_url || null;
                if (avatar) setAvatarUrl(avatar);
            }
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
                        <button onClick={() => setShowRegistration(true)} className="inline-flex items-center justify-center bg-[#1e40af] hover:bg-[#3730a3] text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105">
                            {t('cta_signup')}
                            <ArrowRight size={20} className={`ms-2 rtl:me-2`} />
                        </button>
                        <Link href="/profile/mock-id-123" passHref>
                            <span className="inline-flex items-center justify-center bg-white text-[#1e40af] border-2 border-[#1e40af] font-semibold py-3 px-8 rounded-full transition duration-300 hover:bg-gray-100">
                                {t('cta_sample')}
                            </span>
                        </Link>
                    </div>

                    {showRegistration && (
                        <ProfileRegistrationForm onClose={() => setShowRegistration(false)} />
                    )}
                </section>

                {/* Features Section */}
                <section className="mb-12">
                    <h3 className={`text-3xl font-bold text-gray-800 mb-8 ${align}`}>
                        {language === 'en' ? 'How it Works' : 'كيف يعمل'}
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
                        {language === 'en' ? 'Pilot Program: Egypt Focus' : 'البرنامج التجريبي: التركيز على مصر'}
                    </h3>
                    <p className="text-gray-600">
                        {language === 'en' 
                            ? 'We are starting small with 100 makers in Egypt to ensure high-quality matching and support before expanding globally.' 
                            : 'نبدأ على نطاق صغير مع 100 مبدع في مصر لضمان جودة عالية في المطابقة والدعم قبل التوسع عالمياً.'}
                    </p>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white p-4 text-center mt-8">
                <p className="text-sm">&copy; {new Date().getFullYear()} The Project Hub. {language === 'en' ? 'Empowering Sudanese Makers.' : 'لتمكين المبدعين السودانيين.'}</p>
            </footer>
        </div>
    );
}