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
  ArrowRight,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { Card } from '../components/common/Card';

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
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System Connection & Health
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            Live communication status between the React frontend and Express backend.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={fetchHealth}
          loading={loading}
          icon={RefreshCw}
        >
          {loading ? 'Checking...' : 'Ping Backend'}
        </Button>
      </div>

      {/* Main Connection Status Card */}
      <Card className="overflow-hidden">
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
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
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
                  />
                  {loading ? 'Checking' : error ? 'Offline' : 'Online'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Endpoint: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">GET /api/health</code>
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
              <p className="text-slate-600 text-xs font-medium">
                Sending HTTP GET request via Axios...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-5 text-rose-900 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-rose-800 text-xs">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                Connection Error Details
              </div>
              <p className="text-xs font-mono bg-white/70 p-3 rounded-lg border border-rose-100 text-rose-700">
                {error}
              </p>
              <div className="text-xs space-y-1 text-rose-800">
                <p className="font-semibold">Quick Troubleshooting:</p>
                <ul className="list-disc list-inside space-y-0.5 text-rose-700 text-[11px]">
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
                  <p className="text-xs font-medium text-indigo-950 mt-0.5">
                    {healthData.message}
                  </p>
                </div>
              </div>

              {/* Database Connection Status */}
              {healthData.database && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      healthData.database.status === 'connected' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        MongoDB Database: 
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          healthData.database.status === 'connected'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            healthData.database.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          {healthData.database.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {healthData.database.name ? `Database: ${healthData.database.name}` : 'Atlas Cluster'} 
                        {healthData.database.host && ` • Host: ${healthData.database.host}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw JSON Payload */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Raw JSON Response from Express
                </span>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner">
                  {JSON.stringify(healthData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
