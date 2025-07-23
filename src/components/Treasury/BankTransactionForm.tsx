import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, DollarSign } from 'lucide-react';
import { useBankTransactions } from '@/hooks/useBankTransactions';
import { BankAccount } from '@/repositories/interfaces/IBankAccountRepository';

interface BankTransactionFormProps {
  selectedBankAccount?: string;
  onTransactionAdded?: () => void;
}

export const BankTransactionForm: React.FC<BankTransactionFormProps> = ({
  selectedBankAccount,
  onTransactionAdded
}) => {
  const { bankAccounts, addDeposit, addWithdrawal, loading } = useBankTransactions();
  const [formData, setFormData] = useState({
    bankAccountId: selectedBankAccount || '',
    transactionType: 'deposit',
    amount: '',
    description: '',
    referenceNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bankAccountId || !formData.amount || !formData.description) {
      return;
    }

    const amount = parseFloat(formData.amount);
    let success = false;

    if (formData.transactionType === 'deposit') {
      success = await addDeposit(
        formData.bankAccountId,
        amount,
        formData.description,
        formData.referenceNumber || undefined
      );
    } else {
      success = await addWithdrawal(
        formData.bankAccountId,
        amount,
        formData.description,
        formData.referenceNumber || undefined
      );
    }

    if (success) {
      // إعادة تعيين النموذج
      setFormData({
        bankAccountId: selectedBankAccount || '',
        transactionType: 'deposit',
        amount: '',
        description: '',
        referenceNumber: ''
      });
      
      onTransactionAdded?.();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2 flex-row-reverse">
          <PlusCircle className="w-5 h-5" />
          إضافة معاملة بنكية جديدة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* الحساب البنكي */}
            <div>
              <Label htmlFor="bankAccount">الحساب البنكي *</Label>
              <Select 
                value={formData.bankAccountId} 
                onValueChange={(value) => handleInputChange('bankAccountId', value)}
              >
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

            {/* نوع المعاملة */}
            <div>
              <Label htmlFor="transactionType">نوع المعاملة *</Label>
              <Select 
                value={formData.transactionType} 
                onValueChange={(value) => handleInputChange('transactionType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">إيداع</SelectItem>
                  <SelectItem value="withdrawal">سحب</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* المبلغ */}
            <div>
              <Label htmlFor="amount">المبلغ (دينار كويتي) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.000"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* رقم المرجع */}
            <div>
              <Label htmlFor="referenceNumber">رقم المرجع</Label>
              <Input
                id="referenceNumber"
                type="text"
                placeholder="اختياري"
                value={formData.referenceNumber}
                onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
              />
            </div>
          </div>

          {/* الوصف */}
          <div>
            <Label htmlFor="description">الوصف *</Label>
            <Textarea
              id="description"
              placeholder="وصف المعاملة"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center gap-2 flex-row-reverse">
            <Button 
              type="submit" 
              disabled={loading || !formData.bankAccountId || !formData.amount || !formData.description}
              className="rtl-flex"
            >
              <PlusCircle className="w-4 h-4" />
              {loading ? 'جاري الحفظ...' : 
                formData.transactionType === 'deposit' ? 'إضافة إيداع' : 'إضافة سحب'
              }
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setFormData({
                bankAccountId: selectedBankAccount || '',
                transactionType: 'deposit',
                amount: '',
                description: '',
                referenceNumber: ''
              })}
              className="rtl-flex"
            >
              إعادة تعيين
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};