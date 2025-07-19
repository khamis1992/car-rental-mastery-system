import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import JournalEntries from '@/pages/JournalEntries';
import GeneralLedger from '@/pages/GeneralLedger';
import ChartOfAccounts from '@/pages/ChartOfAccounts';
import FinancialReports from '@/pages/FinancialReports';
import AccountModificationRequestsPage from '@/pages/AccountModificationRequests';
import { Sidebar } from './components/Sidebar';
import { Auth } from '@supabase/auth-ui-react'
import {
  AuthenticatedTemplate,
  useSupabaseClient,
  UnauthenticatedTemplate,
} from '@supabase/auth-helpers-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import ChartOfAccountsSettingsPage from './components/ChartOfAccounts/ChartOfAccountsSettings';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={
            <>
              <AuthenticatedTemplate>
                <div className="flex h-screen">
                  <Sidebar />
                  <Dashboard />
                </div>
              </AuthenticatedTemplate>
              <UnauthenticatedTemplate>
                <div className="flex h-screen">
                  <Auth
                    supabaseClient={useSupabaseClient()}
                    appearance={{ theme: ThemeSupa }}
                    providers={['google', 'github']}
                    redirectTo="http://localhost:3000/"
                  />
                </div>
              </UnauthenticatedTemplate>
            </>
          } />
          <Route path="/chart-of-accounts" element={
            <>
              <AuthenticatedTemplate>
                <div className="flex h-screen">
                  <Sidebar />
                  <ChartOfAccounts />
                </div>
              </AuthenticatedTemplate>
              <UnauthenticatedTemplate>
                <div className="flex h-screen">
                  <Auth
                    supabaseClient={useSupabaseClient()}
                    appearance={{ theme: ThemeSupa }}
                    providers={['google', 'github']}
                    redirectTo="http://localhost:3000/chart-of-accounts"
                  />
                </div>
              </UnauthenticatedTemplate>
            </>
          } />
          <Route path="/chart-of-accounts-settings" element={
            <>
              <AuthenticatedTemplate>
                <div className="flex h-screen">
                  <Sidebar />
                  <ChartOfAccountsSettingsPage />
                </div>
              </AuthenticatedTemplate>
              <UnauthenticatedTemplate>
                <div className="flex h-screen">
                  <Auth
                    supabaseClient={useSupabaseClient()}
                    appearance={{ theme: ThemeSupa }}
                    providers={['google', 'github']}
                    redirectTo="http://localhost:3000/chart-of-accounts-settings"
                  />
                </div>
              </UnauthenticatedTemplate>
            </>
          } />
          <Route path="/journal-entries" element={
            <>
              <AuthenticatedTemplate>
                <div className="flex h-screen">
                  <Sidebar />
                  <JournalEntries />
                </div>
              </AuthenticatedTemplate>
              <UnauthenticatedTemplate>
                <div className="flex h-screen">
                  <Auth
                    supabaseClient={useSupabaseClient()}
                    appearance={{ theme: ThemeSupa }}
                    providers={['google', 'github']}
                    redirectTo="http://localhost:3000/journal-entries"
                  />
                </div>
              </UnauthenticatedTemplate>
            </>
          } />
          <Route path="/general-ledger" element={
            <>
              <AuthenticatedTemplate>
                <div className="flex h-screen">
                  <Sidebar />
                  <GeneralLedger />
                </div>
              </AuthenticatedTemplate>
              <UnauthenticatedTemplate>
                <div className="flex h-screen">
                  <Auth
                    supabaseClient={useSupabaseClient()}
                    appearance={{ theme: ThemeSupa }}
                    providers={['google', 'github']}
                    redirectTo="http://localhost:3000/general-ledger"
                  />
                </div>
              </UnauthenticatedTemplate>
            </>
          } />
          <Route path="/financial-reports" element={
            <>
              <AuthenticatedTemplate>
                <div className="flex h-screen">
                  <Sidebar />
                  <FinancialReports />
                </div>
              </AuthenticatedTemplate>
              <UnauthenticatedTemplate>
                <div className="flex h-screen">
                  <Auth
                    supabaseClient={useSupabaseClient()}
                    appearance={{ theme: ThemeSupa }}
                    providers={['google', 'github']}
                    redirectTo="http://localhost:3000/financial-reports"
                  />
                </div>
              </UnauthenticatedTemplate>
            </>
          } />
          <Route path="/account-modification-requests" element={
            <>
              <AuthenticatedTemplate>
                <div className="flex h-screen">
                  <Sidebar />
                  <AccountModificationRequestsPage />
                </div>
              </AuthenticatedTemplate>
              <UnauthenticatedTemplate>
                <div className="flex h-screen">
                  <Auth
                    supabaseClient={useSupabaseClient()}
                    appearance={{ theme: ThemeSupa }}
                    providers={['google', 'github']}
                    redirectTo="http://localhost:3000/account-modification-requests"
                  />
                </div>
              </UnauthenticatedTemplate>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
