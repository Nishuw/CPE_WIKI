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
import UserProfilePage from './pages/UserProfilePage'; // Import UserProfilePage

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
    // console.log("ProtectedRoute: Not authenticated, navigating to login");
    return <Navigate to="/login" replace />;
  }

  // console.log("ProtectedRoute: Authenticated");
  return <>{children}</>;
};

// Admin Route Component - Still renders Layout and Outlet internally
const AdminRoute: React.FC = () => {
  const { isAdmin, isLoading, isAuthenticated } = useAuth(); // Get isAuthenticated here too

   // Admin check should happen AFTER authentication is confirmed
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-600">Carregando permissões...</div>;
  }

  // If not authenticated at this point, ProtectedRoute should have already redirected. 
  // But as a fallback or for clarity:
  if (!isAuthenticated) {
       // This case should ideally not be hit if AdminRoute is nested within ProtectedRoute
       // console.warn("AdminRoute: Not authenticated, unexpected state.");
       return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // console.log("AdminRoute: Not admin, navigating to home");
    return <Navigate to="/" replace />;
  }

  // console.log("AdminRoute: Is admin");
  return (
     // Admin content is wrapped in Layout
    <Layout>
        <Outlet />
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <Router>   
          <Routes>
            {/* Public Route (Login) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Route for User Profile */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes (using Layout) */}
             {/* The root path and other main app routes that use the sidebar/header/layout */}
            <Route
              path="/"
              element={ // Protect these routes and apply the Layout
                <ProtectedRoute>
                   {/* Render Layout directly here if its children should be the nested routes */}
                  <Layout /> 
                </ProtectedRoute>
              }
            >
              {/* Nested protected routes - these will be rendered within the Layout's Outlet */} 
              <Route index element={<HomePage />} />
              <Route path="topics/:topicId" element={<TopicPage />} />
              <Route path="topics/:topicId/content/:contentId" element={<ContentViewPage />} />
            </Route>

            {/* Admin Routes (Protected and Admin-specific, using Layout via AdminRoute) */}
            <Route
              path="/admin"
              element={ // Protect the entire admin section
                <ProtectedRoute> {/* Ensures authentication first */}
                  <AdminRoute /> {/* Ensures admin role and renders nested routes within its Layout */}
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