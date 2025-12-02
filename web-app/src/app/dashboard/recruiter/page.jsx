import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardPage() {
    const user = await getCurrentUser();

    return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <p className="text-gray-600 mb-4">Welcome, {user.email}!</p>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
} 