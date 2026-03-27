// Admin module - CMS admin functionality with authentication
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { FluentProvider } from '@fluentui/react-components';
import { adminTheme } from './theme';
import { AuthProvider } from './auth/AuthContext';
import { PortfolioProvider } from './auth/PortfolioContext';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContentListPage from './pages/ContentListPage';
import ContentEditorPage from './pages/ContentEditorPage';
import SchemaListPage from './pages/SchemaListPage';
import SchemaEditorPage from './pages/SchemaEditorPage';

const AdminApp: React.FC = () => {
  // Override global styles to prevent dark edges and ensure full-width coverage
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const appDiv = root?.querySelector('.App') as HTMLElement | null;

    // Save originals
    const saved = {
      htmlBg: html.style.backgroundColor,
      htmlOverflow: html.style.overflow,
      bodyBg: body.style.backgroundColor,
      bodyMargin: body.style.margin,
      bodyOverflow: body.style.overflow,
      rootWidth: root?.style.width || '',
      rootOverflow: root?.style.overflow || '',
      appWidth: appDiv?.style.width || '',
      appMaxWidth: appDiv?.style.maxWidth || '',
      appOverflow: appDiv?.style.overflow || '',
    };

    // Force full-width chain: html -> body -> #root -> .App
    html.style.backgroundColor = '#f8f9fb';
    html.style.overflow = 'hidden';
    body.style.backgroundColor = '#f8f9fb';
    body.style.margin = '0';
    body.style.overflow = 'hidden';
    if (root) {
      root.style.width = '100%';
      root.style.overflow = 'hidden';
    }
    if (appDiv) {
      appDiv.style.width = '100%';
      appDiv.style.maxWidth = '100%';
      appDiv.style.overflow = 'hidden';
    }

    // Hide #scrool ::before/::after decorative lines in admin view
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-admin-override', 'true');
    styleTag.textContent = '#scrool::before, #scrool::after { display: none !important; }';
    document.head.appendChild(styleTag);

    return () => {
      html.style.backgroundColor = saved.htmlBg;
      html.style.overflow = saved.htmlOverflow;
      body.style.backgroundColor = saved.bodyBg;
      body.style.margin = saved.bodyMargin;
      body.style.overflow = saved.bodyOverflow;
      if (root) {
        root.style.width = saved.rootWidth;
        root.style.overflow = saved.rootOverflow;
      }
      if (appDiv) {
        appDiv.style.width = saved.appWidth;
        appDiv.style.maxWidth = saved.appMaxWidth;
        appDiv.style.overflow = saved.appOverflow;
      }
      styleTag.remove();
    };
  }, []);

  return (
    <FluentProvider theme={adminTheme} style={{ minHeight: '100vh' }}>
      <AuthProvider>
        <PortfolioProvider>
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

          <Route
            path="content/:entityType/:recordId"
            element={
              <ProtectedRoute>
                <ContentEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Schema management routes */}
          <Route
            path="schema"
            element={
              <ProtectedRoute>
                <SchemaListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="schema/:id"
            element={
              <ProtectedRoute>
                <SchemaEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
        </PortfolioProvider>
      </AuthProvider>
    </FluentProvider>
  );
};

export default AdminApp;
