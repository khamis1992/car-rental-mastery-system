import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChartOfAccount } from '@/types/accounting';
import { accountingService } from '@/services/accountingService';
import { useToast } from '@/hooks/use-toast';

export const ChartOfAccountsTab = () => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: '',
    account_category: '',
    parent_account_id: '',
    allow_posting: true,
    opening_balance: 0,
    notes: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, selectedType]);

  const loadAccounts = async () => {
    try {
      const data = await accountingService.getChartOfAccounts();
      setAccounts(data);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل دليل الحسابات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_code.includes(searchTerm)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(account => account.account_type === selectedType);
    }

    setFilteredAccounts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await accountingService.updateAccount(editingAccount.id, formData as any);
        toast({
          title: 'تم بنجاح',
          description: 'تم تحديث الحساب بنجاح',
        });
      } else {
        await accountingService.createAccount({
          ...formData,
          level: formData.parent_account_id ? 3 : 1,
          is_active: true,
          current_balance: formData.opening_balance
        } as any);
        toast({
          title: 'تم بنجاح',
          description: 'تم إنشاء الحساب بنجاح',
        });
      }
      
      setIsDialogOpen(false);
      setEditingAccount(null);
      resetForm();
      loadAccounts();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الحساب',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (account: ChartOfAccount) => {
    setEditingAccount(account);
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      account_category: account.account_category,
      parent_account_id: account.parent_account_id || '',
      allow_posting: account.allow_posting,
      opening_balance: account.opening_balance,
      notes: account.notes || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      account_code: '',
      account_name: '',
      account_type: '',
      account_category: '',
      parent_account_id: '',
      allow_posting: true,
      opening_balance: 0,
      notes: ''
    });
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      asset: 'أصول',
      liability: 'خصوم',
      equity: 'حقوق ملكية',
      revenue: 'إيرادات',
      expense: 'مصروفات'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatBalance = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex justify-between items-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingAccount(null); }}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة حساب جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? 'تعديل الحساب' : 'إضافة حساب جديد'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="account_code">رقم الحساب</Label>
                  <Input
                    id="account_code"
                    value={formData.account_code}
                    onChange={(e) => setFormData({...formData, account_code: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="account_name">اسم الحساب</Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="account_type">نوع الحساب</Label>
                  <Select value={formData.account_type} onValueChange={(value) => setFormData({...formData, account_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الحساب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">أصول</SelectItem>
                      <SelectItem value="liability">خصوم</SelectItem>
                      <SelectItem value="equity">حقوق ملكية</SelectItem>
                      <SelectItem value="revenue">إيرادات</SelectItem>
                      <SelectItem value="expense">مصروفات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="opening_balance">الرصيد الافتتاحي</Label>
                  <Input
                    id="opening_balance"
                    type="number"
                    step="0.001"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({...formData, opening_balance: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingAccount ? 'تحديث' : 'إضافة'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <CardTitle>دليل الحسابات</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* فلاتر البحث */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث برقم أو اسم الحساب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="نوع الحساب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="asset">أصول</SelectItem>
              <SelectItem value="liability">خصوم</SelectItem>
              <SelectItem value="equity">حقوق ملكية</SelectItem>
              <SelectItem value="revenue">إيرادات</SelectItem>
              <SelectItem value="expense">مصروفات</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* جدول الحسابات */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الإجراءات</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الرصيد الحالي</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">اسم الحساب</TableHead>
              <TableHead className="text-right">رقم الحساب</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(account)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={account.is_active ? 'default' : 'secondary'}>
                    {account.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </TableCell>
                <TableCell className={`font-medium ${account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatBalance(account.current_balance)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getAccountTypeLabel(account.account_type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div style={{ paddingRight: `${(account.level - 1) * 20}px` }}>
                    {account.account_name}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{account.account_code}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredAccounts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد حسابات مطابقة لبحثك
          </div>
        )}
      </CardContent>
    </Card>
  );
};