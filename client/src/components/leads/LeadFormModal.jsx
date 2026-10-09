import React, { useState, useEffect } from 'react';
import { UserPlus, Save, AlertCircle } from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import { getLeadAssignees } from '../../api/leadApi';

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  company: '',
  requirement: '',
  budget: 0,
  source: 'manual',
  status: 'new',
  priority: 'medium',
  assignedTo: '',
};

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'won', label: 'Closed Won' },
  { value: 'lost', label: 'Closed Lost' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent' },
];

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'csv', label: 'CSV Import' },
  { value: 'website', label: 'Website Form' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'other', label: 'Other' },
];

export default function LeadFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [assignees, setAssignees] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getLeadAssignees()
        .then((res) => {
          if (res.data) setAssignees(res.data);
        })
        .catch((err) => {
          console.error('Failed to load assignees:', err);
        });

      if (initialData && isEditing) {
        const currentAssigneeId =
          initialData.assignedTo?._id ||
          initialData.assignedTo?.id ||
          initialData.assignedTo ||
          '';

        setFormData({
          name: initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          company: initialData.company || '',
          requirement: initialData.requirement || '',
          budget: initialData.budget ?? 0,
          source: initialData.source || 'manual',
          status: initialData.status || 'new',
          priority: initialData.priority || 'medium',
          assignedTo: currentAssigneeId,
        });
      } else {
        setFormData(INITIAL_FORM);
      }
      setErrors({});
      setServerError('');
    }
  }, [isOpen, initialData, isEditing]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Lead name must be at least 2 characters';
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }
    if (formData.budget < 0) {
      newErrors.budget = 'Budget cannot be negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        phone: formData.phone.trim(),
        requirement: formData.requirement.trim(),
        budget: Number(formData.budget) || 0,
        assignedTo: formData.assignedTo ? formData.assignedTo : null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      if (err.data?.errors && Array.isArray(err.data.errors)) {
        const fieldErrors = {};
        err.data.errors.forEach((e) => {
          const field = e.path?.[0] || e.path;
          if (field) fieldErrors[field] = e.message;
        });
        setErrors(fieldErrors);
        setServerError('Please fix the validation errors below.');
      } else {
        setServerError(err.message || 'An error occurred while saving the lead.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? undefined : onClose}
      size="2xl"
      ariaLabelledBy="lead-modal-title"
    >
      <ModalHeader onClose={submitting ? undefined : onClose}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            {isEditing ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          </div>
          <div>
            <ModalTitle id="lead-modal-title">
              {isEditing ? 'Edit Lead Details' : 'Create New Lead'}
            </ModalTitle>
            <ModalDescription>
              {isEditing
                ? 'Update prospective client information and stage.'
                : 'Add a new prospect to your sales pipeline.'}
            </ModalDescription>
          </div>
        </div>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          {serverError && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Row 1: Name & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Lead Name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Sarah Jenkins"
              error={errors.name}
              disabled={submitting}
            />

            <Input
              label="Company Name"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
              disabled={submitting}
            />
          </div>

          {/* Row 2: Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="sarah@acmecorp.com"
              error={errors.email}
              disabled={submitting}
            />

            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 019-2834"
              disabled={submitting}
            />
          </div>

          {/* Row 3: Status, Priority, Source */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Pipeline Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={STATUS_OPTIONS}
              disabled={submitting}
            />

            <Select
              label="Priority Level"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={PRIORITY_OPTIONS}
              disabled={submitting}
            />

            <Select
              label="Acquisition Source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              options={SOURCE_OPTIONS}
              disabled={submitting}
            />
          </div>

          {/* Row 4: Assigned Representative & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assigned Representative"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              options={[
                { value: '', label: 'Unassigned (No owner)' },
                ...assignees.map((u) => ({
                  value: u.id || u._id,
                  label: `${u.name} (${u.role.toUpperCase()})`,
                })),
              ]}
              disabled={submitting}
            />

            <Input
              label="Estimated Budget ($ USD)"
              name="budget"
              type="number"
              min="0"
              step="100"
              value={formData.budget}
              onChange={handleChange}
              placeholder="e.g. 15000"
              error={errors.budget}
              disabled={submitting}
              helperText="Estimated deal value used in pipeline forecasting"
            />
          </div>

          {/* Row 5: Requirements */}
          <Textarea
            label="Business Requirements & Project Context"
            name="requirement"
            rows={3}
            value={formData.requirement}
            onChange={handleChange}
            placeholder="Describe client requirements, timeline, budget constraints, and key business pain points..."
            disabled={submitting}
          />
        </ModalBody>

        <ModalFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={submitting}
            icon={isEditing ? Save : UserPlus}
          >
            {submitting ? 'Saving Lead...' : isEditing ? 'Update Lead' : 'Create Lead'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
