'use client';

import { useState } from 'react';
import { Eye, Download, Star } from 'lucide-react';
import ApplicantModal from './ApplicantModal.jsx';

// Component to display a table of job applicants with their details
// Allows viewing applicant details and downloading resumes
export default function ApplicantTable({ applicants }) {
  // Track which applicant is selected for viewing in modal
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  // Track applicants state for live updates
  const [applicantsList, setApplicantsList] = useState(applicants);

  // Handle status update from modal
  const handleStatusUpdate = (applicantId, newStatus) => {
    setApplicantsList(prevApplicants =>
      prevApplicants.map(app =>
        app.applicant_id === applicantId
          ? { ...app, status: newStatus }
          : app
      )
    );
    // Update the selected applicant as well to reflect changes in modal
    if (selectedApplicant?.applicant_id === applicantId) {
      setSelectedApplicant({ ...selectedApplicant, status: newStatus });
    }
  };

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

  // Get badge styling based on application status
  // Returns appropriate DaisyUI badge class for each status type
  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    
    switch (statusLower) {
      case 'hired':
        return 'badge-success'; // Green
      case 'scheduled':
        return 'badge-info'; // Blue
      case 'reviewed':
        return 'badge-primary'; // Purple/Primary color
      case 'rejected':
        return 'badge-error'; // Red
      case 'pending':
      default:
        return 'badge-warning'; // Yellow/Orange
    }
  };

  // Format status text for display (capitalize first letter)
  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Name</th>
              <th>Experience</th>
              <th>AI Score</th>
              <th>Applied</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applicantsList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-base-content/50">
                  No applications yet.
                </td>
              </tr>
            ) : (
              applicantsList.map((applicant) => (
                <tr
                  key={applicant.applicant_id}
                  className="hover cursor-pointer"
                  onClick={() => setSelectedApplicant(applicant)}
                >
                  <td>
                    <div>
                      <div className="font-medium">
                        {applicant.full_name}
                      </div>
                      <div className="text-sm text-base-content/50">{applicant.email}</div>
                    </div>
                  </td>
                  <td>
                    {applicant.experience_years} years
                  </td>
                  <td>
                    <div className={`flex items-center space-x-1 ${getScoreColor(applicant.ai_generated_score)}`}>
                      <Star size={16} fill="currentColor" />
                      <span className="text-sm font-semibold">
                        {applicant.ai_generated_score ? Number(applicant.ai_generated_score).toFixed(1) : 'Pending'}
                      </span>
                    </div>
                  </td>
                  <td className="text-base-content/70">
                    {formatDate(applicant.applied_at)}
                  </td>
                  <td>
                    <span
                      className={`badge ${getStatusBadge(applicant.status)}`}
                    >
                      {formatStatus(applicant.status)}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApplicant(applicant);
                        }}
                        className="btn btn-ghost btn-sm"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <a
                        href={applicant.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-ghost btn-sm text-success"
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
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </>
  );
}