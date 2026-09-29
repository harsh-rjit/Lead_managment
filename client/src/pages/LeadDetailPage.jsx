import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getLeadById,
  updateLead,
  deleteLead,
  analyzeLeadWithAI,
  getLeadAnalysis,
} from '../api/leadApi';
import { StatusBadge, PriorityBadge, SourceBadge } from '../components/common/Badge';
import LeadFormModal from '../components/leads/LeadFormModal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  FileText,
  UserCheck,
  Loader2,
  Zap,
  TrendingUp,
  Bot,
  RefreshCw,
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

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Modals & action states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLeadDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeadById(id);
      setLead(res.data);

      // Load latest AI analysis for this lead if available
      try {
        const aiRes = await getLeadAnalysis(id);
        if (aiRes.data) {
          setAiAnalysis(aiRes.data);
        }
      } catch (aiLoadErr) {
        // Non-blocking: lead can exist without prior AI analysis
        console.log('No prior AI analysis found for this lead');
      }
    } catch (err) {
      setError(err.message || 'Failed to load lead details from the server.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStatusChange = async (newStatus) => {
    if (!lead || lead.status === newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await updateLead(lead._id, { status: newStatus });
      setLead(res.data);
      showNotification('success', `Status updated to "${newStatus.replace('_', ' ')}".`);
    } catch (err) {
      showNotification('error', err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateLead = async (payload) => {
    const res = await updateLead(lead._id, payload);
    setLead(res.data);
    showNotification('success', 'Lead details updated successfully.');
  };

  const handleAnalyzeWithAI = async () => {
    setAnalyzingAi(true);
    setAiError(null);
    try {
      const res = await analyzeLeadWithAI(lead._id);
      setAiAnalysis(res.data);
      showNotification('success', 'Gemini AI opportunity analysis completed!');
    } catch (err) {
      const errMsg = err.message || 'Failed to complete AI analysis with Gemini.';
      setAiError(errMsg);
      showNotification('error', errMsg);
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleDeleteLead = async () => {
    setIsDeleting(true);
    try {
      await deleteLead(lead._id);
      navigate('/leads', { replace: true });
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete lead.');
      setIsDeleting(false);
    }
  };

  const canDelete = user?.role === 'admin' || user?.role === 'manager';

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading lead details...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Lead Not Found or Inaccessible</h2>
          <p className="text-xs text-slate-500 mt-1">
            {error || 'This lead may have been deleted or belongs to a different organization tenant.'}
          </p>
        </div>
        <Link
          to="/leads"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Navigation Back */}
      <div className="flex items-center justify-between">
        <Link
          to="/leads"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lead Pipeline
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyzeWithAI}
            disabled={analyzingAi}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {analyzingAi ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            {analyzingAi ? 'Analyzing...' : aiAnalysis ? 'Re-analyze with AI' : 'Analyze with AI'}
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Lead
          </button>

          {canDelete && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-medium">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-60 hover:opacity-100 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Lead Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
              <StatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
              <SourceBadge source={lead.source} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {lead.company && (
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
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

          {/* Quick Status Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 self-start md:self-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase px-1">
              Stage:
            </span>
            <select
              value={lead.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-white border border-slate-300 text-xs font-semibold text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 transition"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid: Details & AI Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) - Lead Requirements & Attributes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requirements & Notes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3>Business Requirements & Opportunity Notes</h3>
            </div>
            {lead.requirement ? (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                {lead.requirement}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No specific requirements provided for this prospect. Click "Edit Lead" to add notes.
              </p>
            )}
          </div>

          {/* Contact Details & Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contact Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
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
            </div>

            {/* Financials & Assignment */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
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
                  <span className="font-medium text-slate-800 capitalize">{lead.source}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Assigned Rep:</span>
                  <span className="font-medium text-slate-800">
                    {lead.assignedTo?.name || (
                      <span className="text-slate-400 text-xs">Unassigned</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Tenant Security & Audit Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Multi-Tenant Enforced (Tenant ID: <code className="font-mono text-[11px] text-slate-700">{lead.organizationId}</code>)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Isolated to your organization</span>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) - AI Opportunity Intelligence */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-800/40 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Gemini AI Intelligence</h3>
                  <p className="text-[10px] text-indigo-300">Google Gemini 3.8 Flash Analysis</p>
                </div>
              </div>

              {aiAnalysis?.priority && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border ${
                    aiAnalysis.priority === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : aiAnalysis.priority === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}
                >
                  {aiAnalysis.priority} Priority
                </span>
              )}
            </div>

            {/* Error Message if AI failed */}
            {aiError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">{aiError}</p>
                  <p className="text-[11px] text-rose-300/80">
                    Verify that GEMINI_API_KEY is configured in server/.env
                  </p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {analyzingAi ? (
              <div className="py-8 px-4 text-center space-y-3 bg-indigo-950/40 rounded-xl border border-indigo-800/40">
                <Loader2 className="w-8 h-8 text-amber-300 animate-spin mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-100">
                    Analyzing Lead with Gemini 3.8 Flash...
                  </h4>
                  <p className="text-[11px] text-indigo-300/80 mt-1">
                    Evaluating deal probability, budget alignment, and recommended sales strategy.
                  </p>
                </div>
              </div>
            ) : aiAnalysis ? (
              /* Analysis Results View */
              <div className="space-y-4">
                {/* Score Meter */}
                <div className="bg-indigo-950/60 p-4 rounded-xl border border-indigo-700/40 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-medium text-indigo-200">
                      Conversion Opportunity Score
                    </span>
                    <span className="text-2xl font-black text-amber-300 font-mono">
                      {aiAnalysis.score}
                      <span className="text-xs font-normal text-indigo-300">/100</span>
                    </span>
                  </div>

                  <div className="w-full bg-indigo-900/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        aiAnalysis.score >= 70
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                          : aiAnalysis.score >= 40
                          ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                          : 'bg-gradient-to-r from-rose-500 to-rose-300'
                      }`}
                      style={{ width: `${Math.min(Math.max(aiAnalysis.score, 0), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                    Executive Assessment
                  </h4>
                  <p className="text-xs text-indigo-100/90 leading-relaxed bg-indigo-950/30 p-3 rounded-xl border border-indigo-800/30">
                    {aiAnalysis.summary}
                  </p>
                </div>

                {/* Key Drivers / Reasons */}
                {aiAnalysis.reasons && aiAnalysis.reasons.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                      Key Analysis Drivers
                    </h4>
                    <ul className="space-y-1.5 text-xs text-indigo-200">
                      {aiAnalysis.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-300 shrink-0 font-bold">•</span>
                          <span className="leading-snug">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Next Action */}
                {aiAnalysis.recommendedNextAction && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Recommended Next Action
                    </div>
                    <p className="text-xs text-amber-100 font-medium leading-relaxed">
                      {aiAnalysis.recommendedNextAction}
                    </p>
                  </div>
                )}

                {/* Footer Action & Timestamp */}
                <div className="flex items-center justify-between pt-2 border-t border-indigo-800/40 text-[11px] text-indigo-300/80">
                  <span>
                    Last analyzed: {new Date(aiAnalysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={handleAnalyzeWithAI}
                    disabled={analyzingAi}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-800/60 hover:bg-indigo-700 text-indigo-100 hover:text-white transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Re-analyze
                  </button>
                </div>
              </div>
            ) : (
              /* Unanalyzed Initial Prompt */
              <div className="space-y-4">
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Evaluate this opportunity with Gemini AI. Extracts structured conversion score (0–100), buying intent priority, strategic reasons, and next action recommendations.
                </p>

                <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-800/40 text-[11px] text-indigo-300 space-y-1">
                  <div className="font-semibold text-indigo-200">What Gemini Evaluates:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-indigo-300/90">
                    <li>Budget alignment with requested scope</li>
                    <li>Requirement clarity and purchasing urgency</li>
                    <li>Actionable next steps for your sales team</li>
                  </ul>
                </div>

                <button
                  onClick={handleAnalyzeWithAI}
                  disabled={analyzingAi}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  Analyze with Gemini AI
                </button>
              </div>
            )}
          </div>

          {/* Activity Log Mini Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Pipeline Timeline
            </div>
            <div className="relative pl-4 border-l-2 border-slate-200 space-y-4 text-xs">
              <div className="relative">
                <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></div>
                <div className="font-semibold text-slate-800">Lead Record Created</div>
                <div className="text-[11px] text-slate-400">
                  {new Date(lead.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white"></div>
                <div className="font-semibold text-slate-800">Current Stage: {lead.status}</div>
                <div className="text-[11px] text-slate-400">
                  Updated {new Date(lead.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
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
