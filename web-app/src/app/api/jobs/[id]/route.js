import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/auth/jobs/[id]
 * Fetch a single job by ID
 * Public endpoint - anyone can view job details
 */
export async function GET(request, { params }) {
  try {
    // Await params before accessing properties (Next.js 15)
    const resolvedParams = await params;
    
    // Extract job ID from URL parameters and convert to integer
    const jobId = parseInt(resolvedParams.id);
    
    // Query database for the specific job
    const jobs = await sql`
      SELECT * FROM jobs WHERE job_id = ${jobId}
    `;

    // Check if job exists
    if (jobs.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Return the job data
    return NextResponse.json({ job: jobs[0] });
  } catch (error) {
    console.error('Get job error:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

/**
 * PUT /api/auth/jobs/[id]
 * Update an existing job posting
 * Requires authentication - only the job creator (HR) can update
 */
export async function PUT(request, { params }) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing properties (Next.js 15)
    const resolvedParams = await params;
    
    // Extract job ID from URL parameters
    const jobId = parseInt(resolvedParams.id);
    
    // Parse the request body containing updated job data
    const body = await request.json();

    // Verify ownership: Check if this job belongs to the current user
    // This prevents users from editing other people's jobs
    const jobs = await sql`
      SELECT * FROM jobs WHERE job_id = ${jobId} AND hr_id = ${user.userId}
    `;

    if (jobs.length === 0) {
      return NextResponse.json({ error: 'Job not found or unauthorized' }, { status: 404 });
    }

    // Update the job with new data
    // Using RETURNING * to get the updated job data back
    const result = await sql`
      UPDATE jobs SET
        job_title = ${body.job_title},
        job_description = ${body.job_description},
        required_experience_years = ${body.required_experience_years},
        tags = ${body.tags || []},
        location = ${body.location || null},
        salary_range = ${body.salary_range || null},
        is_active = ${body.is_active},
        expiry_date = ${body.expiry_date || null}
      WHERE job_id = ${jobId}
      RETURNING *
    `;

    // Return the updated job
    return NextResponse.json({ job: result[0] });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/jobs/[id]
 * Delete a job posting
 * Requires authentication - only the job creator (HR) can delete
 * This will also delete all associated applicants (CASCADE)
 */
export async function DELETE(request, { params }) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params before accessing properties (Next.js 15)
    const resolvedParams = await params;
    
    // Extract job ID from URL parameters
    const jobId = parseInt(resolvedParams.id);

    // Delete the job, but only if it belongs to this user
    // RETURNING job_id confirms the deletion happened
    const result = await sql`
      DELETE FROM jobs 
      WHERE job_id = ${jobId} AND hr_id = ${user.userId}
      RETURNING job_id
    `;

    // If no rows were deleted, either job doesn't exist or user doesn't own it
    if (result.length === 0) {
      return NextResponse.json({ error: 'Job not found or unauthorized' }, { status: 404 });
    }

    // Success response
    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}