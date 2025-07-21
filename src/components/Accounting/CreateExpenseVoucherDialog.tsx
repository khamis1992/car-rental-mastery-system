
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { expenseVoucherService, type ExpenseCategory, type CreateExpenseVoucherData } from '@/services/expenseVoucherService';
import { accountingService } from '@/services/accountingService';
import { toast } from 'sonner';

interface CreateExpenseVoucherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface VoucherItem {
  id: string;
  expense_category_id: string;
  account_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  cost_center_id?: string;
  project_code?: string;
  notes?: string;
}

export const CreateExpenseVoucherDialog: React.FC<CreateExpenseVoucherDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    voucher_date: new Date().toISOString().split('T')[0],
    beneficiary_name: '',
    beneficiary_type: 'supplier' as const,
    payment_method: 'cash' as const,
    bank_account_id: '',
    check_number: '',
    reference_number: '',
    description: '',
    notes: '',
    cost_center_id: ''
  });
  const [items, setItems] = useState<VoucherItem[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
      addNewItem();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [categoriesData, accountsData] = await Promise.all([
        expenseVoucherService.getExpenseCategories(),
        accountingService.getChartOfAccounts()
      ]);
      setCategories(categoriesData);
      setAccounts(accountsData.filter(acc => acc.allow_posting));
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast.error('فشل في تحميل البيانات');
    }
  };

  const addNewItem = () => {
    const newItem: VoucherItem = {
      id: Date.now().toString(),
      expense_category_id: '',
      account_id: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      cost_center_id: '',
      project_code: '',
      notes: ''
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof VoucherItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const calculateTotals = () => {
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.tax_rate / 100), 0);
    const netAmount = totalAmount + taxAmount;
    return { totalAmount, taxAmount, netAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.beneficiary_name.trim()) {
      toast.error('يرجى إدخال اسم المستفيد');
      return;
    }

    if (items.length === 0 || items.some(item => !item.expense_category_id || !item.account_id || !item.description)) {
      toast.error('يرجى إكمال جميع بنود السند');
      return;
    }

    try {
      setLoading(true);
      
      const voucherData: CreateExpenseVoucherData = {
        ...formData,
        items: items.map(item => ({
          expense_category_id: item.expense_category_id,
          account_id: item.account_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          cost_center_id: item.cost_center_id,
          project_code: item.project_code,
          notes: item.notes
        }))
      };

      await expenseVoucherService.createExpenseVoucher(voucherData);
      toast.success('تم إنشاء سند الصرف بنجاح');
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('خطأ في إنشاء السند:', error);
      toast.error('فشل في إنشاء سند الصرف');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      voucher_date: new Date().toISOString().split('T')[0],
      beneficiary_name: '',
      beneficiary_type: 'supplier',
      payment_method: 'cash',
      bank_account_id: '',
      check_number: '',
      reference_number: '',
      description: '',
      notes: '',
      cost_center_id: ''
    });
    setItems([]);
  };

  const { totalAmount, taxAmount, netAmount } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء سند صرف جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* معلومات السند الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات السند</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voucher_date">تاريخ السند</Label>
                <Input
                  id="voucher_date"
                  type="date"
                  value={formData.voucher_date}
                  onChange={(e) => setFormData({...formData, voucher_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="beneficiary_name">اسم المستفيد</Label>
                <Input
                  id="beneficiary_name"
                  value={formData.beneficiary_name}
                  onChange={(e) => setFormData({...formData, beneficiary_name: e.target.value})}
                  placeholder="اسم المستفيد..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="beneficiary_type">نوع المستفيد</Label>
                <Select value={formData.beneficiary_type} onValueChange={(value: any) => setFormData({...formData, beneficiary_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">مورد</SelectItem>
                    <SelectItem value="employee">موظف</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment_method">طريقة الدفع</Label>
                <Select value={formData.payment_method} onValueChange={(value: any) => setFormData({...formData, payment_method: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقداً</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.payment_method === 'check' && (
                <div>
                  <Label htmlFor="check_number">رقم الشيك</Label>
                  <Input
                    id="check_number"
                    value={formData.check_number}
                    onChange={(e) => setFormData({...formData, check_number: e.target.value})}
                    placeholder="رقم الشيك..."
                  />
                </div>
              )}
              <div>
                <Label htmlFor="reference_number">رقم المرجع</Label>
                <Input
                  id="reference_number"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                  placeholder="رقم المرجع..."
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">وصف السند</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="وصف السند..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* بنود السند */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>بنود السند</CardTitle>
                <Button type="button" onClick={addNewItem} variant="outline" size="sm">
                  <PlusCircle className="w-4 h-4 ml-2" />
                  إضافة بند
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفئة</TableHead>
                    <TableHead>الحساب</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>نسبة الضريبة %</TableHead>
                    <TableHead>المجموع</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select value={item.expense_category_id} onValueChange={(value) => updateItem(item.id, 'expense_category_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.category_name_ar}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={item.account_id} onValueChange={(value) => updateItem(item.id, 'account_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحساب" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.account_code} - {acc.account_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="وصف البند..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.001"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.001"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.tax_rate}
                          onChange={(e) => updateItem(item.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell>
                        {((item.quantity * item.unit_price) * (1 + item.tax_rate / 100)).toFixed(3)} د.ك
                      </TableCell>
                      <TableCell>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ملخص المبالغ */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص المبالغ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalAmount.toFixed(3)}</div>
                  <div className="text-sm text-muted-foreground">المبلغ الإجمالي</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{taxAmount.toFixed(3)}</div>
                  <div className="text-sm text-muted-foreground">الضريبة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{netAmount.toFixed(3)}</div>
                  <div className="text-sm text-muted-foreground">المبلغ الصافي</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* أزرار التحكم */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ السند'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
