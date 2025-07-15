import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Calendar, FileText } from "lucide-react";

export function ChecksReports() {
  const reports = [
    {
      title: "تقرير الشيكات المدفوعة",
      description: "قائمة بجميع الشيكات المدفوعة مع التفاصيل المحاسبية",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "تقرير الشيكات المستلمة",
      description: "قائمة بجميع الشيكات المستلمة وحالتها",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "تقرير الشيكات المرتدة",
      description: "قائمة بالشيكات المرتدة وأسباب الارتداد",
      icon: FileText,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "تقرير أعمار الشيكات",
      description: "تحليل أعمار الشيكات تحت التحصيل",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, index) => (
          <Card key={index} className={`${report.bgColor} border-l-4 border-l-current ${report.color}`}>
            <CardHeader>
              <div className="flex items-center gap-3 rtl-flex">
                <report.icon className={`h-6 w-6 ${report.color}`} />
                <CardTitle className="rtl-title">{report.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{report.description}</p>
              <div className="flex gap-2">
                <Button size="sm" className="rtl-flex">
                  <Download className="h-4 w-4" />
                  تصدير PDF
                </Button>
                <Button size="sm" variant="outline" className="rtl-flex">
                  <Calendar className="h-4 w-4" />
                  فترة مخصصة
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ملخص شامل */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">ملخص دورة الشيكات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">تقرير شامل</h3>
            <p className="text-muted-foreground mb-4">
              تقرير شامل يتضمن جميع العمليات المتعلقة بالشيكات
            </p>
            <Button className="rtl-flex">
              <Download className="h-4 w-4" />
              تصدير التقرير الشامل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}