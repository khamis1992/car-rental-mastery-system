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
  Globe,
  RefreshCw
} from "lucide-react";
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';

const SuperAdminStats: React.FC = () => {
  const { data: statsData, isLoading, error } = useSuperAdminStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="border-primary/10">
            <CardContent className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-full border-destructive/20">
          <CardContent className="flex items-center justify-center py-12 text-destructive">
            حدث خطأ في تحميل البيانات
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: "إجمالي المؤسسات",
      value: statsData?.totalTenants?.toLocaleString() || "0",
      icon: Building2,
      change: statsData?.tenantGrowth || "+0 هذا الشهر",
      color: "text-blue-600"
    },
    {
      title: "إجمالي المستخدمين",
      value: statsData?.totalUsers?.toLocaleString() || "0",
      icon: Users,
      change: statsData?.userGrowth || "+0% نمو",
      color: "text-green-600"
    },
    {
      title: "المعاملات النشطة",
      value: statsData?.activeTransactions?.toLocaleString() || "0",
      icon: Activity,
      change: statsData?.transactionGrowth || "+0% اليوم",
      color: "text-orange-600"
    },
    {
      title: "إيرادات الاشتراكات",
      value: `${statsData?.totalRevenue?.toFixed(3) || "0.000"} د.ك`,
      icon: DollarSign,
      change: statsData?.revenueGrowth || "+0% هذا الشهر",
      color: "text-purple-600"
    },
    {
      title: "معدل الأداء",
      value: `${statsData?.systemPerformance || 0}%`,
      icon: TrendingUp,
      change: "مستقر",
      color: "text-green-600"
    },
    {
      title: "حجم البيانات",
      value: statsData?.dataSize || "0 TB",
      icon: Database,
      change: "+150 GB",
      color: "text-indigo-600"
    },
    {
      title: "حالة الأمان",
      value: statsData?.securityStatus || "آمن",
      icon: Shield,
      change: "لا توجد تهديدات",
      color: "text-green-600"
    },
    {
      title: "المناطق النشطة",
      value: statsData?.activeRegions?.toString() || "0",
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
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent className="text-right">
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