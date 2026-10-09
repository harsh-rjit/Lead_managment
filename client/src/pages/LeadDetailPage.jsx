import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/ToastContext';
import {
  getLeadById,
  updateLead,
  deleteLead,
  analyzeLeadWithAI,
  getLeadAnalysis,
  getLeadActivities,
  getLeadAssignees,
} from '../api/leadApi';

// Design System Primitives
import Button from '../components/common/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { StatusBadge, PriorityBadge, SourceBadge } from '../components/common/Badge';
import { SkeletonCard } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';

// Features
import LeadFormModal from '../components/leads/LeadFormModal';
import AILeadAnalysis from '../components/leads/AILeadAnalysis';
import AIFollowUpCard from '../components/leads/AIFollowUpCard';
import ActivityTimeline from '../components/leads/ActivityTimeline';

import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  Clock,
  Shield,
  FileText,
  UserCheck,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'won', label: 'Closed Won' },
  { value: 'lost', label: 'Closed Lost' },
];

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Modals & action states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignees, setAssignees] = useState([]);

  // Activity Timeline state
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const actRes = await getLeadActivities(id);
      if (actRes.data) {
        setActivities(actRes.data);
      }
    } catch (actErr) {
      console.error('Failed to load lead activities:', actErr);
    } finally {
      setLoadingActivities(false);
    }
  }, [id]);

  const fetchLeadDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeadById(id);
      setLead(res.data);

      try {
        const aiRes = await getLeadAnalysis(id);
        if (aiRes.data) {
          setAiAnalysis(aiRes.data);
        }
      } catch (aiLoadErr) {
        // Non-blocking: lead may exist without prior analysis
      }
    } catch (err) {
      setError(err.message || 'Failed to load lead details from the server.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadDetails();
    fetchActivities();
  }, [fetchLeadDetails, fetchActivities]);

  const handleStatusChange = async (newStatus) => {
    if (!lead || lead.status === newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await updateLead(lead._id, { status: newStatus });
      setLead(res.data);
      fetchActivities();
      toast.success(`Pipeline status updated to "${newStatus.replace('_', ' ')}".`, 'Stage Updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update status.', 'Update Error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateLead = async (payload) => {
    const res = await updateLead(lead._id, payload);
    setLead(res.data);
    fetchActivities();
    toast.success('Lead details updated successfully.', 'Lead Saved');
  };

  const handleAnalyzeWithAI = async () => {
    setAnalyzingAi(true);
    setAiError(null);
    try {
      const res = await analyzeLeadWithAI(lead._id);
      setAiAnalysis(res.data);
      fetchActivities();
      toast.success('Gemini AI opportunity analysis completed!', 'AI Analysis');
    } catch (err) {
      const errMsg = err.message || 'Failed to complete AI analysis with Gemini.';
      setAiError(errMsg);
      toast.error(errMsg, 'AI Analysis Failed');
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleDeleteLead = async () => {
    setIsDeleting(true);
    try {
      await deleteLead(lead._id);
      toast.success(`Lead "${lead.name}" was permanently removed.`, 'Lead Deleted');
      navigate('/leads', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to delete lead.', 'Delete Failed');
      setIsDeleting(false);
    }
  };

  const canDelete = user?.role === 'admin' || user?.role === 'manager';
  const canAssign = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (canAssign) {
      getLeadAssignees()
        .then((res) => {
          if (res?.data) {
            setAssignees(res.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load assignees:', err);
        });
    }
  }, [canAssign]);

  const handleAssigneeChange = async (newAssigneeId) => {
    if (!lead) return;
    const currentAssignedId = lead.assignedTo?._id || lead.assignedTo?.id || lead.assignedTo || '';
    if (currentAssignedId === newAssigneeId) return;

    setUpdatingAssignee(true);
    try {
      const res = await updateLead(lead._id, {
        assignedTo: newAssigneeId || null,
      });
      setLead(res.data);
      fetchActivities();
      const assignedUser = assignees.find((u) => (u._id || u.id) === newAssigneeId);
      toast.success(
        assignedUser ? `Lead assigned to ${assignedUser.name}.` : 'Lead marked as unassigned.',
        'Assignee Updated'
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update assignee.', 'Assignment Error');
    } finally {
      setUpdatingAssignee(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <SkeletonCard className="h-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-64" />
          </div>
          <div className="space-y-6">
            <SkeletonCard className="h-72" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <Card className="p-8">
          <ErrorState
            title="Lead Not Found or Inaccessible"
            message={error || 'This prospect may have been deleted or belongs to a different organization tenant.'}
            onRetry={() => navigate('/leads')}
            retryLabel="Back to Lead Pipeline"
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/leads"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lead Pipeline
        </Link>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAnalyzeWithAI}
            loading={analyzingAi}
            icon={Sparkles}
          >
            {aiAnalysis ? 'Re-analyze with AI' : 'Analyze with AI'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            icon={Edit2}
          >
            Edit Lead
          </Button>

          {canDelete && (
            <Button
              variant="dangerOutline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              icon={Trash2}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main Prospect Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{lead.name}</h1>
              <StatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
              <SourceBadge source={lead.source} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {lead.company && (
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {lead.company}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Created {new Date(lead.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Updated {new Date(lead.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Quick Stage Transition Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 self-start md:self-auto">
            <label htmlFor="pipeline-stage-select" className="text-[11px] font-bold text-slate-500 uppercase px-1">
              Stage:
            </label>
            <select
              id="pipeline-stage-select"
              value={lead.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-white border border-slate-300 text-xs font-semibold text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition cursor-pointer disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Grid: Details & AI Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) - Lead Requirements & Attributes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requirements & Notes Card */}
          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3>Business Requirements & Opportunity Notes</h3>
            </div>
            {lead.requirement ? (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-4 rounded-xl border border-slate-100 font-sans">
                {lead.requirement}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No specific requirements provided for this prospect. Click "Edit Lead" to add notes.
              </p>
            )}
          </Card>

          {/* Contact Details & Financial Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contact Card */}
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Contact Details
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      {lead.email}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">No email on file</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-slate-800 hover:underline font-medium"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">No phone on file</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-slate-700">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">{lead.company || 'Individual / Not specified'}</span>
                </div>
              </div>
            </Card>

            {/* Financials & Assignment Card */}
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Deal Parameters
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimated Budget:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {lead.budget && lead.budget > 0 ? (
                      `$${lead.budget.toLocaleString()}`
                    ) : (
                      <span className="text-slate-400 text-xs font-normal">Not estimated</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Acquisition Source:</span>
                  <span className="font-semibold text-slate-800 capitalize">{lead.source}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Assigned Rep:</span>
                  {canAssign ? (
                    <select
                      value={lead.assignedTo?._id || lead.assignedTo?.id || lead.assignedTo || ''}
                      disabled={updatingAssignee}
                      onChange={(e) => handleAssigneeChange(e.target.value)}
                      className="bg-white border border-slate-300 text-xs font-semibold text-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition cursor-pointer disabled:opacity-50 max-w-[170px] truncate"
                    >
                      <option value="">Unassigned</option>
                      {assignees.map((member) => (
                        <option key={member._id || member.id} value={member._id || member.id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-slate-800">
                      {lead.assignedTo?.name || (
                        <span className="text-slate-400 text-xs font-normal">Unassigned</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* AI Follow-Up Message Generator */}
          <AIFollowUpCard lead={lead} aiAnalysis={aiAnalysis} />

          {/* Activity Audit Trail & Timeline */}
          <ActivityTimeline
            activities={activities}
            loading={loadingActivities}
            onRefresh={fetchActivities}
          />

          {/* Multi-Tenant Security & Audit Info */}
          <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Tenant Isolation: <code className="font-mono text-[11px] text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">{lead.organizationId}</code>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Multi-Tenant Enforced</span>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) - AI Opportunity Intelligence */}
        <div className="space-y-6">
          <AILeadAnalysis
            lead={lead}
            analysis={aiAnalysis}
            loading={analyzingAi}
            error={aiError}
            onAnalyze={handleAnalyzeWithAI}
          />

          {/* Pipeline Milestone Card */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Pipeline Milestone
            </div>
            <div className="relative pl-4 border-l-2 border-slate-200 space-y-4 text-xs">
              <div className="relative">
                <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                <div className="font-semibold text-slate-800">Lead Record Created</div>
                <div className="text-[11px] text-slate-400">
                  {new Date(lead.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
                <div className="font-semibold text-slate-800 capitalize">Current Stage: {lead.status.replace('_', ' ')}</div>
                <div className="text-[11px] text-slate-400">
                  Updated {new Date(lead.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <LeadFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateLead}
        initialData={lead}
        isEditing={true}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Lead"
        message={`Are you sure you want to permanently remove "${lead.name}"? This operation cannot be undone.`}
        loading={isDeleting}
        onConfirm={handleDeleteLead}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
