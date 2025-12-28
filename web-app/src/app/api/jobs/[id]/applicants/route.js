import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/jobs/[id]/applicants
 * Fetch all applicants for a specific job
 * Requires authentication - only the HR who created the job can view applicants
 * Applicants are sorted by AI score (highest first), then by application date
 */
export async function GET(request, { params }) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 📚 LEARNING: In Next.js 15+, params is a Promise and must be awaited
    const { id } = await params;
    const jobId = parseInt(id);

    // Verify job ownership: Check if this job belongs to the current HR user
    // This prevents HR users from viewing applicants of other HR's jobs
    const jobs = await sql`
      SELECT * FROM jobs WHERE job_id = ${jobId} AND hr_id = ${user.userId}
    `;

    if (jobs.length === 0) {
      return NextResponse.json({ error: 'Job not found or unauthorized' }, { status: 404 });
    }

    // Fetch all applicants for this job
    // Ordered by AI-generated score (highest first)
    // Applicants without scores (NULL) are pushed to the end
    // Then sorted by application date (most recent first)
    const applicants = await sql`
      SELECT * FROM applicants
      WHERE job_id = ${jobId}
      ORDER BY ai_generated_score DESC NULLS LAST, applied_at DESC
    `;

    // Return list of applicants
    return NextResponse.json({ applicants });
  } catch (error) {
    console.error('Fetch applicants error:', error);
    return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 });
  }
}