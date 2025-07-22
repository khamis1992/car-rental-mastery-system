import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Car, 
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  costCenterName: string;
  costCenterType: 'branch' | 'vehicle_type' | 'contract_type';
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  vehicleUtilization: number;
  contractCount: number;
  activeVehicles: number;
  trend: 'up' | 'down' | 'stable';
}

const mockPerformanceData: PerformanceMetric[] = [
  {
    id: '1',
    costCenterName: 'فرع الكويت الرئيسي',
    costCenterType: 'branch',
    totalRevenue: 25400,
    totalCosts: 18200,
    grossProfit: 7200,
    profitMargin: 28.3,
    vehicleUtilization: 85.5,
    contractCount: 45,
    activeVehicles: 25,
    trend: 'up'
  },
  {
    id: '2',
    costCenterName: 'سيارات فاخرة',
    costCenterType: 'vehicle_type',
    totalRevenue: 18900,
    totalCosts: 12100,
    grossProfit: 6800,
    profitMargin: 36.0,
    vehicleUtilization: 78.2,
    contractCount: 28,
    activeVehicles: 15,
    trend: 'up'
  },
  {
    id: '3',
    costCenterName: 'عقود شهرية',
    costCenterType: 'contract_type',
    totalRevenue: 32100,
    totalCosts: 24500,
    grossProfit: 7600,
    profitMargin: 23.7,
    vehicleUtilization: 92.1,
    contractCount: 38,
    activeVehicles: 30,
    trend: 'stable'
  },
  {
    id: '4',
    costCenterName: 'فرع الأحمدي',
    costCenterType: 'branch',
    totalRevenue: 15600,
    totalCosts: 13200,
    grossProfit: 2400,
    profitMargin: 15.4,
    vehicleUtilization: 68.3,
    contractCount: 22,
    activeVehicles: 18,
    trend: 'down'
  }
];

export const PerformanceAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [selectedType, setSelectedType] = useState('all');
  const [performanceData] = useState<PerformanceMetric[]>(mockPerformanceData);

  const filteredData = performanceData.filter(item => 
    selectedType === 'all' || item.costCenterType === selectedType
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      branch: 'فرع',
      vehicle_type: 'نوع مركبة',
      contract_type: 'نوع عقد'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} د.ك`;
  };

  // Calculate summary metrics
  const totalRevenue = filteredData.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalCosts = filteredData.reduce((sum, item) => sum + item.totalCosts, 0);
  const totalProfit = totalRevenue - totalCosts;
  const averageProfitMargin = filteredData.reduce((sum, item) => sum + item.profitMargin, 0) / filteredData.length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-row-reverse items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">تحليل الأداء</h2>
          <p className="text-muted-foreground">
            مراجعة أداء مراكز التكلفة والربحية
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            تصدير التقرير
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="space-y-2">
              <Label>الفترة الزمنية</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">هذا الشهر</SelectItem>
                  <SelectItem value="last_month">الشهر الماضي</SelectItem>
                  <SelectItem value="this_quarter">هذا الربع</SelectItem>
                  <SelectItem value="this_year">هذا العام</SelectItem>
                  <SelectItem value="custom">فترة مخصصة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>نوع مركز التكلفة</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="branch">الفروع</SelectItem>
                  <SelectItem value="vehicle_type">أنواع المركبات</SelectItem>
                  <SelectItem value="contract_type">أنواع العقود</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي التكاليف</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCosts)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">صافي الربح</p>
                <p className="text-2xl font-bold">{formatCurrency(totalProfit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوسط هامش الربح</p>
                <p className="text-2xl font-bold">{averageProfitMargin.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            أداء مراكز التكلفة ({filteredData.length})
          </CardTitle>
          <CardDescription>
            تفاصيل الأداء المالي والتشغيلي لكل مركز تكلفة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredData.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">{item.costCenterName}</h3>
                      <Badge variant="outline">{getTypeLabel(item.costCenterType)}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(item.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(item.trend)}`}>
                      {item.profitMargin.toFixed(1)}% هامش الربح
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">الإيرادات</p>
                    <p className="font-semibold text-green-600">{formatCurrency(item.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">التكاليف</p>
                    <p className="font-semibold text-red-600">{formatCurrency(item.totalCosts)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">صافي الربح</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(item.grossProfit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">معدل الاستغلال</p>
                    <div className="flex items-center gap-2">
                      <Progress value={item.vehicleUtilization} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{item.vehicleUtilization.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      {item.activeVehicles} مركبة نشطة
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {item.contractCount} عقد
                    </span>
                  </div>
                  <Button size="sm" variant="outline">
                    عرض التفاصيل
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};