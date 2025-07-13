import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  Building2, AlertTriangle, CheckCircle, Clock 
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { accountingReportsService } from '@/services/accountingReportsService';
import { toast } from 'sonner';

const AccountingDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await accountingReportsService.getDashboardSummary();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('حدث خطأ في تحميل بيانات لوحة المعلومات');
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts (في التطبيق الفعلي ستأتي من قاعدة البيانات)
  const monthlyRevenueData = [
    { month: 'يناير', revenue: 85000, expenses: 45000, profit: 40000 },
    { month: 'فبراير', revenue: 92000, expenses: 48000, profit: 44000 },
    { month: 'مارس', revenue: 78000, expenses: 42000, profit: 36000 },
    { month: 'أبريل', revenue: 105000, expenses: 52000, profit: 53000 },
    { month: 'مايو', revenue: 118000, expenses: 55000, profit: 63000 },
    { month: 'يونيو', revenue: 125000, expenses: 58000, profit: 67000 }
  ];

  const customerStatusData = [
    { name: 'عملاء نشطون', value: 180, color: '#22c55e' },
    { name: 'عملاء متأخرون', value: 45, color: '#f59e0b' },
    { name: 'عملاء معطلون', value: 22, color: '#ef4444' }
  ];

  const assetDistributionData = [
    { category: 'سيارات صالون', value: 45, color: '#3b82f6' },
    { category: 'سيارات دفع رباعي', value: 32, color: '#8b5cf6' },
    { category: 'باصات', value: 18, color: '#10b981' },
    { category: 'شاحنات', value: 12, color: '#f59e0b' }
  ];

  const collectionTrendData = [
    { week: 'الأسبوع 1', rate: 88 },
    { week: 'الأسبوع 2', rate: 92 },
    { week: 'الأسبوع 3', rate: 89 },
    { week: 'الأسبوع 4', rate: 94 }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData?.monthlyRevenue?.toLocaleString() || '0'} د.ك
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+12.5%</span>
                  <span className="text-xs text-gray-500">عن الشهر السابق</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">نسبة التحصيل</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData?.collectionRate?.toFixed(1) || '0'}%
                </p>
                <Progress value={dashboardData?.collectionRate || 0} className="mt-2" />
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">العملاء النشطون</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData?.customersCount || '0'}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-600">247 إجمالي</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">قيمة الأصول</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData?.totalAssets?.toLocaleString() || '0'} د.ك
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-orange-600">107 مركبة</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Building2 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="font-semibold text-red-700">تنبيهات عاجلة</p>
                <p className="text-sm text-gray-600">23 عميل متأخر عن السداد</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="font-semibold text-yellow-700">مراجعة مطلوبة</p>
                <p className="text-sm text-gray-600">8 قيود محاسبية معلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-semibold text-blue-700">تم بنجاح</p>
                <p className="text-sm text-gray-600">الإهلاك الشهري مكتمل</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              اتجاه الإيرادات الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString()} د.ك`, '']}
                  labelFormatter={(label) => `الشهر: ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="الإيرادات"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stackId="2" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6}
                  name="المصروفات"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              توزيع حالة العملاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {customerStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Collection Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              معدل التحصيل الأسبوعي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={collectionTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'معدل التحصيل']} />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  dot={{ fill: '#22c55e', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              توزيع الأصول
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assetDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Account Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            حالة التكامل مع الحسابات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Badge className="bg-green-100 text-green-800">1130101</Badge>
              <div>
                <p className="font-semibold">عملاء تجاريون</p>
                <p className="text-sm text-gray-600">متصل</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Badge className="bg-blue-100 text-blue-800">1210101</Badge>
              <div>
                <p className="font-semibold">الأصول الثابتة</p>
                <p className="text-sm text-gray-600">متصل</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Badge className="bg-purple-100 text-purple-800">4110101</Badge>
              <div>
                <p className="font-semibold">إيرادات التأجير</p>
                <p className="text-sm text-gray-600">متصل</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
              <Badge className="bg-orange-100 text-orange-800">5130101</Badge>
              <div>
                <p className="font-semibold">مصروف الإهلاك</p>
                <p className="text-sm text-gray-600">متصل</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountingDashboard; 