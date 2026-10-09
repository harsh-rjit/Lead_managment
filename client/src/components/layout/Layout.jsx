import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import Footer from './Footer';
import { Sparkles } from 'lucide-react';

export default function Layout() {
  const { isAuthenticated } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // If user is authenticated, render standard B2B SaaS Layout: Sidebar + TopNavbar + Main
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
        {/* Desktop Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Mobile Slide-Over Sidebar Drawer */}
        <Sidebar
          isMobile={true}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Outlet />
          </main>

          <Footer />
        </div>
      </div>
    );
  }

  // Unauthenticated Layout (Public / Login / Register / Health / Blueprint)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Clean Public Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 tracking-tight block">
                  OpsAI <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">SaaS</span>
                </span>
                <span className="text-[11px] text-slate-500 block -mt-0.5">
                  AI Business Operations Platform
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-3">
              {location.pathname === '/login' ? (
                <>
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    Don't have an account?
                  </span>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                  >
                    Get Started
                  </Link>
                </>
              ) : location.pathname === '/register' ? (
                <>
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    Already have an organization?
                  </span>
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/blueprint"
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      location.pathname === '/blueprint'
                        ? 'bg-slate-100 text-indigo-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Architecture
                  </Link>
                  <div className="h-4 w-px bg-slate-200 mx-1" aria-hidden="true" />
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
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
