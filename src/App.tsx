
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
              <Route path="/fleet" element={<Fleet />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/quotations" element={<Quotations />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/traffic-violations" element={<TrafficViolations />} />
              <Route path="/general-ledger" element={<GeneralLedger />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/cost-centers" element={<CostCenters />} />
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
