
import React, { useState, useEffect } from 'react';
import { Plus, Eye, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChartOfAccount } from '@/types/accounting';
import { ParentAccountSelector } from './ParentAccountSelector';
import { AccountHierarchyDisplay } from './AccountHierarchyDisplay';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
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
  const [codeValidation, setCodeValidation] = useState({
    isValid: true,
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (parentAccount && accounts.length > 0) {
      setFormData(prev => ({
        ...prev,
        parent_account_id: parentAccount.id,
        level: parentAccount.level + 1,
        account_type: parentAccount.account_type,
        account_category: parentAccount.account_category
      }));
      generateSuggestedCode(parentAccount);
    }
  }, [parentAccount, accounts]);

  const generateSuggestedCode = (parent: ChartOfAccount) => {
    try {
      console.log('جاري إنشاء رقم الحساب المقترح للحساب الأب:', parent.account_code);
      
      // البحث عن الحسابات الفرعية للحساب الأب
      const childAccounts = accounts.filter(acc => acc.parent_account_id === parent.id);
      console.log('عدد الحسابات الفرعية الموجودة:', childAccounts.length);
      
      // العثور على أعلى رقم فرعي
      let maxChildNumber = 0;
      childAccounts.forEach(acc => {
        if (acc.account_code && acc.account_code.startsWith(parent.account_code)) {
          const suffix = acc.account_code.substring(parent.account_code.length);
          const numberMatch = suffix.match(/^(\d+)/);
          if (numberMatch) {
            const number = parseInt(numberMatch[1]);
            if (!isNaN(number) && number > maxChildNumber) {
              maxChildNumber = number;
            }
          }
        }
      });
      
      const nextNumber = maxChildNumber + 1;
      const paddedNumber = nextNumber.toString().padStart(2, '0');
      const suggested = parent.account_code + paddedNumber;
      
      console.log('الرقم المقترح:', suggested);
      setSuggestedCode(suggested);
      
      setFormData(prev => ({
        ...prev,
        account_code: suggested
      }));
    } catch (error) {
      console.error('خطأ في إنشاء رقم الحساب المقترح:', error);
      toast({
        title: "تحذير",
        description: "لم يتم إنشاء رقم الحساب تلقائياً. يرجى إدخاله يدوياً.",
        variant: "destructive",
      });
    }
  };

  const validateAccountCode = (code: string) => {
    try {
      if (!code.trim()) {
        setCodeValidation({
          isValid: false,
          message: 'رقم الحساب مطلوب'
        });
        return false;
      }

      // التحقق من طول الرقم
      if (code.length < 3) {
        setCodeValidation({
          isValid: false,
          message: 'رقم الحساب يجب أن يكون 3 أرقام على الأقل'
        });
        return false;
      }

      // التحقق من عدم وجود الرقم مسبقاً
      const existingAccount = accounts.find(acc => acc.account_code === code.trim());
      if (existingAccount) {
        setCodeValidation({
          isValid: false,
          message: 'رقم الحساب موجود بالفعل'
        });
        return false;
      }

      // التحقق من أن الرقم يبدأ برقم الحساب الأب
      if (formData.parent_account_id) {
        const parent = accounts.find(acc => acc.id === formData.parent_account_id);
        if (parent && !code.startsWith(parent.account_code)) {
          setCodeValidation({
            isValid: false,
            message: `يجب أن يبدأ رقم الحساب بـ ${parent.account_code}`
          });
          return false;
        }
      }

      setCodeValidation({
        isValid: true,
        message: ''
      });
      return true;
    } catch (error) {
      console.error('خطأ في التحقق من رقم الحساب:', error);
      setCodeValidation({
        isValid: false,
        message: 'خطأ في التحقق من الرقم'
      });
      return false;
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.account_code.trim()) {
      errors.push('رقم الحساب مطلوب');
    }

    if (!formData.account_name.trim()) {
      errors.push('اسم الحساب مطلوب');
    }

    if (!formData.parent_account_id) {
      errors.push('يجب اختيار الحساب الأب');
    }

    if (!formData.account_type) {
      errors.push('نوع الحساب مطلوب');
    }

    if (!codeValidation.isValid) {
      errors.push('رقم الحساب غير صحيح');
    }

    return errors;
  };

  const handleParentSelect = (parentId: string, level: number) => {
    try {
      const parent = accounts.find(acc => acc.id === parentId);
      if (parent) {
        console.log('تم اختيار الحساب الأب:', parent.account_name);
        setFormData(prev => ({
          ...prev,
          parent_account_id: parentId,
          level,
          account_type: parent.account_type,
          account_category: parent.account_category
        }));
        generateSuggestedCode(parent);
        
        // إعادة التحقق من الرقم مع الحساب الأب الجديد
        if (formData.account_code) {
          validateAccountCode(formData.account_code);
        }
      }
    } catch (error) {
      console.error('خطأ في اختيار الحساب الأب:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في اختيار الحساب الأب",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log('بدء عملية إنشاء الحساب الفرعي...');
      
      // التحقق من صحة البيانات
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        console.error('أخطاء في التحقق:', validationErrors);
        toast({
          title: "أخطاء في البيانات",
          description: validationErrors.join('، '),
          variant: "destructive",
        });
        return;
      }

      // التحقق الأخير من رقم الحساب
      if (!validateAccountCode(formData.account_code)) {
        console.error('رقم الحساب غير صحيح');
        return;
      }

      const accountData = {
        ...formData,
        account_code: formData.account_code.trim(),
        account_name: formData.account_name.trim(),
        is_active: true,
        current_balance: formData.opening_balance,
        notes: formData.notes.trim() || null
      };

      console.log('بيانات الحساب الجديد:', accountData);

      // إرسال البيانات
      await onSubmit(accountData);

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
      setSuggestedCode('');
      setCodeValidation({ isValid: true, message: '' });

      console.log('تم إنشاء الحساب بنجاح');
      
    } catch (error) {
      console.error('خطأ في إنشاء الحساب:', error);
      toast({
        title: "خطأ في الإنشاء",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedParent = accounts.find(acc => acc.id === formData.parent_account_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title">إضافة حساب فرعي جديد</DialogTitle>
          <DialogDescription>
            قم بإنشاء حساب فرعي جديد في دليل الحسابات المحاسبي
          </DialogDescription>
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
                <AccountHierarchyDisplay 
                  account={selectedParent} 
                  allAccounts={accounts} 
                />
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  سيتم إضافة الحساب الجديد هنا (مستوى {formData.level})
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* رقم الحساب */}
            <div className="space-y-2">
              <Label htmlFor="account_code" className="rtl-label">رقم الحساب *</Label>
              <Input 
                id="account_code" 
                value={formData.account_code} 
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    account_code: value
                  }));
                  validateAccountCode(value);
                }} 
                placeholder="رقم الحساب" 
                className={codeValidation.isValid ? '' : 'border-destructive'} 
                required 
              />
              
              {!codeValidation.isValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{codeValidation.message}</AlertDescription>
                </Alert>
              )}
              
              {suggestedCode && codeValidation.isValid && (
                <div className="text-xs text-muted-foreground">
                  الرقم المقترح: {suggestedCode}
                </div>
              )}
            </div>

            {/* اسم الحساب */}
            <div className="space-y-2">
              <Label htmlFor="account_name" className="rtl-label">اسم الحساب *</Label>
              <Input 
                id="account_name" 
                value={formData.account_name} 
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  account_name: e.target.value
                }))} 
                placeholder="اسم الحساب" 
                required 
              />
            </div>

            {/* نوع الحساب (للقراءة فقط) */}
            {selectedParent && (
              <>
                <div className="space-y-2">
                  <Label className="rtl-label">نوع الحساب</Label>
                  <Input value={formData.account_type} readOnly className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label className="rtl-label">المستوى</Label>
                  <Input value={formData.level} readOnly className="bg-muted" />
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
              <div className="flex items-center space-x-2 space-x-reverse">
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
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notes: e.target.value
              }))} 
              placeholder="ملاحظات إضافية..." 
              className="w-full min-h-[80px] p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex justify-end gap-2 flex-row-reverse">
            <Button 
              type="submit" 
              disabled={!codeValidation.isValid || isSubmitting || !formData.parent_account_id}
              className="rtl-flex"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'جاري الإنشاء...' : 'إضافة الحساب'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
