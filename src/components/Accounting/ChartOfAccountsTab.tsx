
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Eye, Upload, GitBranch, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartOfAccount } from '@/types/accounting';
import { accountingService } from '@/services/accountingService';
import { useToast } from '@/hooks/use-toast';
import { AccountDetailsModal } from './AccountDetailsModal';
import { ChartOfAccountsImportDialog } from './ChartOfAccountsImportDialog';
import { SubAccountCreator } from './SubAccountCreator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const ChartOfAccountsTab = () => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [isSubAccountDialogOpen, setIsSubAccountDialogOpen] = useState(false);
  const [selectedParentAccount, setSelectedParentAccount] = useState<ChartOfAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAccountForDetails, setSelectedAccountForDetails] = useState<ChartOfAccount | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<ChartOfAccount | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, selectedType, selectedLevel]);

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

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(account => account.level === parseInt(selectedLevel));
    }

    // ترتيب الحسابات حسب الرقم
    filtered.sort((a, b) => a.account_code.localeCompare(b.account_code));

    setFilteredAccounts(filtered);
  };

  const handleCreateSubAccount = async (accountData: any) => {
    try {
      await accountingService.createAccount(accountData);
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء الحساب الفرعي بنجاح',
      });
      
      setIsSubAccountDialogOpen(false);
      setSelectedParentAccount(null);
      loadAccounts();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الحساب الفرعي',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (account: ChartOfAccount) => {
    setSelectedAccountForDetails(account);
    setIsDetailsModalOpen(true);
  };

  const handleAddSubAccount = (parentAccount: ChartOfAccount) => {
    if (parentAccount.level >= 5) {
      toast({
        title: 'تحذير',
        description: 'لا يمكن إضافة حسابات فرعية للمستوى الخامس',
        variant: 'destructive',
      });
      return;
    }

    setSelectedParentAccount(parentAccount);
    setIsSubAccountDialogOpen(true);
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

  const getSubAccountsCount = (parentId: string) => {
    return accounts.filter(acc => acc.parent_account_id === parentId).length;
  };

  const handleDeleteAccount = async (account: ChartOfAccount) => {
    try {
      // التحقق من وجود حسابات فرعية
      const subAccountsCount = getSubAccountsCount(account.id);
      if (subAccountsCount > 0) {
        toast({
          title: 'لا يمكن الحذف',
          description: `لا يمكن حذف هذا الحساب لأنه يحتوي على ${subAccountsCount} حساب فرعي`,
          variant: 'destructive',
        });
        return;
      }

      // التحقق من وجود معاملات في الحساب
      if (account.current_balance !== 0) {
        toast({
          title: 'تحذير',
          description: 'لا يمكن حذف حساب له رصيد. يجب أن يكون الرصيد صفر قبل الحذف',
          variant: 'destructive',
        });
        return;
      }

      // حذف الحساب
      await accountingService.deleteAccount(account.id);
      
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الحساب بنجاح',
      });
      
      // إعادة تحميل البيانات
      loadAccounts();
      setAccountToDelete(null);
    } catch (error) {
      console.error('خطأ في حذف الحساب:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الحساب. قد يكون الحساب مرتبط بمعاملات محاسبية',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <Card className="card-elegant">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="rtl-title">قائمة الحسابات</CardTitle>
          <div className="flex gap-2 flex-row-reverse">
            <Button 
              onClick={() => setIsSubAccountDialogOpen(true)}
              className="rtl-flex"
            >
              <Plus className="w-4 h-4" />
              إضافة حساب جديد
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsImportDialogOpen(true)}
              className="rtl-flex"
            >
              <Upload className="w-4 h-4" />
              استيراد CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* فلاتر البحث المحسنة */}
        <div className="flex gap-4 mb-4 flex-row-reverse flex-wrap">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              <SelectItem value="1">المستوى 1</SelectItem>
              <SelectItem value="2">المستوى 2</SelectItem>
              <SelectItem value="3">المستوى 3</SelectItem>
              <SelectItem value="4">المستوى 4</SelectItem>
              <SelectItem value="5">المستوى 5</SelectItem>
            </SelectContent>
          </Select>

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

          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث برقم أو اسم الحساب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </div>

        {/* جدول الحسابات المحسن */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم الحساب</TableHead>
              <TableHead className="text-right">اسم الحساب</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">المستوى</TableHead>
              <TableHead className="text-right">الحسابات الفرعية</TableHead>
              <TableHead className="text-right">الرصيد الحالي</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((account) => {
              const subAccountsCount = getSubAccountsCount(account.id);
              return (
                <TableRow key={account.id}>
                  <TableCell className="text-right font-medium">{account.account_code}</TableCell>
                  <TableCell className="text-right">
                    <div style={{ paddingRight: `${(account.level - 1) * 20}px` }}>
                      {account.account_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Badge variant="outline">
                        {getAccountTypeLabel(account.account_type)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">مستوى {account.level}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-muted-foreground">{subAccountsCount}</span>
                      {subAccountsCount > 0 && <GitBranch className="w-3 h-3" />}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatBalance(account.current_balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </TableCell>
                   <TableCell className="text-right">
                    <div className="flex items-center gap-1 flex-row-reverse">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="حذف الحساب"
                            onClick={() => setAccountToDelete(account)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد حذف الحساب</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف الحساب "{account.account_name}" رقم {account.account_code}؟
                              <br />
                              <span className="text-destructive font-medium">
                                هذا الإجراء لا يمكن التراجع عنه.
                              </span>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex gap-2 flex-row-reverse">
                            <AlertDialogAction
                              onClick={() => handleDeleteAccount(account)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      {account.level < 5 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddSubAccount(account)}
                          className="h-8 w-8 p-0"
                          title="إضافة حساب فرعي"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(account)}
                        className="h-8 w-8 p-0"
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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

      {/* CSV Import Dialog */}
      <ChartOfAccountsImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportComplete={() => {
          setIsImportDialogOpen(false);
          loadAccounts();
        }}
      />

      {/* Sub Account Creator Dialog */}
      <SubAccountCreator
        isOpen={isSubAccountDialogOpen}
        onClose={() => {
          setIsSubAccountDialogOpen(false);
          setSelectedParentAccount(null);
        }}
        onSubmit={handleCreateSubAccount}
        accounts={accounts}
        parentAccount={selectedParentAccount}
      />
    </Card>
  );
};
