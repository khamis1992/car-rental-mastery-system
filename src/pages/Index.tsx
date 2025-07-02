import StatsCard from "@/components/Dashboard/StatsCard";
import QuickActions from "@/components/Dashboard/QuickActions";
import RecentContracts from "@/components/Dashboard/RecentContracts";
import FleetOverview from "@/components/Dashboard/FleetOverview";
import AddEmployeeForm from "@/components/Employees/AddEmployeeForm";
import { 
  User, 
  Calendar, 
  FileText,
  Plus,
  TrendingUp,
  DollarSign,
  UserPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const navigate = useNavigate();
  const [showAddEmployee, setShowAddEmployee] = useState(false);

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

        {/* تنبيه لإضافة الموظف */}
        <div className="mb-6">
          <Alert>
            <UserPlus className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>لتتمكن من تسجيل الحضور، يجب أولاً إضافة بياناتك كموظف في النظام</span>
              <Button onClick={() => setShowAddEmployee(true)} size="sm">
                <UserPlus className="w-4 h-4 ml-2" />
                إضافة بيانات الموظف
              </Button>
            </AlertDescription>
          </Alert>
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

        {/* قسم الإجراءات السريعة ونظرة عامة على الأسطول */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in">
          <QuickActions />
          <FleetOverview />
        </div>

        {/* المحتوى الرئيسي */}
        <div className="grid grid-cols-1 gap-6 animate-fade-in">
          <RecentContracts />
        </div>

        {/* نموذج إضافة موظف */}
        <AddEmployeeForm 
          isOpen={showAddEmployee}
          onClose={() => setShowAddEmployee(false)}
          onEmployeeAdded={() => {
            setShowAddEmployee(false);
            window.location.reload(); // إعادة تحميل الصفحة لإخفاء التنبيه
          }}
        />
    </div>
  );
};

export default Index;
