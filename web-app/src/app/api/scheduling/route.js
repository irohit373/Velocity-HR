import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createMockMeetLink, createCalendarEventWithMeet } from '@/lib/google-calendar';
import { sendInterviewInvitation } from '@/lib/email';

/**
 * POST /api/scheduling
 * Create a new interview schedule with complete flow:
 * 1. Generate Google Meet link
 * 2. Save to database
 * 3. Send email to candidate
 * 4. Update applicant status
 * 5. Create calendar event for HR
 */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { applicant_id, job_id, interview_time, notes } = body;

    // Validate required fields
    if (!applicant_id || !job_id || !interview_time) {
      return NextResponse.json(
        { error: 'Missing required fields: applicant_id, job_id, interview_time' },
        { status: 400 }
      );
    }

    // Verify the job belongs to this HR
    const jobs = await sql`
      SELECT job_id, job_title FROM jobs 
      WHERE job_id = ${job_id} AND hr_id = ${user.userId}
    `;

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get applicant details for email
    const applicants = await sql`
      SELECT full_name, email FROM applicants
      WHERE applicant_id = ${applicant_id}
    `;

    if (applicants.length === 0) {
      return NextResponse.json(
        { error: 'Applicant not found' },
        { status: 404 }
      );
    }

    const applicant = applicants[0];
    const job = jobs[0];

    console.log(`📅 Creating interview schedule for ${applicant.full_name}...`);

    // STEP 1: Generate Google Meet link
    // Check if HR has Google Calendar connected
    const hrData = await sql`
      SELECT google_refresh_token FROM hrs
      WHERE id = ${user.userId}
    `;

    let meetData;
    if (hrData.length > 0 && hrData[0].google_refresh_token) {
      // Use real Google Calendar API with HR's credentials
      console.log('🔐 Using HR Google Calendar credentials...');
      try {
        meetData = await createCalendarEventWithMeet({
          hrId: user.userId,
          summary: `Interview: ${applicant.full_name} - ${job.job_title}`,
          description: notes || `Interview with ${applicant.full_name} for ${job.job_title} position`,
          startDateTime: interview_time,
          attendeeEmail: applicant.email,
        });
        console.log(`✅ Real Google Meet link created: ${meetData.meetLink}`);
      } catch (error) {
        console.error('❌ Failed to create real Google Meet link:', error);
        // Fallback to mock link
        meetData = await createMockMeetLink({ startDateTime: interview_time });
        console.log(`⚠️ Falling back to mock link: ${meetData.meetLink}`);
      }
    } else {
      // Use mock link for development or when HR hasn't connected Google
      console.log('⚠️ HR has not connected Google Calendar, using mock link...');
      meetData = await createMockMeetLink({ startDateTime: interview_time });
      console.log(`🔗 Mock Meet link generated: ${meetData.meetLink}`);
    }

    // STEP 2: Save to database
    const result = await sql`
      INSERT INTO scheduling (
        applicant_id, job_id, interview_time, meet_link, notes, status
      )
      VALUES (
        ${applicant_id}, ${job_id}, ${interview_time}, 
        ${meetData.meetLink}, ${notes || null}, 'scheduled'
      )
      RETURNING *
    `;

    const schedule = result[0];
    console.log(`💾 Schedule saved to database (ID: ${schedule.scheduling_id})`);

    // STEP 3: Update applicant status to 'scheduled'
    await sql`
      UPDATE applicants
      SET status = 'scheduled'
      WHERE applicant_id = ${applicant_id}
    `;
    console.log(`✅ Applicant status updated to 'scheduled'`);

    // STEP 4: Send email invitation to candidate
    const interviewDate = new Date(interview_time);
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
      candidateName: applicant.full_name,
      candidateEmail: applicant.email,
      jobTitle: job.job_title,
      interviewDateTime: formattedDateTime,
      meetLink: meetData.meetLink,
      notes: notes || '',
    });
    console.log(`📧 Interview invitation sent to ${applicant.email}`);

    console.log('✅ Interview scheduling complete!');

    return NextResponse.json({ 
      schedule: {
        ...schedule,
        applicant_name: applicant.full_name,
        applicant_email: applicant.email,
        job_title: job.job_title,
      },
      message: 'Interview scheduled successfully! Email sent to candidate.'
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Create schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scheduling
 * Fetch all scheduled interviews for HR's jobs
 */
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all schedules for jobs owned by this HR
    const schedules = await sql`
      SELECT 
        s.*,
        a.full_name,
        a.email,
        j.job_title
      FROM scheduling s
      JOIN applicants a ON s.applicant_id = a.applicant_id
      JOIN jobs j ON s.job_id = j.job_id
      WHERE j.hr_id = ${user.userId}
      ORDER BY s.interview_time ASC
    `;

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Fetch schedules error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}
