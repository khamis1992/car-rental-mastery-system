import StatsCard from "@/components/Dashboard/StatsCard";
import QuickActions from "@/components/Dashboard/QuickActions";
import RecentContracts from "@/components/Dashboard/RecentContracts";
import FleetOverview from "@/components/Dashboard/FleetOverview";
import { AlertsOverview } from '@/components/Dashboard/AlertsOverview';
import IncidentsViolationsCard from "@/components/Dashboard/IncidentsViolationsCard";
import UpcomingMaintenanceCard from "@/components/Dashboard/UpcomingMaintenanceCard";
import CustomerRatingsCard from "@/components/Dashboard/CustomerRatingsCard";
import DailyReportCard from "@/components/Dashboard/DailyReportCard";
import SmartSearch from "@/components/Dashboard/SmartSearch";
import { 
  User, 
  Calendar, 
  FileText,
  Plus,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="إجمالي العقود"
            value="142"
            subtitle="هذا الشهر"
            icon={<FileText className="w-5 h-5" />}
            trend={{ value: "+12% من الشهر الماضي", type: "up" }}
          />
          <StatsCard
            title="العملاء النشطين"
            value="89"
            subtitle="عميل مسجل"
            icon={<User className="w-5 h-5" />}
            trend={{ value: "+5 عملاء جدد", type: "up" }}
          />
          <StatsCard
            title="الإيرادات اليوم"
            value="125 د.ك"
            subtitle="من 22 عقد"
            icon={<Plus className="w-5 h-5" />}
            trend={{ value: "+8% عن أمس", type: "up" }}
          />
          <StatsCard
            title="العقود المنتهية اليوم"
            value="7"
            subtitle="تحتاج متابعة"
            icon={<Calendar className="w-5 h-5" />}
            trend={{ value: "2 متأخرة", type: "down" }}
          />
        </div>

        {/* البحث الذكي */}
        <div className="mb-6">
          <SmartSearch />
        </div>

        {/* البطاقات الجديدة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <IncidentsViolationsCard />
          <UpcomingMaintenanceCard />
          <CustomerRatingsCard />
          <DailyReportCard />
        </div>

        {/* زر التقارير والتحليلات */}
        <div className="flex justify-center mb-8">
          <Button className="btn-royal flex items-center gap-2" size="lg">
            <BarChart3 className="w-5 h-5" />
            التقارير والتحليلات الشاملة
          </Button>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* العمود الأيسر - العقود الحديثة */}
          <div className="lg:col-span-2">
            <RecentContracts />
          </div>

          {/* العمود الأيمن */}
          <div className="space-y-6">
            <AlertsOverview onAlertClick={(alert) => console.log('Alert clicked:', alert)} />
            <QuickActions />
            <FleetOverview />
          </div>
        </div>
    </div>
  );
};

export default Index;
