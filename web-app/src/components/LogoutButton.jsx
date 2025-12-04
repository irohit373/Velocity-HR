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
            className="btn btn-outline btn-error"
            >
                Logout
            </button>
    );
}