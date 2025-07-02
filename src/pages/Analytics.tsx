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

const Analytics = () => {
  const [dateRange, setDateRange] = useState('thisMonth');
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  // Mock data for analytics
  const kpiData = [
    {
      title: 'إجمالي الإيرادات',
      value: '125,450 ر.س',
      change: '+12.5%',
      trend: 'up',
      icon: <DollarSign className="w-6 h-6 text-green-500" />
    },
    {
      title: 'عدد العقود النشطة',
      value: '89',
      change: '+8.2%',
      trend: 'up',
      icon: <FileText className="w-6 h-6 text-blue-500" />
    },
    {
      title: 'معدل إشغال الأسطول',
      value: '78%',
      change: '+5.1%',
      trend: 'up',
      icon: <Car className="w-6 h-6 text-orange-500" />
    },
    {
      title: 'رضا العملاء',
      value: '4.7/5',
      change: '+0.3',
      trend: 'up',
      icon: <Users className="w-6 h-6 text-purple-500" />
    }
  ];

  const revenueData = [
    { month: 'يناير', revenue: 45000, contracts: 28, avgDailyRate: 180 },
    { month: 'فبراير', revenue: 52000, contracts: 32, avgDailyRate: 185 },
    { month: 'مارس', revenue: 48000, contracts: 30, avgDailyRate: 175 },
    { month: 'أبريل', revenue: 58000, contracts: 35, avgDailyRate: 190 },
    { month: 'مايو', revenue: 62000, contracts: 38, avgDailyRate: 195 },
    { month: 'يونيو', revenue: 67000, contracts: 42, avgDailyRate: 200 }
  ];

  const fleetUtilization = [
    { vehicleType: 'سيدان', utilization: 85, count: 15, revenue: 28500 },
    { vehicleType: 'SUV', utilization: 92, count: 12, revenue: 35600 },
    { vehicleType: 'اقتصادية', utilization: 78, count: 20, revenue: 22400 },
    { vehicleType: 'فاخرة', utilization: 65, count: 8, revenue: 18900 },
    { vehicleType: 'شاحنة صغيرة', utilization: 73, count: 10, revenue: 15800 }
  ];

  const customerSegments = [
    { segment: 'عملاء شركات', percentage: 45, revenue: 67500, count: 23 },
    { segment: 'عملاء أفراد', percentage: 35, revenue: 43750, count: 156 },
    { segment: 'عملاء مميزون', percentage: 20, revenue: 31250, count: 12 }
  ];

  const topPerformingVehicles = [
    { vehicle: 'كامري 2023 - VEH001', revenue: 8500, utilization: 95, rating: 4.9 },
    { vehicle: 'اكورد 2022 - VEH005', revenue: 7800, utilization: 92, rating: 4.8 },
    { vehicle: 'CRV 2023 - VEH012', revenue: 9200, utilization: 88, rating: 4.7 },
    { vehicle: 'سونتا 2022 - VEH008', revenue: 6900, utilization: 85, rating: 4.6 },
    { vehicle: 'التيما 2023 - VEH015', revenue: 7200, utilization: 83, rating: 4.5 }
  ];

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
                <div className="space-y-4">
                  {revenueData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{data.month}</p>
                        <p className="text-sm text-muted-foreground">{data.contracts} عقد</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{data.revenue.toLocaleString()} ر.س</p>
                        <p className="text-sm text-muted-foreground">متوسط: {data.avgDailyRate} ر.س/يوم</p>
                      </div>
                    </div>
                  ))}
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
                <div className="space-y-4">
                  {fleetUtilization.map((vehicle, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{vehicle.vehicleType}</span>
                        <span className="font-bold">{vehicle.revenue.toLocaleString()} ر.س</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(vehicle.revenue / 35600) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{vehicle.count} سيارة</span>
                        <span className={getUtilizationColor(vehicle.utilization)}>
                          {vehicle.utilization}% إشغال
                        </span>
                      </div>
                    </div>
                  ))}
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
              <div className="space-y-4">
                {fleetUtilization.map((vehicle, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{vehicle.vehicleType}</h3>
                      <Badge className={`${getUtilizationColor(vehicle.utilization)} bg-opacity-20`}>
                        {vehicle.utilization}% إشغال
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">عدد السيارات</p>
                        <p className="font-bold">{vehicle.count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">الإيرادات</p>
                        <p className="font-bold">{vehicle.revenue.toLocaleString()} ر.س</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">متوسط الإيراد/سيارة</p>
                        <p className="font-bold">{Math.round(vehicle.revenue / vehicle.count).toLocaleString()} ر.س</p>
                      </div>
                    </div>
                  </div>
                ))}
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
                <div className="space-y-4">
                  {customerSegments.map((segment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{segment.segment}</span>
                        <span className="font-bold">{segment.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className="bg-primary h-3 rounded-full" 
                          style={{ width: `${segment.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{segment.count} عميل</span>
                        <span>{segment.revenue.toLocaleString()} ر.س</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>إحصائيات العملاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-primary">191</p>
                      <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-500">15</p>
                      <p className="text-sm text-muted-foreground">عملاء جدد هذا الشهر</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-500">4.7</p>
                      <p className="text-sm text-muted-foreground">متوسط التقييم</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-orange-500">2.3</p>
                      <p className="text-sm text-muted-foreground">متوسط العقود/عميل</p>
                    </div>
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
              <div className="space-y-4">
                {topPerformingVehicles.map((vehicle, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{vehicle.vehicle}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>تقييم: {vehicle.rating}/5</span>
                          <span>•</span>
                          <span className={getUtilizationColor(vehicle.utilization)}>
                            إشغال: {vehicle.utilization}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{vehicle.revenue.toLocaleString()} ر.س</p>
                      <p className="text-sm text-muted-foreground">هذا الشهر</p>
                    </div>
                  </div>
                ))}
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">نمو الإيرادات</p>
                      <p className="text-sm text-green-600">اتجاه تصاعدي مستمر</p>
                    </div>
                    <div className="text-green-700 font-bold">+15.2%</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-800">زيادة العملاء</p>
                      <p className="text-sm text-blue-600">نمو مطرد في قاعدة العملاء</p>
                    </div>
                    <div className="text-blue-700 font-bold">+8.5%</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div>
                      <p className="font-medium text-orange-800">تحسن الكفاءة</p>
                      <p className="text-sm text-orange-600">زيادة معدل إشغال الأسطول</p>
                    </div>
                    <div className="text-orange-700 font-bold">+5.3%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>توقعات الأداء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">توقعات الشهر القادم</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>الإيرادات المتوقعة:</span>
                        <span className="font-bold">72,000 ر.س</span>
                      </div>
                      <div className="flex justify-between">
                        <span>العقود المتوقعة:</span>
                        <span className="font-bold">45 عقد</span>
                      </div>
                      <div className="flex justify-between">
                        <span>معدل الإشغال:</span>
                        <span className="font-bold">82%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-2">تحذيرات وتوصيات</h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• زيادة أسعار السيارات الفاخرة لتحسين الربحية</li>
                      <li>• صيانة دورية للسيارات منخفضة التقييم</li>
                      <li>• توسيع الأسطول في فئة SUV لارتفاع الطلب</li>
                    </ul>
                  </div>
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