import StatsCard from "@/components/Dashboard/StatsCard";
import QuickActions from "@/components/Dashboard/QuickActions";
import RecentContracts from "@/components/Dashboard/RecentContracts";
import FleetOverview from "@/components/Dashboard/FleetOverview";
import DailyTasksChecklist from "@/components/Dashboard/DailyTasksChecklist";
import { BudgetOverrunAlerts } from "@/components/Dashboard/BudgetOverrunAlerts";
import { FinancialHighlights } from "@/components/Dashboard/FinancialHighlights";
import { ModernQuickActions } from "@/components/Dashboard/ModernQuickActions";
import { CashFlowWidget } from "@/components/Dashboard/CashFlowWidget";
import { AccountsOverview } from "@/components/Dashboard/AccountsOverview";
import { 
  User, 
  Calendar, 
  FileText,
  Plus,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContractsOptimized } from "@/hooks/useContractsOptimized";
import { useMaintenanceData } from "@/hooks/useMaintenanceData";
import { useTenant } from "@/contexts/TenantContext";
import TenantGuard from "@/components/TenantGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { formatCurrencyKWD } from "@/lib/currency";

const Index = () => {
  const navigate = useNavigate();
  const { contractStats, customers, loading } = useContractsOptimized();
  const { maintenanceRecords } = useMaintenanceData();
  const { currentTenant } = useTenant();

  // Mock data for new components - in real implementation, this would come from hooks/API
  const financialData = {
    totalRevenue: contractStats.monthlyRevenue || 0,
    totalExpenses: contractStats.monthlyRevenue * 0.7 || 0, // Mock 70% expense ratio
    netIncome: (contractStats.monthlyRevenue || 0) * 0.3,
    cashFlow: (contractStats.monthlyRevenue || 0) * 0.15,
    accountsReceivable: (contractStats.monthlyRevenue || 0) * 1.5,
    accountsPayable: (contractStats.monthlyRevenue || 0) * 0.8,
    revenueGrowth: 15.2,
    expenseGrowth: 8.5
  };

  const cashFlowData = {
    totalInflow: contractStats.monthlyRevenue || 0,
    totalOutflow: (contractStats.monthlyRevenue || 0) * 0.7,
    netCashFlow: (contractStats.monthlyRevenue || 0) * 0.3,
    monthlyData: [] // Mock data
  };

  const accountsData = {
    totalReceivables: (contractStats.monthlyRevenue || 0) * 1.5,
    totalPayables: (contractStats.monthlyRevenue || 0) * 0.8,
    overdueReceivables: (contractStats.monthlyRevenue || 0) * 0.3,
    overduePayables: (contractStats.monthlyRevenue || 0) * 0.1,
    receivablesCount: customers.length,
    payablesCount: 12, // Mock
    overdueReceivablesCount: Math.floor(customers.length * 0.2),
    overduePayablesCount: 2 // Mock
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Modern Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          مرحباً بك في {currentTenant?.name || 'النظام'}
        </h2>
        <p className="text-muted-foreground">
          نظرة شاملة على أعمالك وإدارة متكاملة لجميع عمليات التأجير
        </p>
      </div>

      {/* Financial Highlights - New Modern Component */}
      <div className="animate-fade-in">
        <h3 className="text-xl font-semibold mb-4 rtl-title">المؤشرات المالية</h3>
        <FinancialHighlights data={financialData} loading={loading} />
      </div>

      {/* Quick Actions & Cash Flow Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        <ModernQuickActions />
        <CashFlowWidget data={cashFlowData} loading={loading} />
      </div>

      {/* Accounts Overview & Fleet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        <AccountsOverview data={accountsData} loading={loading} />
        <FleetOverview />
      </div>

      {/* Legacy Stats Cards - Keep for compatibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
        <StatsCard
          title="إجمالي العقود"
          value={loading ? "..." : contractStats.total.toString()}
          subtitle="هذا الشهر"
          icon={<FileText className="w-5 h-5" />}
          trend={{ 
            value: loading ? "..." : `${contractStats.active} نشط`, 
            type: contractStats.active > 0 ? "up" : "neutral" 
          }}
          actionText="عرض التفاصيل"
          onActionClick={() => navigate('/contracts')}
        />
        <StatsCard
          title="العملاء النشطين"
          value={loading ? "..." : customers.length.toString()}
          subtitle="عميل مسجل"
          icon={<User className="w-5 h-5" />}
          trend={{ 
            value: loading ? "..." : `${customers.length} مسجل`, 
            type: customers.length > 0 ? "up" : "neutral" 
          }}
          actionText="إدارة العملاء"
          onActionClick={() => navigate('/customers')}
        />
        <StatsCard
          title="الإيرادات الشهرية"
          value={loading ? "..." : formatCurrencyKWD(contractStats.monthlyRevenue)}
          subtitle={`من ${contractStats.active} عقد نشط`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ 
            value: loading ? "..." : contractStats.monthlyRevenue > 0 ? "إيجابي" : "لا توجد إيرادات", 
            type: contractStats.monthlyRevenue > 0 ? "up" : "neutral" 
          }}
          actionText="التقارير المالية"
          onActionClick={() => navigate('/financial-reports')}
        />
        <StatsCard
          title="العقود المنتهية اليوم"
          value={loading ? "..." : contractStats.endingToday.toString()}
          subtitle={contractStats.endingToday > 0 ? "تحتاج متابعة" : "لا توجد عقود"}
          icon={<Calendar className="w-5 h-5" />}
          trend={{ 
            value: loading ? "..." : contractStats.endingToday > 0 ? "تحتاج انتباه" : "كله تمام", 
            type: contractStats.endingToday > 0 ? "down" : "up" 
          }}
          actionText="متابعة الآن"
          onActionClick={() => navigate('/contracts')}
        />
      </div>

      {/* Additional Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        <DailyTasksChecklist />
        <RecentContracts />
        <BudgetOverrunAlerts />
      </div>
    </div>
  );
};

export default Index;
