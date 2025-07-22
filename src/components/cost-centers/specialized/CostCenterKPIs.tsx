import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Percent,
  BarChart3,
  Calendar,
  Filter
} from 'lucide-react';

interface KPIData {
  id: string;
  costCenterName: string;
  costCenterType: string;
  kpiName: string;
  kpiType: 'revenue' | 'cost' | 'profitability' | 'utilization' | 'efficiency';
  currentValue: number;
  targetValue: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastUpdated: string;
}

const mockKPIData: KPIData[] = [
  {
    id: '1',
    costCenterName: 'فرع الكويت الرئيسي',
    costCenterType: 'branch',
    kpiName: 'الإيراد الشهري',
    kpiType: 'revenue',
    currentValue: 25400,
    targetValue: 24000,
    previousValue: 23500,
    unit: 'د.ك',
    trend: 'up',
    status: 'excellent',
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    costCenterName: 'سيارات فاخرة',
    costCenterType: 'vehicle_type',
    kpiName: 'معدل الاستغلال',
    kpiType: 'utilization',
    currentValue: 78.2,
    targetValue: 80.0,
    previousValue: 82.1,
    unit: '%',
    trend: 'down',
    status: 'warning',
    lastUpdated: '2024-01-15'
  },
  {
    id: '3',
    costCenterName: 'عقود شهرية',
    costCenterType: 'contract_type',
    kpiName: 'هامش الربح',
    kpiType: 'profitability',
    currentValue: 23.7,
    targetValue: 25.0,
    previousValue: 22.9,
    unit: '%',
    trend: 'up',
    status: 'good',
    lastUpdated: '2024-01-15'
  },
  {
    id: '4',
    costCenterName: 'فرع الأحمدي',
    costCenterType: 'branch',
    kpiName: 'تكلفة الصيانة',
    kpiType: 'cost',
    currentValue: 3200,
    targetValue: 2800,
    previousValue: 2950,
    unit: 'د.ك',
    trend: 'up',
    status: 'critical',
    lastUpdated: '2024-01-15'
  },
  {
    id: '5',
    costCenterName: 'سيارات صغيرة',
    costCenterType: 'vehicle_type',
    kpiName: 'معدل دوران الأسطول',
    kpiType: 'efficiency',
    currentValue: 1.4,
    targetValue: 1.2,
    previousValue: 1.3,
    unit: 'مرة/شهر',
    trend: 'up',
    status: 'excellent',
    lastUpdated: '2024-01-15'
  },
  {
    id: '6',
    costCenterName: 'عقود يومية',
    costCenterType: 'contract_type',
    kpiName: 'متوسط قيمة العقد',
    kpiType: 'revenue',
    currentValue: 450,
    targetValue: 500,
    previousValue: 420,
    unit: 'د.ك',
    trend: 'up',
    status: 'good',
    lastUpdated: '2024-01-15'
  }
];

export const CostCenterKPIs: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedKPIType, setSelectedKPIType] = useState('all');
  const [kpiData] = useState<KPIData[]>(mockKPIData);

  const filteredData = kpiData.filter(item => {
    const matchesType = selectedType === 'all' || item.costCenterType === selectedType;
    const matchesKPIType = selectedKPIType === 'all' || item.kpiType === selectedKPIType;
    return matchesType && matchesKPIType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good':
        return <Target className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

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

  const getKPITypeIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <DollarSign className="h-4 w-4" />;
      case 'cost':
        return <TrendingDown className="h-4 w-4" />;
      case 'profitability':
        return <Percent className="h-4 w-4" />;
      case 'utilization':
        return <BarChart3 className="h-4 w-4" />;
      case 'efficiency':
        return <Target className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const calculateVariance = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'د.ك') {
      return `${value.toLocaleString()} ${unit}`;
    }
    return `${value.toFixed(1)} ${unit}`;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      branch: 'فرع',
      vehicle_type: 'نوع مركبة',
      contract_type: 'نوع عقد'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getKPITypeLabel = (type: string) => {
    const labels = {
      revenue: 'الإيرادات',
      cost: 'التكاليف',
      profitability: 'الربحية',
      utilization: 'الاستغلال',
      efficiency: 'الكفاءة'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-row-reverse items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">مؤشرات الأداء الرئيسية</h2>
          <p className="text-muted-foreground">
            مراقبة وتحليل مؤشرات الأداء لمراكز التكلفة
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          تعديل الأهداف
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">الفلاتر:</span>
            </div>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">هذا الشهر</SelectItem>
                <SelectItem value="last_month">الشهر الماضي</SelectItem>
                <SelectItem value="this_quarter">هذا الربع</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="branch">الفروع</SelectItem>
                <SelectItem value="vehicle_type">أنواع المركبات</SelectItem>
                <SelectItem value="contract_type">أنواع العقود</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedKPIType} onValueChange={setSelectedKPIType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المؤشرات</SelectItem>
                <SelectItem value="revenue">الإيرادات</SelectItem>
                <SelectItem value="cost">التكاليف</SelectItem>
                <SelectItem value="profitability">الربحية</SelectItem>
                <SelectItem value="utilization">الاستغلال</SelectItem>
                <SelectItem value="efficiency">الكفاءة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((kpi) => {
          const progress = calculateProgress(kpi.currentValue, kpi.targetValue);
          const variance = calculateVariance(kpi.currentValue, kpi.previousValue);
          
          return (
            <Card key={kpi.id} className={`border-2 ${getStatusColor(kpi.status)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getKPITypeIcon(kpi.kpiType)}
                    <CardTitle className="text-lg">{kpi.kpiName}</CardTitle>
                  </div>
                  {getStatusIcon(kpi.status)}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(kpi.costCenterType)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getKPITypeLabel(kpi.kpiType)}
                  </Badge>
                </div>
                <CardDescription className="text-sm font-medium">
                  {kpi.costCenterName}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Current Value */}
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {formatValue(kpi.currentValue, kpi.unit)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    الهدف: {formatValue(kpi.targetValue, kpi.unit)}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>التقدم نحو الهدف</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Trend and Variance */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(kpi.trend)}
                    <span className="text-sm">
                      {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(kpi.lastUpdated).toLocaleDateString('ar')}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص مؤشرات الأداء</CardTitle>
          <CardDescription>
            نظرة عامة على حالة جميع مؤشرات الأداء
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { status: 'excellent', count: filteredData.filter(k => k.status === 'excellent').length, label: 'ممتاز', color: 'text-green-600' },
              { status: 'good', count: filteredData.filter(k => k.status === 'good').length, label: 'جيد', color: 'text-blue-600' },
              { status: 'warning', count: filteredData.filter(k => k.status === 'warning').length, label: 'تحذير', color: 'text-yellow-600' },
              { status: 'critical', count: filteredData.filter(k => k.status === 'critical').length, label: 'حرج', color: 'text-red-600' }
            ].map((stat) => (
              <div key={stat.status} className="text-center p-4 border rounded-lg">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};