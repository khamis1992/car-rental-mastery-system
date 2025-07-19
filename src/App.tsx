
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Auth } from '@/pages/Auth';
import { Dashboard } from '@/pages/Dashboard';
import { Contracts } from '@/pages/Contracts';
import { Customers } from '@/pages/Customers';
import { Vehicles } from '@/pages/Vehicles';
import { Employees } from '@/pages/Employees';
import { Invoices } from '@/pages/Invoices';
import { Payments } from '@/pages/Payments';
import { ChartOfAccounts } from '@/pages/Accounting/ChartOfAccounts';
import { JournalEntries } from '@/pages/Accounting/JournalEntries';
import { Branches } from '@/pages/Accounting/Branches';
import { FinancialPeriods } from '@/pages/Accounting/FinancialPeriods';
import { TrialBalanceReport } from '@/pages/Accounting/TrialBalanceReport';
import { IncomeStatementReport } from '@/pages/Accounting/IncomeStatementReport';
import { BalanceSheetReport } from '@/pages/Accounting/BalanceSheetReport';
import { FixedAssets } from '@/pages/Accounting/FixedAssets';
import { AssetDepreciation } from '@/pages/Accounting/AssetDepreciation';
import { AssetCategories } from '@/pages/Accounting/AssetCategories';
import { BankTransactions } from '@/pages/Accounting/BankTransactions';
import { Budgets } from '@/pages/Accounting/Budgets';
import { CostCenters } from '@/pages/Accounting/CostCenters';
import { JournalEntryReviews } from '@/pages/Accounting/JournalEntryReviews';
import { AdvancedKPIs } from '@/pages/Accounting/AdvancedKPIs';
import { AccountingWorkflows } from '@/pages/Accounting/AccountingWorkflows';
import { CashFlowStatementReport } from '@/pages/Accounting/CashFlowStatementReport';
import { FinancialSummariesReport } from '@/pages/Accounting/FinancialSummariesReport';
import { LiquidityAnalysisReport } from '@/pages/Accounting/LiquidityAnalysisReport';
import { AutomatedEntryRules } from '@/pages/Accounting/AutomatedEntryRules';
import { AdditionalCharges } from '@/pages/AdditionalCharges';
import { ContractExtensions } from '@/pages/ContractExtensions';
import { ContractIncidents } from '@/pages/ContractIncidents';
import { CustomerEvaluations } from '@/pages/CustomerEvaluations';
import { Departments } from '@/pages/Departments';
import { Quotations } from '@/pages/Quotations';
import { AdvancedAccountingHub } from '@/components/Accounting/AdvancedAccountingHub';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = new QueryClient();
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          {!isLoggedIn ? (
            <Auth />
          ) : (
            <div className="flex h-screen">
              <Sidebar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
              
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/contracts" element={<Contracts />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/vehicles" element={<Vehicles />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/quotations" element={<Quotations />} />
                    <Route path="/additional-charges" element={<AdditionalCharges />} />
                    <Route path="/contract-extensions" element={<ContractExtensions />} />
                    <Route path="/contract-incidents" element={<ContractIncidents />} />
                    <Route path="/customer-evaluations" element={<CustomerEvaluations />} />
                    <Route path="/departments" element={<Departments />} />
                    
                    {/* Accounting Routes */}
                    <Route path="/accounting/chart-of-accounts" element={<ChartOfAccounts />} />
                    <Route path="/accounting/journal-entries" element={<JournalEntries />} />
                    <Route path="/accounting/branches" element={<Branches />} />
                    <Route path="/accounting/financial-periods" element={<FinancialPeriods />} />
                    <Route path="/accounting/trial-balance-report" element={<TrialBalanceReport />} />
                    <Route path="/accounting/income-statement-report" element={<IncomeStatementReport />} />
                    <Route path="/accounting/balance-sheet-report" element={<BalanceSheetReport />} />
                    <Route path="/accounting/cash-flow-statement-report" element={<CashFlowStatementReport />} />
                    <Route path="/accounting/financial-summaries-report" element={<FinancialSummariesReport />} />
                    <Route path="/accounting/liquidity-analysis-report" element={<LiquidityAnalysisReport />} />
                    <Route path="/accounting/fixed-assets" element={<FixedAssets />} />
                    <Route path="/accounting/asset-depreciation" element={<AssetDepreciation />} />
                    <Route path="/accounting/asset-categories" element={<AssetCategories />} />
                    <Route path="/accounting/bank-transactions" element={<BankTransactions />} />
                    <Route path="/accounting/budgets" element={<Budgets />} />
                    <Route path="/accounting/cost-centers" element={<CostCenters />} />
                    <Route path="/accounting/journal-entry-reviews" element={<JournalEntryReviews />} />
                    <Route path="/accounting/advanced-kpis" element={<AdvancedKPIs />} />
                    <Route path="/accounting/accounting-workflows" element={<AccountingWorkflows />} />
                    <Route path="/accounting/automated-entry-rules" element={<AutomatedEntryRules />} />
                    <Route path="/advanced-accounting" element={<AdvancedAccountingHub />} />
                  </Routes>
                </main>
              </div>
            </div>
          )}
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
