import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/auth.store';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Dashboard Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProfilePage } from '@/pages/dashboard/ProfilePage';

// Admin Pages
import {
  AdminDashboardPage,
  UsersPage,
  RolesPage,
  GroupsPage,
  AdvisorAssignmentsPage,
  AccessRequestsPage,
  ApiKeysPage,
  AuditLogsPage,
  AccessReviewsPage,
  GovernancePage,
} from '@/pages/admin';

// Access Review Campaign Pages
import { AccessReviewCampaignsPage } from '@/pages/admin/AccessReviewCampaignsPage';
import { AccessReviewCampaignDetailPage } from '@/pages/admin/AccessReviewCampaignDetailPage';
import { AccessReviewCampaignWizardPage } from '@/pages/admin/AccessReviewCampaignWizardPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Navigate to="/login" replace />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Portal Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="advisor-assignments" element={<AdvisorAssignmentsPage />} />
          <Route path="access-requests" element={<AccessRequestsPage />} />
          <Route path="api-keys" element={<ApiKeysPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="access-reviews" element={<AccessReviewsPage />} />
          <Route path="governance" element={<GovernancePage />} />
          {/* Access Review Campaigns */}
          <Route path="access-review-campaigns" element={<AccessReviewCampaignsPage />} />
          <Route path="access-review-campaigns/new" element={<AccessReviewCampaignWizardPage />} />
          <Route path="access-review-campaigns/:id" element={<AccessReviewCampaignDetailPage />} />
          <Route path="access-review-campaigns/:id/edit" element={<AccessReviewCampaignDetailPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
