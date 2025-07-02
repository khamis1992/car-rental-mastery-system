import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout/Layout";
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
import Analytics from "./pages/Analytics";
import Communications from "./pages/Communications";
import Maintenance from "./pages/Maintenance";
import TrafficViolations from "./pages/TrafficViolations";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import NotFound from "./pages/NotFound";
import AttendanceReminderWrapper from "@/components/Attendance/AttendanceReminderWrapper";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <SettingsProvider>
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
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <Analytics />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AttendanceReminderWrapper />
        </BrowserRouter>
          </TooltipProvider>
        </SettingsProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
