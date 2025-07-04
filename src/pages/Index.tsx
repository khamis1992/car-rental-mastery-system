import StatsCard from "@/components/Dashboard/StatsCard";
import QuickActions from "@/components/Dashboard/QuickActions";
import RecentContracts from "@/components/Dashboard/RecentContracts";
import FleetOverview from "@/components/Dashboard/FleetOverview";
import { 
  User, 
  Calendar, 
  FileText,
  Plus,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

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
            value="0"
            subtitle="هذا الشهر"
            icon={<FileText className="w-5 h-5" />}
            trend={{ value: "لا توجد بيانات", type: "neutral" }}
            actionText="عرض التفاصيل"
            onActionClick={() => navigate('/contracts')}
          />
          <StatsCard
            title="العملاء النشطين"
            value="0"
            subtitle="عميل مسجل"
            icon={<User className="w-5 h-5" />}
            trend={{ value: "لا توجد بيانات", type: "neutral" }}
            actionText="إدارة العملاء"
            onActionClick={() => navigate('/customers')}
          />
          <StatsCard
            title="الإيرادات اليوم"
            value="0 د.ك"
            subtitle="من 0 عقد"
            icon={<DollarSign className="w-5 h-5" />}
            trend={{ value: "لا توجد بيانات", type: "neutral" }}
            actionText="التقارير المالية"
            onActionClick={() => navigate('/analytics')}
          />
          <StatsCard
            title="العقود المنتهية اليوم"
            value="0"
            subtitle="لا توجد عقود"
            icon={<Calendar className="w-5 h-5" />}
            trend={{ value: "لا توجد بيانات", type: "neutral" }}
            actionText="متابعة الآن"
            onActionClick={() => navigate('/contracts')}
          />
        </div>

        {/* قسم الإجراءات السريعة ونظرة عامة على الأسطول */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in">
          <QuickActions />
          <FleetOverview />
        </div>

        {/* المحتوى الرئيسي */}
        <div className="grid grid-cols-1 gap-6 animate-fade-in">
          <RecentContracts />
        </div>
    </div>
  );
};

export default Index;
