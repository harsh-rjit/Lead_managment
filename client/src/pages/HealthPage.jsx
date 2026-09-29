import React, { useState, useEffect } from 'react';
import { checkHealth } from '../api/healthApi';
import { 
  Server, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Clock, 
  Globe, 
  Cpu, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HealthPage() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkHealth();
      setHealthData(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server.');
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Connection & Health
          </h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Live communication status between the React frontend and Express backend.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-medium text-sm shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Ping Backend'}
        </button>
      </div>

      {/* Main Connection Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Status Header Banner */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                loading
                  ? 'bg-amber-50 text-amber-600'
                  : error
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {loading ? (
                <Activity className="w-6 h-6 animate-pulse" />
              ) : error ? (
                <XCircle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {loading
                    ? 'Probing Backend Service...'
                    : error
                    ? 'Backend Unreachable'
                    : 'Backend Connected & Healthy'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    loading
                      ? 'bg-amber-100 text-amber-800'
                      : error
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      loading
                        ? 'bg-amber-500 animate-ping'
                        : error
                        ? 'bg-rose-500'
                        : 'bg-emerald-500 animate-pulse'
                    }`}
                  ></span>
                  {loading ? 'Checking' : error ? 'Offline' : 'Online'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Endpoint: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">GET /api/health</code>
                {lastChecked && ` • Last checked at ${lastChecked}`}
              </p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          {loading && !healthData && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-slate-600 text-sm font-medium">
                Sending HTTP GET request via Axios...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-5 text-rose-900 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-rose-800">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                Connection Error Details
              </div>
              <p className="text-sm font-mono bg-white/70 p-3 rounded-lg border border-rose-100 text-rose-700">
                {error}
              </p>
              <div className="text-xs space-y-1 text-rose-800">
                <p className="font-semibold">Quick Troubleshooting:</p>
                <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                  <li>Make sure the Express server is running: <code className="bg-rose-100 px-1 rounded">npm run dev</code> inside <code className="bg-rose-100 px-1 rounded">/server</code></li>
                  <li>Verify the backend is listening on port 5000: <code className="bg-rose-100 px-1 rounded">http://localhost:5000/api/health</code></li>
                  <li>Confirm CORS allows <code className="bg-rose-100 px-1 rounded">http://localhost:5173</code></li>
                </ul>
              </div>
            </div>
          )}

          {healthData && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Server className="w-4 h-4 text-indigo-500" />
                    Status
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900 capitalize">
                    {healthData.status}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">HTTP 200 OK</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    Uptime
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900 font-mono">
                    {healthData.uptime}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Process active time</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Cpu className="w-4 h-4 text-violet-500" />
                    Environment
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900 capitalize">
                    {healthData.environment}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">process.env.NODE_ENV</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Globe className="w-4 h-4 text-sky-500" />
                    Timestamp
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900 truncate">
                    {new Date(healthData.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {new Date(healthData.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Message Banner */}
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider block">
                    Server Message
                  </span>
                  <p className="text-sm font-medium text-indigo-950 mt-0.5">
                    {healthData.message}
                  </p>
                </div>
              </div>

              {/* Raw JSON Payload */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Raw JSON Response from Express
                </span>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner">
                  {JSON.stringify(healthData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Educational Flow Card (Great for Interviews) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          How this request just traveled across the stack:
        </h3>
        
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-indigo-600 block mb-1">1. User Action</span>
            React component calls <code className="text-slate-800 font-mono">checkHealth()</code> on click or page mount.
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-indigo-600 block mb-1">2. Axios Client</span>
            Dispatches HTTP <code className="text-slate-800 font-mono">GET</code> to <code className="text-slate-800 font-mono">http://localhost:5000/api/health</code>.
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-indigo-600 block mb-1">3. Express Middleware</span>
            CORS validates origin, router matches endpoint, passes to controller.
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-indigo-600 block mb-1">4. JSON Response</span>
            Controller sends HTTP 200 with status & uptime. React updates state.
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
          <span className="text-slate-500">Ready to explore the full plan?</span>
          <Link
            to="/blueprint"
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View Architecture Blueprint <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
