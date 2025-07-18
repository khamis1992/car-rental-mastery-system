import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

interface Check {
  id: string;
  check_number: string;
  check_date: string;
  due_date?: string;
  amount: number;
  payee_name: string;
  status: string;
  check_type: string;
  memo?: string;
  bank_account?: {
    account_name: string;
    bank_name: string;
  };
}

export const ChecksTab = () => {
  const { currentTenant } = useTenant();
  const [checks, setChecks] = useState<Check[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // بيانات النموذج
  const [formData, setFormData] = useState({
    check_number: '',
    check_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: 0,
    payee_name: '',
    payee_account: '',
    check_type: 'outgoing',
    bank_account_id: '',
    memo: '',
    reference_type: '',
    reference_id: ''
  });

  useEffect(() => {
    loadChecks();
    loadBankAccounts();
  }, []);

  const loadChecks = async () => {
    try {
      const { data, error } = await supabase
        .from('checks')
        .select(`
          *,
          bank_account:bank_accounts(account_name, bank_name)
        `)
        .order('check_date', { ascending: false });

      if (error) throw error;
      setChecks(data || []);
    } catch (error) {
      console.error('خطأ في تحميل الشيكات:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الشيكات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('account_name');

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('خطأ في تحميل الحسابات البنكية:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.check_number || !formData.payee_name || formData.amount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      // إنشاء الشيك
      const { data: checkData, error: checkError } = await supabase
        .from('checks')
        .insert({
          tenant_id: currentTenant?.id,
          check_number: formData.check_number,
          check_date: formData.check_date,
          due_date: formData.due_date || null,
          amount: formData.amount,
          payee_name: formData.payee_name,
          payee_account: formData.payee_account || null,
          check_type: formData.check_type,
          bank_account_id: formData.bank_account_id,
          memo: formData.memo || null,
          reference_type: formData.reference_type || null,
          reference_id: formData.reference_id || null
        })
        .select()
        .single();

      if (checkError) throw checkError;

      // إنشاء قيد محاسبي
      if (checkData) {
        try {
          await supabase.rpc('create_journal_entry_from_check', {
            check_id: checkData.id
          });
        } catch (error) {
          console.error('خطأ في إنشاء القيد المحاسبي:', error);
        }
      }

      toast({
        title: "نجح",
        description: "تم إنشاء الشيك بنجاح"
      });

      setIsCreateDialogOpen(false);
      setFormData({
        check_number: '',
        check_date: new Date().toISOString().split('T')[0],
        due_date: '',
        amount: 0,
        payee_name: '',
        payee_account: '',
        check_type: 'outgoing',
        bank_account_id: '',
        memo: '',
        reference_type: '',
        reference_id: ''
      });
      loadChecks();

    } catch (error) {
      console.error('خطأ في إنشاء الشيك:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الشيك",
        variant: "destructive"
      });
    }
  };

  const updateCheckStatus = async (checkId: string, newStatus: string, additionalData?: any) => {
    try {
      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
      
      if (newStatus === 'cleared' && additionalData?.cleared_date) {
        updateData.cleared_date = additionalData.cleared_date;
      } else if (newStatus === 'bounced') {
        updateData.bounced_date = new Date().toISOString().split('T')[0];
        updateData.bounced_reason = additionalData?.reason || '';
      }

      const { error } = await supabase
        .from('checks')
        .update(updateData)
        .eq('id', checkId);

      if (error) throw error;

      toast({
        title: "نجح",
        description: "تم تحديث حالة الشيك بنجاح"
      });

      loadChecks();
    } catch (error) {
      console.error('خطأ في تحديث حالة الشيك:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الشيك",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <Badge variant="secondary" className="flex items-center gap-1 flex-row-reverse"><Clock className="w-3 h-3" />مُصدر</Badge>;
      case 'cleared':
        return <Badge className="bg-success text-success-foreground flex items-center gap-1 flex-row-reverse"><CheckCircle className="w-3 h-3" />مقبوض</Badge>;
      case 'bounced':
        return <Badge variant="destructive" className="flex items-center gap-1 flex-row-reverse"><XCircle className="w-3 h-3" />مرتد</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="flex items-center gap-1 flex-row-reverse"><XCircle className="w-3 h-3" />ملغي</Badge>;
      default:
        return <Badge variant="secondary" className="flex items-center gap-1 flex-row-reverse"><AlertTriangle className="w-3 h-3" />غير محدد</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'outgoing' ? 'صادر' : 'وارد';
  };

  const filteredChecks = checks.filter(check => {
    const matchesSearch = 
      check.check_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      check.payee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (check.memo && check.memo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || check.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-row-reverse">
        <div className="text-right">
          <h2 className="text-2xl font-bold">إدارة الشيكات</h2>
          <p className="text-muted-foreground">إدارة وتتبع الشيكات الصادرة والواردة</p>
        </div>
        
        <div className="flex items-center gap-2 flex-row-reverse">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 flex-row-reverse">
                <Plus className="w-4 h-4" />
                شيك جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-right">إنشاء شيك جديد</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-right block">رقم الشيك</Label>
                    <Input
                      value={formData.check_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_number: e.target.value }))}
                      className="text-right"
                      placeholder="رقم الشيك"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-right block">نوع الشيك</Label>
                    <Select value={formData.check_type} onValueChange={(value) => setFormData(prev => ({ ...prev, check_type: value }))}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر نوع الشيك" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="outgoing">صادر</SelectItem>
                        <SelectItem value="incoming">وارد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-right block">تاريخ الشيك</Label>
                    <Input
                      type="date"
                      value={formData.check_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_date: e.target.value }))}
                      className="text-right"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-right block">تاريخ الاستحقاق</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-right block">المبلغ (د.ك)</Label>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="text-right"
                      min="0"
                      step="0.001"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-right block">الحساب البنكي</Label>
                    <Select value={formData.bank_account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, bank_account_id: value }))}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر الحساب البنكي" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name} - {account.bank_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-right block">اسم المستفيد</Label>
                    <Input
                      value={formData.payee_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, payee_name: e.target.value }))}
                      className="text-right"
                      placeholder="اسم المستفيد"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-right block">رقم حساب المستفيد</Label>
                    <Input
                      value={formData.payee_account}
                      onChange={(e) => setFormData(prev => ({ ...prev, payee_account: e.target.value }))}
                      className="text-right"
                      placeholder="رقم حساب المستفيد (اختياري)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-right block">ملاحظات</Label>
                  <Textarea
                    value={formData.memo}
                    onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                    className="text-right"
                    placeholder="ملاحظات إضافية..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    إنشاء الشيك
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 flex-row-reverse">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="البحث في الشيكات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-right"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 text-right">
            <SelectValue placeholder="فلترة بالحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="issued">مُصدر</SelectItem>
            <SelectItem value="cleared">مقبوض</SelectItem>
            <SelectItem value="bounced">مرتد</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Checks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">قائمة الشيكات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الشيك</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">المستفيد</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">البنك</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChecks.map((check) => (
                <TableRow key={check.id}>
                  <TableCell className="text-right font-medium">{check.check_number}</TableCell>
                  <TableCell className="text-right">{getTypeLabel(check.check_type)}</TableCell>
                  <TableCell className="text-right">{new Date(check.check_date).toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell className="text-right">{check.payee_name}</TableCell>
                  <TableCell className="text-right">{check.amount.toFixed(3)} د.ك</TableCell>
                  <TableCell className="text-right">{check.bank_account?.bank_name || '-'}</TableCell>
                  <TableCell className="text-right">{getStatusBadge(check.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      {check.status === 'issued' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => updateCheckStatus(check.id, 'cleared')}
                            className="flex items-center gap-1 flex-row-reverse text-success hover:text-success"
                          >
                            <CheckCircle className="w-3 h-3" />
                            قبض
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => updateCheckStatus(check.id, 'bounced', { reason: 'عدم توفر رصيد' })}
                            className="flex items-center gap-1 flex-row-reverse text-destructive hover:text-destructive"
                          >
                            <XCircle className="w-3 h-3" />
                            ارتداد
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm" className="flex items-center gap-1 flex-row-reverse">
                        <FileText className="w-3 h-3" />
                        عرض
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-1 flex-row-reverse">
                        <Edit className="w-3 h-3" />
                        تعديل
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};