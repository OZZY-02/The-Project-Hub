"use client";

import React, { useState } from 'react';
import supabase from '../lib/supabaseClient';
import Link from 'next/link';

export default function ProfileRegistrationForm({ onClose }: { onClose?: () => void }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [locationCity, setLocationCity] = useState('');
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

            const profileRow = {
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                location_city: locationCity,
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
                    <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className="border p-2 rounded" />
                    <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className="border p-2 rounded" />
                    <input value={locationCity} onChange={e => setLocationCity(e.target.value)} placeholder="City" className="border p-2 rounded col-span-1 sm:col-span-2" />
                    <input value={majorField} onChange={e => setMajorField(e.target.value)} placeholder="Major / Field" className="border p-2 rounded" />
                    <input value={passionSector} onChange={e => setPassionSector(e.target.value)} placeholder="Passion / Sector" className="border p-2 rounded" />
                    <div className="flex items-center gap-2">
                        <input id="mentor" type="checkbox" checked={isMentor} onChange={e => setIsMentor(e.target.checked)} />
                        <label htmlFor="mentor">I am available as a mentor</label>
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
