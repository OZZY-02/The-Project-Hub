'use client';

import React, { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Briefcase, MapPin, Star, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  location_city: string;
  location_country: string;
  major_field: string;
  passion_sector: string;
  is_mentor: boolean;
  bio: string;
  template_id: 'layout-1' | 'layout-2';
}

interface Skill {
  skill_name: string;
  proficiency_level: number;
}

interface Project {
  project_title_en: string;
  project_title_ar: string;
  description_en: string;
  description_ar: string;
  user_role: string;
  is_team_project: boolean;
  image_url: string;
}

const getBilingualText = (en: string | null, ar: string | null, lang: 'en' | 'ar', fallback = '') => {
  if (lang === 'ar' && ar) return ar;
  if (en) return en;
  return fallback;
};

export default function MakerProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const profileId = params.id;
  const { locale } = useTranslation();
  const { theme } = useTheme();
  const language = locale === 'ar' ? 'ar' : 'en';
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const align = language === 'ar' ? 'text-right' : 'text-left';
  const isLight = theme === 'light';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', profileId).single();
        if (data && !error) {
          setProfile({
            id: data.id,
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            location_city: data.location_city || '',
            location_country: data.location_country || '',
            major_field: data.major_field || '',
            passion_sector: data.passion_sector || '',
            is_mentor: data.is_mentor || false,
            bio: data.bio || '',
            template_id: data.template_id || 'layout-1',
          });
          setSkills([]);
          setProjects([]);
          setLoading(false);
          return;
        }
      } catch {}

      // fallback mock
      await new Promise(r => setTimeout(r, 400));
      setProfile({
        id: profileId,
        first_name: 'Ahmed',
        last_name: 'Mohamed',
        location_city: 'Cairo',
        location_country: 'Egypt',
        major_field: 'Electrical Engineering',
        passion_sector: 'Renewable Energy',
        is_mentor: true,
        bio: 'Sudanese electrical engineer dedicated to developing affordable solar solutions for communities across the region. I leverage sustainable technology to bring accessible power to underserved areas, focusing on practical and scalable prototypes.',
        template_id: profileId === 'layout-2' ? 'layout-2' : 'layout-1',
      });
      setSkills([
        { skill_name: 'Python', proficiency_level: 4 },
        { skill_name: 'AutoCAD', proficiency_level: 5 },
        { skill_name: 'Project Management', proficiency_level: 3 },
        { skill_name: 'Solar Modeling', proficiency_level: 4 },
        { skill_name: 'Circuit Design', proficiency_level: 4 },
      ]);
      setProjects([
        {
          project_title_en: 'Low-Cost Solar Water Pump',
          project_title_ar: 'مضخة مياه شمسية منخفضة التكلفة',
          description_en: 'Designed and prototyped a solar-powered water pump system for small agricultural use, reducing reliance on expensive diesel generators and minimizing environmental impact.',
          description_ar: 'تصميم نموذج أولي لنظام مضخة مياه تعمل بالطاقة الشمسية مخصص للاستخدام الزراعي الصغير.',
          user_role: 'Lead Designer & Engineer',
          is_team_project: true,
          image_url: 'https://placehold.co/800x500/10b981/ffffff?text=Solar+Pump+Project',
        },
        {
          project_title_en: 'Maadi Community Energy Audit',
          project_title_ar: 'تدقيق الطاقة لمجتمع المعادي',
          description_en: 'Conducted a deep-dive analysis of energy consumption in a Cairo neighborhood to propose efficiency improvements and reduce household electricity costs by 30%.',
          description_ar: 'إجراء تحليل متعمق لاستهلاك الطاقة في حي محلي بالقاهرة لاقتراح تحسينات في الكفاءة.',
          user_role: 'Researcher & Analyst',
          is_team_project: false,
          image_url: 'https://placehold.co/800x500/f59e0b/000000?text=Energy+Audit',
        },
      ]);
      setLoading(false);
    })();
  }, [profileId]);

  // Style tokens
  const shellClass = isLight
    ? 'home-shell home-shell-light min-h-screen text-slate-950'
    : 'home-shell home-shell-dark min-h-screen text-[#f5f7fb]';
  const titleClass = isLight ? 'text-slate-950' : 'text-white';
  const secondaryTextClass = isLight ? 'text-slate-600' : 'text-[#9eabc4]';
  const mutedClass = isLight ? 'text-slate-400' : 'text-[#6f7e9d]';
  const cardClass = isLight
    ? 'rounded-2xl border border-slate-900/8 bg-white/90 backdrop-blur-xl'
    : 'rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl';
  const tagClass = isLight
    ? 'inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700'
    : 'inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[#d8e4ff]';

  if (loading) {
    return (
      <div dir={dir} className={shellClass}>
        <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div className="space-y-4">
              <div className={`${cardClass} p-6`}>
                <div className="skeleton mx-auto h-24 w-24 rounded-full" />
                <div className="skeleton mx-auto mt-4 h-5 w-32 rounded" />
                <div className="skeleton mx-auto mt-2 h-4 w-24 rounded" />
              </div>
            </div>
            <div className="space-y-4">
              <div className={`${cardClass} p-6`}>
                <div className="skeleton h-5 w-28 rounded mb-4" />
                <div className="skeleton h-4 w-full rounded mb-2" />
                <div className="skeleton h-4 w-4/5 rounded" />
              </div>
              {[1, 2].map(i => (
                <div key={i} className={`${cardClass} flex gap-6 p-6`}>
                  <div className="skeleton h-40 w-48 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="skeleton h-6 w-3/4 rounded" />
                    <div className="skeleton h-4 w-1/3 rounded" />
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-4 w-5/6 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div dir={dir} className={shellClass}>
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <h1 className={`text-2xl font-bold ${titleClass}`}>Profile Not Found</h1>
          <button onClick={() => router.push('/')} className={`mt-4 inline-flex items-center gap-2 text-sm transition-colors duration-150 ${secondaryTextClass} hover:${titleClass}`}>
            <ArrowLeft size={16} aria-hidden="true" /> Go to Hub Home
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || 'Maker';
  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || '?';
  const location = [profile.location_city, profile.location_country].filter(Boolean).join(', ');

  return (
    <div dir={dir} className={shellClass}>
      <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-8">

        {/* Back link */}
        <button
          onClick={() => router.back()}
          className={`mb-8 inline-flex items-center gap-2 text-sm transition-colors duration-150 ${mutedClass} hover:${secondaryTextClass}`}
        >
          <ArrowLeft size={15} className="rtl:rotate-180" aria-hidden="true" />
          {language === 'ar' ? 'رجوع' : 'Back'}
        </button>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* Sidebar */}
          <aside className="space-y-4">

            {/* Avatar + identity card */}
            <div className={`${cardClass} p-6 ${align}`}>
              <div className="mb-5 flex flex-col items-center text-center">
                <div className={`h-24 w-24 overflow-hidden rounded-full border-2 ${isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-white/5'}`}>
                  <div className={`flex h-full w-full items-center justify-center text-2xl font-bold ${isLight ? 'text-slate-400' : 'text-[#8fb7ff]'}`}>
                    {initials}
                  </div>
                </div>
                <h1 className={`mt-4 text-xl font-bold ${titleClass}`}>{fullName}</h1>
                {profile.is_mentor && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#8fb7ff]/15 px-3 py-1 text-xs font-semibold text-[#8fb7ff]">
                    <Star size={11} aria-hidden="true" />
                    {language === 'ar' ? 'مرشد معتمد' : 'Verified Mentor'}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {location && (
                  <div className={`flex items-center gap-2 text-sm ${secondaryTextClass}`}>
                    <MapPin size={14} className={isLight ? 'text-slate-400' : 'text-[#6f7e9d]'} aria-hidden="true" />
                    <span>{location}</span>
                  </div>
                )}
                {profile.major_field && (
                  <div className={`flex items-center gap-2 text-sm ${secondaryTextClass}`}>
                    <Briefcase size={14} className={isLight ? 'text-slate-400' : 'text-[#6f7e9d]'} aria-hidden="true" />
                    <span>{profile.major_field}</span>
                  </div>
                )}
                {profile.passion_sector && (
                  <div className={`flex items-center gap-2 text-sm ${secondaryTextClass}`}>
                    <Users size={14} className={isLight ? 'text-slate-400' : 'text-[#6f7e9d]'} aria-hidden="true" />
                    <span>{profile.passion_sector}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Skills card */}
            {skills.length > 0 && (
              <div className={`${cardClass} p-5 ${align}`}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#8fb7ff]">
                  {language === 'ar' ? 'المهارات' : 'Skills'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill.skill_name} title={`Proficiency: ${skill.proficiency_level}/5`} className={tagClass}>
                      {skill.skill_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main content */}
          <div className="space-y-4">

            {/* Bio */}
            {profile.bio && (
              <div className={`${cardClass} p-6 ${align}`}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#8fb7ff]">
                  {language === 'ar' ? 'نبذة' : 'About'}
                </p>
                <p className={`text-sm leading-7 ${secondaryTextClass}`}>{profile.bio}</p>
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div className={align}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#8fb7ff]">
                  {language === 'ar' ? 'المشاريع' : 'Featured Projects'}
                </p>
                <div className="space-y-4">
                  {projects.map((project, index) => (
                    <article key={index} className={`${cardClass} overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(143,183,255,0.2)]`}>
                      <img
                        src={project.image_url}
                        alt={getBilingualText(project.project_title_en, project.project_title_ar, language, 'Project image')}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x400/1e293b/ffffff?text=Project'; }}
                      />
                      <div className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h2 className={`text-xl font-bold ${titleClass}`}>
                            {getBilingualText(project.project_title_en, project.project_title_ar, language, 'Untitled')}
                          </h2>
                          {project.is_team_project && (
                            <span className={`${tagClass} shrink-0`}>
                              <Users size={11} className="me-1" aria-hidden="true" />
                              {language === 'ar' ? 'مشروع جماعي' : 'Team Project'}
                            </span>
                          )}
                        </div>
                        <p className={`mt-1 text-sm font-medium text-[#8fb7ff]`}>
                          {language === 'ar' ? 'الدور: ' : 'Role: '}{project.user_role}
                        </p>
                        <p className={`mt-3 text-sm leading-7 ${secondaryTextClass}`}>
                          {getBilingualText(project.description_en, project.description_ar, language, '')}
                        </p>
                        <button className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors duration-150 ${isLight ? 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50' : 'border-white/10 text-[#d8e4ff] hover:border-white/20 hover:bg-white/5'}`}>
                          {language === 'ar' ? 'عرض التفاصيل' : 'View details'}
                          <ArrowRight size={13} className="rtl:rotate-180" aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {projects.length === 0 && (
              <div className={`${cardClass} p-8 text-center ${align}`}>
                <p className={`text-sm ${mutedClass}`}>
                  {language === 'en' ? 'No projects added yet.' : 'لم يتم إضافة مشاريع بعد.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
