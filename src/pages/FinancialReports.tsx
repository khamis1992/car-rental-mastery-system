
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import { 
  FileText, 
  TrendingUp, 
  Download, 
  Calendar,
  BarChart3,
  PieChart,
  Target,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface FinancialReport {
  id: string;
  report_name: string;
  report_type: string;
  created_at: string;
  status: string;
}

interface KPI {
  id: string;
  kpi_name: string;
  kpi_category: string;
  current_value: number;
  target_value: number;
  unit_of_measure: string;
  trend_direction: 'up' | 'down' | 'stable';
}

export default function FinancialReports() {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<Date>(new Date());
  const [reportType, setReportType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // تحميل التقارير المالية (استخدام جدول موجود)
      const { data: reportsData, error: reportsError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_name, account_type, created_at, is_active')
        .limit(10);

      if (reportsError) throw reportsError;

      // تحويل البيانات لتناسب واجهة التقارير
      const mockReports: FinancialReport[] = (reportsData || []).map(account => ({
        id: account.id,
        report_name: `تقرير ${account.account_name}`,
        report_type: account.account_type,
        created_at: account.created_at,
        status: account.is_active ? 'active' : 'inactive'
      }));

      setReports(mockReports);

      // تحميل المؤشرات المالية (بيانات وهمية)
      const mockKPIs: KPI[] = [
        {
          id: '1',
          kpi_name: 'الإيرادات الشهرية',
          kpi_category: 'profitability',
          current_value: 125000,
          target_value: 150000,
          unit_of_measure: 'KWD',
          trend_direction: 'up'
        },
        {
          id: '2',
          kpi_name: 'نسبة الربحية',
          kpi_category: 'profitability',
          current_value: 15.5,
          target_value: 20,
          unit_of_measure: 'percentage',
          trend_direction: 'stable'
        },
        {
          id: '3',
          kpi_name: 'نسبة السيولة',
          kpi_category: 'liquidity',
          current_value: 2.3,
          target_value: 2.0,
          unit_of_measure: 'ratio',
          trend_direction: 'up'
        }
      ];

      setKpis(mockKPIs);

    } catch (error) {
      console.error('Error loading financial reports data:', error);
      toast.error('حدث خطأ في تحميل بيانات التقارير المالية');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: string) => {
    try {
      toast.success(`جاري إنشاء ${getReportTypeLabel(type)}...`);
      // هنا يمكن إضافة منطق إنشاء التقرير الفعلي
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('حدث خطأ في إنشاء التقرير');
    }
  };

  const exportReport = async (reportId: string, format: 'pdf' | 'excel') => {
    try {
      toast.success(`جاري تصدير التقرير بصيغة ${format.toUpperCase()}...`);
      // هنا يمكن إضافة منطق التصدير الفعلي
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('حدث خطأ في تصدير التقرير');
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'balance_sheet': return 'قائمة المركز المالي';
      case 'income_statement': return 'قائمة الدخل';
      case 'cash_flow': return 'قائمة التدفقات النقدية';
      case 'trial_balance': return 'ميزان المراجعة';
      default: return 'تقرير مالي';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل التقارير المالية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold rtl-title">التقارير المالية المتقدمة</h1>
        <p className="text-muted-foreground mt-2">
          إنشاء وإدارة التقارير المالية والمؤشرات الأداء الرئيسية
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="نوع التقرير" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التقارير</SelectItem>
            <SelectItem value="balance_sheet">قائمة المركز المالي</SelectItem>
            <SelectItem value="income_statement">قائمة الدخل</SelectItem>
            <SelectItem value="cash_flow">قائمة التدفقات النقدية</SelectItem>
            <SelectItem value="trial_balance">ميزان المراجعة</SelectItem>
          </SelectContent>
        </Select>

        <DatePicker
          selected={selectedPeriod}
          onSelect={(date) => date && setSelectedPeriod(date)}
        />

        <Button onClick={() => generateReport(reportType)} className="rtl-flex">
          <FileText className="h-4 w-4 ml-1" />
          إنشاء تقرير جديد
        </Button>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="rtl-flex">
            <FileText className="h-4 w-4 ml-1" />
            التقارير المالية
          </TabsTrigger>
          <TabsTrigger value="kpis" className="rtl-flex">
            <BarChart3 className="h-4 w-4 ml-1" />
            المؤشرات المالية
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rtl-flex">
            <PieChart className="h-4 w-4 ml-1" />
            التحليلات المتقدمة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-6">
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg rtl-title">{report.report_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => exportReport(report.id, 'pdf')}
                      className="rtl-flex"
                    >
                      <Download className="h-4 w-4 ml-1" />
                      تصدير PDF
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => exportReport(report.id, 'excel')}
                      className="rtl-flex"
                    >
                      <Download className="h-4 w-4 ml-1" />
                      تصدير Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi) => (
              <Card key={kpi.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base rtl-title">{kpi.kpi_name}</CardTitle>
                    {getTrendIcon(kpi.trend_direction)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">القيمة الحالية:</span>
                      <span className="font-medium">
                        {kpi.current_value.toLocaleString()} {kpi.unit_of_measure === 'percentage' ? '%' : kpi.unit_of_measure}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">القيمة المستهدفة:</span>
                      <span className="font-medium">
                        {kpi.target_value.toLocaleString()} {kpi.unit_of_measure === 'percentage' ? '%' : kpi.unit_of_measure}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((kpi.current_value / kpi.target_value) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                التحليلات المتقدمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">قريباً</h3>
                <p className="text-muted-foreground">
                  التحليلات المتقدمة والرسوم البيانية التفاعلية ستكون متاحة قريباً
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
