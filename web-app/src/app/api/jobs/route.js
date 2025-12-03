import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateJobSummary } from '@/lib/fastapi';

/**
 * GET /api/auth/jobs
 * Fetch jobs based on access level
 * - Public: Returns active jobs for job seekers
 * - Authenticated HR: Returns their own jobs
 */
export async function GET(request) {
  try {
    // Extract query parameters from URL
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    // Get current logged-in user (if any)
    const user = await getCurrentUser();

    let jobs;
    
    if (isPublic) {
      // Public job listings - anyone can view
      // Only show active jobs that haven't expired
      jobs = await sql`
        SELECT 
          job_id, job_title, job_description, required_experience_years,
          tags, location, salary_range, ai_generated_summary, created_at, expiry_date
        FROM jobs
        WHERE is_active = true 
        AND (expiry_date IS NULL OR expiry_date > NOW())
        ORDER BY created_at DESC
      `;
    } else {
      // HR dashboard - protected route
      // Check if user is authenticated
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Fetch only jobs created by this HR user
      jobs = await sql`
        SELECT * FROM jobs
        WHERE hr_id = ${user.userId}
        ORDER BY created_at DESC
      `;
    }

    // Return jobs as JSON
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

/**
 * POST /api/auth/jobs
 * Create a new job posting
 * Requires authentication (HR only)
 */
export async function POST(request) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      job_title,
      job_description,
      required_experience_years,
      tags,
      location,
      salary_range,
      expiry_date,
    } = body;

    // Validate required fields
    if (!job_title || !job_description) {
      return NextResponse.json(
        { error: 'Job title and description are required' },
        { status: 400 }
      );
    }

    // Step 1: Insert job into database
    // AI summary will be generated and added later
    const result = await sql`
      INSERT INTO jobs (
        hr_id, job_title, job_description, required_experience_years,
        tags, location, salary_range, expiry_date
      )
      VALUES (
        ${user.userId}, ${job_title}, ${job_description}, 
        ${required_experience_years || 0}, ${tags || []}, 
        ${location || null}, ${salary_range || null}, ${expiry_date || null}
      )
      RETURNING *
    `;

    const job = result[0];

    // Step 2: Generate AI summary asynchronously in the background
    // Don't await - this runs after response is sent
    // Improves response time for the user
    generateJobSummary({
      job_title,
      job_description,
      required_experience_years: required_experience_years || 0,
      tags: tags || [],
    }).then(async (summary) => {
      // Only update if AI generated a summary
      if (summary) {
        await sql`
          UPDATE jobs 
          SET ai_generated_summary = ${summary}
          WHERE job_id = ${job.job_id}
        `;
      }
    }).catch((error) => {
      // Log error but don't fail the job creation
      console.error('AI summary generation failed:', error);
    });

    // Return newly created job (without AI summary yet)
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}