import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Calculator, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { accountingService } from '@/services/accountingService';
import { ChartOfAccount } from '@/types/accounting';

interface JournalLine {
  id?: string;
  account_id: string;
  account_name?: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  line_number: number;
}

export const SimpleJournalEntries = () => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    { account_id: '', description: '', debit_amount: 0, credit_amount: 0, line_number: 1 },
    { account_id: '', description: '', debit_amount: 0, credit_amount: 0, line_number: 2 }
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await accountingService.getChartOfAccounts();
      setAccounts(data.filter(acc => acc.allow_posting && acc.is_active));
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        account_id: '',
        description: '',
        debit_amount: 0,
        credit_amount: 0,
        line_number: lines.length + 1
      }
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      const newLines = lines.filter((_, i) => i !== index);
      setLines(newLines.map((line, i) => ({ ...line, line_number: i + 1 })));
    }
  };

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...lines];
    
    if (field === 'account_id') {
      const selectedAccount = accounts.find(acc => acc.id === value);
      newLines[index] = { 
        ...newLines[index], 
        [field]: value,
        account_name: selectedAccount?.account_name || ''
      };
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }
    
    setLines(newLines);
  };

  const getTotalDebit = () => {
    return lines.reduce((sum, line) => sum + (Number(line.debit_amount) || 0), 0);
  };

  const getTotalCredit = () => {
    return lines.reduce((sum, line) => sum + (Number(line.credit_amount) || 0), 0);
  };

  const isBalanced = () => {
    const debit = getTotalDebit();
    const credit = getTotalCredit();
    return Math.abs(debit - credit) < 0.01 && debit > 0 && credit > 0;
  };

  const handleSave = async () => {
    if (!isBalanced()) {
      toast({
        title: 'خطأ في التوازن',
        description: 'إجمالي المدين يجب أن يساوي إجمالي الدائن',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى إدخال وصف للقيد',
        variant: 'destructive',
      });
      return;
    }

    const validLines = lines.filter(line => 
      line.account_id && (line.debit_amount > 0 || line.credit_amount > 0)
    );

    if (validLines.length < 2) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يجب إضافة سطرين صحيحين على الأقل',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // إنشاء القيد الرئيسي
      const entry = await accountingService.createJournalEntry({
        entry_date: journalDate,
        description: description.trim(),
        reference_type: 'manual',
        reference_id: reference.trim() || undefined,
        total_debit: getTotalDebit(),
        total_credit: getTotalCredit(),
        status: 'draft'
      });

      // إضافة السطور
      for (const line of validLines) {
        await accountingService.createJournalEntryLine({
          journal_entry_id: entry.id,
          account_id: line.account_id,
          description: line.description.trim() || description.trim(),
          debit_amount: Number(line.debit_amount) || 0,
          credit_amount: Number(line.credit_amount) || 0,
          line_number: line.line_number
        });
      }

      toast({
        title: 'تم الحفظ بنجاح',
        description: `تم إنشاء القيد رقم ${entry.entry_number}`,
      });

      // إعادة تعيين النموذج
      resetForm();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: 'فشل في حفظ القيد المحاسبي',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setReference('');
    setJournalDate(new Date().toISOString().split('T')[0]);
    setLines([
      { account_id: '', description: '', debit_amount: 0, credit_amount: 0, line_number: 1 },
      { account_id: '', description: '', debit_amount: 0, credit_amount: 0, line_number: 2 }
    ]);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6 bg-background">
      <Card>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-xl font-bold flex items-center gap-2 rtl-flex">
            <FileText className="w-5 h-5" />
            قيد محاسبي جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* معلومات القيد الأساسية */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
            <div>
              <Label htmlFor="journal_date" className="text-sm font-medium">تاريخ القيد</Label>
              <Input
                id="journal_date"
                type="date"
                value={journalDate}
                onChange={(e) => setJournalDate(e.target.value)}
                className="text-right"
              />
            </div>
            <div>
              <Label htmlFor="reference" className="text-sm font-medium">رقم المرجع</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="رقم المرجع (اختياري)"
                className="text-right"
              />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="description" className="text-sm font-medium">وصف القيد</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف القيد المحاسبي"
                className="text-right resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* جدول السطور */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right w-20">إجراء</TableHead>
                  <TableHead className="text-right w-32">دائن</TableHead>
                  <TableHead className="text-right w-32">مدين</TableHead>
                  <TableHead className="text-right min-w-[200px]">الوصف</TableHead>
                  <TableHead className="text-right min-w-[250px]">الحساب</TableHead>
                  <TableHead className="text-right w-16">#</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={index} className="hover:bg-muted/20">
                    <TableCell className="text-right">
                      {lines.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={line.credit_amount || ''}
                        onChange={(e) => updateLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                        className="text-right font-mono"
                        placeholder="0.000"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={line.debit_amount || ''}
                        onChange={(e) => updateLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                        className="text-right font-mono"
                        placeholder="0.000"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        placeholder="وصف السطر"
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={line.account_id} 
                        onValueChange={(value) => updateLine(index, 'account_id', value)}
                      >
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر الحساب" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="text-right">
                                <div className="font-medium">{account.account_name}</div>
                                <div className="text-sm text-muted-foreground">{account.account_code}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {line.line_number}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* صف الإجماليات */}
                <TableRow className="bg-muted/40 font-bold border-t-2">
                  <TableCell></TableCell>
                  <TableCell className="text-right text-blue-600">
                    {formatAmount(getTotalCredit())}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatAmount(getTotalDebit())}
                  </TableCell>
                  <TableCell className="text-right">الإجمالي</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* شريط الأدوات */}
          <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg">
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!isBalanced() || loading}
                className={`${isBalanced() ? 'bg-green-600 hover:bg-green-700' : 'bg-muted'} text-white`}
              >
                <Save className="w-4 h-4 ml-2" />
                {loading ? 'جاري الحفظ...' : 'حفظ القيد'}
              </Button>
              <Button onClick={addLine} variant="outline">
                <Plus className="w-4 h-4 ml-2" />
                إضافة سطر
              </Button>
              <Button onClick={resetForm} variant="outline">
                <X className="w-4 h-4 ml-2" />
                مسح الكل
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span className={`font-medium ${isBalanced() ? 'text-green-600' : 'text-red-600'}`}>
                  الفرق: {formatAmount(Math.abs(getTotalDebit() - getTotalCredit()))}
                </span>
              </div>
              {isBalanced() && (
                <div className="text-green-600 font-medium">✓ متوازن</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};