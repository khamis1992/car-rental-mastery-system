import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpCircle, ArrowDownCircle, Eye, RefreshCw } from 'lucide-react';
import { BankTransaction } from '@/repositories/interfaces/IBankTransactionRepository';
import { useBankTransactions } from '@/hooks/useBankTransactions';

interface BankTransactionsListProps {
  selectedBankAccount?: string;
  onBankAccountChange?: (accountId: string) => void;
}

export const BankTransactionsList: React.FC<BankTransactionsListProps> = ({
  selectedBankAccount,
  onBankAccountChange
}) => {
  const { 
    transactions, 
    bankAccounts, 
    loading, 
    balance,
    refreshData,
    updateTransactionStatus 
  } = useBankTransactions(selectedBankAccount);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3
    }).format(amount);
  };

  const getTransactionTypeIcon = (type: string, debitAmount: number, creditAmount: number) => {
    if (type === 'deposit' || creditAmount > 0) {
      return <ArrowDownCircle className="w-4 h-4 text-success" />;
    }
    return <ArrowUpCircle className="w-4 h-4 text-destructive" />;
  };

  const getTransactionTypeLabel = (type: string, debitAmount: number, creditAmount: number) => {
    if (type === 'deposit' || creditAmount > 0) {
      return 'إيداع';
    }
    return 'سحب';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-success text-success-foreground">مكتمل</Badge>;
      case 'pending':
        return <Badge variant="secondary">في الانتظار</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStatusChange = async (transactionId: string, newStatus: string) => {
    await updateTransactionStatus(transactionId, newStatus);
  };

  return (
    <div className="space-y-4">
      {/* اختيار الحساب البنكي ومعلومات الرصيد */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2 flex-row-reverse">
            <Eye className="w-5 h-5" />
            معاملات الحساب البنكي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-2 block">الحساب البنكي</label>
              <Select value={selectedBankAccount} onValueChange={onBankAccountChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحساب البنكي" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} - {account.account_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBankAccount && (
              <div>
                <label className="text-sm font-medium mb-2 block">الرصيد الحالي</label>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(balance)}
                </div>
              </div>
            )}

            <div>
              <Button 
                onClick={refreshData}
                disabled={loading}
                variant="outline"
                className="w-full rtl-flex"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                تحديث البيانات
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المعاملات */}
      {selectedBankAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="rtl-title">المعاملات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">جاري تحميل المعاملات...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">المرجع</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">الرصيد بعد</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-row-reverse">
                          {getTransactionTypeIcon(
                            transaction.transaction_type, 
                            transaction.debit_amount, 
                            transaction.credit_amount
                          )}
                          {getTransactionTypeLabel(
                            transaction.transaction_type, 
                            transaction.debit_amount, 
                            transaction.credit_amount
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.reference_number || '-'}</TableCell>
                      <TableCell>
                        <span className={
                          transaction.credit_amount > 0 ? 'text-success font-medium' : 'text-destructive font-medium'
                        }>
                          {transaction.credit_amount > 0 
                            ? `+${formatCurrency(transaction.credit_amount)}`
                            : `-${formatCurrency(transaction.debit_amount)}`
                          }
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(transaction.balance_after)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        {transaction.status === 'pending' && (
                          <Select
                            value={transaction.status}
                            onValueChange={(value) => handleStatusChange(transaction.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="completed">مكتمل</SelectItem>
                              <SelectItem value="cancelled">ملغي</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        لا توجد معاملات لهذا الحساب
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};