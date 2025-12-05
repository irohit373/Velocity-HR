'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    minExperience: '',
    maxExperience: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter((job) => {
    // Search filter (title, tags, location)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      job.job_title?.toLowerCase().includes(searchLower) ||
      job.location?.toLowerCase().includes(searchLower) ||
      job.tags?.some(tag => tag.toLowerCase().includes(searchLower));

    // Location filter
    const matchesLocation = !filters.location || 
      job.location?.toLowerCase().includes(filters.location.toLowerCase());

    // Experience filter
    const matchesMinExp = !filters.minExperience || 
      job.required_experience_years >= parseInt(filters.minExperience);
    const matchesMaxExp = !filters.maxExperience || 
      job.required_experience_years <= parseInt(filters.maxExperience);

    return matchesSearch && matchesLocation && matchesMinExp && matchesMaxExp;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      location: '',
      minExperience: '',
      maxExperience: '',
    });
  };

  const hasActiveFilters = searchTerm || filters.location || filters.minExperience || filters.maxExperience;

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Open Positions</h1>
          <p className="text-xl text-base-content/70">
            Find your next opportunity
          </p>
        </div>

        {/* Search Bar */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="form-control flex-1">
                <div className="join w-full">
                  <span className="btn btn-ghost join-item pointer-events-none">
                    <Search size={20} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by job title, tags, or location..."
                    className="input input-bordered join-item flex-1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-ghost join-item"
                      onClick={() => setSearchTerm('')}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
              <button
                className={`btn btn-outline gap-2 ${showFilters ? 'btn-active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={20} />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && <span className="badge badge-primary badge-sm">•</span>}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="divider my-2"></div>
            )}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Location</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., New York, Remote"
                    className="input input-bordered input-sm"
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Min Experience (years)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    className="input input-bordered input-sm"
                    value={filters.minExperience}
                    onChange={(e) => setFilters({...filters, minExperience: e.target.value})}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Max Experience (years)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="20"
                    min="0"
                    className="input input-bordered input-sm"
                    value={filters.maxExperience}
                    onChange={(e) => setFilters({...filters, maxExperience: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex justify-end mt-4">
                <button
                  className="btn btn-ghost btn-sm gap-2"
                  onClick={clearFilters}
                >
                  <X size={16} />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-center">
          <p className="text-base-content/70">
            Showing <span className="font-semibold text-primary">{filteredJobs.length}</span> of <span className="font-semibold">{jobs.length}</span> jobs
          </p>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={job.job_id} job={job} />
          ))}
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-base-content/50 text-lg mb-4">
              {hasActiveFilters 
                ? 'No jobs match your search criteria. Try adjusting your filters.'
                : 'No open positions at the moment. Check back soon!'}
            </p>
            {hasActiveFilters && (
              <button className="btn btn-primary btn-sm" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}