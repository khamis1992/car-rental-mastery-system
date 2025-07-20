
import React from 'react';
import { useGeneralLedger } from '@/hooks/useGeneralLedger';
import { AccountSelector } from './AccountSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Download, Search, Filter, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ErrorDisplay } from './ErrorDisplay';
import { AccountingErrorBoundary } from './AccountingErrorBoundary';

export const GeneralLedgerReport: React.FC = () => {
  const {
    accounts,
    entries,
    loading,
    accountsLoading,
    entriesLoading,
    error,
    accountsError,
    entriesError,
    selectedAccountId,
    startDate,
    endDate,
    searchTerm,
    setSelectedAccountId,
    setStartDate,
    setEndDate,
    setSearchTerm,
    loadAccounts,
    loadLedgerEntries,
    clearAccountsError,
    clearEntriesError,
    filteredEntries,
    summary
  } = useGeneralLedger();

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0.000';
    return new Intl.NumberFormat('ar-KW', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return dateString;
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    clearEntriesError();
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
    clearEntriesError();
  };

  const handleLoadEntries = () => {
    loadLedgerEntries();
  };

  const handleRetryLoadAccounts = () => {
    clearAccountsError();
    loadAccounts();
  };

  const handleRetryLoadEntries = () => {
    clearEntriesError();
    loadLedgerEntries();
  };

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  return (
    <AccountingErrorBoundary>
      <div className="space-y-6">
        {/* عوامل التصفية */}
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title flex items-center gap-2">
              <Filter className="w-5 h-5" />
              عوامل التصفية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* خطأ في تحميل الحسابات */}
            {accountsError && (
              <ErrorDisplay
                error={accountsError}
                title="خطأ في تحميل الحسابات"
                onRetry={handleRetryLoadAccounts}
                className="mb-4"
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* اختيار الحساب */}
              <div className="space-y-2">
                <Label className="rtl-label">الحساب</Label>
                <AccountSelector
                  accounts={accounts}
                  value={selectedAccountId}
                  onValueChange={handleAccountChange}
                  placeholder="اختر الحساب..."
                  loading={accountsLoading}
                  error={accountsError}
                  onRetry={handleRetryLoadAccounts}
                  showBalance={true}
                />
              </div>

              {/* تاريخ البداية */}
              <div className="space-y-2">
                <Label className="rtl-label">من تاريخ</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="text-right"
                />
              </div>

              {/* تاريخ النهاية */}
              <div className="space-y-2">
                <Label className="rtl-label">إلى تاريخ</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="text-right"
                />
              </div>
            </div>

            {/* البحث والأزرار */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label className="rtl-label">البحث</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="search"
                    placeholder="ابحث في الوصف أو رقم القيد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-right pr-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleLoadEntries}
                  disabled={!selectedAccountId || entriesLoading}
                  className="rtl-flex"
                >
                  {entriesLoading ? 'جاري التحميل...' : 'عرض البيانات'}
                </Button>
                
                <Button variant="outline" className="rtl-flex">
                  <Download className="w-4 h-4" />
                  تصدير
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* معلومات الحساب المحدد */}
        {selectedAccount && (
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title">معلومات الحساب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">كود الحساب</div>
                  <div className="font-bold">{selectedAccount.account_code}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">اسم الحساب</div>
                  <div className="font-bold">{selectedAccount.account_name}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">نوع الحساب</div>
                  <div className="font-bold">{selectedAccount.account_type}</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">الرصيد الحالي</div>
                  <div className="font-bold">{formatCurrency(selectedAccount.current_balance)} د.ك</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* خطأ في تحميل القيود */}
        {entriesError && (
          <ErrorDisplay
            error={entriesError}
            title="خطأ في تحميل بيانات دفتر الأستاذ"
            onRetry={handleRetryLoadEntries}
          />
        )}

        {/* ملخص الحركات */}
        {filteredEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title">ملخص الحركات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">إجمالي المدين</div>
                  <div className="font-bold text-green-600">{formatCurrency(summary.totalDebit)} د.ك</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">إجمالي الدائن</div>
                  <div className="font-bold text-red-600">{formatCurrency(summary.totalCredit)} د.ك</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">الرصيد النهائي</div>
                  <div className="font-bold text-blue-600">{formatCurrency(summary.finalBalance)} د.ك</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">عدد القيود</div>
                  <div className="font-bold">{summary.entriesCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* جدول البيانات */}
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title">حركات الحساب</CardTitle>
          </CardHeader>
          <CardContent>
            {entriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="mr-2">جاري تحميل البيانات...</span>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {!selectedAccountId ? (
                  <>
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p>يرجى اختيار حساب لعرض حركاته</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p>لا توجد حركات في الفترة المحددة</p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">رقم القيد</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">مدين</TableHead>
                      <TableHead className="text-right">دائن</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-right">
                          {formatDate(entry.entry_date)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.entry_number}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.description}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(entry.running_balance)}
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
    </AccountingErrorBoundary>
  );
};
