import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { GlobalLoadingProvider } from "@/contexts/GlobalLoadingContext";

import { SearchProvider } from "@/contexts/SearchContext";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { Layout } from "@/components/Layout/Layout";
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
import FixedAssets from "@/pages/FixedAssets";
import GeneralLedger from "@/pages/GeneralLedger";
import { ContractStageRouter } from "@/components/Contracts/ContractStageRouter";

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
              <SettingsProvider>
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
                              <Layout />
                            </ProtectedRoute>
                          }>
                            <Route index element={<Index />} />
                            <Route path="contracts" element={<Contracts />} />
                            <Route path="contracts/:contractId" element={<ContractStageRouter />} />
                            <Route path="fleet" element={<Fleet />} />
                            <Route path="customers" element={<Customers />} />
                            <Route path="invoices" element={<Invoicing />} />
                            <Route path="treasury" element={<Treasury />} />
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
                            <Route path="fixed-assets" element={<FixedAssets />} />
                            <Route path="general-ledger" element={<GeneralLedger />} />
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
              </SettingsProvider>
            </TenantProvider>
          </AuthProvider>
        </GlobalLoadingProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
