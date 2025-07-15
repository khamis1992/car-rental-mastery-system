import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Receipt, 
  Send, 
  BookOpen, 
  BarChart3,
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock
} from "lucide-react";
import { useCheckSummary } from "@/hooks/useCheckSummary";
import { CheckbooksManagement } from "./CheckbooksManagement";
import { PaidChecksManagement } from "./PaidChecksManagement";
import { ReceivedChecksManagement } from "./ReceivedChecksManagement";
import { ChecksReports } from "./ChecksReports";

export function ChecksOverview() {
  const { summary, loading } = useCheckSummary();

  const stats = [
    {
      title: "الشيكات المدفوعة",
      value: summary.total_paid_checks,
      amount: summary.total_paid_amount,
      icon: Send,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "الشيكات المستلمة",
      value: summary.total_received_checks,
      amount: summary.total_received_amount,
      icon: Receipt,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "شيكات تحت التحصيل",
      value: summary.pending_received_checks,
      amount: summary.pending_received_amount,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      title: "شيكات مرتدة",
      value: summary.bounced_checks,
      amount: summary.bounced_amount,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
  ];

  if (loading) {
    return <div className="animate-pulse">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ملخص الشيكات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`${stat.borderColor} ${stat.bgColor}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-sm ${stat.color} font-semibold`}>
                    {stat.amount.toLocaleString('ar-KW')} د.ك
                  </p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* علامات التبويب الرئيسية */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between rtl-flex">
          <CardTitle className="rtl-title">إدارة الشيكات</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="rtl-flex">
                <BarChart3 className="h-4 w-4" />
                الملخص
              </TabsTrigger>
              <TabsTrigger value="checkbooks" className="rtl-flex">
                <BookOpen className="h-4 w-4" />
                دفاتر الشيكات
              </TabsTrigger>
              <TabsTrigger value="paid" className="rtl-flex">
                <Send className="h-4 w-4" />
                الشيكات المدفوعة
              </TabsTrigger>
              <TabsTrigger value="received" className="rtl-flex">
                <Receipt className="h-4 w-4" />
                الشيكات المستلمة
              </TabsTrigger>
              <TabsTrigger value="reports" className="rtl-flex">
                <BarChart3 className="h-4 w-4" />
                التقارير
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="rtl-title">الشيكات المدفوعة حسب الحالة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 rtl-flex">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>مصرفة</span>
                        </div>
                        <span className="font-semibold">{summary.total_paid_checks}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="rtl-title">الشيكات المستلمة حسب الحالة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 rtl-flex">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span>تحت التحصيل</span>
                        </div>
                        <span className="font-semibold">{summary.pending_received_checks}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 rtl-flex">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span>مرتدة</span>
                        </div>
                        <span className="font-semibold">{summary.bounced_checks}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="checkbooks" className="mt-6">
              <CheckbooksManagement />
            </TabsContent>

            <TabsContent value="paid" className="mt-6">
              <PaidChecksManagement />
            </TabsContent>

            <TabsContent value="received" className="mt-6">
              <ReceivedChecksManagement />
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <ChecksReports />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}