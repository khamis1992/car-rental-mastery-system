import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartOfAccountsSetup } from '@/components/Accounting/ChartOfAccountsSetup';
import { GeneralLedgerReport } from '@/components/Accounting/GeneralLedgerReport';
import { SimplifiedAccountingDashboard } from '@/components/Accounting/SimplifiedAccountingDashboard';
import { FinancialBreadcrumb } from '@/components/Financial/FinancialBreadcrumb';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Upload, Download, BarChart3, Settings, FileText, Search, Eye, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChartOfAccount } from '@/types/accounting';
import { accountingService } from '@/services/accountingService';
import { useToast } from '@/hooks/use-toast';
import { AccountDetailsModal } from '@/components/Accounting/AccountDetailsModal';
import { useAccountingData } from '@/hooks/useAccountingData';

const ChartOfAccounts = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAccountForDetails, setSelectedAccountForDetails] = useState<ChartOfAccount | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
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

  const handleViewDetails = (account: ChartOfAccount) => {
    setSelectedAccountForDetails(account);
    setIsDetailsModalOpen(true);
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

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold rtl-title">إدارة الحسابات</h2>
          <p className="text-muted-foreground">إدارة وتكوين دليل الحسابات الخاص بك</p>
        </div>
        <FinancialBreadcrumb />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">إعداد الحسابات</TabsTrigger>
          <TabsTrigger value="ledger">دفتر الأستاذ</TabsTrigger>
          <TabsTrigger value="accounts">دليل الحسابات</TabsTrigger>
          <TabsTrigger value="dashboard">لوحة المعلومات</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <SimplifiedAccountingDashboard />
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <ChartOfAccountsSetup />
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <GeneralLedgerReport />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
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
                    <TableHead className="text-right">إجراءات</TableHead>
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
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 flex-row-reverse">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(account)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(account)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Badge variant={account.is_active ? 'default' : 'secondary'}>
                            {account.is_active ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatBalance(account.current_balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Badge variant="outline">
                            {getAccountTypeLabel(account.account_type)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div style={{ paddingRight: `${(account.level - 1) * 20}px` }}>
                          {account.account_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{account.account_code}</TableCell>
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

            {/* Modal تفاصيل الحساب */}
            <AccountDetailsModal
              account={selectedAccountForDetails}
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false);
                setSelectedAccountForDetails(null);
              }}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChartOfAccounts;
