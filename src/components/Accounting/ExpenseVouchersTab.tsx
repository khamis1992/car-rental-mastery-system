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
import { Plus, Search, Edit, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

interface ExpenseVoucher {
  id: string;
  voucher_number: string;
  voucher_date: string;
  expense_category: string;
  total_amount: number;
  net_amount: number;
  payment_method: string;
  description: string;
  approval_status: string;
  cost_center?: {
    cost_center_name: string;
  };
}

interface VoucherItem {
  id?: string;
  account_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export const ExpenseVouchersTab = () => {
  const { currentTenant } = useTenant();
  const [vouchers, setVouchers] = useState<ExpenseVoucher[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // بيانات النموذج
  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    expense_category: '',
    payment_method: 'cash',
    description: '',
    cost_center_id: '',
    bank_account_id: '',
    items: [] as VoucherItem[]
  });

  useEffect(() => {
    loadVouchers();
    loadAccounts();
    loadCostCenters();
    loadBankAccounts();
  }, []);

  const loadVouchers = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_vouchers')
        .select(`
          *,
          cost_center:cost_centers(cost_center_name)
        `)
        .order('voucher_date', { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (error) {
      console.error('خطأ في تحميل سندات المصروفات:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل سندات المصروفات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('account_type', 'expense')
        .eq('is_active', true)
        .order('account_code');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('خطأ في تحميل الحسابات:', error);
    }
  };

  const loadCostCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('is_active', true)
        .order('cost_center_code');

      if (error) throw error;
      setCostCenters(data || []);
    } catch (error) {
      console.error('خطأ في تحميل مراكز التكلفة:', error);
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

  const addVoucherItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        account_id: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        total_amount: 0
      }]
    }));
  };

  const updateVoucherItem = (index: number, field: keyof VoucherItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // حساب المبلغ الإجمالي للبند
      if (field === 'quantity' || field === 'unit_price') {
        newItems[index].total_amount = newItems[index].quantity * newItems[index].unit_price;
      }
      
      return { ...prev, items: newItems };
    });
  };

  const removeVoucherItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalAmount = () => {
    return formData.items.reduce((total, item) => total + item.total_amount, 0);
  };

  const generateVoucherNumber = async () => {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from('expense_vouchers')
      .select('voucher_number')
      .like('voucher_number', `EV-${year}-%`)
      .order('voucher_number', { ascending: false })
      .limit(1);

    const lastNumber = data?.[0]?.voucher_number;
    let nextNumber = 1;
    
    if (lastNumber) {
      const match = lastNumber.match(/EV-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    return `EV-${year}-${nextNumber.toString().padStart(6, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      toast({
        title: "خطأ",
        description: "يجب إضافة بند واحد على الأقل",
        variant: "destructive"
      });
      return;
    }

    try {
      const voucherNumber = await generateVoucherNumber();
      const totalAmount = calculateTotalAmount();

      // إنشاء سند المصروفات
      const { data: voucherData, error: voucherError } = await supabase
        .from('expense_vouchers')
        .insert({
          tenant_id: currentTenant?.id,
          voucher_number: voucherNumber,
          voucher_date: formData.voucher_date,
          expense_category: formData.expense_category,
          total_amount: totalAmount,
          net_amount: totalAmount,
          payment_method: formData.payment_method,
          description: formData.description,
          cost_center_id: formData.cost_center_id || null,
          bank_account_id: formData.payment_method === 'bank' ? formData.bank_account_id : null
        })
        .select()
        .single();

      if (voucherError) throw voucherError;

      // إضافة بنود السند
      if (voucherData) {
        const { error: itemsError } = await supabase
          .from('expense_voucher_items')
          .insert(
            formData.items.map(item => ({
              expense_voucher_id: voucherData.id,
              account_id: item.account_id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_amount: item.total_amount
            }))
          );

        if (itemsError) throw itemsError;

        // إنشاء قيد محاسبي
        try {
          await supabase.rpc('create_journal_entry_from_expense_voucher', {
            voucher_id: voucherData.id
          });
        } catch (error) {
          console.error('خطأ في إنشاء القيد المحاسبي:', error);
        }
      }

      toast({
        title: "نجح",
        description: "تم إنشاء سند المصروفات بنجاح"
      });

      setIsCreateDialogOpen(false);
      setFormData({
        voucher_date: new Date().toISOString().split('T')[0],
        expense_category: '',
        payment_method: 'cash',
        description: '',
        cost_center_id: '',
        bank_account_id: '',
        items: []
      });
      loadVouchers();

    } catch (error) {
      console.error('خطأ في إنشاء السند:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء سند المصروفات",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground flex items-center gap-1 flex-row-reverse"><CheckCircle className="w-3 h-3" />معتمد</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1 flex-row-reverse"><XCircle className="w-3 h-3" />مرفوض</Badge>;
      default:
        return <Badge variant="secondary" className="flex items-center gap-1 flex-row-reverse"><Clock className="w-3 h-3" />في الانتظار</Badge>;
    }
  };

  const filteredVouchers = vouchers.filter(voucher =>
    voucher.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voucher.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voucher.expense_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-row-reverse">
        <div className="text-right">
          <h2 className="text-2xl font-bold">سندات المصروفات</h2>
          <p className="text-muted-foreground">إدارة وتتبع سندات المصروفات</p>
        </div>
        
        <div className="flex items-center gap-2 flex-row-reverse">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 flex-row-reverse">
                <Plus className="w-4 h-4" />
                سند جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-right">إنشاء سند مصروفات جديد</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-right block">تاريخ السند</Label>
                    <Input
                      type="date"
                      value={formData.voucher_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, voucher_date: e.target.value }))}
                      className="text-right"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-right block">فئة المصروف</Label>
                    <Select value={formData.expense_category} onValueChange={(value) => setFormData(prev => ({ ...prev, expense_category: value }))}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر فئة المصروف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">مصروفات تشغيلية</SelectItem>
                        <SelectItem value="administrative">مصروفات إدارية</SelectItem>
                        <SelectItem value="maintenance">صيانة</SelectItem>
                        <SelectItem value="fuel">وقود</SelectItem>
                        <SelectItem value="insurance">تأمين</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-right block">طريقة الدفع</Label>
                    <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر طريقة الدفع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="bank">حوالة بنكية</SelectItem>
                        <SelectItem value="check">شيك</SelectItem>
                        <SelectItem value="credit">آجل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-right block">مركز التكلفة</Label>
                    <Select value={formData.cost_center_id} onValueChange={(value) => setFormData(prev => ({ ...prev, cost_center_id: value }))}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر مركز التكلفة" />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters.map(center => (
                          <SelectItem key={center.id} value={center.id}>
                            {center.cost_center_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.payment_method === 'bank' && (
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
                )}

                <div className="space-y-2">
                  <Label className="text-right block">الوصف</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="text-right"
                    placeholder="وصف السند..."
                    required
                  />
                </div>

                {/* بنود السند */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <h3 className="text-lg font-medium">بنود السند</h3>
                    <Button type="button" onClick={addVoucherItem} variant="outline" size="sm" className="flex items-center gap-2 flex-row-reverse">
                      <Plus className="w-4 h-4" />
                      إضافة بند
                    </Button>
                  </div>

                  {formData.items.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-5 gap-2">
                          <div className="space-y-2">
                            <Label className="text-right block">الحساب</Label>
                            <Select 
                              value={item.account_id} 
                              onValueChange={(value) => updateVoucherItem(index, 'account_id', value)}
                            >
                              <SelectTrigger className="text-right">
                                <SelectValue placeholder="اختر الحساب" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map(account => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.account_code} - {account.account_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-right block">الوصف</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateVoucherItem(index, 'description', e.target.value)}
                              className="text-right"
                              placeholder="وصف البند"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-right block">الكمية</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateVoucherItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="text-right"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-right block">سعر الوحدة</Label>
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateVoucherItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="text-right"
                              min="0"
                              step="0.001"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-right block">المبلغ الإجمالي</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={item.total_amount}
                                readOnly
                                className="text-right bg-muted"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeVoucherItem(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {formData.items.length > 0 && (
                    <div className="flex justify-end">
                      <div className="text-lg font-medium">
                        المجموع الكلي: {calculateTotalAmount().toFixed(3)} د.ك
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    إنشاء السند
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="البحث في سندات المصروفات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-right"
          />
        </div>
      </div>

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">سندات المصروفات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم السند</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">فئة المصروف</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">طريقة الدفع</TableHead>
                <TableHead className="text-right">مركز التكلفة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell className="text-right font-medium">{voucher.voucher_number}</TableCell>
                  <TableCell className="text-right">{new Date(voucher.voucher_date).toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell className="text-right">{voucher.expense_category}</TableCell>
                  <TableCell className="text-right">{voucher.net_amount.toFixed(3)} د.ك</TableCell>
                  <TableCell className="text-right">{voucher.payment_method}</TableCell>
                  <TableCell className="text-right">{voucher.cost_center?.cost_center_name || '-'}</TableCell>
                  <TableCell className="text-right">{getStatusBadge(voucher.approval_status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
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