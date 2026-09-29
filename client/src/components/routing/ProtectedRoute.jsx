import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Verifying session credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to /login while preserving target route in history state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
