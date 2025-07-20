
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, BookOpen, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGeneralLedger } from '@/hooks/useGeneralLedger';
import { ErrorDisplay } from './ErrorDisplay';
import { AccountSelector } from './AccountSelector';
import { EnhancedGeneralLedgerTable } from './EnhancedGeneralLedgerTable';

export const GeneralLedgerReport: React.FC = () => {
  const {
    accounts,
    loading,
    error,
    selectedAccountId,
    startDate,
    endDate,
    setSelectedAccountId,
    setStartDate,
    setEndDate,
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
            <BookOpen className="w-5 h-5" />
            فلترة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Enhanced Ledger Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              حركة الحساب
            </div>
            {summary.entriesCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                {summary.entriesCount} قيد محاسبي
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 && !selectedAccountId ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                اختر حساباً للبدء
              </h3>
              <p className="text-sm text-muted-foreground">
                يرجى اختيار حساب من القائمة أعلاه لعرض حركة الحساب
              </p>
            </div>
          ) : (
            <EnhancedGeneralLedgerTable 
              entries={filteredEntries} 
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
