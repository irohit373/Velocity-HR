'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, RefreshCw } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import SchedulingTable from '@/components/scheduling/SchedulingTable';
import CreateScheduleModal from '@/components/scheduling/CreateScheduleModal';
import EditScheduleModal from '@/components/scheduling/EditScheduleModal';

export default function SchedulingPage() {
  const user = useUser();
  const [schedules, setSchedules] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch schedules from API
  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/scheduling');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  // Fetch eligible applicants
  const fetchApplicants = async () => {
    try {
      const response = await fetch('/api/applicants/eligible');
      if (response.ok) {
        const data = await response.json();
        setApplicants(data.applicants || []);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchSchedules(), fetchApplicants()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Handle create schedule
  const handleCreateSchedule = async (scheduleData) => {
    try {
      const response = await fetch('/api/scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create schedule');
      }

      // Refresh data
      await Promise.all([fetchSchedules(), fetchApplicants()]);
      setCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert(error.message);
      throw error;
    }
  };

  // Handle edit schedule
  const handleEditSchedule = async (scheduleData) => {
    try {
      const response = await fetch(`/api/scheduling/${scheduleData.scheduling_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update schedule');
      }

      // Refresh schedules
      await fetchSchedules();
      setEditModalOpen(false);
      setSelectedSchedule(null);
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert(error.message);
      throw error;
    }
  };

  // Handle delete schedule
  const handleDeleteSchedule = async (schedulingId) => {
    if (!confirm('Are you sure you want to delete this schedule? The candidate will not be notified.')) {
      return;
    }

    try {
      const response = await fetch(`/api/scheduling/${schedulingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete schedule');
      }

      // Refresh data
      await Promise.all([fetchSchedules(), fetchApplicants()]);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert(error.message);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSchedules(), fetchApplicants()]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar size={32} className="text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Interview Scheduling</h1>
              <p className="text-base-content/70">
                Manage and schedule interviews with candidates
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className={`btn btn-ghost gap-2 ${refreshing ? 'loading' : ''}`}
              disabled={refreshing}
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn btn-primary gap-2"
            >
              <Plus size={18} />
              Create/Schedule Meet
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Total Scheduled</div>
            <div className="stat-value text-primary">{schedules.length}</div>
          </div>
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Upcoming</div>
            <div className="stat-value text-info">
              {schedules.filter(s => new Date(s.interview_time) > new Date()).length}
            </div>
          </div>
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Completed</div>
            <div className="stat-value text-success">
              {schedules.filter(s => new Date(s.interview_time) < new Date()).length}
            </div>
          </div>
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-title">Eligible Applicants</div>
            <div className="stat-value text-accent">{applicants.length}</div>
          </div>
        </div>

        {/* Schedules Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Scheduled Interviews</h2>
            <SchedulingTable
              schedules={schedules}
              onEdit={(schedule) => {
                setSelectedSchedule(schedule);
                setEditModalOpen(true);
              }}
              onDelete={handleDeleteSchedule}
            />
          </div>
        </div>

        {/* Modals */}
        <CreateScheduleModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSchedule}
          applicants={applicants}
        />

        <EditScheduleModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedSchedule(null);
          }}
          onSubmit={handleEditSchedule}
          schedule={selectedSchedule}
        />
      </div>
    </div>
  );
} 