'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, Search, X } from 'lucide-react';

export default function CreateScheduleModal({ isOpen, onClose, onSubmit, applicants }) {
  const [formData, setFormData] = useState({
    applicant_id: '',
    job_id: '',
    schedule_type: 'scheduled', // 'now' or 'scheduled'
    interview_date: '',
    interview_time: '',
    notes: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        applicant_id: '',
        job_id: '',
        schedule_type: 'scheduled',
        interview_date: '',
        interview_time: '',
        notes: '',
      });
      setSearchTerm('');
      setShowDropdown(false);
    }
  }, [isOpen]);

  // Get default date (tomorrow)
  const getDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.setDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get default time (10:00 AM)
  const getDefaultTime = () => {
    return '10:00';
  };

  // Filter applicants based on search term
  const filteredApplicants = applicants.filter((applicant) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      applicant.full_name.toLowerCase().includes(searchLower) ||
      applicant.email.toLowerCase().includes(searchLower) ||
      applicant.job_title.toLowerCase().includes(searchLower)
    );
  });

  const handleApplicantSelect = (applicant) => {
    setFormData({
      ...formData,
      applicant_id: applicant.applicant_id,
      job_id: applicant.job_id,
    });
    setSearchTerm(`${applicant.full_name} - ${applicant.job_title}`);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time into ISO string
      let interview_time;
      if (formData.schedule_type === 'now') {
        interview_time = new Date().toISOString();
      } else {
        const dateTime = `${formData.interview_date}T${formData.interview_time}:00`;
        interview_time = new Date(dateTime).toISOString();
      }

      await onSubmit({
        applicant_id: formData.applicant_id,
        job_id: formData.job_id,
        interview_time,
        notes: formData.notes,
      });

      onClose();
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar size={20} />
            Create/Schedule Interview
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Applicant Selection with Search */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Select Applicant</span>
            </label>
            <div className="relative">
              <div className="input input-bordered flex items-center gap-2">
                <Search size={18} className="text-base-content/50" />
                <input
                  type="text"
                  placeholder="Search applicants by name, email, or job..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="grow"
                  required
                />
              </div>

              {/* Dropdown Menu */}
              {showDropdown && filteredApplicants.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredApplicants.map((applicant) => (
                    <div
                      key={applicant.applicant_id}
                      onClick={() => handleApplicantSelect(applicant)}
                      className="px-4 py-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                    >
                      <div className="font-semibold">{applicant.full_name}</div>
                      <div className="text-sm text-base-content/70">{applicant.email}</div>
                      <div className="text-xs text-base-content/50 flex items-center gap-2 mt-1">
                        <span className="badge badge-sm badge-outline">{applicant.job_title}</span>
                        <span className={`badge badge-sm ${
                          applicant.status === 'reviewed' ? 'badge-info' :
                          applicant.status === 'scheduled' ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {applicant.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {filteredApplicants.length === 0 && searchTerm && (
              <label className="label">
                <span className="label-text-alt text-error">No applicants found</span>
              </label>
            )}
          </div>

          {/* Schedule Type */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">When?</span>
            </label>
            <div className="flex gap-4">
              <label className="label cursor-pointer gap-2">
                <input
                  type="radio"
                  name="schedule_type"
                  className="radio"
                  value="now"
                  checked={formData.schedule_type === 'now'}
                  onChange={(e) => setFormData({ ...formData, schedule_type: e.target.value })}
                />
                <span className="label-text">Create Meet Now</span>
              </label>
              <label className="label cursor-pointer gap-2">
                <input
                  type="radio"
                  name="schedule_type"
                  className="radio"
                  value="scheduled"
                  checked={formData.schedule_type === 'scheduled'}
                  onChange={(e) => setFormData({ ...formData, schedule_type: e.target.value })}
                />
                <span className="label-text">Schedule for Later</span>
              </label>
            </div>
          </div>

          {/* Date & Time Selection (only if scheduled) */}
          {formData.schedule_type === 'scheduled' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Date</span>
                </label>
                <input
                  type="date"
                  value={formData.interview_date}
                  onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                  className="input input-bordered"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Time</span>
                </label>
                <input
                  type="time"
                  value={formData.interview_time}
                  onChange={(e) => setFormData({ ...formData, interview_time: e.target.value })}
                  className="input input-bordered"
                  required
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Notes (Optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="textarea textarea-bordered h-24"
              placeholder="Add any special instructions or topics to discuss..."
            />
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.applicant_id}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                'Create Schedule'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
