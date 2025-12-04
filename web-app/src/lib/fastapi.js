const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const FASTAPI_TIMEOUT = 60000; // 60 seconds

/**
 * Make a request to FastAPI with timeout and error handling
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>} The fetch response
 */
async function fetchWithTimeout(
  url,
  options,
  timeout = FASTAPI_TIMEOUT
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - AI service is taking too long');
    }
    throw error;
  }
}

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
    const response = await fetchWithTimeout(
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
    const response = await fetchWithTimeout(
      `${FASTAPI_URL}/api/analyze-resume`,
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
      throw new Error(errorDetail);
    }

    const result = await response.json();
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
    const response = await fetchWithTimeout(
      `${FASTAPI_URL}/health`,
      { method: 'GET' },
      5000 // 5 second timeout for health check
    );
    return response.ok;
  } catch (error) {
    console.error('FastAPI health check failed:', error);
    return false;
  }
}