import React, { useState, useEffect } from 'react';
import { getOrgSettings, updateOrgSettings } from '../api/organizationApi';
import { useToast } from '../components/common/ToastContext';

// Design System Primitives
import Button from '../components/common/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { SkeletonCard } from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';

import {
  Save,
  Building2,
  Sparkles,
} from 'lucide-react';

const AI_TONE_OPTIONS = [
  { value: 'professional', label: 'Professional & Direct' },
  { value: 'friendly', label: 'Warm & Consultative' },
  { value: 'urgent', label: 'Action-Oriented & Urgent' },
  { value: 'persuasive', label: 'Persuasive & Value-Driven' },
];

export default function OrgSettingsPage() {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    leadAutoAssignment: false,
    defaultAiTone: 'professional',
    maxMonthlyAiQueries: 500,
  });

  const fetchOrg = async () => {
    setLoading(true);
    setError(null);
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

  useEffect(() => {
    fetchOrg();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

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
      toast.success('Organization configurations saved successfully!', 'Settings Saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.', 'Settings Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-4">
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  if (error && !org) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="p-8">
          <ErrorState
            title="Failed to load settings"
            message={error}
            onRetry={fetchOrg}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Organization Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[11px] font-bold uppercase tracking-wider border border-purple-200">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure tenant branding, Gemini AI follow-up tone, and assignment automation
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader border={true}>
            <CardTitle>Tenant Configuration</CardTitle>
            <CardDescription>
              Changes applied here instantly affect all users in this tenant environment
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Organization Name */}
            <div>
              <Input
                label="Organization / Company Name"
                name="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={saving}
              />
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Tenant Slug: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">{org?.slug}</code> (System-assigned, immutable)
              </p>
            </div>

            {/* Default AI Tone */}
            <Select
              label="Default AI Follow-Up Tone"
              name="defaultAiTone"
              value={formData.defaultAiTone}
              onChange={(e) => setFormData({ ...formData, defaultAiTone: e.target.value })}
              options={AI_TONE_OPTIONS}
              disabled={saving}
              helperText="Google Gemini API will adopt this tone when drafting automated follow-ups"
            />

            {/* Max AI Queries */}
            <Input
              label="Monthly AI Analysis Quota"
              name="maxMonthlyAiQueries"
              type="number"
              min="50"
              step="50"
              value={formData.maxMonthlyAiQueries}
              onChange={(e) => setFormData({ ...formData, maxMonthlyAiQueries: Number(e.target.value) })}
              disabled={saving}
              helperText="Fair-use query ceiling allocated per billing cycle"
            />

            {/* Toggle: Automatic Lead Assignment */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="pr-4">
                <label htmlFor="lead-auto-assignment" className="text-xs font-bold text-slate-900 cursor-pointer">
                  Automatic Lead Assignment
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automatically distribute newly captured inbound leads to active sales representatives in round-robin sequence.
                </p>
              </div>
              <input
                id="lead-auto-assignment"
                type="checkbox"
                checked={formData.leadAutoAssignment}
                onChange={(e) => setFormData({ ...formData, leadAutoAssignment: e.target.checked })}
                disabled={saving}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={saving}
              icon={Save}
            >
              {saving ? 'Saving Settings...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
