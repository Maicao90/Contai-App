import { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/protected-route";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

const LandingPage = lazy(() => import("@/pages/landing"));
const LoginPage = lazy(() => import("@/pages/login"));
const SignupPage = lazy(() => import("@/pages/signup"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const TermsPage = lazy(() => import("@/pages/terms"));
const DataDeletionPage = lazy(() => import("@/pages/data-deletion"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const AppDashboardPage = lazy(() => import("@/pages/app-dashboard"));
const AppTransactionsPage = lazy(() => import("@/pages/app-transactions"));
const AppBillsPage = lazy(() => import("@/pages/app-bills"));
const AppAgendaPage = lazy(() => import("@/pages/app-agenda"));
const AppReportsPage = lazy(() => import("@/pages/app-reports"));
const AppCategoriesPage = lazy(() => import("@/pages/app-categories"));
const AppMetasPage = lazy(() => import("@/pages/app-metas"));
const AppMembersPage = lazy(() => import("@/pages/app-members"));
const AppIntegrationsPage = lazy(() => import("@/pages/app-integrations"));
const AppReferralsPage = lazy(() => import("@/pages/app-referrals"));
const AppSubscriptionPage = lazy(() => import("@/pages/app-subscription"));
const SubscriptionPage = lazy(() => import("@/pages/assinatura"));
const AppSettingsPage = lazy(() => import("@/pages/app-settings"));
const AdminAccessPage = lazy(() => import("@/pages/admin-access"));
const AdminDashboardPage = lazy(() => import("@/pages/admin-dashboard"));
const AdminUserDetailPage = lazy(() => import("@/pages/admin-user-detail"));
const AdminUsersPage = lazy(() => import("@/pages/admin-users"));
const AdminHouseholdDetailPage = lazy(() => import("@/pages/admin-household-detail"));
const AdminHouseholdsPage = lazy(() => import("@/pages/admin-households"));
const AdminSubscriptionDetailPage = lazy(() => import("@/pages/admin-subscription-detail"));
const AdminSubscriptionsPage = lazy(() => import("@/pages/admin-subscriptions"));
const AdminConversationDetailPage = lazy(() => import("@/pages/admin-conversation-detail"));
const AdminLogsPage = lazy(() => import("@/pages/admin-logs"));
const AdminProcessingsPage = lazy(() => import("@/pages/admin-processings"));
const AdminIntegrationDetailPage = lazy(() => import("@/pages/admin-integration-detail"));
const AdminIntegrationsPage = lazy(() => import("@/pages/admin-integrations"));
const AdminEmailsPage = lazy(() => import("@/pages/admin-emails"));
const AdminBotPage = lazy(() => import("@/pages/admin-bot"));
const AdminReferralsPage = lazy(() => import("@/pages/admin-referrals"));
const AdminSettingsPage = lazy(() => import("@/pages/admin-settings"));
const AdminCostsPage = lazy(() => import("@/pages/admin-costs"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

const REF_STORAGE_KEY = "contai_ref_code";

function RedirectByRole() {
  const { session, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate("/login");
      return;
    }
    const status = (session.billingStatus || "").toLowerCase();
    
    // Admin and Owners are never blocked from the dashboard
    if (session.role === "admin" || session.role === "owner") {
      navigate("/app/dashboard");
    } else if (status === "active") {
      navigate("/app/dashboard");
    } else {
      if (!window.location.pathname.includes("/assinatura")) {
        navigate("/app/assinatura");
      }
    }
  }, [loading, navigate, session]);

  return null;
}

function Router() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050b12] text-sm text-slate-300">
          Carregando...
        </div>
      }
    >
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/data-deletion" component={DataDeletionPage} />
        <Route path="/painel" component={RedirectByRole} />
        <Route path="/login" component={LoginPage} />
        <Route path="/cadastro" component={SignupPage} />
        <Route path="/esqueci-senha" component={ForgotPasswordPage} />
        <Route path="/redefinir-senha" component={ResetPasswordPage} />
        <Route path="/assinatura" component={SubscriptionPage} />
        <Route path="/admin-access" component={AdminAccessPage} />

        <Route path="/app/dashboard">
          <ProtectedRoute allow={["user", "owner"]}>
            <AppDashboardPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/transacoes">
          <ProtectedRoute allow={["user", "owner"]}>
            <AppTransactionsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/contas">
          <ProtectedRoute allow={["user", "owner"]}>
            <AppBillsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/agenda">
          <ProtectedRoute allow={["user", "owner"]}>
            <AppAgendaPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/relatorios">
          <ProtectedRoute allow={["user", "owner"]}>
            <AppReportsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/categorias">
          <ProtectedRoute allow={["user", "owner"]}>
            <AppCategoriesPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/metas">
          <ProtectedRoute allow={["user", "owner"]}>
            <AppMetasPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/membros">
          <ProtectedRoute allow={["owner"]}>
            <AppMembersPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/integracoes">
          <ProtectedRoute allow={["user", "owner"]}>
            <AppIntegrationsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/indicacoes">
          <ProtectedRoute allow={["user", "owner"]}>
            <AppReferralsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/assinatura">
          <ProtectedRoute allow={["user", "owner"]}>
            <AppSubscriptionPage />
          </ProtectedRoute>
        </Route>
        <Route path="/app/configuracoes">
          <ProtectedRoute allow={["user", "owner"]}>
            <AppSettingsPage />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/dashboard">
          <ProtectedRoute allow={["admin"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/users/:id">
          <ProtectedRoute allow={["admin"]}>
            <AdminUserDetailPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/users">
          <ProtectedRoute allow={["admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/households">
          <ProtectedRoute allow={["admin"]}>
            <AdminHouseholdsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/households/:id">
          <ProtectedRoute allow={["admin"]}>
            <AdminHouseholdDetailPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/subscriptions/:id">
          <ProtectedRoute allow={["admin"]}>
            <AdminSubscriptionDetailPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/subscriptions">
          <ProtectedRoute allow={["admin"]}>
            <AdminSubscriptionsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/conversations/:id">
          <ProtectedRoute allow={["admin"]}>
            <AdminConversationDetailPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/logs">
          <ProtectedRoute allow={["admin"]}>
            <AdminLogsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/processings">
          <ProtectedRoute allow={["admin"]}>
            <AdminProcessingsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/integrations">
          <ProtectedRoute allow={["admin"]}>
            <AdminIntegrationsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/emails">
          <ProtectedRoute allow={["admin"]}>
            <AdminEmailsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/integrations/:key">
          <ProtectedRoute allow={["admin"]}>
            <AdminIntegrationDetailPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/bot">
          <ProtectedRoute allow={["admin"]}>
            <AdminBotPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/referrals">
          <ProtectedRoute allow={["admin"]}>
            <AdminReferralsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/settings">
          <ProtectedRoute allow={["admin"]}>
            <AdminSettingsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/costs">
          <ProtectedRoute allow={["admin"]}>
            <AdminCostsPage />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref")?.trim();
    if (!ref) {
      return;
    }

    try {
      window.localStorage.setItem(REF_STORAGE_KEY, ref);
    } catch {}
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
