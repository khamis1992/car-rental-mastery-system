
import React, { useState, useEffect } from 'react';
import { Plus, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChartOfAccount } from '@/types/accounting';
import { ParentAccountSelector } from './ParentAccountSelector';
import { AccountHierarchyDisplay } from './AccountHierarchyDisplay';

interface SubAccountCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accountData: any) => void;
  accounts: ChartOfAccount[];
  parentAccount?: ChartOfAccount;
}

export const SubAccountCreator: React.FC<SubAccountCreatorProps> = ({
  isOpen,
  onClose,
  onSubmit,
  accounts,
  parentAccount
}) => {
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    parent_account_id: parentAccount?.id || '',
    level: parentAccount ? parentAccount.level + 1 : 1,
    account_type: parentAccount?.account_type || '',
    account_category: parentAccount?.account_category || '',
    allow_posting: true,
    opening_balance: 0,
    notes: ''
  });

  const [suggestedCode, setSuggestedCode] = useState('');
  const [codeValidation, setCodeValidation] = useState({ isValid: true, message: '' });

  useEffect(() => {
    if (parentAccount) {
      setFormData(prev => ({
        ...prev,
        parent_account_id: parentAccount.id,
        level: parentAccount.level + 1,
        account_type: parentAccount.account_type,
        account_category: parentAccount.account_category
      }));
      generateSuggestedCode(parentAccount);
    }
  }, [parentAccount]);

  const generateSuggestedCode = (parent: ChartOfAccount) => {
    // إنشاء رقم حساب مقترح بناءً على الحساب الأب
    const childAccounts = accounts.filter(acc => acc.parent_account_id === parent.id);
    const maxChildCode = childAccounts.reduce((max, acc) => {
      const codeNumber = parseInt(acc.account_code.slice(parent.account_code.length));
      return isNaN(codeNumber) ? max : Math.max(max, codeNumber);
    }, 0);
    
    const nextNumber = maxChildCode + 1;
    const suggested = parent.account_code + nextNumber.toString().padStart(2, '0');
    setSuggestedCode(suggested);
    
    setFormData(prev => ({
      ...prev,
      account_code: suggested
    }));
  };

  const validateAccountCode = (code: string) => {
    if (!code) {
      setCodeValidation({ isValid: false, message: 'رقم الحساب مطلوب' });
      return;
    }

    // التحقق من عدم وجود الرقم مسبقاً
    const existingAccount = accounts.find(acc => acc.account_code === code);
    if (existingAccount) {
      setCodeValidation({ isValid: false, message: 'رقم الحساب موجود بالفعل' });
      return;
    }

    // التحقق من أن الرقم يبدأ برقم الحساب الأب
    if (formData.parent_account_id) {
      const parent = accounts.find(acc => acc.id === formData.parent_account_id);
      if (parent && !code.startsWith(parent.account_code)) {
        setCodeValidation({ 
          isValid: false, 
          message: `يجب أن يبدأ رقم الحساب بـ ${parent.account_code}` 
        });
        return;
      }
    }

    setCodeValidation({ isValid: true, message: '' });
  };

  const handleParentSelect = (parentId: string, level: number) => {
    const parent = accounts.find(acc => acc.id === parentId);
    if (parent) {
      setFormData(prev => ({
        ...prev,
        parent_account_id: parentId,
        level,
        account_type: parent.account_type,
        account_category: parent.account_category
      }));
      generateSuggestedCode(parent);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codeValidation.isValid) {
      return;
    }

    onSubmit({
      ...formData,
      is_active: true,
      current_balance: formData.opening_balance
    });
    
    // إعادة تعيين النموذج
    setFormData({
      account_code: '',
      account_name: '',
      parent_account_id: '',
      level: 1,
      account_type: '',
      account_category: '',
      allow_posting: true,
      opening_balance: 0,
      notes: ''
    });
  };

  const selectedParent = accounts.find(acc => acc.id === formData.parent_account_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title">إضافة حساب فرعي جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* اختيار الحساب الأب */}
          <ParentAccountSelector
            accounts={accounts}
            selectedParentId={formData.parent_account_id}
            onParentSelect={handleParentSelect}
          />

          {/* معاينة التسلسل الهرمي */}
          {selectedParent && (
            <div className="space-y-2">
              <Label className="rtl-label">معاينة التسلسل الهرمي</Label>
              <div className="border rounded-md p-3 bg-muted/30">
                <AccountHierarchyDisplay account={selectedParent} allAccounts={accounts} />
                <div className="mt-2 text-sm text-muted-foreground">
                  ← سيتم إضافة الحساب الجديد هنا (مستوى {formData.level})
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* رقم الحساب */}
            <div className="space-y-2">
              <Label htmlFor="account_code" className="rtl-label">رقم الحساب</Label>
              <div className="flex gap-2">
                <Input
                  id="account_code"
                  value={formData.account_code}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, account_code: e.target.value }));
                    validateAccountCode(e.target.value);
                  }}
                  placeholder="رقم الحساب"
                  className={codeValidation.isValid ? '' : 'border-destructive'}
                  required
                />
                {suggestedCode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, account_code: suggestedCode }));
                      validateAccountCode(suggestedCode);
                    }}
                  >
                    اقتراح
                  </Button>
                )}
              </div>
              {!codeValidation.isValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{codeValidation.message}</AlertDescription>
                </Alert>
              )}
              {suggestedCode && (
                <div className="text-xs text-muted-foreground">
                  الرقم المقترح: {suggestedCode}
                </div>
              )}
            </div>

            {/* اسم الحساب */}
            <div className="space-y-2">
              <Label htmlFor="account_name" className="rtl-label">اسم الحساب</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                placeholder="اسم الحساب"
                required
              />
            </div>

            {/* نوع الحساب (للقراءة فقط) */}
            {selectedParent && (
              <>
                <div className="space-y-2">
                  <Label className="rtl-label">نوع الحساب</Label>
                  <Input
                    value={formData.account_type}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="rtl-label">المستوى</Label>
                  <Input
                    value={formData.level}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </>
            )}

            {/* الرصيد الافتتاحي */}
            <div className="space-y-2">
              <Label htmlFor="opening_balance" className="rtl-label">الرصيد الافتتاحي</Label>
              <Input
                id="opening_balance"
                type="number"
                step="0.001"
                value={formData.opening_balance}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  opening_balance: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>

            {/* السماح بالترحيل */}
            <div className="space-y-2">
              <Label className="rtl-label">إعدادات الحساب</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allow_posting"
                  checked={formData.allow_posting}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    allow_posting: e.target.checked 
                  }))}
                />
                <Label htmlFor="allow_posting" className="text-sm">السماح بالترحيل</Label>
              </div>
            </div>
          </div>

          {/* ملاحظات */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="rtl-label">ملاحظات</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="ملاحظات إضافية..."
              className="w-full min-h-[80px] p-2 border rounded-md"
            />
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex justify-end gap-2 flex-row-reverse">
            <Button type="submit" disabled={!codeValidation.isValid}>
              <Plus className="w-4 h-4" />
              إضافة الحساب
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
