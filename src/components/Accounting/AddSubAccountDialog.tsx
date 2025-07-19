
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { ChartOfAccount, AccountType } from '@/types/accounting';
import { useAccountOperations } from '@/hooks/useAccountOperations';
import { useAccountPreview } from '@/hooks/useAccountPreview';

interface AddSubAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentAccount: ChartOfAccount | null;
  onAccountCreated: () => void;
}

export const AddSubAccountDialog: React.FC<AddSubAccountDialogProps> = ({
  isOpen,
  onClose,
  parentAccount,
  onAccountCreated
}) => {
  const [accountName, setAccountName] = useState('');
  const [accountNameEn, setAccountNameEn] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('');
  const [isActive, setIsActive] = useState(true);
  const [allowPosting, setAllowPosting] = useState(true);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [notes, setNotes] = useState('');

  const { createSubAccount, loading } = useAccountOperations();
  const { nextCode, pattern, loading: previewLoading, error: previewError } = useAccountPreview(parentAccount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!parentAccount || !accountName.trim() || !accountType) {
      return;
    }

    try {
      await createSubAccount({
        account_name: accountName.trim(),
        account_name_en: accountNameEn.trim() || null,
        account_type: accountType,
        account_category: parentAccount.account_category,
        parent_account_id: parentAccount.id,
        is_active: isActive,
        allow_posting: allowPosting,
        opening_balance: parseFloat(openingBalance) || 0,
        current_balance: parseFloat(openingBalance) || 0,
        notes: notes.trim() || null
      });

      // Reset form
      setAccountName('');
      setAccountNameEn('');
      setAccountType('');
      setIsActive(true);
      setAllowPosting(true);
      setOpeningBalance('0');
      setNotes('');
      
      onAccountCreated();
      onClose();
    } catch (error) {
      console.error('خطأ في إنشاء الحساب الفرعي:', error);
    }
  };

  const handleClose = () => {
    setAccountName('');
    setAccountNameEn('');
    setAccountType('');
    setIsActive(true);
    setAllowPosting(true);
    setOpeningBalance('0');
    setNotes('');
    onClose();
  };

  if (!parentAccount) return null;

  // Set account type to match parent if not already set
  React.useEffect(() => {
    if (parentAccount && !accountType) {
      setAccountType(parentAccount.account_type);
    }
  }, [parentAccount, accountType]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold rtl-title">
            إضافة حساب فرعي
          </DialogTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>الحساب الأب:</strong> {parentAccount.account_name}</p>
            <p><strong>رقم الحساب الأب:</strong> {parentAccount.account_code}</p>
            <p><strong>المستوى:</strong> {parentAccount.level + 1}</p>
          </div>
        </DialogHeader>

        {/* Account Code Preview */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 rtl-flex">
                <Label className="text-sm font-medium rtl-label">رقم الحساب المتوقع:</Label>
                {previewLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : previewError ? (
                  <Badge variant="destructive" className="rtl-flex">
                    <AlertCircle className="w-3 h-3" />
                    خطأ في التوليد
                  </Badge>
                ) : nextCode ? (
                  <Badge variant="default" className="rtl-flex font-mono">
                    <Check className="w-3 h-3" />
                    {nextCode}
                  </Badge>
                ) : (
                  <Badge variant="outline">غير محدد</Badge>
                )}
              </div>
              
              {pattern && (
                <div className="text-xs text-muted-foreground">
                  <p><strong>النمط:</strong> {pattern.description}</p>
                  <p><strong>مثال:</strong> {pattern.example}</p>
                </div>
              )}
              
              {previewError && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                  {previewError}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Name (Arabic) */}
          <div className="space-y-2">
            <Label htmlFor="accountName" className="rtl-label">
              اسم الحساب (عربي) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="أدخل اسم الحساب بالعربية"
              required
            />
          </div>

          {/* Account Name (English) */}
          <div className="space-y-2">
            <Label htmlFor="accountNameEn" className="rtl-label">اسم الحساب (إنجليزي)</Label>
            <Input
              id="accountNameEn"
              value={accountNameEn}
              onChange={(e) => setAccountNameEn(e.target.value)}
              placeholder="Enter account name in English"
            />
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label className="rtl-label">
              نوع الحساب <span className="text-destructive">*</span>
            </Label>
            <Select value={accountType} onValueChange={(value: AccountType) => setAccountType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الحساب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asset">أصول</SelectItem>
                <SelectItem value="liability">خصوم</SelectItem>
                <SelectItem value="equity">حقوق الملكية</SelectItem>
                <SelectItem value="revenue">إيرادات</SelectItem>
                <SelectItem value="expense">مصروفات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opening Balance */}
          <div className="space-y-2">
            <Label htmlFor="openingBalance" className="rtl-label">الرصيد الافتتاحي (د.ك)</Label>
            <Input
              id="openingBalance"
              type="number"
              step="0.001"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.000"
            />
          </div>

          {/* Account Settings */}
          <div className="space-y-4 border rounded-lg p-4">
            <h4 className="font-medium rtl-title">إعدادات الحساب</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive" className="rtl-label">حساب نشط</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allowPosting" className="rtl-label">السماح بالترحيل</Label>
              <Switch
                id="allowPosting"
                checked={allowPosting}
                onCheckedChange={setAllowPosting}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="rtl-label">ملاحظات</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أدخل أي ملاحظات إضافية..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !accountName.trim() || !accountType || previewError}
              className="rtl-flex"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء الحساب'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
