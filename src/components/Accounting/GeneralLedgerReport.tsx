import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { BookOpen, Search, Download, Filter, Calendar } from 'lucide-react';
import { ChartOfAccount } from '@/types/accounting';
import { accountingService } from '@/services/accountingService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneralLedgerEntry {
  id: string;
  date: string;
  entry_number: string;
  description: string;
  reference_type: string;
  reference_id: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
}

interface GeneralLedgerFilters {
  account_id: string;
  start_date: string;
  end_date: string;
  reference_type: string;
}

export const GeneralLedgerReport = () => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<GeneralLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
  const { toast } = useToast();

  const [filters, setFilters] = useState<GeneralLedgerFilters>({
    account_id: '',
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // بداية السنة
    end_date: new Date().toISOString().split('T')[0], // اليوم
    reference_type: 'all'
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (filters.account_id) {
      loadGeneralLedger();
    }
  }, [filters]);

  const loadAccounts = async () => {
    try {
      const data = await accountingService.getChartOfAccounts();
      const activeAccounts = data.filter(account => account.is_active && account.allow_posting);
      setAccounts(activeAccounts);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الحسابات',
        variant: 'destructive',
      });
    }
  };

  const loadGeneralLedger = async () => {
    if (!filters.account_id) return;

    setLoading(true);
    try {
      // العثور على الحساب المحدد
      const account = accounts.find(acc => acc.id === filters.account_id);
      setSelectedAccount(account || null);

      // جلب قيود اليومية للحساب
      let query = supabase
        .from('journal_entry_lines')
        .select(`
          *,
          journal_entries!inner(
            entry_number,
            entry_date,
            description,
            reference_type,
            reference_id,
            status
          )
        `)
        .eq('account_id', filters.account_id)
        .eq('journal_entries.status', 'posted')
        .gte('journal_entries.entry_date', filters.start_date)
        .lte('journal_entries.entry_date', filters.end_date)
        .order('journal_entries.entry_date', { ascending: true });

      if (filters.reference_type !== 'all') {
        query = query.eq('journal_entries.reference_type', filters.reference_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      // تحويل البيانات وحساب الرصيد الجاري
      let runningBalance = account?.opening_balance || 0;
      const formattedEntries: GeneralLedgerEntry[] = (data || []).map((item: any) => {
        const netAmount = item.debit_amount - item.credit_amount;
        runningBalance += netAmount;
        
        return {
          id: item.id,
          date: item.journal_entries.entry_date,
          entry_number: item.journal_entries.entry_number,
          description: item.description || item.journal_entries.description,
          reference_type: item.journal_entries.reference_type || 'general',
          reference_id: item.journal_entries.reference_id || '',
          debit_amount: item.debit_amount || 0,
          credit_amount: item.credit_amount || 0,
          running_balance: runningBalance
        };
      });

      setLedgerEntries(formattedEntries);

    } catch (error) {
      console.error('Error loading general ledger:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل دفتر الأستاذ العام',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof GeneralLedgerFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatBalance = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const getReferenceTypeLabel = (type: string) => {
    const labels = {
      contract: 'عقد',
      invoice: 'فاتورة',
      payment: 'دفعة',
      expense_voucher: 'سند مصروفات',
      receipt_voucher: 'سند قبض',
      general: 'عام',
      all: 'جميع الأنواع'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const downloadHTML = () => {
    if (ledgerEntries.length === 0) {
      toast({
        title: 'تنبيه',
        description: 'لا توجد بيانات للتحميل',
        variant: 'destructive',
      });
      return;
    }

    // حساب الإجماليات محلياً
    const totalDebits = ledgerEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
    const totalCredits = ledgerEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
    const netMovement = totalDebits - totalCredits;

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دفتر الأستاذ العام - ${selectedAccount?.account_name}</title>
    <style>
        body { font-family: Arial, sans-serif; direction: rtl; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .account-info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .debit { color: #16a34a; }
        .credit { color: #dc2626; }
        .balance-positive { color: #16a34a; font-weight: bold; }
        .balance-negative { color: #dc2626; font-weight: bold; }
        .totals { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .print-date { text-align: left; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>دفتر الأستاذ العام</h1>
        <h2>${selectedAccount?.account_name} (${selectedAccount?.account_code})</h2>
        <p>من ${filters.start_date} إلى ${filters.end_date}</p>
    </div>
    
    <div class="account-info">
        <div class="total-row">
            <strong>اسم الحساب:</strong>
            <span>${selectedAccount?.account_name}</span>
        </div>
        <div class="total-row">
            <strong>رقم الحساب:</strong>
            <span>${selectedAccount?.account_code}</span>
        </div>
        <div class="total-row">
            <strong>نوع الحساب:</strong>
            <span>${selectedAccount?.account_type}</span>
        </div>
        <div class="total-row">
            <strong>الرصيد الحالي:</strong>
            <span class="${selectedAccount?.current_balance >= 0 ? 'balance-positive' : 'balance-negative'}">
                ${formatBalance(selectedAccount?.current_balance || 0)}
            </span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>التاريخ</th>
                <th>رقم القيد</th>
                <th>الوصف</th>
                <th>المرجع</th>
                <th>مدين</th>
                <th>دائن</th>
                <th>الرصيد الجاري</th>
            </tr>
        </thead>
        <tbody>
            ${ledgerEntries.map(entry => `
                <tr>
                    <td>${new Date(entry.date).toLocaleDateString('ar-KW')}</td>
                    <td>${entry.entry_number}</td>
                    <td>${entry.description}</td>
                    <td>${getReferenceTypeLabel(entry.reference_type)}</td>
                    <td class="debit">${entry.debit_amount > 0 ? formatBalance(entry.debit_amount) : '-'}</td>
                    <td class="credit">${entry.credit_amount > 0 ? formatBalance(entry.credit_amount) : '-'}</td>
                    <td class="${entry.running_balance >= 0 ? 'balance-positive' : 'balance-negative'}">
                        ${formatBalance(entry.running_balance)}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <h3>الإجماليات</h3>
        <div class="total-row">
            <strong>إجمالي المدين:</strong>
            <span class="debit">${formatBalance(totalDebits)}</span>
        </div>
        <div class="total-row">
            <strong>إجمالي الدائن:</strong>
            <span class="credit">${formatBalance(totalCredits)}</span>
        </div>
        <div class="total-row">
            <strong>صافي الحركة:</strong>
            <span class="${netMovement >= 0 ? 'balance-positive' : 'balance-negative'}">
                ${formatBalance(netMovement)}
            </span>
        </div>
        <div class="total-row">
            <strong>عدد القيود:</strong>
            <span>${ledgerEntries.length}</span>
        </div>
    </div>

    <div class="print-date">
        تاريخ الطباعة: ${new Date().toLocaleDateString('ar-KW')} ${new Date().toLocaleTimeString('ar-KW')}
    </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `دفتر_الأستاذ_العام_${selectedAccount?.account_name}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    toast({
      title: 'تم التحميل',
      description: 'تم تحميل تقرير دفتر الأستاذ العام بصيغة HTML',
    });
  };

  const calculateTotals = () => {
    const totalDebits = ledgerEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
    const totalCredits = ledgerEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
    const netMovement = totalDebits - totalCredits;
    
    return { totalDebits, totalCredits, netMovement };
  };

  const totals = calculateTotals();

  return (
    <Card className="card-elegant">
      <CardHeader>
        <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
          <BookOpen className="w-5 h-5" />
          دفتر الأستاذ العام
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* فلاتر البحث */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-right text-lg flex items-center gap-2 flex-row-reverse">
              <Filter className="w-4 h-4" />
              فلاتر البحث
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_select">الحساب</Label>
                <Select 
                  value={filters.account_id} 
                  onValueChange={(value) => handleFilterChange('account_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">من تاريخ</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">إلى تاريخ</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_type">نوع المرجع</Label>
                <Select 
                  value={filters.reference_type} 
                  onValueChange={(value) => handleFilterChange('reference_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="نوع المرجع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="contract">عقود</SelectItem>
                    <SelectItem value="invoice">فواتير</SelectItem>
                    <SelectItem value="payment">دفعات</SelectItem>
                    <SelectItem value="expense_voucher">سندات مصروفات</SelectItem>
                    <SelectItem value="receipt_voucher">سندات قبض</SelectItem>
                    <SelectItem value="general">عام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* معلومات الحساب المحدد */}
        {selectedAccount && (
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{selectedAccount.account_code}</div>
                  <div className="text-sm text-muted-foreground">رقم الحساب</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{selectedAccount.account_name}</div>
                  <div className="text-sm text-muted-foreground">اسم الحساب</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${selectedAccount.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatBalance(selectedAccount.current_balance)}
                  </div>
                  <div className="text-sm text-muted-foreground">الرصيد الحالي</div>
                </div>
                <div className="text-center">
                  <Badge variant="outline">{selectedAccount.account_type}</Badge>
                  <div className="text-sm text-muted-foreground mt-1">نوع الحساب</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* أزرار التحكم */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              onClick={downloadHTML}
              disabled={ledgerEntries.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            إجمالي القيود: {ledgerEntries.length}
          </div>
        </div>

        {/* جدول دفتر الأستاذ */}
        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : ledgerEntries.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الرصيد الجاري</TableHead>
                    <TableHead className="text-right">دائن</TableHead>
                    <TableHead className="text-right">مدين</TableHead>
                    <TableHead className="text-right">المرجع</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">رقم القيد</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className={`text-right font-medium ${entry.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatBalance(entry.running_balance)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {entry.credit_amount > 0 ? formatBalance(entry.credit_amount) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {entry.debit_amount > 0 ? formatBalance(entry.debit_amount) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {getReferenceTypeLabel(entry.reference_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">{entry.entry_number}</TableCell>
                      <TableCell className="text-right">
                        {new Date(entry.date).toLocaleDateString('ar-KW')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* إجماليات */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{formatBalance(totals.totalDebits)}</div>
                    <div className="text-sm text-muted-foreground">إجمالي المدين</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">{formatBalance(totals.totalCredits)}</div>
                    <div className="text-sm text-muted-foreground">إجمالي الدائن</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${totals.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatBalance(totals.netMovement)}
                    </div>
                    <div className="text-sm text-muted-foreground">صافي الحركة</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${selectedAccount?.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatBalance(selectedAccount?.current_balance || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">الرصيد النهائي</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : filters.account_id ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد قيود للحساب المحدد في الفترة المختارة
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            يرجى اختيار حساب لعرض دفتر الأستاذ العام
          </div>
        )}
      </CardContent>
    </Card>
  );
};