import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Link, Unlink, Check, X, FileText } from 'lucide-react';
import { BankReconciliationService } from '@/services/bankReconciliationService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ImportedBankTransaction, MatchSuggestion } from '@/types/bankReconciliation';

interface MatchTransactionsTabProps {
  selectedBankAccount: string;
  onMatchComplete: () => void;
}

export const MatchTransactionsTab: React.FC<MatchTransactionsTabProps> = ({
  selectedBankAccount,
  onMatchComplete
}) => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<ImportedBankTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ImportedBankTransaction | null>(null);
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([]);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [manualMatchAmount, setManualMatchAmount] = useState<number>(0);
  const [manualMatchNotes, setManualMatchNotes] = useState('');

  // تحميل المعاملات غير المطابقة
  const loadUnmatchedTransactions = async () => {
    if (!selectedBankAccount) return;

    try {
      setLoading(true);
      
      // جلب آخر استيراد للحساب البنكي
      const { data: lastImport } = await supabase
        .from('bank_reconciliation_imports')
        .select('id')
        .eq('bank_account_id', selectedBankAccount)
        .eq('import_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastImport) {
        setTransactions([]);
        return;
      }

      const importedTransactions = await BankReconciliationService.getImportedTransactions(lastImport.id);
      setTransactions(importedTransactions.filter(t => !t.is_matched));
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المعاملات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnmatchedTransactions();
  }, [selectedBankAccount]);

  // البحث عن مطابقات محتملة
  const findMatches = async (transaction: ImportedBankTransaction) => {
    try {
      setSelectedTransaction(transaction);
      setManualMatchAmount(transaction.debit_amount || transaction.credit_amount);
      
      const suggestions = await BankReconciliationService.findPotentialMatches(transaction.id);
      setMatchSuggestions(suggestions);
      setMatchDialogOpen(true);
    } catch (error) {
      console.error('Error finding matches:', error);
      toast({
        title: "خطأ",
        description: "فشل في البحث عن المطابقات",
        variant: "destructive",
      });
    }
  };

  // تنفيذ المطابقة اليدوية
  const executeManualMatch = async (journalEntryId: string) => {
    if (!selectedTransaction) return;

    try {
      await BankReconciliationService.createManualMatch(
        selectedTransaction.id,
        journalEntryId,
        manualMatchAmount,
        manualMatchNotes
      );

      toast({
        title: "تمت المطابقة",
        description: "تم ربط المعاملة بنجاح",
      });

      setMatchDialogOpen(false);
      loadUnmatchedTransactions();
      onMatchComplete();
    } catch (error: any) {
      console.error('Error creating match:', error);
      toast({
        title: "خطأ في المطابقة",
        description: error.message || "فشل في ربط المعاملة",
        variant: "destructive",
      });
    }
  };

  // تنسيق المبلغ
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3
    }).format(amount);
  };

  // تحديد نوع المعاملة
  const getTransactionType = (transaction: ImportedBankTransaction) => {
    return transaction.debit_amount > 0 ? 'مدين' : 'دائن';
  };

  // الحصول على مستوى الثقة
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'عالية', color: 'text-success' };
    if (confidence >= 0.5) return { label: 'متوسطة', color: 'text-warning' };
    return { label: 'منخفضة', color: 'text-destructive' };
  };

  return (
    <div className="space-y-6">
      {/* المعاملات غير المطابقة */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2 flex-row-reverse">
            <Search className="w-5 h-5" />
            المعاملات غير المطابقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-right">المرجع</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.transaction_date).toLocaleDateString('ar-SA')}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.reference_number || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.debit_amount > 0 ? 'destructive' : 'default'}>
                      {getTransactionType(transaction)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatAmount(transaction.debit_amount || transaction.credit_amount)}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => findMatches(transaction)}
                      className="rtl-flex"
                    >
                      <Link className="w-4 h-4" />
                      مطابقة
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {selectedBankAccount ? 'جميع المعاملات مطابقة' : 'يرجى اختيار حساب بنكي'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* حوار المطابقة */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="rtl-title">مطابقة المعاملة البنكية</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* تفاصيل المعاملة */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">تفاصيل المعاملة البنكية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>التاريخ:</strong> {new Date(selectedTransaction.transaction_date).toLocaleDateString('ar-SA')}</div>
                    <div><strong>المبلغ:</strong> {formatAmount(selectedTransaction.debit_amount || selectedTransaction.credit_amount)}</div>
                    <div><strong>الوصف:</strong> {selectedTransaction.description}</div>
                    <div><strong>المرجع:</strong> {selectedTransaction.reference_number || '-'}</div>
                  </div>
                </CardContent>
              </Card>

              {/* المطابقات المقترحة */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">المطابقات المقترحة</CardTitle>
                </CardHeader>
                <CardContent>
                  {matchSuggestions[0]?.suggested_matches.length > 0 ? (
                    <div className="space-y-2">
                      {matchSuggestions[0].suggested_matches.map((match, index) => {
                        const confidenceLevel = getConfidenceLevel(match.confidence);
                        return (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">قيد محاسبي #{match.journal_entry_id.slice(-8)}</p>
                                <p className="text-sm text-muted-foreground">
                                  مستوى الثقة: <span className={confidenceLevel.color}>{confidenceLevel.label}</span> ({(match.confidence * 100).toFixed(0)}%)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  الأسباب: {match.reasons.join(', ')}
                                </p>
                              </div>
                              <Button 
                                size="sm"
                                onClick={() => executeManualMatch(match.journal_entry_id)}
                                className="rtl-flex"
                              >
                                <Check className="w-4 h-4" />
                                مطابقة
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      لا توجد مطابقات مقترحة تلقائياً
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* مطابقة يدوية */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">مطابقة يدوية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manual-amount">مبلغ المطابقة</Label>
                      <Input
                        id="manual-amount"
                        type="number"
                        value={manualMatchAmount}
                        onChange={(e) => setManualMatchAmount(parseFloat(e.target.value) || 0)}
                        step="0.001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="journal-entry-id">رقم القيد المحاسبي</Label>
                      <Input
                        id="journal-entry-id"
                        placeholder="أدخل رقم القيد المحاسبي"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="match-notes">ملاحظات المطابقة</Label>
                    <Textarea
                      id="match-notes"
                      value={manualMatchNotes}
                      onChange={(e) => setManualMatchNotes(e.target.value)}
                      placeholder="ملاحظات اختيارية حول المطابقة"
                    />
                  </div>

                  <Button 
                    className="w-full rtl-flex"
                    onClick={() => {
                      const journalEntryInput = document.getElementById('journal-entry-id') as HTMLInputElement;
                      if (journalEntryInput?.value) {
                        executeManualMatch(journalEntryInput.value);
                      } else {
                        toast({
                          title: "خطأ",
                          description: "يرجى إدخال رقم القيد المحاسبي",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Link className="w-4 h-4" />
                    تنفيذ المطابقة اليدوية
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};