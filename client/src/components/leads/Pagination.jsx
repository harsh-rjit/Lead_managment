import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  hasNextPage,
  hasPrevPage,
  onPageChange,
}) {
  if (total === 0) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-slate-200 text-xs text-slate-500">
      <div>
        Showing <span className="font-semibold text-slate-800">{startRecord}</span> to{' '}
        <span className="font-semibold text-slate-800">{endRecord}</span> of{' '}
        <span className="font-semibold text-slate-800">{total}</span> leads
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>

        <span className="px-3 py-1.5 rounded-lg bg-slate-50 font-semibold text-slate-800">
          Page {page} of {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
