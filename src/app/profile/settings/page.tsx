"use client";

import React, { useEffect, useState } from 'react';
import supabase from '../../../lib/supabaseClient';
import { useTranslation } from '../../../lib/i18n';

export default function ProfileSettingsPage() {
    const { t, locale } = useTranslation();
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
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    const align = locale === 'ar' ? 'text-right' : 'text-left';
    const flow = locale === 'ar' ? 'lg:flex-row-reverse' : 'lg:flex-row';

    useEffect(() => {
        (async () => {
            const { data: u } = await supabase.auth.getUser();
            const current = u?.user || null;
            setUser(current);
            setEmail(current?.email || '');

            if (current) {
                // try to load profile row if exists
                const { data: profile } = await supabase.from('profiles').select('first_name,last_name,username,avatar_data_url,location_country,location_city,major_field,passion_sector,is_mentor,bio').eq('id', current.id).single();
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
            if (result) {
                setAvatarPreview(result);
                setAvatarDataUrl(result);
            }
        };
        reader.readAsDataURL(avatarFile);
    }, [avatarFile]);

    useEffect(() => {
        // fetch country list from server API
        let mounted = true;
        (async () => {
            try {
                const res = await fetch('/api/locations');
                const json = await res.json();
                if (!mounted) return;
                const names: string[] = json.countries || [];
                setCountryOptions(names);
            } catch (err) {
                console.warn('Failed to fetch countries', err);
            }
        })();

        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        // fetch cities for selected country
        let mounted = true;
        (async () => {
            if (!locationCountry) {
                setCityOptions([]);
                return;
            }

            try {
                const res = await fetch(`/api/locations?country=${encodeURIComponent(locationCountry)}`);
                const json = await res.json();
                if (!mounted) return;
                const list: string[] = json.cities || [];
                setCityOptions(list);
            } catch (err) {
                console.warn('Failed to fetch cities for', locationCountry, err);
                setCityOptions([]);
            }
        })();

        return () => { mounted = false; };
    }, [locationCountry]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setAvatarFile(f);
    };

    const handleUploadAvatar = async () => {
        if (!user || !avatarFile) return null;
        setLoading(true);
        setMessage(null);
        setIsError(false);
        try {
            // read file as data URL and upsert into profiles.avatar_data_url
            const reader = new FileReader();
            const dataUrl: string = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(avatarFile);
            });

            await supabase.from('profiles').upsert({ id: user.id, avatar_data_url: dataUrl });
            setAvatarDataUrl(dataUrl);
            setAvatarPreview(dataUrl);
            setMessage(t('profile.avatar_saved', 'Avatar saved in profile.'));
        } catch (err: any) {
            console.error('Upload error', err);
            setMessage(err?.message || t('profile.avatar_save_error', 'Failed to save avatar to profile'));
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setMessage(t('profile.not_signed_in', 'Not signed in'));
            setIsError(true);
            return;
        }
        setLoading(true);
        setMessage(null);
        setIsError(false);
        try {
            // update profile row (store avatar as data URL)
            // if username provided, verify uniqueness
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

            // update password if provided
            if (password) {
                const { error } = await supabase.auth.updateUser({ password });
                if (error) throw error;
            }

            setMessage(t('profile.saved', 'Profile settings saved.'));
            try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: t('profile.saved', 'Profile settings saved.') } })); } catch (e) {}
        } catch (err: any) {
            console.error('Save error', err);
            setMessage(err?.message || t('profile.save_error', 'Failed to save settings'));
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div dir={dir} className="min-h-screen bg-[#0b1413] p-6 text-[#f4efe6]">
                <h2 className={`font-display text-2xl ${align}`}>{t('profile.title','Profile Settings')}</h2>
                <p className={`mt-3 text-sm text-[#cfc8be] ${align}`}>{t('profile.please_sign_in','Please sign in to edit your profile settings.')}</p>
            </div>
        );
    }

    return (
        <div
            dir={dir}
            className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,#223a34_0%,transparent_45%),linear-gradient(180deg,#0b1413_0%,#0f1c1a_50%,#141a17_100%)] text-[#f4efe6]"
        >
            <main className={`mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 ${flow}`}>
                <section className={`flex-1 ${align}`}>
                    <p className="text-xs uppercase tracking-[0.35em] text-[#d9b88c]">{t('profile.kicker', 'Maker profile')}</p>
                    <h2 className="font-display mt-4 text-3xl text-[#f7f1e7]">{t('profile.title','Profile Settings')}</h2>
                    <p className="mt-3 text-sm text-[#cfc8be]">{t('profile.intro', 'Share your name, location, and focus so people can find and collaborate with you.')}</p>

                    <div className="mt-8 rounded-2xl border border-[#2e403a] bg-[#111f1c] p-5">
                        <p className="text-xs uppercase tracking-[0.25em] text-[#bda985]">{t('profile.account_label','Account')}</p>
                        <p className="mt-3 text-sm text-[#d6d0c6]">
                            {t('profile.email','Email')}: <span className="font-medium">{email || '—'}</span>
                        </p>
                    </div>
                </section>

                <section className="flex-1">
                    <form onSubmit={handleSave} className="space-y-6 rounded-3xl border border-[#2e403a] bg-[#111f1c]/90 p-8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.8)]">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="text-sm text-[#e8dcc5]">
                                {t('profile.first_name','First name')}
                                <input value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                            </label>
                            <label className="text-sm text-[#e8dcc5]">
                                {t('profile.last_name','Last name')}
                                <input value={lastName} onChange={e => setLastName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm text-[#e8dcc5]">{t('profile.username','Username')}</label>
                            <input value={username} onChange={e => setUsername(e.target.value)} placeholder={t('profile.username_placeholder','your-username')} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                            <p className="mt-2 text-xs text-[#9ca3af]">{t('profile.username_hint','Your public username (unique, case-insensitive).')}</p>
                        </div>

                        <div>
                            <label className="block text-sm text-[#e8dcc5]">{t('profile.new_password','New password')}</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('profile.password_placeholder','Leave blank to keep current')} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm text-[#e8dcc5]">{t('profile.country','Country')}</label>
                                <input list="country-list" value={locationCountry} onChange={e => { setLocationCountry(e.target.value); setLocationCity(''); }} placeholder={t('profile.country_placeholder', 'Start typing your country')} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                                <datalist id="country-list">
                                    {countryOptions.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm text-[#e8dcc5]">{t('profile.city','City')}</label>
                                <input list="city-list" value={locationCity} onChange={e => setLocationCity(e.target.value)} placeholder={t('profile.city_placeholder', 'Start typing your city')} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                                <datalist id="city-list">
                                    {cityOptions.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm text-[#e8dcc5]">{t('profile.major_field','Major / Field')}</label>
                                <input list="major-list" value={majorField} onChange={e => setMajorField(e.target.value)} placeholder={t('profile.major_placeholder', 'Start typing your major')} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                                <datalist id="major-list">
                                    <option value="Mechanical Engineering" />
                                    <option value="Software Engineering" />
                                    <option value="Electrical Engineering" />
                                    <option value="Civil Engineering" />
                                    <option value="Computer Science" />
                                    <option value="Information Technology" />
                                    <option value="Marketing" />
                                    <option value="Finance" />
                                    <option value="Entrepreneurship" />
                                    <option value="Biotechnology" />
                                    <option value="Environmental Science" />
                                    <option value="Architecture" />
                                    <option value="Psychology" />
                                    <option value="Economics" />
                                    <option value="Communications" />
                                    <option value="Graphic Design" />
                                    <option value="Industrial Design" />
                                    <option value="Journalism" />
                                    <option value="Design" />
                                    <option value="Product Management" />
                                    <option value="Data Science" />
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm text-[#e8dcc5]">{t('profile.passion_sector','Passion / Sector')}</label>
                                <input list="passion-list" value={passionSector} onChange={e => setPassionSector(e.target.value)} placeholder={t('profile.passion_placeholder', 'Start typing your passion')} className="mt-2 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                                <datalist id="passion-list">
                                    <option value="Education" />
                                    <option value="Healthcare" />
                                    <option value="Agriculture" />
                                    <option value="Fintech" />
                                    <option value="Design" />
                                    <option value="Robotics" />
                                    <option value="Electronics" />
                                    <option value="Website Design" />
                                    <option value="Architecture" />
                                </datalist>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 text-sm text-[#e8dcc5]">
                            <input id="mentor" type="checkbox" checked={isMentor} onChange={e => setIsMentor(e.target.checked)} className="h-4 w-4 rounded border-[#2b3a35] bg-[#0f1a17]" />
                            {t('Form.mentor_label','I am available as a mentor')}
                        </label>

                        <div>
                            <label className="block text-sm text-[#e8dcc5]">{t('profile.short_bio','Short bio')}</label>
                            <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} placeholder={t('profile.bio_placeholder','Short bio (max 500 chars)')} className="mt-2 h-28 w-full rounded-xl border border-[#2b3a35] bg-[#0f1a17] px-4 py-3 text-[#f7f1e7]" />
                        </div>

                        <div>
                            <label className="block text-sm text-[#e8dcc5]">{t('profile.profile_picture','Profile picture')}</label>
                            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="h-20 w-20 overflow-hidden rounded-full border border-[#2e403a] bg-[#0f1a17]">
                                    {avatarPreview ? <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-[#9ca3af]">{t('profile.no_avatar','No avatar')}</div>}
                                </div>
                                <div className="flex-1">
                                    <input type="file" accept="image/*" onChange={handleFile} className="text-sm text-[#cfc8be]" />
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button type="button" onClick={handleUploadAvatar} disabled={!avatarFile || loading} className="rounded-full bg-[#007a3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b8d49]">
                                            {t('profile.upload_button','Upload')}
                                        </button>
                                        <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(avatarDataUrl); }} className="rounded-full border border-[#2e403a] px-4 py-2 text-sm text-[#e8dcc5] hover:border-[#3a4a44] hover:text-[#f0d6a8]">
                                            {t('Form.cancel','Cancel')}
                                        </button>
                                    </div>
                                    {avatarDataUrl && <p className="mt-2 text-xs text-[#9ca3af]">{t('profile.avatar_saved','Avatar saved in profile.')}</p>}
                                </div>
                            </div>
                        </div>

                        {message && <p className={`text-sm ${isError ? 'text-[#f0a37f]' : 'text-[#b9e7c9]'}`}>{message}</p>}

                        <div className="flex justify-end">
                            <button type="submit" disabled={loading} className="rounded-full bg-[#ce1126] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e32636]">
                                {loading ? t('Form.saving','Saving...') : t('profile.save_button','Save Settings')}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
