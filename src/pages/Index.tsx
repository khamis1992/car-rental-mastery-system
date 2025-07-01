import StatsCard from "@/components/Dashboard/StatsCard";
import QuickActions from "@/components/Dashboard/QuickActions";
import RecentContracts from "@/components/Dashboard/RecentContracts";
import FleetOverview from "@/components/Dashboard/FleetOverview";
import { AlertsOverview } from '@/components/Dashboard/AlertsOverview';

import ImportantNotifications from '@/components/Dashboard/ImportantNotifications';
import DailyTasksChecklist from '@/components/Dashboard/DailyTasksChecklist';
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
            مرحباً بك في نظام إدارة تأجير السيارات
          </h2>
          <p className="text-muted-foreground">
            نظرة شاملة على أعمالك وإدارة متكاملة لجميع عمليات التأجير
          </p>
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
          <StatsCard
            title="إجمالي العقود"
            value="142"
            subtitle="هذا الشهر"
            icon={<FileText className="w-5 h-5" />}
            trend={{ value: "+12% من الشهر الماضي", type: "up" }}
            actionText="عرض التفاصيل"
            onActionClick={() => navigate('/contracts')}
          />
          <StatsCard
            title="العملاء النشطين"
            value="89"
            subtitle="عميل مسجل"
            icon={<User className="w-5 h-5" />}
            trend={{ value: "+5 عملاء جدد", type: "up" }}
            actionText="إدارة العملاء"
            onActionClick={() => navigate('/customers')}
          />
          <StatsCard
            title="الإيرادات اليوم"
            value="1,250 د.ك"
            subtitle="من 22 عقد"
            icon={<DollarSign className="w-5 h-5" />}
            trend={{ value: "+18% عن أمس", type: "up" }}
            actionText="التقارير المالية"
            onActionClick={() => navigate('/analytics')}
          />
          <StatsCard
            title="العقود المنتهية اليوم"
            value="7"
            subtitle="تحتاج متابعة"
            icon={<Calendar className="w-5 h-5" />}
            trend={{ value: "2 متأخرة", type: "down" }}
            actionText="متابعة الآن"
            onActionClick={() => navigate('/contracts')}
          />
        </div>

        {/* قسم التنبيهات والمهام */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <ImportantNotifications />
          <DailyTasksChecklist />
          <QuickActions />
        </div>

        {/* المحتوى الرئيسي */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* العمود الأيسر - العقود الحديثة */}
          <div className="lg:col-span-2 space-y-6">
            <RecentContracts />
          </div>

          {/* العمود الأيمن */}
          <div className="space-y-6">
            <AlertsOverview onAlertClick={(alert) => console.log('Alert clicked:', alert)} />
            <FleetOverview />
          </div>
        </div>
    </div>
  );
};

export default Index;
