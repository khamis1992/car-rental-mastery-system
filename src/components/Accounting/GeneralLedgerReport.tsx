
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Calendar, Search, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  current_balance: number;
}

interface GeneralLedgerEntry {
  id: string;
  entry_date: string;
  entry_number: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
  reference_id?: string;
  reference_type?: string;
}

export const GeneralLedgerReport: React.FC = () => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [ledgerEntries, setLedgerEntries] = useState<GeneralLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Load ledger entries when account or date range changes
  useEffect(() => {
    if (selectedAccountId) {
      loadLedgerEntries();
    } else {
      setLedgerEntries([]);
    }
  }, [selectedAccountId, dateRange]);

  const loadAccounts = async () => {
    try {
      setAccountsLoading(true);
      setError(null);
      
      console.log('Loading accounts...');
      
      const { data, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type, current_balance')
        .eq('is_active', true)
        .eq('allow_posting', true)
        .order('account_code');

      if (accountsError) {
        console.error('Error loading accounts:', accountsError);
        throw new Error(`فشل في تحميل الحسابات: ${accountsError.message}`);
      }

      console.log('Accounts loaded successfully:', data?.length || 0);
      setAccounts(data || []);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف في تحميل الحسابات';
      console.error('Load accounts error:', errorMessage);
      setError(errorMessage);
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setAccountsLoading(false);
    }
  };

  const loadLedgerEntries = async () => {
    if (!selectedAccountId) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading ledger entries for account:', selectedAccountId);
      console.log('Date range:', dateRange);

      // Fixed query without problematic ordering
      const { data, error: ledgerError } = await supabase
        .from('journal_entry_details')
        .select(`
          id,
          debit_amount,
          credit_amount,
          description,
          reference_id,
          reference_type,
          journal_entries!inner (
            id,
            entry_number,
            entry_date,
            description
          )
        `)
        .eq('account_id', selectedAccountId)
        .gte('journal_entries.entry_date', dateRange.startDate)
        .lte('journal_entries.entry_date', dateRange.endDate)
        .order('created_at', { ascending: true });

      if (ledgerError) {
        console.error('Error loading ledger entries:', ledgerError);
        throw new Error(`فشل في تحميل بيانات دفتر الأستاذ: ${ledgerError.message}`);
      }

      console.log('Raw ledger data:', data);

      // Process and calculate running balance
      let runningBalance = 0;
      const processedEntries: GeneralLedgerEntry[] = (data || []).map((entry: any) => {
        const debitAmount = entry.debit_amount || 0;
        const creditAmount = entry.credit_amount || 0;
        runningBalance += (debitAmount - creditAmount);

        return {
          id: entry.id,
          entry_date: entry.journal_entries.entry_date,
          entry_number: entry.journal_entries.entry_number,
          description: entry.description || entry.journal_entries.description,
          debit_amount: debitAmount,
          credit_amount: creditAmount,
          running_balance: runningBalance,
          reference_id: entry.reference_id,
          reference_type: entry.reference_type
        };
      });

      console.log('Processed entries:', processedEntries.length);
      setLedgerEntries(processedEntries);
      
      toast({
        title: 'تم التحميل',
        description: `تم تحميل ${processedEntries.length} قيد محاسبي`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف في تحميل دفتر الأستاذ';
      console.error('Load ledger entries error:', errorMessage);
      setError(errorMessage);
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedAccountId) {
      loadLedgerEntries();
    } else {
      loadAccounts();
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(3);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-KW');
  };

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  if (accountsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <Search className="w-5 h-5" />
            فلاتر دفتر الأستاذ العام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="account">الحساب</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
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

            <div>
              <Label htmlFor="start_date">من تاريخ</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="end_date">إلى تاريخ</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleRefresh} 
                disabled={loading}
                className="rtl-flex"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Account Summary */}
      {selectedAccount && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">
              معلومات الحساب - {selectedAccount.account_code}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">اسم الحساب</p>
                <p className="font-semibold">{selectedAccount.account_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نوع الحساب</p>
                <p className="font-semibold">{selectedAccount.account_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                <p className={`font-semibold text-lg ${selectedAccount.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  د.ك {formatAmount(selectedAccount.current_balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Entries Table */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              حركة الحساب
            </div>
            {selectedAccount && (
              <span className="text-sm font-normal text-muted-foreground">
                {ledgerEntries.length} قيد
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          ) : !selectedAccountId ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">يرجى اختيار حساب لعرض حركته</p>
            </div>
          ) : ledgerEntries.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">لا توجد حركات للحساب في هذة الفترة</p>
              <p className="text-sm text-muted-foreground mt-2">جرب تغيير نطاق التاريخ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="text-center font-bold">الرصيد المتراكم</TableHead>
                    <TableHead className="text-center font-bold">دائن</TableHead>
                    <TableHead className="text-center font-bold">مدين</TableHead>
                    <TableHead className="text-center font-bold">البيان</TableHead>
                    <TableHead className="text-center font-bold">رقم القيد</TableHead>
                    <TableHead className="text-center font-bold">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">
                        <span className={entry.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          د.ك {formatAmount(Math.abs(entry.running_balance))}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.credit_amount > 0 && (
                          <span className="text-blue-600">د.ك {formatAmount(entry.credit_amount)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.debit_amount > 0 && (
                          <span className="text-green-600">د.ك {formatAmount(entry.debit_amount)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right max-w-xs">
                        <div className="truncate" title={entry.description}>
                          {entry.description}
                        </div>
                        {entry.reference_type && (
                          <div className="text-xs text-muted-foreground">
                            {entry.reference_type}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {entry.entry_number}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatDate(entry.entry_date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
