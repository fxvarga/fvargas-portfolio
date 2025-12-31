// Admin module - CMS admin functionality with authentication
import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContentListPage from './pages/ContentListPage';
import ContentEditorPage from './pages/ContentEditorPage';
import './styles/admin.css';

const AdminApp: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Login route - public */}
        <Route path="login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="content"
          element={
            <ProtectedRoute>
              <ContentListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="content/:entityType"
          element={
            <ProtectedRoute>
              <ContentEditorPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default AdminApp;
