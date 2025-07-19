
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { BudgetService } from '@/services/BudgetService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrencyKWD } from '@/lib/currency';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
}

interface BudgetItem {
  id: string;
  account_id: string;
  budgeted_amount: number;
  actual_amount?: number;
  variance_amount?: number;
  variance_percentage?: number;
  description?: string;
  account?: Account;
}

interface BudgetItemManagerProps {
  budgetId: string;
  items: BudgetItem[];
  onItemsChange: () => void;
}

export const BudgetItemManager: React.FC<BudgetItemManagerProps> = ({
  budgetId,
  items,
  onItemsChange
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const budgetService = new BudgetService();

  const [formData, setFormData] = useState({
    account_id: '',
    budgeted_amount: '',
    description: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('allow_posting', true)
        .eq('is_active', true)
        .order('account_code');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('فشل في تحميل الحسابات');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.budgeted_amount) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      if (editingItem) {
        await budgetService.updateBudgetItem(editingItem.id, {
          account_id: formData.account_id,
          budgeted_amount: parseFloat(formData.budgeted_amount),
          description: formData.description
        });
        toast.success('تم تحديث بند الميزانية بنجاح');
      } else {
        await budgetService.addBudgetItem({
          budget_id: budgetId,
          account_id: formData.account_id,
          budgeted_amount: parseFloat(formData.budgeted_amount),
          description: formData.description
        });
        toast.success('تم إضافة بند الميزانية بنجاح');
      }

      setIsDialogOpen(false);
      resetForm();
      onItemsChange();
    } catch (error) {
      console.error('Error saving budget item:', error);
      toast.error('فشل في حفظ بند الميزانية');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      account_id: item.account_id,
      budgeted_amount: item.budgeted_amount.toString(),
      description: item.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البند؟')) return;

    try {
      await budgetService.deleteBudgetItem(itemId);
      toast.success('تم حذف بند الميزانية بنجاح');
      onItemsChange();
    } catch (error) {
      console.error('Error deleting budget item:', error);
      toast.error('فشل في حذف بند الميزانية');
    }
  };

  const resetForm = () => {
    setFormData({
      account_id: '',
      budgeted_amount: '',
      description: ''
    });
    setEditingItem(null);
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>بنود الميزانية</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="rtl-flex">
                <Plus className="w-4 h-4" />
                إضافة بند جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'تعديل بند الميزانية' : 'إضافة بند جديد'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="account">الحساب</Label>
                  <Select 
                    value={formData.account_id} 
                    onValueChange={(value) => setFormData({...formData, account_id: value})}
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

                <div>
                  <Label htmlFor="amount">المبلغ المخطط (د.ك)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.001"
                    value={formData.budgeted_amount}
                    onChange={(e) => setFormData({...formData, budgeted_amount: e.target.value})}
                    placeholder="0.000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="وصف البند..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد بنود في الميزانية
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>كود الحساب</TableHead>
                <TableHead>اسم الحساب</TableHead>
                <TableHead>المبلغ المخطط</TableHead>
                <TableHead>المبلغ الفعلي</TableHead>
                <TableHead>التباين</TableHead>
                <TableHead>التباين %</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">
                    {item.account?.account_code}
                  </TableCell>
                  <TableCell>{item.account?.account_name}</TableCell>
                  <TableCell>{formatCurrencyKWD(item.budgeted_amount)}</TableCell>
                  <TableCell>{formatCurrencyKWD(item.actual_amount || 0)}</TableCell>
                  <TableCell className={getVarianceColor(item.variance_amount || 0)}>
                    {formatCurrencyKWD(item.variance_amount || 0)}
                  </TableCell>
                  <TableCell className={getVarianceColor(item.variance_amount || 0)}>
                    {item.variance_percentage?.toFixed(1) || '0.0'}%
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
