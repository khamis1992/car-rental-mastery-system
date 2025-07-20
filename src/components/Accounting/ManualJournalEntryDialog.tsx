import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AccountSelector } from './AccountSelector';

interface JournalEntryLine {
  id: string;
  accountId: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  costCenterId?: string;
}

interface ManualJournalEntryDialogProps {
  accounts: any[];
  costCenters: any[];
  onEntryCreated: () => void;
}

export const ManualJournalEntryDialog: React.FC<ManualJournalEntryDialogProps> = ({
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
  const [recentAccounts, setRecentAccounts] = useState<string[]>([]);

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

    // Track recent accounts
    if (field === 'accountId' && value) {
      setRecentAccounts(prev => {
        const updated = [value, ...prev.filter(id => id !== value)];
        return updated.slice(0, 10); // Keep only last 10
      });
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
          <Plus className="w-4 h-4" />
          قيد يدوي جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title">إنشاء قيد محاسبي يدوي</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Entry Header */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="rtl-label">التاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rtl-flex",
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

          {/* Entry Lines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
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
                    <AccountSelector
                      accounts={accounts}
                      value={line.accountId}
                      onValueChange={(value) => updateLine(line.id, 'accountId', value)}
                      placeholder="اختر الحساب"
                      showBalance={true}
                      recentAccounts={recentAccounts}
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
          </div>

          {/* Totals */}
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
            <Button onClick={handleSubmit} disabled={!isBalanced || loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ القيد'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
