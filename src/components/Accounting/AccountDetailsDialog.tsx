import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AccountDetails } from '@/services/accountService';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Building2, 
  Calculator, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Users,
  X
} from 'lucide-react';

interface AccountDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accountDetails: AccountDetails | null;
}

export const AccountDetailsDialog: React.FC<AccountDetailsDialogProps> = ({
  isOpen,
  onClose,
  accountDetails
}) => {
  if (!accountDetails) return null;

  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const getAccountTypeLabel = (type: string) => {
    const types = {
      asset: 'أصول',
      liability: 'التزامات', 
      equity: 'حقوق الملكية',
      revenue: 'إيرادات',
      expense: 'مصروفات'
    };
    return types[type as keyof typeof types] || type;
  };

  const getAccountCategoryLabel = (category: string) => {
    const categories = {
      current_asset: 'أصول متداولة',
      fixed_asset: 'أصول ثابتة',
      current_liability: 'التزامات متداولة',
      long_term_liability: 'التزامات طويلة الأجل',
      capital: 'رأس المال',
      operating_revenue: 'إيرادات تشغيلية',
      other_revenue: 'إيرادات أخرى',
      operating_expense: 'مصروفات تشغيلية',
      other_expense: 'مصروفات أخرى'
    };
    return categories[category as keyof typeof categories] || category;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-right">
              تفاصيل الحساب - {accountDetails.account_name}
              <Building2 className="w-5 h-5" />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات أساسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-end text-right">
                  المعلومات الأساسية
                  <FileText className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">{accountDetails.account_code}</span>
                  <span className="text-muted-foreground">: رقم الحساب</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{accountDetails.account_name}</span>
                  <span className="text-muted-foreground">: اسم الحساب</span>
                </div>
                {accountDetails.account_name_en && (
                  <div className="flex justify-between">
                    <span className="font-medium">{accountDetails.account_name_en}</span>
                    <span className="text-muted-foreground">: الاسم الإنجليزي</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <Badge variant="outline">{getAccountTypeLabel(accountDetails.account_type)}</Badge>
                  <span className="text-muted-foreground">: نوع الحساب</span>
                </div>
                <div className="flex justify-between">
                  <Badge variant="secondary">{getAccountCategoryLabel(accountDetails.account_category)}</Badge>
                  <span className="text-muted-foreground">: تصنيف الحساب</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">المستوى {accountDetails.level}</span>
                  <span className="text-muted-foreground">: المستوى الهرمي</span>
                </div>
                <div className="flex justify-between">
                  <Badge variant={accountDetails.allow_posting ? "default" : "destructive"}>
                    {accountDetails.allow_posting ? 'يقبل قيود' : 'لا يقبل قيود'}
                  </Badge>
                  <span className="text-muted-foreground">: إمكانية الترحيل</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-end text-right">
                  الأرصدة المالية
                  <Calculator className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">{formatCurrency(accountDetails.opening_balance)}</span>
                  <span className="text-muted-foreground">: الرصيد الافتتاحي</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-lg">{formatCurrency(accountDetails.current_balance)}</span>
                  <span className="text-muted-foreground">: الرصيد الحالي</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">
                    {formatCurrency(accountDetails.current_balance - accountDetails.opening_balance)}
                  </span>
                  <span className="text-muted-foreground">: صافي الحركة</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* الحساب الأب */}
          {accountDetails.parent_account && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-end text-right">
                  الحساب الأب
                  <TrendingUp className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{accountDetails.parent_account.account_name}</p>
                    <p className="text-sm text-muted-foreground">{accountDetails.parent_account.account_code}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    عرض التفاصيل
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* الحسابات الفرعية */}
          {accountDetails.sub_accounts && accountDetails.sub_accounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-end text-right">
                  الحسابات الفرعية ({accountDetails.sub_accounts.length})
                  <Users className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accountDetails.sub_accounts.map((subAccount) => (
                    <div key={subAccount.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div className="text-right">
                        <p className="font-medium">{subAccount.account_name}</p>
                        <p className="text-sm text-muted-foreground">{subAccount.account_code}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{formatCurrency(subAccount.current_balance)}</p>
                        <Badge variant="outline" className="text-xs">
                          {getAccountTypeLabel(subAccount.account_type)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* أحدث المعاملات */}
          {accountDetails.recent_transactions && accountDetails.recent_transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-end text-right">
                  أحدث المعاملات
                  <Calendar className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accountDetails.recent_transactions.slice(0, 5).map((transaction: any) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div className="text-right">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          قيد رقم: {transaction.journal_entries.entry_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.journal_entries.entry_date), 'dd/MM/yyyy', { locale: ar })}
                        </p>
                      </div>
                      <div className="text-left">
                        {transaction.debit_amount > 0 && (
                          <p className="font-medium text-green-600">
                            مدين: {formatCurrency(transaction.debit_amount)}
                          </p>
                        )}
                        {transaction.credit_amount > 0 && (
                          <p className="font-medium text-red-600">
                            دائن: {formatCurrency(transaction.credit_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ملاحظات */}
          {accountDetails.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right">ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-muted p-3 rounded-md">{accountDetails.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};