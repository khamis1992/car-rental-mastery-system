import StatsCard from "@/components/Dashboard/StatsCard";
import QuickActions from "@/components/Dashboard/QuickActions";
import RecentContracts from "@/components/Dashboard/RecentContracts";
import FleetOverview from "@/components/Dashboard/FleetOverview";
import DailyTasksChecklist from "@/components/Dashboard/DailyTasksChecklist";
import { BudgetOverrunAlerts } from "@/components/Dashboard/BudgetOverrunAlerts";
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
import TenantGuard from "@/components/TenantGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { formatCurrencyKWD } from "@/lib/currency";

const Index = () => {
  const navigate = useNavigate();
  const { contractStats, customers, loading } = useContractsOptimized();
  const { maintenanceRecords } = useMaintenanceData();

  return (
    <div className="container mx-auto px-6 py-8">
        {/* شاشة الترحيب */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            مرحباً بك في البشائر الخليجية
          </h2>
          <p className="text-muted-foreground">
            نظرة شاملة على أعمالك وإدارة متكاملة لجميع عمليات التأجير
          </p>
        </div>

        {/* بطاقات الإحصائيات */}
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

        {/* قسم الإجراءات السريعة ونظرة عامة على الأسطول */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <QuickActions />
          <FleetOverview />
          <DailyTasksChecklist />
        </div>

        {/* المحتوى الرئيسي */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in">
          <RecentContracts />
          <BudgetOverrunAlerts />
        </div>
    </div>
  );
};

export default Index;
