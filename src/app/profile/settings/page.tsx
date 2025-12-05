"use client";

import React, { useEffect, useState } from 'react';
import supabase from '../../../lib/supabaseClient';

export default function ProfileSettingsPage() {
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
            setMessage('Avatar saved to profile.');
        } catch (err: any) {
            console.error('Upload error', err);
            setMessage(err?.message || 'Failed to save avatar to profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setMessage('Not signed in');
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            // update profile row (store avatar as data URL)
            // if username provided, verify uniqueness
            if (username && username.trim().length > 0) {
                const uname = username.trim();
                const { data: existing } = await supabase.from('profiles').select('id').ilike('username', uname);
                if (existing && existing.length > 0) {
                    const conflict = existing.find((r: any) => r.id !== user.id);
                    if (conflict) {
                        setMessage('Username already taken. Please choose another.');
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

            setMessage('Profile settings saved.');
        } catch (err: any) {
            console.error('Save error', err);
            setMessage(err?.message || 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-6">
                <h2 className="text-xl font-bold">Profile Settings</h2>
                <p className="mt-3">Please sign in to edit your profile settings.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl">
            <h2 className="text-2xl font-bold mb-3">Profile Settings</h2>
            <p className="text-sm text-white mb-4">Account: <span className="font-medium">(hidden)</span></p>

            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">First name</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border p-2 rounded" />
                </div>

                <div>
                    <label className="block text-sm font-medium">Last name</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border p-2 rounded" />
                </div>

                <div>
                    <label className="block text-sm font-medium">Username</label>
                    <input value={username} onChange={e => setUsername(e.target.value)} placeholder="your-username" className="w-full border p-2 rounded" />
                    <p className="text-xs text-gray-500 mt-1">Your public username (unique, case-insensitive).</p>
                </div>

                <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input value={email} readOnly className="w-full border p-2 rounded bg-gray-100" />
                </div>

                <div>
                    <label className="block text-sm font-medium">New password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" className="w-full border p-2 rounded" />
                </div>

                <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                    <div>
                        <label className="block text-sm font-medium">Country</label>
                        <input list="country-list" value={locationCountry} onChange={e => { setLocationCountry(e.target.value); setLocationCity(''); }} placeholder="Start typing your country" className="w-full border p-2 rounded" />
                        <datalist id="country-list">
                            {countryOptions.map(c => <option key={c} value={c} />)}
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">City</label>
                        <input list="city-list" value={locationCity} onChange={e => setLocationCity(e.target.value)} placeholder="Start typing your city" className="w-full border p-2 rounded" />
                        <datalist id="city-list">
                            {cityOptions.map(c => <option key={c} value={c} />)}
                        </datalist>
                    </div>
                </div>

                <div className="sm:grid sm:grid-cols-2 sm:gap-4">
                    <div>
                        <label className="block text-sm font-medium">Major / Field</label>
                        <input list="major-list" value={majorField} onChange={e => setMajorField(e.target.value)} placeholder="Start typing your major" className="w-full border p-2 rounded" />
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
                        <label className="block text-sm font-medium">Passion / Sector</label>
                        <input list="passion-list" value={passionSector} onChange={e => setPassionSector(e.target.value)} placeholder="Start typing your passion" className="w-full border p-2 rounded" />
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

                <div className="flex items-center gap-3">
                    <input id="mentor" type="checkbox" checked={isMentor} onChange={e => setIsMentor(e.target.checked)} />
                    <label htmlFor="mentor" className="text-sm">I am available as a mentor</label>
                </div>

                <div>
                    <label className="block text-sm font-medium">Short bio</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} placeholder="Short bio (max 500 chars)" className="w-full border p-2 rounded h-28" />
                </div>

                <div>
                    <label className="block text-sm font-medium">Profile picture</label>
                    <div className="flex items-center gap-4 mt-2">
                                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                        {avatarPreview ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">No avatar</span>}
                                    </div>
                        <div className="flex-1">
                            <input type="file" accept="image/*" onChange={handleFile} />
                            <div className="mt-2 flex gap-2">
                                <button type="button" onClick={handleUploadAvatar} disabled={!avatarFile || loading} className="px-3 py-1 rounded bg-blue-600 text-white">Upload</button>
                                <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(avatarDataUrl); }} className="px-3 py-1 rounded border">Cancel</button>
                            </div>
                            {avatarDataUrl && <p className="text-xs text-gray-500 mt-2">Avatar saved in profile.</p>}
                        </div>
                    </div>
                </div>

                {message && <p className="text-sm text-gray-700">{message}</p>}

                <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white">{loading ? 'Saving...' : 'Save Settings'}</button>
                </div>
            </form>
        </div>
    );
}
