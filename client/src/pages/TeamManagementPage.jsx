import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/ToastContext';
import {
  getUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
} from '../api/userApi';

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
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '../components/common/Modal';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { SkeletonTable } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

import {
  Users,
  UserPlus,
  Shield,
  Search,
  Power,
  PowerOff,
  UserCheck,
  Loader2,
} from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Full organization & user management' },
  { value: 'manager', label: 'Manager', desc: 'Manages all team leads' },
  { value: 'sales', label: 'Sales', desc: 'Manages assigned personal leads only' },
];

export default function TeamManagementPage() {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id || currentUser?._id;
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals & action states
  const [modalOpen, setModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales',
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers();
      setUsers(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load organization members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const res = await createUser(formData);
      toast.success(`User ${res.data.name} created with role '${res.data.role}'.`, 'Member Added');
      setFormData({ name: '', email: '', password: '', role: 'sales' });
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to create user account.', 'Creation Error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    setActionLoadingId(`role-${memberId}`);
    try {
      const res = await updateUserRole(memberId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === memberId ? { ...u, role: res.data.role } : u))
      );
      toast.success(`Role updated to '${newRole}' for ${res.data.name}.`, 'Role Updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update user role.', 'Update Failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusToggle = async (member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    setActionLoadingId(`status-${member.id}`);

    try {
      const res = await updateUserStatus(member.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === member.id ? { ...u, status: res.data.status } : u))
      );
      toast.success(
        `User ${res.data.name} is now ${res.data.status === 'active' ? 'Activated' : 'Deactivated'}.`,
        'Account Status'
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update user status.', 'Status Error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = users.filter((u) => u.status === 'active').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Admin User Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[11px] font-bold uppercase tracking-wider border border-purple-200">
              Admin Restricted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage members, promote roles, and control active credentials for your organization
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          icon={UserPlus}
        >
          Add Member
        </Button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Team Size</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{users.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Accounts</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Administrators</span>
            <div className="text-2xl font-bold text-purple-600 mt-1">{adminCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <Shield className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search members by name or email"
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {['all', 'admin', 'manager', 'sales'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                roleFilter === role
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : error ? (
        <Card className="p-6">
          <ErrorState
            title="Failed to load team members"
            message={error}
            onRetry={fetchUsers}
          />
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No members match your criteria"
            description="Try adjusting your search query or active role filters."
            icon={Users}
          />
        </Card>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>User Profile</TableHead>
                <TableHead>Role Assignment</TableHead>
                <TableHead>Status & Access</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead align="right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((member) => {
                const isSelf = String(member.id) === String(currentUserId);
                const isRoleUpdating = actionLoadingId === `role-${member.id}`;
                const isStatusUpdating = actionLoadingId === `status-${member.id}`;
                const isActive = member.status === 'active';

                return (
                  <TableRow key={member.id}>
                    {/* User Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {member.name}
                            </span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role Selector */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          disabled={isRoleUpdating}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          aria-label={`Change role for ${member.name}`}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer ${
                            member.role === 'admin'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : member.role === 'manager'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        {isRoleUpdating && <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
                      </div>
                    </TableCell>

                    {/* Status Indicator */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="capitalize">{member.status}</span>
                      </span>
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>

                    {/* Action: Activate / Deactivate Toggle */}
                    <TableCell align="right">
                      <Button
                        variant={isActive ? 'dangerOutline' : 'outline'}
                        size="xs"
                        disabled={isSelf || isStatusUpdating}
                        onClick={() => handleStatusToggle(member)}
                        loading={isStatusUpdating}
                        icon={isActive ? PowerOff : Power}
                        title={
                          isSelf
                            ? 'You cannot deactivate your own account'
                            : isActive
                            ? 'Deactivate this user account'
                            : 'Activate this user account'
                        }
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={createLoading ? undefined : () => setModalOpen(false)}
        size="md"
        ariaLabelledBy="add-member-title"
      >
        <ModalHeader onClose={createLoading ? undefined : () => setModalOpen(false)}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <ModalTitle id="add-member-title">Add Organization User</ModalTitle>
              <ModalDescription>Invite a new user to your tenant workspace</ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <form onSubmit={handleCreateSubmit}>
          <ModalBody className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Sarah Connor"
              disabled={createLoading}
            />

            <Input
              label="Work Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="sarah@company.com"
              disabled={createLoading}
            />

            <Input
              label="Temporary Password"
              name="password"
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              disabled={createLoading}
              helperText="User can change password after first sign in"
            />

            <Select
              label="Assigned Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={createLoading}
            >
              <option value="sales">Sales (Manages personal leads only)</option>
              <option value="manager">Manager (Manages all team leads)</option>
              <option value="admin">Admin (Full organization & user management)</option>
            </Select>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              disabled={createLoading}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={createLoading}
              icon={UserPlus}
            >
              {createLoading ? 'Creating User...' : 'Add User'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
