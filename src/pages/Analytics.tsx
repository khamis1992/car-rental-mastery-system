import React, { useState } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  FileText,
  Users,
  Car,
  DollarSign,
  GitBranch
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { KPICard } from '@/components/Analytics/KPICard';
import { RevenueChart } from '@/components/Analytics/RevenueChart';
import { FleetUtilizationChart } from '@/components/Analytics/FleetUtilizationChart';
import { CustomerSegmentChart } from '@/components/Analytics/CustomerSegmentChart';
import { PerformanceTable } from '@/components/Analytics/PerformanceTable';
import { formatCurrencyKWD } from '@/lib/currency';

const Analytics = () => {
  const [dateRange, setDateRange] = useState('thisMonth');
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  

  // Fetch analytics data
  const {
    kpiData,
    revenueData,
    fleetData,
    customerData,
    advancedKPIs,
    isLoading,
    error
  } = useAnalyticsData(dateRange);

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 85) return 'text-green-500';
    if (utilization >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="w-40 h-10" />
            <Skeleton className="w-20 h-10" />
            <Skeleton className="w-32 h-10" />
            <Skeleton className="w-24 h-10" />
          </div>
          <div>
            <Skeleton className="w-64 h-8" />
            <Skeleton className="w-48 h-4 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="w-full h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between rtl-flex">
        <div className="flex gap-2 rtl-flex">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="thisWeek">هذا الأسبوع</SelectItem>
              <SelectItem value="thisMonth">هذا الشهر</SelectItem>
              <SelectItem value="thisQuarter">هذا الربع</SelectItem>
              <SelectItem value="thisYear">هذا العام</SelectItem>
              <SelectItem value="custom">فترة مخصصة</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="gap-2 rtl-flex">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          
          
          <Button className="btn-primary gap-2 rtl-flex">
            <Download className="w-4 h-4" />
            تصدير التقرير
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">التحليلات والتقارير المتقدمة</h1>
          <p className="text-muted-foreground">نظرة شاملة ومفصلة على أداء الأعمال</p>
        </div>
      </div>

      {/* مؤشرات الأداء الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            icon={kpi.icon}
            trend={kpi.trend}
          />
        ))}
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="customers">العملاء</TabsTrigger>
          <TabsTrigger value="fleet">الأسطول</TabsTrigger>
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RevenueChart data={revenueData} />
            <FleetUtilizationChart data={fleetData} />
          </div>
        </TabsContent>

        <TabsContent value="fleet" className="space-y-4">
          <FleetUtilizationChart data={fleetData} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <CustomerSegmentChart data={customerData} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceTable data={advancedKPIs} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">الاتجاهات الشهرية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات اتجاهات متاحة
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">توقعات الأداء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد توقعات أداء متاحة
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default Analytics;