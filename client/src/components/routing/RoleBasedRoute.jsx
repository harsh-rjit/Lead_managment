import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasRole } from '../../utils/rbac';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * Route Guard enforcing Role-Based Access Control on the frontend.
 * Note: Even if a malicious user bypasses this React check,
 * the backend middleware (authorizeRoles) strictly blocks unauthorized API calls with HTTP 403.
 *
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Permitted roles (e.g. ['admin'])
 */
export default function RoleBasedRoute({ allowedRoles = [] }) {
  const { user } = useAuth();

  const authorized = hasRole(user, allowedRoles);

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Restricted Access</h1>
          <p className="text-slate-600 text-sm">
            Your current role is <strong className="text-slate-800 capitalize font-mono">'{user?.role}'</strong>. This section requires <strong className="text-indigo-600">{allowedRoles.join(' or ')}</strong> privileges.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
