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
      
      setEntries(entriesData);
      setAccounts(accountsData.filter(acc => acc.allow_posting));
      
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
      
      if (diagnostics.errors.length > 0) {
        toast({
          title: 'مشاكل تم اكتشافها',
          description: diagnostics.errors.join(', '),
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
        <CardHeader>
          <div className="flex justify-between items-center rtl-flex">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingEntry(null); }}>
                  <Plus className="w-4 h-4 ml-2" />
                  قيد محاسبي
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingEntry ? 'تعديل القيد المحاسبي' : 'إضافة قيد محاسبي جديد'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* ... keep existing form content */}
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
            <Button variant="outline" onClick={() => toast({ title: "قريباً", description: "ستتوفر القيود المتقدمة قريباً" })}>
              <Settings className="w-4 h-4 ml-2" />
              قيد متقدم
            </Button>
          </div>
          <CardTitle className="rtl-title">القيود المحاسبية</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ... keep existing content */}
        </CardContent>
      </Card>
    </div>
  );
};