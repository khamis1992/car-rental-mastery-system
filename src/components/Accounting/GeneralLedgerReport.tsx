
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Search, Filter, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGeneralLedger } from '@/hooks/useGeneralLedger';
import { ErrorDisplay } from './ErrorDisplay';
import { AccountSelector } from './AccountSelector';
import type { GeneralLedgerEntry } from '@/services/accountingService';

export const GeneralLedgerReport: React.FC = () => {
  const {
    accounts,
    loading,
    error,
    selectedAccountId,
    startDate,
    endDate,
    searchTerm,
    setSelectedAccountId,
    setStartDate,
    setEndDate,
    setSearchTerm,
    loadLedgerEntries,
    clearError,
    filteredEntries,
    summary
  } = useGeneralLedger();
  
  const { toast } = useToast();

  const handleLoadEntries = async () => {
    if (!selectedAccountId) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار حساب أولاً",
        variant: "destructive",
      });
      return;
    }

    await loadLedgerEntries();
    
    if (summary.entriesCount > 0) {
      toast({
        title: "نجح التحميل",
        description: `تم تحميل ${summary.entriesCount} قيد محاسبي`,
      });
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-KW');
  };

  const getReferenceDisplay = (entry: GeneralLedgerEntry) => {
    if (!entry.reference_id || !entry.reference_type) return null;
    
    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'contracts': return 'عقد';
        case 'invoices': return 'فاتورة';
        case 'assets': return 'أصل';
        default: return type;
      }
    };

    return (
      <Badge variant="outline" className="text-xs">
        <ExternalLink className="w-3 h-3 ml-1" />
        {getTypeLabel(entry.reference_type)}
      </Badge>
    );
  };

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        title="خطأ في دفتر الأستاذ العام"
        onRetry={() => {
          clearError();
          if (selectedAccountId) {
            loadLedgerEntries();
          }
        }}
        showDetails={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <Filter className="w-5 h-5" />
            فلترة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="rtl-label">الحساب</Label>
              <AccountSelector
                accounts={accounts}
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
                placeholder="اختر الحساب"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label className="rtl-label">من تاريخ</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="rtl-label">إلى تاريخ</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="rtl-label">بحث</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في الوصف أو رقم القيد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-start mt-4">
            <Button 
              onClick={handleLoadEntries} 
              disabled={loading || !selectedAccountId}
              className="rtl-flex"
            >
              {loading ? 'جاري التحميل...' : 'عرض البيانات'}
              <CalendarIcon className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Summary */}
      {selectedAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title">ملخص الحساب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">اسم الحساب</div>
                <div className="font-semibold">{selectedAccount.account_name}</div>
                <div className="text-xs text-muted-foreground">{selectedAccount.account_code}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">إجمالي المدين</div>
                <div className="font-semibold text-green-600">{formatCurrency(summary.totalDebit)}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">إجمالي الدائن</div>
                <div className="font-semibold text-red-600">{formatCurrency(summary.totalCredit)}</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">الرصيد النهائي</div>
                <div className={`font-semibold ${summary.finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.finalBalance)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">
            حركة الحساب
            {summary.entriesCount > 0 && (
              <Badge variant="secondary" className="mr-2">
                {summary.entriesCount} قيد
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedAccountId ? 'لا توجد قيود محاسبية في الفترة المحددة' : 'يرجى اختيار حساب للعرض'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3">التاريخ</th>
                    <th className="text-right p-3">رقم القيد</th>
                    <th className="text-right p-3">الوصف</th>
                    <th className="text-right p-3">مدين</th>
                    <th className="text-right p-3">دائن</th>
                    <th className="text-right p-3">الرصيد</th>
                    <th className="text-right p-3">المرجع</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">{formatDate(entry.entry_date)}</td>
                      <td className="p-3 text-sm font-mono">{entry.entry_number}</td>
                      <td className="p-3 text-sm">{entry.description}</td>
                      <td className="p-3 text-sm text-green-600">
                        {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                      </td>
                      <td className="p-3 text-sm text-red-600">
                        {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                      </td>
                      <td className={`p-3 text-sm font-medium ${entry.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(entry.running_balance)}
                      </td>
                      <td className="p-3 text-sm">
                        {getReferenceDisplay(entry)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
