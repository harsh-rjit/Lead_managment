import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/ToastContext';
import Layout from './components/layout/Layout';
import HealthPage from './pages/HealthPage';
import BlueprintPage from './pages/BlueprintPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import TeamManagementPage from './pages/TeamManagementPage';
import OrgSettingsPage from './pages/OrgSettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/routing/ProtectedRoute';
import RoleBasedRoute from './components/routing/RoleBasedRoute';

function IndexRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public Routes */}
              <Route index element={<IndexRedirect />} />
              <Route path="blueprint" element={<BlueprintPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="health" element={<HealthPage />} />

              {/* General Protected Routes (All Authenticated Roles) */}
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="leads/:id" element={<LeadDetailPage />} />

                {/* Admin-Only Protected Routes */}
                <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
                  <Route path="team" element={<TeamManagementPage />} />
                  <Route path="settings" element={<OrgSettingsPage />} />
                </Route>
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
