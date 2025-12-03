'use client';

import { X, Download, Mail, Phone, Calendar, Briefcase } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">{applicant.full_name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <Mail size={18} />
              <span>{applicant.email}</span>
            </div>
            {applicant.phone && (
              <div className="flex items-center space-x-2 text-gray-700">
                <Phone size={18} />
                <span>{applicant.phone}</span>
              </div>
            )}
            {applicant.dob && (
              <div className="flex items-center space-x-2 text-gray-700">
                <Calendar size={18} />
                <span>DOB: {formatDate(applicant.dob)}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-gray-700">
              <Briefcase size={18} />
              <span>{applicant.experience_years} years experience</span>
            </div>
          </div>

          {/* AI Score */}
          {applicant.ai_generated_score && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">AI Match Score</h3>
              <div className="flex items-center space-x-2">
                <div className="text-3xl font-bold text-blue-600">
                  {applicant.ai_generated_score.toFixed(1)}
                </div>
                <span className="text-gray-600">/ 100</span>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {applicant.ai_generated_summary && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-gray-700 whitespace-pre-line">
                {applicant.ai_generated_summary}
              </p>
            </div>
          )}

          {/* Cover Letter */}
          {applicant.detail_box && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Cover Letter</h3>
              <p className="text-gray-700 whitespace-pre-line">
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
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              <Download size={18} />
              <span>Download Resume</span>
            </a>
          </div>

          {/* Applied Date */}
          <div className="text-sm text-gray-500">
            Applied on {formatDate(applicant.applied_at)}
          </div>
        </div>
      </div>
    </div>
  );
}