'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/signin');
        router.refresh();
    }

    return (
        <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
                Logout
            </button>
    );
}