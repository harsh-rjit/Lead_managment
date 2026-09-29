import React, { useState, useEffect } from 'react';
import { X, Loader2, UserPlus, Save, AlertCircle } from 'lucide-react';

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
};

export default function LeadFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync form state when initialData changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData && isEditing) {
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
        });
      } else {
        setFormData(INITIAL_FORM);
      }
      setErrors({});
      setServerError('');
    }
  }, [isOpen, initialData, isEditing]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
    // Clear specific field error
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
      // Prepare payload: clean empty string email to prevent validation noise if needed
      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        phone: formData.phone.trim(),
        requirement: formData.requirement.trim(),
        budget: Number(formData.budget) || 0,
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      if (err.data?.errors && Array.isArray(err.data.errors)) {
        // Map backend zod validation errors to form fields
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {isEditing ? <Save className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Lead Details' : 'Create New Lead'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Update prospective client information and stage.'
                  : 'Add a new prospect to your multi-tenant sales pipeline.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Server error alert */}
          {serverError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Row 1: Name and Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Sarah Jenkins"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none transition ${
                  errors.name
                    ? 'border-rose-300 focus:border-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:border-indigo-600'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g. Acme Corp"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-indigo-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Row 2: Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="sarah@acmecorp.com"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none transition ${
                  errors.email
                    ? 'border-rose-300 focus:border-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:border-indigo-600'
                }`}
              />
              {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-indigo-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Row 3: Status, Priority, Source */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none transition"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="won">Closed Won</option>
                <option value="lost">Closed Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none transition"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none transition"
              >
                <option value="manual">Manual Entry</option>
                <option value="csv">CSV Import</option>
                <option value="website">Website Form</option>
                <option value="referral">Referral</option>
                <option value="linkedin">LinkedIn</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 4: Budget */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estimated Budget ($ USD)
            </label>
            <input
              type="number"
              name="budget"
              min="0"
              step="100"
              value={formData.budget}
              onChange={handleChange}
              placeholder="e.g. 15000"
              className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none transition ${
                errors.budget
                  ? 'border-rose-300 focus:border-rose-500 bg-rose-50/30'
                  : 'border-slate-300 focus:border-indigo-600'
              }`}
            />
            {errors.budget && <p className="text-[11px] text-rose-500 mt-1">{errors.budget}</p>}
          </div>

          {/* Row 5: Requirement / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Requirements & Context
            </label>
            <textarea
              name="requirement"
              rows={3}
              value={formData.requirement}
              onChange={handleChange}
              placeholder="Describe client requirements, business scope, timeline, and key pain points..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-indigo-600 focus:outline-none transition resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? 'Saving Lead...' : isEditing ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
