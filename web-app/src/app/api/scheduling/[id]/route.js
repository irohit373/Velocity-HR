import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createCalendarEventWithMeet, createMockMeetLink, deleteCalendarEvent } from '@/lib/google-calendar';
import { sendInterviewInvitation, sendInterviewCancellation } from '@/lib/email';

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
 * Update a schedule (time, meet link, notes) and sync with Google Calendar
 */
export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { interview_time, notes } = body;

    // Get current schedule with applicant and job details
    const schedules = await sql`
      SELECT 
        s.*,
        a.full_name,
        a.email,
        j.job_title,
        j.hr_id
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

    const currentSchedule = schedules[0];

    // If interview time changed, regenerate Google Meet link
    let meetData = { meetLink: currentSchedule.meet_link };
    
    if (interview_time && interview_time !== currentSchedule.interview_time) {
      console.log('🔄 Interview time changed, regenerating Google Meet link...');
      
      // Check if HR has Google Calendar connected
      const hrData = await sql`
        SELECT google_refresh_token FROM hrs
        WHERE id = ${user.userId}
      `;

      if (hrData.length > 0 && hrData[0].google_refresh_token) {
        try {
          // Delete old calendar event if exists
          // TODO: Store calendar event ID to enable deletion
          
          // Create new calendar event with updated time
          meetData = await createCalendarEventWithMeet({
            hrId: user.userId,
            summary: `Interview: ${currentSchedule.full_name} - ${currentSchedule.job_title}`,
            description: notes || currentSchedule.notes || `Interview with ${currentSchedule.full_name}`,
            startDateTime: interview_time,
            attendeeEmail: currentSchedule.email,
          });
          console.log(`✅ New Google Meet link created: ${meetData.meetLink}`);
        } catch (error) {
          console.error('❌ Failed to create new Google Meet link:', error);
          meetData = await createMockMeetLink({ startDateTime: interview_time });
          console.log(`⚠️ Falling back to mock link: ${meetData.meetLink}`);
        }
      } else {
        meetData = await createMockMeetLink({ startDateTime: interview_time });
        console.log(`⚠️ Using mock link (HR not connected): ${meetData.meetLink}`);
      }
    }

    // Update the schedule
    const result = await sql`
      UPDATE scheduling
      SET interview_time = COALESCE(${interview_time}, interview_time),
          meet_link = ${meetData.meetLink},
          notes = COALESCE(${notes}, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE scheduling_id = ${id}
      RETURNING *
    `;

    const updatedSchedule = result[0];

    // Send updated email notification to candidate
    const interviewDate = new Date(updatedSchedule.interview_time);
    const formattedDateTime = interviewDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    await sendInterviewInvitation({
      candidateName: currentSchedule.full_name,
      candidateEmail: currentSchedule.email,
      jobTitle: currentSchedule.job_title,
      interviewDateTime: formattedDateTime,
      meetLink: updatedSchedule.meet_link,
      notes: updatedSchedule.notes || '',
    });
    console.log(`📧 Updated invitation sent to ${currentSchedule.email}`);

    return NextResponse.json({ 
      schedule: {
        ...updatedSchedule,
        full_name: currentSchedule.full_name,
        email: currentSchedule.email,
        job_title: currentSchedule.job_title,
      },
      message: 'Schedule updated and candidate notified'
    });
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
 * Delete a schedule and notify the candidate
 */
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get schedule details before deletion
    const schedules = await sql`
      SELECT 
        s.*,
        a.full_name,
        a.email,
        a.applicant_id,
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

    const schedule = schedules[0];

    // TODO: Delete Google Calendar event if calendar_event_id is stored
    // if (schedule.calendar_event_id) {
    //   await deleteCalendarEvent({ hrId: user.userId, eventId: schedule.calendar_event_id });
    // }

    // Delete the schedule
    await sql`
      DELETE FROM scheduling
      WHERE scheduling_id = ${id}
    `;

    // Update applicant status back to reviewed
    await sql`
      UPDATE applicants
      SET status = 'reviewed'
      WHERE applicant_id = ${schedule.applicant_id}
    `;

    console.log(`🗑️ Schedule deleted for ${schedule.full_name}`);

    // Send cancellation email to candidate
    await sendInterviewCancellation({
      candidateName: schedule.full_name,
      candidateEmail: schedule.email,
      jobTitle: schedule.job_title,
      reason: 'The interview has been cancelled by the hiring team.',
    });
    console.log(`📧 Cancellation email sent to ${schedule.email}`);

    return NextResponse.json({ 
      message: 'Schedule deleted successfully',
      applicant_id: schedule.applicant_id 
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
