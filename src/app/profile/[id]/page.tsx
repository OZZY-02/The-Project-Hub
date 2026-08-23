'use client';

import React, { useState, useEffect, use } from 'react';
import supabase from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, MapPin, Star, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { normalizeIntakeProjects, normalizeIntakeSkills, type IntakeProject, type IntakeSkill } from '@/lib/intake';

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
  avatar_url: string | null;
}

export default function MakerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: profileId } = use(params);
  const { locale } = useTranslation();
  const { theme } = useTheme();
  const language = locale === 'ar' ? 'ar' : 'en';
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const align = language === 'ar' ? 'text-right' : 'text-left';
  const isLight = theme === 'light';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<IntakeSkill[]>([]);
  const [projects, setProjects] = useState<IntakeProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id,first_name,last_name,location_city,location_country,major_field,passion_sector,is_mentor,bio,avatar_data_url,avatar_url')
          .eq('id', profileId)
          .single();

        if (!mounted) return;

        if (!data || error) {
          setProfile(null);
          setLoading(false);
          return;
        }

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
          avatar_url: data.avatar_url || data.avatar_data_url || null,
        });

        // Skills and projects live in profile_intakes, written by /profile/create.
        const { data: intakeRows } = await supabase
          .from('profile_intakes')
          .select('data')
          .eq('user_id', profileId)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!mounted) return;
        const intake = intakeRows?.[0]?.data ?? null;
        setSkills(normalizeIntakeSkills(intake));
        setProjects(normalizeIntakeProjects(intake));
      } catch {
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
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
          <h1 className={`text-2xl font-bold ${titleClass}`}>
            {language === 'ar' ? 'الملف الشخصي غير موجود' : 'Profile not found'}
          </h1>
          <p className={`mt-3 text-sm ${secondaryTextClass}`}>
            {language === 'ar'
              ? 'ربما تم حذف هذا الملف الشخصي أو أن الرابط غير صحيح.'
              : 'This profile may have been removed, or the link is incorrect.'}
          </p>
          <button onClick={() => router.push('/')} className={`mt-6 inline-flex items-center gap-2 text-sm transition-colors duration-150 ${secondaryTextClass} hover:${titleClass}`}>
            <ArrowLeft size={16} className="rtl:rotate-180" aria-hidden="true" />
            {language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Go to Hub Home'}
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
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center text-2xl font-bold ${isLight ? 'text-slate-400' : 'text-[#8fb7ff]'}`}>
                      {initials}
                    </div>
                  )}
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
                    <span
                      key={skill.name}
                      title={skill.level ? `Proficiency: ${skill.level}/5` : undefined}
                      className={tagClass}
                    >
                      {skill.name}
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
            {projects.length > 0 ? (
              <div className={align}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#8fb7ff]">
                  {language === 'ar' ? 'المشاريع' : 'Featured Projects'}
                </p>
                <div className="space-y-4">
                  {projects.map((project, index) => (
                    <article key={index} className={`${cardClass} overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(143,183,255,0.2)]`}>
                      {project.images.length > 0 && (
                        <div className={`grid gap-1 ${project.images.length > 1 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
                          {project.images.slice(0, 3).map((src, imgIdx) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={imgIdx}
                              src={src}
                              alt={`${project.name} ${imgIdx + 1}`}
                              className="h-40 w-full object-cover"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h2 className={`text-xl font-bold ${titleClass}`}>
                            {project.name || (language === 'ar' ? 'بدون عنوان' : 'Untitled')}
                          </h2>
                          {project.isTeam && (
                            <span className={`${tagClass} shrink-0`}>
                              <Users size={11} className="me-1" aria-hidden="true" />
                              {language === 'ar' ? 'مشروع جماعي' : 'Team Project'}
                            </span>
                          )}
                        </div>
                        {project.role && (
                          <p className="mt-1 text-sm font-medium text-[#8fb7ff]">
                            {language === 'ar' ? 'الدور: ' : 'Role: '}{project.role}
                          </p>
                        )}
                        {project.description && (
                          <p className={`mt-3 text-sm leading-7 ${secondaryTextClass}`}>{project.description}</p>
                        )}
                        {project.tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {project.tags.map(tag => (
                              <span key={tag} className={tagClass}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`${cardClass} p-8 text-center ${align}`}>
                <p className={`text-sm ${mutedClass}`}>
                  {language === 'ar' ? 'لم يتم إضافة مشاريع بعد.' : 'No projects added yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
