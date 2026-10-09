import React from 'react';
import {
  Clock,
  Plus,
  ArrowRight,
  UserCheck,
  Edit3,
  Sparkles,
  Bot,
  MessageSquare,
  FileSpreadsheet,
  Activity as ActivityIcon,
} from 'lucide-react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { PriorityBadge } from '../common/Badge';

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const ACTION_CONFIG = {
  lead_created: {
    label: 'Lead Created',
    icon: Plus,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    iconBg: 'bg-blue-600',
  },
  status_changed: {
    label: 'Stage Transitioned',
    icon: ArrowRight,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    iconBg: 'bg-amber-600',
  },
  lead_assigned: {
    label: 'Lead Assigned',
    icon: UserCheck,
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    iconBg: 'bg-indigo-600',
  },
  assigned: {
    label: 'Lead Assigned',
    icon: UserCheck,
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    iconBg: 'bg-indigo-600',
  },
  lead_updated: {
    label: 'Details Updated',
    icon: Edit3,
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    iconBg: 'bg-slate-600',
  },
  ai_analysis_generated: {
    label: 'AI Deal Assessment',
    icon: Sparkles,
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    iconBg: 'bg-purple-600',
  },
  ai_scored: {
    label: 'AI Scored',
    icon: Bot,
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    iconBg: 'bg-purple-600',
  },
  followup_generated: {
    label: 'AI Follow-Up Created',
    icon: MessageSquare,
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    iconBg: 'bg-violet-600',
  },
  csv_imported: {
    label: 'CSV Bulk Import',
    icon: FileSpreadsheet,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-600',
  },
};

export default function ActivityTimeline({
  activities = [],
  loading = false,
  onRefresh = null,
}) {
  return (
    <Card className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <ActivityIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Audit Trail & Timeline</h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {activities.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Immutable audit history recorded exclusively by backend system services
            </p>
          </div>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="xs"
            onClick={onRefresh}
            loading={loading}
            title="Refresh Timeline"
          >
            Refresh
          </Button>
        )}
      </div>

      {/* Content */}
      {loading && activities.length === 0 ? (
        <div className="space-y-4 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                <div className="h-10 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl bg-slate-50/50 border border-dashed border-slate-200">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No activities recorded yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            System modifications, status transitions, and AI insights will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 space-y-5">
          {activities.map((act) => {
            const actionKey = act.action || act.type || 'lead_updated';
            const config = ACTION_CONFIG[actionKey] || ACTION_CONFIG.lead_updated;
            const Icon = config.icon;
            const userName = act.userId?.name || act.performedBy?.name || 'System Process';
            const userRole = act.userId?.role || act.performedBy?.role || 'System';
            const metadata = act.metadata || {};

            return (
              <div key={act._id} className="relative group">
                {/* Node icon anchored on vertical line */}
                <div
                  className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-xs ${config.iconBg} ring-4 ring-white`}
                >
                  <Icon className="w-3 h-3" />
                </div>

                {/* Activity Item Card */}
                <div className="bg-slate-50/70 hover:bg-slate-50 transition border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${config.bg} ${config.border} ${config.text}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{userName}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.2 rounded bg-slate-200/50">
                        {userRole}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1 text-[11px] text-slate-400"
                      title={new Date(act.createdAt).toLocaleString()}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(act.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700">
                    {/* Status change specific transition pill */}
                    {(actionKey === 'status_changed' || metadata.previousStatus) && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 text-slate-700 capitalize">
                          {metadata.previousStatus || 'unknown'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 capitalize">
                          {metadata.newStatus || act.description}
                        </span>
                      </div>
                    )}

                    {/* Lead Assigned specific */}
                    {(actionKey === 'lead_assigned' || actionKey === 'assigned') && (
                      <p className="mt-0.5 font-medium text-slate-800">
                        Assigned to: <span className="text-indigo-600 font-semibold">{metadata.assignedToName || 'Team Member'}</span>
                      </p>
                    )}

                    {/* AI Analysis specific highlights */}
                    {(actionKey === 'ai_analysis_generated' || actionKey === 'ai_scored') && (
                      <div className="mt-1.5 p-2.5 rounded-lg bg-purple-50/80 border border-purple-100 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-900 text-xs">
                            Score: {metadata.score}/100
                          </span>
                          {metadata.priority && <PriorityBadge priority={metadata.priority.toLowerCase()} />}
                        </div>
                        {metadata.summary && (
                          <p className="text-[11px] text-purple-900 line-clamp-2">
                            {metadata.summary}
                          </p>
                        )}
                        {metadata.recommendedNextAction && (
                          <div className="text-[11px] text-purple-800 font-medium">
                            <span className="font-semibold">Next Step:</span> {metadata.recommendedNextAction}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lead details updated */}
                    {actionKey === 'lead_updated' && metadata.updatedFields && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-slate-500">Modified fields:</span>
                        {metadata.updatedFields.map((field) => (
                          <span
                            key={field}
                            className="px-1.5 py-0.5 rounded bg-slate-200/70 font-mono text-[10px] text-slate-700"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    )}

                    {act.description &&
                      actionKey !== 'status_changed' &&
                      actionKey !== 'ai_analysis_generated' &&
                      !metadata.updatedFields && (
                        <p className="mt-0.5">{act.description}</p>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
