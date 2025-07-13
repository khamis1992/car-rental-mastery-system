import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ContractsRealtimeProvider } from '@/contexts/ContractsRealtimeContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import Layout from '@/components/Layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import TenantGuard from '@/components/TenantGuard';
import GlobalErrorBoundary from '@/components/ErrorBoundary/GlobalErrorBoundary';
import AbortErrorBoundary from '@/components/ErrorBoundary/AbortErrorBoundary';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Customers from '@/pages/Customers';
import Fleet from '@/pages/Fleet';
import Contracts from '@/pages/Contracts';
import Accounting from '@/pages/Accounting';
import Employees from '@/pages/Employees';
import Maintenance from '@/pages/Maintenance';
import TrafficViolations from '@/pages/TrafficViolations';
import Attendance from '@/pages/Attendance';
import Payroll from '@/pages/Payroll';
import Leaves from '@/pages/Leaves';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import CostCenters from '@/pages/CostCenters';
import BillingManagement from '@/pages/BillingManagement';
import IntegrationCenter from '@/pages/IntegrationCenter';
import Communications from '@/pages/Communications';
import Invoicing from '@/pages/Invoicing';
import Tenants from '@/pages/Tenants';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import NotFound from '@/pages/NotFound';
import Quotations from '@/pages/Quotations';
import PublicQuotation from '@/pages/PublicQuotation';
import ContractPrint from '@/pages/ContractPrint';

// Contract stages
import DraftStage from '@/pages/ContractStages/DraftStage';
import PendingStage from '@/pages/ContractStages/PendingStage';
import ActiveStage from '@/pages/ContractStages/ActiveStage';
import CompletedStage from '@/pages/ContractStages/CompletedStage';
import CancelledStage from '@/pages/ContractStages/CancelledStage';

// Super Admin Pages
import SuperAdminBillingManagement from '@/pages/super-admin/BillingManagement';
import TenantManagement from '@/pages/super-admin/TenantManagement';

// Financial Components - New System
import NewFinancialDashboard from '@/components/Financial/NewFinancialDashboard';
import AdvancedSubscriptionManager from '@/components/Financial/AdvancedSubscriptionManager';
import CRMDashboard from '@/components/Financial/CRMDashboard';

import './App.css';

function App() {
  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <SettingsProvider>
              <SearchProvider>
                <NotificationProvider>
                  <ContractsRealtimeProvider>
                    <SidebarProvider>
                      <AbortErrorBoundary>
                        <Routes>
                        {/* Public Routes */}
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/public-quotation/:id" element={<PublicQuotation />} />
                        <Route path="/contract-print/:id" element={<ContractPrint />} />
                        
                        {/* Protected Routes */}
                        <Route path="/" element={
                          <ProtectedRoute>
                            <TenantGuard>
                              <Layout>
                                <div />
                              </Layout>
                            </TenantGuard>
                          </ProtectedRoute>
                        }>
                          <Route index element={<Navigate to="/dashboard" replace />} />
                          <Route path="dashboard" element={<Index />} />
                          <Route path="customers" element={<Customers />} />
                          <Route path="fleet" element={<Fleet />} />
                          <Route path="contracts" element={<Contracts />} />
                          <Route path="quotations" element={<Quotations />} />
                          <Route path="accounting" element={<Accounting />} />
                          <Route path="employees" element={<Employees />} />
                          <Route path="maintenance" element={<Maintenance />} />
                          <Route path="violations" element={<TrafficViolations />} />
                          <Route path="attendance" element={<Attendance />} />
                          <Route path="payroll" element={<Payroll />} />
                          <Route path="leaves" element={<Leaves />} />
                          <Route path="notifications" element={<Notifications />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="cost-centers" element={<CostCenters />} />
                          <Route path="billing" element={<BillingManagement />} />
                          <Route path="integration" element={<IntegrationCenter />} />
                          <Route path="communications" element={<Communications />} />
                          <Route path="invoicing" element={<Invoicing />} />
                          <Route path="tenants" element={<TenantManagement />} />
                          
                          {/* Contract Stages */}
                          <Route path="contracts/draft" element={<DraftStage />} />
                          <Route path="contracts/pending" element={<PendingStage />} />
                          <Route path="contracts/active" element={<ActiveStage />} />
                          <Route path="contracts/completed" element={<CompletedStage />} />
                          <Route path="contracts/cancelled" element={<CancelledStage contract={{}} />} />
                          
                          {/* New Financial System Routes */}
                          <Route path="financial/new-dashboard" element={<NewFinancialDashboard />} />
                          <Route path="financial/subscriptions" element={<AdvancedSubscriptionManager />} />
                          <Route path="financial/advanced-roles" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">إدارة الأدوار المتقدمة</h2>
                            <p className="text-muted-foreground">قريباً - 32 إذن متخصص</p>
                          </div>} />
                          <Route path="financial/crm-dashboard" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">نظام CRM المتطور</h2>
                            <p className="text-muted-foreground">قريباً - إدارة العملاء والفرص</p>
                          </div>} />
                          <Route path="financial/event-bus" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">Event Bus Monitor</h2>
                            <p className="text-muted-foreground">قريباً - مراقبة الأحداث المالية</p>
                          </div>} />
                          <Route path="financial/analytics" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">التحليلات المالية المتقدمة</h2>
                            <p className="text-muted-foreground">قريباً - تحليلات الذكاء الاصطناعي</p>
                          </div>} />
                          <Route path="financial/tenant-management" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">إدارة المستأجرين المتقدمة</h2>
                            <p className="text-muted-foreground">قريباً - إدارة شاملة للمستأجرين</p>
                          </div>} />
                          
                          {/* Super Admin Routes */}
                          <Route path="super-admin/main-dashboard" element={<SuperAdminDashboard />} />
                          <Route path="super-admin/billing-management" element={<SuperAdminBillingManagement />} />
                          <Route path="super-admin/tenant-management" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">إدارة المؤسسات</h2>
                            <p className="text-muted-foreground">قريباً</p>
                          </div>} />
                          <Route path="super-admin/users-permissions" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">إدارة المستخدمين والصلاحيات</h2>
                            <p className="text-muted-foreground">قريباً</p>
                          </div>} />
                          <Route path="super-admin/billing-subscriptions" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">إدارة الفوترة والاشتراكات</h2>
                            <p className="text-muted-foreground">قريباً</p>
                          </div>} />
                          <Route path="super-admin/sadad-payments" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">إدارة مدفوعات SADAD</h2>
                            <p className="text-muted-foreground">قريباً</p>
                          </div>} />
                          <Route path="super-admin/system-monitoring" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">مراقبة النظام والأداء</h2>
                            <p className="text-muted-foreground">قريباً</p>
                          </div>} />
                          <Route path="super-admin/maintenance-tools" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">أدوات الصيانة</h2>
                            <p className="text-muted-foreground">قريباً</p>
                          </div>} />
                          <Route path="super-admin/technical-support" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">إدارة الدعم الفني</h2>
                            <p className="text-muted-foreground">قريباً</p>
                          </div>} />
                          <Route path="super-admin/landing-editor" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">محرر الصفحة الرئيسية</h2>
                            <p className="text-muted-foreground">قريباً</p>
                          </div>} />
                          <Route path="super-admin/global-settings" element={<div className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">الإعدادات العامة</h2>
                            <p className="text-muted-foreground">قريباً</p>
                          </div>} />
                        </Route>
                        
                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AbortErrorBoundary>
                    </SidebarProvider>
                  </ContractsRealtimeProvider>
                </NotificationProvider>
              </SearchProvider>
            </SettingsProvider>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
      <SonnerToaster />
    </GlobalErrorBoundary>
  );
}

export default App;