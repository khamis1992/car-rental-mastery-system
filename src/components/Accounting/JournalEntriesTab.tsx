import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Check, X, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { JournalEntry, JournalEntryLine, ChartOfAccount } from '@/types/accounting';
import { accountingService } from '@/services/accountingService';
import { useToast } from '@/hooks/use-toast';

export const JournalEntriesTab = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference_type: 'manual' as const,
    reference_id: '',
    lines: [] as {
      account_id: string;
      description: string;
      debit_amount: number;
      credit_amount: number;
      line_number: number;
    }[]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, selectedStatus]);

  const loadData = async () => {
    try {
      const [entriesData, accountsData] = await Promise.all([
        accountingService.getJournalEntries(),
        accountingService.getChartOfAccounts()
      ]);
      setEntries(entriesData);
      setAccounts(accountsData.filter(acc => acc.allow_posting));
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = entries;

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.entry_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(entry => entry.status === selectedStatus);
    }

    setFilteredEntries(filtered);
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        {
          account_id: '',
          description: '',
          debit_amount: 0,
          credit_amount: 0,
          line_number: formData.lines.length + 1
        }
      ]
    });
  };

  const removeLine = (index: number) => {
    const newLines = formData.lines.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      lines: newLines.map((line, i) => ({ ...line, line_number: i + 1 }))
    });
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const getTotalDebit = () => {
    return formData.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
  };

  const getTotalCredit = () => {
    return formData.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
  };

  const isBalanced = () => {
    return Math.abs(getTotalDebit() - getTotalCredit()) < 0.01;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isBalanced()) {
      toast({
        title: 'خطأ',
        description: 'إجمالي المدين يجب أن يساوي إجمالي الدائن',
        variant: 'destructive',
      });
      return;
    }

    if (formData.lines.length < 2) {
      toast({
        title: 'خطأ',
        description: 'يجب إضافة سطرين على الأقل',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingEntry) {
        await accountingService.updateJournalEntry(editingEntry.id, {
          entry_date: formData.entry_date,
          description: formData.description,
          reference_type: formData.reference_type,
          reference_id: formData.reference_id,
          total_debit: getTotalDebit(),
          total_credit: getTotalCredit()
        });
        toast({
          title: 'تم بنجاح',
          description: 'تم تحديث القيد المحاسبي بنجاح',
        });
      } else {
        const entry = await accountingService.createJournalEntry({
          entry_date: formData.entry_date,
          description: formData.description,
          reference_type: formData.reference_type,
          reference_id: formData.reference_id,
          total_debit: getTotalDebit(),
          total_credit: getTotalCredit(),
          status: 'draft'
        });
        
        // إضافة السطور
        for (const line of formData.lines) {
          await accountingService.createJournalEntryLine({
            journal_entry_id: entry.id,
            account_id: line.account_id,
            description: line.description,
            debit_amount: line.debit_amount,
            credit_amount: line.credit_amount,
            line_number: line.line_number
          });
        }
        
        toast({
          title: 'تم بنجاح',
          description: 'تم إنشاء القيد المحاسبي بنجاح',
        });
      }
      
      setIsDialogOpen(false);
      setEditingEntry(null);
      resetForm();
      loadData();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ القيد المحاسبي',
        variant: 'destructive',
      });
    }
  };

  const handlePost = async (entryId: string) => {
    try {
      await accountingService.postJournalEntry(entryId);
      toast({
        title: 'تم بنجاح',
        description: 'تم ترحيل القيد المحاسبي بنجاح',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في ترحيل القيد المحاسبي',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      entry_date: new Date().toISOString().split('T')[0],
      description: '',
      reference_type: 'manual',
      reference_id: '',
      lines: []
    });
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'مسودة',
      posted: 'مرحل',
      reversed: 'معكوس'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'posted': return 'default';
      case 'reversed': return 'destructive';
      default: return 'outline';
    }
  };

  const formatAmount = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>القيود المحاسبية</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingEntry(null); }}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة قيد محاسبي
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'تعديل القيد المحاسبي' : 'إضافة قيد محاسبي جديد'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry_date">تاريخ القيد</Label>
                    <Input
                      id="entry_date"
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reference_type">نوع المرجع</Label>
                    <Select value={formData.reference_type} onValueChange={(value) => setFormData({...formData, reference_type: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">يدوي</SelectItem>
                        <SelectItem value="contract">عقد</SelectItem>
                        <SelectItem value="invoice">فاتورة</SelectItem>
                        <SelectItem value="payment">دفعة</SelectItem>
                        <SelectItem value="adjustment">تسوية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="وصف القيد المحاسبي..."
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">سطور القيد</h3>
                    <Button type="button" onClick={addLine} variant="outline" size="sm">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة سطر
                    </Button>
                  </div>

                  {formData.lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                      <div className="col-span-4">
                        <Label>الحساب</Label>
                        <Select value={line.account_id} onValueChange={(value) => updateLine(index, 'account_id', value)}>
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
                      <div className="col-span-3">
                        <Label>البيان</Label>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          placeholder="بيان السطر"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>مدين</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={line.debit_amount || ''}
                          onChange={(e) => updateLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.000"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>دائن</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={line.credit_amount || ''}
                          onChange={(e) => updateLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.000"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLine(index)}
                          className="w-full"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {formData.lines.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                      <div className="text-right">
                        <span className="font-medium">إجمالي المدين: </span>
                        <span className="font-bold">{formatAmount(getTotalDebit())}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">إجمالي الدائن: </span>
                        <span className="font-bold">{formatAmount(getTotalCredit())}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        {isBalanced() ? (
                          <Badge variant="default" className="text-green-600">
                            <Check className="w-3 h-3 ml-1" />
                            القيد متوازن
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="w-3 h-3 ml-1" />
                            القيد غير متوازن
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={!isBalanced() || formData.lines.length < 2}>
                    {editingEntry ? 'تحديث' : 'حفظ'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* فلاتر البحث */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث برقم القيد أو الوصف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="حالة القيد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="posted">مرحل</SelectItem>
              <SelectItem value="reversed">معكوس</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* جدول القيود */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم القيد</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              <TableHead className="text-right">إجمالي المدين</TableHead>
              <TableHead className="text-right">إجمالي الدائن</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.entry_number}</TableCell>
                <TableCell>{new Date(entry.entry_date).toLocaleDateString('ar-KW', { calendar: 'gregory' })}</TableCell>
                <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                <TableCell className="font-medium text-green-600">
                  {formatAmount(entry.total_debit)}
                </TableCell>
                <TableCell className="font-medium text-blue-600">
                  {formatAmount(entry.total_credit)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(entry.status)}>
                    {getStatusLabel(entry.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {entry.status === 'draft' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePost(entry.id)}
                          title="ترحيل القيد"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEntry(entry);
                            setIsDialogOpen(true);
                          }}
                          title="تعديل القيد"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      title="عرض التفاصيل"
                    >
                      <FileText className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredEntries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد قيود محاسبية مطابقة لبحثك
          </div>
        )}
      </CardContent>
    </Card>
  );
};