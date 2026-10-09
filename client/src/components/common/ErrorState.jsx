import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while processing your request.',
  onRetry = null,
  retryLabel = 'Try Again',
  icon: Icon = AlertCircle,
  className = '',
}) {
  return (
    <div className={`py-12 px-6 text-center max-w-md mx-auto space-y-4 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-2xs">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            icon={RefreshCw}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
