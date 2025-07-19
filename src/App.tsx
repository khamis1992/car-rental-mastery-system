import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import JournalEntries from '@/pages/JournalEntries';
import GeneralLedger from '@/pages/GeneralLedger';
import ChartOfAccounts from '@/pages/ChartOfAccounts';
import FinancialReports from '@/pages/FinancialReports';
import AccountModificationRequestsPage from '@/pages/AccountModificationRequests';
import Sidebar from './components/Sidebar';
import { Auth } from '@supabase/auth-ui-react'
import { supabase } from '@/integrations/supabase/client'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useAuth } from '@/hooks/useAuth';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      {children}
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/auth" element={
            <div className="flex h-screen items-center justify-center">
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['google']}
                redirectTo={window.location.origin}
              />
            </div>
          } />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/chart-of-accounts" element={
            <ProtectedRoute>
              <ChartOfAccounts />
            </ProtectedRoute>
          } />
          
          <Route path="/journal-entries" element={
            <ProtectedRoute>
              <JournalEntries />
            </ProtectedRoute>
          } />
          
          <Route path="/general-ledger" element={
            <ProtectedRoute>
              <GeneralLedger />
            </ProtectedRoute>
          } />
          
          <Route path="/financial-reports" element={
            <ProtectedRoute>
              <FinancialReports />
            </ProtectedRoute>
          } />
          
          <Route path="/account-modification-requests" element={
            <ProtectedRoute>
              <AccountModificationRequestsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;