import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, 
  Calendar, RefreshCw, Download, ArrowUpCircle, ArrowDownCircle,
  PieChart, BarChart3, Activity, Target, Gauge
} from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CashFlowData {
  current_cash: number;
  projected_inflows: number;
  projected_outflows: number;
  net_cash_flow: number;
  cash_position: 'healthy' | 'warning' | 'critical';
  weekly_forecast: {
    week: string;
    inflows: number;
    outflows: number;
    net_flow: number;
    ending_balance: number;
  }[];
  payment_schedule: {
    id: string;
    type: 'inflow' | 'outflow';
    description: string;
    amount: number;
    due_date: string;
    status: 'pending' | 'confirmed' | 'overdue';
    category: string;
  }[];
  liquidity_ratios: {
    current_ratio: number;
    quick_ratio: number;
    cash_ratio: number;
    operating_cash_flow_ratio: number;
  };
}

export const CashFlowManagement = () => {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('4_weeks');
  const [selectedView, setSelectedView] = useState('summary');
  const { toast } = useToast();

  useEffect(() => {
    loadCashFlowData();
  }, [selectedPeriod]);

  const loadCashFlowData = async () => {
    try {
      setLoading(true);
      // محاكاة بيانات التدفق النقدي
      const mockData: CashFlowData = {
        current_cash: 85000,
        projected_inflows: 120000,
        projected_outflows: 95000,
        net_cash_flow: 25000,
        cash_position: 'healthy',
        weekly_forecast: [
          {
            week: 'الأسبوع 1',
            inflows: 35000,
            outflows: 28000,
            net_flow: 7000,
            ending_balance: 92000
          },
          {
            week: 'الأسبوع 2',
            inflows: 28000,
            outflows: 22000,
            net_flow: 6000,
            ending_balance: 98000
          },
          {
            week: 'الأسبوع 3',
            inflows: 32000,
            outflows: 25000,
            net_flow: 7000,
            ending_balance: 105000
          },
          {
            week: 'الأسبوع 4',
            inflows: 25000,
            outflows: 20000,
            net_flow: 5000,
            ending_balance: 110000
          }
        ],
        payment_schedule: [
          {
            id: '1',
            type: 'inflow',
            description: 'دفعة من شركة النقل الكويتية',
            amount: 15000,
            due_date: '2024-01-20',
            status: 'confirmed',
            category: 'rental_income'
          },
          {
            id: '2',
            type: 'outflow',
            description: 'دفعة تأمين السيارات',
            amount: 8000,
            due_date: '2024-01-22',
            status: 'pending',
            category: 'insurance'
          },
          {
            id: '3',
            type: 'inflow',
            description: 'تحصيل ديون متأخرة',
            amount: 12000,
            due_date: '2024-01-18',
            status: 'overdue',
            category: 'accounts_receivable'
          },
          {
            id: '4',
            type: 'outflow',
            description: 'رواتب الموظفين',
            amount: 25000,
            due_date: '2024-01-25',
            status: 'pending',
            category: 'salaries'
          },
          {
            id: '5',
            type: 'inflow',
            description: 'إيراد تأجير شهري',
            amount: 45000,
            due_date: '2024-01-30',
            status: 'confirmed',
            category: 'rental_income'
          }
        ],
        liquidity_ratios: {
          current_ratio: 2.5,
          quick_ratio: 1.8,
          cash_ratio: 0.9,
          operating_cash_flow_ratio: 1.2
        }
      };

      setCashFlowData(mockData);
    } catch (error) {
      console.error('Error loading cash flow data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات التدفق النقدي",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCashPositionColor = (position: string) => {
    switch (position) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCashPositionText = (position: string) => {
    switch (position) {
      case 'healthy': return 'صحي';
      case 'warning': return 'تحذير';
      case 'critical': return 'حرج';
      default: return 'غير محدد';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'مؤكد';
      case 'pending': return 'معلق';
      case 'overdue': return 'متأخر';
      default: return 'غير محدد';
    }
  };

  const getRatioStatus = (ratio: number, type: string) => {
    switch (type) {
      case 'current_ratio':
        if (ratio >= 2) return 'excellent';
        if (ratio >= 1.5) return 'good';
        if (ratio >= 1) return 'warning';
        return 'poor';
      case 'quick_ratio':
        if (ratio >= 1.5) return 'excellent';
        if (ratio >= 1) return 'good';
        if (ratio >= 0.8) return 'warning';
        return 'poor';
      case 'cash_ratio':
        if (ratio >= 0.5) return 'excellent';
        if (ratio >= 0.3) return 'good';
        if (ratio >= 0.2) return 'warning';
        return 'poor';
      default:
        if (ratio >= 1.2) return 'excellent';
        if (ratio >= 1) return 'good';
        if (ratio >= 0.8) return 'warning';
        return 'poor';
    }
  };

  const getRatioColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
            <p>جاري تحميل بيانات التدفق النقدي...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cashFlowData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">لا توجد بيانات متاحة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            إدارة التدفق النقدي
          </h2>
          <p className="text-muted-foreground">مراقبة وتحليل التدفقات النقدية الداخلة والخارجة</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4_weeks">4 أسابيع</SelectItem>
              <SelectItem value="8_weeks">8 أسابيع</SelectItem>
              <SelectItem value="12_weeks">12 أسبوع</SelectItem>
              <SelectItem value="6_months">6 أشهر</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadCashFlowData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الرصيد النقدي الحالي</p>
                <p className="text-2xl font-bold">{formatCurrencyKWD(cashFlowData.current_cash)}</p>
                <Badge className={cn("mt-1 border", getCashPositionColor(cashFlowData.cash_position))}>
                  {getCashPositionText(cashFlowData.cash_position)}
                </Badge>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">التدفقات الداخلة المتوقعة</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrencyKWD(cashFlowData.projected_inflows)}
                </p>
              </div>
              <ArrowUpCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">التدفقات الخارجة المتوقعة</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrencyKWD(cashFlowData.projected_outflows)}
                </p>
              </div>
              <ArrowDownCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">صافي التدفق النقدي</p>
                <p className={cn("text-2xl font-bold", 
                  cashFlowData.net_cash_flow >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {cashFlowData.net_cash_flow >= 0 ? '+' : ''}{formatCurrencyKWD(cashFlowData.net_cash_flow)}
                </p>
              </div>
              {cashFlowData.net_cash_flow >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">ملخص</TabsTrigger>
          <TabsTrigger value="forecast">التوقعات</TabsTrigger>
          <TabsTrigger value="schedule">جدولة المدفوعات</TabsTrigger>
          <TabsTrigger value="ratios">نسب السيولة</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>التدفق النقدي الأسبوعي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cashFlowData.weekly_forecast.map((week, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{week.week}</p>
                        <p className="text-sm text-muted-foreground">
                          صافي التدفق: <span className={week.net_flow >= 0 ? "text-green-600" : "text-red-600"}>
                            {week.net_flow >= 0 ? '+' : ''}{formatCurrencyKWD(week.net_flow)}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">الرصيد النهائي</p>
                        <p className="font-bold">{formatCurrencyKWD(week.ending_balance)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحليل التدفقات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي التدفقات الداخلة</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrencyKWD(cashFlowData.projected_inflows)}
                      </p>
                    </div>
                    <ArrowUpCircle className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي التدفقات الخارجة</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrencyKWD(cashFlowData.projected_outflows)}
                      </p>
                    </div>
                    <ArrowDownCircle className="w-8 h-8 text-red-600" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">صافي التدفق النقدي</p>
                      <p className={cn("text-xl font-bold", 
                        cashFlowData.net_cash_flow >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {cashFlowData.net_cash_flow >= 0 ? '+' : ''}{formatCurrencyKWD(cashFlowData.net_cash_flow)}
                      </p>
                    </div>
                    {cashFlowData.net_cash_flow >= 0 ? (
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    ) : (
                      <TrendingDown className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>توقعات التدفق النقدي - {selectedPeriod}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cashFlowData.weekly_forecast.map((week, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 p-4 border rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">{week.week}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">داخلة</p>
                      <p className="font-medium text-green-600">{formatCurrencyKWD(week.inflows)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">خارجة</p>
                      <p className="font-medium text-red-600">{formatCurrencyKWD(week.outflows)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">صافي</p>
                      <p className={cn("font-medium", week.net_flow >= 0 ? "text-green-600" : "text-red-600")}>
                        {week.net_flow >= 0 ? '+' : ''}{formatCurrencyKWD(week.net_flow)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الرصيد</p>
                      <p className="font-bold">{formatCurrencyKWD(week.ending_balance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>جدولة المدفوعات والمقبوضات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cashFlowData.payment_schedule.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {payment.type === 'inflow' ? (
                        <ArrowUpCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{payment.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.category} • {new Date(payment.due_date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-lg font-bold", 
                        payment.type === 'inflow' ? "text-green-600" : "text-red-600"
                      )}>
                        {payment.type === 'inflow' ? '+' : '-'}{formatCurrencyKWD(payment.amount)}
                      </p>
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusText(payment.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>نسب السيولة والأداء النقدي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">نسبة السيولة الجارية</p>
                      <p className={cn("text-lg font-bold", 
                        getRatioColor(getRatioStatus(cashFlowData.liquidity_ratios.current_ratio, 'current_ratio'))
                      )}>
                        {cashFlowData.liquidity_ratios.current_ratio.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">الأصول المتداولة / الخصوم المتداولة</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">نسبة السيولة السريعة</p>
                      <p className={cn("text-lg font-bold", 
                        getRatioColor(getRatioStatus(cashFlowData.liquidity_ratios.quick_ratio, 'quick_ratio'))
                      )}>
                        {cashFlowData.liquidity_ratios.quick_ratio.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">(الأصول المتداولة - المخزون) / الخصوم المتداولة</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">نسبة النقدية</p>
                      <p className={cn("text-lg font-bold", 
                        getRatioColor(getRatioStatus(cashFlowData.liquidity_ratios.cash_ratio, 'cash_ratio'))
                      )}>
                        {cashFlowData.liquidity_ratios.cash_ratio.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">النقدية وما في حكمها / الخصوم المتداولة</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">نسبة التدفق النقدي التشغيلي</p>
                      <p className={cn("text-lg font-bold", 
                        getRatioColor(getRatioStatus(cashFlowData.liquidity_ratios.operating_cash_flow_ratio, 'operating_cash_flow_ratio'))
                      )}>
                        {cashFlowData.liquidity_ratios.operating_cash_flow_ratio.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">التدفق النقدي التشغيلي / الخصوم المتداولة</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};