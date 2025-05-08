import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import Layout from './components/layout/Layout';
import { Toaster } from 'react-hot-toast'; // Toaster importado

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import TopicPage from './pages/TopicPage';
import ContentViewPage from './pages/ContentViewPage';
import UserProfilePage from './pages/UserProfilePage';

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
    return <div className="flex items-center justify-center min-h-screen text-gray-600">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Admin Route Component - Voltando a renderizar seu próprio Layout
const AdminRoute: React.FC = () => {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-600">Carregando permissões...</div>;
  }

  if (!isAuthenticated) {
       return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout> {/* AdminRoute renderiza Layout e Outlet */}
        <Outlet />
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <Router>
          <Toaster // Toaster mantido
            position="top-right"
            reverseOrder={false}
          />
          <Routes>
            {/* Public Route (Login) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Route for User Profile (estrutura anterior) */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes (usando Layout principal) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout /> 
                </ProtectedRoute>
              }
            >
              {/* Rotas aninhadas que serão renderizadas dentro do Outlet do Layout principal */}
              <Route index element={<HomePage />} />
              <Route path="topics/:topicId" element={<TopicPage />} />
              <Route path="topics/:topicId/content/:contentId" element={<ContentViewPage />} />
            </Route>

            {/* Admin Routes (estrutura anterior, AdminRoute com seu próprio Layout) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminRoute />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="topics" element={<TopicManagementPage />} />
              <Route path="topics/new" element={<NewTopicPage />} />
              <Route path="topics/:topicId" element={<TopicDetailPage />} />
              <Route path="topics/:topicId/content/:contentId/edit" element={<ContentEditPage />} />
              <Route path="users" element={<UserManagementPage />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ContentProvider>
    </AuthProvider>
  );
}

export default App;
