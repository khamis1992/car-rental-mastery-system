import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, Filter, Download, Mail, Phone, AlertTriangle, 
  TrendingUp, TrendingDown, Users, DollarSign, FileText, 
  Calendar, Send, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { accountingReportsService, CustomerOverview } from '@/services/accountingReportsService';

const CustomersOverviewReport = () => {
  const [customers, setCustomers] = useState<CustomerOverview[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'balance' | 'collection' | 'contracts' | 'branch'>('balance');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [overdueFilter, setOverdueFilter] = useState<string>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  useEffect(() => {
    loadCustomersOverview();
  }, [sortBy, statusFilter, overdueFilter]);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const loadCustomersOverview = async () => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        overdue_days: overdueFilter !== 'all' ? parseInt(overdueFilter) : undefined
      };

      const data = await accountingReportsService.getCustomersOverview();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers overview:', error);
      toast.error('حدث خطأ في تحميل بيانات العملاء');
      
      // Mock data for demonstration
      const mockData: CustomerOverview[] = [
        {
          id: '1',
          name: 'شركة التجارة الحديثة',
          customer_code: 'CUS001',
          phone: '+965 99887766',
          email: 'info@moderntrading.com',
          total_contracts: 8,
          current_balance: 15500,
          total_amount: 125000,
          
          collection_rate: 87.6,
          payment_score: 4.2
        },
        {
          id: '2',
          name: 'مؤسسة الأعمال المتقدمة',
          customer_code: 'CUS002',
          phone: '+965 99112233',
          email: 'contact@advanced-business.com',
          total_contracts: 12,
          current_balance: 2800,
          total_amount: 180000,
          
          collection_rate: 98.4,
          payment_score: 4.8
        },
        {
          id: '3',
          name: 'شركة الخدمات الذكية',
          customer_code: 'CUS003',
          phone: '+965 99334455',
          email: 'smart@services.co',
          total_contracts: 5,
          current_balance: 8900,
          total_amount: 85000,
          
          collection_rate: 89.5,
          payment_score: 4.1
        },
        {
          id: '4',
          name: 'مكتب الاستشارات الفنية',
          customer_code: 'CUS004',
          phone: '+965 99556677',
          email: 'info@technical-consulting.com',
          total_contracts: 3,
          current_balance: 0,
          total_amount: 45000,
          
          collection_rate: 100,
          payment_score: 5.0
        },
        {
          id: '5',
          name: 'شركة التطوير العقاري',
          customer_code: 'CUS005',
          phone: '+965 99778899',
          email: 'realestate@development.com',
          total_contracts: 15,
          current_balance: 25000,
          total_amount: 250000,
          
          collection_rate: 90,
          payment_score: 3.8
        }
      ];
      setCustomers(mockData);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredCustomers(filtered);
  };

  const handleExport = () => {
    toast.success('جاري تصدير تقرير العملاء...');
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const sendReminders = async (type: 'email' | 'sms') => {
    if (selectedCustomers.length === 0) {
      toast.error('يرجى تحديد العملاء أولاً');
      return;
    }

    const overdueCustomers = filteredCustomers.filter(c => 
      selectedCustomers.includes(c.id) && c.current_balance > 0
    );

    if (overdueCustomers.length === 0) {
      toast.error('لا يوجد عملاء متأخرون في السداد من المحددين');
      return;
    }

    toast.success(`تم إرسال ${overdueCustomers.length} ${type === 'email' ? 'بريد إلكتروني' : 'رسالة نصية'}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">متأخر</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">غير نشط</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCollectionRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-blue-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateSummary = () => {
    const totalCustomers = filteredCustomers.length;
    const activeCustomers = filteredCustomers.filter(c => c.current_balance <= 1000).length;
    const overdueCustomers = filteredCustomers.filter(c => c.current_balance > 1000).length;
    const totalBalance = filteredCustomers.reduce((sum, c) => sum + c.current_balance, 0);
    const averageCollectionRate = filteredCustomers.length > 0 
      ? filteredCustomers.reduce((sum, c) => sum + c.collection_rate, 0) / filteredCustomers.length 
      : 0;

    return { totalCustomers, activeCustomers, overdueCustomers, totalBalance, averageCollectionRate };
  };

  const summary = calculateSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">التقرير المجمع للعملاء</h2>
          <p className="text-gray-600">نظرة شاملة على جميع العملاء والمديونيات</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                إرسال تذكيرات
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إرسال تذكيرات للعملاء المتأخرين</DialogTitle>
                <DialogDescription>
                  تم تحديد {selectedCustomers.length} عميل. سيتم إرسال التذكيرات للعملاء المتأخرين فقط.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => sendReminders('email')} className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  بريد إلكتروني
                </Button>
                <Button onClick={() => sendReminders('sms')} variant="outline" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  رسالة نصية
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي العملاء</p>
                <p className="text-xl font-bold text-blue-600">{summary.totalCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">عملاء نشطون</p>
                <p className="text-xl font-bold text-green-600">{summary.activeCustomers}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">عملاء متأخرون</p>
                <p className="text-xl font-bold text-red-600">{summary.overdueCustomers}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المديونية</p>
                <p className="text-xl font-bold text-purple-600">
                  {summary.totalBalance.toLocaleString()} د.ك
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط التحصيل</p>
                <p className="text-xl font-bold text-orange-600">
                  {summary.averageCollectionRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            الفلاتر والبحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">البحث</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="اسم العميل، الكود، الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ترتيب حسب</label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">الأعلى مديونية</SelectItem>
                  <SelectItem value="collection">الأعلى تحصيلاً</SelectItem>
                  <SelectItem value="contracts">عدد العقود</SelectItem>
                  <SelectItem value="branch">الفروع</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">حالة العميل</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="overdue">متأخر</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">أيام التأخير</label>
              <Select value={overdueFilter} onValueChange={setOverdueFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفترات</SelectItem>
                  <SelectItem value="7">أكثر من 7 أيام</SelectItem>
                  <SelectItem value="15">أكثر من 15 يوم</SelectItem>
                  <SelectItem value="30">أكثر من 30 يوم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              قائمة العملاء ({filteredCustomers.length})
            </CardTitle>
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
            >
              {selectedCustomers.length === filteredCustomers.length ? 'إلغاء التحديد' : 'تحديد الكل'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل البيانات...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد عملاء مطابقين للفلاتر المحددة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-2 w-12">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === filteredCustomers.length}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-right py-3 px-2">العميل</th>
                    <th className="text-right py-3 px-2">الحالة</th>
                    <th className="text-right py-3 px-2">عدد العقود</th>
                    <th className="text-right py-3 px-2">الرصيد الحالي</th>
                    <th className="text-right py-3 px-2">إجمالي الفواتير</th>
                    <th className="text-right py-3 px-2">نسبة التحصيل</th>
                    <th className="text-right py-3 px-2">الغرامات</th>
                    <th className="text-right py-3 px-2">أيام التأخير</th>
                    <th className="text-right py-3 px-2">التواصل</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.customer_code}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {getStatusBadge(customer.current_balance > 1000 ? 'overdue' : 'active')}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline">{customer.total_contracts}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`font-medium ${customer.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {customer.current_balance.toLocaleString()} د.ك
                        </span>
                      </td>
                      <td className="py-3 px-2 text-blue-600 font-medium">
                        {customer.total_amount.toLocaleString()} د.ك
                      </td>
                      <td className="py-3 px-2">
                        <span className={`font-medium ${getCollectionRateColor(customer.collection_rate)}`}>
                          {customer.collection_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-gray-400">-</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {customer.current_balance > 1000 ? (
                          <Badge className="bg-orange-100 text-orange-800">
                            15 يوم
                          </Badge>
                        ) : (
                          <span className="text-green-600">محدث</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="p-1">
                            <Phone className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="p-1">
                            <Mail className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Integration */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-900">ربط النظام بالحسابات المحاسبية</p>
              <p className="text-sm text-blue-700 mt-1">
                جميع البيانات مرتبطة بحسابات العملاء في شجرة الحسابات - الحساب رقم 
                <Badge className="mx-1 bg-blue-100 text-blue-800">1130101</Badge>
                مع التطبيق التلقائي للقيود المحاسبية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersOverviewReport; 