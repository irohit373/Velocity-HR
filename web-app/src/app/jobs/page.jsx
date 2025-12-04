import { sql } from '@/lib/db';
import JobCard from '@/components/jobs/JobCard';

export default async function JobsPage() {
  // Get all active jobs
  const jobs = await sql`
    SELECT 
      job_id, job_title, job_description, required_experience_years,
      tags, location, salary_range, ai_generated_summary, created_at
    FROM jobs
    WHERE is_active = true 
    AND (expiry_date IS NULL OR expiry_date > NOW())
    ORDER BY created_at DESC
  `;

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Open Positions
          </h1>
          <p className="text-xl text-base-content/70">
            Find your next opportunity. {jobs.length} jobs available.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.job_id} job={job} />
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-base-content/50 text-lg">
              No open positions at the moment. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}