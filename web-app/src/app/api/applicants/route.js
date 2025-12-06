import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { put } from '@vercel/blob';
import { analyzeResume } from '@/lib/fastapi';

/**
 * POST /api/applicants
 * Submit a job application with resume
 * Public endpoint - no authentication required
 * Handles file upload, duplicate detection, and AI-powered resume analysis
 */
export async function POST(request) {
  try {
    // Parse multipart form data (contains both text fields and file)
    const formData = await request.formData();
    
    // Extract all form fields
    const job_id = parseInt(formData.get('job_id'));
    const full_name = formData.get('full_name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const dob = formData.get('dob');
    const experience_years = parseInt(formData.get('experience_years'));
    const detail_box = formData.get('detail_box');
    const resume = formData.get('resume'); // File object

    // Validate required fields
    if (!job_id || !full_name || !email || !resume) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has already applied for this job
    // Prevents duplicate applications using unique constraint (job_id, email)
    const existing = await sql`
      SELECT * FROM applicants WHERE job_id = ${job_id} AND email = ${email}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 409 }
      );
    }

    // Upload resume file to Vercel Blob Storage (cloud storage)
    // Generates a unique filename using timestamp + original filename
    // Returns a public URL that can be accessed later
    const blob = await put(`resumes/${Date.now()}-${resume.name}`, resume, {
      access: 'public',
    });

    // Insert applicant record into database
    // Resume URL is stored, not the actual file content
    const result = await sql`
      INSERT INTO applicants (
        job_id, full_name, email, phone, dob, experience_years,
        detail_box, resume_url
      )
      VALUES (
        ${job_id}, ${full_name}, ${email}, ${phone || null}, 
        ${dob || null}, ${experience_years}, ${detail_box || null}, 
        ${blob.url}
      )
      RETURNING *
    `;

    const applicant = result[0];

    // Fetch job details needed for AI resume analysis
    const jobs = await sql`
      SELECT job_description, required_experience_years 
      FROM jobs WHERE job_id = ${job_id}
    `;

    // Step: AI Resume Analysis (runs in background)
    // Don't await - improves response time for user
    // AI will analyze resume and update score/summary later
    if (jobs.length > 0) {
      console.log(`[Applicant ${applicant.applicant_id}] Starting AI analysis...`);
      analyzeResume({
        resume_url: blob.url,
        job_description: jobs[0].job_description,
        required_experience_years: jobs[0].required_experience_years,
      }).then(async (analysis) => {
        console.log(`[Applicant ${applicant.applicant_id}] AI analysis received:`, {
          score: analysis.score,
          summary_length: analysis.summary?.length || 0,
          missing_keywords: analysis.missing_keywords?.length || 0
        });
        
        // Update applicant record with AI-generated insights
        const updateResult = await sql`
          UPDATE applicants 
          SET ai_generated_score = ${analysis.score},
              ai_generated_summary = ${analysis.summary}
          WHERE applicant_id = ${applicant.applicant_id}
          RETURNING applicant_id, ai_generated_score, ai_generated_summary
        `;
        
        console.log(`[Applicant ${applicant.applicant_id}] Database updated successfully:`, {
          score: updateResult[0]?.ai_generated_score,
          summary_preview: updateResult[0]?.ai_generated_summary?.substring(0, 100) + '...'
        });
      }).catch((error) => {
        // Log error but don't fail the application
        console.error(`[Applicant ${applicant.applicant_id}] AI resume analysis failed:`, {
          error: error.message,
          stack: error.stack
        });
      });
    } else {
      console.log(`[Applicant ${applicant.applicant_id}] No job found for AI analysis`);
    }

    // Return success response immediately (before AI analysis completes)
    return NextResponse.json(
      { message: 'Application submitted successfully', applicant },
      { status: 201 }
    );
  } catch (error) {
    console.error('Application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}