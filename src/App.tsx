
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VehicleManagement from "./pages/VehicleManagement";
import ContractManagement from "./pages/ContractManagement";
import CustomerManagement from "./pages/CustomerManagement";
import EmployeeManagement from "./pages/EmployeeManagement";
import AssetManagement from "./pages/AssetManagement";
import BudgetManagement from "./pages/BudgetManagement";
import BudgetDetail from "./pages/BudgetDetail";
import Reports from "./pages/Reports";
import GeneralLedger from "./pages/GeneralLedger";
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
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vehicles" element={<VehicleManagement />} />
              <Route path="/contracts" element={<ContractManagement />} />
              <Route path="/customers" element={<CustomerManagement />} />
              <Route path="/employees" element={<EmployeeManagement />} />
              <Route path="/assets" element={<AssetManagement />} />
              <Route path="/budget-management" element={<BudgetManagement />} />
              <Route path="/budget-management/:budgetId" element={<BudgetDetail />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/general-ledger" element={<GeneralLedger />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
