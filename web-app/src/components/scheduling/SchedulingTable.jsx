'use client';

import { useState } from 'react';
import { Calendar, Video, Edit2, Trash2, ExternalLink } from 'lucide-react';

export default function SchedulingTable({ schedules, onEdit, onDelete }) {
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      scheduled: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-error',
      rescheduled: 'badge-warning',
    };
    return statusStyles[status] || 'badge-ghost';
  };

  const isPastInterview = (dateString) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Job Title</th>
            <th>Interview Time</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {schedules.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center text-base-content/50">
                No scheduled interviews found
              </td>
            </tr>
          ) : (
            schedules.map((schedule) => (
              <tr key={schedule.scheduling_id}>
                <td>
                  <div>
                    <div className="font-semibold">{schedule.full_name}</div>
                    <div className="text-sm text-base-content/70">{schedule.email}</div>
                  </div>
                </td>
                <td>{schedule.job_title}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-base-content/50" />
                    <span className={isPastInterview(schedule.interview_time) ? 'text-base-content/50' : ''}>
                      {formatDateTime(schedule.interview_time)}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(schedule.status)}`}>
                    {schedule.status}
                  </span>
                </td>
                <td>
                  <div className="max-w-xs truncate text-sm text-base-content/70">
                    {schedule.notes || 'No notes'}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    {schedule.meet_link && (
                      <a
                        href={schedule.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary"
                        title="Open Google Meet"
                      >
                        <Video size={16} />
                      </a>
                    )}
                    <button
                      onClick={() => onEdit(schedule)}
                      className="btn btn-sm btn-ghost"
                      title="Edit Schedule"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(schedule.scheduling_id)}
                      className="btn btn-sm btn-ghost text-error"
                      title="Delete Schedule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
