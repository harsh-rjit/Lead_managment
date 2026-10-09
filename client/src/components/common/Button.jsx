import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs focus-visible:ring-indigo-500',
  secondary:
    'bg-slate-900 hover:bg-slate-800 text-white shadow-xs focus-visible:ring-slate-900',
  outline:
    'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs focus-visible:ring-slate-400',
  ghost:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-400',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-rose-500',
  dangerOutline:
    'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 focus-visible:ring-rose-400',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-emerald-500',
  subtle:
    'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 focus-visible:ring-indigo-500',
};

const SIZES = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5 font-medium',
  sm: 'px-3.5 py-1.5 text-xs rounded-xl gap-1.5 font-semibold',
  md: 'px-4 py-2 text-xs sm:text-sm rounded-xl gap-2 font-semibold',
  lg: 'px-5 py-2.5 text-sm sm:text-base rounded-xl gap-2.5 font-semibold',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon = null,
  rightIcon: RightIcon = null,
  className = '',
  onClick,
  ...props
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-all cursor-pointer select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${variantClass} ${sizeClass} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      ) : null}

      {children && <span>{children}</span>}

      {!loading && RightIcon && (
        <RightIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}
