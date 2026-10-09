import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

const Select = forwardRef(function Select(
  {
    label,
    id,
    name,
    options = [],
    children,
    required = false,
    error,
    helperText,
    className = '',
    selectClassName = '',
    disabled = false,
    ...props
  },
  ref
) {
  const selectId = id || name;
  const errorId = error ? `${selectId}-error` : undefined;
  const helperId = helperText ? `${selectId}-helper` : undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        name={name}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId || helperId}
        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white transition-colors focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer ${
          error
            ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
            : 'border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
        } ${selectClassName}`}
        {...props}
      >
        {options.length > 0
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>

      {error ? (
        <div id={errorId} role="alert" className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
