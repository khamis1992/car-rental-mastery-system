
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { GlobalLoadingProvider } from "@/contexts/GlobalLoadingContext";
import { EnhancedRealtimeProvider } from "@/contexts/EnhancedRealtimeContext";
import { SearchProvider } from "@/contexts/SearchContext";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import Contracts from "@/pages/Contracts";
import Fleet from "@/pages/Fleet";
import Customers from "@/pages/Customers";
import Invoicing from "@/pages/Invoicing";
import Treasury from "@/pages/Treasury";
import Employees from "@/pages/Employees";
import Attendance from "@/pages/Attendance";
import Settings from "@/pages/Settings";
import Auth from "@/pages/Auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import GuestRoute from "@/components/GuestRoute";
import Quotations from "@/pages/Quotations";
import ExpenseManagement from "@/pages/ExpenseManagement";
import CostCenters from "@/pages/CostCenters";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";
import TrafficViolations from "@/pages/TrafficViolations";
import ChartOfAccounts from "@/pages/ChartOfAccounts";
import JournalEntries from "@/pages/JournalEntries";
import FinancialReports from "@/pages/FinancialReports";
import Tenants from "@/pages/Tenants";

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
            <TenantProvider>
              <EnhancedRealtimeProvider>
                <NotificationProvider>
                  <SearchProvider>
                    <BrowserRouter>
                      <Routes>
                        <Route path="/login" element={
                          <GuestRoute>
                            <Auth />
                          </GuestRoute>
                        } />
                        <Route path="/auth" element={
                          <GuestRoute>
                            <Auth />
                          </GuestRoute>
                        } />
                        <Route path="/" element={
                          <ProtectedRoute>
                            <DashboardLayout />
                          </ProtectedRoute>
                        }>
                          <Route index element={<Index />} />
                          <Route path="contracts" element={<Contracts />} />
                          <Route path="vehicles" element={<Fleet />} />
                          <Route path="customers" element={<Customers />} />
                          <Route path="invoices" element={<Invoicing />} />
                          <Route path="payments" element={<Treasury />} />
                          <Route path="employees" element={<Employees />} />
                          <Route path="attendance" element={<Attendance />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="quotations" element={<Quotations />} />
                          <Route path="additional-charges" element={<ExpenseManagement />} />
                          <Route path="cost-centers" element={<CostCenters />} />
                          <Route path="branches" element={<NotFound />} />
                          <Route path="traffic-violations" element={<TrafficViolations />} />
                          <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
                          <Route path="journal-entries" element={<JournalEntries />} />
                          <Route path="reports" element={<FinancialReports />} />
                          <Route path="tenants" element={<Tenants />} />
                        </Route>
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                    <Toaster 
                      position="top-left" 
                      dir="rtl"
                      richColors
                      expand={false}
                      visibleToasts={5}
                    />
                  </SearchProvider>
                </NotificationProvider>
              </EnhancedRealtimeProvider>
            </TenantProvider>
          </AuthProvider>
        </GlobalLoadingProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
