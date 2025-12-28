import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/applicants/eligible
 * Fetch applicants with status: reviewed, scheduled, or hired
 * For scheduling interviews
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all applicants for HR's jobs with eligible statuses
    const applicants = await sql`
      SELECT 
        a.applicant_id,
        a.job_id,
        a.full_name,
        a.email,
        a.phone,
        a.status,
        a.experience_years,
        a.ai_generated_score,
        j.job_title,
        j.location
      FROM applicants a
      JOIN jobs j ON a.job_id = j.job_id
      WHERE j.hr_id = ${user.userId}
        AND a.status IN ('reviewed', 'scheduled', 'hired')
      ORDER BY 
        CASE a.status
          WHEN 'reviewed' THEN 1
          WHEN 'scheduled' THEN 2
          WHEN 'hired' THEN 3
        END,
        a.ai_generated_score DESC NULLS LAST,
        a.applied_at DESC
    `;

    return NextResponse.json({ applicants });
  } catch (error) {
    console.error('Fetch eligible applicants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applicants' },
      { status: 500 }
    );
  }
}
