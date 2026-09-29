import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="py-20 text-center max-w-md mx-auto space-y-4">
      <div className="text-6xl font-black text-indigo-600">404</div>
      <h2 className="text-2xl font-bold text-slate-900">Page Not Found</h2>
      <p className="text-slate-600 text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition"
      >
        <Home className="w-4 h-4" />
        Return to System Health
      </Link>
    </div>
  );
}
