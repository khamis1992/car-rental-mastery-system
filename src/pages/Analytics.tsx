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
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyKWD } from '@/lib/currency';

const Analytics = () => {
  const [dateRange, setDateRange] = useState('thisMonth');
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  // Empty data arrays - to be replaced with real data
  const kpiData: any[] = [];
  const revenueData: any[] = [];
  const fleetUtilization: any[] = [];
  const customerSegments: any[] = [];
  const topPerformingVehicles: any[] = [];

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 85) return 'text-green-500';
    if (utilization >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التحليلات والتقارير المتقدمة</h1>
          <p className="text-muted-foreground">نظرة شاملة ومفصلة على أداء الأعمال</p>
        </div>
        
        <div className="flex items-center gap-2">
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
          
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
          
          <Button className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* مؤشرات الأداء الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500">{kpi.change}</span>
                  </div>
                </div>
                {kpi.icon}
              </div>
            </CardContent>
          </Card>
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
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  الإيرادات الشهرية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات إيرادات متاحة
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  توزيع الإيرادات حسب نوع السيارة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات أسطول متاحة
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fleet" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                تحليل أداء الأسطول
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                لا توجد بيانات أداء أسطول متاحة
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  شرائح العملاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات شرائح عملاء متاحة
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>إحصائيات العملاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد إحصائيات عملاء متاحة
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                أفضل السيارات أداءً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                لا توجد بيانات أداء سيارات متاحة
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>الاتجاهات الشهرية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات اتجاهات متاحة
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>توقعات الأداء</CardTitle>
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