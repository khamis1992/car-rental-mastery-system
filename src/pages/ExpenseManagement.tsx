import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Settings,
  Receipt
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ExpenseManagement() {
  const [activeTab, setActiveTab] = useState("vouchers");

  return (
    <div className="container mx-auto p-6 space-y-6">
        {/* الرأس */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">إدارة المصروفات</h1>
            <p className="text-muted-foreground">
              إدارة شاملة لسندات الصرف والفئات والموافقات
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              سند صرف جديد
            </Button>
            <Button variant="outline">
              <BarChart3 className="ml-2 h-4 w-4" />
              التقارير
            </Button>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي المصروفات
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,450.000 د.ك</div>
              <p className="text-xs text-muted-foreground">
                +20.1% من الشهر الماضي
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                في انتظار الموافقة
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                2,340.500 د.ك إجمالي
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                تمت الموافقة عليها
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                8,890.750 د.ك إجمالي
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                مرفوضة
              </CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                1,219.750 د.ك إجمالي
              </p>
            </CardContent>
          </Card>
        </div>

        {/* المحتوى الرئيسي */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vouchers">سندات الصرف</TabsTrigger>
            <TabsTrigger value="categories">فئات المصروفات</TabsTrigger>
            <TabsTrigger value="approvals">الموافقات</TabsTrigger>
            <TabsTrigger value="reports">التقارير</TabsTrigger>
          </TabsList>

          {/* تبويبة سندات الصرف */}
          <TabsContent value="vouchers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>سندات الصرف</CardTitle>
                    <CardDescription>
                      إدارة جميع سندات الصرف ومتابعة حالتها
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="ml-2 h-4 w-4" />
                    سند جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* شريط البحث والفلتر */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="البحث في سندات الصرف..."
                      className="max-w-sm"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="ml-2 h-4 w-4" />
                    فلتر
                  </Button>
                </div>

                {/* جدول سندات الصرف */}
                <div className="border rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="h-12 px-4 text-right align-middle font-medium">
                            رقم السند
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium">
                            التاريخ
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium">
                            المستفيد
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium">
                            المبلغ
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium">
                            الحالة
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium">
                            الإجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-4">EXP-2025-001</td>
                          <td className="p-4">2025-01-15</td>
                          <td className="p-4">شركة الخدمات المتقدمة</td>
                          <td className="p-4">1,250.500 د.ك</td>
                          <td className="p-4">
                            <Badge variant="secondary">في انتظار الموافقة</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                عرض
                              </Button>
                              <Button size="sm" variant="outline">
                                تعديل
                              </Button>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4">EXP-2025-002</td>
                          <td className="p-4">2025-01-14</td>
                          <td className="p-4">أحمد محمد العلي</td>
                          <td className="p-4">750.000 د.ك</td>
                          <td className="p-4">
                            <Badge variant="default">تمت الموافقة</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                عرض
                              </Button>
                              <Button size="sm" variant="outline">
                                طباعة
                              </Button>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-4">EXP-2025-003</td>
                          <td className="p-4">2025-01-13</td>
                          <td className="p-4">مكتب المحاسبة القانونية</td>
                          <td className="p-4">2,100.000 د.ك</td>
                          <td className="p-4">
                            <Badge variant="destructive">مرفوض</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                عرض
                              </Button>
                              <Button size="sm" variant="outline">
                                إعادة إرسال
                              </Button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويبة فئات المصروفات */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>فئات المصروفات</CardTitle>
                    <CardDescription>
                      إدارة فئات وتصنيفات المصروفات
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="ml-2 h-4 w-4" />
                    فئة جديدة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  قريباً - سيتم إضافة إدارة فئات المصروفات
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويبة الموافقات */}
          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>طلبات الموافقة</CardTitle>
                <CardDescription>
                  مراجعة والموافقة على سندات الصرف المعلقة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  قريباً - سيتم إضافة نظام الموافقات
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويبة التقارير */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>تقارير المصروفات</CardTitle>
                <CardDescription>
                  تقارير وإحصائيات شاملة عن المصروفات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  قريباً - سيتم إضافة التقارير والإحصائيات
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}