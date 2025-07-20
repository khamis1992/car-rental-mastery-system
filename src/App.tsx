
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import TenantIsolationDashboard from "./pages/TenantIsolationDashboard";
import Maintenance from "./pages/Maintenance";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import PaymentCancel from "./pages/PaymentCancel";
import Fleet from "./pages/Fleet";
import SadadSimulation from "./pages/SadadSimulation";
import PaymentSuccess from "./pages/PaymentSuccess";
import TrafficViolations from "./pages/TrafficViolations";
import GeneralLedger from "./pages/GeneralLedger";
import Contracts from "./pages/Contracts";
import Tenants from "./pages/Tenants";
import Quotations from "./pages/Quotations";
import CostCenters from "./pages/CostCenters";
import BudgetManagement from "./pages/BudgetManagement";
import AccountingAutomation from "./pages/AccountingAutomation";
import AccountingValidation from "./pages/AccountingValidation";
import ChartOfAccountsSetup from "./pages/ChartOfAccountsSetup";

// New pages being added
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import FixedAssets from "./pages/FixedAssets";
import JournalEntries from "./pages/JournalEntries";
import FinancialReports from "./pages/FinancialReports";
import Violations from "./pages/Violations";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import Communications from "./pages/Communications";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/fleet" element={<Fleet />} />
              <Route path="/quotations" element={<Quotations />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
              <Route path="/chart-of-accounts-setup" element={<ChartOfAccountsSetup />} />
              <Route path="/cost-centers" element={<CostCenters />} />
              <Route path="/fixed-assets" element={<FixedAssets />} />
              <Route path="/journal-entries" element={<JournalEntries />} />
              <Route path="/general-ledger" element={<GeneralLedger />} />
              <Route path="/budget-management" element={<BudgetManagement />} />
              <Route path="/accounting-automation" element={<AccountingAutomation />} />
              <Route path="/accounting-validation" element={<AccountingValidation />} />
              <Route path="/financial-reports" element={<FinancialReports />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/violations" element={<Violations />} />
              <Route path="/traffic-violations" element={<TrafficViolations />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/communications" element={<Communications />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/tenant-isolation" element={<TenantIsolationDashboard />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<PaymentCancel />} />
              <Route path="/sadad-simulation" element={<SadadSimulation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
