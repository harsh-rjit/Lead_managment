import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${
            i === lines - 1 ? 'w-2/3' : i % 2 === 0 ? 'w-full' : 'w-5/6'
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse shadow-xs ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-1/2" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6, className = '' }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs ${className}`}
      aria-hidden="true"
    >
      {/* Header bar skeleton */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>

      {/* Row skeletons */}
      <div className="divide-y divide-slate-100 p-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-3.5 flex-1 ${c === 0 ? 'w-1/3 font-bold' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
};
