import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentAccountId?: string;
}

interface AccountFormData {
  account_code: string;
  account_name: string;
  account_type: string;
  account_category: string;
  parent_account_id?: string;
  allow_posting: boolean;
}

export const AddAccountDialog: React.FC<AddAccountDialogProps> = ({
  open,
  onOpenChange,
  parentAccountId
}) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<AccountFormData>({
    defaultValues: {
      parent_account_id: parentAccountId,
      allow_posting: true
    }
  });
  
  const queryClient = useQueryClient();

  const addAccountMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      const { error } = await supabase
        .from('chart_of_accounts')
        .insert({
          ...data,
          level: parentAccountId ? 2 : 1,
          current_balance: 0,
          is_active: true,
          tenant_id: '00000000-0000-0000-0000-000000000000' // Default tenant
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast.success('تم إضافة الحساب بنجاح');
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('حدث خطأ في إضافة الحساب');
      console.error('Error adding account:', error);
    }
  });

  const onSubmit = (data: AccountFormData) => {
    addAccountMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة حساب جديد</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account_code" className="text-right block">رمز الحساب</Label>
            <Input
              id="account_code"
              {...register('account_code', { required: true })}
              placeholder="أدخل رمز الحساب"
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name" className="text-right block">اسم الحساب</Label>
            <Input
              id="account_name"
              {...register('account_name', { required: true })}
              placeholder="أدخل اسم الحساب"
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_type" className="text-right block">نوع الحساب</Label>
            <Select onValueChange={(value) => setValue('account_type', value)}>
              <SelectTrigger className="text-right">
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

          <div className="space-y-2">
            <Label htmlFor="account_category" className="text-right block">فئة الحساب</Label>
            <Select onValueChange={(value) => setValue('account_category', value)}>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="اختر فئة الحساب" />
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

          <div className="flex justify-between gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={addAccountMutation.isPending}>
              {addAccountMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};