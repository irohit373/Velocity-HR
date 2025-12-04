'use client';

import { X, Eye, Mail, Phone, Calendar, Briefcase } from 'lucide-react';

// Modal component to display detailed applicant information
// Shows contact info, AI analysis, cover letter, and resume download
export default function ApplicantModal({ applicant, onClose }) {
  // Format date to readable string (e.g., "January 15, 2024")
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{applicant.full_name}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-base-content/70">
              <Mail size={18} />
              <span>{applicant.email}</span>
            </div>
            {applicant.phone && (
              <div className="flex items-center space-x-2 text-base-content/70">
                <Phone size={18} />
                <span>{applicant.phone}</span>
              </div>
            )}
            {applicant.dob && (
              <div className="flex items-center space-x-2 text-base-content/70">
                <Calendar size={18} />
                <span>DOB: {formatDate(applicant.dob)}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-base-content/70">
              <Briefcase size={18} />
              <span>{applicant.experience_years} years experience</span>
            </div>
          </div>

          {/* AI Score */}
          {applicant.ai_generated_score && (
            <div className="alert alert-info">
              <div>
                <h3 className="font-semibold mb-2">AI Match Score</h3>
                <div className="flex items-center space-x-2">
                  <div className="text-3xl font-bold">
                    {Number(applicant.ai_generated_score).toFixed(1)}
                  </div>
                  <span className="text-base-content/70">/ 100</span>
                </div>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {applicant.ai_generated_summary && (
            <div>
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-base-content/70 whitespace-pre-line">
                {applicant.ai_generated_summary}
              </p>
            </div>
          )}

          {/* Cover Letter */}
          {applicant.detail_box && (
            <div>
              <h3 className="font-semibold mb-2">Cover Letter</h3>
              <p className="text-base-content/70 whitespace-pre-line">
                {applicant.detail_box}
              </p>
            </div>
          )}

          {/* Resume Download */}
          <div>
            <a
              href={applicant.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success gap-2"
            >
              <Eye size={18} />
              View Resume
            </a>
          </div>

          {/* Applied Date */}
          <div className="text-sm text-base-content/50">
            Applied on {formatDate(applicant.applied_at)}
          </div>
        </div>

        <div className="modal-action">
          <button onClick={onClose} className="btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}