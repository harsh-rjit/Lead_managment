import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { testProtectedEndpoint } from '../api/authApi';
import {
  ShieldCheck,
  Building2,
  User,
  Key,
  LogOut,
  Send,
  CheckCircle2,
  Sparkles,
  Clock,
  Loader2,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, organization, token, logout } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState(null);

  const handleTestProtected = async () => {
    setTestLoading(true);
    setTestError(null);
    try {
      const data = await testProtectedEndpoint();
      setTestResult(data);
    } catch (err) {
      setTestError(err.message || 'Protected route verification failed.');
    } finally {
      setTestLoading(false);
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
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              {organization?.name} ({organization?.slug}) • Plan: <span className="font-semibold capitalize text-slate-700">{organization?.plan}</span>
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

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Identity Context Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Authenticated User Identity
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">User ID</span>
              <span className="font-mono text-slate-800 font-semibold">{user?.id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Work Email</span>
              <span className="font-mono text-slate-800 font-semibold">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Role</span>
              <span className="font-semibold text-indigo-700 capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Account Status</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Tenant Context Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Tenant Context (Multi-Tenancy)
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Organization ID</span>
              <span className="font-mono text-slate-800 font-semibold">{organization?.id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Organization Name</span>
              <span className="font-semibold text-slate-800">{organization?.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Tenant Slug</span>
              <span className="font-mono text-slate-800 font-semibold">{organization?.slug}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">SaaS Tier</span>
              <span className="font-semibold capitalize text-indigo-700">{organization?.plan} Plan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Protected Route Verification Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              Verify Protected Route Middleware
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Dispatches an authenticated request to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">GET /api/v1/auth/protected-test</code> with your Bearer token.
            </p>
          </div>
          <button
            onClick={handleTestProtected}
            disabled={testLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            {testLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {testLoading ? 'Verifying...' : 'Call Protected Route'}
          </button>
        </div>

        {testError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <strong>Verification Error:</strong> {testError}
          </div>
        )}

        {testResult && (
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {testResult.message}
            </div>
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Server Decoded req.user Claims:</span>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Current JWT Token Preview */}
        <div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Current JWT in LocalStorage (Header.Payload.Signature)
          </span>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-600 break-all select-all">
            {token}
          </div>
        </div>
      </div>
    </div>
  );
}
