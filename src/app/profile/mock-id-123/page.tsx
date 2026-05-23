"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  User, GraduationCap, Wrench, FolderKanban, FileText,
  Plus, X, ChevronDown, ChevronUp, Sparkles, Save,
  Eye, CheckCircle2, Circle, ArrowRight, Loader2,
  BookOpen, Trash2, Image as ImageIcon, Upload, ArrowLeft,
} from "lucide-react";

import { useTranslation } from "../../../lib/i18n";
import { useTheme } from "../../../lib/theme";
import supabase from '../../../lib/supabaseClient';

type Project = {
  id: string;
  name: string;
  description: string;
  skills: string[];
  toolsUsed: string[];
  images: string[];
};

/* ─── Completion ─────────────────────────────────────────────────────────── */
function useCompletion(
  userName: string, college: string, major: string, summary: string,
  skills: string[], projects: Project[], resumeFileName: string | null
) {
  const steps = [
    { id: "resume",    label: "Resume",    done: !!resumeFileName,            icon: FileText },
    { id: "basics",    label: "Basics",    done: !!(userName && college),     icon: User },
    { id: "education", label: "Education", done: !!major,                     icon: GraduationCap },
    { id: "skills",    label: "Skills",    done: skills.length >= 2,          icon: Wrench },
    { id: "summary",   label: "Summary",   done: summary.trim().length >= 30, icon: BookOpen },
    { id: "projects",  label: "Projects",  done: projects.length >= 1 && !!projects[0]?.name, icon: FolderKanban },
  ];
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  return { steps, pct };
}

/* ─── Tag chip ───────────────────────────────────────────────────────────── */
function TagChip({
  label, onRemove, isLight,
}: { label: string; onRemove: () => void; isLight: boolean }) {
  return (
    <span className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors duration-150 ${
      isLight
        ? "border-slate-900/10 bg-white text-slate-700 hover:border-slate-300"
        : "border-white/10 bg-white/5 text-[#c8d8f0] hover:border-white/20"
    }`}>
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className={`flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 ${
          isLight ? "text-slate-400 hover:bg-red-500 hover:text-white" : "text-[#6f7e9d] hover:bg-red-600 hover:text-white"
        }`}
      >
        <X size={10} />
      </button>
    </span>
  );
}

/* ─── Tag input ──────────────────────────────────────────────────────────── */
function TagInput({
  value, onChange, onAdd, placeholder, isLight,
}: {
  value: string; onChange: (v: string) => void;
  onAdd: () => void; placeholder: string; isLight: boolean;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
        placeholder={placeholder}
        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-150 ${
          isLight
            ? "border-slate-900/10 bg-white text-slate-900 placeholder-slate-400 focus:border-[#2258d1] focus:shadow-[0_0_0_3px_rgba(34,88,209,0.1)]"
            : "border-white/8 bg-white/4 text-[#f5f7fb] placeholder-[#6f7e9d] focus:border-[#8fb7ff]/40 focus:shadow-[0_0_0_3px_rgba(143,183,255,0.08)]"
        }`}
      />
      <button
        type="button"
        onClick={onAdd}
        className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl font-bold transition-colors duration-150 ${
          isLight
            ? "bg-slate-950 text-white hover:bg-slate-700"
            : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
        }`}
        aria-label="Add"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

/* ─── Field input ────────────────────────────────────────────────────────── */
function Field({
  id, label, isLight, children,
}: { id: string; label: string; isLight: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${
          isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"
        }`}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  id, value, onChange, placeholder, isLight,
}: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string; isLight: boolean }) {
  return (
    <input
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-150 ${
        isLight
          ? "border-slate-900/10 bg-white text-slate-900 placeholder-slate-400 focus:border-[#2258d1] focus:shadow-[0_0_0_3px_rgba(34,88,209,0.1)]"
          : "border-white/8 bg-white/4 text-[#f5f7fb] placeholder-[#6f7e9d] focus:border-[#8fb7ff]/40 focus:shadow-[0_0_0_3px_rgba(143,183,255,0.08)]"
      }`}
    />
  );
}

/* ─── Section card ───────────────────────────────────────────────────────── */
function SectionCard({
  id, icon: Icon, title, subtitle, done, children, isLight, defaultOpen = true,
}: {
  id: string; icon: React.FC<{ size?: number; className?: string }>;
  title: string; subtitle?: string; done: boolean;
  children: React.ReactNode; isLight: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      id={id}
      className={`rounded-2xl border transition-all duration-200 ${
        isLight
          ? done
            ? "border-emerald-500/20 bg-white shadow-sm"
            : "border-slate-900/8 bg-white shadow-sm"
          : done
            ? "border-emerald-500/15 bg-white/3"
            : "border-white/8 bg-white/3"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full cursor-pointer items-center gap-4 p-6 text-left"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
          done
            ? isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400"
            : isLight ? "bg-slate-100 text-[#2258d1]"   : "bg-white/6 text-[#8fb7ff]"
        }`}>
          {done ? <CheckCircle2 size={20} /> : <Icon size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-[#f5f7fb]"}`}>{title}</p>
          {subtitle && <p className={`mt-0.5 text-xs ${isLight ? "text-slate-500" : "text-[#6f7e9d]"}`}>{subtitle}</p>}
        </div>
        <span className={`transition-transform duration-200 ${isLight ? "text-slate-400" : "text-[#6f7e9d]"}`}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && (
        <div className={`border-t px-6 pb-6 pt-5 ${isLight ? "border-slate-900/6" : "border-white/6"}`}>
          {children}
        </div>
      )}
    </section>
  );
}

/* ─── Live preview ───────────────────────────────────────────────────────── */
function LivePreview({
  userName, college, major, summary, skills, languages, projects,
  resumeFileName, pct, isLight,
}: {
  userName: string; college: string; major: string; summary: string;
  skills: string[]; languages: string[]; projects: Project[];
  resumeFileName: string | null; pct: number; isLight: boolean;
}) {
  const initials = userName
    .split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const statusLabel =
    pct < 40 ? "Just started" :
    pct < 70 ? "Getting there" :
    pct < 100 ? "Almost done!" : "Profile complete!";

  return (
    <div className={`overflow-hidden rounded-2xl border ${
      isLight ? "border-slate-900/8 bg-white shadow-sm" : "border-white/8 bg-white/3"
    }`}>
      {/* Accent top bar */}
      <div className={`h-1 ${isLight ? "bg-gradient-to-r from-[#2258d1] via-[#8fb7ff] to-[#18c29c]" : "bg-gradient-to-r from-[#3d95ff] via-[#8fb7ff] to-[#18c29c]"}`} />

      <div className="p-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${
            isLight ? "bg-gradient-to-br from-[#2258d1] to-[#3d95ff]" : "bg-gradient-to-br from-[#3d95ff] to-[#2258d1]"
          }`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className={`truncate font-semibold ${isLight ? "text-slate-900" : "text-[#f5f7fb]"}`}>
              {userName || "Your Name"}
            </p>
            <p className={`truncate text-xs ${isLight ? "text-slate-500" : "text-[#9eabc4]"}`}>
              {major || "Your Major"}{college ? ` · ${college}` : ""}
            </p>
          </div>
        </div>

        {/* Completion ring */}
        <div className="mt-5 flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none"
                stroke={isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.06)"}
                strokeWidth="5" />
              <circle
                cx="28" cy="28" r="22" fill="none"
                stroke={pct === 100 ? "#22c55e" : isLight ? "#2258d1" : "#8fb7ff"}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${isLight ? "text-slate-900" : "text-[#f5f7fb]"}`}>
              {pct}%
            </span>
          </div>
          <div>
            <p className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-[#f5f7fb]"}`}>{statusLabel}</p>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-[#6f7e9d]"}`}>
              {pct < 100 ? "Fill in more sections to stand out" : "Ready to generate portfolio"}
            </p>
          </div>
        </div>

        {/* Summary snippet */}
        {summary && (
          <p className={`mt-4 text-xs leading-relaxed line-clamp-3 ${isLight ? "text-slate-600" : "text-[#9eabc4]"}`}>
            {summary}
          </p>
        )}

        {/* Skills preview */}
        {skills.length > 0 && (
          <div className="mt-4">
            <p className={`mb-2 text-xs font-semibold uppercase tracking-wider ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {skills.slice(0, 6).map(s => (
                <span key={s} className={`rounded-full px-2.5 py-1 text-xs ${
                  isLight ? "bg-slate-100 text-slate-700" : "bg-white/6 text-[#c8d8f0]"
                }`}>{s}</span>
              ))}
              {skills.length > 6 && (
                <span className={`rounded-full px-2.5 py-1 text-xs ${isLight ? "bg-slate-100 text-slate-500" : "bg-white/4 text-[#6f7e9d]"}`}>
                  +{skills.length - 6}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.filter(p => p.name).slice(0, 2).map(p => (
          <div key={p.id} className={`mt-3 rounded-xl border px-3 py-2 ${
            isLight ? "border-slate-900/8 bg-slate-50" : "border-white/6 bg-white/3"
          }`}>
            <p className={`text-xs font-medium ${isLight ? "text-slate-900" : "text-[#f5f7fb]"}`}>{p.name}</p>
            {p.description && (
              <p className={`mt-0.5 text-xs line-clamp-1 ${isLight ? "text-slate-500" : "text-[#6f7e9d]"}`}>{p.description}</p>
            )}
          </div>
        ))}

        {/* Resume pill */}
        {resumeFileName && (
          <div className={`mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 ${
            isLight ? "border-emerald-200 bg-emerald-50" : "border-emerald-500/15 bg-emerald-500/8"
          }`}>
            <FileText size={14} className="shrink-0 text-emerald-500" />
            <p className="truncate text-xs text-emerald-600">{resumeFileName}</p>
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {languages.map(l => (
              <span key={l} className={`rounded-full border px-2.5 py-1 text-xs ${
                isLight ? "border-slate-900/8 text-slate-500" : "border-white/8 text-[#6f7e9d]"
              }`}>{l}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function SampleMakerProfilePage() {
  const { t, locale } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();
  const pathname = usePathname();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [intakeId, setIntakeId] = useState<string | null>(null);

  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeDataUrl, setResumeDataUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [college, setCollege] = useState("");
  const [major, setMajor] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certInput, setCertInput] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [generatedPortfolio, setGeneratedPortfolio] = useState<any | null>(null);

  const { steps, pct } = useCompletion(userName, college, major, summary, skills, projects, resumeFileName);
  const markDirty = () => setIsDirty(true);

  /* ── Load ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (userId) {
          const { data } = await supabase.from('profile_intakes').select('*')
            .eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
          if (data && data.length > 0) {
            const row = data[0]; const d = row.data || {};
            setIntakeId(row.id);
            setResumeFileName(row.resume_file_name || d.resumeFileName || null);
            setResumeDataUrl(row.resume_url || d.resumeDataUrl || null);
            setSkills(row.skills || d.skills || []);
            setCollege(row.college || d.college || '');
            setMajor(row.major || d.major || '');
            setDegreeLevel(row.degree_level || d.degree_level || '');
            setCertifications(row.certifications || d.certifications || []);
            setLanguages(row.languages || d.languages || []);
            setSummary(row.summary || d.summary || '');
            setProjects(row.projects || d.projects || []);
            setGeneratedPortfolio(row.generated_portfolio || d.generated_portfolio || null);
            setUserName(d.userName || '');
          }
        } else {
          const raw = localStorage.getItem('sample_profile_intake');
          if (raw) {
            const p = JSON.parse(raw);
            setResumeFileName(p.resumeFileName || null); setResumeDataUrl(p.resumeDataUrl || null);
            setSkills(p.skills || []); setCollege(p.college || ''); setMajor(p.major || '');
            setDegreeLevel(p.degree_level || ''); setCertifications(p.certifications || []);
            setLanguages(p.languages || []); setSummary(p.summary || '');
            setProjects(p.projects || []); setGeneratedPortfolio(p.generated_portfolio || null);
            setUserName(p.userName || '');
          }
        }
      } catch (err) { console.warn('Failed to load', err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  /* ── Helpers ── */
  const genId = () => {
    try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID(); } catch (_) {}
    return Math.random().toString(36).slice(2, 9);
  };
  const fileToDataUrl = (file: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
  const uploadToStorage = async (path: string, dataUrl: string): Promise<string | null> => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const { error } = await supabase.storage.from('intakes').upload(path, blob, { cacheControl: '3600', upsert: true });
      if (error) throw error;
      try {
        const { data: s } = await supabase.storage.from('intakes').createSignedUrl(path, 3600);
        if (s?.signedUrl) return s.signedUrl;
      } catch (_) {}
      const { data: pub } = supabase.storage.from('intakes').getPublicUrl(path);
      return pub?.publicUrl || null;
    } catch (err) { console.warn('Upload failed', err); return null; }
  };

  /* ── Save ── */
  const saveAll = useCallback(async (generated?: any) => {
    setSaving(true);
    const payload: any = {
      resumeFileName, resumeDataUrl, skills, college, major,
      degree_level: degreeLevel, certifications, languages, summary, projects, userName,
      savedAt: new Date().toISOString(), ...(generated ? { generated_portfolio: generated } : {}),
    };
    try {
      const { data: ud } = await supabase.auth.getUser();
      const userId = ud?.user?.id || null;
      if (!userId) {
        localStorage.setItem('sample_profile_intake', JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Saved locally — sign in to sync.' } }));
        setIsDirty(false); setSavedAt(new Date()); return;
      }
      let resume_url: string | null = null;
      if (resumeDataUrl?.startsWith('data:')) {
        resume_url = await uploadToStorage(`intakes/${userId}/${Date.now()}-resume.pdf`, resumeDataUrl);
      }
      const projectsUp: Project[] = [];
      for (const p of projects) {
        const imgs: string[] = [];
        for (const [i, url] of p.images.entries()) {
          if (url.startsWith('data:')) { const u = await uploadToStorage(`intakes/${userId}/${p.id}-${i}.jpg`, url); imgs.push(u || url); }
          else imgs.push(url);
        }
        projectsUp.push({ ...p, images: imgs });
      }
      const upsert: any = { user_id: userId, data: { ...payload, projects: projectsUp, resumeDataUrl: resume_url || resumeDataUrl } };
      if (resume_url) upsert.resume_url = resume_url;
      if (generated) upsert.generated_portfolio = generated;
      let existingId = intakeId;
      if (!existingId) {
        const { data: ex } = await supabase.from('profile_intakes').select('id').eq('user_id', userId).limit(1);
        if (ex && ex.length > 0) { existingId = ex[0].id; setIntakeId(existingId); }
      }
      const { data: result, error } = existingId
        ? await supabase.from('profile_intakes').update(upsert).eq('id', existingId).select()
        : await supabase.from('profile_intakes').insert([upsert]).select();
      if (error) throw error;
      if (result?.length) setIntakeId(result[0].id);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Profile saved.' } }));
      setIsDirty(false); setSavedAt(new Date());
    } catch (err) {
      console.warn('Save failed', err);
      localStorage.setItem('sample_profile_intake', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Saved locally.' } }));
      setIsDirty(false); setSavedAt(new Date());
    } finally { setSaving(false); }
  }, [resumeFileName, resumeDataUrl, skills, college, major, degreeLevel, certifications, languages, summary, projects, userName, intakeId]);

  /* ── Generate ── */
  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const name = (userName || 'Emerging Maker').trim();
      const coreSkill = skills[0] || 'Creative Technologist';
      const headline = `${name} • ${coreSkill}${college ? ` @ ${college}` : ''}`;
      const bio = [
        summary?.trim() || `${name.split(' ')[0]} build products that blend design rigor with rapid prototyping.`,
        languages.length ? `Speaks ${languages.join(', ')}.` : '',
        certifications.length ? `Certified in ${certifications.join(', ')}.` : '',
      ].filter(Boolean).join(' ');
      const safeProjects = projects.length > 0 ? projects : [{
        id: 'tp', name: 'Signature Build',
        description: 'Self-directed concept showcasing the maker mindset.',
        skills: skills.slice(0, 3), toolsUsed: ['Figma', 'React', '3D Printing'], images: [],
      }];
      const themeIdx = Math.abs([...name].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)) % 4;
      const themes = [
        { theme_color: '#ce1126', background_gradient_start: '#0b1413', background_gradient_end: '#1f2b27', font_style: 'modern' },
        { theme_color: '#007a3d', background_gradient_start: '#0b1413', background_gradient_end: '#15302a', font_style: 'classic' },
        { theme_color: '#d9b88c', background_gradient_start: '#1b120e', background_gradient_end: '#2c1a12', font_style: 'playful' },
        { theme_color: '#111111', background_gradient_start: '#0b1413', background_gradient_end: '#111111', font_style: 'tech' },
      ];
      const generated = {
        professional_headline: headline, optimized_bio: bio,
        key_project_summary: safeProjects.map((p, i) => ({
          project_title: p.name || `Project ${i + 1}`,
          summary_point_1: `Challenge: ${p.description || 'Led discovery and launch.'}`,
          summary_point_2: `Focus: ${(p.skills || []).join(', ') || 'multi-disciplinary tools'}. Role: Lead Maker.`,
          summary_point_3: `Impact: Delivered outcomes using ${(p.toolsUsed || []).join(', ') || 'rapid prototyping kits'}.`,
          images: p.images || [], skills: p.skills || [], toolsUsed: p.toolsUsed || [],
        })),
        visual_style: themes[themeIdx],
      };
      setGeneratedPortfolio(generated);
      await saveAll(generated);
      const slug = (pathname || '').split('/').filter(Boolean)[1] || 'mock-id-123';
      router.push(`/profile/${slug}/portfolio`);
    } catch (err) {
      console.error('Generation failed', err);
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Generation failed.' } }));
    } finally { setGenerating(false); }
  };

  const navigateToPortfolio = () => {
    const slug = (pathname || '').split('/').filter(Boolean)[1] || 'mock-id-123';
    router.push(`/profile/${slug}/portfolio`);
  };

  /* ── Resume ── */
  const handleResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Please upload a PDF resume.' } })); return;
    }
    setResumeFileName(file.name); setResumeDataUrl(await fileToDataUrl(file)); markDirty();
  };

  /* ── Projects ── */
  const addProject = () => { setProjects(p => [...p, { id: genId(), name: '', description: '', skills: [], toolsUsed: [], images: [] }]); markDirty(); };
  const removeProject = (id: string) => { setProjects(p => p.filter(x => x.id !== id)); markDirty(); };
  const updateProject = (id: string, patch: Partial<Project>) => { setProjects(p => p.map(x => x.id === id ? { ...x, ...patch } : x)); markDirty(); };
  const addProjectTag = (id: string, field: 'skills' | 'toolsUsed', val: string) => {
    const cur = projects.find(p => p.id === id);
    if (!cur || !val.trim()) return;
    updateProject(id, { [field]: Array.from(new Set([...cur[field], val.trim()])) });
  };
  const handleProjectImage = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const cur = projects.find(p => p.id === id);
    if (!cur) return;
    const urls = (await Promise.all(files.slice(0, Math.max(0, 3 - cur.images.length)).map(f => fileToDataUrl(f)))).filter(Boolean) as string[];
    updateProject(id, { images: [...cur.images, ...urls] });
  };

  /* ── Shared input class ── */
  const inputCls = isLight
    ? "w-full rounded-xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-150 focus:border-[#2258d1] focus:shadow-[0_0_0_3px_rgba(34,88,209,0.1)]"
    : "w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-[#f5f7fb] placeholder-[#6f7e9d] outline-none transition-all duration-150 focus:border-[#8fb7ff]/40 focus:shadow-[0_0_0_3px_rgba(143,183,255,0.08)]";
  const labelCls = `mb-1.5 block text-xs font-semibold uppercase tracking-wider ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isLight ? "bg-[#fcfcfa]" : "bg-[#090b0f]"}`}>
        <div className="text-center">
          <div className={`mx-auto h-12 w-12 animate-spin rounded-full border-2 ${isLight ? "border-slate-200 border-t-[#2258d1]" : "border-white/10 border-t-[#8fb7ff]"}`} />
          <p className={`mt-4 text-sm ${isLight ? "text-slate-500" : "text-[#9eabc4]"}`}>{t('sample.loading', 'Loading your data...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={dir}
      className={`home-shell min-h-screen ${isLight ? "home-shell-light text-slate-950" : "home-shell-dark text-[#f5f7fb]"}`}
    >
      {/* ── Header ── */}
      <div className="mx-auto max-w-7xl px-4 pb-2 pt-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/")}
          className={`mb-6 inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
            isLight
              ? "border-slate-900/10 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              : "border-white/8 bg-white/4 text-[#9eabc4] hover:border-white/15 hover:text-[#f5f7fb]"
          }`}
        >
          <ArrowLeft size={15} /> Back to home
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>
              {t('sample.kicker', 'Profile Builder')}
            </p>
            <h1 className={`mt-2 font-display text-2xl font-bold sm:text-3xl ${isLight ? "text-slate-950" : "text-white"}`}>
              {t('sample.title', 'Profile Builder')}
            </h1>
            <p className={`mt-2 max-w-xl text-sm leading-relaxed ${isLight ? "text-slate-500" : "text-[#9eabc4]"}`}>
              {t('sample.intro', 'Tell your story once. We organize it into a portfolio that connects you with mentors, teams, and local opportunities.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            {[t('sample.badge_1','100 makers pilot'), t('sample.badge_2','Arabic + English'), t('sample.badge_3','Sudan + Egypt focus')].map((b, i) => (
              <span key={i} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                isLight ? "border-slate-900/10 bg-white text-slate-600" : "border-white/10 bg-white/5 text-[#9eabc4]"
              }`}>{b}</span>
            ))}
          </div>
        </div>

        {/* Progress bar + step pills */}
        <div className="mt-6">
          <div className={`mb-3 h-1 overflow-hidden rounded-full ${isLight ? "bg-slate-100" : "bg-white/6"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${isLight ? "bg-[#2258d1]" : "bg-[#8fb7ff]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <a
                  href={`#${step.id}`}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                    step.done
                      ? isLight
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : isLight
                        ? "border-slate-900/8 bg-white text-slate-500 hover:border-slate-300"
                        : "border-white/8 bg-white/3 text-[#6f7e9d] hover:border-white/15 hover:text-[#9eabc4]"
                  }`}
                >
                  {step.done ? <CheckCircle2 size={11} className="shrink-0" /> : <Circle size={11} className="shrink-0" />}
                  {step.label}
                </a>
                {i < steps.length - 1 && (
                  <div className={`h-px w-3 shrink-0 ${isLight ? "bg-slate-200" : "bg-white/8"}`} />
                )}
              </React.Fragment>
            ))}
            <span className={`ml-auto shrink-0 pl-2 text-sm font-bold ${
              pct === 100 ? "text-emerald-500" : isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"
            }`}>{pct}%</span>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* Left: form sections */}
          <div className="min-w-0 flex-1 space-y-4">

            {/* Resume */}
            <SectionCard id="resume" icon={FileText} title="Resume" subtitle="Upload your PDF to enrich skills matching" done={!!resumeFileName} isLight={isLight}>
              {!resumeFileName ? (
                <label className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 ${
                  isLight
                    ? "border-slate-200 bg-slate-50 hover:border-[#2258d1] hover:bg-blue-50/40"
                    : "border-white/8 bg-white/2 hover:border-[#8fb7ff]/30 hover:bg-white/4"
                }`}>
                  <Upload size={28} className={`transition-colors duration-200 ${
                    isLight ? "text-slate-300 group-hover:text-[#2258d1]" : "text-[#6f7e9d] group-hover:text-[#8fb7ff]"
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-[#9eabc4]"}`}>{t('sample.choose_resume','Choose resume')}</p>
                    <p className={`mt-1 text-xs ${isLight ? "text-slate-400" : "text-[#6f7e9d]"}`}>PDF only · Max 10 MB</p>
                  </div>
                  <input type="file" accept="application/pdf" onChange={handleResume} className="hidden" />
                </label>
              ) : (
                <div className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${
                  isLight ? "border-emerald-200 bg-emerald-50" : "border-emerald-500/15 bg-emerald-500/8"
                }`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isLight ? "bg-emerald-100" : "bg-emerald-500/15"
                    }`}>
                      <FileText size={18} className="text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-medium ${isLight ? "text-slate-900" : "text-[#f5f7fb]"}`}>{resumeFileName}</p>
                      <p className="text-xs text-emerald-500">{t('sample.resume_added','Resume added')}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <label className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                      isLight ? "border-slate-900/10 bg-white text-slate-600 hover:border-slate-300" : "border-white/8 bg-white/5 text-[#9eabc4] hover:border-white/15"
                    }`}>
                      {t('sample.change_resume','Change')}
                      <input type="file" accept="application/pdf" onChange={handleResume} className="hidden" />
                    </label>
                    <button type="button" onClick={() => { setResumeFileName(null); setResumeDataUrl(null); markDirty(); }}
                      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border transition-colors duration-150 ${
                        isLight ? "border-red-100 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white" : "border-red-900/30 bg-red-900/10 text-red-400 hover:bg-red-600 hover:text-white"
                      }`} aria-label="Remove resume">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Basics */}
            <SectionCard id="basics" icon={User} title="Basics" subtitle="Your name and core identity" done={!!(userName && college)} isLight={isLight}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="userName" label={t('sample.name','Your Name')} isLight={isLight}>
                  <TextInput id="userName" value={userName} onChange={v => { setUserName(v); markDirty(); }}
                    placeholder={t('sample.name_placeholder','John Doe')} isLight={isLight} />
                </Field>
                <Field id="college" label={t('sample.college','College')} isLight={isLight}>
                  <TextInput id="college" value={college} onChange={v => { setCollege(v); markDirty(); }}
                    placeholder="University of Khartoum" isLight={isLight} />
                </Field>
              </div>
              <div className="mt-4">
                <label className={labelCls}>{t('sample.languages','Languages')}</label>
                <TagInput value={langInput} onChange={setLangInput} onAdd={() => {
                  if (!langInput.trim()) return;
                  setLanguages(p => Array.from(new Set([...p, langInput.trim()]))); setLangInput(''); markDirty();
                }} placeholder={t('sample.add_language','Arabic, English…')} isLight={isLight} />
                {languages.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {languages.map(l => <TagChip key={l} label={l} isLight={isLight} onRemove={() => { setLanguages(p => p.filter(x => x !== l)); markDirty(); }} />)}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Education */}
            <SectionCard id="education" icon={GraduationCap} title="Education" subtitle="Your academic background" done={!!major} isLight={isLight}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="major" label={t('sample.major','Major / Degree')} isLight={isLight}>
                  <TextInput id="major" value={major} onChange={v => { setMajor(v); markDirty(); }}
                    placeholder="Computer Science" isLight={isLight} />
                </Field>
                <Field id="degreeLevel" label={t('sample.degree_level','Degree Level')} isLight={isLight}>
                  <select id="degreeLevel" value={degreeLevel} onChange={e => { setDegreeLevel(e.target.value); markDirty(); }}
                    className={inputCls}>
                    <option value="">{t('sample.degree_placeholder','Select level')}</option>
                    <option value="Undergraduate">{t('sample.degree_undergrad','Undergraduate')}</option>
                    <option value="Graduate">{t('sample.degree_grad','Graduate')}</option>
                    <option value="PhD">{t('sample.degree_phd','PhD')}</option>
                  </select>
                </Field>
              </div>
              <div className="mt-4">
                <label className={labelCls}>{t('sample.certifications','Certifications')}</label>
                <TagInput value={certInput} onChange={setCertInput} onAdd={() => {
                  if (!certInput.trim()) return;
                  setCertifications(p => Array.from(new Set([...p, certInput.trim()]))); setCertInput(''); markDirty();
                }} placeholder={t('sample.add_cert','AWS, Google UX, PMP…')} isLight={isLight} />
                {certifications.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {certifications.map(c => <TagChip key={c} label={c} isLight={isLight} onRemove={() => { setCertifications(p => p.filter(x => x !== c)); markDirty(); }} />)}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Skills */}
            <SectionCard id="skills" icon={Wrench} title="Skills" subtitle="Add at least 2 skills to complete this section" done={skills.length >= 2} isLight={isLight}>
              <TagInput value={skillInput} onChange={setSkillInput} onAdd={() => {
                if (!skillInput.trim()) return;
                setSkills(p => Array.from(new Set([...p, skillInput.trim()]))); setSkillInput(''); markDirty();
              }} placeholder={t('sample.add_skill','React, Figma, Python…')} isLight={isLight} />
              {skills.length === 0 && (
                <p className={`mt-3 text-xs ${isLight ? "text-slate-400" : "text-[#6f7e9d]"}`}>
                  Tip: Be specific — "Figma" beats "Design", "React" beats "Coding".
                </p>
              )}
              {skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.map(s => <TagChip key={s} label={s} isLight={isLight} onRemove={() => { setSkills(p => p.filter(x => x !== s)); markDirty(); }} />)}
                </div>
              )}
            </SectionCard>

            {/* Summary */}
            <SectionCard id="summary" icon={BookOpen} title="Short Summary" subtitle="Write 30+ characters to complete" done={summary.trim().length >= 30} isLight={isLight}>
              <div className="relative">
                <textarea
                  value={summary}
                  onChange={e => { setSummary(e.target.value); markDirty(); }}
                  placeholder="I'm a maker based in Cairo who builds products that blend hardware and software. Currently studying Computer Science and working on community tools for Sudanese youth."
                  rows={5}
                  className={`${inputCls} resize-none leading-relaxed`}
                />
                <span className={`absolute bottom-3 right-3 text-xs ${summary.length >= 30 ? "text-emerald-500" : isLight ? "text-slate-400" : "text-[#6f7e9d]"}`}>
                  {summary.length} chars
                </span>
              </div>
            </SectionCard>

            {/* Projects */}
            <SectionCard id="projects" icon={FolderKanban} title="Projects" subtitle="Add at least one named project" done={projects.length >= 1 && !!projects[0]?.name} isLight={isLight}>
              <button type="button" onClick={addProject}
                className={`mb-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  isLight
                    ? "border-[#2258d1]/25 bg-blue-50/50 text-[#2258d1] hover:bg-blue-50"
                    : "border-[#8fb7ff]/20 bg-[#8fb7ff]/5 text-[#8fb7ff] hover:bg-[#8fb7ff]/8"
                }`}>
                <Plus size={16} /> {t('sample.add_project','Add Project')}
              </button>
              <div className="space-y-4">
                {projects.map((p, idx) => (
                  <ProjectCard
                    key={p.id} project={p} index={idx}
                    onUpdate={updateProject} onRemove={removeProject}
                    onAddTag={addProjectTag} onAddImage={handleProjectImage}
                    onRemoveImage={(pid, url) => { const cur = projects.find(pr => pr.id === pid); if (cur) updateProject(pid, { images: cur.images.filter(u => u !== url) }); }}
                    isLight={isLight} t={t}
                  />
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Right: sticky sidebar */}
          <div className="w-full lg:w-[320px] lg:shrink-0">
            <div className="sticky top-6 space-y-4">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Eye size={13} className={isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"} />
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>Live Preview</p>
                </div>
                <LivePreview
                  userName={userName} college={college} major={major} summary={summary}
                  skills={skills} languages={languages} projects={projects}
                  resumeFileName={resumeFileName} pct={pct} isLight={isLight}
                />
              </div>

              {/* Checklist */}
              <div className={`rounded-2xl border p-5 ${isLight ? "border-slate-900/8 bg-white shadow-sm" : "border-white/8 bg-white/3"}`}>
                <p className={`mb-4 text-xs font-semibold uppercase tracking-wider ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`}>
                  Completion Checklist
                </p>
                <div className="space-y-3">
                  {steps.map(step => (
                    <div key={step.id} className="flex items-center gap-3">
                      {step.done
                        ? <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                        : <Circle size={15} className={`shrink-0 ${isLight ? "text-slate-200" : "text-white/10"}`} />}
                      <span className={`text-sm ${step.done ? isLight ? "text-slate-900" : "text-[#f5f7fb]" : isLight ? "text-slate-400" : "text-[#6f7e9d]"}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button type="button" onClick={() => saveAll(generatedPortfolio ?? undefined)}
                  disabled={saving || !isDirty}
                  className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                    isLight
                      ? "border-slate-900/10 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      : "border-white/8 bg-white/4 text-[#f5f7fb] hover:border-white/15 hover:bg-white/6"
                  }`}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? "Saving…" : isDirty ? t('sample.save','Save') : savedAt ? "Saved" : t('sample.save','Save')}
                </button>

                {generatedPortfolio && !isDirty ? (
                  <button type="button" onClick={navigateToPortfolio}
                    className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-150 ${
                      isLight ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
                    }`}>
                    <Eye size={15} /> {t('sample.view_portfolio','View My Portfolio')} <ArrowRight size={15} />
                  </button>
                ) : (
                  <button type="button" onClick={generateWithAI} disabled={generating || pct < 30}
                    className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                      isLight ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
                    }`}>
                    {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    {generating
                      ? t('sample.generating','Generating Portfolio…')
                      : generatedPortfolio
                        ? t('sample.update_portfolio','Update Portfolio')
                        : t('sample.customize_ai','Generate Portfolio')}
                  </button>
                )}

                {pct < 30 && !generating && (
                  <p className={`text-center text-xs ${isLight ? "text-slate-400" : "text-[#6f7e9d]"}`}>
                    Fill in more sections to unlock
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Project card ───────────────────────────────────────────────────────── */
function ProjectCard({
  project: p, index, onUpdate, onRemove, onAddTag, onAddImage, onRemoveImage, isLight, t,
}: {
  project: Project; index: number;
  onUpdate: (id: string, patch: Partial<Project>) => void;
  onRemove: (id: string) => void;
  onAddTag: (id: string, field: 'skills' | 'toolsUsed', val: string) => void;
  onAddImage: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string, url: string) => void;
  isLight: boolean;
  t: (key: string, fallback?: string) => string;
}) {
  const [skillIn, setSkillIn] = useState("");
  const [toolIn, setToolIn] = useState("");

  const inputCls = isLight
    ? "w-full rounded-xl border border-slate-900/10 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-150 focus:border-[#2258d1] focus:shadow-[0_0_0_3px_rgba(34,88,209,0.1)]"
    : "w-full rounded-xl border border-white/8 bg-white/4 px-3 py-2.5 text-sm text-[#f5f7fb] placeholder-[#6f7e9d] outline-none transition-all duration-150 focus:border-[#8fb7ff]/40 focus:shadow-[0_0_0_3px_rgba(143,183,255,0.08)]";
  const labelCls = `mb-1.5 block text-xs font-semibold uppercase tracking-wider ${isLight ? "text-[#2258d1]" : "text-[#8fb7ff]"}`;

  return (
    <div className={`overflow-hidden rounded-2xl border ${
      isLight ? "border-slate-900/8 bg-slate-50/50" : "border-white/8 bg-white/2"
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b px-5 py-4 ${
        isLight ? "border-slate-900/6" : "border-white/6"
      }`}>
        <div className="flex items-center gap-3">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
            isLight ? "bg-[#2258d1]/10 text-[#2258d1]" : "bg-[#8fb7ff]/10 text-[#8fb7ff]"
          }`}>{index + 1}</span>
          <p className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-[#f5f7fb]"}`}>
            {p.name || `Project ${index + 1}`}
          </p>
        </div>
        <button type="button" onClick={() => onRemove(p.id)}
          className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-150 ${
            isLight ? "border-red-100 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white" : "border-red-900/20 bg-red-900/8 text-red-400 hover:bg-red-600 hover:text-white"
          }`} aria-label="Remove project">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-4 p-5">
        {/* Name */}
        <div>
          <label className={labelCls}>Project name</label>
          <input value={p.name} onChange={e => onUpdate(p.id, { name: e.target.value })}
            placeholder="What did you build?" className={inputCls} />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={p.description} onChange={e => onUpdate(p.id, { description: e.target.value })}
            placeholder="What problem did it solve? Who was it for?"
            rows={3} className={`${inputCls} resize-none leading-relaxed`} />
        </div>

        {/* Skills + Tools */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { field: 'skills' as const, label: 'Skills used', val: skillIn, setVal: setSkillIn, placeholder: 'React, Python…', tags: p.skills },
            { field: 'toolsUsed' as const, label: 'Tools used', val: toolIn, setVal: setToolIn, placeholder: 'Figma, Arduino…', tags: p.toolsUsed },
          ].map(({ field, label, val, setVal, placeholder, tags }) => (
            <div key={field}>
              <label className={labelCls}>{label}</label>
              <div className="flex gap-2">
                <input value={val} onChange={e => setVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAddTag(p.id, field, val); setVal(""); } }}
                  placeholder={placeholder}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs outline-none transition-all duration-150 ${
                    isLight
                      ? "border-slate-900/10 bg-white text-slate-900 placeholder-slate-400 focus:border-[#2258d1]"
                      : "border-white/8 bg-white/4 text-[#f5f7fb] placeholder-[#6f7e9d] focus:border-[#8fb7ff]/40"
                  }`} />
                <button type="button" onClick={() => { onAddTag(p.id, field, val); setVal(""); }}
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl transition-colors duration-150 ${
                    isLight ? "bg-slate-950 text-white hover:bg-slate-700" : "bg-[#2258d1] text-white hover:bg-[#1a46ab]"
                  }`}>
                  <Plus size={13} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map(s => (
                  <TagChip key={s} label={s} isLight={isLight} onRemove={() => onUpdate(p.id, { [field]: tags.filter(x => x !== s) })} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Images */}
        <div>
          <label className={labelCls}>Project images ({p.images.length}/3)</label>
          <div className="flex flex-wrap gap-3">
            {p.images.map(url => (
              <div key={url} className={`group relative h-20 w-20 overflow-hidden rounded-xl border ${
                isLight ? "border-slate-900/8" : "border-white/8"
              }`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => onRemoveImage(p.id, url)}
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <X size={16} className="text-white" />
                </button>
              </div>
            ))}
            {p.images.length < 3 && (
              <label className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors duration-150 ${
                isLight
                  ? "border-slate-200 text-slate-300 hover:border-[#2258d1] hover:text-[#2258d1]"
                  : "border-white/10 text-[#6f7e9d] hover:border-[#8fb7ff]/30 hover:text-[#8fb7ff]"
              }`}>
                <ImageIcon size={20} />
                <input type="file" accept="image/*" multiple onChange={e => onAddImage(p.id, e)} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
