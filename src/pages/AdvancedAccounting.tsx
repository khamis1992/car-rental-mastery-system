import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealTimeStatus } from "@/components/accounting/RealTimeStatus";
import { AdvancedReports } from "@/components/accounting/AdvancedReports";
import { CurrencyConverter } from "@/components/accounting/CurrencyConverter";
import { AIInsights } from "@/components/accounting/AIInsights";
import { FinancialForecasting } from "@/components/accounting/FinancialForecasting";
import { AuditCompliance } from "@/components/accounting/AuditCompliance";
import { SystemIntegrations } from "@/components/accounting/SystemIntegrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp, Zap, DollarSign, Calculator, Brain, Link } from "lucide-react";

export const AdvancedAccounting = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight rtl-title">المحاسبة المتقدمة</h1>
          <p className="text-muted-foreground mt-2">
            نظام التكامل المحاسبي المتقدم مع المزامنة في الوقت الفعلي والتقارير التفاعلية
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rtl-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="rtl-title text-sm font-medium">المزامنة المباشرة</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">نشط</div>
            <p className="text-xs text-muted-foreground">متصل ومزامن</p>
          </CardContent>
        </Card>

        <Card className="rtl-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="rtl-title text-sm font-medium">التقارير المتقدمة</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">نوع تقرير متاح</p>
          </CardContent>
        </Card>

        <Card className="rtl-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="rtl-title text-sm font-medium">العملات المدعومة</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">عملة رئيسية</p>
          </CardContent>
        </Card>

        <Card className="rtl-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="rtl-title text-sm font-medium">التحليلات الذكية</CardTitle>
            <Calculator className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">قريباً</div>
            <p className="text-xs text-muted-foreground">قيد التطوير</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="realtime" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="realtime" className="rtl-tab">
            <Zap className="h-4 w-4 ml-2" />
            المزامنة المباشرة
          </TabsTrigger>
          <TabsTrigger value="reports" className="rtl-tab">
            <PieChart className="h-4 w-4 ml-2" />
            التقارير المتقدمة
          </TabsTrigger>
          <TabsTrigger value="currency" className="rtl-tab">
            <DollarSign className="h-4 w-4 ml-2" />
            العملات المتعددة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          <RealTimeStatus />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <AdvancedReports />
        </TabsContent>

        <TabsContent value="currency" className="space-y-6">
          <CurrencyConverter />
        </TabsContent>
      </Tabs>
    </div>
  );
};