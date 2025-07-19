import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  item_code: string;
  item_name: string;
  category: string;
  unit_cost: number;
  quantity_on_hand: number;
  reorder_level: number;
  account_id?: string;
  supplier_id?: string;
  warehouse_location?: string;
  valuation_method: string;
}

interface InventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
  onClose: () => void;
}

interface FormData {
  item_code: string;
  item_name: string;
  category: string;
  unit_cost: number;
  quantity_on_hand: number;
  reorder_level: number;
  account_id?: string;
  supplier_id?: string;
  warehouse_location?: string;
  valuation_method: string;
}

export const InventoryItemDialog: React.FC<InventoryItemDialogProps> = ({
  open,
  onOpenChange,
  item,
  onClose
}) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      valuation_method: 'fifo',
      quantity_on_hand: 0,
      reorder_level: 0,
      unit_cost: 0
    }
  });

  // جلب الحسابات المحاسبية للمخزون
  const { data: accounts } = useQuery({
    queryKey: ['inventory-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('id, account_name, account_code')
        .like('account_code', '113%')
        .eq('is_active', true)
        .order('account_code');
      if (error) throw error;
      return data;
    }
  });

  // جلب الموردين
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-for-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_accounting')
        .select('id, supplier_name')
        .eq('is_active', true)
        .order('supplier_name');
      if (error) throw error;
      return data;
    }
  });

  // حفظ صنف المخزون
  const saveItemMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        unit_cost: Number(data.unit_cost),
        quantity_on_hand: Number(data.quantity_on_hand),
        reorder_level: Number(data.reorder_level),
        tenant_id: 'default-tenant'
      };

      if (item?.id) {
        const { error } = await supabase
          .from('inventory_accounting')
          .update(payload)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('inventory_accounting')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      toast.success(item?.id ? 'تم تحديث الصنف بنجاح' : 'تم إضافة الصنف بنجاح');
      onClose();
      reset();
    },
    onError: (error) => {
      toast.error('خطأ في حفظ الصنف: ' + error.message);
    }
  });

  React.useEffect(() => {
    if (item) {
      setValue('item_code', item.item_code);
      setValue('item_name', item.item_name);
      setValue('category', item.category);
      setValue('unit_cost', item.unit_cost);
      setValue('quantity_on_hand', item.quantity_on_hand);
      setValue('reorder_level', item.reorder_level);
      setValue('account_id', item.account_id || '');
      setValue('supplier_id', item.supplier_id || '');
      setValue('warehouse_location', item.warehouse_location || '');
      setValue('valuation_method', item.valuation_method);
    } else {
      reset({
        valuation_method: 'fifo',
        quantity_on_hand: 0,
        reorder_level: 0,
        unit_cost: 0
      });
    }
  }, [item, setValue, reset]);

  const onSubmit = (data: FormData) => {
    saveItemMutation.mutate(data);
  };

  const categories = [
    'قطع غيار',
    'وقود وزيوت',
    'مواد استهلاكية',
    'إطارات',
    'بطاريات',
    'أخرى'
  ];

  const valuationMethods = [
    { value: 'fifo', label: 'الوارد أولاً صادر أولاً (FIFO)' },
    { value: 'lifo', label: 'الوارد أخيراً صادر أولاً (LIFO)' },
    { value: 'average', label: 'متوسط التكلفة المرجح' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-right">
            {item?.id ? 'تعديل صنف المخزون' : 'إضافة صنف جديد للمخزون'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* كود الصنف */}
            <div className="space-y-2">
              <Label htmlFor="item_code">كود الصنف *</Label>
              <Input
                id="item_code"
                placeholder="مثال: SP-001"
                {...register('item_code', { required: 'كود الصنف مطلوب' })}
              />
              {errors.item_code && (
                <p className="text-sm text-destructive">{errors.item_code.message}</p>
              )}
            </div>

            {/* اسم الصنف */}
            <div className="space-y-2">
              <Label htmlFor="item_name">اسم الصنف *</Label>
              <Input
                id="item_name"
                placeholder="اسم الصنف"
                {...register('item_name', { required: 'اسم الصنف مطلوب' })}
              />
              {errors.item_name && (
                <p className="text-sm text-destructive">{errors.item_name.message}</p>
              )}
            </div>

            {/* الفئة */}
            <div className="space-y-2">
              <Label htmlFor="category">الفئة *</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">الفئة مطلوبة</p>
              )}
            </div>

            {/* تكلفة الوحدة */}
            <div className="space-y-2">
              <Label htmlFor="unit_cost">تكلفة الوحدة (د.ك) *</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.001"
                placeholder="0.000"
                {...register('unit_cost', { 
                  required: 'تكلفة الوحدة مطلوبة',
                  min: { value: 0, message: 'التكلفة يجب أن تكون صفر أو أكبر' }
                })}
              />
              {errors.unit_cost && (
                <p className="text-sm text-destructive">{errors.unit_cost.message}</p>
              )}
            </div>

            {/* الكمية الحالية */}
            <div className="space-y-2">
              <Label htmlFor="quantity_on_hand">الكمية الحالية</Label>
              <Input
                id="quantity_on_hand"
                type="number"
                step="0.001"
                placeholder="0"
                {...register('quantity_on_hand', { 
                  min: { value: 0, message: 'الكمية يجب أن تكون صفر أو أكبر' }
                })}
              />
              {errors.quantity_on_hand && (
                <p className="text-sm text-destructive">{errors.quantity_on_hand.message}</p>
              )}
            </div>

            {/* حد إعادة الطلب */}
            <div className="space-y-2">
              <Label htmlFor="reorder_level">حد إعادة الطلب</Label>
              <Input
                id="reorder_level"
                type="number"
                step="0.001"
                placeholder="0"
                {...register('reorder_level', { 
                  min: { value: 0, message: 'حد إعادة الطلب يجب أن يكون صفر أو أكبر' }
                })}
              />
              {errors.reorder_level && (
                <p className="text-sm text-destructive">{errors.reorder_level.message}</p>
              )}
            </div>

            {/* الحساب المحاسبي */}
            <div className="space-y-2">
              <Label htmlFor="account_id">الحساب المحاسبي</Label>
              <Select
                value={watch('account_id') || 'none'}
                onValueChange={(value) => setValue('account_id', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحساب المحاسبي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون حساب</SelectItem>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* المورد الافتراضي */}
            <div className="space-y-2">
              <Label htmlFor="supplier_id">المورد الافتراضي</Label>
              <Select
                value={watch('supplier_id') || 'none'}
                onValueChange={(value) => setValue('supplier_id', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مورد</SelectItem>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* موقع المخزن */}
            <div className="space-y-2">
              <Label htmlFor="warehouse_location">موقع المخزن</Label>
              <Input
                id="warehouse_location"
                placeholder="مثال: المخزن الرئيسي - الرف أ1"
                {...register('warehouse_location')}
              />
            </div>

            {/* طريقة التقييم */}
            <div className="space-y-2">
              <Label htmlFor="valuation_method">طريقة التقييم</Label>
              <Select
                value={watch('valuation_method')}
                onValueChange={(value) => setValue('valuation_method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة التقييم" />
                </SelectTrigger>
                <SelectContent>
                  {valuationMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={saveItemMutation.isPending}
            >
              {saveItemMutation.isPending ? 'جاري الحفظ...' : (item?.id ? 'تحديث' : 'حفظ')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};