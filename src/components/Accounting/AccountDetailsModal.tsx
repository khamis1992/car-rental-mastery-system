import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, TrendingUp, TrendingDown, Calendar, DollarSign, FileText, Eye } from 'lucide-react';
import { ChartOfAccount } from '@/types/accounting';
import { accountingService } from '@/services/accountingService';
import { supabase } from '@/integrations/supabase/client';

interface AccountDetailsModalProps {
  account: ChartOfAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

interface AccountTransaction {
  id: string;
  date: string;
  description: string;
  reference_type: string;
  reference_id: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
}

interface AccountAnalytics {
  monthly_trends: { month: string; amount: number }[];
  total_transactions: number;
  average_monthly: number;
  highest_balance: number;
  lowest_balance: number;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  account,
  isOpen,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [analytics, setAnalytics] = useState<AccountAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account && isOpen) {
      loadAccountData();
    }
  }, [account, isOpen]);

  const loadAccountData = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      // Load account transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('journal_entry_lines')
        .select(`
          *,
          journal_entries!inner(
            entry_date,
            description,
            reference_type,
            reference_id,
            status
          )
        `)
        .eq('account_id', account.id)
        .eq('journal_entries.status', 'posted')
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;

      // Transform data for display
      const formattedTransactions: AccountTransaction[] = (transactionsData || []).map((item: any) => ({
        id: item.id,
        date: item.journal_entries.entry_date,
        description: item.description || item.journal_entries.description,
        reference_type: item.journal_entries.reference_type || 'عام',
        reference_id: item.journal_entries.reference_id || '',
        debit_amount: item.debit_amount || 0,
        credit_amount: item.credit_amount || 0,
        running_balance: 0 // سيتم حسابه
      }));

      // Calculate running balances
      let runningBalance = account.opening_balance || 0;
      formattedTransactions.reverse().forEach(transaction => {
        runningBalance += transaction.debit_amount - transaction.credit_amount;
        transaction.running_balance = runningBalance;
      });

      setTransactions(formattedTransactions.reverse());

      // Calculate analytics
      const monthlyTrends = calculateMonthlyTrends(formattedTransactions);
      setAnalytics({
        monthly_trends: monthlyTrends,
        total_transactions: formattedTransactions.length,
        average_monthly: monthlyTrends.reduce((sum, trend) => sum + trend.amount, 0) / Math.max(monthlyTrends.length, 1),
        highest_balance: Math.max(...formattedTransactions.map(t => t.running_balance), account.current_balance || 0),
        lowest_balance: Math.min(...formattedTransactions.map(t => t.running_balance), account.current_balance || 0)
      });

    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTrends = (transactions: AccountTransaction[]) => {
    const monthlyData: { [key: string]: number } = {};
    
    transactions.forEach(transaction => {
      const monthKey = new Date(transaction.date).toLocaleDateString('ar-KW', { 
        year: 'numeric', 
        month: 'long' 
      });
      const netAmount = transaction.debit_amount - transaction.credit_amount;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + netAmount;
    });

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }));
  };

  const formatBalance = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      asset: 'أصول',
      liability: 'خصوم',
      equity: 'حقوق ملكية',
      revenue: 'إيرادات',
      expense: 'مصروفات'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getReferenceTypeLabel = (type: string) => {
    const labels = {
      contract: 'عقد',
      invoice: 'فاتورة',
      payment: 'دفعة',
      expense_voucher: 'سند مصروفات',
      receipt_voucher: 'سند قبض',
      general: 'عام'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2 flex-row-reverse">
            <Eye className="w-5 h-5" />
            تفاصيل الحساب: {account.account_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات الحساب الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                <Building className="w-5 h-5" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-primary">
                    {account.account_code}
                  </div>
                  <div className="text-sm text-muted-foreground">رقم الحساب</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Badge variant="outline" className="text-sm">
                    {getAccountTypeLabel(account.account_type)}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">نوع الحساب</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`text-xl font-bold ${account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatBalance(account.current_balance)}
                  </div>
                  <div className="text-sm text-muted-foreground">الرصيد الحالي</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-muted-foreground">
                    {formatBalance(account.opening_balance)}
                  </div>
                  <div className="text-sm text-muted-foreground">الرصيد الافتتاحي</div>
                </div>
              </div>

              {account.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-1">ملاحظات:</div>
                  <div className="text-sm text-muted-foreground">{account.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* التفاصيل والتحليلات */}
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions">المعاملات</TabsTrigger>
              <TabsTrigger value="analytics">التحليلات</TabsTrigger>
              <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                    <FileText className="w-5 h-5" />
                    آخر المعاملات ({transactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">جاري التحميل...</div>
                  ) : transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">الرصيد الجاري</TableHead>
                            <TableHead className="text-right">دائن</TableHead>
                            <TableHead className="text-right">مدين</TableHead>
                            <TableHead className="text-right">المرجع</TableHead>
                            <TableHead className="text-right">الوصف</TableHead>
                            <TableHead className="text-right">التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className={`text-right font-medium ${transaction.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatBalance(transaction.running_balance)}
                              </TableCell>
                              <TableCell className="text-right text-red-600">
                                {transaction.credit_amount > 0 ? formatBalance(transaction.credit_amount) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-green-600">
                                {transaction.debit_amount > 0 ? formatBalance(transaction.debit_amount) : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className="text-xs">
                                  {getReferenceTypeLabel(transaction.reference_type)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{transaction.description}</TableCell>
                              <TableCell className="text-right">
                                {new Date(transaction.date).toLocaleDateString('ar-KW')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد معاملات لهذا الحساب
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                      <TrendingUp className="w-5 h-5" />
                      إحصائيات الحساب
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">إجمالي المعاملات:</span>
                      <span className="font-medium">{analytics?.total_transactions || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">المتوسط الشهري:</span>
                      <span className="font-medium">{formatBalance(analytics?.average_monthly || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">أعلى رصيد:</span>
                      <span className="font-medium text-green-600">{formatBalance(analytics?.highest_balance || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">أقل رصيد:</span>
                      <span className="font-medium text-red-600">{formatBalance(analytics?.lowest_balance || 0)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
                      <Calendar className="w-5 h-5" />
                      الاتجاهات الشهرية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.monthly_trends && analytics.monthly_trends.length > 0 ? (
                      <div className="space-y-2">
                        {analytics.monthly_trends.slice(0, 6).map((trend, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{trend.month}:</span>
                            <span className={`font-medium ${trend.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatBalance(trend.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        لا توجد بيانات كافية للتحليل
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">إعدادات الحساب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">السماح بالترحيل:</span>
                      <Badge variant={account.allow_posting ? "default" : "secondary"}>
                        {account.allow_posting ? 'مسموح' : 'غير مسموح'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm font-medium">حالة الحساب:</span>
                      <Badge variant={account.is_active ? "default" : "secondary"}>
                        {account.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm font-medium">المستوى:</span>
                      <span className="text-sm text-muted-foreground">المستوى {account.level}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm font-medium">فئة الحساب:</span>
                      <span className="text-sm text-muted-foreground">{account.account_category}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button onClick={onClose}>إغلاق</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};