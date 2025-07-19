import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_category: string;
  current_balance: number;
  level: number;
  parent_account_id?: string;
  allow_posting: boolean;
  is_active: boolean;
}

interface EditAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

interface AccountFormData {
  account_code: string;
  account_name: string;
  account_type: string;
  account_category: string;
  allow_posting: boolean;
  is_active: boolean;
}

export const EditAccountDialog: React.FC<EditAccountDialogProps> = ({
  open,
  onOpenChange,
  account
}) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<AccountFormData>();
  const queryClient = useQueryClient();

  // Update form when account changes
  useEffect(() => {
    if (account) {
      setValue('account_code', account.account_code);
      setValue('account_name', account.account_name);
      setValue('account_type', account.account_type);
      setValue('account_category', account.account_category);
      setValue('allow_posting', account.allow_posting);
      setValue('is_active', account.is_active);
    }
  }, [account, setValue]);

  const editAccountMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      if (!account) throw new Error('No account selected');
      
      const { error } = await supabase
        .from('chart_of_accounts')
        .update(data)
        .eq('id', account.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast.success('تم تحديث الحساب بنجاح');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('حدث خطأ في تحديث الحساب');
      console.error('Error updating account:', error);
    }
  });

  const onSubmit = (data: AccountFormData) => {
    editAccountMutation.mutate(data);
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-right">تعديل الحساب</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account_code" className="text-right block">رمز الحساب</Label>
            <Input
              id="account_code"
              {...register('account_code', { required: true })}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name" className="text-right block">اسم الحساب</Label>
            <Input
              id="account_name"
              {...register('account_name', { required: true })}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_type" className="text-right block">نوع الحساب</Label>
            <Select 
              value={watch('account_type')} 
              onValueChange={(value) => setValue('account_type', value)}
            >
              <SelectTrigger className="text-right">
                <SelectValue />
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

          <div className="space-y-2">
            <Label htmlFor="account_category" className="text-right block">فئة الحساب</Label>
            <Select 
              value={watch('account_category')} 
              onValueChange={(value) => setValue('account_category', value)}
            >
              <SelectTrigger className="text-right">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_assets">أصول متداولة</SelectItem>
                <SelectItem value="fixed_assets">أصول ثابتة</SelectItem>
                <SelectItem value="current_liabilities">خصوم متداولة</SelectItem>
                <SelectItem value="long_term_liabilities">خصوم طويلة الأجل</SelectItem>
                <SelectItem value="equity">حقوق الملكية</SelectItem>
                <SelectItem value="revenue">إيرادات</SelectItem>
                <SelectItem value="operating_expenses">مصروفات تشغيلية</SelectItem>
                <SelectItem value="other_expenses">مصروفات أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="allow_posting" className="text-right">السماح بالترحيل</Label>
            <Switch
              id="allow_posting"
              checked={watch('allow_posting')}
              onCheckedChange={(checked) => setValue('allow_posting', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active" className="text-right">نشط</Label>
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          <div className="flex justify-between gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={editAccountMutation.isPending}>
              {editAccountMutation.isPending ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};