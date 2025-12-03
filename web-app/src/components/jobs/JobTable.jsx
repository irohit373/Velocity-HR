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
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Experience
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No jobs posted yet. Click "Add New Job" to get started.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.job_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {job.job_title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {job.location || 'Remote'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {job.required_experience_years} years
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(job.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(job.job_id, job.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        job.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/recruitment/${job.job_id}`)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Applicants"
                      >
                        <Users size={18} />
                      </button>
                      <button
                        onClick={() => setEditingJob(job)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Edit Job"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(job.job_id)}
                        className="text-red-600 hover:text-red-800"
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