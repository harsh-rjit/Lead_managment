import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_STYLES = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: 'text-emerald-600',
    close: 'text-emerald-600 hover:bg-emerald-100',
  },
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: 'text-rose-600',
    close: 'text-rose-600 hover:bg-rose-100',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: 'text-amber-600',
    close: 'text-amber-600 hover:bg-amber-100',
  },
  info: {
    container: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    icon: 'text-indigo-600',
    close: 'text-indigo-600 hover:bg-indigo-100',
  },
};

export default function Toast({ id, type = 'info', title, message, onDismiss }) {
  const styles = TOAST_STYLES[type] || TOAST_STYLES.info;
  const Icon = TOAST_ICONS[type] || TOAST_ICONS.info;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-xl border p-4 shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${styles.container}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${styles.icon}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-xs font-bold leading-tight mb-0.5">{title}</h4>}
        <p className="text-xs leading-relaxed">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className={`p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer ${styles.close}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
