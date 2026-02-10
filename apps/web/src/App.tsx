import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/auth.store';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdvisorLayout } from '@/layouts/AdvisorLayout';
import AppLayout from '@/layouts/AppLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Profile Page (used in app layout)
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

// Security Gap Analysis Page
import { SecurityGapAnalysisPage } from '@/pages/admin/SecurityGapAnalysisPage';

// Knowledge Base Page
import { KnowledgeBasePage } from '@/pages/admin/KnowledgeBasePage';

// Notifications Page
import { NotificationsPage } from '@/pages/admin/NotificationsPage';

// App Pages (Business Application)
import {
  AppHomePage,
  BusinessSetupWizardPage,
  FormationPage,
  OperationsPage,
  TasksPage,
  DocumentsPage,
  DashboardsPage,
} from '@/pages/app';
import { BillingPage } from '@/pages/app/BillingPage';

// Pricing Page (public)
import { PricingPage } from '@/pages/PricingPage';

// Advisor Pages
import { AdvisorDashboardPage } from '@/pages/advisor/AdvisorDashboardPage';
import { ClientDetailPage } from '@/pages/advisor/ClientDetailPage';

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
    return <Navigate to="/app/home" replace />;
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

        {/* Pricing Page (accessible to all) */}
        <Route path="/pricing" element={<PricingPage />} />

        {/* Redirect old dashboard to new app home */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navigate to="/app/home" replace />
            </ProtectedRoute>
          }
        />
        {/* Redirect profile to app - profile will be in app layout */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Navigate to="/app/profile" replace />
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
          {/* Security Gap Analysis */}
          <Route path="security-gaps" element={<SecurityGapAnalysisPage />} />
          {/* Knowledge Base */}
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          {/* Notifications */}
          <Route path="notifications" element={<NotificationsPage />} />
          {/* Access Review Campaigns */}
          <Route path="access-review-campaigns" element={<AccessReviewCampaignsPage />} />
          <Route path="access-review-campaigns/new" element={<AccessReviewCampaignWizardPage />} />
          <Route path="access-review-campaigns/:id" element={<AccessReviewCampaignDetailPage />} />
          <Route path="access-review-campaigns/:id/edit" element={<AccessReviewCampaignDetailPage />} />
        </Route>

        {/* Advisor Portal Routes */}
        <Route
          path="/advisor"
          element={
            <ProtectedRoute>
              <AdvisorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdvisorDashboardPage />} />
          <Route path="clients" element={<AdvisorDashboardPage />} />
          <Route path="clients/:tenantId" element={<ClientDetailPage />} />
        </Route>

        {/* Business App Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/home" replace />} />
          <Route path="home" element={<AppHomePage />} />
          <Route path="setup" element={<BusinessSetupWizardPage />} />
          <Route path="formation" element={<FormationPage />} />
          <Route path="operations" element={<OperationsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="dashboards" element={<DashboardsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="profile" element={<ProfilePage />} />
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
