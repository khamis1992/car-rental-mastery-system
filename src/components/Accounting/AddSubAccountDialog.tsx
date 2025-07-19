
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAccountOperations } from '@/hooks/useAccountOperations';
import { ChartOfAccount } from '@/types/accounting';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddSubAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentAccount: ChartOfAccount | null;
  onAccountCreated: () => void;
}

interface AccountTypeOption {
  value: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  label: string;
  isRecommended?: boolean;
}

export const AddSubAccountDialog: React.FC<AddSubAccountDialogProps> = ({
  isOpen,
  onClose,
  parentAccount,
  onAccountCreated
}) => {
  const { createSubAccount, loading } = useAccountOperations();
  const [formData, setFormData] = useState<{
    account_code: string;
    account_name: string;
    account_name_en: string;
    account_type: ChartOfAccount['account_type'] | '';
    account_category: ChartOfAccount['account_category'] | '';
    is_active: boolean;
    allow_posting: boolean;
    opening_balance: number;
    notes: string;
  }>({
    account_code: '',
    account_name: '',
    account_name_en: '',
    account_type: '',
    account_category: '',
    is_active: true,
    allow_posting: true,
    opening_balance: 0,
    notes: ''
  });
  const [errors, setErrors] = useState<string[]>([]);

  const resetForm = () => {
    setFormData({
      account_code: '',
      account_name: '',
      account_name_en: '',
      account_type: parentAccount?.account_type || '',
      account_category: parentAccount?.account_category || '',
      is_active: true,
      allow_posting: true,
      opening_balance: 0,
      notes: ''
    });
    setErrors([]);
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.account_name.trim()) {
      newErrors.push('اسم الحساب مطلوب');
    }

    if (!formData.account_type) {
      newErrors.push('نوع الحساب مطلوب');
    }

    if (formData.account_code && !/^\d+$/.test(formData.account_code.trim())) {
      newErrors.push('رقم الحساب يجب أن يحتوي على أرقام فقط');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !parentAccount) {
      return;
    }

    try {
      await createSubAccount({
        ...formData,
        parent_account_id: parentAccount.id,
        account_code: formData.account_code.trim() || undefined, // Let system generate if empty
        account_type: formData.account_type as ChartOfAccount['account_type'],
        account_category: formData.account_category as ChartOfAccount['account_category']
      });
      
      resetForm();
      onAccountCreated();
      onClose();
    } catch (error) {
      console.error('Error creating sub-account:', error);
      // Error is already handled by the hook
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getAccountTypeOptions = (): AccountTypeOption[] => {
    const baseOptions: AccountTypeOption[] = [
      { value: 'asset', label: 'أصول' },
      { value: 'liability', label: 'خصوم' },
      { value: 'equity', label: 'حقوق الملكية' },
      { value: 'revenue', label: 'إيرادات' },
      { value: 'expense', label: 'مصروفات' }
    ];

    // If parent has a type, suggest it as default
    if (parentAccount?.account_type) {
      return baseOptions.map(option => ({
        ...option,
        isRecommended: option.value === parentAccount.account_type
      }));
    }

    return baseOptions;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold rtl-title">
            إضافة حساب فرعي
          </DialogTitle>
          {parentAccount && (
            <div className="text-sm text-muted-foreground">
              <p>الحساب الأب: {parentAccount.account_name}</p>
              <p>رقم الحساب الأب: {parentAccount.account_code}</p>
            </div>
          )}
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            إذا تركت رقم الحساب فارغاً، سيتم توليد رقم تلقائياً بناءً على الحساب الأب
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_code" className="rtl-label">
                رقم الحساب (اختياري)
              </Label>
              <Input
                id="account_code"
                value={formData.account_code}
                onChange={(e) => setFormData(prev => ({ ...prev, account_code: e.target.value }))}
                placeholder="سيتم التوليد تلقائياً إذا ترك فارغاً"
                dir="ltr"
                className="text-left"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name" className="rtl-label">
                اسم الحساب *
              </Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                placeholder="أدخل اسم الحساب"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name_en" className="rtl-label">
              اسم الحساب بالإنجليزية
            </Label>
            <Input
              id="account_name_en"
              value={formData.account_name_en}
              onChange={(e) => setFormData(prev => ({ ...prev, account_name_en: e.target.value }))}
              placeholder="Account name in English"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_type" className="rtl-label">
                نوع الحساب *
              </Label>
               <Select
                value={formData.account_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, account_type: value as ChartOfAccount['account_type'] }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الحساب" />
                </SelectTrigger>
                <SelectContent>
                  {getAccountTypeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.label}
                        {option.isRecommended && (
                          <span className="text-xs bg-primary/10 text-primary px-1 rounded">
                            مُوصى
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening_balance" className="rtl-label">
                الرصيد الافتتاحي
              </Label>
              <Input
                id="opening_balance"
                type="number"
                step="0.001"
                value={formData.opening_balance}
                onChange={(e) => setFormData(prev => ({ ...prev, opening_balance: parseFloat(e.target.value) || 0 }))}
                placeholder="0.000"
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active" className="rtl-label">
                حساب نشط
              </Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allow_posting" className="rtl-label">
                يسمح بالترحيل
              </Label>
              <Switch
                id="allow_posting"
                checked={formData.allow_posting}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_posting: checked }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="rtl-label">
              ملاحظات
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="أدخل أي ملاحظات إضافية"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rtl-flex"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              إنشاء الحساب
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
