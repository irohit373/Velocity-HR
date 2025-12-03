import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import JobTable from '@/components/jobs/JobTable';
import AddJobButton from '@/components/jobs/AddJobButton';

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600 mt-1">Manage your job postings and applications</p>
          </div>
          <AddJobButton />
        </div>

        <div className="bg-white rounded-lg shadow">
          <JobTable initialJobs={jobs} />
        </div>
      </div>
    </div>
  );
}