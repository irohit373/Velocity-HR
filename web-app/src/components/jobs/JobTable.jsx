'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Users, Eye } from 'lucide-react';
import EditJobModal from './EditJobModal';

export default function JobTable({ initialJobs }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [editingJob, setEditingJob] = useState(null);
  const router = useRouter();

  const handleToggleActive = async (jobId, currentStatus) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        setJobs(jobs.map(job => 
          job.job_id === jobId ? { ...job, is_active: !currentStatus } : job
        ));
      }
    } catch (error) {
      console.error('Failed to toggle job status:', error);
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job? All applications will be lost.')) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setJobs(jobs.filter(job => job.job_id !== jobId));
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Experience</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-base-content/50">
                  No jobs posted yet. Click "Add New Job" to get started.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.job_id}>
                  <td>
                    <div>
                      <div className="font-medium">
                        {job.job_title}
                      </div>
                      <div className="text-sm text-base-content/50">
                        {job.location || 'Remote'}
                      </div>
                    </div>
                  </td>
                  <td>
                    {job.required_experience_years} years
                  </td>
                  <td className="text-base-content/70">
                    {formatDate(job.created_at)}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(job.job_id, job.is_active)}
                      className={`badge cursor-pointer ${
                        job.is_active
                          ? 'badge-success badge-outline'
                          : 'badge-ghost'
                      }`}
                    >
                      {job.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/recruitment/${job.job_id}`)}
                        className="btn btn-ghost btn-sm"
                        title="View Applicants"
                      >
                        <Users size={18} />
                      </button>
                      <button
                        onClick={() => setEditingJob(job)}
                        className="btn btn-ghost btn-sm"
                        title="Edit Job"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(job.job_id)}
                        className="btn btn-ghost btn-sm text-error"
                        title="Delete Job"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onUpdate={(updatedJob) => {
            setJobs(jobs.map(j => j.job_id === updatedJob.job_id ? updatedJob : j));
            setEditingJob(null);
          }}
        />
      )}
    </>
  );
}