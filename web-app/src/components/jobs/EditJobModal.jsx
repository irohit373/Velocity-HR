'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';

// Modal component for editing existing job postings
// Allows updating job details and triggering AI summary regeneration
export default function EditJobModal({ job, onClose, onUpdate }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    job_title: job.job_title,
    job_description: job.job_description,
    required_experience_years: job.required_experience_years,
    location: job.location || '',
    salary_range: job.salary_range || '',
    tags: Array.isArray(job.tags) ? job.tags.join(', ') : '',
    expiry_date: job.expiry_date 
      ? new Date(job.expiry_date).toISOString().split('T')[0] 
      : '',
    is_active: job.is_active,
  });

  // Submit updated job data to API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert tags string to array
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      const response = await fetch(`/api/jobs/${job.job_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
          required_experience_years: parseInt(formData.required_experience_years.toString()),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update job');
      }

      const { job: updatedJob } = await response.json();
      onUpdate(updatedJob);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Edit Job</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">Job Title *</span>
            </label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Job Description *</span>
            </label>
            <textarea
              value={formData.job_description}
              onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
              rows={6}
              className="textarea textarea-bordered w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Required Experience (Years)</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.required_experience_years}
                onChange={(e) => setFormData({ ...formData, required_experience_years: parseInt(e.target.value) })}
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Location</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input input-bordered w-full"
                placeholder="e.g., Remote, New York, Hybrid"
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Salary Range</span>
            </label>
            <input
              type="text"
              value={formData.salary_range}
              onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
              className="input input-bordered w-full"
              placeholder="e.g., $80,000 - $120,000"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Tags (comma-separated)</span>
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="input input-bordered w-full"
              placeholder="e.g., JavaScript, React, Remote"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Expiry Date</span>
            </label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Job is Active</span>
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="checkbox checkbox-primary"
              />
            </label>
          </div>

          {/* Submit Button */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              <span>{loading ? 'Updating...' : 'Update Job'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}