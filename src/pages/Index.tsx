
import StatsCard from "@/components/Dashboard/StatsCard";
import QuickActions from "@/components/Dashboard/QuickActions";
import RecentContracts from "@/components/Dashboard/RecentContracts";
import FleetOverview from "@/components/Dashboard/FleetOverview";
import DailyTasksChecklist from "@/components/Dashboard/DailyTasksChecklist";
import { BudgetOverrunAlerts } from "@/components/Dashboard/BudgetOverrunAlerts";
import { RealtimeIndicator } from "@/components/Dashboard/RealtimeIndicator";
import { 
  User, 
  Calendar, 
  FileText,
  Plus,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import TenantGuard from "@/components/TenantGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { formatCurrencyKWD } from "@/lib/currency";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { Button } from "@/components/ui/button";


const Index = () => {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const { stats, loading, error, isConnected, refreshStats } = useDashboardRealtime();

  return (
    <div className="container mx-auto px-6 py-8">
      {/* شاشة الترحيب مع مؤشر التحديث المباشر */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2 rtl-title">
            مرحباً بك في {currentTenant?.name || 'النظام'}
          </h2>
          <p className="text-muted-foreground">
            نظرة شاملة على أعمالك وإدارة متكاملة لجميع عمليات التأجير
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RealtimeIndicator 
            size="md"
          />
          {!loading && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={() => refreshStats()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              تحديث
            </Button>
          )}
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
        <StatsCard
          title="إجمالي العقود"
          value={loading ? "..." : stats.contracts.total.toString()}
          subtitle="هذا الشهر"
          icon={<FileText className="w-5 h-5" />}
          trend={{ 
            value: loading ? "..." : `${stats.contracts.active} نشط`, 
            type: stats.contracts.active > 0 ? "up" : "neutral" 
          }}
          actionText="عرض التفاصيل"
          onActionClick={() => navigate('/contracts')}
          isUpdating={stats.contracts.isUpdating}
          isConnected={isConnected}
          lastUpdated={stats.contracts.lastUpdated}
          showRealtimeIndicator={true}
        />
        <StatsCard
          title="العملاء النشطين"
          value={loading ? "..." : stats.customers.total.toString()}
          subtitle="عميل مسجل"
          icon={<User className="w-5 h-5" />}
          trend={{ 
            value: loading ? "..." : `${stats.customers.active} نشط`, 
            type: stats.customers.active > 0 ? "up" : "neutral" 
          }}
          actionText="إدارة العملاء"
          onActionClick={() => navigate('/customers')}
          isUpdating={stats.customers.isUpdating}
          isConnected={isConnected}
          lastUpdated={stats.customers.lastUpdated}
          showRealtimeIndicator={true}
        />
        <StatsCard
          title="الإيرادات الشهرية"
          value={loading ? "..." : formatCurrencyKWD(stats.contracts.monthlyRevenue)}
          subtitle={`من ${stats.contracts.active} عقد نشط`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ 
            value: loading ? "..." : stats.contracts.monthlyRevenue > 0 ? "إيجابي" : "لا توجد إيرادات", 
            type: stats.contracts.monthlyRevenue > 0 ? "up" : "neutral" 
          }}
          actionText="التقارير المالية"
          onActionClick={() => navigate('/financial-reports')}
          isUpdating={stats.financials.isUpdating || stats.contracts.isUpdating}
          isConnected={isConnected}
          lastUpdated={stats.financials.lastUpdated}
          showRealtimeIndicator={true}
        />
        <StatsCard
          title="العقود المنتهية اليوم"
          value={loading ? "..." : stats.contracts.endingToday.toString()}
          subtitle={stats.contracts.endingToday > 0 ? "تحتاج متابعة" : "لا توجد عقود"}
          icon={<Calendar className="w-5 h-5" />}
          trend={{ 
            value: loading ? "..." : stats.contracts.endingToday > 0 ? "تحتاج انتباه" : "كله تمام", 
            type: stats.contracts.endingToday > 0 ? "down" : "up" 
          }}
          actionText="متابعة الآن"
          onActionClick={() => navigate('/contracts')}
          isUpdating={stats.contracts.isUpdating}
          isConnected={isConnected}
          lastUpdated={stats.contracts.lastUpdated}
          showRealtimeIndicator={true}
        />
      </div>

      {/* قسم الإجراءات السريعة ونظرة عامة على الأسطول */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
        <QuickActions />
        <FleetOverview 
          isUpdating={stats.vehicles.isUpdating}
          isConnected={isConnected}
          lastUpdated={stats.vehicles.lastUpdated}
        />
        <DailyTasksChecklist />
      </div>

      {/* المحتوى الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in">
        <RecentContracts 
          isUpdating={stats.contracts.isUpdating}
          isConnected={isConnected}
          lastUpdated={stats.contracts.lastUpdated}
        />
        <BudgetOverrunAlerts 
          isUpdating={stats.financials.isUpdating}
          isConnected={isConnected}
          lastUpdated={stats.financials.lastUpdated}
        />
      </div>


    </div>
  );
};

export default Index;
