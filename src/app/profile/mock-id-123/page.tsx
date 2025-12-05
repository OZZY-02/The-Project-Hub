"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
// Use built-in crypto.randomUUID when available to avoid extra dependency


import { useTranslation } from "../../../lib/i18n";
import supabase from '../../../lib/supabaseClient';

type Project = {
  id: string;
  name: string;
  description: string;
  skills: string[];
  toolsUsed: string[];
  images: string[]; // data URLs
};

export default function SampleMakerProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeDataUrl, setResumeDataUrl] = useState<string | null>(null);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [college, setCollege] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certInput, setCertInput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");

  const [summary, setSummary] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [generatedPortfolio, setGeneratedPortfolio] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    setSkills(prev => Array.from(new Set([...prev, s])));
    setSkillInput("");
  };

  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s));

  const addCert = () => {
    const s = certInput.trim();
    if (!s) return;
    setCertifications(prev => Array.from(new Set([...prev, s])));
    setCertInput("");
  };

  const removeCert = (c: string) => setCertifications(prev => prev.filter(x => x !== c));

  const addLang = () => {
    const s = langInput.trim();
    if (!s) return;
    setLanguages(prev => Array.from(new Set([...prev, s])));
    setLangInput("");
  };

  const removeLang = (l: string) => setLanguages(prev => prev.filter(x => x !== l));

  const handleResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Please upload a PDF resume.' } }));
      return;
    }
    setResumeFileName(file.name);
    const dataUrl = await fileToDataUrl(file);
    setResumeDataUrl(dataUrl as string);
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
  };

  const removeProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));

  const updateProject = (id: string, patch: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
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
  };

  const removeProjectImage = (id: string, url: string) => {
    const current = projects.find(p => p.id === id);
    if (!current) return;
    updateProject(id, { images: current.images.filter(u => u !== url) });
  };

  const addProjectSkill = (id: string, value: string) => {
    const cur = projects.find(p => p.id === id);
    if (!cur) return;
    const next = Array.from(new Set([...cur.skills, value.trim()].filter(Boolean)));
    updateProject(id, { skills: next });
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
      const { data: publicData } = supabase.storage.from('intakes').getPublicUrl(path);
      return publicData.publicUrl || null;
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

      // If user is not authenticated, do not attempt DB insert (will fail under RLS).
      if (!userId) {
        try { localStorage.setItem('sample_profile_intake', JSON.stringify(payload)); } catch (e) {}
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

      const finalPayload = { ...payload, projects: projectsWithUrls, resume_url } as any;
      if (generated) finalPayload.generated_portfolio = generated;

      // Insert into DB table `profile_intakes`
      const { error: insertError } = await supabase.from('profile_intakes').insert([{ user_id: userId, data: finalPayload, resume_url }]);
      if (insertError) {
        console.error('DB insert failed, falling back to localStorage', insertError);
        try { localStorage.setItem('sample_profile_intake', JSON.stringify(finalPayload)); } catch (e) {}
        const msg = insertError.message || insertError.details || JSON.stringify(insertError);
        // Show a concise toast but log full error to console for debugging
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: `Saved locally (DB insert failed). See console for details.` } }));
        console.error('Supabase insert error detail:', insertError);
        return;
      }

      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Profile intake saved to Supabase.' } }));
        // clear generated preview after save
        setGeneratedPortfolio(null);
    } catch (err) {
      console.warn('Save all failed, falling back to localStorage', err);
      try { localStorage.setItem('sample_profile_intake', JSON.stringify(payload)); } catch (e) {}
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Saved locally.' } }));
    }
  };

  const generateWithAI = async () => {
    // Build same payload but without uploading images (we send data urls)
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

    setGenerating(true);
    try {
      const res = await fetch('/api/portfolio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake: payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('AI error', json);
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'AI generation failed.' } }));
        return;
      }
      setGeneratedPortfolio(json.generated || null);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'AI generated preview ready.' } }));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'AI generation failed.' } }));
    } finally {
      setGenerating(false);
    }
  };


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t('sample.title','Sample Maker Intake')}</h1>

      <section className="bg-white p-4 rounded shadow mb-4">
        <label className="block text-sm font-medium mb-2">{t('sample.resume','Resume (PDF)')}</label>
        <input type="file" accept="application/pdf" onChange={handleResume} />
        {resumeFileName && <p className="text-sm mt-2">{resumeFileName}</p>}
      </section>

      <section className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-semibold mb-2">{t('sample.basics','Basics')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">{t('sample.college','College')}</label>
            <input value={college} onChange={e => setCollege(e.target.value)} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium">{t('sample.languages','Languages')}</label>
            <div className="flex gap-2">
              <input value={langInput} onChange={e => setLangInput(e.target.value)} placeholder={t('sample.add_language','Add language')} className="flex-1 border p-2 rounded" />
              <button type="button" onClick={addLang} className="px-3 py-1 bg-[#1e40af] text-white rounded">+</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {languages.map(l => (
                <span key={l} className="bg-gray-100 px-2 py-1 rounded flex items-center gap-2">
                  <span className="text-sm">{l}</span>
                  <button onClick={() => removeLang(l)} className="text-xs text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium">{t('sample.certifications','Certifications')}</label>
          <div className="flex gap-2 mt-2">
            <input value={certInput} onChange={e => setCertInput(e.target.value)} placeholder={t('sample.add_cert','Add certification')} className="flex-1 border p-2 rounded" />
            <button type="button" onClick={addCert} className="px-3 py-1 bg-[#1e40af] text-white rounded">+</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {certifications.map(c => (
              <span key={c} className="bg-gray-100 px-2 py-1 rounded flex items-center gap-2">
                <span className="text-sm">{c}</span>
                <button onClick={() => removeCert(c)} className="text-xs text-red-500">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium">{t('sample.skills','Skills')}</label>
          <div className="flex gap-2 mt-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder={t('sample.add_skill','Add skill')} className="flex-1 border p-2 rounded" />
            <button type="button" onClick={addSkill} className="px-3 py-1 bg-[#1e40af] text-white rounded">+</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {skills.map(s => (
              <span key={s} className="bg-gray-100 px-2 py-1 rounded flex items-center gap-2">
                <span className="text-sm">{s}</span>
                <button onClick={() => removeSkill(s)} className="text-xs text-red-500">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium">{t('sample.summary','Short summary')}</label>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} className="w-full border p-2 rounded h-28" />
        </div>
      </section>

      <section className="bg-white p-4 rounded shadow mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{t('sample.projects','Projects')}</h2>
          <div className="flex gap-2">
            <button onClick={addProject} className="px-3 py-1 bg-green-600 text-white rounded">+ {t('sample.add_project','Add Project')}</button>
          </div>
        </div>

        <div className="space-y-4">
          {projects.map((p, idx) => (
            <div key={p.id} className="border p-3 rounded">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{t('sample.project')} {idx + 1}</h3>
                <button onClick={() => removeProject(p.id)} className="text-red-500">{t('sample.remove','Remove')}</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium">{t('sample.project_name','Project name')}</label>
                  <input value={p.name} onChange={e => updateProject(p.id, { name: e.target.value })} className="w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="block text-sm font-medium">{t('sample.project_skills','Skills')}</label>
                  <input placeholder={t('sample.add_skill','Add skill')} onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addProjectSkill(p.id, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; }
                  }} className="w-full border p-2 rounded" />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {p.skills.map(s => (
                      <span key={s} className="bg-gray-100 px-2 py-1 rounded flex items-center gap-2">
                        <span className="text-sm">{s}</span>
                        <button onClick={() => updateProject(p.id, { skills: p.skills.filter(x => x !== s) })} className="text-xs text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium">{t('sample.project_description','Description')}</label>
                <textarea value={p.description} onChange={e => updateProject(p.id, { description: e.target.value })} className="w-full border p-2 rounded h-24" />
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium">{t('sample.tools_used','Tools Used (software, hardware, etc.)')}</label>
                  <input value={p.toolsUsed.join(', ')} onChange={e => updateProject(p.id, { toolsUsed: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full border p-2 rounded" placeholder={t('sample.tools_used_placeholder','comma-separated')} />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium">{t('sample.project_images','Project images (up to 3)')}</label>
                <input type="file" accept="image/*" multiple onChange={e => handleProjectImage(p.id, e)} />
                <div className="flex gap-2 mt-2">
                  {p.images.map(url => (
                    <div key={url} className="w-24 h-24 bg-gray-100 rounded overflow-hidden relative">
                      <img src={url} alt="project" className="w-full h-full object-cover" />
                      <button onClick={() => removeProjectImage(p.id, url)} className="absolute top-1 right-1 bg-white rounded-full px-1 text-red-500">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <button onClick={() => saveAll(generatedPortfolio)} className="px-4 py-2 bg-[#1e40af] text-white rounded">{t('sample.save','Save')}</button>
        <button onClick={generateWithAI} disabled={generating} className="px-4 py-2 border rounded">{generating ? t('sample.generating','Generating...') : t('sample.customize_ai','Customize with AI')}</button>
      </div>

      {generatedPortfolio && (
        <section className="mt-4 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">{t('sample.ai_preview','AI Preview')}</h3>
          <div className="prose max-w-none">
            {generatedPortfolio.title && <h4>{generatedPortfolio.title}</h4>}
            {generatedPortfolio.subtitle && <p className="italic">{generatedPortfolio.subtitle}</p>}
            {generatedPortfolio.about && <p>{generatedPortfolio.about}</p>}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => saveAll(generatedPortfolio)} className="px-3 py-1 bg-green-600 text-white rounded">{t('sample.apply_generated','Save Generated')}</button>
            <button onClick={() => setGeneratedPortfolio(null)} className="px-3 py-1 border rounded">{t('sample.dismiss','Dismiss')}</button>
          </div>
        </section>
      )}
    </div>
  );
}
