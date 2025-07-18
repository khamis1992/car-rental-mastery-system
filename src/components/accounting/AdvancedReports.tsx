import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { BarChart, LineChart, PieChart, TrendingUp, DollarSign, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DateRange } from "react-day-picker";

interface ReportFilter {
  dateRange: DateRange | undefined;
  reportType: string;
  groupBy: string;
  currency: string;
}

export const AdvancedReports = () => {
  const [filters, setFilters] = useState<ReportFilter>({
    dateRange: undefined,
    reportType: "revenue",
    groupBy: "monthly",
    currency: "KWD"
  });

  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: "revenue", label: "تقرير الإيرادات", icon: DollarSign },
    { value: "expenses", label: "تقرير المصروفات", icon: Calculator },
    { value: "profit_loss", label: "الأرباح والخسائر", icon: TrendingUp },
    { value: "vehicle_performance", label: "أداء المركبات", icon: BarChart },
    { value: "cost_centers", label: "مراكز التكلفة", icon: PieChart },
    { value: "customer_aging", label: "أعمار الذمم المدينة", icon: LineChart }
  ];

  const groupByOptions = [
    { value: "daily", label: "يومي" },
    { value: "weekly", label: "أسبوعي" },
    { value: "monthly", label: "شهري" },
    { value: "quarterly", label: "ربع سنوي" },
    { value: "yearly", label: "سنوي" }
  ];

  const currencies = [
    { value: "KWD", label: "دينار كويتي" },
    { value: "USD", label: "دولار أمريكي" },
    { value: "EUR", label: "يورو" },
    { value: "SAR", label: "ريال سعودي" }
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      // Simulate API call for report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would call your actual report generation API
      console.log('Generating report with filters:', filters);
      
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting report as ${format}`);
    // Implement export functionality
  };

  return (
    <div className="space-y-6">
      <Card className="rtl-card">
        <CardHeader>
          <CardTitle className="rtl-title">التقارير المحاسبية المتقدمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="rtl-label">نوع التقرير</label>
              <Select
                value={filters.reportType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="rtl-label">فترة التجميع</label>
              <Select
                value={filters.groupBy}
                onValueChange={(value) => setFilters(prev => ({ ...prev, groupBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groupByOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="rtl-label">العملة</label>
              <Select
                value={filters.currency}
                onValueChange={(value) => setFilters(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="rtl-label">نطاق التاريخ</label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={generateReport}
              disabled={loading}
              className="rtl-button"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء التقرير"}
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">تصدير:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('pdf')}
                className="rtl-button"
              >
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('excel')}
                className="rtl-button"
              >
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('csv')}
                className="rtl-button"
              >
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chart">الرسوم البيانية</TabsTrigger>
          <TabsTrigger value="table">البيانات الجدولية</TabsTrigger>
          <TabsTrigger value="summary">الملخص التنفيذي</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4">
          <Card className="rtl-card">
            <CardHeader>
              <CardTitle className="rtl-title">الرسوم البيانية التفاعلية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
                <div className="text-center">
                  <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">سيتم عرض الرسوم البيانية هنا</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    اختر المرشحات وانقر على "إنشاء التقرير"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card className="rtl-card">
            <CardHeader>
              <CardTitle className="rtl-title">البيانات التفصيلية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
                <div className="text-center">
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">سيتم عرض الجداول التفصيلية هنا</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    البيانات المالية مع إمكانية الفرز والتصفية
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rtl-card">
              <CardHeader className="pb-2">
                <CardTitle className="rtl-title text-sm">إجمالي الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  <Badge className="bg-green-500/10 text-green-600">+12%</Badge>
                  من الشهر الماضي
                </p>
              </CardContent>
            </Card>

            <Card className="rtl-card">
              <CardHeader className="pb-2">
                <CardTitle className="rtl-title text-sm">إجمالي المصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  <Badge className="bg-red-500/10 text-red-600">+8%</Badge>
                  من الشهر الماضي
                </p>
              </CardContent>
            </Card>

            <Card className="rtl-card">
              <CardHeader className="pb-2">
                <CardTitle className="rtl-title text-sm">صافي الربح</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  <Badge className="bg-green-500/10 text-green-600">+15%</Badge>
                  من الشهر الماضي
                </p>
              </CardContent>
            </Card>

            <Card className="rtl-card">
              <CardHeader className="pb-2">
                <CardTitle className="rtl-title text-sm">هامش الربح</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--%</div>
                <p className="text-xs text-muted-foreground">
                  <Badge className="bg-green-500/10 text-green-600">+2.5%</Badge>
                  من الشهر الماضي
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};