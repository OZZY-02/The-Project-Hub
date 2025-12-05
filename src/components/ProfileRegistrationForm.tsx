"use client";

import React, { useState } from 'react';
import supabase from '../lib/supabaseClient';
import Link from 'next/link';

export default function ProfileRegistrationForm({ onClose }: { onClose?: () => void }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [locationCity, setLocationCity] = useState('');
    const [locationCountry, setLocationCountry] = useState('');
    const [cityOther, setCityOther] = useState('');
    const [majorField, setMajorField] = useState('');
    const [passionSector, setPassionSector] = useState('');
    const [isMentor, setIsMentor] = useState(false);
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            const user = userData?.user;
            if (!user) {
                setMessage('Please sign in first (you will be redirected to the signup page).');
                setLoading(false);
                return;
            }

            const resolvedCity = locationCity === 'Other' ? cityOther : locationCity;
            const profileRow = {
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                location_city: resolvedCity,
                location_country: locationCountry,
                major_field: majorField,
                passion_sector: passionSector,
                is_mentor: isMentor,
                bio: bio,
            };

            // Use upsert to create or update a profile row for the authenticated user
            const { error } = await supabase.from('profiles').upsert(profileRow);
            if (error) throw error;

            setMessage('Profile saved successfully.');
            setLoading(false);
            if (onClose) onClose();
        } catch (err: any) {
            console.error('Error saving profile:', err);
            setMessage(err?.message || 'An error occurred while saving your profile.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => onClose && onClose()} />
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl z-10">
                <h3 className="text-2xl font-bold mb-4">Create Your Profile</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-gray-900 sm:text-gray-700 text-sm mb-1">First name</label>
                        <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className="w-full border p-2 rounded text-gray-900 placeholder-gray-400" />
                    </div>

                    <div>
                        <label className="block text-gray-900 sm:text-gray-700 text-sm mb-1">Last name</label>
                        <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className="w-full border p-2 rounded text-gray-900 placeholder-gray-400" />
                    </div>

                    <div className="sm:col-span-1">
                        <label className="block text-gray-900 sm:text-gray-700 text-sm mb-1">Country</label>
                        <select value={locationCountry} onChange={e => setLocationCountry(e.target.value)} className="w-full border p-2 rounded text-gray-900">
                            <option value="">Select country</option>
                            <option value="Egypt">Egypt</option>
                            <option value="Sudan">Sudan</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="sm:col-span-1">
                        <label className="block text-gray-900 sm:text-gray-700 text-sm mb-1">City</label>
                        <select value={locationCity} onChange={e => setLocationCity(e.target.value)} className="w-full border p-2 rounded text-gray-900">
                            <option value="">Select city</option>
                            <option value="Cairo">Cairo</option>
                            <option value="Khartoum">Khartoum</option>
                            <option value="Alexandria">Alexandria</option>
                            <option value="Port Said">Port Said</option>
                            <option value="Other">Other</option>
                        </select>
                        {locationCity === 'Other' && (
                            <input value={cityOther} onChange={e => setCityOther(e.target.value)} placeholder="Enter city" className="mt-2 w-full border p-2 rounded text-gray-900" />
                        )}
                    </div>

                    <div>
                        <label className="block text-gray-900 sm:text-gray-700 text-sm mb-1">Major / Field</label>
                        <select value={majorField} onChange={e => setMajorField(e.target.value)} className="w-full border p-2 rounded text-gray-900">
                            <option value="">Select major</option>
                            <option value="Software Engineering">Software Engineering</option>
                            <option value="Design">Design</option>
                            <option value="Product Management">Product Management</option>
                            <option value="Data Science">Data Science</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-900 sm:text-gray-700 text-sm mb-1">Passion / Sector</label>
                        <select value={passionSector} onChange={e => setPassionSector(e.target.value)} className="w-full border p-2 rounded text-gray-900">
                            <option value="">Select passion</option>
                            <option value="Education">Education</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Agriculture">Agriculture</option>
                            <option value="Fintech">Fintech</option>
                            <option value="Design">Design</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input id="mentor" type="checkbox" checked={isMentor} onChange={e => setIsMentor(e.target.checked)} />
                        <label htmlFor="mentor" className="text-gray-900 sm:text-gray-700">I am available as a mentor</label>
                    </div>
                </div>

                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio (max 500 chars)" maxLength={500} className="border p-2 rounded w-full mt-3 h-28" />

                {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}

                <div className="mt-4 flex items-center justify-end gap-3">
                    <button type="button" onClick={() => onClose && onClose()} className="px-4 py-2 rounded border">Cancel</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-[#1e40af] text-white">{loading ? 'Saving...' : 'Save Profile'}</button>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                    Not signed in? <Link href="/auth/signup">Sign up / Sign in</Link>
                </div>
            </form>
        </div>
    );
}
