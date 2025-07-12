import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { ContractsRealtimeProvider } from "@/contexts/ContractsRealtimeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout/Layout";
import { GlobalErrorBoundary } from "@/components/ErrorBoundary/GlobalErrorBoundary";
import { setupGlobalErrorHandling } from "@/utils/errorHandling";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import Customers from "./pages/Customers";
import Fleet from "./pages/Fleet";
import Quotations from "./pages/Quotations";
import Contracts from "./pages/Contracts";
import Invoicing from "./pages/Invoicing";
import Accounting from "./pages/Accounting";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";

import Communications from "./pages/Communications";
import Maintenance from "./pages/Maintenance";
import TrafficViolations from "./pages/TrafficViolations";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import CostCenters from "./pages/CostCenters";
import Tenants from "./pages/Tenants";
import NotFound from "./pages/NotFound";
import PublicQuotation from "./pages/PublicQuotation";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import BillingManagement from "./pages/BillingManagement";
import LandingPageEditor from "./pages/super-admin/LandingPageEditor";
import MainDashboard from "./pages/super-admin/MainDashboard";
import TenantManagement from "./pages/super-admin/TenantManagement";
import UsersAndPermissions from "./pages/super-admin/UsersAndPermissions";
import BillingAndSubscriptionsPage from "./pages/super-admin/BillingAndSubscriptions";
import SadadPayments from "./pages/super-admin/SadadPayments";
import SystemMonitoringPage from "./pages/super-admin/SystemMonitoring";
import MaintenanceToolsPage from "./pages/super-admin/MaintenanceTools";
import TechnicalSupport from "./pages/super-admin/TechnicalSupport";
import GlobalSettingsPage from "./pages/super-admin/GlobalSettings";
import DraftStage from "./pages/ContractStages/DraftStage";
import PendingStage from "./pages/ContractStages/PendingStage";
import ActiveStage from "./pages/ContractStages/ActiveStage";
import PaymentStage from "./pages/ContractStages/PaymentStage";
import CompletedStage from "./pages/ContractStages/CompletedStage";
import ContractPrint from "./pages/ContractPrint";
import { ContractStageRouter } from "./components/Contracts/ContractStageRouter";
import AttendanceReminderWrapper from "@/components/Attendance/AttendanceReminderWrapper";
import { SearchDialog } from "@/components/Search/SearchDialog";

// إعداد معالج الأخطاء العام
setupGlobalErrorHandling();

// إعداد QueryClient مع معالجة محسنة للأخطاء
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // تجنب إعادة المحاولة للأخطاء التي لا تحتاج إعادة محاولة
        if (error?.name === 'AbortError') return false;
        if (error?.code === 'PGRST301') return false; // JWT errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 دقائق
      gcTime: 10 * 60 * 1000, // 10 دقائق (تم تغيير cacheTime إلى gcTime في الإصدار الجديد)
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (error?.name === 'AbortError') return false;
        return failureCount < 1; // إعادة محاولة واحدة فقط للمطالبات
      },
    },
  },
});

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider>
          <ContractsRealtimeProvider>
          <NotificationProvider>
            <SettingsProvider>
              <SearchProvider>
                <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Layout>
                          <Index />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/customers" element={
                      <ProtectedRoute>
                        <Layout>
                          <Customers />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/fleet" element={
                      <ProtectedRoute>
                        <Layout>
                          <Fleet />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/quotations" element={
                      <ProtectedRoute>
                        <Layout>
                          <Quotations />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/contracts" element={
                      <ProtectedRoute>
                        <Layout>
                          <Contracts />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/invoicing" element={
                      <ProtectedRoute>
                        <Layout>
                          <Invoicing />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/accounting" element={
                      <ProtectedRoute>
                        <Layout>
                          <Accounting />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Layout>
                          <Settings />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/notifications" element={
                      <ProtectedRoute>
                        <Layout>
                          <Notifications />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/communications" element={
                      <ProtectedRoute>
                        <Layout>
                          <Communications />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/maintenance" element={
                      <ProtectedRoute>
                        <Layout>
                          <Maintenance />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/violations" element={
                      <ProtectedRoute>
                        <Layout>
                          <TrafficViolations />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/employees" element={
                      <ProtectedRoute>
                        <Layout>
                          <Employees />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/attendance" element={
                      <ProtectedRoute>
                        <Layout>
                          <Attendance />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/leaves" element={
                      <ProtectedRoute>
                        <Layout>
                          <Leaves />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/payroll" element={
                      <ProtectedRoute>
                        <Layout>
                          <Payroll />
                        </Layout>
                      </ProtectedRoute>
                    } />
                     <Route path="/cost-centers" element={
                       <ProtectedRoute>
                         <Layout>
                           <CostCenters />
                         </Layout>
                       </ProtectedRoute>
                     } />
                     <Route path="/tenants" element={
                        <ProtectedRoute requiredRole="super_admin">
                          <Layout>
                            <Tenants />
                          </Layout>
                        </ProtectedRoute>
                      } />
                      <Route path="/super-admin" element={
                        <ProtectedRoute requiredRole="super_admin">
                          <Layout>
                            <SuperAdminDashboard />
                          </Layout>
                        </ProtectedRoute>
                      } />
                                             <Route path="/super-admin/main-dashboard" element={
                         <ProtectedRoute requiredRole="super_admin">
                           <Layout>
                             <MainDashboard />
                           </Layout>
                         </ProtectedRoute>
                       } />
                       <Route path="/super-admin/tenant-management" element={
                         <ProtectedRoute requiredRole="super_admin">
                           <Layout>
                             <TenantManagement />
                           </Layout>
                         </ProtectedRoute>
                       } />
                       <Route path="/super-admin/users-permissions" element={
                         <ProtectedRoute requiredRole="super_admin">
                           <Layout>
                             <UsersAndPermissions />
                           </Layout>
                         </ProtectedRoute>
                       } />
                       <Route path="/super-admin/billing-subscriptions" element={
                         <ProtectedRoute requiredRole="super_admin">
                           <Layout>
                             <BillingAndSubscriptionsPage />
                           </Layout>
                         </ProtectedRoute>
                       } />
                       <Route path="/super-admin/sadad-payments" element={
                         <ProtectedRoute requiredRole="super_admin">
                           <Layout>
                             <SadadPayments />
                           </Layout>
                         </ProtectedRoute>
                       } />
                       <Route path="/super-admin/system-monitoring" element={
                         <ProtectedRoute requiredRole="super_admin">
                           <Layout>
                             <SystemMonitoringPage />
                           </Layout>
                         </ProtectedRoute>
                       } />
                       <Route path="/super-admin/maintenance-tools" element={
                         <ProtectedRoute requiredRole="super_admin">
                           <Layout>
                             <MaintenanceToolsPage />
                           </Layout>
                         </ProtectedRoute>
                       } />
                       <Route path="/super-admin/technical-support" element={
                         <ProtectedRoute requiredRole="super_admin">
                           <Layout>
                             <TechnicalSupport />
                           </Layout>
                         </ProtectedRoute>
                       } />
                       <Route path="/super-admin/global-settings" element={
                         <ProtectedRoute requiredRole="super_admin">
                           <Layout>
                             <GlobalSettingsPage />
                           </Layout>
                         </ProtectedRoute>
                       } />
                       <Route path="/billing" element={
                         <ProtectedRoute requiredRole="super_admin">
                           <Layout>
                             <BillingManagement />
                           </Layout>
                         </ProtectedRoute>
                       } />
                       <Route path="/super-admin/landing-editor" element={
                         <ProtectedRoute requiredRole="super_admin">
                           <LandingPageEditor />
                         </ProtectedRoute>
                       } />
                     {/* Contract stage routes */}
                     <Route path="/contracts/stage/draft/:contractId" element={
                      <ProtectedRoute>
                        <Layout>
                          <DraftStage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/contracts/stage/pending/:contractId" element={
                      <ProtectedRoute>
                        <Layout>
                          <PendingStage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/contracts/stage/active/:contractId" element={
                      <ProtectedRoute>
                        <Layout>
                          <ActiveStage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/contracts/stage/payment/:contractId" element={
                      <ProtectedRoute>
                        <Layout>
                          <PaymentStage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/contracts/stage/completed/:contractId" element={
                      <ProtectedRoute>
                        <Layout>
                          <CompletedStage />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Contract print route */}
                    <Route path="/contracts/print/:id" element={
                      <ProtectedRoute>
                        <ContractPrint />
                      </ProtectedRoute>
                    } />
                    
                    {/* Public routes */}
                    <Route path="/public-quotation/:token" element={<PublicQuotation />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <AttendanceReminderWrapper />
                  <SearchDialog />
                </BrowserRouter>
              </TooltipProvider>
            </SearchProvider>
          </SettingsProvider>
         </NotificationProvider>
         </ContractsRealtimeProvider>
        </TenantProvider>
       </AuthProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;