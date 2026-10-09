import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  FileCode,
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
} from 'lucide-react';

export default function Sidebar({
  isOpen = true,
  onClose = null,
  isMobile = false,
  collapsed = false,
  onToggleCollapse = null,
}) {
  const { user, organization, logout } = useAuth();

  const navSections = [
    {
      title: 'Operations',
      links: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          name: 'Lead Pipeline',
          path: '/leads',
          icon: Users,
          badge: null,
        },
      ],
    },
    ...(user?.role === 'admin'
      ? [
          {
            title: 'Governance',
            links: [
              {
                name: 'Team Members',
                path: '/team',
                icon: Shield,
                badge: 'Admin',
              },
              {
                name: 'Org Settings',
                path: '/settings',
                icon: Settings,
                badge: null,
              },
            ],
          },
        ]
      : []),
    {
      title: 'System & Specs',
      links: [
        {
          name: 'Architecture',
          path: '/blueprint',
          icon: FileCode,
          badge: 'V1',
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 group focus:outline-none"
          onClick={isMobile ? onClose : undefined}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-slate-900 text-sm tracking-tight block truncate">
                OpsAI <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60 uppercase">SaaS</span>
              </span>
              <span className="text-[11px] text-slate-400 block truncate -mt-0.5 font-medium">
                Business Operations
              </span>
            </div>
          )}
        </Link>

        {isMobile ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )
        )}
      </div>

      {/* Tenant / Organization Pill */}
      {!collapsed && organization && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900 truncate">
              {organization.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
            <span className="capitalize">{organization.plan || 'Free'} Plan</span>
            <span>&bull;</span>
            <span className="font-mono text-[10px]">{organization.slug}</span>
          </div>
        </div>
      )}

      {/* Navigation Links Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            )}
            <nav className="space-y-0.5">
              {section.links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === '/'}
                    onClick={isMobile ? onClose : undefined}
                    title={collapsed ? link.name : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      } ${collapsed ? 'justify-center px-2' : ''}`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <span className="truncate flex-1">{link.name}</span>
                    )}
                    {!collapsed && link.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs ${
            collapsed ? 'justify-center p-1.5' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {user?.name}
                </span>
              </div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200/60 mt-0.5">
                {user?.role}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            aria-label="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile drawer wrapper
  if (isMobile) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex lg:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={onClose}
        />
        {/* Drawer panel */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl animate-in slide-in-from-left duration-200">
          {sidebarContent}
        </div>
      </div>
    );
  }

  // Desktop sidebar wrapper
  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 transition-all duration-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="fixed top-0 bottom-0 z-30 flex flex-col transition-all duration-200 border-r border-slate-200 bg-white"
        style={{ width: collapsed ? '5rem' : '16rem' }}
      >
        {sidebarContent}
      </div>
    </aside>
  );
}
