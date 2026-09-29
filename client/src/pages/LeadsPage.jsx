import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
} from '../api/leadApi';
import LeadFilterBar from '../components/leads/LeadFilterBar';
import Pagination from '../components/leads/Pagination';
import LeadFormModal from '../components/leads/LeadFormModal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import { StatusBadge, PriorityBadge, SourceBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function LeadsPage() {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  // Leads and pagination data
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    source: '',
    page: 1,
    limit: 10,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch leads with active filters
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.search) queryParams.search = filters.search;
      if (filters.status) queryParams.status = filters.status;
      if (filters.priority) queryParams.priority = filters.priority;
      if (filters.source) queryParams.source = filters.source;

      const res = await getLeads(queryParams);

      setLeads(res.data || []);
      setPagination(
        res.pagination || {
          page: filters.page,
          limit: filters.limit,
          total: res.data?.length || 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (err) {
      setError(err.message || 'Failed to fetch leads from the server.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchLeads]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when changing filters
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      source: '',
      page: 1,
      limit: 10,
    });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Notification helper
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // CRUD Handlers
  const handleCreateLead = async (payload) => {
    const res = await createLead(payload);
    showNotification('success', `Lead "${res.data.name}" created successfully.`);
    fetchLeads();
  };

  const handleUpdateLead = async (payload) => {
    if (!editingLead) return;
    const res = await updateLead(editingLead._id, payload);
    showNotification('success', `Lead "${res.data.name}" updated successfully.`);
    setEditingLead(null);
    fetchLeads();
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    setIsDeleting(true);
    try {
      await deleteLead(deletingLead._id);
      showNotification('success', `Lead "${deletingLead.name}" was permanently deleted.`);
      setDeletingLead(null);
      fetchLeads();
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete lead.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick metrics calculations
  const totalValue = leads.reduce((sum, lead) => sum + (lead.budget || 0), 0);
  const newLeadsCount = leads.filter((l) => l.status === 'new').length;
  const qualifiedCount = leads.filter((l) => l.status === 'qualified' || l.status === 'proposal_sent').length;

  const canDelete = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Lead Pipeline</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {organization?.name || 'Workspace'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {user?.role === 'sales'
              ? 'Viewing your assigned prospects and sales opportunities.'
              : 'Manage and prioritize inbound prospects across your entire organization.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchLeads()}
            title="Refresh Leads"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Lead
          </button>
        </div>
      </div>

      {/* Pipeline Quick Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Leads</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pagination.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all pipeline stages</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">New Inbound</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{newLeadsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">On current page view</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Qualified / Active</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{qualifiedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Ready for proposal</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Page Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${totalValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Estimated contract value</div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
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

      {/* Filters and Search Bar */}
      <LeadFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Leads Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Fetching leads from server...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Failed to load leads</h3>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
            <button
              onClick={() => fetchLeads()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Query
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && leads.length === 0 && (
          <EmptyState
            title="No leads found"
            description={
              filters.search || filters.status || filters.priority || filters.source
                ? 'Try adjusting your search criteria or active filters to find what you are looking for.'
                : 'Your pipeline is currently empty. Create your first lead to start tracking opportunities.'
            }
            actionLabel="Create Lead"
            onAction={() => setIsCreateModalOpen(true)}
          />
        )}

        {/* Data Table */}
        {!loading && !error && leads.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Prospect / Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Added</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/leads/${lead._id}`)}
                  >
                    {/* Lead Contact Info */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition">
                        {lead.name}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                        {lead.company && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {lead.company}
                          </span>
                        )}
                        {lead.email && <span>{lead.email}</span>}
                        {lead.phone && <span>&bull; {lead.phone}</span>}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={lead.status} />
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={lead.priority} />
                    </td>

                    {/* Source Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SourceBadge source={lead.source} />
                    </td>

                    {/* Budget */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                      {lead.budget && lead.budget > 0
                        ? `$${lead.budget.toLocaleString()}`
                        : <span className="text-slate-400 italic">Not set</span>}
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(lead.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Row Actions */}
                    <td
                      className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()} // Prevent row click navigation
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/leads/${lead._id}`}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => setEditingLead(lead)}
                          title="Edit Lead"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {canDelete ? (
                          <button
                            onClick={() => setDeletingLead(lead)}
                            title="Delete Lead"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && leads.length > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Create Lead Modal */}
      <LeadFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLead}
        isEditing={false}
      />

      {/* Edit Lead Modal */}
      <LeadFormModal
        isOpen={Boolean(editingLead)}
        onClose={() => setEditingLead(null)}
        onSubmit={handleUpdateLead}
        initialData={editingLead}
        isEditing={true}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingLead)}
        title="Delete Prospect"
        message={`Are you sure you want to permanently delete "${deletingLead?.name}"? All pipeline data and requirements will be removed.`}
        loading={isDeleting}
        onConfirm={handleDeleteLead}
        onCancel={() => setDeletingLead(null)}
      />
    </div>
  );
}
