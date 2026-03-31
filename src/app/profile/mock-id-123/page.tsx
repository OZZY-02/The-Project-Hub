"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
// Use built-in crypto.randomUUID when available to avoid extra dependency


import { useTranslation } from "../../../lib/i18n";
import supabase from '../../../lib/supabaseClient';

type Project = {
  id: string;
  name: string;
  description: string;
  skills: string[];
  toolsUsed: string[];
  images: string[]; // data URLs or public URLs
};

export default function SampleMakerProfilePage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const align = locale === 'ar' ? 'text-right' : 'text-left';

  const [loading, setLoading] = useState(true);
  const [intakeId, setIntakeId] = useState<string | null>(null); // Track existing intake row ID for upsert

  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeDataUrl, setResumeDataUrl] = useState<string | null>(null);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [college, setCollege] = useState("");
  const [major, setMajor] = useState("");
  const [degreeLevel, setDegreeLevel] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certInput, setCertInput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");

  const [summary, setSummary] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [generatedPortfolio, setGeneratedPortfolio] = useState<any | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [generating, setGenerating] = useState(false);
  // visual image generation removed — generated JSON is the source of truth
  const [renderingImage, setRenderingImage] = useState(false);
  const [userName, setUserName] = useState("");

  // Load existing intake data on mount
  useEffect(() => {
    const loadIntake = async () => {
      setLoading(true);
      console.time('loadIntake');
      try {
        console.time('supabase.getUser');
        const { data: userData } = await supabase.auth.getUser();
        console.timeEnd('supabase.getUser');
        const userId = userData?.user?.id || null;

        if (userId) {
          // Fetch the most recent intake for this user
          console.time('supabase.profile_intakes_query');
          const { data, error } = await supabase
            .from('profile_intakes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1);
          console.timeEnd('supabase.profile_intakes_query');

          if (!error && data && data.length > 0) {
            const intake = data[0];
            setIntakeId(intake.id);

            // Load from structured columns if available, else fall back to data JSONB
            const d = intake.data || {};
            setResumeFileName(intake.resume_file_name || d.resumeFileName || null);
            setResumeDataUrl(intake.resume_url || d.resumeDataUrl || null);
            setSkills(intake.skills || d.skills || []);
            setCollege(intake.college || d.college || '');
            setMajor(intake.major || d.major || '');
            setDegreeLevel(intake.degree_level || d.degree_level || '');
            setCertifications(intake.certifications || d.certifications || []);
            setLanguages(intake.languages || d.languages || []);
            setSummary(intake.summary || d.summary || '');
            setProjects(intake.projects || d.projects || []);
            setGeneratedPortfolio(intake.generated_portfolio || d.generated_portfolio || null);
            setUserName(d.userName || '');
            setLoading(false);
            console.timeEnd('loadIntake');
            return;
          }
        }

        // Fallback: try localStorage
        const raw = localStorage.getItem('sample_profile_intake');
        if (raw) {
          const parsed = JSON.parse(raw);
          setResumeFileName(parsed.resumeFileName || null);
          setResumeDataUrl(parsed.resumeDataUrl || null);
          setSkills(parsed.skills || []);
          setCollege(parsed.college || '');
          setCertifications(parsed.certifications || []);
          setDegreeLevel(parsed.degree_level || '');
          setLanguages(parsed.languages || []);
          setSummary(parsed.summary || '');
          setProjects(parsed.projects || []);
          setGeneratedPortfolio(parsed.generated_portfolio || null);
          setUserName(parsed.userName || '');
        }
      } catch (err) {
        console.warn('Failed to load intake data', err);
        console.timeEnd('loadIntake');
      } finally {
        setLoading(false);
      }
    };

    loadIntake();
  }, []);

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    setSkills(prev => Array.from(new Set([...prev, s])));
    setSkillInput("");
    setIsDirty(true);
  };

  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s));
  // mark dirty when removing
  const removeSkillDirty = (s: string) => { removeSkill(s); setIsDirty(true); };

  const addCert = () => {
    const s = certInput.trim();
    if (!s) return;
    setCertifications(prev => Array.from(new Set([...prev, s])));
    setCertInput("");
    setIsDirty(true);
  };

  const removeCert = (c: string) => setCertifications(prev => prev.filter(x => x !== c));
  const removeCertDirty = (c: string) => { removeCert(c); setIsDirty(true); };

  const addLang = () => {
    const s = langInput.trim();
    if (!s) return;
    setLanguages(prev => Array.from(new Set([...prev, s])));
    setLangInput("");
    setIsDirty(true);
  };

  const removeLang = (l: string) => setLanguages(prev => prev.filter(x => x !== l));
  const removeLangDirty = (l: string) => { removeLang(l); setIsDirty(true); };

  const handleResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('sample.resume_pdf_error', 'Please upload a PDF resume.') } }));
      return;
    }
    setResumeFileName(file.name);
    const dataUrl = await fileToDataUrl(file);
    setResumeDataUrl(dataUrl as string);
    setIsDirty(true);
  };

  const removeResume = () => {
    setResumeFileName(null);
    setResumeDataUrl(null);
    setIsDirty(true);
  };

  const fileToDataUrl = (file: File) => new Promise<string | null>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const genId = () => {
    try {
      // browser / node built-in
      // @ts-ignore
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch (e) {}
    return Math.random().toString(36).slice(2, 9);
  };

  const addProject = () => {
    setProjects(prev => [...prev, { id: genId(), name: '', description: '', skills: [], toolsUsed: [], images: [] }]);
    setIsDirty(true);
  };

  const removeProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));
  const removeProjectDirty = (id: string) => { removeProject(id); setIsDirty(true); };

  const updateProject = (id: string, patch: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    setIsDirty(true);
  };

  const handleProjectImage = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const current = projects.find(p => p.id === id);
    if (!current) return;
    const allowed = Math.max(0, 3 - current.images.length);
    const toAdd = files.slice(0, allowed);
    const dataUrls = await Promise.all(toAdd.map(f => fileToDataUrl(f)));
    updateProject(id, { images: [...current.images, ...dataUrls.filter(Boolean) as string[]] });
    setIsDirty(true);
  };

  const removeProjectImage = (id: string, url: string) => {
    const current = projects.find(p => p.id === id);
    if (!current) return;
    updateProject(id, { images: current.images.filter(u => u !== url) });
    setIsDirty(true);
  };

  const addProjectSkill = (id: string, value: string) => {
    const cur = projects.find(p => p.id === id);
    if (!cur) return;
    const next = Array.from(new Set([...cur.skills, value.trim()].filter(Boolean)));
    updateProject(id, { skills: next });
    setIsDirty(true);
  };

  const dataUrlToBlob = async (dataUrl: string) => {
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const uploadDataUrlToStorage = async (path: string, dataUrl: string) => {
    try {
      const blob = await dataUrlToBlob(dataUrl);
      const { data, error } = await supabase.storage.from('intakes').upload(path, blob, { cacheControl: '3600', upsert: true });
      if (error) throw error;
      // Try to create a signed URL for private access (expires in 1 hour)
      try {
        const signedSeconds = 60 * 60; // 1 hour
        const { data: signedData, error: signedErr } = await supabase.storage.from('intakes').createSignedUrl(path, signedSeconds);
        if (!signedErr && signedData && signedData.signedUrl) {
          return signedData.signedUrl as string;
        }
      } catch (err) {
        // continue to fallback
      }

      // Fallback to public URL if signed URL not available
      const { data: publicData } = supabase.storage.from('intakes').getPublicUrl(path);
      return publicData?.publicUrl || null;
    } catch (err) {
      console.warn('Storage upload failed', err);
      return null;
    }
  };

  const saveAll = async (generated?: any) => {
    // Prepare payload and try to persist to Supabase Storage + DB. Fall back to localStorage.
    const payload = {
      resumeFileName,
      resumeDataUrl,
      skills,
      college,
      certifications,
      languages,
      summary,
      projects,
      savedAt: new Date().toISOString(),
    };

    // Attempt uploads
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user || null;
      const userId = user?.id || null;

      // If user is not authenticated, save locally (include generated portfolio if provided)
      if (!userId) {
        try {
          const localSave = { ...payload, major, degree_level: degreeLevel, ...(generated ? { generated_portfolio: generated } : {}) };
          localStorage.setItem('sample_profile_intake', JSON.stringify(localSave));
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Saved locally. Sign in to persist to Supabase.' } }));
        return;
      }

      let resume_url: string | null = null;
      if (resumeDataUrl && resumeDataUrl.startsWith('data:')) {
        const resumePath = `intakes/${userId || 'anon'}/${Date.now()}-resume.pdf`;
        resume_url = await uploadDataUrlToStorage(resumePath, resumeDataUrl);
      }

      // Upload project images and replace dataUrls with public URLs when possible
      const projectsWithUrls = [] as typeof projects;
      for (const p of projects) {
        const copied = { ...p, images: [...p.images] } as Project;
        const uploadedUrls: string[] = [];
        for (const [i, url] of p.images.entries()) {
          if (url && url.startsWith('data:')) {
            const imgPath = `intakes/${userId || 'anon'}/${p.id}-${i}.jpg`;
            const publicUrl = await uploadDataUrlToStorage(imgPath, url);
            if (publicUrl) uploadedUrls.push(publicUrl);
            else uploadedUrls.push(url); // fallback to data url
          } else {
            uploadedUrls.push(url);
          }
        }
        copied.images = uploadedUrls;
        projectsWithUrls.push(copied);
      }

      const finalPayload = { ...payload, major, degree_level: degreeLevel, projects: projectsWithUrls, resume_url } as any;
      if (generated) finalPayload.generated_portfolio = generated;

      // Upsert into DB table `profile_intakes` (insert if new, update if exists)
      // Store all data in the `data` JSONB column for maximum compatibility
      const upsertData: any = {
        user_id: userId,
        data: {
          userName,
          resumeFileName,
          resumeDataUrl: resume_url || resumeDataUrl,
          skills,
          college,
          major,
          degree_level: degreeLevel,
          certifications,
          languages,
          summary,
          projects: projectsWithUrls,
          savedAt: new Date().toISOString(),
          ...(generated ? { generated_portfolio: generated } : {}),
        },
      };
      // Also store generated portfolio as a top-level column when provided
      if (generated) {
        upsertData.generated_portfolio = generated;
      }
      // Only add resume_url if we have one (column may or may not exist)
      if (resume_url) {
        upsertData.resume_url = resume_url;
      }

      // Check if we have an existing record for this user
      let existingId = intakeId;
      if (!existingId) {
        const { data: existing } = await supabase
          .from('profile_intakes')
          .select('id')
          .eq('user_id', userId)
          .limit(1);
        if (existing && existing.length > 0) {
          existingId = existing[0].id;
          setIntakeId(existingId);
        }
      }

      let upsertResult: any = null;
      let upsertError: any = null;

      if (existingId) {
        // Update existing record
        const { data, error } = await supabase
          .from('profile_intakes')
          .update(upsertData)
          .eq('id', existingId)
          .select();
        upsertResult = data;
        upsertError = error;
      } else {
        // Insert new record
        upsertData.user_id = userId;
        const { data, error } = await supabase
          .from('profile_intakes')
          .insert([upsertData])
          .select();
        upsertResult = data;
        upsertError = error;
      }

      if (upsertError) {
        console.error('DB upsert failed, falling back to localStorage', upsertError);
        try { localStorage.setItem('sample_profile_intake', JSON.stringify(finalPayload)); } catch (e) {}
        const msg = upsertError.message || upsertError.details || JSON.stringify(upsertError);
        // Show a concise toast but log full error to console for debugging
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: `Saved locally (DB save failed). See console for details.` } }));
        console.error('Supabase upsert error detail:', upsertError);
        return;
      }

      // Track the intake ID for future saves
      if (upsertResult && upsertResult.length > 0) {
        setIntakeId(upsertResult[0].id);
      }

      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Profile intake saved to Supabase.' } }));
      // mark as saved
      setIsDirty(false);
    } catch (err) {
      console.warn('Save all failed, falling back to localStorage', err);
      try { localStorage.setItem('sample_profile_intake', JSON.stringify(payload)); } catch (e) {}
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Saved locally.' } }));
    }
  };

  const templateThemes = [
    {
      theme_color: '#ce1126',
      background_gradient_start: '#0b1413',
      background_gradient_end: '#1f2b27',
      font_style: 'modern',
    },
    {
      theme_color: '#007a3d',
      background_gradient_start: '#0b1413',
      background_gradient_end: '#15302a',
      font_style: 'classic',
    },
    {
      theme_color: '#d9b88c',
      background_gradient_start: '#1b120e',
      background_gradient_end: '#2c1a12',
      font_style: 'playful',
    },
    {
      theme_color: '#111111',
      background_gradient_start: '#0b1413',
      background_gradient_end: '#111111',
      font_style: 'tech',
    },
  ];

  const hashThemeSeed = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  };

  const pickVisualStyle = () => {
    const seed = `${userName}-${college}-${skills.join(',')}`;
    const index = Math.abs(hashThemeSeed(seed || 'maker-template')) % templateThemes.length;
    return templateThemes[index];
  };

  const buildTemplatePortfolio = () => {
    const name = (userName || 'Emerging Maker').trim();
    const coreSkill = skills[0] || 'Creative Technologist';
    const headline = `${name} • ${coreSkill}${college ? ` @ ${college}` : ''}`;

    const languagesLine = languages.length ? `Speaks ${languages.join(', ')}. ` : '';
    const certificationsLine = certifications.length ? `Certified in ${certifications.join(', ')}. ` : '';
    const summaryLine = summary?.trim() || `${name.split(' ')[0] || 'They'} build products that blend design rigor with rapid prototyping.`;
    const bio = `${summaryLine} ${languagesLine}${certificationsLine}`.trim();

    const safeProjects = projects.length > 0 ? projects : [{
      id: 'template-project',
      name: 'Signature Build',
      description: 'Self-directed concept that showcases the maker mindset end-to-end.',
      skills: skills.slice(0, 3),
      toolsUsed: ['Figma', 'React', '3D Printing'],
      user_role: 'Lead Maker',
      images: [],
    }];

    const projectSummaries = safeProjects.map((project, index) => {
      const baseDescription = project.description?.trim() || 'Led discovery, prototyping, and launch to solve a real community need.';
      const skillLine = project.skills?.length ? project.skills.join(', ') : (skills.slice(0, 3).join(', ') || 'multi-disciplinary tools');
      const toolLine = project.toolsUsed?.length ? project.toolsUsed.join(', ') : 'low-code platforms & rapid prototyping kits';
      const projectRole = (project as any)?.user_role || 'Lead Maker';
      return {
        project_title: project.name || `Project ${index + 1}`,
        summary_point_1: `Challenge: ${baseDescription}`,
        summary_point_2: `Focus: ${skillLine}. Role: ${projectRole}.`,
        summary_point_3: `Impact: Delivered tangible outcomes using ${toolLine}.`,
        images: project.images || [],
        skills: project.skills || [],
        toolsUsed: project.toolsUsed || [],
      };
    });

    return {
      professional_headline: headline,
      optimized_bio: bio,
      key_project_summary: projectSummaries,
      visual_style: pickVisualStyle(),
    };
  };

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const templatePortfolio = buildTemplatePortfolio();
      setGeneratedPortfolio(templatePortfolio);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Template generated.' } }));
      // Persist the generated portfolio so the dedicated portfolio view can display it
      try {
        await saveAll(templatePortfolio);
      } catch (err) {
        console.warn('Failed to save generated portfolio before navigation', err);
      }
      // Navigate to portfolio view
      try {
        const parts = (pathname || '').split('/').filter(Boolean);
        const slug = parts[1] || 'mock-id-123';
        router.push(`/profile/${slug}/portfolio`);
      } catch (err) {
        console.warn('Navigation to portfolio failed', err);
      }
    } catch (e) {
      console.error('Template generation failed', e);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Template generation failed.' } }));
    } finally {
      setGenerating(false);
    }
  };

  // Generate a visual portfolio image
  // image rendering removed — we no longer generate a visual PNG; portfolio page uses the JSON directly

  // portfolio image disabled


  return (
    <div
      dir={dir}
      className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,#223a34_0%,transparent_45%),linear-gradient(180deg,#0b1413_0%,#0f1c1a_50%,#141a17_100%)] text-[#f4efe6]"
    >
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className={`rounded-[32px] border border-[#2e403a] bg-gradient-to-br from-[#0f2a25] via-[#132f2a] to-[#0c1c19] p-8 shadow-[0_30px_90px_-50px_rgba(0,0,0,0.8)] ${align}`}>
          <p className="text-xs uppercase tracking-[0.35em] text-[#d9b88c]">{t('sample.kicker', 'Maker intake')}</p>
          <h1 className="font-display mt-4 text-3xl text-[#f7f1e7] sm:text-4xl">{t('sample.title','Sample Maker Intake')}</h1>
          <p className="mt-3 text-sm text-[#cfc8be]">{t('sample.intro', 'Tell your story once. We organize it into a portfolio that connects you with mentors, teams, and local opportunities.')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-[#3b4b44] bg-[#172421] px-4 py-2 text-xs text-[#e8dcc5]">{t('sample.badge_1', '100 makers pilot')}</span>
            <span className="rounded-full border border-[#3b4b44] bg-[#172421] px-4 py-2 text-xs text-[#e8dcc5]">{t('sample.badge_2', 'Arabic + English')}</span>
            <span className="rounded-full border border-[#3b4b44] bg-[#172421] px-4 py-2 text-xs text-[#e8dcc5]">{t('sample.badge_3', 'Sudan + Egypt focus')}</span>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#2e403a] border-t-[#ce1126]"></div>
            <span className="ml-3 text-sm text-[#cfc8be]">{t('sample.loading', 'Loading your data...')}</span>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-[#2e403a] bg-[#111f1c]/90 p-6">
              <label className="block text-sm text-[#e8dcc5]">{t('sample.resume','Resume (PDF)')}</label>
              <p className="mt-2 text-xs text-[#9ca3af]">{t('sample.resume_help', 'Upload a PDF resume to enrich your portfolio and skills matching.')}</p>

              {!resumeFileName ? (
                <label className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#2e403a] bg-[#0f1a17] px-4 py-2 text-sm text-[#e8dcc5] hover:border-[#3a4a44] hover:text-[#f0d6a8] cursor-pointer">
                  {t('sample.choose_resume', 'Choose resume')}
                  <input type="file" accept="application/pdf" onChange={handleResume} className="hidden" />
                </label>
              ) : (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#2e403a] bg-[#0f1a17] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#f7f1e7] truncate">{resumeFileName}</p>
                    <p className="text-xs text-[#9ca3af]">{t('sample.resume_added', 'Resume added')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="rounded-full border border-[#2e403a] px-3 py-1 text-xs text-[#e8dcc5] hover:border-[#3a4a44] hover:text-[#f0d6a8] cursor-pointer">
                      {t('sample.change_resume', 'Change')}
                      <input type="file" accept="application/pdf" onChange={handleResume} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={removeResume}
                      className="rounded-full bg-[#ce1126] px-3 py-1 text-xs font-semibold text-white hover:bg-[#e32636]"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#2e403a] bg-[#111f1c]/90 p-6">
              <h2 className={`font-semibold text-[#f7f1e7] ${align}`}>{t('sample.basics','Basics')}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm text-[#e8dcc5]">
                  {t('sample.name','Your Name')}
                  <input value={userName} onChange={e => { setUserName(e.target.value); setIsDirty(true); }} placeholder={t('sample.name_placeholder', 'John Doe')} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                </label>

                <label className="text-sm text-[#e8dcc5]">
                  {t('sample.college','College')}
                  <input value={college} onChange={e => { setCollege(e.target.value); setIsDirty(true); }} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                </label>

                <label className="text-sm text-[#e8dcc5]">
                  {t('sample.major','Major / Degree')}
                  <input value={major} onChange={e => { setMajor(e.target.value); setIsDirty(true); }} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                </label>

                <label className="text-sm text-[#e8dcc5]">
                  {t('sample.degree_level','Degree Level')}
                  <select value={degreeLevel} onChange={e => { setDegreeLevel(e.target.value); setIsDirty(true); }} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]">
                    <option value="">{t('sample.degree_placeholder', 'Select level')}</option>
                    <option value="Undergraduate">{t('sample.degree_undergrad', 'Undergraduate')}</option>
                    <option value="Graduate">{t('sample.degree_grad', 'Graduate')}</option>
                    <option value="PhD">{t('sample.degree_phd', 'PhD')}</option>
                  </select>
                </label>

                <div className="sm:col-span-2">
                  <label className="block text-sm text-[#e8dcc5]">{t('sample.languages','Languages')}</label>
                  <div className="mt-2 flex gap-2">
                    <input value={langInput} onChange={e => setLangInput(e.target.value)} placeholder={t('sample.add_language','Add language')} className="flex-1 rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                    <button type="button" onClick={addLang} className="rounded-full bg-[#007a3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b8d49]">+</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {languages.map(l => (
                      <span key={l} className="flex items-center gap-2 rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                        <span>{l}</span>
                        <button onClick={() => removeLang(l)} className="text-xs text-[#f0a37f]">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm text-[#e8dcc5]">{t('sample.certifications','Certifications')}</label>
                <div className="mt-2 flex gap-2">
                  <input value={certInput} onChange={e => setCertInput(e.target.value)} placeholder={t('sample.add_cert','Add certification')} className="flex-1 rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                  <button type="button" onClick={addCert} className="rounded-full bg-[#007a3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b8d49]">+</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {certifications.map(c => (
                    <span key={c} className="flex items-center gap-2 rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                      <span>{c}</span>
                      <button onClick={() => removeCertDirty(c)} className="text-xs text-[#f0a37f]">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm text-[#e8dcc5]">{t('sample.skills','Skills')}</label>
                <div className="mt-2 flex gap-2">
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder={t('sample.add_skill','Add skill')} className="flex-1 rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                  <button type="button" onClick={addSkill} className="rounded-full bg-[#007a3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b8d49]">+</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="flex items-center gap-2 rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                      <span>{s}</span>
                      <button onClick={() => removeSkillDirty(s)} className="text-xs text-[#f0a37f]">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm text-[#e8dcc5]">{t('sample.summary','Short summary')}</label>
                <textarea value={summary} onChange={e => { setSummary(e.target.value); setIsDirty(true); }} className="mt-2 h-28 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
              </div>
            </section>

            <section className="rounded-2xl border border-[#2e403a] bg-[#111f1c]/90 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className={`font-semibold text-[#f7f1e7] ${align}`}>{t('sample.projects','Projects')}</h2>
                <button onClick={addProject} className="rounded-full bg-[#007a3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b8d49]">
                  + {t('sample.add_project','Add Project')}
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {projects.map((p, idx) => (
                  <div key={p.id} className="rounded-2xl border border-[#2e403a] bg-[#0f1a17] p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-[#f7f1e7]">{t('sample.project')} {idx + 1}</h3>
                      <button onClick={() => removeProjectDirty(p.id)} className="text-xs text-[#f0a37f]">{t('sample.remove','Remove')}</button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="text-sm text-[#e8dcc5]">
                        {t('sample.project_name','Project name')}
                        <input value={p.name} onChange={e => updateProject(p.id, { name: e.target.value })} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0b1413] px-4 py-3 text-[#f7f1e7]" />
                      </label>

                      <div>
                        <label className="block text-sm text-[#e8dcc5]">{t('sample.project_skills','Skills')}</label>
                        <input placeholder={t('sample.add_skill','Add skill')} onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); addProjectSkill(p.id, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; }
                        }} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0b1413] px-4 py-3 text-[#f7f1e7]" />
                        <div className="mt-2 flex flex-wrap gap-2">
                          {p.skills.map(s => (
                            <span key={s} className="flex items-center gap-2 rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                              <span>{s}</span>
                              <button onClick={() => updateProject(p.id, { skills: p.skills.filter(x => x !== s) })} className="text-xs text-[#f0a37f]">×</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm text-[#e8dcc5]">{t('sample.project_description','Description')}</label>
                      <textarea value={p.description} onChange={e => updateProject(p.id, { description: e.target.value })} className="mt-2 h-24 w-full rounded-xl border border-[#2b3a35] bg-[#0b1413] px-4 py-3 text-[#f7f1e7]" />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm text-[#e8dcc5]">{t('sample.tools_used','Tools Used (software, hardware, etc.)')}</label>
                      <input placeholder={t('sample.add_tool','Add tool')} onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !p.toolsUsed.includes(val)) {
                            updateProject(p.id, { toolsUsed: [...p.toolsUsed, val] });
                          }
                          (e.target as HTMLInputElement).value = '';
                        }
                      }} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0b1413] px-4 py-3 text-[#f7f1e7]" />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {p.toolsUsed.map(tool => (
                          <span key={tool} className="flex items-center gap-2 rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">
                            <span>{tool}</span>
                            <button onClick={() => updateProject(p.id, { toolsUsed: p.toolsUsed.filter(t => t !== tool) })} className="text-xs text-[#f0a37f]">×</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm text-[#e8dcc5]">{t('sample.project_images','Project images (up to 3)')}</label>
                      <input type="file" accept="image/*" multiple onChange={e => handleProjectImage(p.id, e)} className="mt-2 text-sm text-[#cfc8be]" />
                      <div className="mt-3 flex flex-wrap gap-3">
                        {p.images.map(url => (
                          <div key={url} className="relative h-24 w-24 overflow-hidden rounded-xl border border-[#2e403a] bg-[#0b1413]">
                            <img src={url} alt="project" className="h-full w-full object-cover" />
                            <button onClick={() => removeProjectImage(p.id, url)} className="absolute right-1 top-1 rounded-full bg-[#0b1413]/80 px-2 text-xs text-[#f0a37f]">×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => saveAll(generatedPortfolio)} className="rounded-full bg-[#ce1126] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e32636]">
                {t('sample.save','Save')}
              </button>
              {generatedPortfolio ? (
                isDirty ? (
                  <button onClick={generateWithAI} disabled={generating || renderingImage} className="rounded-full border border-[#2e403a] bg-[#1a2824] px-6 py-3 text-sm text-[#f0d6a8] hover:border-[#3a4a44]">
                    {generating || renderingImage ? t('sample.generating','Generating Portfolio...') : t('sample.update_portfolio','Update Portfolio')}
                  </button>
                ) : (
                  <button onClick={() => {
                    try {
                      const parts = (pathname || '').split('/').filter(Boolean);
                      const slug = parts[1] || 'mock-id-123';
                      router.push(`/profile/${slug}/portfolio`);
                    } catch (err) {
                      console.warn('View portfolio navigation failed', err);
                    }
                  }} className="rounded-full bg-[#007a3d] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0b8d49]">
                    {t('sample.view_portfolio','View My Portfolio')}
                  </button>
                )
              ) : (
                <button onClick={generateWithAI} disabled={generating || renderingImage} className="rounded-full border border-[#2e403a] bg-[#1a2824] px-6 py-3 text-sm text-[#f0d6a8] hover:border-[#3a4a44]">
                  {generating || renderingImage ? t('sample.generating','Generating Portfolio...') : t('sample.customize_ai','Customize with AI')}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
