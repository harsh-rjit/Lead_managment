import React from 'react';

/**
 * Reusable Status, Priority, and Source Badge
 */
export function StatusBadge({ status }) {
  const styles = {
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    contacted: 'bg-amber-50 text-amber-700 border-amber-200',
    qualified: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    proposal_sent: 'bg-purple-50 text-purple-700 border-purple-200',
    won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    lost: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const labels = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    proposal_sent: 'Proposal Sent',
    won: 'Closed Won',
    lost: 'Closed Lost',
  };

  const style = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-sky-50 text-sky-700 border-sky-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
  };

  const style = styles[priority] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${style}`}>
      {priority}
    </span>
  );
}

export function SourceBadge({ source }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
      {source}
    </span>
  );
}

export default {
  StatusBadge,
  PriorityBadge,
  SourceBadge,
};
