import React, { useState, useEffect } from 'react';
import { getOrgSettings, updateOrgSettings } from '../api/organizationApi';
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function OrgSettingsPage() {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    leadAutoAssignment: false,
    defaultAiTone: 'professional',
    maxMonthlyAiQueries: 500,
  });

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await getOrgSettings();
        setOrg(res.data);
        setFormData({
          name: res.data.name || '',
          leadAutoAssignment: res.data.settings?.leadAutoAssignment || false,
          defaultAiTone: res.data.settings?.defaultAiTone || 'professional',
          maxMonthlyAiQueries: res.data.settings?.maxMonthlyAiQueries || 500,
        });
      } catch (err) {
        setError(err.message || 'Failed to load organization settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await updateOrgSettings({
        name: formData.name,
        settings: {
          leadAutoAssignment: formData.leadAutoAssignment,
          defaultAiTone: formData.defaultAiTone,
          maxMonthlyAiQueries: formData.maxMonthlyAiQueries,
        },
      });
      setOrg(res.data);
      setSuccess('Organization settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Loading organization settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Organization Settings
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
            Admin Only
          </span>
        </div>
        <p className="text-slate-600 mt-1 text-sm">
          Configure organization branding, AI operations tone, and automation defaults.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Organization Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none"
          />
          <p className="text-xs text-slate-500 mt-1">Tenant Slug: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{org?.slug}</code> (immutable)</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Default AI Tone for Follow-ups
          </label>
          <select
            value={formData.defaultAiTone}
            onChange={(e) => setFormData({ ...formData, defaultAiTone: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-indigo-600 focus:outline-none"
          >
            <option value="professional">Professional & Direct</option>
            <option value="friendly">Warm & Consultative</option>
            <option value="urgent">Action-Oriented & Urgent</option>
            <option value="persuasive">Persuasive & Value-Driven</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">Gemini API will adopt this tone when generating automated emails and SMS.</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <div className="text-sm font-semibold text-slate-900">Automatic Lead Assignment</div>
            <p className="text-xs text-slate-500">Automatically assign new leads to available sales representatives round-robin.</p>
          </div>
          <input
            type="checkbox"
            checked={formData.leadAutoAssignment}
            onChange={(e) => setFormData({ ...formData, leadAutoAssignment: e.target.checked })}
            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving Settings...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
