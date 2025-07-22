import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Car, 
  FileText, 
  TrendingUp, 
  Users, 
  Settings,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { CostCenterTemplates } from './CostCenterTemplates';
import { VehicleCostCenterMapping } from './VehicleCostCenterMapping';
import { PerformanceAnalytics } from './PerformanceAnalytics';
import { CostCenterKPIs } from './CostCenterKPIs';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon, trend }) => {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const changePrefix = change > 0 ? '+' : '';
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className={`text-xs ${trendColor}`}>
              {changePrefix}{change}% من الشهر الماضي
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const SpecializedCostCenterDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with real data from API
  const kpiData = [
    {
      title: 'إجمالي الإيرادات',
      value: '45,250 د.ك',
      change: 12.5,
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      trend: 'up' as const
    },
    {
      title: 'معدل الربحية',
      value: '32.8%',
      change: 5.2,
      icon: <BarChart3 className="h-6 w-6 text-primary" />,
      trend: 'up' as const
    },
    {
      title: 'معدل استغلال المركبات',
      value: '78.5%',
      change: -2.1,
      icon: <Car className="h-6 w-6 text-primary" />,
      trend: 'down' as const
    },
    {
      title: 'عدد العقود النشطة',
      value: '156',
      change: 8.3,
      icon: <FileText className="h-6 w-6 text-primary" />,
      trend: 'up' as const
    }
  ];

  const costCentersByType = [
    { type: 'الفروع', count: 5, active: 5, revenue: '25,400 د.ك' },
    { type: 'أنواع المركبات', count: 6, active: 6, revenue: '15,850 د.ك' },
    { type: 'أنواع العقود', count: 6, active: 4, revenue: '18,200 د.ك' }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex flex-row-reverse items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مراكز التكلفة المتخصصة</h1>
          <p className="text-muted-foreground">
            إدارة وتحليل مراكز التكلفة حسب الفروع وأنواع المركبات والعقود
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          إعدادات النظام
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            القوالب
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            ربط المركبات
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            تحليل الأداء
          </TabsTrigger>
          <TabsTrigger value="kpis" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            مؤشرات الأداء
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.map((kpi, index) => (
              <KPICard key={index} {...kpi} />
            ))}
          </div>

          {/* Cost Centers Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                نظرة عامة على مراكز التكلفة
              </CardTitle>
              <CardDescription>
                توزيع مراكز التكلفة حسب النوع والأداء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costCentersByType.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{item.type}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.active} من {item.count} نشط
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{item.revenue}</p>
                        <p className="text-sm text-muted-foreground">الإيرادات</p>
                      </div>
                      <Progress 
                        value={(item.active / item.count) * 100} 
                        className="w-20"
                      />
                      <Badge variant={item.active === item.count ? "default" : "secondary"}>
                        {Math.round((item.active / item.count) * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setActiveTab('templates')}>
              <CardContent className="p-6 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">إدارة القوالب</h3>
                <p className="text-sm text-muted-foreground">
                  إنشاء وتخصيص قوالب مراكز التكلفة
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setActiveTab('mapping')}>
              <CardContent className="p-6 text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">ربط المركبات</h3>
                <p className="text-sm text-muted-foreground">
                  ربط المركبات بمراكز التكلفة تلقائياً
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setActiveTab('analytics')}>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">تحليل الأداء</h3>
                <p className="text-sm text-muted-foreground">
                  مراجعة أداء مراكز التكلفة والربحية
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <CostCenterTemplates />
        </TabsContent>

        <TabsContent value="mapping">
          <VehicleCostCenterMapping />
        </TabsContent>

        <TabsContent value="analytics">
          <PerformanceAnalytics />
        </TabsContent>

        <TabsContent value="kpis">
          <CostCenterKPIs />
        </TabsContent>
      </Tabs>
    </div>
  );
};