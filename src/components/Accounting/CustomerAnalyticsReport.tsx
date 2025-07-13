import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, DollarSign, FileText, TrendingUp, Calendar, 
  Car, MapPin, Download, BarChart3, PieChart, Target
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { accountingReportsService, CustomerAnalytics } from '@/services/accountingReportsService';

const CustomerAnalyticsReport = () => {
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerAnalytics();
    }
  }, [selectedCustomer]);

  const loadCustomers = async () => {
    try {
      // In a real app, this would fetch from the customers endpoint
      const mockCustomers = [
        { id: '1', name: 'شركة التجارة الحديثة', code: 'CUS001' },
        { id: '2', name: 'مؤسسة الأعمال المتقدمة', code: 'CUS002' },
        { id: '3', name: 'شركة الخدمات الذكية', code: 'CUS003' },
        { id: '4', name: 'مكتب الاستشارات الفنية', code: 'CUS004' },
        { id: '5', name: 'شركة التطوير العقاري', code: 'CUS005' }
      ];
      setCustomers(mockCustomers);
    } catch (error) {
      toast.error('حدث خطأ في تحميل قائمة العملاء');
    }
  };

  const loadCustomerAnalytics = async () => {
    try {
      setLoading(true);
      const data = await accountingReportsService.getCustomerAnalytics(selectedCustomer);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading customer analytics:', error);
      toast.error('حدث خطأ في تحميل التحليلات');
      
      // Mock data for demonstration
      const mockAnalytics: CustomerAnalytics = {
        id: selectedCustomer,
        name: customers.find(c => c.id === selectedCustomer)?.name || 'العميل المحدد',
        customer_code: 'CUS001',
        phone: '+965 99887766',
        email: 'customer@example.com',
        total_contracts: 8,
        total_revenue: 125000,
        total_amount: 125000,
        last_contract_date: '2024-01-10',
        collection_rate: 94.5,
        payment_score: 4.5,
        last_payment_date: '2024-01-05',
        next_expected_payment: '2024-02-05',
        customer_preferences: {
          preferred_vehicle_type: 'سيارة كامري',
          preferred_rental_duration: '45 يوم'
        },
        contracts: [],
        payment_history: [],
        penalty_history: []
      };
      setAnalytics(mockAnalytics);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!selectedCustomer) {
      toast.error('يرجى تحديد العميل أولاً');
      return;
    }
    toast.success('جاري تصدير التقرير التحليلي...');
  };

  // Chart data
  const revenueVsPaymentsData = analytics ? [
    { name: 'الإيرادات', value: analytics.total_revenue, color: '#3b82f6' },
    { name: 'المدفوعات', value: analytics.total_amount, color: '#10b981' },
    { name: 'الرصيد', value: 5000, color: '#f59e0b' }
  ] : [];

  const penaltiesData = analytics ? [
    { name: 'غرامات مدفوعة', value: 1800, color: '#10b981' },
    { name: 'غرامات متبقية', value: 700, color: '#ef4444' }
  ] : [];

  const monthlyTrendData = [
    { month: 'يناير', revenue: 18000, payments: 17500 },
    { month: 'فبراير', revenue: 22000, payments: 21000 },
    { month: 'مارس', revenue: 19500, payments: 19000 },
    { month: 'أبريل', revenue: 25000, payments: 24500 },
    { month: 'مايو', revenue: 21000, payments: 20500 },
    { month: 'يونيو', revenue: 23500, payments: 22000 }
  ];

  const contractsTimelineData = [
    { period: 'Q1 2023', contracts: 2, revenue: 35000 },
    { period: 'Q2 2023', contracts: 3, revenue: 42000 },
    { period: 'Q3 2023', contracts: 2, revenue: 28000 },
    { period: 'Q4 2023', contracts: 1, revenue: 20000 }
  ];

  const getCollectionGrade = (rate: number) => {
    if (rate >= 95) return { grade: 'ممتاز', color: 'text-green-600', bg: 'bg-green-100' };
    if (rate >= 85) return { grade: 'جيد جداً', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (rate >= 70) return { grade: 'جيد', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { grade: 'يحتاج تحسين', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const collectionGrade = analytics ? getCollectionGrade(analytics.collection_rate) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">التقرير التحليلي للعميل</h2>
          <p className="text-gray-600">تحليل مالي شامل ومؤشرات الأداء</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            اختيار العميل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">العميل</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل للتحليل" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {analytics && (
              <div className="flex items-end">
                <div className="space-y-1">
                  <p className="text-sm font-medium">فترة التعامل</p>
                  <p className="text-sm text-gray-600">
                    من {format(new Date(analytics.last_contract_date), 'yyyy/MM/dd', { locale: ar })}
                  </p>
                  <p className="text-sm text-gray-600">
                    آخر نشاط: {format(new Date(analytics.last_contract_date), 'yyyy/MM/dd', { locale: ar })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل التحليلات...</p>
        </div>
      ) : !analytics ? (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">يرجى تحديد العميل لعرض التحليلات</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analytics.total_revenue.toLocaleString()} د.ك
                    </p>
                    <p className="text-xs text-gray-500">من {analytics.total_contracts} عقد</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">نسبة التحصيل</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.collection_rate.toFixed(1)}%
                    </p>
                    {collectionGrade && (
                      <Badge className={`${collectionGrade.bg} ${collectionGrade.color} text-xs`}>
                        {collectionGrade.grade}
                      </Badge>
                    )}
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">متوسط مدة التأجير</p>
                    <p className="text-2xl font-bold text-purple-600">
                      45 يوم
                    </p>
                    <p className="text-xs text-gray-500">لكل عقد</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">الرصيد الحالي</p>
                    <p className={`text-2xl font-bold text-green-600`}>
                      5,000 د.ك
                    </p>
                    <p className="text-xs text-gray-500">
                      لصالح العميل
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-500" />
                  تفضيلات العميل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-blue-900">المركبة الأكثر استئجاراً</p>
                    <p className="text-sm text-blue-700">{analytics.customer_preferences?.preferred_vehicle_type || 'غير محدد'}</p>
                  </div>
                  <Car className="w-8 h-8 text-blue-500" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-green-900">الفرع الأكثر تعاملاً</p>
                    <p className="text-sm text-green-700">الفرع الرئيسي</p>
                  </div>
                  <MapPin className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  مؤشرات الأداء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>معدل التحصيل</span>
                    <span>{analytics.collection_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={analytics.collection_rate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>معدل الغرامات المدفوعة</span>
                    <span>72.0%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="font-semibold">{analytics.total_contracts}</p>
                    <p className="text-gray-600">عدد العقود</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="font-semibold">45</p>
                    <p className="text-gray-600">متوسط الأيام</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Payments */}
            <Card>
              <CardHeader>
                <CardTitle>الإيرادات مقابل المدفوعات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={revenueVsPaymentsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {revenueVsPaymentsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} د.ك`} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Penalties Status */}
            <Card>
              <CardHeader>
                <CardTitle>حالة الغرامات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={penaltiesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {penaltiesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} د.ك`} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>الاتجاه الشهري</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toLocaleString()} د.ك`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="الإيرادات" strokeWidth={2} />
                    <Line type="monotone" dataKey="payments" stroke="#10b981" name="المدفوعات" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contracts Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>الجدول الزمني للعقود</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contractsTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="contracts" fill="#8b5cf6" name="عدد العقود" />
                    <Bar dataKey="revenue" fill="#f59e0b" name="الإيرادات" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Account Integration */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">التكامل مع الحسابات المحاسبية</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-blue-100 text-blue-800">1130101 - العملاء</Badge>
                    <Badge className="bg-green-100 text-green-800">4110101 - الإيرادات</Badge>
                    <Badge className="bg-purple-100 text-purple-800">4310104 - الغرامات</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CustomerAnalyticsReport; 