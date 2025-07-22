import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ar } from "date-fns/locale";
import { FileText, Plus, Download, Eye } from "lucide-react";

interface DepreciationReport {
  id: string;
  report_name: string;
  report_type: string;
  period_start: string;
  period_end: string;
  total_depreciation: number;
  vehicles_count: number;
  generated_at: string;
  status: string;
  report_data: any;
}

interface NewReportForm {
  report_name: string;
  report_type: string;
  period_start: string;
  period_end: string;
}

const reportTypes = [
  { value: "monthly", label: "شهري" },
  { value: "annual", label: "سنوي" },
  { value: "custom", label: "مخصص" },
];

export function DepreciationReports() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState<NewReportForm>({
    report_name: "",
    report_type: "monthly",
    period_start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    period_end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  const queryClient = useQueryClient();

  // Fetch reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["depreciation-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("depreciation_reports")
        .select("*")
        .order("generated_at", { ascending: false });
      
      if (error) throw error;
      return data as DepreciationReport[];
    },
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (reportData: NewReportForm) => {
      // Fetch depreciation data for the period
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("vehicle_depreciation_schedule")
        .select(`
          *,
          vehicles:vehicle_id (
            id,
            license_plate,
            make,
            model,
            year
          )
        `)
        .gte("depreciation_date", reportData.period_start)
        .lte("depreciation_date", reportData.period_end)
        .order("depreciation_date");

      if (scheduleError) throw scheduleError;

      const totalDepreciation = scheduleData.reduce((sum, item) => sum + item.monthly_depreciation, 0);
      const vehicleIds = new Set(scheduleData.map(item => item.vehicle_id));
      
      // Create the report
      const { data, error } = await supabase
        .from("depreciation_reports")
        .insert([{
          report_name: reportData.report_name,
          report_type: reportData.report_type,
          period_start: reportData.period_start,
          period_end: reportData.period_end,
          total_depreciation: totalDepreciation,
          vehicles_count: vehicleIds.size,
          report_data: {
            schedule_items: scheduleData,
            summary: {
              total_vehicles: vehicleIds.size,
              total_depreciation: totalDepreciation,
              processed_items: scheduleData.filter(item => item.is_processed).length,
              pending_items: scheduleData.filter(item => !item.is_processed).length,
            }
          },
          status: "draft"
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("تم إنشاء التقرير بنجاح");
      queryClient.invalidateQueries({ queryKey: ["depreciation-reports"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("خطأ في إنشاء التقرير: " + error.message);
    },
  });

  const resetForm = () => {
    setNewReport({
      report_name: "",
      report_type: "monthly",
      period_start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      period_end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    });
  };

  const handleReportTypeChange = (type: string) => {
    setNewReport(prev => {
      const now = new Date();
      let start: Date, end: Date;

      switch (type) {
        case "monthly":
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case "annual":
          start = startOfYear(now);
          end = endOfYear(now);
          break;
        default:
          start = startOfMonth(now);
          end = endOfMonth(now);
      }

      return {
        ...prev,
        report_type: type,
        period_start: format(start, "yyyy-MM-dd"),
        period_end: format(end, "yyyy-MM-dd"),
      };
    });
  };

  const handleGenerateReport = () => {
    if (!newReport.report_name.trim()) {
      toast.error("يرجى إدخال اسم التقرير");
      return;
    }

    if (new Date(newReport.period_start) > new Date(newReport.period_end)) {
      toast.error("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
      return;
    }

    generateReportMutation.mutate(newReport);
  };

  const getReportTypeLabel = (type: string) => {
    return reportTypes.find(rt => rt.value === type)?.label || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">مسودة</Badge>;
      case "final":
        return <Badge variant="default">نهائي</Badge>;
      case "archived":
        return <Badge variant="outline">مؤرشف</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">تقارير الاستهلاك</h3>
          <p className="text-sm text-muted-foreground">
            إنشاء ومراجعة تقارير استهلاك المركبات
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              إنشاء تقرير
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إنشاء تقرير جديد</DialogTitle>
              <DialogDescription>
                أنشئ تقرير استهلاك للفترة المحددة
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="report_name">اسم التقرير *</Label>
                <Input
                  id="report_name"
                  value={newReport.report_name}
                  onChange={(e) => setNewReport(prev => ({ ...prev, report_name: e.target.value }))}
                  placeholder="تقرير استهلاك شهر يناير 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report_type">نوع التقرير</Label>
                <Select value={newReport.report_type} onValueChange={handleReportTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {/* Empty space for layout */}
              </div>

              <div className="space-y-2">
                <Label htmlFor="period_start">من تاريخ</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={newReport.period_start}
                  onChange={(e) => setNewReport(prev => ({ ...prev, period_start: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period_end">إلى تاريخ</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={newReport.period_end}
                  onChange={(e) => setNewReport(prev => ({ ...prev, period_end: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleGenerateReport} disabled={generateReportMutation.isPending}>
                إنشاء التقرير
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي التقارير</CardDescription>
            <CardTitle className="text-2xl">
              {reports.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>التقارير النهائية</CardDescription>
            <CardTitle className="text-2xl">
              {reports.filter(r => r.status === "final").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>إجمالي الاستهلاك</CardDescription>
            <CardTitle className="text-2xl">
              {reports.reduce((sum, report) => sum + report.total_depreciation, 0).toLocaleString()} د.ك
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>المركبات المشمولة</CardDescription>
            <CardTitle className="text-2xl">
              {Math.max(...reports.map(r => r.vehicles_count), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة التقارير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم التقرير</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الفترة</TableHead>
                  <TableHead>المركبات</TableHead>
                  <TableHead>إجمالي الاستهلاك</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      جارٍ التحميل...
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      لا توجد تقارير
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.report_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getReportTypeLabel(report.report_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(report.period_start), "dd/MM/yyyy")}</div>
                          <div className="text-muted-foreground">
                            إلى {format(new Date(report.period_end), "dd/MM/yyyy")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.vehicles_count}
                      </TableCell>
                      <TableCell>
                        {report.total_depreciation.toLocaleString()} د.ك
                      </TableCell>
                      <TableCell>
                        {format(new Date(report.generated_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}