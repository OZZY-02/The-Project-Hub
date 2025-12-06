'use client';

import React, { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient'; 
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Briefcase, Zap, Globe, Cpu, Loader2, ArrowRight } from 'lucide-react'; 

// --- 1. TYPE DEFINITIONS ---
interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    location_city: string;
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

// --- Helper Functions ---

// Helper for rendering bilingual content
const getBilingualText = (enText: string | null, arText: string | null, language: 'en' | 'ar', fallback: string = "") => {
    if (language === 'ar' && arText) return arText;
    if (enText) return enText;
    return fallback;
};

// Helper for rendering translated labels
const t = (key: string, language: 'en' | 'ar') => {
    const translations: Record<string, Record<string, string>> = {
        'en': { 
            'about': 'Short Summary', 
            'skills': 'Technical Skills', 
            'projects': 'Featured Projects', 
            'role': 'Role:', 
            'team_project': 'Team Project',
            'major': 'College Major:',
            'view_case_study': 'View Case Study',
        },
        'ar': { 
            'about': 'ملخص قصير', 
            'skills': 'المهارات التقنية', 
            'projects': 'المشاريع المميزة', 
            'role': 'الدور:', 
            'team_project': 'مشروع جماعي',
            'major': 'التخصص الجامعي:',
            'view_case_study': 'عرض دراسة الحالة',
        }
    };
    return translations[language][key] || key;
};

// --- LAYOUT COMPONENTS ---

interface LayoutProps {
    profile: Profile;
    skills: Skill[];
    projects: Project[];
    language: 'en' | 'ar';
}

// Layout 1: Alternating Project/Image (Zigzag)
const PortfolioLayout1: React.FC<LayoutProps> = ({ profile, skills, projects, language }) => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    const align = language === 'ar' ? 'text-right' : 'text-left';

    return (
        <>
            {/* TOP SECTION (Major, Skills, Summary) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                
                {/* Column 1: Major & Location */}
                <div className="md:col-span-1 space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                    <div className='flex items-center space-x-2'>
                        <img 
                            src="https://placehold.co/60x60/4f46e5/ffffff?text=AM" 
                            alt="Profile Avatar" 
                            className="rounded-full w-14 h-14 object-cover border-2 border-white shadow-md"
                        />
                        <div className='flex flex-col'>
                            <h1 className="text-xl font-extrabold text-[#1e40af]">{profile.first_name} {profile.last_name}</h1>
                            <p className="text-sm text-gray-700 font-medium flex items-center">
                                <MapPin size={14} className="mr-1" />
                                {profile.location_city}
                            </p>
                        </div>
                    </div>

                    <div className={`text-md ${align}`}>
                        <p className="font-semibold text-gray-800 flex items-center">
                            <Briefcase size={16} className={`ms-1 rtl:me-1 text-[#4f46e5]`} />
                            {t('major', language)}
                        </p>
                        <span className="text-gray-600 font-medium ms-5 rtl:me-5">{profile.major_field}</span>
                    </div>
                </div>

                {/* Column 2 & 3: Short Summary & Skills */}
                <div className="md:col-span-2 space-y-4">
                    {/* Short Summary */}
                    <div className={`p-4 rounded-xl shadow-md border-b-2 border-gray-300 ${align}`}>
                        <h2 className={`text-xl font-bold text-gray-800 mb-2`}>{t('about', language)}</h2>
                        <p className="text-gray-600 leading-relaxed text-base">
                            {profile.bio}
                        </p>
                        {profile.is_mentor && <span className="mt-3 inline-block text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium shadow-sm">Verified Mentor</span>}
                    </div>

                    {/* Skills Box */}
                    <div className={`p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-inner ${align}`}>
                        <h3 className={`text-lg font-bold text-[#1e40af] mb-2 flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <Cpu size={18} className={`ms-2 rtl:me-2`} />
                            {t('skills', language)}
                        </h3>
                        <div className={`flex flex-wrap gap-2 mt-2 ${language === 'ar' ? 'justify-end' : ''}`}>
                            {skills.map((skill, index) => (
                                <span 
                                    key={index} 
                                    className="bg-[#e0e7ff] text-[#1e40af] text-sm font-medium px-3 py-1 rounded-full shadow-sm"
                                >
                                    {skill.skill_name} ({skill.proficiency_level}/5)
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* PROJECTS SECTION (Alternating Layout) */}
            <section>
                <h2 className="text-3xl font-bold text-gray-800 mb-10 text-center border-b pb-4">
                    {t('projects', language)}
                </h2>
                
                {projects.map((project, index) => {
                    const isImageLeft = index % 2 === 0;
                    const directionClass = (isImageLeft && dir === 'ltr') || (!isImageLeft && dir === 'rtl') 
                        ? 'md:flex-row' 
                        : 'md:flex-row-reverse';
                    
                    return (
                        <div 
                            key={index} 
                            className={`flex flex-col ${directionClass} gap-8 mb-16 p-6 bg-white border border-gray-200 rounded-xl shadow-lg transition duration-300 hover:shadow-xl`}
                        >
                            {/* Project Image */}
                            <div className="md:w-1/2 w-full flex-shrink-0">
                                <img 
                                    src={project.image_url} 
                                    alt={getBilingualText(project.project_title_en, project.project_title_ar, language, "Project Image")} 
                                    className="w-full h-auto object-cover rounded-lg shadow-md"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://placehold.co/800x600/6b7280/ffffff?text=Image+Not+Available"; }}
                                />
                            </div>

                            {/* Project Description */}
                            <div className={`md:w-1/2 w-full ${align}`}>
                                <h3 className="text-3xl font-extrabold text-gray-900 mb-3">
                                    {getBilingualText(project.project_title_en, project.project_title_ar, language, "Project Title")}
                                </h3>
                                <p className={`text-sm text-[#4f46e5] font-semibold mb-3`}>
                                    {t('role', language)} {project.user_role}
                                    {project.is_team_project && <span className={`ms-2 rtl:me-2 text-gray-500 font-normal`}>({t('team_project', language)})</span>}
                                </p>
                                <p className="text-gray-700 leading-relaxed">
                                    {getBilingualText(project.description_en, project.description_ar, language, "Project Description")}
                                </p>
                                
                                <button className="mt-4 text-[#1e40af] hover:text-[#3730a3] font-medium text-sm flex items-center">
                                    {t('view_case_study', language)}
                                    <ArrowRight size={16} className={`ms-1 rtl:me-1`} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                
                {projects.length === 0 && (
                    <p className={`text-gray-500 italic p-6 border rounded-lg ${align}`}>{language === 'en' ? 'No projects submitted yet.' : 'لم يتم تقديم أي مشاريع بعد.'}</p>
                )}
            </section>
        </>
    );
};

// Layout 2: Horizontal Image Bar with Descriptions Below
const PortfolioLayout2: React.FC<LayoutProps> = ({ profile, skills, projects, language }) => {
    const align = language === 'ar' ? 'text-right' : 'text-left';

    return (
        <div className="space-y-10">
            {/* TOP BAR: College, Major, Skills */}
            <header className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">{t('major', language)}</h3>
                    <p className="text-gray-600">{profile.major_field}</p>
                </div>
                <div className="col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">{t('skills', language)}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map((skill, index) => (
                            <span key={index} className="bg-purple-100 text-purple-700 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                                {skill.skill_name}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            {/* PROJECTS VISUALS (Horizontal Bar) */}
            <section>
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-3">
                    {t('projects', language)}
                </h2>
                <div className="flex overflow-x-auto space-x-4 pb-4">
                    {projects.map((project, index) => (
                        <div key={index} className="flex-shrink-0 w-64 h-48 rounded-lg shadow-lg border border-gray-300">
                            <img 
                                src={project.image_url} 
                                alt={`Project ${index + 1} Visual`} 
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://placehold.co/600x480/6b7280/ffffff?text=Visual"; }}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* PROJECT DESCRIPTIONS (Below Visuals) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.slice(0, 3).map((project, index) => (
                    <div key={index} className="p-4 bg-white rounded-xl shadow-md border-t-2 border-[#4f46e5]">
                        <h3 className={`text-xl font-bold text-gray-900 mb-2 ${align}`}>
                            {getBilingualText(project.project_title_en, project.project_title_ar, language, `Project ${index + 1}`)}
                        </h3>
                        <p className={`text-sm text-gray-600 ${align}`}>
                            {getBilingualText(project.description_en, project.description_ar, language, "Description")}
                        </p>
                    </div>
                ))}
            </section>

            {/* SHORT SUMMARY (Wide at the Bottom) */}
            <section className="p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-inner">
                <h3 className={`text-xl font-bold text-blue-900 mb-2 ${align}`}>{t('about', language)}</h3>
                <p className={`text-gray-700 leading-relaxed ${align}`}>{profile.bio}</p>
            </section>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function MakerProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const profileId = params.id;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState<'en' | 'ar'>('en'); 
    
    // Fetch profile data from Supabase or use mock data
    const fetchProfileData = async () => {
        setLoading(true);
        
        try {
            // Try to fetch from Supabase
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();

            if (profileData && !profileError) {
                // Map Supabase data to Profile interface
                const mappedProfile: Profile = {
                    id: profileData.id,
                    first_name: profileData.first_name || '',
                    last_name: profileData.last_name || '',
                    location_city: profileData.location_city || profileData.location_country || '',
                    major_field: profileData.major_field || '',
                    passion_sector: profileData.passion_sector || '',
                    is_mentor: profileData.is_mentor || false,
                    bio: profileData.bio || '',
                    template_id: profileData.template_id || 'layout-1',
                };
                
                setProfile(mappedProfile);
                
                // TODO: Fetch skills and projects from related tables when available
                // For now, use empty arrays or mock data
                setSkills([]);
                setProjects([]);
                setLoading(false);
                return;
            }
        } catch (err) {
            console.warn('Failed to fetch from Supabase, using mock data', err);
        }
        
        // Fallback to mock data for demo/testing
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        const baseProfile: Omit<Profile, 'template_id'> = {
            id: profileId,
            first_name: 'Ahmed',
            last_name: 'Mohamed',
            location_city: 'Cairo, Maadi',
            major_field: 'Electrical Engineering',
            passion_sector: 'Renewable Energy',
            is_mentor: true,
            bio: 'Sudanese electrical engineer dedicated to developing affordable solar solutions for communities across the region. My goal is to leverage sustainable technology to bring accessible power to marginalized areas, focusing on practical and scalable prototypes.',
        };
        const mockSkills: Skill[] = [
            { skill_name: 'Python', proficiency_level: 4 },
            { skill_name: 'AutoCAD', proficiency_level: 5 },
            { skill_name: 'Project Mgmt', proficiency_level: 3 },
            { skill_name: 'Solar Modeling', proficiency_level: 4 },
        ];
        const mockProjects: Project[] = [
            {
                project_title_en: 'Low-Cost Solar Water Pump',
                project_title_ar: 'مضخة مياه شمسية منخفضة التكلفة',
                description_en: 'Designed and prototyped a solar-powered water pump system intended for small agricultural use, reducing reliance on expensive diesel generators and minimizing environmental impact.',
                description_ar: 'تصميم نموذج أولي لنظام مضخة مياه تعمل بالطاقة الشمسية مخصص للاستخدام الزراعي الصغير.',
                user_role: 'Lead Designer & Engineer',
                is_team_project: true,
                image_url: "https://placehold.co/800x600/10b981/ffffff?text=Project+1"
            },
            {
                project_title_en: 'Maadi Community Energy Audit',
                project_title_ar: 'تدقيق الطاقة لمجتمع المعادي',
                description_en: 'Conducted a deep-dive analysis of energy consumption in a local Cairo neighborhood to propose efficiency improvements.',
                description_ar: 'إجراء تحليل متعمق لاستهلاك الطاقة في حي محلي بالقاهرة لاقتراح تحسينات في الكفاءة.',
                user_role: 'Researcher & Analyst',
                is_team_project: false,
                image_url: "https://placehold.co/800x600/f59e0b/000000?text=Project+2"
            }
        ];

        // Determine template based on profile ID for demo
        const template = (profileId === 'layout-2') ? 'layout-2' : 'layout-1'; 
        
        setProfile({ ...baseProfile, template_id: template });
        setSkills(mockSkills);
        setProjects(mockProjects);
        setLoading(false);
    };

    useEffect(() => {
        if (profileId) {
            fetchProfileData();
        }
    }, [profileId]);


    // --- Loading and Error States ---
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <Loader2 className="animate-spin h-8 w-8 text-[#1e40af]" />
                <p className="ml-3 text-gray-600">Loading maker profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center p-10 bg-gray-50 min-h-screen">
                <h1 className="text-2xl font-bold text-red-600">Profile Not Found</h1>
                <button 
                    onClick={() => router.push('/')} 
                    className="mt-4 text-sm text-[#1e40af] hover:underline flex items-center justify-center mx-auto"
                >
                    <ArrowLeft size={16} className="mr-1" /> Go to Hub Home
                </button>
            </div>
        );
    }

    const dir = language === 'ar' ? 'rtl' : 'ltr';

    // Conditional Layout Rendering
    const renderPortfolioLayout = () => {
        const layoutProps = { profile, skills, projects, language };
        
        if (profile.template_id === 'layout-2') {
            return <PortfolioLayout2 {...layoutProps} />;
        }
        return <PortfolioLayout1 {...layoutProps} />;
    };


    return (
        <div dir={dir} className="min-h-screen bg-gray-100 font-sans p-4 sm:p-10">
            {/* Language Switcher */}
            <div className={`flex w-full max-w-5xl mx-auto mb-6 ${language === 'ar' ? 'justify-start' : 'justify-end'}`}>
                <button 
                    onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                    className="flex items-center space-x-2 bg-white text-[#1e40af] border border-gray-300 py-2 px-4 rounded-full text-sm font-medium hover:bg-gray-200 transition shadow-sm"
                >
                    <Globe size={18} className={`${language === 'ar' ? 'order-2 ml-2' : 'order-1 mr-2'}`} />
                    <span className='order-1'>{language === 'en' ? 'العربية' : 'English'}</span>
                </button>
            </div>

            {/* Main Portfolio Container */}
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-10 border-t-8 border-[#1e40af]">
                {renderPortfolioLayout()}
            </div>
            
            <footer className="mt-10 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} The Project Hub. All Rights Reserved.
            </footer>
        </div>
    );
}
