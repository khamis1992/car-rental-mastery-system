import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Check, X, FileText, Settings, Link, AlertTriangle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JournalEntry, JournalEntryLine, ChartOfAccount } from '@/types/accounting';
import { accountingService } from '@/services/accountingService';
import { useToast } from '@/hooks/use-toast';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { JournalEntryAttachments } from './JournalEntryAttachments';
import { CostCenterAllocation } from './CostCenterAllocation';
import { CostCenterService, CostCenter } from '@/services/BusinessServices/CostCenterService';
import AutoReverseDialog from '@/components/journal/AutoReverseDialog';
import { autoReverseService } from '@/services/autoReverseService';

interface JournalEntryAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description?: string;
  uploaded_at: string;
}

interface CostCenterAllocationItem {
  id: string;
  cost_center_id: string;
  cost_center_name?: string;
  allocation_percentage?: number;
  allocation_amount?: number;
  notes?: string;
}

export const EnhancedJournalEntriesTab = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<JournalEntryAttachment[]>([]);
  const [autoReverseDialog, setAutoReverseDialog] = useState({ isOpen: false, entry: null as JournalEntry | null });
  const { toast } = useToast();
  const costCenterService = new CostCenterService();

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
      cost_center_allocations: CostCenterAllocationItem[];
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
      setLoading(true);
      setError(null);
      
      console.log('🔄 بدء تحميل بيانات القيود المحاسبية...');
      
      const [entriesData, accountsData, costCentersData] = await Promise.all([
        accountingService.getJournalEntries(),
        accountingService.getChartOfAccounts(),
        costCenterService.getAllCostCenters()
      ]);
      
      console.log('✅ تم تحميل البيانات بنجاح:', {
        entriesCount: entriesData.length,
        accountsCount: accountsData.length,
        costCentersCount: costCentersData.length
      });
      
      setEntries(entriesData);
      setAccounts(accountsData.filter(acc => acc.allow_posting));
      setCostCenters(costCentersData.filter(cc => cc.is_active));
      
      if (entriesData.length === 0) {
        toast({
          title: 'تنبيه',
          description: 'لا توجد قيود محاسبية حتى الآن',
        });
      }
      
    } catch (error: any) {
      console.error('❌ خطأ في تحميل البيانات:', error);
      const errorMessage = error?.message || 'خطأ غير معروف في تحميل البيانات';
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
          line_number: formData.lines.length + 1,
          cost_center_allocations: []
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

  const updateLineCostCenterAllocations = (index: number, allocations: CostCenterAllocationItem[]) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], cost_center_allocations: allocations };
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

  const validateCostCenterAllocations = () => {
    for (const line of formData.lines) {
      if (line.cost_center_allocations.length > 0) {
        const lineAmount = line.debit_amount || line.credit_amount;
        const totalAllocated = line.cost_center_allocations.reduce(
          (sum, alloc) => sum + (alloc.allocation_amount || 0), 0
        );
        
        if (Math.abs(totalAllocated - lineAmount) > 0.01) {
          return {
            isValid: false,
            message: `السطر ${line.line_number}: إجمالي توزيع مراكز التكلفة لا يطابق مبلغ السطر`
          };
        }
      }
    }
    return { isValid: true, message: '' };
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

    const costCenterValidation = validateCostCenterAllocations();
    if (!costCenterValidation.isValid) {
      toast({
        title: 'خطأ في توزيع مراكز التكلفة',
        description: costCenterValidation.message,
        variant: 'destructive',
      });
      return;
    }

    try {
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
        const createdLine = await accountingService.createJournalEntryLine({
          journal_entry_id: entry.id,
          account_id: line.account_id,
          description: line.description,
          debit_amount: line.debit_amount,
          credit_amount: line.credit_amount,
          line_number: line.line_number
        });

        // إضافة توزيعات مراكز التكلفة إذا وجدت
        for (const allocation of line.cost_center_allocations) {
          if (allocation.cost_center_id) {
            await costCenterService.createAllocation({
              reference_type: 'journal_entry_line',
              reference_id: createdLine.id,
              cost_center_id: allocation.cost_center_id,
              allocation_percentage: allocation.allocation_percentage,
              allocation_amount: allocation.allocation_amount,
              notes: allocation.notes
            });
          }
        }
      }

      // حفظ المرفقات إذا وجدت
      if (attachments.length > 0) {
        // يتم حفظها في مكون JournalEntryAttachments
      }
      
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء القيد المحاسبي بنجاح',
      });
      
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

  const resetForm = () => {
    setFormData({
      entry_date: new Date().toISOString().split('T')[0],
      description: '',
      reference_type: 'manual',
      reference_id: '',
      lines: []
    });
    setAttachments([]);
  };

  const getSourceLink = (entry: JournalEntry) => {
    if (!entry.reference_type || !entry.reference_id || entry.reference_type === 'manual') {
      return null;
    }

    const linkConfig = {
      invoice: { path: '/invoices', label: 'عرض الفاتورة' },
      contract: { path: '/contracts', label: 'عرض العقد' },
      payment: { path: '/payments', label: 'عرض الدفعة' },
      expense_voucher: { path: '/expense-vouchers', label: 'عرض سند المصروف' }
    };

    const config = linkConfig[entry.reference_type as keyof typeof linkConfig];
    if (!config) return null;

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(`${config.path}/${entry.reference_id}`, '_blank')}
        className="flex items-center gap-2 text-primary hover:text-primary-dark"
      >
        <Link className="w-3 h-3" />
        {config.label}
      </Button>
    );
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

  const handleAutoReverse = async (date: Date, reason: string) => {
    if (!autoReverseDialog.entry) return;

    try {
      await autoReverseService.setAutoReverse({
        entryId: autoReverseDialog.entry.id,
        reverseDate: date,
        reason
      });

      toast({
        title: 'تم بنجاح',
        description: `تم جدولة عكس القيد رقم ${autoReverseDialog.entry.entry_number} في تاريخ ${date.toLocaleDateString('ar-SA')}`,
      });

      loadData(); // إعادة تحميل البيانات لإظهار التحديث
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في جدولة العكس التلقائي',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>جاري تحميل القيود المحاسبية...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <DiagnosticsPanel />
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-destructive mb-4">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            </div>
            <h3 className="text-lg font-semibold text-destructive">خطأ في تحميل البيانات</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadData} variant="outline">
                إعادة المحاولة
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-elegant">
        <CardHeader className="rtl-card-header">
          <CardTitle className="rtl-title text-xl font-bold">القيود المحاسبية المحسّنة</CardTitle>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary" onClick={() => { resetForm(); setEditingEntry(null); }}>
                  <Plus className="w-4 h-4" />
                  قيد محاسبي جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-bold rtl-title">
                    {editingEntry ? 'تعديل القيد المحاسبي' : 'إضافة قيد محاسبي جديد'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="overflow-y-auto max-h-[75vh]">
                  <form onSubmit={handleSubmit} className="space-y-6 p-1">
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
                        <TabsTrigger value="lines">سطور القيد</TabsTrigger>
                        <TabsTrigger value="cost-centers">مراكز التكلفة</TabsTrigger>
                        <TabsTrigger value="attachments">المرفقات</TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4">
                        <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                          <h3 className="font-semibold text-lg rtl-title mb-4">معلومات القيد الأساسية</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="entry_date" className="rtl-label">تاريخ القيد</Label>
                              <Input
                                id="entry_date"
                                type="date"
                                value={formData.entry_date}
                                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                                required
                                className="text-right"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="reference_type" className="rtl-label">نوع المرجع</Label>
                              <Select value={formData.reference_type} onValueChange={(value) => setFormData({ ...formData, reference_type: value as any })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر نوع المرجع" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manual">يدوي</SelectItem>
                                  <SelectItem value="invoice">فاتورة</SelectItem>
                                  <SelectItem value="payment">دفع</SelectItem>
                                  <SelectItem value="contract">عقد</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="reference_id" className="rtl-label">رقم المرجع</Label>
                              <Input
                                id="reference_id"
                                value={formData.reference_id}
                                onChange={(e) => setFormData({ ...formData, reference_id: e.target.value })}
                                placeholder="رقم المرجع (اختياري)"
                                className="text-right"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="description" className="rtl-label">وصف القيد</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="وصف مفصل للقيد المحاسبي"
                              required
                              className="text-right min-h-[80px]"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="lines" className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg rtl-title">سطور القيد المحاسبي</h3>
                          <Button type="button" onClick={addLine} variant="outline" size="sm">
                            <Plus className="w-4 h-4" />
                            إضافة سطر
                          </Button>
                        </div>

                        {formData.lines.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>لم يتم إضافة أي سطور بعد</p>
                          </div>
                        )}

                        {formData.lines.map((line, index) => (
                          <Card key={index} className="p-4 border-l-4 border-l-primary">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">السطر رقم {line.line_number}</span>
                                <Button
                                  type="button"
                                  onClick={() => removeLine(index)}
                                  variant="ghost"
                                  size="sm"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>الحساب</Label>
                                  <Select
                                    value={line.account_id}
                                    onValueChange={(value) => updateLine(index, 'account_id', value)}
                                  >
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
                                
                                <div className="space-y-2">
                                  <Label>وصف السطر</Label>
                                  <Input
                                    value={line.description}
                                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                                    placeholder="وصف السطر"
                                    className="text-right"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>المدين (د.ك)</Label>
                                  <Input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={line.debit_amount || ''}
                                    onChange={(e) => updateLine(index, 'debit_amount', Number(e.target.value))}
                                    className="text-right"
                                    placeholder="0.000"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>الدائن (د.ك)</Label>
                                  <Input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={line.credit_amount || ''}
                                    onChange={(e) => updateLine(index, 'credit_amount', Number(e.target.value))}
                                    className="text-right"
                                    placeholder="0.000"
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}

                        {/* ملخص الأرصدة */}
                        {formData.lines.length > 0 && (
                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                                  <p className="text-lg font-bold text-green-600">{formatAmount(getTotalDebit())}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                                  <p className="text-lg font-bold text-red-600">{formatAmount(getTotalCredit())}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">الفرق</p>
                                  <p className={`text-lg font-bold ${isBalanced() ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatAmount(Math.abs(getTotalDebit() - getTotalCredit()))}
                                    {isBalanced() ? ' ✓' : ' ✗'}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>

                      <TabsContent value="cost-centers" className="space-y-4">
                        <div className="space-y-4">
                          {formData.lines.map((line, index) => {
                            const lineAmount = line.debit_amount || line.credit_amount;
                            if (lineAmount === 0) return null;
                            
                            return (
                              <div key={index} className="space-y-2">
                                <h4 className="font-medium text-sm">توزيع مراكز التكلفة - السطر {line.line_number}</h4>
                                <CostCenterAllocation
                                  allocations={line.cost_center_allocations}
                                  onAllocationsChange={(allocations) => updateLineCostCenterAllocations(index, allocations)}
                                  totalAmount={lineAmount}
                                  mode="both"
                                />
                              </div>
                            );
                          })}
                          
                          {formData.lines.every(line => (line.debit_amount || line.credit_amount) === 0) && (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>أضف المبالغ إلى سطور القيد أولاً لتتمكن من توزيع مراكز التكلفة</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="attachments" className="space-y-4">
                        <JournalEntryAttachments
                          attachments={attachments}
                          onAttachmentsChange={setAttachments}
                        />
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit" disabled={!isBalanced()}>
                        {editingEntry ? 'تحديث القيد' : 'حفظ القيد'}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* البحث والفلترة */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث في القيود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-right pr-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="جميع الحالات" />
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الإجراءات</TableHead>
                  <TableHead className="text-right">المصدر</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الدائن</TableHead>
                  <TableHead className="text-right">المدين</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">رقم القيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        {entry.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {/* handlePost(entry.id) */}}
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                         )}
                         {entry.status === 'posted' && !entry.is_reversed && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setAutoReverseDialog({ isOpen: true, entry })}
                             title="عكس تلقائي"
                           >
                             <RotateCcw className="w-4 h-4 text-blue-600" />
                           </Button>
                         )}
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => {/* handleEdit(entry) */}}
                         >
                           <Edit className="w-4 h-4" />
                         </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {getSourceLink(entry) || (
                        <Badge variant="outline" className="text-xs">
                          يدوي
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getStatusVariant(entry.status)}>
                        {getStatusLabel(entry.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatAmount(entry.total_credit)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatAmount(entry.total_debit)}
                    </TableCell>
                    <TableCell className="text-right max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(entry.entry_date).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.entry_number}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEntries.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد قيود محاسبية
            </div>
          )}
        </CardContent>
      </Card>

      <AutoReverseDialog
        isOpen={autoReverseDialog.isOpen}
        onClose={() => setAutoReverseDialog({ isOpen: false, entry: null })}
        onConfirm={handleAutoReverse}
        entryNumber={autoReverseDialog.entry?.entry_number || ''}
      />
    </div>
  );
};