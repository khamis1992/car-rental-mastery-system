import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Eye, BarChart3, Plus } from "lucide-react";
import { DepreciationAnalytics } from "./DepreciationAnalytics";

// Dummy data for demonstration
const dummyReports = [
  {
    id: "1",
    report_name: "تقرير استهلاك يناير 2024",
    report_type: "monthly",
    period_start: "2024-01-01",
    period_end: "2024-01-31",
    total_depreciation: 12500,
    vehicles_count: 15,
    generated_at: "2024-02-01T10:00:00",
    status: "final"
  },
  {
    id: "2", 
    report_name: "تقرير استهلاك فبراير 2024",
    report_type: "monthly",
    period_start: "2024-02-01",
    period_end: "2024-02-28",
    total_depreciation: 11800,
    vehicles_count: 15,
    generated_at: "2024-03-01T10:00:00",
    status: "draft"
  }
];

export function DepreciationReportsSimple() {
  const [activeView, setActiveView] = useState<"reports" | "analytics">("reports");

  const getReportTypeLabel = (type: string) => {
    const types = {
      "monthly": "شهري",
      "annual": "سنوي", 
      "custom": "مخصص"
    };
    return types[type as keyof typeof types] || type;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-medium">تقارير الاستهلاك</h3>
            <p className="text-sm text-muted-foreground">
              إنشاء ومراجعة تقارير استهلاك المركبات
            </p>
          </div>
          
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={activeView === "reports" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("reports")}
            >
              <FileText className="h-4 w-4 mr-2" />
              التقارير
            </Button>
            <Button
              variant={activeView === "analytics" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("analytics")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              التحليلات
            </Button>
          </div>
        </div>

        {activeView === "reports" && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            إنشاء تقرير
          </Button>
        )}
      </div>

      {activeView === "analytics" ? (
        <DepreciationAnalytics />
      ) : (
        <>
          {/* Reports Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>إجمالي التقارير</CardDescription>
                <CardTitle className="text-2xl">
                  {dummyReports.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>التقارير النهائية</CardDescription>
                <CardTitle className="text-2xl">
                  {dummyReports.filter(r => r.status === "final").length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>إجمالي الاستهلاك</CardDescription>
                <CardTitle className="text-2xl">
                  {dummyReports.reduce((sum, report) => sum + report.total_depreciation, 0).toLocaleString()} د.ك
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>المركبات المشمولة</CardDescription>
                <CardTitle className="text-2xl">
                  {Math.max(...dummyReports.map(r => r.vehicles_count), 0)}
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
                    {dummyReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          لا توجد تقارير
                        </TableCell>
                      </TableRow>
                    ) : (
                      dummyReports.map((report) => (
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
                              <div>{formatDate(report.period_start)}</div>
                              <div className="text-muted-foreground">
                                إلى {formatDate(report.period_end)}
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
                            {formatDateTime(report.generated_at)}
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
        </>
      )}
    </div>
  );
}