const FASTAPI_URL = (process.env.FASTAPI_URL || 'http://localhost:8000');

console.log('[FastAPI Config] FASTAPI_URL:', FASTAPI_URL);

/**
 * Generate AI job summary
 * @param {Object} jobData - Job data object
 * @param {string} jobData.job_title - Job title
 * @param {string} jobData.job_description - Job description
 * @param {number} jobData.required_experience_years - Required years of experience
 * @param {string[]} jobData.tags - Job tags
 * @returns {Promise<string>} The generated summary
 */
export async function generateJobSummary(jobData) {
  try {
    const response = await fetch(
      `${FASTAPI_URL}/api/generate-job-summary`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      }
    );

    if (!response.ok) {
      // Try to get error details from response
      let errorDetail = `FastAPI error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorDetail = errorData.detail;
        }
      } catch (e) {
        // If JSON parsing fails, use status text
        errorDetail = `${response.status} ${response.statusText}`;
      }
      console.error('FastAPI Error Details:', errorDetail);
      console.error('Request data:', {
        job_title: jobData.job_title,
        has_description: !!jobData.job_description,
        experience_years: jobData.required_experience_years,
        tags_count: jobData.tags?.length || 0
      });
      throw new Error(errorDetail);
    }

    const data = await response.json();
    return data.summary || '';
  } catch (error) {
    console.error('Job summary generation error:', error);
    console.error('Error details:', {
      message: error.message,
      job_title: jobData.job_title,
      fastapi_url: FASTAPI_URL
    });
    // Graceful degradation - return empty string if AI fails
    return '';
  }
}

/**
 * Analyze resume and generate score
 * @param {Object} data - Resume analysis data
 * @param {string} data.resume_url - URL of the resume file
 * @param {string} data.job_description - Job description
 * @param {string} data.cover_letter - Cover letter or additional details from applicant
 * @returns {Promise<{score: number, summary: string, missing_keywords: array, jd_match: string}>} Score and summary
 */
export async function analyzeResume(data) {
  try {
    const url = `${FASTAPI_URL}/api/analyze-resume`;
    console.log('[analyzeResume] Calling:', url);
    console.log('[analyzeResume] Data:', {
      resume_url: data.resume_url,
      has_job_description: !!data.job_description,
      has_cover_letter: !!data.cover_letter
    });
    
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      // Try to get error details from response
      let errorDetail = `FastAPI error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorDetail = errorData.detail;
        }
      } catch (e) {
        // If JSON parsing fails, use status text
        errorDetail = `${response.status} ${response.statusText}`;
      }
      console.error('FastAPI Error Details:', errorDetail);
      console.error('Request URL:', url);
      throw new Error(errorDetail);
    }

    const result = await response.json();
    console.log('[analyzeResume] Response received:', {
      score: result.score,
      summary_length: result.summary?.length || 0,
      has_missing_keywords: !!result.missing_keywords,
      jd_match: result.jd_match
    });
    
    return {
      score: result.score || 0,
      summary: result.summary || 'Analysis pending',
      missing_keywords: result.missing_keywords || [],
      jd_match: result.jd_match || '0%',
    };
  } catch (error) {
    console.error('Resume analysis error:', error);
    console.error('Error details:', {
      message: error.message,
      resume_url: data.resume_url,
      has_job_description: !!data.job_description,
      has_cover_letter: !!data.cover_letter
    });
    // Graceful degradation
    return {
      score: 0,
      summary: 'AI analysis failed. Please review manually.',
      missing_keywords: [],
      jd_match: '0%',
    };
  }
}

/**
 * Health check for FastAPI service
 * @returns {Promise<boolean>} True if service is healthy
 */
export async function checkFastAPIHealth() {
  try {
    const response = await fetch(
      `${FASTAPI_URL}/health`,
      { method: 'GET' }
    );
    return response.ok;
  } catch (error) {
    console.error('FastAPI health check failed:', error);
    return false;
  }
}