'use client';

import { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';

export default function EditScheduleModal({ isOpen, onClose, onSubmit, schedule }) {
  const [formData, setFormData] = useState({
    interview_date: '',
    interview_time: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  // Populate form when schedule changes
  useEffect(() => {
    if (schedule) {
      const date = new Date(schedule.interview_time);
      setFormData({
        interview_date: date.toISOString().split('T')[0],
        interview_time: date.toTimeString().slice(0, 5),
        notes: schedule.notes || '',
      });
    }
  }, [schedule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dateTime = `${formData.interview_date}T${formData.interview_time}:00`;
      const interview_time = new Date(dateTime).toISOString();

      await onSubmit({
        scheduling_id: schedule.scheduling_id,
        interview_time,
        notes: formData.notes,
      });

      onClose();
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !schedule) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar size={20} />
            Edit Schedule
          </h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-base-200 rounded-lg">
          <div className="font-semibold">{schedule.full_name}</div>
          <div className="text-sm text-base-content/70">{schedule.email}</div>
          <div className="text-sm text-base-content/70">{schedule.job_title}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Notes</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="textarea textarea-bordered h-24"
              placeholder="Add any special instructions or topics to discuss..."
            />
          </div>

          <div className="modal-action">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Updating...
                </>
              ) : (
                'Update Schedule'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
