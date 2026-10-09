import React from 'react';

export function TableContainer({ children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({ children, className = '', ...props }) {
  return (
    <table className={`w-full text-left border-collapse ${className}`} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead
      className={`border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody className={`divide-y divide-slate-100 text-xs text-slate-700 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', isClickable = false, ...props }) {
  return (
    <tr
      className={`transition-colors ${
        isClickable ? 'hover:bg-slate-50/80 cursor-pointer' : 'hover:bg-slate-50/50'
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', align = 'left', ...props }) {
  const alignment =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <th
      scope="col"
      className={`py-3.5 px-4 sm:px-6 font-bold text-slate-500 select-none ${alignment} ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', align = 'left', ...props }) {
  const alignment =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <td className={`py-3.5 px-4 sm:px-6 ${alignment} ${className}`} {...props}>
      {children}
    </td>
  );
}

export default {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
};
