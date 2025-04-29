import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import TopicPage from './pages/TopicPage';
import ContentViewPage from './pages/ContentViewPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import TopicManagementPage from './pages/admin/TopicManagementPage';
import TopicDetailPage from './pages/admin/TopicDetailPage';
import ContentEditPage from './pages/admin/ContentEditPage';
import NewTopicPage from './pages/admin/NewTopicPage';
import UserManagementPage from './pages/admin/UserManagementPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component
const AdminRoute: React.FC = () => {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
        <Outlet />
    </Layout>
  );
};

function App() {
  // Removed isAuthenticated, isLoading from App component scope as they are used within Protected/Admin routes

  return (
    <AuthProvider>
      <ContentProvider>
        <Router>   
          <Routes>
            {/* Public Route (Login) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes - Reverted to using ProtectedRoute as the element */}
            <Route
              path="/"
              element={ // Protect the main application routes
                <ProtectedRoute>
                  <Layout /> {/* Layout for protected content */}
                </ProtectedRoute>
              }
            >
              {/* Nested protected routes - these will be rendered within the Layout's Outlet */} 
              <Route index element={<HomePage />} />
              <Route path="topics/:topicId" element={<TopicPage />} />
              <Route path="topics/:topicId/content/:contentId" element={<ContentViewPage />} />
            </Route>

            {/* Admin Routes - Protected and Admin-specific */}
            <Route
              path="/admin"
              element={ // Protect the entire admin section
                <ProtectedRoute> {/* Ensures authentication */}
                  <AdminRoute /> {/* Ensures admin role and renders nested routes */}
                </ProtectedRoute>
              }
            >
              {/* Nested Admin routes - rendered via Outlet in AdminRoute */}
                <Route index element={<AdminDashboard />} />
              <Route path="topics" element={<TopicManagementPage />} />
              <Route path="topics/new" element={<NewTopicPage />} />
              <Route path="topics/:topicId" element={<TopicDetailPage />} />
              <Route path="topics/:topicId/content/:contentId/edit" element={<ContentEditPage />} />
              <Route path="users" element={<UserManagementPage />} />
            </Route>

            {/* Fallback Route - Redirect to root, which is protected by ProtectedRoute */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ContentProvider>
    </AuthProvider>
  );
}

export default App;