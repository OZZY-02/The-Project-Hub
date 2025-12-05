import React from 'react';

type Props = {
	params: {
		id: string;
	};
};

export default function ProfilePage({ params }: Props) {
	const { id } = params;

	return (
		<div className="min-h-screen flex items-center justify-center p-8">
			<div className="max-w-2xl w-full bg-white rounded-lg shadow p-6">
				<h1 className="text-2xl font-bold mb-2">Profile</h1>
				<p className="text-gray-600">Displaying profile for ID: <span className="font-mono">{id}</span></p>
				<p className="mt-4 text-sm text-gray-500">This profile page is a placeholder. Replace with your full profile renderer or data fetching logic.</p>
			</div>
		</div>
	);
}
