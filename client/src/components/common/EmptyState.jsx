import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no items to display matching your criteria.',
  actionLabel,
  onAction,
  icon: Icon = Inbox,
  children = null,
  className = '',
}) {
  return (
    <div className={`py-16 px-4 text-center max-w-sm mx-auto space-y-4 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200 shadow-2xs">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-1">
          <Button
            variant="primary"
            size="sm"
            onClick={onAction}
            icon={Plus}
          >
            {actionLabel}
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}
