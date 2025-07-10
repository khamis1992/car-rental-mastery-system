import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  Activity, 
  DollarSign,
  TrendingUp,
  Database,
  Shield,
  Globe
} from "lucide-react";

const SuperAdminStats: React.FC = () => {
  // في التطبيق الحقيقي، سيتم جلب هذه البيانات من API
  const stats = [
    {
      title: "إجمالي المؤسسات",
      value: "12",
      icon: Building2,
      change: "+2 هذا الشهر",
      color: "text-blue-600"
    },
    {
      title: "إجمالي المستخدمين",
      value: "1,247",
      icon: Users,
      change: "+18% نمو",
      color: "text-green-600"
    },
    {
      title: "المعاملات النشطة",
      value: "8,432",
      icon: Activity,
      change: "+5.2% اليوم",
      color: "text-orange-600"
    },
    {
      title: "إجمالي الإيرادات",
      value: "45,320 د.ك",
      icon: DollarSign,
      change: "+12% هذا الشهر",
      color: "text-purple-600"
    },
    {
      title: "معدل الأداء",
      value: "99.8%",
      icon: TrendingUp,
      change: "مستقر",
      color: "text-green-600"
    },
    {
      title: "حجم البيانات",
      value: "2.3 TB",
      icon: Database,
      change: "+150 GB",
      color: "text-indigo-600"
    },
    {
      title: "حالة الأمان",
      value: "آمن",
      icon: Shield,
      change: "لا توجد تهديدات",
      color: "text-green-600"
    },
    {
      title: "المناطق النشطة",
      value: "3",
      icon: Globe,
      change: "الكويت، السعودية، الإمارات",
      color: "text-blue-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-primary/10 hover:border-primary/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SuperAdminStats;