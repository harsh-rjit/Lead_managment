import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Sparkles,
  Building2,
  LogOut,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function TopNavbar({ onOpenMobileSidebar }) {
  const { user, organization, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // Generate readable breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/dashboard') return [{ label: 'Dashboard' }];
    if (path === '/leads') return [{ label: 'Lead Pipeline' }];
    if (path.startsWith('/leads/')) return [{ label: 'Lead Pipeline', href: '/leads' }, { label: 'Lead Details' }];
    if (path === '/team') return [{ label: 'Administration' }, { label: 'Team Members' }];
    if (path === '/settings') return [{ label: 'Administration' }, { label: 'Org Settings' }];
    if (path === '/blueprint') return [{ label: 'System' }, { label: 'Architecture Blueprint' }];
    if (path === '/') return [{ label: 'Dashboard' }];
    return [{ label: 'Overview' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger & Dynamic Breadcrumbs */}
          <div className="flex items-center gap-3">
            {/* Mobile menu hamburger button */}
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              aria-label="Open sidebar menu"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation Trail */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
              <Link
                to="/dashboard"
                className="font-medium text-slate-400 hover:text-slate-700 transition"
              >
                OpsAI
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
                  {crumb.href ? (
                    <Link
                      to={crumb.href}
                      className="font-medium text-slate-500 hover:text-slate-800 transition"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-bold text-slate-900">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Right: Tenant info & User Profile Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Organization pill (hidden on small screens) */}
                {organization && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{organization.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase border border-indigo-100">
                      {organization.plan || 'Free'}
                    </span>
                  </div>
                )}

                {/* User Profile Pill */}
                <div className="flex items-center gap-2 pl-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-800 leading-tight">
                      {user?.name}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {user?.role}
                    </div>
                  </div>
                </div>

                {/* Quick sign out button */}
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  aria-label="Sign out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
