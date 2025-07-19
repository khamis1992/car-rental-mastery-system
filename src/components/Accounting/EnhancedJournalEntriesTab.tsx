import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle, Clock, FileText, Paperclip, Building } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AccountSelector } from './AccountSelector';

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: 'draft' | 'posted' | 'archived';
  reference_type: string;
  reference_id: string | null;
  notes: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  cost_center_id: string | null;
  line_number: number;
  created_at: string;
  updated_at: string;
}

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_category: string;
  parent_account_id: string | null;
  level: number;
  allow_posting: boolean;
  is_active: boolean;
  opening_balance: number;
  current_balance: number;
  ksaap_compliant: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

interface CostCenter {
  id: string;
  cost_center_code: string;
  cost_center_name: string;
  description: string | null;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

type NewEntryLine = Omit<JournalEntryLine, 'id' | 'journal_entry_id' | 'created_at' | 'updated_at'> & { id: string };

type NewEntry = Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  lines: NewEntryLine[];
};

export const EnhancedJournalEntriesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    status: 'all',
    searchTerm: ''
  });
  const [newEntry, setNewEntry] = useState<NewEntry>({
    entry_number: '',
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    total_debit: 0,
    total_credit: 0,
    status: 'draft',
    reference_type: 'manual',
    reference_id: null,
    notes: null,
    tenant_id: '',
    lines: [
      {
        id: '1',
        account_id: '',
        description: '',
        debit_amount: 0,
        credit_amount: 0,
        cost_center_id: null,
        line_number: 1
      },
      {
        id: '2',
        account_id: '',
        description: '',
        debit_amount: 0,
        credit_amount: 0,
        cost_center_id: null,
        line_number: 2
      }
    ]
  });

  const [recentAccounts, setRecentAccounts] = useState<string[]>([]);

  const { data: journalEntries, isLoading: isLoadingEntries, refetch: refetchEntries } = useQuery<JournalEntry[]>(
    ['journalEntries'],
    async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching journal entries:', error);
        throw error;
      }
      return data;
    }
  );

  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<Account[]>(
    ['accounts'],
    async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('allow_posting', true)
        .order('account_code', { ascending: true });

      if (error) {
        console.error('Error fetching accounts:', error);
        throw error;
      }
      return data;
    }
  );

  const { data: costCenters, isLoading: isLoadingCostCenters } = useQuery<CostCenter[]>(
    ['costCenters'],
    async () => {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('is_active', true)
        .order('cost_center_code', { ascending: true });

      if (error) {
        console.error('Error fetching cost centers:', error);
        throw error;
      }
      return data;
    }
  );

  useEffect(() => {
    const fetchTenantId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setNewEntry(prev => ({ ...prev, tenant_id: user.id }));
      }
    };

    fetchTenantId();
  }, []);

  const addEntryLine = () => {
    setNewEntry(prev => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: Date.now().toString(),
          account_id: '',
          description: '',
          debit_amount: 0,
          credit_amount: 0,
          cost_center_id: null,
          line_number: prev.lines.length + 1
        }
      ]
    }));
  };

  const removeEntryLine = (lineId: string) => {
    setNewEntry(prev => ({
      ...prev,
      lines: prev.lines.length > 2 ? prev.lines.filter(line => line.id !== lineId) : prev.lines
    }));
  };

  const updateEntryLine = (lineId: string, field: keyof NewEntryLine, value: any) => {
    setNewEntry(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.id === lineId ? { ...line, [field]: value } : line
      )
    }));
  };

  const updateLineAccount = (lineId: string, accountId: string) => {
    setNewEntry(prev => ({
      ...prev,
      lines: prev.lines.map(line => 
        line.id === lineId ? { ...line, accountId } : line
      )
    }));

    // Track recent accounts
    setRecentAccounts(prev => {
      const updated = [accountId, ...prev.filter(id => id !== accountId)];
      return updated.slice(0, 10); // Keep only last 10
    });
  };

  const calculateTotals = () => {
    let totalDebits = 0;
    let totalCredits = 0;

    newEntry.lines.forEach(line => {
      totalDebits += line.debit_amount || 0;
      totalCredits += line.credit_amount || 0;
    });

    const difference = totalDebits - totalCredits;

    return { totalDebits, totalCredits, difference };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (calculateTotals().difference !== 0) {
      toast.error('القيد غير متوازن، يرجى التأكد من تساوي إجمالي المدين والدائن.');
      return;
    }

    setLoading(true);
    try {
      // Generate entry number
      const entryNumber = `JE-${format(new Date(), 'yyyy-MM')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Create journal entry
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          entry_number: entryNumber,
          entry_date: newEntry.entry_date,
          description: newEntry.description,
          reference_id: newEntry.reference_id || null,
          total_debit: calculateTotals().totalDebits,
          total_credit: calculateTotals().totalCredits,
          status: newEntry.status,
          reference_type: newEntry.reference_type,
          notes: newEntry.notes || null,
          tenant_id: newEntry.tenant_id
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Create journal entry lines
      const entryLines = newEntry.lines.map((line, index) => ({
        journal_entry_id: journalEntry.id,
        account_id: line.account_id,
        description: line.description,
        debit_amount: line.debit_amount || 0,
        credit_amount: line.credit_amount || 0,
        cost_center_id: line.cost_center_id || null,
        line_number: index + 1
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(entryLines);

      if (linesError) throw linesError;

      toast.success('تم إنشاء القيد المحاسبي بنجاح');
      setShowAddDialog(false);
      await queryClient.invalidateQueries(['journalEntries']);
      
      // Reset form
      setNewEntry({
        entry_number: '',
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        total_debit: 0,
        total_credit: 0,
        status: 'draft',
        reference_type: 'manual',
        reference_id: null,
        notes: null,
        tenant_id: newEntry.tenant_id,
        lines: [
          {
            id: '1',
            account_id: '',
            description: '',
            debit_amount: 0,
            credit_amount: 0,
            cost_center_id: null,
            line_number: 1
          },
          {
            id: '2',
            account_id: '',
            description: '',
            debit_amount: 0,
            credit_amount: 0,
            cost_center_id: null,
            line_number: 2
          }
        ]
      });
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast.error('حدث خطأ أثناء إنشاء القيد المحاسبي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">القيود المحاسبية</h2>
        <Button onClick={() => refetchEntries()} variant="outline">تحديث البيانات</Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date From */}
        <div>
          <Label className="rtl-label">من تاريخ</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal rtl-flex",
                  !filter.dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="w-4 h-4" />
                {filter.dateFrom ? format(filter.dateFrom, 'PPP', { locale: ar }) : 'اختر التاريخ'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filter.dateFrom}
                onSelect={(date) => setFilter({...filter, dateFrom: date})}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div>
          <Label className="rtl-label">إلى تاريخ</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal rtl-flex",
                  !filter.dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="w-4 h-4" />
                {filter.dateTo ? format(filter.dateTo, 'PPP', { locale: ar }) : 'اختر التاريخ'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filter.dateTo}
                onSelect={(date) => setFilter({...filter, dateTo: date})}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Status */}
        <div>
          <Label className="rtl-label">الحالة</Label>
          <Select value={filter.status} onValueChange={(value) => setFilter({...filter, status: value})}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="posted">منشور</SelectItem>
              <SelectItem value="archived">مؤرشف</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div>
          <Label className="rtl-label">بحث</Label>
          <Input
            type="search"
            placeholder="ابحث عن قيد..."
            value={filter.searchTerm}
            onChange={(e) => setFilter({...filter, searchTerm: e.target.value})}
          />
        </div>
      </div>

      {/* Add New Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button className="rtl-flex">
            <Plus className="w-4 h-4" />
            قيد محاسبي جديد
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="rtl-title">إضافة قيد محاسبي جديد</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6 p-1">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="attachments">المرفقات</TabsTrigger>
                  <TabsTrigger value="cost-centers">مراكز التكلفة</TabsTrigger>
                  <TabsTrigger value="lines">سطور القيد</TabsTrigger>
                  <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Entry Date */}
                    <div>
                      <Label className="rtl-label">تاريخ القيد</Label>
                      <Input
                        type="date"
                        value={newEntry.entry_date}
                        onChange={(e) => updateEntryLine('entry_date', 'entry_date', e.target.value)}
                      />
                    </div>

                    {/* Reference Number */}
                    <div>
                      <Label className="rtl-label">رقم المرجع</Label>
                      <Input
                        type="text"
                        placeholder="أدخل رقم المرجع"
                        value={newEntry.reference_id || ''}
                        onChange={(e) => updateEntryLine('reference_id', 'reference_id', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="rtl-label">الوصف</Label>
                    <Textarea
                      placeholder="أدخل وصف القيد"
                      value={newEntry.description}
                      onChange={(e) => updateEntryLine('description', 'description', e.target.value)}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="rtl-label">ملاحظات</Label>
                    <Textarea
                      placeholder="أدخل ملاحظات إضافية"
                      value={newEntry.notes || ''}
                      onChange={(e) => updateEntryLine('notes', 'notes', e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="lines" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">سطور القيد المحاسبي</h3>
                    <Button
                      type="button"
                      onClick={addEntryLine}
                      variant="outline"
                      size="sm"
                      className="rtl-flex"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة سطر
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {newEntry.lines.map((line, index) => (
                      <Card key={line.id} className="p-4">
                        <div className="grid grid-cols-12 gap-4 items-end">
                          <div className="col-span-3">
                            <Label className="rtl-label">الحساب</Label>
                            <AccountSelector
                              accounts={accounts || []}
                              value={line.account_id}
                              onValueChange={(value) => updateLineAccount(line.id, value)}
                              placeholder="اختر الحساب"
                              showBalance={true}
                              recentAccounts={recentAccounts}
                            />
                          </div>

                          <div className="col-span-3">
                            <Label className="rtl-label">الوصف</Label>
                            <Input
                              value={line.description}
                              onChange={(e) => updateEntryLine(line.id, 'description', e.target.value)}
                              placeholder="وصف السطر"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label className="rtl-label">مدين</Label>
                            <Input
                              type="number"
                              value={line.debit_amount || ''}
                              onChange={(e) => updateEntryLine(line.id, 'debit_amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.000"
                              step="0.001"
                              min="0"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label className="rtl-label">دائن</Label>
                            <Input
                              type="number"
                              value={line.credit_amount || ''}
                              onChange={(e) => updateEntryLine(line.id, 'credit_amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.000"
                              step="0.001"
                              min="0"
                            />
                          </div>

                          <div className="col-span-2">
                            {newEntry.lines.length > 2 && (
                              <Button
                                type="button"
                                onClick={() => removeEntryLine(line.id)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Totals Summary */}
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div className="flex gap-8">
                      <div className="text-sm">
                        <span className="font-medium">إجمالي المدين: </span>
                        <span className="font-bold text-green-600">
                          {calculateTotals().totalDebits.toFixed(3)} د.ك
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">إجمالي الدائن: </span>
                        <span className="font-bold text-blue-600">
                          {calculateTotals().totalCredits.toFixed(3)} د.ك
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">الفرق: </span>
                        <span className={cn(
                          "font-bold",
                          calculateTotals().difference === 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {Math.abs(calculateTotals().difference).toFixed(3)} د.ك
                        </span>
                      </div>
                    </div>
                    {calculateTotals().difference === 0 && calculateTotals().totalDebits > 0 ? (
                      <Badge variant="default" className="rtl-flex">
                        <CheckCircle className="w-3 h-3" />
                        متوازن
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="rtl-flex">
                        <AlertCircle className="w-3 h-3" />
                        غير متوازن
                      </Badge>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="cost-centers">
                  <p>إدارة مراكز التكلفة ستكون هنا.</p>
                </TabsContent>

                <TabsContent value="attachments">
                  <p>إدارة المرفقات ستكون هنا.</p>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || calculateTotals().difference !== 0 || calculateTotals().totalDebits === 0}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ القيد'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Journal Entries Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>رقم القيد</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>الوصف</TableHead>
            <TableHead>المدين</TableHead>
            <TableHead>الدائن</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="text-center">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {journalEntries?.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.entry_number}</TableCell>
              <TableCell>{format(new Date(entry.entry_date), 'PPP', { locale: ar })}</TableCell>
              <TableCell>{entry.description}</TableCell>
              <TableCell>{entry.total_debit.toFixed(3)}</TableCell>
              <TableCell>{entry.total_credit.toFixed(3)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    entry.status === 'draft'
                      ? 'secondary'
                      : entry.status === 'posted'
                      ? 'default'
                      : 'outline'
                  }
                >
                  {entry.status === 'draft'
                    ? 'مسودة'
                    : entry.status === 'posted'
                    ? 'منشور'
                    : 'مؤرشف'}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
