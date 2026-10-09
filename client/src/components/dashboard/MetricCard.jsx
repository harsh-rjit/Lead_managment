import React from 'react';

export default function MetricCard({
  title,
  value,
  subvalue,
  icon: Icon,
  colorScheme = 'indigo',
  badgeText,
}) {
  const schemes = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      badge: 'bg-indigo-100 text-indigo-800',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      badge: 'bg-purple-100 text-purple-800',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      badge: 'bg-rose-100 text-rose-800',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      badge: 'bg-amber-100 text-amber-800',
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      badge: 'bg-slate-200 text-slate-800',
    },
  };

  const scheme = schemes[colorScheme] || schemes.indigo;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-sm transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${scheme.bg} ${scheme.border} ${scheme.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </span>
          {badgeText && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${scheme.badge}`}>
              {badgeText}
            </span>
          )}
        </div>
        {subvalue && (
          <p className="text-xs text-slate-500 mt-1 font-medium">{subvalue}</p>
        )}
      </div>
    </div>
  );
}
