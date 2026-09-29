import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import ProtectedRoute from './components/routing/ProtectedRoute';
import RoleBasedRoute from './components/routing/RoleBasedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<HealthPage />} />
            <Route path="blueprint" element={<BlueprintPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="login" element={<LoginPage />} />

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
      </AuthProvider>
    </BrowserRouter>
  );
}
