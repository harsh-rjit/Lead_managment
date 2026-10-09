import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/ToastContext';
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
} from '../api/leadApi';

// Design System Primitives
import Button from '../components/common/Button';
import { Card } from '../components/common/Card';
import {
  TableContainer,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '../components/common/Table';
import { SkeletonTable } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { StatusBadge, PriorityBadge, SourceBadge } from '../components/common/Badge';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';

// Feature Modals & Filters
import LeadFilterBar from '../components/leads/LeadFilterBar';
import Pagination from '../components/leads/Pagination';
import LeadFormModal from '../components/leads/LeadFormModal';
import CSVImportModal from '../components/leads/CSVImportModal';

import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

export default function LeadsPage() {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

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

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
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
      const paginationData = res.meta || res.pagination;
      setPagination(
        paginationData
          ? {
              page: Number(paginationData.page) || filters.page,
              limit: Number(paginationData.limit) || filters.limit,
              total: typeof paginationData.total === 'number' ? paginationData.total : (res.data?.length || 0),
              totalPages: Number(paginationData.totalPages) || 1,
              hasNextPage: Boolean(paginationData.hasNextPage),
              hasPrevPage: Boolean(paginationData.hasPrevPage),
            }
          : {
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

  // Filter change handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
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

  // CRUD Handlers
  const handleCreateLead = async (payload) => {
    const res = await createLead(payload);
    toast.success(`Lead "${res.data.name}" created successfully.`, 'Lead Created');
    fetchLeads();
  };

  const handleUpdateLead = async (payload) => {
    if (!editingLead) return;
    const res = await updateLead(editingLead._id, payload);
    toast.success(`Lead "${res.data.name}" updated successfully.`, 'Lead Updated');
    setEditingLead(null);
    fetchLeads();
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    setIsDeleting(true);
    try {
      await deleteLead(deletingLead._id);
      toast.success(`Lead "${deletingLead.name}" was permanently deleted.`, 'Lead Deleted');
      setDeletingLead(null);
      fetchLeads();
    } catch (err) {
      toast.error(err.message || 'Failed to delete lead.', 'Delete Failed');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Lead Pipeline
            </h1>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLeads()}
            title="Refresh Leads"
            icon={RefreshCw}
            loading={loading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCSVModalOpen(true)}
            icon={FileSpreadsheet}
          >
            Import CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={Plus}
          >
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Pipeline Quick Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Leads</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pagination.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all pipeline stages</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">New Inbound</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{newLeadsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">On current page view</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Qualified</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{qualifiedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Ready for proposal</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${totalValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Estimated contract value</div>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <LeadFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Leads Table Container */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : error ? (
        <Card className="p-6">
          <ErrorState
            title="Failed to load leads"
            message={error}
            onRetry={fetchLeads}
            retryLabel="Retry Query"
          />
        </Card>
      ) : leads.length === 0 ? (
        <Card className="p-6">
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
        </Card>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Prospect / Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Added</TableHead>
                <TableHead align="right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead._id}
                  isClickable={true}
                  onClick={() => navigate(`/leads/${lead._id}`)}
                >
                  {/* Lead Contact Info */}
                  <TableCell>
                    <div className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition">
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
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge status={lead.status} />
                  </TableCell>

                  {/* Priority Badge */}
                  <TableCell className="whitespace-nowrap">
                    <PriorityBadge priority={lead.priority} />
                  </TableCell>

                  {/* Source Badge */}
                  <TableCell className="whitespace-nowrap">
                    <SourceBadge source={lead.source} />
                  </TableCell>

                  {/* Budget */}
                  <TableCell className="whitespace-nowrap font-semibold text-slate-800">
                    {lead.budget && lead.budget > 0
                      ? `$${lead.budget.toLocaleString()}`
                      : <span className="text-slate-400 italic font-normal">Not set</span>}
                  </TableCell>

                  {/* Created Date */}
                  <TableCell className="whitespace-nowrap text-slate-500 text-[11px]">
                    {new Date(lead.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>

                  {/* Row Actions */}
                  <TableCell
                    align="right"
                    className="whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/leads/${lead._id}`}
                        title="View Details"
                        aria-label={`View details for ${lead.name}`}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setEditingLead(lead)}
                        title="Edit Lead"
                        aria-label={`Edit ${lead.name}`}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setDeletingLead(lead)}
                          title="Delete Lead"
                          aria-label={`Delete ${lead.name}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onPageChange={handlePageChange}
          />
        </TableContainer>
      )}

      {/* Create Lead Modal */}
      <LeadFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLead}
        isEditing={false}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onSuccess={(summary) => {
          fetchLeads();
          toast.success(
            `Successfully imported ${summary.importedCount} lead(s) from CSV.${
              summary.failedCount > 0 ? ` (${summary.failedCount} failed rows)` : ''
            }`,
            'CSV Import Completed'
          );
        }}
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
