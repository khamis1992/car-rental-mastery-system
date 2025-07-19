import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Check, X, FileText, Settings } from 'lucide-react';
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

export const JournalEntriesTab = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setLoading(true);
      setError(null);
      
      console.log('🔄 بدء تحميل بيانات القيود المحاسبية...');
      
      const [entriesData, accountsData] = await Promise.all([
        accountingService.getJournalEntries(),
        accountingService.getChartOfAccounts()
      ]);
      
      console.log('✅ تم تحميل البيانات بنجاح:', {
        entriesCount: entriesData.length,
        accountsCount: accountsData.length
      });
      
      // Transform entries data to match interface
      const transformedEntries = entriesData.map((entry: any) => ({
        ...entry,
        reference_type: entry.reference_type as 'manual' | 'contract' | 'invoice' | 'payment' | 'adjustment'
      }));
      
      // Transform accounts data to match interface
      const transformedAccounts = accountsData.filter(acc => acc.allow_posting).map((account: any) => ({
        ...account,
        account_type: account.account_type as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
      }));
      
      setEntries(transformedEntries);
      setAccounts(transformedAccounts);
      
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

  // تشخيص المشاكل
  const runDiagnostics = async () => {
    try {
      const diagnostics = await accountingService.runDiagnostics();
      console.log('🔍 نتائج التشخيص:', diagnostics);
      
      // Transform diagnostics to match expected format
      const transformedDiagnostics = {
        authStatus: diagnostics.status === 'success',
        tenantStatus: diagnostics.status === 'success',
        permissionsStatus: diagnostics.status === 'success',
        journalEntriesCount: 0,
        errors: diagnostics.issues || []
      };
      
      if (transformedDiagnostics.errors.length > 0) {
        toast({
          title: 'مشاكل تم اكتشافها',
          description: transformedDiagnostics.errors.join(', '),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'نجح التشخيص',
          description: 'جميع الفحوصات نجحت',
        });
      }
    } catch (error) {
      console.error('خطأ في التشخيص:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تشغيل التشخيص',
        variant: 'destructive',
      });
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
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>جاري تحميل القيود المحاسبية...</p>
          <p className="text-sm text-muted-foreground">
            إذا استغرق التحميل وقتاً طويلاً، يرجى التحقق من الاتصال
          </p>
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
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-destructive">خطأ في تحميل البيانات</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadData} variant="outline">
                إعادة المحاولة
              </Button>
              <Button onClick={runDiagnostics} variant="secondary">
                تشخيص المشكلة
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* لوحة التشخيص - تظهر فقط في حالة وجود مشاكل */}
      {entries.length === 0 && !loading && !error && (
        <DiagnosticsPanel />
      )}
      
      <Card className="card-elegant">
        <CardHeader className="rtl-card-header">
          <CardTitle className="rtl-title text-xl font-bold">القيود المحاسبية</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast({ title: "قريباً", description: "ستتوفر القيود المتقدمة قريباً" })}>
              <Settings className="w-4 h-4" />
              قيد متقدم
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary" onClick={() => { resetForm(); setEditingEntry(null); }}>
                  <Plus className="w-4 h-4" />
                  قيد محاسبي جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-bold rtl-title">
                    {editingEntry ? 'تعديل القيد المحاسبي' : 'إضافة قيد محاسبي جديد'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="overflow-y-auto max-h-[75vh]">
                  <form onSubmit={handleSubmit} className="space-y-8 p-1">
                    {/* معلومات القيد الأساسية */}
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

                    {/* سطور القيد المحاسبي */}
                    <div className="space-y-4">
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
                          <p className="text-sm">انقر على "إضافة سطر" للبدء</p>
                        </div>
                      )}

                      {formData.lines.map((line, index) => (
                        <div key={index} className="border border-border rounded-lg p-4 bg-card space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">السطر رقم {line.line_number}</span>
                            <Button
                              type="button"
                              onClick={() => removeLine(index)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="space-y-2">
                              <Label className="rtl-label">الحساب</Label>
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
                              <Label className="rtl-label">المبلغ المدين</Label>
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                value={line.debit_amount}
                                onChange={(e) => updateLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                                placeholder="0.000"
                                className="text-center"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="rtl-label">المبلغ الدائن</Label>
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                value={line.credit_amount}
                                onChange={(e) => updateLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                                placeholder="0.000"
                                className="text-center"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="rtl-label">وصف السطر</Label>
                              <Input
                                value={line.description}
                                onChange={(e) => updateLine(index, 'description', e.target.value)}
                                placeholder="وصف مختصر"
                                className="text-right"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* ملخص الأرصدة */}
                      {formData.lines.length > 0 && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                              <p className="text-lg font-bold text-primary">{formatAmount(getTotalDebit())}</p>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                              <p className="text-lg font-bold text-primary">{formatAmount(getTotalCredit())}</p>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">الحالة</p>
                              <div className="flex items-center justify-center">
                                {isBalanced() ? (
                                  <Badge variant="secondary" className="bg-success text-success-foreground">
                                    <Check className="w-3 h-3 mr-1" />
                                    متوازن
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <X className="w-3 h-3 mr-1" />
                                    غير متوازن
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                {/* أزرار الحفظ */}
                <div className="border-t pt-4 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {formData.lines.length > 0 && !isBalanced() && (
                      <span className="text-destructive">⚠️ القيد غير متوازن - تأكد من تساوي المدين والدائن</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={!isBalanced() || formData.lines.length < 2}
                      className="btn-primary"
                    >
                      {editingEntry ? 'تحديث القيد' : 'حفظ القيد'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* شريط البحث والفلترة */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث في القيود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="فلترة حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="posted">مرحل</SelectItem>
                  <SelectItem value="reversed">معكوس</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* جدول القيود */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">لا توجد قيود محاسبية</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإنشاء أول قيد محاسبي لك</p>
              <Button onClick={() => { resetForm(); setEditingEntry(null); setIsDialogOpen(true); }} className="btn-primary">
                <Plus className="w-4 h-4" />
                إنشاء قيد جديد
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right font-semibold">رقم القيد</TableHead>
                    <TableHead className="text-right font-semibold">التاريخ</TableHead>
                    <TableHead className="text-right font-semibold">الوصف</TableHead>
                    <TableHead className="text-center font-semibold">المدين</TableHead>
                    <TableHead className="text-center font-semibold">الدائن</TableHead>
                    <TableHead className="text-center font-semibold">الحالة</TableHead>
                    <TableHead className="text-center font-semibold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-right">{entry.entry_number}</TableCell>
                      <TableCell className="text-right">{new Date(entry.entry_date).toLocaleDateString('ar-KW')}</TableCell>
                      <TableCell className="text-right max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-center font-mono">{formatAmount(entry.total_debit)}</TableCell>
                      <TableCell className="text-center font-mono">{formatAmount(entry.total_credit)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(entry.status)}>
                          {getStatusLabel(entry.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingEntry(entry); setIsDialogOpen(true); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {entry.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePost(entry.id)}
                              className="text-success hover:text-success hover:bg-success/10"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
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
  );
};