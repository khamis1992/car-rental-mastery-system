import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  PieChart,
  FileText
} from "lucide-react";

const BillingReports: React.FC = () => {
  const revenueData = [
    { month: "يناير", revenue: 15750, growth: 12.5 },
    { month: "ديسمبر", revenue: 14200, growth: 8.3 },
    { month: "نوفمبر", revenue: 13100, growth: 5.2 },
    { month: "أكتوبر", revenue: 12450, growth: 3.1 },
    { month: "سبتمبر", revenue: 12100, growth: -1.2 },
    { month: "أغسطس", revenue: 12250, growth: 2.4 }
  ];

  const planBreakdown = [
    { plan: "خطة المؤسسة", count: 8, percentage: 33, revenue: "8,000 د.ك" },
    { plan: "خطة المتقدمة", count: 10, percentage: 42, revenue: "6,000 د.ك" },
    { plan: "خطة الأساسية", count: 6, percentage: 25, revenue: "1,750 د.ك" }
  ];

  const reports = [
    {
      title: "تقرير الإيرادات الشهرية",
      description: "تفاصيل الإيرادات والنمو الشهري",
      icon: BarChart3,
      generated: "2024-01-15"
    },
    {
      title: "تقرير توزيع الخطط",
      description: "إحصائيات الاشتراكات حسب نوع الخطة",
      icon: PieChart,
      generated: "2024-01-15"
    },
    {
      title: "تقرير المدفوعات المتأخرة",
      description: "قائمة بالفواتير المتأخرة والمبالغ المستحقة",
      icon: FileText,
      generated: "2024-01-14"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Report Generation Controls */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>إنشاء التقارير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="نوع التقرير" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">تقرير الإيرادات</SelectItem>
                <SelectItem value="subscriptions">تقرير الاشتراكات</SelectItem>
                <SelectItem value="payments">تقرير المدفوعات</SelectItem>
                <SelectItem value="overdue">تقرير المتأخرات</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">هذا الشهر</SelectItem>
                <SelectItem value="last-month">الشهر الماضي</SelectItem>
                <SelectItem value="quarter">هذا الربع</SelectItem>
                <SelectItem value="year">هذا العام</SelectItem>
                <SelectItem value="custom">فترة مخصصة</SelectItem>
              </SelectContent>
            </Select>
            
            <Button>
              <BarChart3 className="w-4 h-4 mr-2" />
              إنشاء التقرير
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            اتجاه الإيرادات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueData.map((data, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-semibold text-sm">
                      {data.month.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{data.month} 2024</p>
                    <p className="text-sm text-muted-foreground">{data.revenue.toLocaleString()} د.ك</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className={`font-semibold ${data.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {data.growth >= 0 ? '+' : ''}{data.growth}%
                  </p>
                  <p className="text-xs text-muted-foreground">النمو</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan Distribution */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            توزيع الخطط
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {planBreakdown.map((plan, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{plan.plan}</span>
                  <span className="text-sm text-muted-foreground">{plan.count} مؤسسة</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${plan.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{plan.percentage}%</span>
                  <span className="font-medium">{plan.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Reports */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>التقارير المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report, index) => (
              <Card key={index} className="border-muted">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-primary p-3 rounded-xl">
                        <report.icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        آخر تحديث: {report.generated}
                      </p>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        تحميل
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>خيارات التصدير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <FileText className="w-6 h-6" />
              PDF
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <FileText className="w-6 h-6" />
              Excel
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <FileText className="w-6 h-6" />
              CSV
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Calendar className="w-6 h-6" />
              مجدول
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingReports;