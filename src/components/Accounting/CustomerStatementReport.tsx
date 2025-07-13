import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePickerRange } from '@/components/ui/date-picker-range';
import { 
  Search, Filter, Download, Printer, FileText, 
  DollarSign, TrendingUp, TrendingDown, User 
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { accountingReportsService, CustomerTransaction } from '@/services/accountingReportsService';

const CustomerStatementReport = () => {
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<CustomerTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{from: Date, to: Date} | null>(null);
  const [transactionType, setTransactionType] = useState<string>('all');
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerStatement();
    }
  }, [selectedCustomer, dateRange, transactionType]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm]);

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

  const loadCustomerStatement = async () => {
    if (!selectedCustomer) return;

    try {
      setLoading(true);
      const filters = {
        transaction_type: transactionType !== 'all' ? transactionType : undefined
      };

      const data = await accountingReportsService.getCustomerStatement(selectedCustomer, {
        startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
        endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''
      });

      setTransactions(data);
    } catch (error) {
      console.error('Error loading customer statement:', error);
      toast.error('حدث خطأ في تحميل كشف حساب العميل');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    if (!searchTerm) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(transaction =>
      transaction.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredTransactions(filtered);
  };

  const handleExport = () => {
    if (!selectedCustomer) {
      toast.error('يرجى تحديد العميل أولاً');
      return;
    }
    toast.success('جاري تصدير كشف الحساب...');
    // Export logic here
  };

  const handlePrint = () => {
    if (!selectedCustomer) {
      toast.error('يرجى تحديد العميل أولاً');
      return;
    }
    window.print();
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'bg-blue-100 text-blue-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      case 'discount':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'فاتورة';
      case 'payment':
        return 'دفعة';
      case 'penalty':
        return 'غرامة';
      case 'discount':
        return 'خصم';
      default:
        return type;
    }
  };

  const calculateSummary = () => {
    const totalInvoices = filteredTransactions
      .filter(t => t.transaction_type === 'invoice')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayments = filteredTransactions
      .filter(t => t.transaction_type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPenalties = filteredTransactions
      .filter(t => t.transaction_type === 'penalty')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = totalInvoices + totalPenalties - totalPayments;

    return { totalInvoices, totalPayments, totalPenalties, currentBalance };
  };

  const summary = calculateSummary();
  const selectedCustomerName = customers.find(c => c.id === selectedCustomer)?.name || '';

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">كشف حساب العميل</h2>
          <p className="text-gray-600">عرض تفصيلي للعمليات المالية للعميل</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            طباعة
          </Button>
        </div>
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
              <label className="block text-sm font-medium mb-2">العميل</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل" />
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

            <div>
              <label className="block text-sm font-medium mb-2">نوع العملية</label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع العمليات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العمليات</SelectItem>
                  <SelectItem value="invoice">فواتير</SelectItem>
                  <SelectItem value="payment">دفعات</SelectItem>
                  <SelectItem value="penalty">غرامات</SelectItem>
                  <SelectItem value="discount">خصومات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الفترة الزمنية</label>
              <DatePickerRange
                value={dateRange}
                onChange={setDateRange}
                placeholder="اختر الفترة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">البحث</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="رقم العقد، الوصف، أو رقم اللوحة"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Summary */}
      {selectedCustomer && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الفواتير</p>
                  <p className="text-xl font-bold text-blue-600">
                    {summary.totalInvoices.toLocaleString()} د.ك
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي المدفوعات</p>
                  <p className="text-xl font-bold text-green-600">
                    {summary.totalPayments.toLocaleString()} د.ك
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الغرامات</p>
                  <p className="text-xl font-bold text-red-600">
                    {summary.totalPenalties.toLocaleString()} د.ك
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">الرصيد الحالي</p>
                  <p className={`text-xl font-bold ${summary.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.currentBalance.toLocaleString()} د.ك
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {selectedCustomerName ? `كشف حساب: ${selectedCustomerName}` : 'كشف حساب العميل'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري تحميل البيانات...</p>
            </div>
          ) : !selectedCustomer ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">يرجى تحديد العميل لعرض كشف الحساب</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد عمليات مالية للعميل في الفترة المحددة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-2">التاريخ</th>
                    <th className="text-right py-3 px-2">رقم العقد</th>
                    <th className="text-right py-3 px-2">نوع العملية</th>
                    <th className="text-right py-3 px-2">الوصف</th>
                    <th className="text-right py-3 px-2">المبلغ</th>
                    <th className="text-right py-3 px-2">الرصيد</th>
                    <th className="text-right py-3 px-2">المركبة</th>
                    <th className="text-right py-3 px-2">الفرع</th>
                    <th className="text-right py-3 px-2">المستخدم</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 text-sm">
                        {format(new Date(transaction.transaction_date), 'yyyy/MM/dd', { locale: ar })}
                      </td>
                      <td className="py-3 px-2 text-sm font-medium">
                        {transaction.contract_number}
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                          {getTransactionTypeName(transaction.transaction_type)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-sm max-w-48">
                        {transaction.description}
                      </td>
                      <td className="py-3 px-2 text-sm font-medium">
                        <span className={transaction.transaction_type === 'payment' ? 'text-green-600' : 'text-blue-600'}>
                          {transaction.amount.toLocaleString()} د.ك
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm font-medium">
                        <span className={transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.balance.toLocaleString()} د.ك
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {transaction.vehicle_plate || '-'}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {transaction.branch_name || '-'}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {transaction.user_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Integration Info */}
      {selectedCustomer && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">التكامل المحاسبي</p>
                <p className="text-sm text-blue-700">
                  هذا التقرير مرتبط بحساب العملاء رقم <Badge className="mx-1">1130101</Badge> في شجرة الحسابات
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerStatementReport; 