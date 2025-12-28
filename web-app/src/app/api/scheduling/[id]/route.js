import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/scheduling/[id]
 * Fetch a specific schedule by ID
 */
export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const schedules = await sql`
      SELECT 
        s.*,
        a.full_name,
        a.email,
        a.phone,
        j.job_title
      FROM scheduling s
      JOIN applicants a ON s.applicant_id = a.applicant_id
      JOIN jobs j ON s.job_id = j.job_id
      WHERE s.scheduling_id = ${id} AND j.hr_id = ${user.userId}
    `;

    if (schedules.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ schedule: schedules[0] });
  } catch (error) {
    console.error('Fetch schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/scheduling/[id]
 * Update a schedule (time, meet link, notes, or status)
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { interview_time, meet_link, notes, status } = body;

    // Verify ownership
    const ownership = await sql`
      SELECT s.scheduling_id 
      FROM scheduling s
      JOIN jobs j ON s.job_id = j.job_id
      WHERE s.scheduling_id = ${id} AND j.hr_id = ${user.userId}
    `;

    if (ownership.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found or unauthorized' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['scheduled', 'rejected', 'hired', 'reviewing'];
      if (!validStatuses.includes(status.toLowerCase())) {
        return NextResponse.json(
          { error: 'Invalid status. Must be: scheduled, rejected, hired, or reviewing' },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (interview_time !== undefined) {
      updates.push(`interview_time = $${updates.length + 1}`);
      values.push(interview_time);
    }
    if (meet_link !== undefined) {
      updates.push(`meet_link = $${updates.length + 1}`);
      values.push(meet_link);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${updates.length + 1}`);
      values.push(notes);
    }
    if (status !== undefined) {
      updates.push(`status = $${updates.length + 1}`);
      values.push(status.toLowerCase());
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update the schedule
    const result = await sql`
      UPDATE scheduling
      SET interview_time = COALESCE(${interview_time}, interview_time),
          meet_link = COALESCE(${meet_link}, meet_link),
          notes = COALESCE(${notes}, notes),
          status = COALESCE(${status?.toLowerCase()}, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE scheduling_id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ schedule: result[0] });
  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scheduling/[id]
 * Delete a schedule
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const ownership = await sql`
      SELECT s.scheduling_id, s.applicant_id
      FROM scheduling s
      JOIN jobs j ON s.job_id = j.job_id
      WHERE s.scheduling_id = ${id} AND j.hr_id = ${user.userId}
    `;

    if (ownership.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the schedule
    await sql`
      DELETE FROM scheduling
      WHERE scheduling_id = ${id}
    `;

    // Optionally update applicant status back to reviewed/pending
    await sql`
      UPDATE applicants
      SET status = 'reviewed'
      WHERE applicant_id = ${ownership[0].applicant_id}
    `;

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
