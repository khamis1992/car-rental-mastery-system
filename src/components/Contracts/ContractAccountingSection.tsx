import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, Calculator, FileText, DollarSign } from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { contractAccountingService } from '@/services/contractAccountingService';

interface ContractAccountingSectionProps {
  contractId: string;
  contract: any;
  onRefresh?: () => void;
}

export const ContractAccountingSection: React.FC<ContractAccountingSectionProps> = ({
  contractId,
  contract,
  onRefresh
}) => {
  const [accountingEntries, setAccountingEntries] = useState<any[]>([]);
  const [journalEntry, setJournalEntry] = useState<any>(null);
  const [hasEntries, setHasEntries] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAccountingData();
  }, [contractId]);

  const loadAccountingData = async () => {
    try {
      setLoading(true);
      const [entries, journal, hasEntriesResult] = await Promise.all([
        contractAccountingService.getContractAccountingEntries(contractId),
        contractAccountingService.getContractJournalEntry(contractId),
        contractAccountingService.hasAccountingEntries(contractId)
      ]);
      
      setAccountingEntries(entries);
      setJournalEntry(journal);
      setHasEntries(hasEntriesResult);
    } catch (error) {
      console.error('خطأ في تحميل البيانات المحاسبية:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل البيانات المحاسبية',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccountingEntry = async () => {
    try {
      setLoading(true);
      
      const contractData = {
        contract_id: contractId,
        customer_name: contract.customers?.name || 'غير محدد',
        vehicle_info: contract.vehicles ? 
          `${contract.vehicles.make} ${contract.vehicles.model} - ${contract.vehicles.vehicle_number}` : 'غير محدد',
        contract_number: contract.contract_number,
        total_amount: contract.total_amount || 0,
        security_deposit: contract.security_deposit || 0,
        insurance_amount: contract.insurance_amount || 0,
        tax_amount: contract.tax_amount || 0,
        discount_amount: contract.discount_amount || 0,
        start_date: contract.start_date,
        end_date: contract.end_date
      };

      await contractAccountingService.createContractAccountingEntry(contractData);
      
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء القيد المحاسبي للعقد'
      });
      
      await loadAccountingData();
      onRefresh?.();
    } catch (error) {
      console.error('خطأ في إنشاء القيد المحاسبي:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء القيد المحاسبي',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
            <Calculator className="h-5 w-5" />
            المعالجة المحاسبية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
          <Calculator className="h-5 w-5" />
          المعالجة المحاسبية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* حالة القيود المحاسبية */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 flex-row-reverse mb-3">
            {hasEntries ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700 font-medium">تم إنشاء القيود المحاسبية</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span className="text-orange-700 font-medium">لم يتم إنشاء قيود محاسبية بعد</span>
              </>
            )}
          </div>
          
          {!hasEntries && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground text-right space-y-1">
                <p>• سيتم إنشاء قيد محاسبي يتضمن:</p>
                <p>• تسجيل مديونية العميل</p>
                <p>• تسجيل إيرادات التأجير</p>
                <p>• تسجيل العربون المستلم</p>
                <p>• تسجيل الضرائب والتأمين</p>
              </div>
              <Button 
                onClick={handleCreateAccountingEntry}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'جاري الإنشاء...' : 'إنشاء القيد المحاسبي'}
              </Button>
            </div>
          )}
        </div>

        {/* تفاصيل المبالغ */}
        {hasEntries && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-right">تفاصيل المبالغ المحاسبية</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">إجمالي العقد:</span>
                <div className="font-medium">{formatCurrencyKWD(contract.total_amount || 0)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">المبلغ النهائي:</span>
                <div className="font-medium text-green-600">{formatCurrencyKWD(contract.final_amount || 0)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">العربون:</span>
                <div className="font-medium">{formatCurrencyKWD(contract.security_deposit || 0)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">التأمين:</span>
                <div className="font-medium">{formatCurrencyKWD(contract.insurance_amount || 0)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">الخصم:</span>
                <div className="font-medium text-red-600">{formatCurrencyKWD(contract.discount_amount || 0)}</div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">الضرائب:</span>
                <div className="font-medium">{formatCurrencyKWD(contract.tax_amount || 0)}</div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* القيود المحاسبية */}
        {accountingEntries.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-right">القيود المحاسبية</h3>
            <div className="space-y-3">
              {accountingEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={entry.entry_type === 'revenue_recognition' ? 'default' : 'secondary'}>
                        {entry.entry_type === 'revenue_recognition' ? 'إقرار إيراد' :
                         entry.entry_type === 'collection' ? 'تحصيل' :
                         entry.entry_type === 'deposit' ? 'عربون' : entry.entry_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">{formatCurrencyKWD(entry.amount)}</span>
                    </div>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground mt-2 text-right">{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* معلومات القيد المحاسبي */}
        {journalEntry && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-right">تفاصيل القيد المحاسبي</h3>
            <div className="border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">رقم القيد:</span>
                  <div className="font-medium">{journalEntry.entry_number}</div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">تاريخ القيد:</span>
                  <div className="font-medium">
                    {new Date(journalEntry.entry_date).toLocaleDateString('ar-SA')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">إجمالي المدين:</span>
                  <div className="font-medium">{formatCurrencyKWD(journalEntry.total_debit)}</div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">إجمالي الدائن:</span>
                  <div className="font-medium">{formatCurrencyKWD(journalEntry.total_credit)}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">الوصف:</span>
                <div className="font-medium">{journalEntry.description}</div>
              </div>
              <Badge variant={journalEntry.status === 'posted' ? 'default' : 'secondary'} className="mt-2">
                {journalEntry.status === 'posted' ? 'مرحل' : journalEntry.status}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};