
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { TenantProvider } from '@/contexts/TenantContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Pages
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Customers from '@/pages/Customers';
import Fleet from '@/pages/Fleet';
import Contracts from '@/pages/Contracts';
import Invoices from '@/pages/Invoices';
import JournalEntries from '@/pages/JournalEntries';
import ExpenseManagement from '@/pages/ExpenseManagement';
import NotFound from '@/pages/NotFound';

// New Financial Pages
import FinancialHub from '@/pages/FinancialHub';
import ChartOfAccounts from '@/pages/ChartOfAccounts';
import FinancialReports from '@/pages/FinancialReports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="erp-theme">
        <AuthProvider>
          <TenantProvider>
            <NotificationProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/fleet" element={<Fleet />} />
                  <Route path="/contracts" element={<Contracts />} />
                  <Route path="/invoices" element={<Invoices />} />
                  
                  {/* Financial Module Routes */}
                  <Route path="/financial" element={<FinancialHub />} />
                  <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
                  <Route path="/journal-entries" element={<JournalEntries />} />
                  <Route path="/financial-reports" element={<FinancialReports />} />
                  <Route path="/expense-management" element={<ExpenseManagement />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
              <Toaster />
            </NotificationProvider>
          </TenantProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
