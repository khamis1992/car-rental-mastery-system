import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import NotFound from "./pages/NotFound";
import PublicQuotation from "./pages/PublicQuotation";
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
        <ContractsRealtimeProvider>
          <NotificationProvider>
            <SettingsProvider>
              <SearchProvider>
                <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={
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
      </AuthProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;