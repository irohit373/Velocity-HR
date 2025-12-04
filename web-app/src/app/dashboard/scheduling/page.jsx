import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
// import LogoutButton from '@/compopnents/LogoutButton';

export default async function DashboardPage() {
    const user = await getCurrentUser();
    
    return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-3xl">Dashboard Scheduling</h2>
            <p className="text-base-content/70">Welcome, {user.email}!</p>
            {/* <LogoutButton /> */}
          </div>
        </div>
      </div>
    </div>
  );
} 