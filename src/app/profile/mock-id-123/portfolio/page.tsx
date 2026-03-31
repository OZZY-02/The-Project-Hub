"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
// NOTE: Assuming local Supabase Client path
import supabase from '../../../../lib/supabaseClient';
// NOTE: Assuming local i18n path
import { useTranslation } from "../../../../lib/i18n";
import { useRouter, usePathname } from 'next/navigation';
import { FileText, Download, Maximize2, Minimize2, X, AlertTriangle, CheckCircle, Upload, Globe, Zap, Loader2 } from 'lucide-react'; // Import necessary icons

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
  major?: string;
  degree_level?: string;
  certifications?: string[];
  languages?: string[];
  summary?: string;
  projects?: Project[];
  resume_url?: string | null;
  // Add template selection field here if the AI generator is used to decide the template
  visual_style?: {
    theme_color: string;
    background_gradient_start: string;
    background_gradient_end: string;
    font_style: string;
    template_id: 'layout-1' | 'layout-2'; // For dynamic layout selection
  }
};

// --- CORE COMPONENT ---
export default function GeneratedPortfolioPage() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [intake, setIntake] = useState<Intake | null>(null);
  const [generated, setGenerated] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTarget, setAiTarget] = useState<"projects" | "skills" | "resume">("resume");
  const [aiPath, setAiPath] = useState("summary");
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showResume, setShowResume] = useState(true); // Default to showing the resume viewer
  const [resumeFullScreen, setResumeFullScreen] = useState(false);
  const [resumeThumb, setResumeThumb] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxActive, setLightboxActive] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const align = locale === 'ar' ? 'text-right' : 'text-left';

  // 1. Determine the canonical resume link
  const resumeHref: string | undefined = (intake?.resume_url ?? (intake as any)?.resumeDataUrl) || undefined;

  // Auto-open resume viewer when intake loads and a resume is present
  useEffect(() => {
    if (!loading && intake && resumeHref) {
      setShowResume(true);
    }
  }, [loading, intake, resumeHref]);

  // 2. Thumbnail Generation Logic (Client-Side PDF Rendering)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!resumeHref) return;
    let cancelled = false;
    setResumeThumb(null); // Reset thumbnail state
    
    (async () => {
      try {
        if (/\.(png|jpe?g|gif|webp)(\?|$)/i.test(resumeHref)) {
          if (!cancelled) setResumeThumb(resumeHref);
          return;
        }

        if (/\.pdf(\?|$)/i.test(resumeHref)) {
          const proxy = `/api/resume/thumbnail?url=${encodeURIComponent(resumeHref)}`;
          try {
            // Dynamically import pdfjs (client-only)
            // @ts-ignore
            const pdfjs = await import('pdfjs-dist/build/pdf');
            // NOTE: Must set the worker src for pdfjs to work in a client environment
            (pdfjs as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

            const res = await fetch(resumeHref);
            const arrayBuffer = await res.arrayBuffer();
            const loadingTask = (pdfjs as any).getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.0 });
            const canvas = document.createElement('canvas');
            // Adjust canvas size for better thumbnail scaling
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No canvas context');
            await page.render({ canvasContext: ctx, viewport }).promise;
            const dataUrl = canvas.toDataURL('image/png');
            if (!cancelled) setResumeThumb(dataUrl);
            return;
          } catch (err) {
            console.warn('PDF thumbnail generation failed client-side', err);
            // If fetch failed (CORS, network, auth), immediately fall back to server proxy
            if (!cancelled) setResumeThumb(proxy);
            return;
          }
        }
      } catch (err) {
        console.warn('Resume processing error', err);
      }
    })();
    return () => { cancelled = true; };
  }, [resumeHref]);

  // 3. Server-Side Thumbnail Fallback (if client-side fails)
  useEffect(() => {
    if (!resumeHref || resumeThumb) return;
    const id = setTimeout(() => {
      // Use server-side thumbnail proxy as fallback if thumbnail generation is still null after a delay
      const proxy = `/api/resume/thumbnail?url=${encodeURIComponent(resumeHref)}`;
      setResumeThumb(proxy);
    }, 1500);
    return () => clearTimeout(id);
  }, [resumeHref, resumeThumb]);

  // Lightbox: handle Escape key and body scroll lock
  useEffect(() => {
    if (!lightboxSrc) {
      setLightboxActive(false);
      document.body.style.overflow = '';
      return;
    }

    // Enable enter animation
    setLightboxActive(false);
    requestAnimationFrame(() => setLightboxActive(true));

    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxSrc(null);
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', onKey);

    // On open, focus the close button
    requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      setLightboxActive(false);
    };
  }, [lightboxSrc]);


  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user || null;
        const userId = user?.id || null;
        if (mounted) setUserId(userId);

        if (userId) {
          const { data, error } = await supabase
            .from('profile_intakes')
            .select('data, resume_url, generated_portfolio')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1);

          if (!error && Array.isArray(data) && data.length > 0) {
            const row = (data as any)[0];
            if (mounted) {
              const base = { ...(row.data || {}), resume_url: row.resume_url || null };
              setIntake(base);
              const savedGenerated = (row as any).generated_portfolio || base.generated_portfolio || null;
              if (savedGenerated) setGenerated(savedGenerated);
            }
            setLoading(false);
            return;
          }
        }

        const raw = typeof window !== 'undefined' ? localStorage.getItem('sample_profile_intake') : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (mounted) {
            setIntake(parsed || null);
            if (parsed?.generated_portfolio) setGenerated(parsed.generated_portfolio);
          }
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

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("profile_intakes_live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profile_intakes", filter: `user_id=eq.${userId}` },
        (payload) => {
          const next = (payload as any)?.new?.data || null;
          if (next) setIntake(next);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Determine theme and template from generated data or fallbacks
  const defaultTheme = {
    theme_color: '#ce1126',
    background_gradient_start: '#0b1413',
    background_gradient_end: '#1f2b27',
    font_style: 'modern',
    template_id: 'layout-1',
  };
  const theme = generated?.visual_style || defaultTheme;
  const templateId = theme.template_id || 'layout-1';

  // Fallback / Generated Summary Text Logic
  const generateEducatedSummary = (intake: Intake | null, generated: any | null) => {
    if (generated?.optimized_bio && String(generated.optimized_bio).trim()) return String(generated.optimized_bio).trim();
    if (intake?.summary && String(intake.summary).trim()) return String(intake.summary).trim();
    
    // Fallback logic remains the same
    const parts: string[] = [];
    const name = (intake as any)?.userName || generated?.professional_headline || '';
    const major = intake?.major || generated?.visual_style?.major || '';
    const college = intake?.college || '';
    const skills = intake?.skills || [];
    const projectNames = (intake?.projects || generated?.key_project_summary || []).map((p: any) => p.name || p.project_title).filter(Boolean).slice(0,3);

    if (name) parts.push(`${name.split(' ')[0]} builds thoughtful, usable projects`);
    if (major || college) parts.push(`${major ? major : ''}${major && college ? ' at ' : ''}${college ? college : ''}`.trim());
    if (skills && skills.length) parts.push(`skilled in ${skills.slice(0,5).join(', ')}`);
    if (projectNames.length) parts.push(`notable work includes ${projectNames.join(', ')}`);

    let sentence = parts.join('. ');
    if (!sentence) sentence = 'Builds practical projects that solve user-focused problems and ships polished prototypes.';
    sentence = sentence.replace(/\s{2,}/g, ' ').replace(/^[\.,\s]+/, '').replace(/[\s\.,]+$/g, '');
    if (!sentence) sentence = 'Builds practical projects that solve user-focused problems and ships polished prototypes.';
    return sentence.endsWith('.') ? sentence : sentence + '.';
  };

  const descriptionText = generateEducatedSummary(intake, generated);

  const headerStyle: React.CSSProperties = {
    background: `linear-gradient(120deg, ${theme.background_gradient_start}, ${theme.background_gradient_end})`,
    color: '#f7f1e7',
  };

  if (loading) return <div className="p-6">{t('sample.loading','Loading portfolio...')}</div>;
  if (!intake) return (
    <div dir={dir} className="min-h-screen bg-[#0b1413] p-6 text-[#f4efe6]">
      <h1 className={`font-display text-2xl ${align}`}>{t('sample.no_data','No intake data found')}</h1>
      <p className={`mt-2 text-sm text-[#cfc8be] ${align}`}>{t('sample.no_data_help','Complete the Sample Maker Intake form first to generate a portfolio.')}</p>
      <button onClick={() => router.push('/profile/mock-id-123')} className="mt-4 inline-flex items-center rounded-full bg-[#ce1126] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e32636]">
        <Upload size={16} className="mr-2" /> {t('sample.start_intake','Start Intake Form')}
      </button>
    </div>
  );

  // --- Rendering Functions for Project Sections ---

  const renderProjects = (projectsToRender: any) => (
    <div className="space-y-6 mt-4">
      {(projectsToRender || []).map((proj: any, idx: number) => {
        const imgs: string[] = (proj.images || []).filter(Boolean).slice(0,3);
        return (
        <article key={idx} className="bg-white p-4 rounded-xl shadow border border-gray-200 hover:shadow-lg transition">
          <h4 className="font-extrabold text-2xl text-gray-900 mb-4 text-center">{proj.project_title || proj.name || 'Untitled Project'}</h4>

          {/* Image wrapping logic: float images so text wraps around them depending on how many exist */}
          <div className="mb-3">
            {imgs.length === 1 && (
                <div className="float-left mr-4 mb-4 w-48 md:w-64">
                <img src={imgs[0]} alt={proj.project_title || proj.name} className="w-full h-auto object-cover rounded cursor-pointer" onClick={() => setLightboxSrc(imgs[0])} />
              </div>
            )}

            {imgs.length === 2 && (
              <>
                <div className="float-left mr-4 mb-4 w-44 md:w-56">
                  <img src={imgs[0]} alt={proj.project_title || proj.name} className="w-full h-auto object-cover rounded cursor-pointer" onClick={() => setLightboxSrc(imgs[0])} />
                </div>
                <div className="float-right ml-4 mb-4 w-44 md:w-56">
                  <img src={imgs[1]} alt={proj.project_title || proj.name} className="w-full h-auto object-cover rounded cursor-pointer" onClick={() => setLightboxSrc(imgs[1])} />
                </div>
              </>
            )}

            {imgs.length >= 3 && (
              <div className="flex gap-3 mb-4">
                {imgs.map((src, i) => (
                  <div key={i} className="w-1/3 rounded overflow-hidden bg-gray-100">
                      <img src={src} alt={`${proj.project_title || proj.name} ${i+1}`} className="w-full h-40 object-cover cursor-pointer" onClick={() => setLightboxSrc(src)} />
                    </div>
                ))}
              </div>
            )}
          
            {/* Description text that will wrap around floated images */}
            <div className="text-sm text-gray-700">
              {(generated && proj.summary_point_1) ? (
                <ul className="list-disc ml-5 space-y-1">
                  {proj.summary_point_1 && <li>{proj.summary_point_1}</li>}
                  {proj.summary_point_2 && <li>{proj.summary_point_2}</li>}
                  {proj.summary_point_3 && <li>{proj.summary_point_3}</li>}
                </ul>
              ) : (
                proj.description && <p className="mb-2 text-justify" style={{ textAlign: 'justify' }}>{proj.description}</p>
              )}

              {/* Skills and Tools (flows under the description and clears floats) */}
              {(proj.skills && proj.skills.length > 0) && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 font-medium">{t('sample.skills','Skills Used')}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {proj.skills.map((s: string) => <span key={s} className="bg-gray-100 px-2 py-1 rounded text-sm font-medium text-gray-700">{s}</span>)}
                  </div>
                </div>
              )}
            </div>

            <div className="clear-both" />
          </div>
        </article>
      )})}
    </div>
  );
  
  // --- Portfolio Layout Selector (For Customization) ---
  const renderPortfolioLayout = () => {
    // Determine the data source for projects (prefer generated data if available)
    const projectsSource = generated?.key_project_summary || intake.projects;
    
    // --- Layout 2 Content Filler Helper ---
    // Provides text filler for empty project slots when projectsSource.length < 3
    const getLayout2Filler = (index: number) => {
      if (index === 0) return {
        title: t('filler.next_project','Start Your Next Big Project'),
        description: t('filler.next_project_desc','Define your vision and recruit collaborators for your third showcase slot.'),
      };
      if (index === 1) return {
        title: t('filler.mentorship','Attract Mentorship'),
        description: t('filler.mentorship_desc','A complete profile with visuals draws 5x more attention from sponsors.'),
      };
      return {
        title: t('filler.challenge','Join a Maker Challenge'),
        description: t('filler.challenge_desc','Participate in a 48-hour challenge to generate content for this spot!'),
      };
    }

    // NOTE: This structure is simplified here to avoid duplicating the entire Layout1/Layout2 code,
    // but in a real Next.js app, this would conditionally render external components like PortfolioLayout1.
    
    if (templateId === 'layout-2') {
        // --- Simplified Layout 2 (Horizontal Image Bar, Summary at Bottom) ---
        // 1. Determine number of project slots to render (up to 3)
        const projectCount = Math.min(projectsSource.length, 3);
        const slots = Array(3).fill(null).map((_, i) => projectsSource[i]);

        // Count how many visual images we actually have among the slots
        const visualCount = slots.reduce((acc, s) => acc + ((s && s.images && s.images.length) ? 1 : 0), 0);

        // Variant: One visual - float the image and let text wrap to the right
        if (visualCount === 1) {
          const primary = slots.find((s: any) => s && s.images && s.images[0]);
          return (
            <div className="space-y-6">
              <div className="clear-both">
                {/* Floating image so text wraps around it */}
                <div className="float-left mr-6 mb-4 w-72 md:w-96 rounded-lg overflow-hidden bg-gray-100">
                  {primary && primary.images?.[0] ? (
                    <img src={primary.images[0]} alt={primary.project_title || primary.name} className="w-full h-full object-cover cursor-pointer" onClick={() => primary.images[0] && setLightboxSrc(primary.images[0])} />
                  ) : (
                    <div className="p-8 text-center text-gray-500">{t('filler.no_visual','No Visual')}</div>
                  )}
                </div>

                {/* Text content will flow around the floated image */}
                <div className="prose max-w-none text-gray-700">
                  {slots.map((proj: any, i: number) => (
                    proj ? (
                      <div key={i} className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 text-center">{proj.project_title || proj.name}</h3>
                        <p className="text-sm text-justify" style={{ textAlign: 'justify' }}>{proj.description || proj.summary_point_1}</p>
                      </div>
                    ) : (
                      <div key={i} className="mb-4 text-center p-3 bg-gray-50 rounded">
                        <h3 className="text-lg font-bold text-gray-700">{getLayout2Filler(i).title}</h3>
                        <p className="text-xs text-gray-500">{getLayout2Filler(i).description}</p>
                      </div>
                    )
                  ))}
                </div>
                <div className="clear-both" />
              </div>
            </div>
          );
        }

        // Variant: Two visuals - show a 2-up image row and text grid of two columns
        if (visualCount === 2) {
          const imgs = slots.filter((s: any) => s && s.images && s.images[0]).slice(0,2);
          return (
            <div className="space-y-6">
              <div className="clearfix">
                {/* Float two images so text wraps between/around them */}
                {imgs.map((p: any, i: number) => (
                    <div key={i} className={`float-left mr-4 mb-4 w-56 md:w-64 rounded-lg overflow-hidden bg-gray-100 ${i === 1 ? 'ml-2' : ''}`}>
                    <img src={p.images[0]} alt={p.project_title || p.name} className="w-full h-full object-cover cursor-pointer" onClick={() => p.images[0] && setLightboxSrc(p.images[0])} />
                  </div>
                ))}

                {/* Text content flows around the floated images */}
                <div className="prose max-w-none text-gray-700">
                  {slots.map((proj: any, i: number) => (
                    proj ? (
                      <div key={i} className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 text-center">{proj.project_title || proj.name}</h3>
                        <p className="text-sm text-justify" style={{ textAlign: 'justify' }}>{proj.description || proj.summary_point_1}</p>
                      </div>
                    ) : (
                      <div key={i} className="mb-4 text-center p-3 bg-gray-50 rounded">
                        <h3 className="text-lg font-bold text-gray-700">{getLayout2Filler(i).title}</h3>
                        <p className="text-xs text-gray-500">{getLayout2Filler(i).description}</p>
                      </div>
                    )
                  ))}
                </div>
                <div className="clear-both" />
              </div>
            </div>
          );
        }

        // Variant: Three visuals (or fallback) - keep the original 3-up display
        return (
            <div className="space-y-8">
                {/* Visual Bar - Fixed size and aspect ratio adjustment */}
                <div className="flex overflow-x-auto space-x-4 pb-4">
                    {slots.map((project: any, index: number) => (
                        <div 
                            key={index} 
                            className="flex-shrink-0 w-80 aspect-[4/3] rounded-lg shadow-lg border border-gray-300 relative overflow-hidden group"
                        >
                            {project && project.images?.[0] ? (
                              <img 
                                src={project.images[0]} 
                                alt={`Project ${index + 1} Visual`} 
                                className="w-full h-full object-cover rounded-lg transition duration-300 group-hover:scale-105 cursor-pointer"
                                onClick={() => project.images[0] && setLightboxSrc(project.images[0])}
                                onError={(e: any) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x450/6b7280/ffffff?text=Visual+Error"; }}
                              />
                            ) : (
                                <div className="p-4 w-full h-full bg-gray-100 flex flex-col items-center justify-center text-center">
                                    <AlertTriangle size={32} className="text-orange-500 mb-2" />
                                    <p className="text-sm font-semibold text-gray-700">{getLayout2Filler(index).title}</p>
                                    <p className="text-xs text-gray-500 mt-1">{getLayout2Filler(index).description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Project Descriptions Below (3 column grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {slots.map((proj: any, index: number) => {
                        const filler = getLayout2Filler(index);
                        return (
                            <div key={index} className="p-4 bg-white rounded-xl shadow-md border-t-2 border-[#4f46e5]">
                                {proj ? (
                                    <>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{proj.project_title || proj.name}</h3>
                                        <p className="text-sm text-gray-600 text-justify" style={{ textAlign: 'justify' }}>{proj.description || proj.summary_point_1}</p>
                                    </>
                                ) : (
                                    <div className="text-center p-3 bg-gray-50 rounded">
                                        <h3 className="text-lg font-bold text-gray-700 mb-1">{filler.title}</h3>
                                        <p className="text-xs text-gray-500">{filler.description}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- Default Layout 1 (Standard Blog/Vertical List) ---
    return (
        <div className="space-y-4">
             {/* Wide Summary at Top (Already placed in header by previous change, removed here to avoid duplication) */}
            {renderProjects(projectsSource)}
        </div>
    );
  }


  return (
    <div
      dir={dir}
      className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#223a34_0%,transparent_45%),linear-gradient(180deg,#0b1413_0%,#0f1c1a_50%,#141a17_100%)] text-[#f4efe6]"
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <header style={headerStyle} className="relative overflow-hidden rounded-[28px] border border-[#2e403a] p-8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.8)]">
          <div className="absolute left-0 top-0 h-[3px] w-full bg-[linear-gradient(90deg,#ce1126_0%,#ce1126_33%,#000000_33%,#000000_66%,#007a3d_66%,#007a3d_100%)]" />
          <div className={`flex flex-col gap-6 ${align}`}>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#d9b88c]">{t('sample.portfolio_kicker','Maker Portfolio')}</p>
              <h1 className="font-display mt-3 text-3xl text-[#f7f1e7] sm:text-4xl">
                {(intake as any).userName || generated?.professional_headline || t('sample.portfolio_title','The Maker Portfolio')}
              </h1>
              <p className="mt-2 text-sm text-[#cfc8be]">
                {(intake?.major ? intake.major : '')}{(intake?.major && intake?.college) ? ' @ ' : ''}{(intake?.college ? intake.college : '')}
              </p>
              {intake?.degree_level ? (
                <span className="mt-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white">
                  {intake.degree_level}
                </span>
              ) : null}
            </div>
            <div className="max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#f0e9dd]">
              <p style={{ textAlign: 'justify' }}>{descriptionText}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  try {
                    const parts = (pathname || '').split('/').filter(Boolean);
                    const slug = parts[1] || 'mock-id-123';
                    router.push(`/profile/${slug}`);
                  } catch (e) {
                    router.push('/profile/mock-id-123');
                  }
                }}
                className="rounded-full border border-[#e3c89a] px-4 py-2 text-sm text-[#f7f1e7] hover:bg-[#1a2a26]"
              >
                {t('sample.edit_portfolio','Edit Intake')}
              </button>
              {resumeHref && (
                <a href={resumeHref} target="_blank" rel="noreferrer" download className="rounded-full bg-[#ce1126] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e32636]">
                  <span className="inline-flex items-center">
                    <Download size={16} className="mr-2" />
                    {t('sample.download_resume','Resume')}
                  </span>
                </a>
              )}
            </div>
          </div>
        </header>

        <main className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-[#2e403a] bg-[#111f1c]/90 p-6">
              <h4 className="text-sm font-semibold text-[#d9b88c]">{t("portfolio.ai_title", "AI Portfolio Editor")}</h4>
              <p className="mt-2 text-xs text-[#9ca3af]">{t("portfolio.ai_subtitle", "Describe the change and we will update your portfolio safely.")}</p>
              <div className="mt-4 space-y-3">
                <label className="text-xs uppercase tracking-[0.25em] text-[#bda985]">
                  {t("portfolio.ai_target", "Target")}
                  <select
                    value={aiTarget}
                    onChange={(e) => setAiTarget(e.target.value as any)}
                    className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-3 py-2 text-sm text-[#f7f1e7]"
                  >
                    <option value="resume">{t("portfolio.ai_target_resume", "Resume")}</option>
                    <option value="projects">{t("portfolio.ai_target_projects", "Projects")}</option>
                    <option value="skills">{t("portfolio.ai_target_skills", "Skills")}</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.25em] text-[#bda985]">
                  {t("portfolio.ai_path", "Path")}
                  <input
                    value={aiPath}
                    onChange={(e) => setAiPath(e.target.value)}
                    placeholder={t("portfolio.ai_path_placeholder", "e.g. summary or projects.0.description")}
                    className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-3 py-2 text-sm text-[#f7f1e7] placeholder:text-[#8b8a86]"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.25em] text-[#bda985]">
                  {t("portfolio.ai_prompt", "Prompt")}
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={t("portfolio.ai_prompt_placeholder", "Make this more impact-driven")}
                    className="mt-2 h-24 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-3 py-2 text-sm text-[#f7f1e7] placeholder:text-[#8b8a86]"
                  />
                </label>
                {aiStatus && <p className="text-xs text-[#f0a37f]">{aiStatus}</p>}
                <button
                  onClick={async () => {
                    setAiStatus(null);
                    setAiLoading(true);
                    try {
                      const { data: sessionData } = await supabase.auth.getSession();
                      const token = sessionData?.session?.access_token || "";
                      const res = await fetch("/api/portfolio/ai-edit", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({ prompt: aiPrompt, target: aiTarget, path: aiPath }),
                      });
                      const json = await res.json();
                      if (!res.ok) {
                        setAiStatus(json?.error || "AI edit failed.");
                      } else if (json?.data) {
                        setIntake(json.data);
                        setAiStatus(null);
                      }
                    } catch (err: any) {
                      setAiStatus(err?.message || "AI edit failed.");
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  className="w-full rounded-full bg-[#ce1126] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e32636] disabled:opacity-60"
                  disabled={aiLoading || !aiPrompt.trim()}
                >
                  {aiLoading ? t("portfolio.ai_applying", "Applying...") : t("portfolio.ai_apply", "Apply AI Edit")}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-[#2e403a] bg-[#111f1c]/90 p-6">
              <div className="mb-5 border-b border-[#1f2b27] pb-4">
                <h4 className="text-sm font-semibold text-[#d9b88c] flex items-center">
                  <Globe size={16} className="mr-2" /> {t('sample.languages','Languages')}
                </h4>
                <p className="mt-2 text-sm text-[#cfc8be]">
                  {(intake.languages && intake.languages.length) ? intake.languages.join(', ') : t('sample.no_languages','N/A')}
                </p>
              </div>

              <div className="mb-5 border-b border-[#1f2b27] pb-4">
                <h4 className="text-sm font-semibold text-[#d9b88c] flex items-center">
                  <CheckCircle size={16} className="mr-2 text-[#007a3d]" /> {t('sample.skills','Core Skills')}
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(intake.skills || []).map(s => (
                    <span key={s} className="rounded-full border border-[#2e403a] bg-[#172421] px-3 py-1 text-xs text-[#e8dcc5]">{s}</span>
                  ))}
                </div>
              </div>

              {intake.certifications && intake.certifications.length > 0 && (
                <div className="mb-5 border-b border-[#1f2b27] pb-4">
                  <h4 className="text-sm font-semibold text-[#d9b88c] flex items-center">
                    <Zap size={16} className="mr-2 text-[#f0a37f]" /> {t('sample.certs','Certifications')}
                  </h4>
                  <div className="mt-2 text-sm text-[#cfc8be]">
                    {intake.certifications.map(c => <div key={c}>{c}</div>)}
                  </div>
                </div>
              )}

              {resumeHref && (
                <div className="pt-4">
                  <h4 className="text-sm font-semibold text-[#d9b88c] flex items-center">
                    <FileText size={16} className="mr-2 text-[#ce1126]" /> {t('sample.resume_title','Resume Document')}
                  </h4>
                  <div className="mt-3 rounded-xl border border-[#2e403a] bg-[#0f1a17] p-3">
                    <button
                      type="button"
                      onClick={() => setResumeFullScreen(true)}
                      className="flex w-full flex-col items-center gap-3"
                    >
                      {resumeThumb ? (
                        <img
                          src={resumeThumb}
                          alt="Resume thumbnail"
                          className="max-h-64 w-full rounded-lg object-contain"
                          title={t('sample.click_to_expand','Click to expand')}
                        />
                      ) : (
                        <div className="flex h-40 w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#2e403a] text-[#9ca3af]">
                          <Loader2 size={28} className="animate-spin" />
                          <div className="mt-2 text-xs">{t('sample.loading_preview','Loading PDF Preview...')}</div>
                        </div>
                      )}
                      <span className="text-xs font-semibold text-[#d9b88c]">
                        <Maximize2 size={14} className="mr-2 inline-block" />
                        {t('sample.expand_view','Click to View Full Resume')}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section className="lg:col-span-8">
            <div className="rounded-2xl border border-[#2e403a] bg-[#111f1c]/90 p-6">
              <div className={`flex flex-col gap-2 ${align}`}>
                <h3 className="font-display text-2xl text-[#f7f1e7]">{t('sample.projects','Projects Showcase')}</h3>
                <p className="text-sm text-[#cfc8be]">
                  {generated ? t('sample.star_summary_note','Highlights optimized by AI for professional impact.') : t('sample.raw_data_note','Displaying raw data from intake form.')}
                </p>
              </div>
              <div className="mt-6">
                {renderPortfolioLayout()}
              </div>
            </div>
          </section>
        </main>

        {resumeFullScreen && resumeHref && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col p-4 sm:p-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {t('sample.resume_fullscreen_title','Full Resume View')}
              </h3>
              <button
                onClick={() => setResumeFullScreen(false)}
                className="px-3 py-1 rounded bg-white text-gray-800 flex items-center hover:bg-gray-200"
              >
                <Minimize2 size={16} className="mr-1" /> {t('sample.close','Close')}
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={resumeHref}
                className="w-full h-full bg-white rounded-lg shadow-2xl"
                title={t('sample.resume_doc','Resume Document')}
              />
            </div>
          </div>
        )}

        {lightboxSrc && (
          <div
            className={`fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 transition-opacity duration-200 ${lightboxActive ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setLightboxSrc(null)}
            aria-hidden={lightboxActive ? 'false' : 'true'}
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label={t('sample.enlarged_visual','Enlarged visual')}
              className={`relative max-w-5xl w-full transform transition-all duration-200 ease-out ${lightboxActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                ref={closeBtnRef}
                onClick={() => setLightboxSrc(null)}
                className="absolute top-2 right-2 z-50 p-2 rounded bg-white/90 shadow"
                aria-label={t('sample.close','Close')}
              >
                <X size={20} />
              </button>
              <img
                src={lightboxSrc}
                alt={t('sample.enlarged_visual','Enlarged visual')}
                className="max-h-[80vh] w-auto mx-auto rounded shadow-lg block"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
