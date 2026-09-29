import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdmin, isManager, isSales } from '../utils/rbac';
import { testProtectedEndpoint } from '../api/authApi';
import { getUsers } from '../api/userApi';
import { getOrgSettings } from '../api/organizationApi';
import { getTeamLeads, getMyLeads } from '../api/leadApi';
import {
  ShieldCheck,
  Building2,
  User,
  Key,
  LogOut,
  Send,
  CheckCircle2,
  Sparkles,
  Users,
  Settings,
  Briefcase,
  AlertTriangle,
  Loader2,
  XCircle,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, organization, token, logout } = useAuth();

  // RBAC test states
  const [rbacTestResult, setRbacTestResult] = useState(null);
  const [rbacLoading, setRbacLoading] = useState(false);

  const runRbacTest = async (testName, apiCall, requiredRole) => {
    setRbacLoading(true);
    setRbacTestResult(null);

    try {
      const response = await apiCall();
      setRbacTestResult({
        testName,
        requiredRole,
        success: true,
        statusCode: 200,
        message: 'Access Granted: Backend authorization check passed!',
        data: response.data,
      });
    } catch (err) {
      setRbacTestResult({
        testName,
        requiredRole,
        success: false,
        statusCode: err.status || 403,
        message: err.message || 'Access Forbidden: Backend blocked this action.',
        data: err.data || null,
      });
    } finally {
      setRbacLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-100">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Welcome back, {user?.name}!
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  user?.role === 'admin'
                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                    : user?.role === 'manager'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}
              >
                {user?.role} Role
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              {organization?.name} ({organization?.slug}) • Tier:{' '}
              <span className="font-semibold capitalize text-slate-700">{organization?.plan}</span>
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 text-sm font-medium transition cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Role-Based Features Grid (UI Adaptation based on Role) */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
          Permitted Role Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Admin Feature: Team Management */}
          {isAdmin(user) ? (
            <Link
              to="/team"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Admin Only
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  Team Management
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Invite employees, assign roles (Admin, Manager, Sales).
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600">
                Manage Team <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-100/60 border border-slate-200/60 opacity-60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                  Admin Only
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-700">Team Management</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Hidden / Restricted for your role ({user?.role}).
                </p>
              </div>
            </div>
          )}

          {/* Admin Feature: Organization Settings */}
          {isAdmin(user) ? (
            <Link
              to="/settings"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Admin Only
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  Organization Settings
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Company branding, lead auto-assignment & AI tones.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600">
                Configure Settings <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-100/60 border border-slate-200/60 opacity-60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                  Admin Only
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-700">Organization Settings</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Restricted: Managers & Sales cannot alter company settings.
                </p>
              </div>
            </div>
          )}

          {/* Manager & Admin Feature: Team Leads Pipeline */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {isAdmin(user) || isManager(user) ? 'Available' : 'Manager Only'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Team Leads Pipeline</h3>
              <p className="text-xs text-slate-500 mt-1">
                {isAdmin(user) || isManager(user)
                  ? 'Access to company-wide leads across all sales reps.'
                  : 'Restricted: Sales reps only access their assigned leads.'}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Link
                to="/leads"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                Open Lead Pipeline <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
              <button
                onClick={() => runRbacTest('Team Leads', getTeamLeads, 'admin, manager')}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 text-left cursor-pointer"
              >
                Verify Backend RBAC Check →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive RBAC Live Backend Enforcement Tester */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Live Backend RBAC Enforcement Console
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Click any action below. Every button makes an actual HTTP request to the Express backend.
            Notice how the backend intercepts unauthorized roles with an explicit <strong>HTTP 403 Forbidden</strong> response.
          </p>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => runRbacTest('Manage Users', getUsers, 'admin')}
            disabled={rbacLoading}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition cursor-pointer"
          >
            <div className="text-[10px] font-bold uppercase text-purple-700">Admin Only</div>
            <div className="font-semibold text-xs text-slate-900 mt-1">GET /api/v1/users</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Manage Team Members</div>
          </button>

          <button
            onClick={() => runRbacTest('Org Settings', getOrgSettings, 'admin')}
            disabled={rbacLoading}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition cursor-pointer"
          >
            <div className="text-[10px] font-bold uppercase text-purple-700">Admin Only</div>
            <div className="font-semibold text-xs text-slate-900 mt-1">GET /organization/settings</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Tenant Configurations</div>
          </button>

          <button
            onClick={() => runRbacTest('Team Leads', getTeamLeads, 'admin, manager')}
            disabled={rbacLoading}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition cursor-pointer"
          >
            <div className="text-[10px] font-bold uppercase text-blue-700">Admin & Manager</div>
            <div className="font-semibold text-xs text-slate-900 mt-1">GET /api/v1/leads/team</div>
            <div className="text-[11px] text-slate-500 mt-0.5">All Organization Leads</div>
          </button>

          <button
            onClick={() => runRbacTest('My Leads', getMyLeads, 'admin, manager, sales')}
            disabled={rbacLoading}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition cursor-pointer"
          >
            <div className="text-[10px] font-bold uppercase text-emerald-700">All Roles</div>
            <div className="font-semibold text-xs text-slate-900 mt-1">GET /api/v1/leads/my-leads</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Assigned Personal Leads</div>
          </button>
        </div>

        {/* Live Test Feedback Banner */}
        {rbacTestResult && (
          <div
            className={`p-4 rounded-xl border space-y-2 animate-in fade-in duration-150 ${
              rbacTestResult.success
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold">
                {rbacTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>
                  {rbacTestResult.testName} &bull; HTTP {rbacTestResult.statusCode}{' '}
                  {rbacTestResult.success ? 'OK' : 'FORBIDDEN'}
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                User Role: {user?.role}
              </span>
            </div>

            <p className="text-xs">{rbacTestResult.message}</p>

            {rbacTestResult.data && (
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs overflow-x-auto mt-2">
                {JSON.stringify(rbacTestResult.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
