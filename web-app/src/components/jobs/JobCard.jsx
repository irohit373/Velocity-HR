'use client';

import { useState } from 'react';
import { MapPin, Briefcase, DollarSign, Calendar } from 'lucide-react';
import ApplyJobModal from './ApplyJobModal';

// Component to display individual job posting card
// Shows job details and allows users to apply
export default function JobCard({ job }) {
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Format date to readable string (e.g., "Jan 15, 2024")
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{job.job_title}</h3>

        <div className="space-y-2 mb-4">
          {job.location && (
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin size={16} className="mr-2" />
              {job.location}
            </div>
          )}
          <div className="flex items-center text-gray-600 text-sm">
            <Briefcase size={16} className="mr-2" />
            {job.required_experience_years} years experience
          </div>
          {job.salary_range && (
            <div className="flex items-center text-gray-600 text-sm">
              <DollarSign size={16} className="mr-2" />
              {job.salary_range}
            </div>
          )}
          <div className="flex items-center text-gray-600 text-sm">
            <Calendar size={16} className="mr-2" />
            Posted {formatDate(job.created_at)}
          </div>
        </div>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {job.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Summary */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {job.ai_generated_summary || job.job_description}
        </p>

        <button
          onClick={() => setIsApplyOpen(true)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Apply Now
        </button>
      </div>

      {isApplyOpen && (
        <ApplyJobModal
          job={job}
          onClose={() => setIsApplyOpen(false)}
        />
      )}
    </>
  );
}