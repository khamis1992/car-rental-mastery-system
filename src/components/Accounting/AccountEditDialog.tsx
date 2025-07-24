import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartOfAccount } from '@/types/accounting';
import { AccountEditData } from '@/services/accountService';
import { useToast } from '@/hooks/use-toast';

interface AccountEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: ChartOfAccount | null;
  onSave: (accountId: string, data: AccountEditData) => Promise<void>;
}

export const AccountEditDialog: React.FC<AccountEditDialogProps> = ({
  isOpen,
  onClose,
  account,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AccountEditData>({
    account_name: '',
    account_name_en: '',
    account_type: 'asset',
    account_category: 'current_asset',
    notes: ''
  });

  useEffect(() => {
    if (account) {
      setFormData({
        account_name: account.account_name,
        account_name_en: account.account_name_en || '',
        account_type: account.account_type,
        account_category: account.account_category,
        notes: account.notes || ''
      });
    }
  }, [account]);

  const handleSave = async () => {
    if (!account) return;

    if (!formData.account_name.trim()) {
      toast({
        title: 'خطأ في التحقق',
        description: 'اسم الحساب مطلوب',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(account.id, formData);
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات الحساب بنجاح'
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'خطأ في التحديث',
        description: error.message || 'حدث خطأ أثناء تحديث الحساب',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const accountTypes = [
    { value: 'asset', label: 'أصول' },
    { value: 'liability', label: 'التزامات' },
    { value: 'equity', label: 'حقوق الملكية' },
    { value: 'revenue', label: 'إيرادات' },
    { value: 'expense', label: 'مصروفات' }
  ];

  const accountCategories = {
    asset: [
      { value: 'current_asset', label: 'أصول متداولة' },
      { value: 'fixed_asset', label: 'أصول ثابتة' },
      { value: 'other_asset', label: 'أصول أخرى' }
    ],
    liability: [
      { value: 'current_liability', label: 'التزامات متداولة' },
      { value: 'long_term_liability', label: 'التزامات طويلة الأجل' }
    ],
    equity: [
      { value: 'capital', label: 'رأس المال' },
      { value: 'retained_earnings', label: 'أرباح محتجزة' }
    ],
    revenue: [
      { value: 'operating_revenue', label: 'إيرادات تشغيلية' },
      { value: 'other_revenue', label: 'إيرادات أخرى' }
    ],
    expense: [
      { value: 'operating_expense', label: 'مصروفات تشغيلية' },
      { value: 'other_expense', label: 'مصروفات أخرى' }
    ]
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold rtl-title">
            تعديل الحساب - {account.account_code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account_name">اسم الحساب *</Label>
            <Input
              id="account_name"
              value={formData.account_name}
              onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
              placeholder="أدخل اسم الحساب"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name_en">الاسم الإنجليزي</Label>
            <Input
              id="account_name_en"
              value={formData.account_name_en}
              onChange={(e) => setFormData(prev => ({ ...prev, account_name_en: e.target.value }))}
              placeholder="أدخل الاسم الإنجليزي"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_type">نوع الحساب</Label>
            <Select 
              value={formData.account_type} 
              onValueChange={(value) => {
                setFormData(prev => ({ 
                  ...prev, 
                  account_type: value,
                  account_category: accountCategories[value as keyof typeof accountCategories][0].value
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_category">تصنيف الحساب</Label>
            <Select 
              value={formData.account_category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, account_category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accountCategories[formData.account_type as keyof typeof accountCategories]?.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="أدخل أي ملاحظات إضافية"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};