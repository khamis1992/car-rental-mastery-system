import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SearchDialog } from "@/components/Search/SearchDialog";
import { Layout } from "@/components/Layout/Layout";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Customers from "./pages/Customers";
import Fleet from "./pages/Fleet";
import Quotations from "./pages/Quotations";
import Contracts from "./pages/Contracts";
import Treasury from "./pages/Treasury";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import ChartOfAccountsSetupPage from "./pages/ChartOfAccountsSetup";
import JournalEntries from "./pages/JournalEntries";
import FinancialReports from "./pages/FinancialReports";
import GeneralLedger from "./pages/GeneralLedger";
import BudgetManagement from "./pages/BudgetManagement";
import AccountingAutomation from "./pages/AccountingAutomation";
import AccountingValidation from "./pages/AccountingValidation";
import CostCenters from "./pages/CostCenters";
import FixedAssets from "./pages/FixedAssets";
import Maintenance from "./pages/Maintenance";
import TrafficViolations from "./pages/TrafficViolations";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import Communications from "./pages/Communications";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

// Super Admin Pages
import SuperAdminMainDashboard from "./pages/super-admin/MainDashboard";
import SuperAdminTenantManagement from "./pages/super-admin/TenantManagement";
import SuperAdminUsersPermissions from "./pages/super-admin/UsersAndPermissions";
import SuperAdminBillingSubscriptions from "./pages/super-admin/BillingAndSubscriptions";
import SuperAdminSadadPayments from "./pages/super-admin/SadadPayments";
import SuperAdminSystemMonitoring from "./pages/super-admin/SystemMonitoring";
import SuperAdminMaintenanceTools from "./pages/super-admin/MaintenanceTools";
import SuperAdminTechnicalSupport from "./pages/super-admin/TechnicalSupport";
import SuperAdminLandingEditor from "./pages/super-admin/LandingPageEditor";
import SuperAdminGlobalSettings from "./pages/super-admin/GlobalSettings";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, loading, isSaasAdmin } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // If user is SAAS admin, show only super admin routes
  if (isSaasAdmin) {
    return (
      <Layout>
        <Routes>
          <Route path="/super-admin/main-dashboard" element={<SuperAdminMainDashboard />} />
          <Route path="/super-admin/tenant-management" element={<SuperAdminTenantManagement />} />
          <Route path="/super-admin/users-permissions" element={<SuperAdminUsersPermissions />} />
          <Route path="/super-admin/billing-subscriptions" element={<SuperAdminBillingSubscriptions />} />
          <Route path="/super-admin/sadad-payments" element={<SuperAdminSadadPayments />} />
          <Route path="/super-admin/system-monitoring" element={<SuperAdminSystemMonitoring />} />
          <Route path="/super-admin/maintenance-tools" element={<SuperAdminMaintenanceTools />} />
          <Route path="/super-admin/technical-support" element={<SuperAdminTechnicalSupport />} />
          <Route path="/super-admin/landing-editor" element={<SuperAdminLandingEditor />} />
          <Route path="/super-admin/global-settings" element={<SuperAdminGlobalSettings />} />
          <Route path="*" element={<Navigate to="/super-admin/main-dashboard" />} />
        </Routes>
      </Layout>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Index />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/fleet" element={<Fleet />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/treasury" element={<Treasury />} />
        <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="/chart-of-accounts-setup" element={<ChartOfAccountsSetupPage />} />
        <Route path="/journal-entries" element={<JournalEntries />} />
        <Route path="/financial-reports" element={<FinancialReports />} />
        <Route path="/general-ledger" element={<GeneralLedger />} />
        <Route path="/budget-management" element={<BudgetManagement />} />
        <Route path="/accounting-automation" element={<AccountingAutomation />} />
        <Route path="/accounting-validation" element={<AccountingValidation />} />
        <Route path="/cost-centers" element={<CostCenters />} />
        <Route path="/fixed-assets" element={<FixedAssets />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/violations" element={<TrafficViolations />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Super Admin Routes for eligible users */}
        <Route path="/super-admin/main-dashboard" element={<SuperAdminMainDashboard />} />
        <Route path="/super-admin/tenant-management" element={<SuperAdminTenantManagement />} />
        <Route path="/super-admin/users-permissions" element={<SuperAdminUsersPermissions />} />
        <Route path="/super-admin/billing-subscriptions" element={<SuperAdminBillingSubscriptions />} />
        <Route path="/super-admin/sadad-payments" element={<SuperAdminSadadPayments />} />
        <Route path="/super-admin/system-monitoring" element={<SuperAdminSystemMonitoring />} />
        <Route path="/super-admin/maintenance-tools" element={<SuperAdminMaintenanceTools />} />
        <Route path="/super-admin/technical-support" element={<SuperAdminTechnicalSupport />} />
        <Route path="/super-admin/landing-editor" element={<SuperAdminLandingEditor />} />
        <Route path="/super-admin/global-settings" element={<SuperAdminGlobalSettings />} />
        
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <TenantProvider>
            <SettingsProvider>
              <SearchProvider>
                <NotificationProvider>
                  <BrowserRouter>
                    <AppRoutes />
                    <SearchDialog />
                    <Toaster />
                    <Sonner />
                  </BrowserRouter>
                </NotificationProvider>
              </SearchProvider>
            </SettingsProvider>
          </TenantProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
