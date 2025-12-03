import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ApplicantTable from '@/components/applicants/ApplicantTable';

// Page component to display applicants for a specific job
// This is a server component that fetches job and applicant data
export default async function JobApplicantsPage({ params }) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const jobId = parseInt(params.jobId);

  // Verify job ownership
  const jobs = await sql`
    SELECT * FROM jobs 
    WHERE job_id = ${jobId} AND hr_id = ${user.userId}
  `;

  if (jobs.length === 0) {
    redirect('/dashboard/recruitment');
  }

  const job = jobs[0];

  // Get applicants
  const applicants = await sql`
    SELECT * FROM applicants
    WHERE job_id = ${jobId}
    ORDER BY ai_generated_score DESC NULLS LAST, applied_at DESC
  `;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/dashboard/recruitment"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Jobs
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{job.job_title}</h1>
          <p className="text-gray-600 mt-2">
            {applicants.length} {applicants.length === 1 ? 'application' : 'applications'}
          </p>
        </div>

        {/* Applicants Table */}
        <div className="bg-white rounded-lg shadow">
          <ApplicantTable applicants={applicants} />
        </div>
      </div>
    </div>
  );
}