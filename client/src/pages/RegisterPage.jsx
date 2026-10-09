import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../api/authApi';
import { useToast } from '../components/common/ToastContext';

// Design System Primitives
import Button from '../components/common/Button';
import { Card } from '../components/common/Card';
import Input from '../components/common/Input';
import { Badge } from '../components/common/Badge';

import {
  User,
  Mail,
  Lock,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successData, setSuccessData] = useState(null);
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (error) setError(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }
    if (!formData.organizationName.trim() || formData.organizationName.trim().length < 2) {
      errors.organizationName = 'Organization name must be at least 2 characters';
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errors.password = 'Password must contain at least one letter and one number';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser(formData);
      setSuccessData(response.data);
      toast.success('Organization registered successfully! You can now sign in.', 'Tenant Created');
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg, 'Registration Error');
      if (err.data?.details) {
        const backendErrors = {};
        err.data.details.forEach((d) => {
          if (d.field) backendErrors[d.field] = d.message;
        });
        setFieldErrors(backendErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto py-4 sm:py-8 px-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-xs mb-3">
          <Sparkles className="w-6 h-6 text-amber-300" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Your SaaS Organization
        </h1>
        <p className="text-slate-500 mt-2 text-xs sm:text-sm">
          Get started with AI Business Operations. You will be the primary administrator.
        </p>
      </div>

      {/* Success State Card */}
      {successData ? (
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 text-emerald-700">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Organization Created!</h2>
              <p className="text-xs text-slate-600">Admin account registered successfully.</p>
            </div>
          </div>

          {/* Details Summary */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Administrator</span>
              <span className="font-bold text-slate-800">{successData.user?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Work Email</span>
              <span className="font-semibold text-slate-800 font-mono text-xs">
                {successData.user?.email}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Role</span>
              <Badge variant="purple" size="xs">
                {successData.user?.role}
              </Badge>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Organization</span>
              <span className="font-bold text-slate-800">
                {successData.organization?.name}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Tenant Slug</span>
              <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                {successData.organization?.slug}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/login" className="flex-1">
              <Button
                variant="primary"
                size="md"
                fullWidth={true}
                rightIcon={ArrowRight}
              >
                Proceed to Sign In
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setSuccessData(null);
                setFormData({ name: '', email: '', password: '', organizationName: '' });
              }}
            >
              Register Another Org
            </Button>
          </div>
        </Card>
      ) : (
        /* Registration Form Card */
        <Card className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Registration Failed</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Organization / Company Name"
              name="organizationName"
              required
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="e.g. Acme Sales Corp"
              disabled={loading}
              error={fieldErrors.organizationName}
              icon={Building2}
            />

            <Input
              label="Your Full Name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Alex Morgan"
              disabled={loading}
              error={fieldErrors.name}
              icon={User}
            />

            <Input
              label="Work Email Address"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@acmecorp.com"
              disabled={loading}
              error={fieldErrors.email}
              icon={Mail}
            />

            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters (letters & numbers)"
              disabled={loading}
              error={fieldErrors.password}
              icon={Lock}
              helperText="Must be at least 8 characters, containing letters and numbers."
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600">
              <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Registering creates a brand-new tenant organization with you as the <strong>Admin</strong>.
              </span>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth={true}
                loading={loading}
                rightIcon={ArrowRight}
              >
                {loading ? 'Creating Organization...' : 'Complete Registration'}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-indigo-600 hover:text-indigo-700 transition"
            >
              Sign In
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
