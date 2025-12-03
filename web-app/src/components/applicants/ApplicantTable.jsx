'use client';

import { useState } from 'react';
import { Eye, Download, Star } from 'lucide-react';
import ApplicantModal from './ApplicantModal.jsx';

// Component to display a table of job applicants with their details
// Allows viewing applicant details and downloading resumes
export default function ApplicantTable({ applicants }) {
  // Track which applicant is selected for viewing in modal
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Format date to readable string (e.g., "Jan 15, 2024")
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Determine color class based on AI score value
  // Green for high scores (80+), yellow for medium (60-79), red for low (<60)
  const getScoreColor = (score) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Experience
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                AI Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Applied
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applicants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No applications yet.
                </td>
              </tr>
            ) : (
              applicants.map((applicant) => (
                <tr
                  key={applicant.applicant_id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedApplicant(applicant)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {applicant.full_name}
                      </div>
                      <div className="text-sm text-gray-500">{applicant.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {applicant.experience_years} years
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center space-x-1 ${getScoreColor(applicant.ai_generated_score)}`}>
                      <Star size={16} fill="currentColor" />
                      <span className="text-sm font-semibold">
                        {applicant.ai_generated_score?.toFixed(1) || 'Pending'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(applicant.applied_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        applicant.status === 'shortlisted'
                          ? 'bg-green-100 text-green-800'
                          : applicant.status === 'reviewed'
                          ? 'bg-blue-100 text-blue-800'
                          : applicant.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {applicant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApplicant(applicant);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <a
                        href={applicant.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-green-600 hover:text-green-800"
                        title="Download Resume"
                      >
                        <Download size={18} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedApplicant && (
        <ApplicantModal
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
        />
      )}
    </>
  );
}