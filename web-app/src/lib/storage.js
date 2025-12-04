import { put, del } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob Storage
 * @param {File} file - The file to upload
 * @returns {Promise<string>} The URL of the uploaded file
 */
export async function uploadResume(file) {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `resumes/${timestamp}-${file.name}`;
    
    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    });
    
    return blob.url;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload resume');
  }
}

/**
 * Delete a file from Vercel Blob Storage
 * @param {string} url - The URL of the file to delete
 */
export async function deleteResume(url) {
  try {
    await del(url);
  } catch (error) {
    console.error('Delete error:', error);
    // Don't throw - file might already be deleted
  }
}

/**
 * Validate file before upload
 * @param {File} file - The file to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateResumeFile(file) {
  // Check file type
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Only PDF files are allowed' };
  }
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }
  
  return { valid: true };
}