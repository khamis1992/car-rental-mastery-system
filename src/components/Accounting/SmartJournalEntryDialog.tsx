import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Lightbulb, Save, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SmartAccountSelector } from './SmartAccountSelector';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface JournalEntryLine {
  id: string;
  accountId: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  costCenterId?: string;
}

interface SmartJournalEntryDialogProps {
  accounts: any[];
  costCenters: any[];
  onEntryCreated: () => void;
}

export const SmartJournalEntryDialog: React.FC<SmartJournalEntryDialogProps> = ({
  accounts,
  costCenters,
  onEntryCreated
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    entryDate: new Date(),
    description: '',
    referenceNumber: '',
    notes: ''
  });
  
  const [lines, setLines] = useState<JournalEntryLine[]>([
    {
      id: '1',
      accountId: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
      costCenterId: ''
    },
    {
      id: '2',
      accountId: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
      costCenterId: ''
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);

  // استخدام الهوك للاقتراحات الذكية
  const {
    suggestedAccounts,
    recentAccounts,
    quickSuggestions,
    loading: suggestionsLoading,
    learnFromSelection
  } = useSmartSuggestions({
    accounts,
    currentDescription: formData.description,
    currentAmount: lines.reduce((sum, line) => sum + (line.debitAmount || line.creditAmount), 0),
    transactionType: 'debit'
  });

  const addLine = () => {
    const newLine: JournalEntryLine = {
      id: Date.now().toString(),
      accountId: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
      costCenterId: ''
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof JournalEntryLine, value: any) => {
    setLines(lines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));

    // تعلم من الاختيار عند تحديد حساب
    if (field === 'accountId' && value && formData.description) {
      const amount = lines.find(l => l.id === id)?.debitAmount || lines.find(l => l.id === id)?.creditAmount || 0;
      learnFromSelection(value, formData.description, amount);
    }
  };

  const calculateTotals = () => {
    const totalDebits = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
    return { totalDebits, totalCredits };
  };

  const validateEntry = () => {
    const { totalDebits, totalCredits } = calculateTotals();
    
    if (totalDebits !== totalCredits) {
      toast.error('إجمالي المدين يجب أن يساوي إجمالي الدائن');
      return false;
    }

    if (totalDebits === 0) {
      toast.error('يجب إدخال مبالغ صحيحة');
      return false;
    }

    for (const line of lines) {
      if (!line.accountId || !line.description || (line.debitAmount === 0 && line.creditAmount === 0)) {
        toast.error('يجب إكمال جميع الحقول المطلوبة');
        return false;
      }
    }

    return true;
  };

  // تطبيق اقتراح سريع
  const applyQuickSuggestion = (suggestion: any) => {
    if (currentLineIndex !== null) {
      updateLine(lines[currentLineIndex].id, 'accountId', suggestion.id);
      toast.success(`تم تطبيق الاقتراح: ${suggestion.account_name}`);
    }
  };

  // إنشاء قيد من نموذج سريع
  const createQuickEntry = (template: string) => {
    const templates = {
      'salary': {
        description: 'صرف رواتب شهر ' + format(new Date(), 'MMMM yyyy', { locale: ar }),
        lines: [
          { accountCode: '51101', description: 'مصروف رواتب وأجور', type: 'debit' },
          { accountCode: '11101', description: 'صرف نقدي', type: 'credit' }
        ]
      },
      'rent': {
        description: 'دفع إيجار شهر ' + format(new Date(), 'MMMM yyyy', { locale: ar }),
        lines: [
          { accountCode: '52101', description: 'مصروف إيجار', type: 'debit' },
          { accountCode: '11101', description: 'دفع نقدي', type: 'credit' }
        ]
      },
      'utility': {
        description: 'دفع فواتير الخدمات',
        lines: [
          { accountCode: '52301', description: 'مصروف كهرباء وماء', type: 'debit' },
          { accountCode: '21101', description: 'موردين', type: 'credit' }
        ]
      }
    };

    const selectedTemplate = templates[template as keyof typeof templates];
    if (selectedTemplate) {
      setFormData({ ...formData, description: selectedTemplate.description });
      
      const newLines = selectedTemplate.lines.map((line, index) => {
        const account = accounts.find(acc => acc.account_code === line.accountCode);
        return {
          id: (index + 1).toString(),
          accountId: account?.id || '',
          description: line.description,
          debitAmount: line.type === 'debit' ? 0 : 0,
          creditAmount: line.type === 'credit' ? 0 : 0,
          costCenterId: ''
        };
      });
      
      setLines(newLines);
      toast.success(`تم تطبيق النموذج: ${selectedTemplate.description}`);
    }
  };

  const handleSubmit = async () => {
    if (!validateEntry()) return;

    setLoading(true);
    try {
      // Get current tenant ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate entry number
      const entryNumber = `JE-${format(new Date(), 'yyyy-MM')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const { totalDebits } = calculateTotals();

      // Create journal entry
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: entryNumber,
          entry_date: formData.entryDate.toISOString().split('T')[0],
          description: formData.description,
          reference_id: formData.referenceNumber || null,
          total_debit: totalDebits,
          total_credit: totalDebits,
          status: 'draft',
          reference_type: 'manual',
          tenant_id: user.id
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Create journal entry lines
      const entryLines = lines.map((line, index) => ({
        journal_entry_id: journalEntry.id,
        account_id: line.accountId,
        description: line.description,
        debit_amount: line.debitAmount || 0,
        credit_amount: line.creditAmount || 0,
        cost_center_id: line.costCenterId || null,
        line_number: index + 1
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(entryLines);

      if (linesError) throw linesError;
      
      toast.success('تم إنشاء القيد المحاسبي بنجاح');
      setOpen(false);
      onEntryCreated();
      
      // Reset form
      setFormData({
        entryDate: new Date(),
        description: '',
        referenceNumber: '',
        notes: ''
      });
      setLines([
        {
          id: '1',
          accountId: '',
          description: '',
          debitAmount: 0,
          creditAmount: 0,
          costCenterId: ''
        },
        {
          id: '2',
          accountId: '',
          description: '',
          debitAmount: 0,
          creditAmount: 0,
          costCenterId: ''
        }
      ]);
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast.error('حدث خطأ أثناء إنشاء القيد المحاسبي');
    } finally {
      setLoading(false);
    }
  };

  const { totalDebits, totalCredits } = calculateTotals();
  const isBalanced = totalDebits === totalCredits && totalDebits > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rtl-flex">
          <Zap className="w-4 h-4" />
          قيد ذكي جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            المحرر الذكي للقيود المحاسبية
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-12 gap-6">
          {/* المنطقة الرئيسية للقيد */}
          <div className="col-span-8 space-y-6">
            {/* معلومات القيد الأساسية */}
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="rtl-label">التاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full rtl-flex text-left font-normal",
                          !formData.entryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="w-4 h-4" />
                        {formData.entryDate ? format(formData.entryDate, 'PPP', { locale: ar }) : 'اختر التاريخ'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.entryDate}
                        onSelect={(date) => date && setFormData({...formData, entryDate: date})}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="rtl-label">رقم المرجع</Label>
                  <Input
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                    placeholder="رقم المرجع (اختياري)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="rtl-label">الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="وصف القيد المحاسبي"
                  required
                />
              </div>
            </Card>

            {/* بنود القيد */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">بنود القيد</h3>
                <Button onClick={addLine} variant="outline" size="sm" className="rtl-flex">
                  <Plus className="w-4 h-4" />
                  إضافة بند
                </Button>
              </div>

              <div className="space-y-3">
                {lines.map((line, index) => (
                  <div key={line.id} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                    <div className="col-span-3">
                      <Label className="rtl-label text-sm">الحساب</Label>
                      <SmartAccountSelector
                        accounts={accounts}
                        value={line.accountId}
                        onValueChange={(value) => {
                          updateLine(line.id, 'accountId', value);
                          setCurrentLineIndex(index);
                        }}
                        placeholder="اختر الحساب"
                        showBalance={true}
                        recentAccounts={recentAccounts}
                        suggestedAccounts={suggestedAccounts}
                      />
                    </div>

                    <div className="col-span-3">
                      <Label className="rtl-label text-sm">الوصف</Label>
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                        placeholder="وصف البند"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="rtl-label text-sm">مدين</Label>
                      <Input
                        type="number"
                        value={line.debitAmount || ''}
                        onChange={(e) => updateLine(line.id, 'debitAmount', parseFloat(e.target.value) || 0)}
                        placeholder="0.000"
                        step="0.001"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="rtl-label text-sm">دائن</Label>
                      <Input
                        type="number"
                        value={line.creditAmount || ''}
                        onChange={(e) => updateLine(line.id, 'creditAmount', parseFloat(e.target.value) || 0)}
                        placeholder="0.000"
                        step="0.001"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="rtl-label text-sm">مركز التكلفة</Label>
                      <Select
                        value={line.costCenterId}
                        onValueChange={(value) => updateLine(line.id, 'costCenterId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختياري" />
                        </SelectTrigger>
                        <SelectContent>
                          {costCenters.map((center) => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.cost_center_code} - {center.cost_center_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {lines.length > 2 && (
                      <div className="col-span-1 flex items-end">
                        <Button
                          onClick={() => removeLine(line.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* إجماليات القيد */}
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <div className="flex gap-8">
                <div className="text-sm">
                  <span className="font-medium">إجمالي المدين: </span>
                  <span className="font-bold">{totalDebits.toFixed(3)} د.ك</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">إجمالي الدائن: </span>
                  <span className="font-bold">{totalCredits.toFixed(3)} د.ك</span>
                </div>
              </div>
              <div className={cn(
                "text-sm font-medium",
                isBalanced ? "text-green-600" : "text-red-600"
              )}>
                {isBalanced ? "متوازن ✓" : "غير متوازن ✗"}
              </div>
            </div>
          </div>

          {/* الشريط الجانبي للاقتراحات الذكية */}
          <div className="col-span-4 space-y-4">
            {/* نماذج سريعة */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3 rtl-flex gap-2">
                <Zap className="w-4 h-4" />
                نماذج سريعة
              </h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full rtl-flex text-right"
                  onClick={() => createQuickEntry('salary')}
                >
                  قيد رواتب
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full rtl-flex text-right"
                  onClick={() => createQuickEntry('rent')}
                >
                  قيد إيجار
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full rtl-flex text-right"
                  onClick={() => createQuickEntry('utility')}
                >
                  قيد خدمات
                </Button>
              </div>
            </Card>

            {/* الاقتراحات الذكية */}
            {showSmartSuggestions && suggestedAccounts.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold mb-3 rtl-flex gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  اقتراحات ذكية
                </h4>
                <div className="space-y-2">
                  {suggestedAccounts.slice(0, 5).map(accountId => {
                    const account = accounts.find(acc => acc.id === accountId);
                    return account ? (
                      <Button
                        key={account.id}
                        variant="ghost"
                        size="sm"
                        className="w-full text-right justify-start p-2 h-auto"
                        onClick={() => applyQuickSuggestion(account)}
                      >
                        <div className="text-right">
                          <div className="font-medium text-xs">
                            {account.account_code} - {account.account_name}
                          </div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            اقتراح ذكي
                          </Badge>
                        </div>
                      </Button>
                    ) : null;
                  })}
                </div>
              </Card>
            )}

            {/* الحسابات المستخدمة مؤخراً */}
            {recentAccounts.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold mb-3">مستخدمة مؤخراً</h4>
                <div className="space-y-1">
                  {recentAccounts.slice(0, 5).map(accountId => {
                    const account = accounts.find(acc => acc.id === accountId);
                    return account ? (
                      <Button
                        key={account.id}
                        variant="ghost"
                        size="sm"
                        className="w-full text-right justify-start p-2 h-auto text-xs"
                        onClick={() => applyQuickSuggestion(account)}
                      >
                        {account.account_code} - {account.account_name}
                      </Button>
                    ) : null;
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* ملاحظات وأزرار الحفظ */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="rtl-label">ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="ملاحظات إضافية (اختياري)"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={!isBalanced || loading} className="rtl-flex">
              <Save className="w-4 h-4" />
              {loading ? 'جاري الحفظ...' : 'حفظ القيد'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
