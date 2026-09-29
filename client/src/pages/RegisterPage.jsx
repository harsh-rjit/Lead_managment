import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../api/authApi';
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
  Loader2,
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error as user types
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
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
    <div className="max-w-xl mx-auto py-4 sm:py-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Your SaaS Organization
        </h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Get started with AI Business Operations. You will be the primary administrator.
        </p>
      </div>

      {/* Success State Card */}
      {successData ? (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 text-emerald-700">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Organization Created!</h2>
              <p className="text-sm text-slate-600">Admin account registered successfully.</p>
            </div>
          </div>

          {/* Details Summary */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Administrator</span>
              <span className="font-semibold text-slate-800">{successData.user?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Work Email</span>
              <span className="font-semibold text-slate-800 font-mono text-xs sm:text-sm">
                {successData.user?.email}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Role</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs uppercase tracking-wider">
                <Shield className="w-3 h-3" />
                {successData.user?.role}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Organization</span>
              <span className="font-semibold text-slate-800">
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

          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Next in V1 Architecture:</p>
              <p className="mt-0.5 text-indigo-900">
                Your credentials are encrypted using bcrypt (10 rounds) and safely stored in MongoDB. Login and JWT issuance will be connected next.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all"
            >
              Back to System Status
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                setSuccessData(null);
                setFormData({ name: '', email: '', password: '', organizationName: '' });
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all cursor-pointer"
            >
              Register Another Organization
            </button>
          </div>
        </div>
      ) : (
        /* Registration Form Card */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Registration Failed</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Organization Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Organization / Company Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Sales Corp"
                  disabled={loading}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none ${
                    fieldErrors.organizationName
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                  }`}
                />
              </div>
              {fieldErrors.organizationName && (
                <p className="text-xs text-rose-600 mt-1 font-medium">
                  {fieldErrors.organizationName}
                </p>
              )}
            </div>

            {/* Administrator Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Morgan"
                  disabled={loading}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none ${
                    fieldErrors.name
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                  }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.name}</p>
              )}
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@acmecorp.com"
                  disabled={loading}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none ${
                    fieldErrors.email
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters (letters & numbers)"
                  disabled={loading}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none ${
                    fieldErrors.password
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.password}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Must be at least 8 characters long, containing letters and numbers.
              </p>
            </div>

            {/* Role Notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600">
              <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Registering creates a brand-new multi-tenant organization. You will be assigned the <strong>Admin</strong> role.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Organization & Account...
                </>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
