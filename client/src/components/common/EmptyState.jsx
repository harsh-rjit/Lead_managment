import React from 'react';
import { Inbox, Plus } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no items to display matching your criteria.',
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  return (
    <div className="py-16 px-4 text-center max-w-sm mx-auto space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
