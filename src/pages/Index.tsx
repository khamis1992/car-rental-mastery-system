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
import { FinancialNavigationHub } from "@/components/Financial/FinancialNavigationHub";
import { FinancialQuickActions } from "@/components/Financial/FinancialQuickActions";
import { FinancialStatusIndicators } from "@/components/Financial/FinancialStatusIndicators";
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

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2 rtl-title">
          مرحباً بك في {currentTenant?.name || 'البشائر الخليجية'}
        </h2>
        <p className="text-muted-foreground">
          نظرة شاملة على أعمالك وإدارة متكاملة لجميع عمليات التأجير
        </p>
      </div>

      {/* Main Stats Cards - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
        <StatsCard
          title="المخزون الموجود"
          value="0"
          subtitle="لا يوجد عقد"
          icon={<FileText className="w-5 h-5" />}
          trend={{ 
            value: "متابعة الآن", 
            type: "neutral" 
          }}
          actionText="عرض التفاصيل"
          onActionClick={() => navigate('/contracts')}
        />
        <StatsCard
          title="الإيرادات الشهرية"
          value={loading ? "..." : formatCurrencyKWD(contractStats.monthlyRevenue)}
          subtitle="من 0 عقد نشط"
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ 
            value: "لا توجد إيرادات", 
            type: "neutral" 
          }}
          actionText="التقارير المالية"
          onActionClick={() => navigate('/financial-reports')}
        />
        <StatsCard
          title="العملاء النشطين"
          value={loading ? "..." : customers.length.toString()}
          subtitle="عميل مسجل"
          icon={<User className="w-5 h-5" />}
          trend={{ 
            value: "إدارة العملاء", 
            type: "neutral" 
          }}
          actionText="إدارة العملاء"
          onActionClick={() => navigate('/customers')}
        />
        <StatsCard
          title="إجمالي العقود"
          value={loading ? "..." : contractStats.total.toString()}
          subtitle="هذا الشهر"
          icon={<FileText className="w-5 h-5" />}
          trend={{ 
            value: "عرض التفاصيل", 
            type: "neutral" 
          }}
          actionText="عرض التفاصيل"
          onActionClick={() => navigate('/contracts')}
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        <DailyTasksChecklist />
        <FleetOverview />
        <ModernQuickActions />
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        <BudgetOverrunAlerts />
        <RecentContracts />
      </div>
    </div>
  );
};

export default Index;
