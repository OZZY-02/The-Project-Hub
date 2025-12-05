"use client";

import React, { useEffect, useState } from "react";
import supabase from '../../../../lib/supabaseClient';
import { useTranslation } from "../../../../lib/i18n";

type Project = {
  id: string;
  name: string;
  description: string;
  skills: string[];
  toolsUsed: string[];
  images: string[];
};

type Intake = {
  resumeFileName?: string | null;
  resumeDataUrl?: string | null;
  skills?: string[];
  college?: string;
  certifications?: string[];
  languages?: string[];
  summary?: string;
  projects?: Project[];
  resume_url?: string | null;
};

export default function GeneratedPortfolioPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [intake, setIntake] = useState<Intake | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user || null;
        const userId = user?.id || null;

        if (userId) {
          const { data, error } = await supabase
            .from('profile_intakes')
            .select('data, resume_url, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!error && Array.isArray(data) && data.length > 0) {
            const row = (data as any)[0];
            if (mounted) setIntake({ ...(row.data || {}), resume_url: row.resume_url || null });
            setLoading(false);
            return;
          }
        }

        // Fallback to localStorage
        const raw = typeof window !== 'undefined' ? localStorage.getItem('sample_profile_intake') : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (mounted) setIntake(parsed || null);
        } else {
          if (mounted) setIntake(null);
        }
      } catch (err) {
        console.warn('Failed to load intake', err);
        const raw = typeof window !== 'undefined' ? localStorage.getItem('sample_profile_intake') : null;
        if (raw && mounted) setIntake(JSON.parse(raw));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-6">{t('sample.loading','Loading portfolio...')}</div>;

  if (!intake) return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('sample.no_data','No intake data found')}</h1>
      <p className="mt-2 text-sm text-gray-600">{t('sample.no_data_help','Complete the Sample Maker Intake form first to generate a portfolio.')}</p>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{intake.college || t('sample.portfolio_title','My Portfolio')}</h1>
          {intake.summary && <p className="mt-2 text-gray-700">{intake.summary}</p>}
        </div>
        <div className="text-right">
          {intake.resume_url && <a href={intake.resume_url} target="_blank" rel="noreferrer" className="px-3 py-1 border rounded">{t('sample.view_resume','View Resume')}</a>}
        </div>
      </header>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('sample.skills','Skills')}</h2>
        <div className="flex flex-wrap gap-2">
          {(intake.skills || []).map(s => (
            <span key={s} className="bg-gray-100 px-2 py-1 rounded">{s}</span>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('sample.certifications','Certifications')}</h2>
        <ul className="list-disc pl-5">
          {(intake.certifications || []).map(c => <li key={c}>{c}</li>)}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('sample.languages','Languages')}</h2>
        <div className="flex flex-wrap gap-2">
          {(intake.languages || []).map(l => (
            <span key={l} className="bg-gray-100 px-2 py-1 rounded">{l}</span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">{t('sample.projects','Projects')}</h2>
        <div className="space-y-6">
          {(intake.projects || []).map((p: Project) => (
            <article key={p.id} className="border p-4 rounded">
              <h3 className="text-lg font-semibold">{p.name || t('sample.project','Project')}</h3>
              {p.description && <p className="mt-2 text-gray-700">{p.description}</p>}

              {p.skills?.length > 0 && (
                <div className="mt-3">
                  <strong className="text-sm">{t('sample.project_skills','Skills')}:</strong>
                  <div className="flex flex-wrap gap-2 mt-2">{p.skills.map(s => <span key={s} className="bg-gray-100 px-2 py-1 rounded">{s}</span>)}</div>
                </div>
              )}

              {p.toolsUsed?.length > 0 && (
                <div className="mt-3">
                  <strong className="text-sm">{t('sample.tools_used','Tools Used (software, hardware, etc.)')}:</strong>
                  <div className="flex flex-wrap gap-2 mt-2">{p.toolsUsed.map(s => <span key={s} className="bg-gray-100 px-2 py-1 rounded">{s}</span>)}</div>
                </div>
              )}

              {p.images?.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {p.images.map((img, i) => (
                    <div key={i} className="w-36 h-24 bg-gray-100 rounded overflow-hidden">
                      <img src={img} alt={`project-${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
