import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepreciationSchedule } from "./DepreciationSchedule";
import { VehicleCosts } from "./VehicleCosts";
import { DepreciationReports } from "./DepreciationReports";
import { DepreciationSettings } from "./DepreciationSettings";
import { MonthlyProcessing } from "./MonthlyProcessing";
import { Calculator, Settings, DollarSign, FileText, TrendingDown } from "lucide-react";

export function DepreciationDashboard() {
  const [activeTab, setActiveTab] = useState("schedule");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">نظام استهلاك المركبات</h1>
          <p className="text-muted-foreground">
            إدارة شاملة لاستهلاك المركبات والتكاليف المرتبطة
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4" dir="rtl">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            جدولة الاستهلاك
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            تكاليف المركبات
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            المعالجة الشهرية
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            التقارير
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>جدولة استهلاك المركبات</CardTitle>
              <CardDescription>
                عرض وإدارة جدولة الاستهلاك لجميع المركبات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DepreciationSchedule />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>تكاليف المركبات</CardTitle>
              <CardDescription>
                تتبع وإدارة جميع تكاليف المركبات (وقود، صيانة، تأمين)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleCosts />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle>المعالجة الشهرية</CardTitle>
              <CardDescription>
                معالجة قيود الاستهلاك الشهرية وإنشاء القيود المحاسبية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyProcessing />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>تقارير الاستهلاك</CardTitle>
              <CardDescription>
                إنشاء ومراجعة تقارير الاستهلاك الشهرية والسنوية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DepreciationReports />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الاستهلاك</CardTitle>
              <CardDescription>
                تكوين الإعدادات العامة لنظام الاستهلاك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DepreciationSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}