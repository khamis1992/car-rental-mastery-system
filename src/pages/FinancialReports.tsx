import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  FileText, 
  Download,
  Calendar as CalendarIcon,
  Calculator,
  Eye,
  RefreshCw,
  Filter,
  Settings
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FinancialReport {
  id: string;
  report_name: string;
  report_name_en: string;
  report_type: string;
  report_structure: any;
  legal_compliance: boolean;
  ministry_format: boolean;
  last_generated_at: string | null;
  is_active: boolean;
}

interface ReportData {
  id: string;
  report_period_start: string;
  report_period_end: string;
  fiscal_year: number;
  report_data: any;
  summary_data: any;
  status: string;
  generated_at: string;
}

interface KPI {
  id: string;
  kpi_code: string;
  kpi_name: string;
  kpi_name_en: string;
  kpi_category: string;
  current_value: number | null;
  target_value: number | null;
  previous_value: number | null;
  unit_of_measure: string;
  trend_direction: string | null;
}

const FinancialReports: React.FC = () => {
  const { toast } = useToast();
  const [selectedPeriodStart, setSelectedPeriodStart] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [selectedPeriodEnd, setSelectedPeriodEnd] = useState<Date>(endOfMonth(subMonths(new Date(), 1)));
  const [selectedReportType, setSelectedReportType] = useState<string>('balance_sheet');
  const [isGenerating, setIsGenerating] = useState(false);

  // جلب قوالب التقارير المتاحة
  const { data: reportTemplates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['financial-report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advanced_financial_reports')
        .select('*')
        .eq('is_active', true)
        .order('report_name');
      
      if (error) throw error;
      return data as FinancialReport[];
    }
  });

  // جلب بيانات التقارير المُولدة مؤخراً
  const { data: recentReports, refetch: refetchReports } = useQuery({
    queryKey: ['recent-financial-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_report_data')
        .select(`
          *,
          report_template:advanced_financial_reports(report_name, report_type)
        `)
        .order('generated_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as ReportData[];
    }
  });

  // جلب المؤشرات المالية الرئيسية
  const { data: kpis } = useQuery({
    queryKey: ['financial-kpis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advanced_kpis')
        .select('*')
        .eq('is_active', true)
        .order('kpi_category', { ascending: true });
      
      if (error) throw error;
      return data as KPI[];
    }
  });

  // توليد تقرير جديد
  const generateReport = async () => {
    setIsGenerating(true);
    try {
      let reportData;
      const fiscalYear = selectedPeriodStart.getFullYear();

      if (selectedReportType === 'balance_sheet') {
        const { data, error } = await supabase.rpc('generate_balance_sheet_report', {
          tenant_id_param: '00000000-0000-0000-0000-000000000000',
          report_date: format(selectedPeriodEnd, 'yyyy-MM-dd')
        });
        if (error) throw error;
        reportData = data;
      } else if (selectedReportType === 'income_statement') {
        const { data, error } = await supabase.rpc('generate_income_statement', {
          tenant_id_param: '00000000-0000-0000-0000-000000000000',
          period_start: format(selectedPeriodStart, 'yyyy-MM-dd'),
          period_end: format(selectedPeriodEnd, 'yyyy-MM-dd')
        });
        if (error) throw error;
        reportData = data;
      }

      // حفظ التقرير في قاعدة البيانات
      const { error: saveError } = await supabase
        .from('financial_report_data')
        .insert({
          tenant_id: '00000000-0000-0000-0000-000000000000',
          report_template_id: reportTemplates?.find(t => t.report_type === selectedReportType)?.id,
          report_period_start: format(selectedPeriodStart, 'yyyy-MM-dd'),
          report_period_end: format(selectedPeriodEnd, 'yyyy-MM-dd'),
          fiscal_year: fiscalYear,
          report_data: reportData,
          summary_data: reportData?.totals || {},
          status: 'finalized'
        });

      if (saveError) throw saveError;

      toast({
        title: "تم توليد التقرير بنجاح",
        description: "تم إنشاء التقرير المالي وحفظه في النظام",
      });

      refetchReports();
    } catch (error: any) {
      toast({
        title: "خطأ في توليد التقرير",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // حساب المؤشرات المالية
  const calculateKPI = async (kpiCode: string) => {
    try {
      const { data, error } = await supabase.rpc('calculate_advanced_kpi', {
        kpi_code_param: kpiCode,
        tenant_id_param: '00000000-0000-0000-0000-000000000000'
      });
      
      if (error) throw error;
      
      toast({
        title: "تم حساب المؤشر بنجاح",
        description: `تم تحديث قيمة المؤشر: ${data}`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في حساب المؤشر",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "مسودة", variant: "secondary" as const },
      finalized: { label: "نهائي", variant: "default" as const },
      approved: { label: "معتمد", variant: "success" as const },
      archived: { label: "مؤرشف", variant: "outline" as const }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  };

  const getTrendIcon = (direction: string | null) => {
    if (direction === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (direction === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  const formatValue = (value: number | null, unit: string) => {
    if (value === null) return '-';
    
    if (unit === 'percentage') {
      return `${value.toFixed(2)}%`;
    } else if (unit === 'currency') {
      return `${value.toLocaleString()} د.ك`;
    } else if (unit === 'ratio') {
      return value.toFixed(2);
    }
    
    return value.toLocaleString();
  };

  return (
    <div className="flex-1 space-y-6 p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight rtl-title">التقارير المالية المتقدمة</h2>
          <p className="text-muted-foreground">
            إنشاء وإدارة التقارير المالية والمؤشرات وفقاً للمعايير المحاسبية الكويتية
          </p>
        </div>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports" className="rtl-flex">
            <FileText className="h-4 w-4" />
            التقارير المالية
          </TabsTrigger>
          <TabsTrigger value="kpis" className="rtl-flex">
            <BarChart3 className="h-4 w-4" />
            المؤشرات المالية
          </TabsTrigger>
          <TabsTrigger value="analysis" className="rtl-flex">
            <PieChart className="h-4 w-4" />
            التحليل المالي
          </TabsTrigger>
          <TabsTrigger value="settings" className="rtl-flex">
            <Settings className="h-4 w-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* قسم توليد التقارير الجديدة */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-flex">
                <FileText className="h-5 w-5" />
                توليد تقرير مالي جديد
              </CardTitle>
              <CardDescription>
                اختر نوع التقرير والفترة المالية لتوليد تقرير شامل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium rtl-label">نوع التقرير</label>
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balance_sheet">تقرير المركز المالي</SelectItem>
                      <SelectItem value="income_statement">قائمة الدخل</SelectItem>
                      <SelectItem value="cash_flow">قائمة التدفقات النقدية</SelectItem>
                      <SelectItem value="trial_balance">ميزان المراجعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium rtl-label">من تاريخ</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedPeriodStart && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {selectedPeriodStart ? (
                          format(selectedPeriodStart, "dd/MM/yyyy", { locale: ar })
                        ) : (
                          <span>اختر التاريخ</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedPeriodStart}
                        onSelect={(date) => date && setSelectedPeriodStart(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium rtl-label">إلى تاريخ</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedPeriodEnd && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {selectedPeriodEnd ? (
                          format(selectedPeriodEnd, "dd/MM/yyyy", { locale: ar })
                        ) : (
                          <span>اختر التاريخ</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedPeriodEnd}
                        onSelect={(date) => date && setSelectedPeriodEnd(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="rtl-flex"
                >
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {isGenerating ? 'جاري التوليد...' : 'توليد التقرير'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* قائمة التقارير المُولدة مؤخراً */}
          <Card>
            <CardHeader>
              <CardTitle>التقارير المُولدة مؤخراً</CardTitle>
              <CardDescription>
                آخر التقارير المالية التي تم إنشاؤها في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع التقرير</TableHead>
                    <TableHead>الفترة المالية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ التوليد</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports?.map((report) => {
                    const statusConfig = getStatusBadge(report.status);
                    return (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {(report as any).report_template?.report_name || 'تقرير مالي'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.report_period_start), "dd/MM/yyyy", { locale: ar })} - {' '}
                          {format(new Date(report.report_period_end), "dd/MM/yyyy", { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.generated_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          {/* المؤشرات المالية الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis?.slice(0, 8).map((kpi) => (
              <Card key={kpi.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {kpi.kpi_name}
                  </CardTitle>
                  {getTrendIcon(kpi.trend_direction)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatValue(kpi.current_value, kpi.unit_of_measure)}
                  </div>
                  {kpi.target_value && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>الهدف: {formatValue(kpi.target_value, kpi.unit_of_measure)}</span>
                        <span>
                          {kpi.current_value && kpi.target_value ? 
                            `${((kpi.current_value / kpi.target_value) * 100).toFixed(0)}%` 
                            : '0%'
                          }
                        </span>
                      </div>
                      <Progress 
                        value={kpi.current_value && kpi.target_value ? 
                          Math.min((kpi.current_value / kpi.target_value) * 100, 100) 
                          : 0
                        } 
                        className="h-2"
                      />
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 w-full rtl-flex"
                    onClick={() => calculateKPI(kpi.kpi_code)}
                  >
                    <Calculator className="h-4 w-4" />
                    إعادة حساب
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* جدول تفصيلي للمؤشرات */}
          {kpis && kpis.length > 8 && (
            <Card>
              <CardHeader>
                <CardTitle>جميع المؤشرات المالية</CardTitle>
                <CardDescription>
                  عرض تفصيلي لجميع المؤشرات المالية والنسب المحاسبية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المؤشر</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>القيمة الحالية</TableHead>
                      <TableHead>الهدف</TableHead>
                      <TableHead>الاتجاه</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis.slice(8).map((kpi) => (
                      <TableRow key={kpi.id}>
                        <TableCell className="font-medium">
                          {kpi.kpi_name}
                          <div className="text-xs text-muted-foreground">
                            {kpi.kpi_name_en}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {kpi.kpi_category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatValue(kpi.current_value, kpi.unit_of_measure)}
                        </TableCell>
                        <TableCell>
                          {formatValue(kpi.target_value, kpi.unit_of_measure)}
                        </TableCell>
                        <TableCell>
                          {getTrendIcon(kpi.trend_direction)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => calculateKPI(kpi.kpi_code)}
                          >
                            <Calculator className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              سيتم إضافة أدوات التحليل المالي المتقدم والرسوم البيانية التفاعلية في التحديث القادم.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              سيتم إضافة إعدادات التقارير المالية والمؤشرات المخصصة في التحديث القادم.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;