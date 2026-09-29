import React from 'react';
import { Search, X, Filter } from 'lucide-react';

export default function LeadFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
}) {
  const hasActiveFilters =
    filters.search ||
    filters.status !== '' ||
    filters.priority !== '' ||
    filters.source !== '';

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search leads by name, email, company, or requirement..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-indigo-600 focus:outline-none placeholder:text-slate-400"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="won">Closed Won</option>
            <option value="lost">Closed Lost</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* Source Filter */}
          <select
            value={filters.source}
            onChange={(e) => onFilterChange('source', e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="">All Sources</option>
            <option value="manual">Manual Entry</option>
            <option value="csv">CSV Import</option>
            <option value="website">Website Form</option>
            <option value="referral">Referral</option>
            <option value="linkedin">LinkedIn</option>
            <option value="other">Other</option>
          </select>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer whitespace-nowrap"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
