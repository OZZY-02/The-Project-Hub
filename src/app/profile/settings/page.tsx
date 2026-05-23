"use client";

import React, { useEffect, useState } from 'react';
import supabase from '../../../lib/supabaseClient';
import { useTranslation } from '../../../lib/i18n';
import { useTheme } from '../../../lib/theme';
import { Camera, Check, ChevronRight, Lock, MapPin, Sparkles, User } from 'lucide-react';

export default function ProfileSettingsPage() {
  const { t, locale } = useTranslation();
  const { theme } = useTheme();
  const [user, setUser] = useState<any | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [locationCountry, setLocationCountry] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [majorField, setMajorField] = useState('');
  const [passionSector, setPassionSector] = useState('');
  const [isMentor, setIsMentor] = useState(false);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const align = locale === 'ar' ? 'text-right' : 'text-left';
  const isLight = theme === 'light';

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const current = u?.user || null;
      setUser(current);
      setEmail(current?.email || '');
      if (current) {
        const { data: profile } = await supabase.from('profiles')
          .select('first_name,last_name,username,avatar_data_url,location_country,location_city,major_field,passion_sector,is_mentor,bio')
          .eq('id', current.id).single();
        if (profile) {
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
          setUsername(profile.username || '');
          setAvatarDataUrl(profile.avatar_data_url || null);
          setAvatarPreview(profile.avatar_data_url || null);
          setLocationCountry(profile.location_country || '');
          setLocationCity(profile.location_city || '');
          setMajorField(profile.major_field || '');
          setPassionSector(profile.passion_sector || '');
          setIsMentor(Boolean(profile.is_mentor));
          setBio(profile.bio || '');
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!avatarFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string | null;
      if (result) { setAvatarPreview(result); setAvatarDataUrl(result); }
    };
    reader.readAsDataURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/locations');
        const json = await res.json();
        if (!mounted) return;
        setCountryOptions(json.countries || []);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!locationCountry) { setCityOptions([]); return; }
      try {
        const res = await fetch(`/api/locations?country=${encodeURIComponent(locationCountry)}`);
        const json = await res.json();
        if (!mounted) return;
        setCityOptions(json.cities || []);
      } catch { setCityOptions([]); }
    })();
    return () => { mounted = false; };
  }, [locationCountry]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarFile(e.target.files?.[0] || null);
  };

  const handleUploadAvatar = async () => {
    if (!user || !avatarFile) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(avatarFile);
      });
      await supabase.from('profiles').upsert({ id: user.id, avatar_data_url: dataUrl });
      setAvatarDataUrl(dataUrl);
      setAvatarPreview(dataUrl);
      setAvatarFile(null);
      setMessage(t('profile.avatar_saved', 'Avatar saved.'));
      setIsError(false);
    } catch (err: any) {
      setMessage(err?.message || 'Failed to save avatar');
      setIsError(true);
    } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setMessage('Not signed in'); setIsError(true); return; }
    setLoading(true);
    setMessage(null);
    setIsError(false);
    try {
      if (username && username.trim().length > 0) {
        const uname = username.trim();
        const { data: existing } = await supabase.from('profiles').select('id').ilike('username', uname);
        if (existing && existing.length > 0) {
          const conflict = existing.find((r: any) => r.id !== user.id);
          if (conflict) {
            setMessage(t('profile.username_taken', 'Username already taken. Please choose another.'));
            setIsError(true);
            setLoading(false);
            return;
          }
        }
      }
      await supabase.from('profiles').upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        username: username || null,
        avatar_data_url: avatarDataUrl,
        location_country: locationCountry || null,
        location_city: locationCity || null,
        major_field: majorField || null,
        passion_sector: passionSector || null,
        is_mentor: isMentor,
        bio: bio || null,
      });
      if (password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }
      setMessage(t('profile.saved', 'Profile saved successfully.'));
      setIsError(false);
      try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('profile.saved', 'Profile saved.') } })); } catch {}
    } catch (err: any) {
      setMessage(err?.message || 'Failed to save settings');
      setIsError(true);
    } finally { setLoading(false); }
  };

  // Shared style tokens matching homepage
  const shellClass = isLight
    ? 'home-shell home-shell-light min-h-screen text-slate-950'
    : 'home-shell home-shell-dark min-h-screen text-[#f5f7fb]';
  const titleClass = isLight ? 'text-slate-950' : 'text-white';
  const secondaryTextClass = isLight ? 'text-slate-600' : 'text-[#9eabc4]';
  const mutedClass = isLight ? 'text-slate-400' : 'text-[#6f7e9d]';
  const inputClass = isLight
    ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:border-[#2258d1] focus:outline-none text-sm'
    : 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f5f7fb] placeholder:text-[#6f7e9d] transition-colors duration-150 focus:border-[#8fb7ff] focus:outline-none text-sm';
  const cardClass = isLight
    ? 'rounded-3xl border border-slate-900/8 bg-white/90 shadow-[0_22px_70px_-52px_rgba(15,23,42,0.14)] backdrop-blur-xl overflow-hidden'
    : 'rounded-3xl border border-white/8 bg-white/[0.04] shadow-[0_28px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden';
  const sectionDivider = isLight ? 'border-t border-slate-100' : 'border-t border-white/6';
  const labelClass = isLight ? 'block text-sm font-medium text-slate-700' : 'block text-sm font-medium text-[#c8d4e8]';
  const hintClass = `mt-1.5 text-xs ${mutedClass}`;
  const kickerClass = 'text-xs font-semibold uppercase tracking-[0.22em] text-[#8fb7ff]';
  const saveBtnClass = isLight
    ? 'inline-flex min-w-[140px] items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:opacity-60'
    : 'inline-flex min-w-[140px] items-center justify-center gap-2 rounded-full bg-[#2258d1] text-white px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1a46ab] disabled:translate-y-0 disabled:opacity-60';

  if (!user) {
    return (
      <div dir={dir} className={shellClass}>
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <Lock size={40} className="mx-auto mb-4 text-[#8fb7ff]" />
          <h2 className={`font-display text-2xl ${titleClass}`}>{t('profile.title', 'Profile Settings')}</h2>
          <p className={`mt-3 text-sm ${secondaryTextClass}`}>{t('profile.please_sign_in', 'Please sign in to edit your profile settings.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={dir} className={shellClass}>
      <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-8">

        {/* Page header */}
        <div className={`mb-8 ${align}`}>
          <p className={kickerClass}>{t('profile.kicker', 'Your account')}</p>
          <h1 className={`font-display mt-3 text-3xl sm:text-4xl ${titleClass}`}>{t('profile.title', 'Profile Settings')}</h1>
          <p className={`mt-3 text-base ${secondaryTextClass}`}>
            {t('profile.intro', 'Keep your profile complete so the right people can find and connect with you.')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* Sidebar — avatar + account info */}
          <aside className="space-y-4">
            <div className={`${cardClass} p-6 text-center`}>
              <div className="relative mx-auto w-fit">
                <div className={`h-24 w-24 overflow-hidden rounded-full border-2 ${isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-white/5'}`}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Your profile avatar" className="h-full w-full object-cover" />
                    : <div className={`flex h-full w-full items-center justify-center text-2xl font-bold ${isLight ? 'text-slate-400' : 'text-[#8fb7ff]'}`}>
                        {(firstName || email || '?')[0].toUpperCase()}
                      </div>
                  }
                </div>
                <label
                  htmlFor="avatar-upload"
                  className={`absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors duration-150 ${isLight ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50' : 'border-white/10 bg-[#0d1a28] text-[#8fb7ff] hover:bg-[#142035]'}`}
                  aria-label="Change profile picture"
                >
                  <Camera size={14} aria-hidden="true" />
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleFile} className="sr-only" />
              </div>

              <div className="mt-4">
                <p className={`text-sm font-semibold ${titleClass}`}>
                  {firstName || lastName ? `${firstName} ${lastName}`.trim() : username || 'Your name'}
                </p>
                <p className={`mt-0.5 text-xs ${mutedClass}`}>{email}</p>
              </div>

              {avatarFile && (
                <div className="mt-4 flex justify-center gap-2">
                  <button type="button" onClick={handleUploadAvatar} disabled={loading}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-150 ${isLight ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-[#2258d1] text-white hover:bg-[#1a46ab]'}`}>
                    {loading ? 'Saving…' : 'Save photo'}
                  </button>
                  <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(avatarDataUrl); }}
                    className={`rounded-full border px-4 py-1.5 text-xs transition-colors duration-150 ${isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-[#9eabc4] hover:bg-white/5'}`}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Account info card */}
            <div className={`${cardClass} p-5`}>
              <p className={kickerClass}>{t('profile.account_label', 'Account')}</p>
              <div className={`mt-3 flex items-center gap-2 text-sm ${secondaryTextClass}`}>
                <span className="truncate">{email || '—'}</span>
              </div>
              {username && (
                <div className={`mt-2 text-xs ${mutedClass}`}>
                  @{username}
                </div>
              )}
            </div>
          </aside>

          {/* Main form */}
          <form onSubmit={handleSave} className="space-y-4">

            {/* Identity */}
            <div className={cardClass}>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-[#8fb7ff]" aria-hidden="true" />
                  <p className={kickerClass}>{t('profile.section_identity', 'Identity')}</p>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first-name" className={labelClass}>{t('profile.first_name', 'First name')}</label>
                    <input id="first-name" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" placeholder="Ahmed" className={`mt-2 ${inputClass}`} />
                  </div>
                  <div>
                    <label htmlFor="last-name" className={labelClass}>{t('profile.last_name', 'Last name')}</label>
                    <input id="last-name" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" placeholder="Mohamed" className={`mt-2 ${inputClass}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="username" className={labelClass}>{t('profile.username', 'Username')}</label>
                  <input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="your-username" autoComplete="username" className={`mt-2 ${inputClass}`} />
                  <p className={hintClass}>{t('profile.username_hint', 'Public URL handle — unique, case-insensitive.')}</p>
                </div>
              </div>
            </div>

            {/* Location & Focus */}
            <div className={cardClass}>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#8fb7ff]" aria-hidden="true" />
                  <p className={kickerClass}>{t('profile.section_location', 'Location & Focus')}</p>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="country" className={labelClass}>{t('profile.country', 'Country')}</label>
                    <input id="country" list="country-list" value={locationCountry} onChange={e => { setLocationCountry(e.target.value); setLocationCity(''); }} placeholder="e.g. Sudan, Egypt" autoComplete="country-name" className={`mt-2 ${inputClass}`} />
                    <datalist id="country-list">{countryOptions.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                  <div>
                    <label htmlFor="city" className={labelClass}>{t('profile.city', 'City')}</label>
                    <input id="city" list="city-list" value={locationCity} onChange={e => setLocationCity(e.target.value)} placeholder="e.g. Khartoum, Cairo" autoComplete="address-level2" className={`mt-2 ${inputClass}`} />
                    <datalist id="city-list">{cityOptions.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="major-field" className={labelClass}>{t('profile.major_field', 'Major / Field')}</label>
                    <input id="major-field" list="major-list" value={majorField} onChange={e => setMajorField(e.target.value)} placeholder="e.g. Computer Science" className={`mt-2 ${inputClass}`} />
                    <datalist id="major-list">
                      {['Mechanical Engineering','Software Engineering','Electrical Engineering','Civil Engineering','Computer Science','Information Technology','Marketing','Finance','Entrepreneurship','Biotechnology','Environmental Science','Architecture','Psychology','Economics','Communications','Graphic Design','Industrial Design','Data Science','Product Management'].map(v => <option key={v} value={v} />)}
                    </datalist>
                  </div>
                  <div>
                    <label htmlFor="passion-sector" className={labelClass}>{t('profile.passion_sector', 'Passion / Sector')}</label>
                    <input id="passion-sector" list="passion-list" value={passionSector} onChange={e => setPassionSector(e.target.value)} placeholder="e.g. Fintech, Robotics" className={`mt-2 ${inputClass}`} />
                    <datalist id="passion-list">
                      {['Education','Healthcare','Agriculture','Fintech','Design','Robotics','Electronics','Renewable Energy','Architecture','AI & Machine Learning','Social Impact'].map(v => <option key={v} value={v} />)}
                    </datalist>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio & Mentorship */}
            <div className={cardClass}>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#8fb7ff]" aria-hidden="true" />
                  <p className={kickerClass}>{t('profile.section_bio', 'Bio & Mentorship')}</p>
                </div>
                <div className="mt-5">
                  <label htmlFor="bio" className={labelClass}>{t('profile.short_bio', 'Short bio')}</label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder={t('profile.bio_placeholder', "What are you building? What skills do you bring? What are you looking for? (max 500 chars)")}
                    className={`mt-2 resize-none ${inputClass}`}
                  />
                  <p className={`mt-1 text-right text-xs ${mutedClass}`}>{bio.length}/500</p>
                </div>
                <label className={`mt-4 flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors duration-150 ${isLight ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-50' : 'border-white/8 bg-white/[0.03] hover:bg-white/5'}`}>
                  <input id="mentor" type="checkbox" checked={isMentor} onChange={e => setIsMentor(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#8fb7ff]" />
                  <div>
                    <span className={`block text-sm font-medium ${titleClass}`}>{t('Form.mentor_label', 'I am available as a mentor')}</span>
                    <span className={`mt-0.5 block text-xs ${mutedClass}`}>{t('Form.mentor_sublabel', "You'll appear in mentor discovery and be recommended to makers who need guidance.")}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Security */}
            <div className={cardClass}>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-[#8fb7ff]" aria-hidden="true" />
                  <p className={kickerClass}>{t('profile.section_security', 'Security')}</p>
                </div>
                <div className="mt-5">
                  <label htmlFor="new-password" className={labelClass}>{t('profile.new_password', 'New password')}</label>
                  <input id="new-password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" placeholder={t('profile.password_placeholder', 'Leave blank to keep current password')} className={`mt-2 ${inputClass}`} />
                </div>
              </div>
            </div>

            {/* Feedback + save */}
            {message && (
              <p role={isError ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm ${isError ? (isLight ? 'bg-red-50 text-red-700' : 'bg-[#2a1916] text-[#f0a37f]') : (isLight ? 'bg-green-50 text-green-700' : 'bg-[#0f2a1c] text-[#b9e7c9]')}`}>
                {!isError && <Check size={14} className="mr-2 inline" />}
                {message}
              </p>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={loading} className={saveBtnClass}>
                {loading ? t('Form.saving', 'Saving…') : (
                  <>
                    <Check size={15} aria-hidden="true" />
                    {t('profile.save_button', 'Save Settings')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
