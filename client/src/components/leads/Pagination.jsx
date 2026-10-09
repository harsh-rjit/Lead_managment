import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../common/Button';

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
        <Button
          variant="outline"
          size="xs"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(page - 1)}
          icon={ChevronLeft}
        >
          Previous
        </Button>

        <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200/80 font-semibold text-slate-800 text-xs">
          Page {page} of {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="xs"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
          rightIcon={ChevronRight}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
