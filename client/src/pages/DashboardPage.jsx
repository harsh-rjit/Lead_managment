import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdmin, isManager } from '../utils/rbac';
import { getAnalyticsOverview } from '../api/analyticsApi';

// Design System Primitives
import Button from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SkeletonCard } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';

// Dashboard & Analytics Components
import MetricCard from '../components/dashboard/MetricCard';
import LeadsOverTimeChart from '../components/dashboard/LeadsOverTimeChart';
import LeadsBySourceChart from '../components/dashboard/LeadsBySourceChart';
import LeadStatusDistributionChart from '../components/dashboard/LeadStatusDistributionChart';

import {
  Building2,
  Sparkles,
  Users,
  Settings,
  Briefcase,
  ArrowRight,
  UserCheck,
  Trophy,
  Percent,
  RefreshCw,
  BarChart3,
  XCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, organization } = useAuth();

  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const res = await getAnalyticsOverview();
      if (res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics overview:', err);
      setAnalyticsError(err.message || 'Could not load analytics metrics from the database.');
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Welcome Header with Quick Actions */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome back, {user?.name}!
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    user?.role === 'admin'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : user?.role === 'manager'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {user?.role} Role
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                {organization?.name} ({organization?.slug}) &bull; Tier:{' '}
                <span className="font-semibold capitalize text-slate-700">{organization?.plan}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              loading={loadingAnalytics}
              icon={RefreshCw}
            >
              Refresh Data
            </Button>

            <Link to="/leads">
              <Button
                variant="primary"
                size="sm"
                rightIcon={ArrowRight}
              >
                Lead Pipeline
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Analytics Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Real-Time Pipeline Analytics & Intelligence
            </h2>
            <p className="text-xs text-slate-400">
              Aggregated directly from MongoDB for your organization
            </p>
          </div>
        </div>
      </div>

      {/* Error State Banner */}
      {analyticsError && (
        <Card className="p-6">
          <ErrorState
            title="Failed to load analytics metrics"
            message={analyticsError}
            onRetry={fetchAnalytics}
          />
        </Card>
      )}

      {/* KPI Metric Cards Grid */}
      {loadingAnalytics && !analytics ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            title="Total Leads"
            value={analytics?.totalLeads ?? 0}
            subvalue="Active pipeline"
            icon={Users}
            colorScheme="indigo"
          />

          <MetricCard
            title="Qualified"
            value={analytics?.qualifiedLeads ?? 0}
            subvalue={
              analytics?.totalLeads > 0
                ? `${Math.round(((analytics?.qualifiedLeads || 0) / analytics.totalLeads) * 100)}% of pipeline`
                : '0% of pipeline'
            }
            icon={UserCheck}
            colorScheme="purple"
          />

          <MetricCard
            title="Closed Won"
            value={analytics?.wonLeads ?? 0}
            subvalue="Deals converted"
            icon={Trophy}
            colorScheme="emerald"
          />

          <MetricCard
            title="Closed Lost"
            value={analytics?.lostLeads ?? 0}
            subvalue="Lost opportunities"
            icon={XCircle}
            colorScheme="rose"
          />

          <MetricCard
            title="Conversion Rate"
            value={`${analytics?.conversionRate ?? 0}%`}
            subvalue={
              analytics?.closedWinRate > 0
                ? `${analytics.closedWinRate}% win rate`
                : 'Won vs total'
            }
            icon={Percent}
            colorScheme="amber"
          />

          <MetricCard
            title="Avg AI Score"
            value={
              analytics?.averageAiScore != null ? `${analytics.averageAiScore}/100` : 'N/A'
            }
            subvalue={`${analytics?.totalAiAnalyses ?? 0} deals scored`}
            icon={Sparkles}
            colorScheme="indigo"
            badgeText={
              analytics?.averageAiScore != null
                ? analytics.averageAiScore >= 80
                  ? 'High Quality'
                  : analytics.averageAiScore >= 50
                  ? 'Moderate'
                  : 'Low Quality'
                : null
            }
          />
        </div>
      )}

      {/* Visual Analytics Charts Section */}
      <div className="space-y-6">
        <LeadsOverTimeChart data={analytics?.leadsOverTime || []} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeadStatusDistributionChart statusData={analytics?.leadsByStatus || {}} />
          <LeadsBySourceChart sourceData={analytics?.leadsBySource || {}} />
        </div>
      </div>

      {/* Role-Based Features Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Permitted Role Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Admin Feature: Team Management */}
          {isAdmin(user) ? (
            <Link
              to="/team"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
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
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
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
              <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
