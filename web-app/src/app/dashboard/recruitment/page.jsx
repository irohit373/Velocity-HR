import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import JobTable from '@/components/jobs/JobTable';
import AddJobButton from '@/components/jobs/AddJobButton';

// Disable caching for this page to always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RecruitmentPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch jobs for this HR
  const jobs = await sql`
    SELECT * FROM jobs 
    WHERE hr_id = ${user.userId}
    ORDER BY created_at DESC
  `;

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="container max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Job Management</h1>
            <p className="text-base-content/70 mt-1">Manage your job postings and applications</p>
          </div>
          <AddJobButton />
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-0">
            <JobTable initialJobs={jobs} />
          </div>
        </div>
      </div>
    </div>
  );
}