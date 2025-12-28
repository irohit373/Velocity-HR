'use client';

import { useState } from 'react';
import { Eye, Download, Star, Calendar } from 'lucide-react';
import ApplicantModal from './ApplicantModal.jsx';

// Component to display a table of job applicants with their details
// Allows viewing applicant details and downloading resumes
export default function ApplicantTable({ applicants }) {
  // Track which applicant is selected for viewing in modal
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  // Track applicants state for live updates
  const [applicantsList, setApplicantsList] = useState(applicants);
  // Track schedule dialog state
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [schedulingApplicant, setSchedulingApplicant] = useState(null);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  // Get default date/time (tomorrow at 10 PM)
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(22, 0, 0, 0); // 10 PM
    
    // Format to datetime-local input format: YYYY-MM-DDTHH:MM
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Open schedule dialog
  const openScheduleDialog = (applicant) => {
    setSchedulingApplicant(applicant);
    setScheduleDateTime(getDefaultDateTime());
    setScheduleDialogOpen(true);
  };

  // Close schedule dialog
  const closeScheduleDialog = () => {
    setScheduleDialogOpen(false);
    setSchedulingApplicant(null);
    setScheduleDateTime('');
    setInterviewNotes('');
  };

  // Move to notes dialog
  const proceedToNotes = () => {
    if (!scheduleDateTime) {
      alert('Please select a date and time');
      return;
    }
    setScheduleDialogOpen(false);
    setNotesDialogOpen(true);
  };

  // Close notes dialog
  const closeNotesDialog = () => {
    setNotesDialogOpen(false);
    setInterviewNotes('');
    // Optionally go back to schedule dialog
  };

  // Handle final schedule submission
  const handleScheduleInterview = async () => {
    if (!scheduleDateTime || !schedulingApplicant) return;

    try {
      const response = await fetch('/api/scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          applicant_id: schedulingApplicant.applicant_id,
          job_id: schedulingApplicant.job_id,
          interview_time: scheduleDateTime,
          notes: interviewNotes || ''
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update applicant status in the list
        setApplicantsList(prevApplicants =>
          prevApplicants.map(app =>
            app.applicant_id === schedulingApplicant.applicant_id
              ? { ...app, status: 'scheduled' }
              : app
          )
        );
        closeNotesDialog();
        closeScheduleDialog();
        alert('Interview scheduled successfully!\nEmail sent to candidate with meeting link.');
      } else {
        const error = await response.json();
        alert(`Failed to schedule interview: ${error.error}`);
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('Error scheduling interview');
    }
  };

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
              <th>Schedule</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applicantsList.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-base-content/50">
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openScheduleDialog(applicant);
                      }}
                      className="btn btn-sm btn-outline btn-info gap-1"
                      title="Schedule Interview"
                    >
                      <Calendar size={16} />
                      Schedule
                    </button>
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

      {/* Schedule Interview Dialog */}
      {scheduleDialogOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Schedule Interview</h3>
            
            {schedulingApplicant && (
              <div className="mb-4 p-3 bg-base-200 rounded-lg">
                <div className="font-semibold">{schedulingApplicant.full_name}</div>
                <div className="text-sm text-base-content/70">{schedulingApplicant.email}</div>
              </div>
            )}

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Interview Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                className="input input-bordered w-full"
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Default: Tomorrow at 10:00 PM
                </span>
              </label>
            </div>

            <div className="modal-action">
              <button onClick={closeScheduleDialog} className="btn btn-ghost">
                Cancel
              </button>
              <button 
                onClick={proceedToNotes} 
                className="btn btn-primary"
                disabled={!scheduleDateTime}
              >
                Next: Add Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Dialog - Step 2 */}
      {notesDialogOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add Interview Notes</h3>
            
            {schedulingApplicant && (
              <div className="mb-4">
                <div className="alert alert-info">
                  <div>
                    <div className="font-semibold">{schedulingApplicant.full_name}</div>
                    <div className="text-sm">
                      {new Date(scheduleDateTime).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Message to Candidate (Optional)</span>
              </label>
              <textarea
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                className="textarea textarea-bordered h-32"
                placeholder="Add any additional information for the candidate...&#10;&#10;Example:&#10;- Please bring your portfolio&#10;- Be prepared to discuss your recent project&#10;- Interview will be conducted by our technical team"
              ></textarea>
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  This message will be included in the email invitation
                </span>
              </label>
            </div>

            <div className="modal-action">
              <button 
                onClick={() => {
                  closeNotesDialog();
                  setScheduleDialogOpen(true);
                }} 
                className="btn btn-ghost"
              >
                Back
              </button>
              <button 
                onClick={handleScheduleInterview} 
                className="btn btn-success gap-2"
              >
                <Calendar size={18} />
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}