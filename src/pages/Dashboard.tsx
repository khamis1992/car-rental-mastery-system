import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  // بيانات وهمية لعرض الرسوم البيانية
  const data = [
    { month: 'يناير', الإيرادات: 4000, المصروفات: 2400 },
    { month: 'فبراير', الإيرادات: 3000, المصروفات: 1398 },
    { month: 'مارس', الإيرادات: 2000, المصروفات: 9800 },
    { month: 'أبريل', الإيرادات: 2780, المصروفات: 3908 },
    { month: 'مايو', الإيرادات: 1890, المصروفات: 4800 },
    { month: 'يونيو', الإيرادات: 2390, المصروفات: 3800 },
  ];

  return (
    <div className="flex-1 p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="rtl-title mb-8">
          <h1 className="text-3xl font-bold text-foreground">لوحة المعلومات</h1>
          <p className="text-muted-foreground mt-2">نظرة عامة على الوضع المالي</p>
        </div>

        {/* كروت الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="rtl-title">
              <CardTitle className="text-lg">إجمالي الإيرادات</CardTitle>
              <CardDescription>الشهر الحالي</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">د.ك 15,450</div>
              <p className="text-xs text-muted-foreground">+20.1% من الشهر الماضي</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="rtl-title">
              <CardTitle className="text-lg">إجمالي المصروفات</CardTitle>
              <CardDescription>الشهر الحالي</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">د.ك 8,320</div>
              <p className="text-xs text-muted-foreground">+4.3% من الشهر الماضي</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="rtl-title">
              <CardTitle className="text-lg">صافي الربح</CardTitle>
              <CardDescription>الشهر الحالي</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">د.ك 7,130</div>
              <p className="text-xs text-muted-foreground">+35.2% من الشهر الماضي</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="rtl-title">
              <CardTitle className="text-lg">عدد المعاملات</CardTitle>
              <CardDescription>الشهر الحالي</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">2,847</div>
              <p className="text-xs text-muted-foreground">+12.5% من الشهر الماضي</p>
            </CardContent>
          </Card>
        </div>

        {/* الرسم البياني */}
        <Card className="mb-8">
          <CardHeader className="rtl-title">
            <CardTitle>تحليل الإيرادات والمصروفات</CardTitle>
            <CardDescription>مقارنة شهرية للعام الجاري</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="الإيرادات" fill="#8884d8" />
                <Bar dataKey="المصروفات" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ملخص سريع */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="rtl-title">
              <CardTitle>المعاملات الأخيرة</CardTitle>
              <CardDescription>آخر 5 معاملات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: "2024-01-15", description: "بيع خدمات", amount: "+د.ك 1,200" },
                  { date: "2024-01-14", description: "رواتب موظفين", amount: "-د.ك 3,500" },
                  { date: "2024-01-13", description: "شراء معدات", amount: "-د.ك 850" },
                  { date: "2024-01-12", description: "إيراد استشارات", amount: "+د.ك 2,100" },
                  { date: "2024-01-11", description: "فواتير كهرباء", amount: "-د.ك 320" },
                ].map((transaction, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="rtl-title">
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                    <div className={`font-bold ${transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="rtl-title">
              <CardTitle>تنبيهات مهمة</CardTitle>
              <CardDescription>أشياء تحتاج انتباهك</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">فواتير مستحقة الدفع</p>
                  <p className="text-xs text-yellow-600">5 فواتير تحتاج مراجعة</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">تقرير شهري</p>
                  <p className="text-xs text-blue-600">جاهز للمراجعة والاعتماد</p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">حساب جديد</p>
                  <p className="text-xs text-green-600">تم إضافة حساب جديد بنجاح</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}