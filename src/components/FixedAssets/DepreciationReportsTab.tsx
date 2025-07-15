import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Calculator, 
  Download, 
  TrendingDown, 
  BarChart3, 
  Calendar,
  FileText,
  PlayCircle,
  PauseCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DepreciationReport {
  asset_id: string;
  asset_name: string;
  asset_code: string;
  category: string;
  purchase_cost: number;
  accumulated_depreciation: number;
  book_value: number;
  assigned_employee: string;
  location_description: string;
  condition_status: string;
  last_maintenance: string;
  next_maintenance: string;
  age_years: number;
  depreciation_rate_percent: number;
}

export function DepreciationReportsTab() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [reportType, setReportType] = useState("summary");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch depreciation data
  const { data: depreciationData, isLoading: isLoadingDepreciation } = useQuery({
    queryKey: ['asset-depreciation-report', selectedYear, selectedCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('generate_asset_report', {
          report_date: `${selectedYear}-12-31`,
          report_tenant_id: null
        });
      
      if (error) throw error;
      
      // Filter by category if selected
      let filteredData = data;
      if (selectedCategory !== "all") {
        filteredData = data.filter((item: DepreciationReport) => 
          item.category === selectedCategory
        );
      }
      
      return filteredData as DepreciationReport[];
    }
  });

  // Fetch monthly depreciation summary
  const { data: monthlyDepreciation } = useQuery({
    queryKey: ['monthly-depreciation', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_depreciation')
        .select(`
          depreciation_date,
          depreciation_amount,
          asset:fixed_assets(asset_category)
        `)
        .gte('depreciation_date', `${selectedYear}-01-01`)
        .lte('depreciation_date', `${selectedYear}-12-31`)
        .order('depreciation_date');
      
      if (error) throw error;
      return data;
    }
  });

  // Run automatic depreciation calculation
  const runDepreciationMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .rpc('run_monthly_depreciation');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (processedCount) => {
      queryClient.invalidateQueries({ queryKey: ['asset-depreciation-report'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-depreciation'] });
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      toast({
        title: "تم تشغيل الإهلاك التلقائي",
        description: `تم معالجة ${processedCount} أصل بنجاح`
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تشغيل الإهلاك",
        description: "حدث خطأ أثناء تشغيل حساب الإهلاك التلقائي",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3
    }).format(amount);
  };

  const getConditionBadgeVariant = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'poor': return 'destructive';
      case 'needs_repair': return 'destructive';
      default: return 'outline';
    }
  };

  const getConditionLabel = (condition: string) => {
    const labels = {
      excellent: "ممتازة",
      good: "جيدة",
      fair: "مقبولة",
      poor: "ضعيفة",
      needs_repair: "تحتاج إصلاح"
    };
    return labels[condition as keyof typeof labels] || condition;
  };

  // Calculate summary metrics
  const totalAssets = depreciationData?.length || 0;
  const totalPurchaseCost = depreciationData?.reduce((sum, asset) => sum + asset.purchase_cost, 0) || 0;
  const totalAccumulatedDepreciation = depreciationData?.reduce((sum, asset) => sum + asset.accumulated_depreciation, 0) || 0;
  const totalBookValue = depreciationData?.reduce((sum, asset) => sum + asset.book_value, 0) || 0;
  const averageDepreciationRate = depreciationData?.length > 0 
    ? depreciationData.reduce((sum, asset) => sum + asset.depreciation_rate_percent, 0) / depreciationData.length 
    : 0;

  // Group by category for summary
  const categoryBreakdown = depreciationData?.reduce((acc, asset) => {
    if (!acc[asset.category]) {
      acc[asset.category] = {
        count: 0,
        totalCost: 0,
        totalDepreciation: 0,
        totalBookValue: 0
      };
    }
    acc[asset.category].count++;
    acc[asset.category].totalCost += asset.purchase_cost;
    acc[asset.category].totalDepreciation += asset.accumulated_depreciation;
    acc[asset.category].totalBookValue += asset.book_value;
    return acc;
  }, {} as Record<string, any>) || {};

  return (
    <div className="space-y-6" dir="rtl">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            تقارير الإهلاك والتحكم
          </CardTitle>
          <CardDescription className="text-right">
            إدارة حساب الإهلاك وإنشاء التقارير
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-right">السنة المالية</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = (new Date().getFullYear() - i).toString();
                    return (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-right">فئة الأصول</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  <SelectItem value="vehicles">المركبات</SelectItem>
                  <SelectItem value="buildings">المباني</SelectItem>
                  <SelectItem value="equipment">المعدات</SelectItem>
                  <SelectItem value="furniture">الأثاث</SelectItem>
                  <SelectItem value="computer_hardware">الأجهزة الحاسوبية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-right">نوع التقرير</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">ملخص</SelectItem>
                  <SelectItem value="detailed">تفصيلي</SelectItem>
                  <SelectItem value="category">حسب الفئة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-right">الإجراءات</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => runDepreciationMutation.mutate()}
                  disabled={runDepreciationMutation.isPending}
                  className="flex-1"
                >
                  <PlayCircle className="h-4 w-4 ml-1" />
                  {runDepreciationMutation.isPending ? "جاري..." : "تشغيل"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 ml-1" />
                  تصدير
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي الأصول</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{totalAssets}</div>
            <p className="text-xs text-muted-foreground text-right">
              أصل في النظام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">التكلفة الإجمالية</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{formatCurrency(totalPurchaseCost)}</div>
            <p className="text-xs text-muted-foreground text-right">
              قيمة الشراء الأصلية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">الإهلاك المتراكم</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{formatCurrency(totalAccumulatedDepreciation)}</div>
            <p className="text-xs text-muted-foreground text-right">
              {averageDepreciationRate.toFixed(1)}% متوسط الإهلاك
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">القيمة الدفترية</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{formatCurrency(totalBookValue)}</div>
            <p className="text-xs text-muted-foreground text-right">
              القيمة الحالية للأصول
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">تقرير الملخص</TabsTrigger>
          <TabsTrigger value="detailed">التقرير التفصيلي</TabsTrigger>
          <TabsTrigger value="category">تقرير الفئات</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">ملخص الإهلاك</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryBreakdown).map(([category, data]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-right">
                        <h4 className="font-medium">
                          {category === 'vehicles' ? 'المركبات' :
                           category === 'buildings' ? 'المباني' :
                           category === 'equipment' ? 'المعدات' :
                           category === 'furniture' ? 'الأثاث' : category}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {data.count} أصل - {formatCurrency(data.totalCost)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(data.totalBookValue)}</p>
                        <p className="text-sm text-muted-foreground">
                          إهلاك: {formatCurrency(data.totalDepreciation)}
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={(data.totalDepreciation / data.totalCost) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">التقرير التفصيلي للإهلاك</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">كود الأصل</TableHead>
                    <TableHead className="text-right">اسم الأصل</TableHead>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">تكلفة الشراء</TableHead>
                    <TableHead className="text-right">الإهلاك المتراكم</TableHead>
                    <TableHead className="text-right">القيمة الدفترية</TableHead>
                    <TableHead className="text-right">معدل الإهلاك</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">المعين له</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingDepreciation ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        جاري التحميل...
                      </TableCell>
                    </TableRow>
                  ) : depreciationData?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        لا توجد بيانات للعرض
                      </TableCell>
                    </TableRow>
                  ) : (
                    depreciationData?.map((asset) => (
                      <TableRow key={asset.asset_id}>
                        <TableCell className="text-right font-medium">
                          {asset.asset_code}
                        </TableCell>
                        <TableCell className="text-right">{asset.asset_name}</TableCell>
                        <TableCell className="text-right">
                          {asset.category === 'vehicles' ? 'المركبات' :
                           asset.category === 'buildings' ? 'المباني' :
                           asset.category === 'equipment' ? 'المعدات' : asset.category}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(asset.purchase_cost)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(asset.accumulated_depreciation)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(asset.book_value)}
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.depreciation_rate_percent.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={getConditionBadgeVariant(asset.condition_status)}>
                            {getConditionLabel(asset.condition_status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.assigned_employee || "غير معين"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(categoryBreakdown).map(([category, data]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-right">
                    {category === 'vehicles' ? 'المركبات' :
                     category === 'buildings' ? 'المباني' :
                     category === 'equipment' ? 'المعدات' :
                     category === 'furniture' ? 'الأثاث' : category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">عدد الأصول</p>
                      <p className="text-2xl font-bold">{data.count}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">معدل الإهلاك</p>
                      <p className="text-2xl font-bold">
                        {((data.totalDepreciation / data.totalCost) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">التكلفة الإجمالية</span>
                      <span className="text-sm font-medium">{formatCurrency(data.totalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">الإهلاك المتراكم</span>
                      <span className="text-sm font-medium">{formatCurrency(data.totalDepreciation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">القيمة الدفترية</span>
                      <span className="text-sm font-bold">{formatCurrency(data.totalBookValue)}</span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={(data.totalDepreciation / data.totalCost) * 100} 
                    className="h-3"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}