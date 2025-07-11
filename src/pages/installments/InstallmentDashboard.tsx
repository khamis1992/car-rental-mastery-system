import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarDays, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { installmentService } from "@/services/installmentService";
import { InstallmentPlansList } from "./components/InstallmentPlansList";
import { UpcomingInstallments } from "./components/UpcomingInstallments";
import { OverdueInstallments } from "./components/OverdueInstallments";
import { InstallmentAlerts } from "./components/InstallmentAlerts";
import { CreateInstallmentPlanDialog } from "./components/CreateInstallmentPlanDialog";

interface SummaryData {
  total_pending: number;
  total_overdue: number;
  total_this_month: number;
  overdue_count: number;
  upcoming_count: number;
}

export function InstallmentDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadSummary();
  }, [refreshKey]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await installmentService.getInstallmentSummary();
      setSummary(data as unknown as SummaryData);
    } catch (error) {
      console.error("Error loading summary:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل ملخص الأقساط",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleUpdateOverdue = async () => {
    try {
      await installmentService.updateOverdueInstallments();
      await installmentService.createAutomaticAlerts();
      refreshData();
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث حالة الأقساط وإنشاء التنبيهات",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث الأقساط",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="rtl-title mb-6">
          <h1 className="text-3xl font-bold">متابعة الأقساط</h1>
          <p className="text-muted-foreground">إدارة ومتابعة أقساط العقود والموردين</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* العنوان وأزرار التحكم */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">متابعة الأقساط</h1>
          <p className="text-base text-muted-foreground">إدارة ومتابعة أقساط العقود والموردين</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdateOverdue}
            className="rtl-flex"
          >
            <Clock className="h-4 w-4" />
            تحديث الحالة
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="rtl-flex"
          >
            <Plus className="h-4 w-4" />
            خطة أقساط جديدة
          </Button>
        </div>
      </div>

      {/* بطاقات الملخص */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المعلق</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_pending.toFixed(3)} د.ك</div>
              <p className="text-xs text-muted-foreground">
                جميع الأقساط المعلقة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المتأخرات</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {summary.total_overdue.toFixed(3)} د.ك
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.overdue_count} قسط متأخر
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مستحقات الشهر</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_this_month.toFixed(3)} د.ك</div>
              <p className="text-xs text-muted-foreground">
                {summary.upcoming_count} قسط هذا الشهر
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل السداد</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_pending > 0 
                  ? ((summary.total_pending - summary.total_overdue) / summary.total_pending * 100).toFixed(1)
                  : 100}%
              </div>
              <Progress 
                value={summary.total_pending > 0 
                  ? (summary.total_pending - summary.total_overdue) / summary.total_pending * 100
                  : 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="rtl-flex">
            <FileText className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="rtl-flex">
            <CalendarDays className="h-4 w-4" />
            المستحقات القادمة
          </TabsTrigger>
          <TabsTrigger value="overdue" className="rtl-flex">
            <AlertTriangle className="h-4 w-4" />
            المتأخرات
          </TabsTrigger>
          <TabsTrigger value="alerts" className="rtl-flex">
            <Bell className="h-4 w-4" />
            التنبيهات
          </TabsTrigger>
          <TabsTrigger value="reports" className="rtl-flex">
            <TrendingUp className="h-4 w-4" />
            التقارير
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <InstallmentPlansList refreshKey={refreshKey} onRefresh={refreshData} />
        </TabsContent>

        <TabsContent value="upcoming">
          <UpcomingInstallments refreshKey={refreshKey} onRefresh={refreshData} />
        </TabsContent>

        <TabsContent value="overdue">
          <OverdueInstallments refreshKey={refreshKey} onRefresh={refreshData} />
        </TabsContent>

        <TabsContent value="alerts">
          <InstallmentAlerts refreshKey={refreshKey} onRefresh={refreshData} />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title">التقارير المالية</CardTitle>
              <CardDescription>
                تقارير تفصيلية عن الأقساط والتدفق النقدي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-24 rtl-flex flex-col">
                  <FileText className="h-8 w-8 mb-2" />
                  <span>تقرير التدفق النقدي</span>
                </Button>
                <Button variant="outline" className="h-24 rtl-flex flex-col">
                  <DollarSign className="h-8 w-8 mb-2" />
                  <span>تقرير الموردين</span>
                </Button>
                <Button variant="outline" className="h-24 rtl-flex flex-col">
                  <TrendingUp className="h-8 w-8 mb-2" />
                  <span>تحليل الأداء</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* حوار إنشاء خطة أقساط جديدة */}
      <CreateInstallmentPlanDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refreshData}
      />
    </div>
  );
}