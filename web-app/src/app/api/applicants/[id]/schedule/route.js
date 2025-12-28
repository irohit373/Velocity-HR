import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/applicants/[id]/schedule
 * Schedule an interview for an applicant
 * Requires authentication (HR only)
 */
export async function POST(request, { params }) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 📚 LEARNING: In Next.js 15+, params is a Promise and must be awaited
    const { id } = await params;
    const body = await request.json();
    const { interview_date, status } = body;

    // Validate required fields
    if (!interview_date) {
      return NextResponse.json(
        { error: 'Interview date is required' },
        { status: 400 }
      );
    }

    // Verify the applicant belongs to a job owned by this HR
    const ownership = await sql`
      SELECT a.applicant_id, a.email, a.full_name, j.job_title
      FROM applicants a
      JOIN jobs j ON a.job_id = j.job_id
      WHERE a.applicant_id = ${id} AND j.hr_id = ${user.userId}
    `;

    if (ownership.length === 0) {
      return NextResponse.json(
        { error: 'Applicant not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update applicant with interview schedule and status
    const result = await sql`
      UPDATE applicants
      SET interview_date = ${interview_date},
          status = ${status || 'scheduled'}
      WHERE applicant_id = ${id}
      RETURNING *
    `;

    // TODO: Send email notification to applicant about interview schedule
    // You can add email sending here using the sendEmail function from lib/email.js

    return NextResponse.json({ 
      applicant: result[0],
      message: 'Interview scheduled successfully'
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule interview' },
      { status: 500 }
    );
  }
}
