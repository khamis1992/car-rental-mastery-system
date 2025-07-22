import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { GlobalLoadingProvider } from "@/contexts/GlobalLoadingContext";
import { EnhancedRealtimeProvider } from "@/contexts/EnhancedRealtimeContext";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import DashboardLayout from "@/layouts/DashboardLayout";
import ContractsPage from "@/pages/ContractsPage";
import VehiclesPage from "@/pages/VehiclesPage";
import CustomersPage from "@/pages/CustomersPage";
import InvoicesPage from "@/pages/InvoicesPage";
import PaymentsPage from "@/pages/PaymentsPage";
import EmployeesPage from "@/pages/EmployeesPage";
import AttendancePage from "@/pages/AttendancePage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestRoute } from "@/components/auth/GuestRoute";
import QuotationsPage from "@/pages/QuotationsPage";
import AdditionalChargesPage from "@/pages/AdditionalChargesPage";
import CostCentersPage from "@/pages/CostCentersPage";
import BranchesPage from "@/pages/BranchesPage";
import AccountingDashboard from "@/pages/AccountingDashboard";
import TrafficViolationsPage from "@/pages/TrafficViolationsPage";
import ChartOfAccountsPage from "@/pages/ChartOfAccountsPage";
import JournalEntriesPage from "@/pages/JournalEntriesPage";
import ReportsPage from "@/pages/ReportsPage";

// Create a single QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GlobalLoadingProvider>
          <AuthProvider>
            <EnhancedRealtimeProvider>
              <NotificationProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={
                      <GuestRoute>
                        <LoginPage />
                      </GuestRoute>
                    } />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<AccountingDashboard />} />
                      <Route path="contracts" element={<ContractsPage />} />
                      <Route path="vehicles" element={<VehiclesPage />} />
                      <Route path="customers" element={<CustomersPage />} />
                      <Route path="invoices" element={<InvoicesPage />} />
                      <Route path="payments" element={<PaymentsPage />} />
                      <Route path="employees" element={<EmployeesPage />} />
                      <Route path="attendance" element={<AttendancePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="quotations" element={<QuotationsPage />} />
                      <Route path="additional-charges" element={<AdditionalChargesPage />} />
                      <Route path="cost-centers" element={<CostCentersPage />} />
                      <Route path="branches" element={<BranchesPage />} />
                      <Route path="traffic-violations" element={<TrafficViolationsPage />} />
                      <Route path="chart-of-accounts" element={<ChartOfAccountsPage />} />
                      <Route path="journal-entries" element={<JournalEntriesPage />} />
                      <Route path="reports" element={<ReportsPage />} />
                    </Route>
                  </Routes>
                </BrowserRouter>
                <Toaster 
                  position="top-left" 
                  dir="rtl"
                  richColors
                  expand={false}
                  visibleToasts={5}
                />
              </NotificationProvider>
            </EnhancedRealtimeProvider>
          </AuthProvider>
        </GlobalLoadingProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
