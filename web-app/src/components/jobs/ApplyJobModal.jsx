'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Upload, FileText } from 'lucide-react';

// Modal component for job application form
// Handles resume upload and submits application with AI analysis
export default function ApplyJobModal({ job, onClose }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resume, setResume] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    experience_years: 0,
    detail_box: '',
  });

  // Handle resume file selection with validation
  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setResume(file);
      setError('');
    }
  };

  // Submit application form with resume upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!resume) {
      setError('Please upload your resume');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('job_id', job.job_id.toString());
      formDataToSend.append('full_name', formData.full_name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('dob', formData.dob);
      formDataToSend.append('experience_years', formData.experience_years.toString());
      formDataToSend.append('detail_box', formData.detail_box);
      formDataToSend.append('resume', resume);

      const response = await fetch('/api/applicants', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      // Show success message
      setSuccess(true);
      
      // Close modal after showing success (2 seconds)
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      // Show user-friendly message for duplicate applications
      if (err.message.includes('already applied')) {
        setError('You have already submitted an application for this position.');
      } else {
        setError(err.message || 'Failed to submit application. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal modal-open">
        <div className="modal-box text-center">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">
            Application Submitted!
          </h3>
          <p className="text-base-content/70 mb-4">
            Your application for <strong>{job.job_title}</strong> has been successfully submitted.
            Our AI is analyzing your resume and you'll hear from us soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">Apply for {job.job_title}</h2>
            <p className="text-base-content/70 mt-1">{job.location || 'Remote'}</p>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-sm btn-circle"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Job Details */}
        <div className="bg-base-200 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">About this position:</h3>
          <p className="text-sm text-base-content/70 mb-3 line-clamp-3">
            {job.job_description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-outline">
              {job.required_experience_years} years required
            </span>
            {job.tags?.map((tag, idx) => (
              <span key={idx} className="badge badge-ghost badge-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Full Name *</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input input-bordered w-full"
              required
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email *</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Phone</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input input-bordered w-full"
              />
            </div>
          </div>

          {/* DOB & Experience */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Date of Birth</span>
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Years of Experience *</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                className="input input-bordered w-full"
                required
              />
            </div>
          </div>

          {/* Cover Letter */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Cover Letter / Additional Details</span>
            </label>
            <textarea
              value={formData.detail_box}
              onChange={(e) => setFormData({ ...formData, detail_box: e.target.value })}
              rows={5}
              className="textarea textarea-bordered w-full"
              placeholder="Tell us why you're a great fit for this role..."
            />
          </div>

          {/* Resume Upload */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Resume (PDF only) *</span>
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleResumeChange}
              className="file-input file-input-bordered w-full"
              id="resume-upload"
              disabled={loading}
            />
            {resume && (
              <label className="label">
                <span className="label-text-alt text-success">
                  <FileText size={14} className="inline mr-1" />
                  {resume.name} ({(resume.size / 1024).toFixed(2)} KB)
                </span>
              </label>
            )}
          </div>

          {/* Submit Button */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !resume}
              className="btn btn-primary"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              <span>{loading ? 'Submitting...' : 'Submit Application'}</span>
            </button>
          </div>

          {loading && (
            <div className="alert alert-info">
              <span className="text-sm">Uploading resume and analyzing with AI... This may take a moment.</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}