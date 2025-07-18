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
import { format } from 'date-fns';

interface InventoryMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId?: string | null;
  onClose: () => void;
}

interface FormData {
  inventory_item_id: string;
  movement_type: string;
  quantity: number;
  unit_cost?: number;
  movement_date: string;
  description: string;
  reference_id?: string;
  reference_type?: string;
}

export const InventoryMovementDialog: React.FC<InventoryMovementDialogProps> = ({
  open,
  onOpenChange,
  itemId,
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
      movement_date: format(new Date(), 'yyyy-MM-dd'),
      movement_type: 'purchase',
      quantity: 0
    }
  });

  // جلب أصناف المخزون
  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory-items-for-movement'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_accounting')
        .select('id, item_code, item_name, unit_cost')
        .order('item_name');
      if (error) throw error;
      return data;
    }
  });

  // جلب بيانات الصنف المحدد
  const { data: selectedItem } = useQuery({
    queryKey: ['inventory-item', itemId],
    queryFn: async () => {
      if (!itemId) return null;
      const { data, error } = await supabase
        .from('inventory_accounting')
        .select('*')
        .eq('id', itemId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!itemId
  });

  // إنشاء حركة مخزون
  const createMovementMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        quantity: Number(data.quantity),
        unit_cost: data.unit_cost ? Number(data.unit_cost) : null,
        total_amount: data.unit_cost ? Number(data.quantity) * Number(data.unit_cost) : null,
        tenant_id: 'default-tenant'
      };

      const { error } = await supabase
        .from('inventory_movements')
        .insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements-recent'] });
      toast.success('تم إضافة حركة المخزون بنجاح');
      onClose();
      reset();
    },
    onError: (error) => {
      toast.error('خطأ في إضافة حركة المخزون: ' + error.message);
    }
  });

  React.useEffect(() => {
    if (itemId) {
      setValue('inventory_item_id', itemId);
    }
    if (selectedItem) {
      setValue('unit_cost', selectedItem.unit_cost);
    }
  }, [itemId, selectedItem, setValue]);

  React.useEffect(() => {
    if (open && !itemId) {
      reset({
        movement_date: format(new Date(), 'yyyy-MM-dd'),
        movement_type: 'purchase',
        quantity: 0
      });
    }
  }, [open, itemId, reset]);

  const onSubmit = (data: FormData) => {
    createMovementMutation.mutate(data);
  };

  const movementTypes = [
    { value: 'purchase', label: 'شراء', requiresCost: true },
    { value: 'sale', label: 'بيع', requiresCost: false },
    { value: 'transfer_in', label: 'تحويل وارد', requiresCost: false },
    { value: 'transfer_out', label: 'تحويل صادر', requiresCost: false },
    { value: 'adjustment_positive', label: 'تسوية زيادة', requiresCost: false },
    { value: 'adjustment_negative', label: 'تسوية نقص', requiresCost: false },
    { value: 'maintenance_issue', label: 'صرف للصيانة', requiresCost: false }
  ];

  const selectedMovementType = movementTypes.find(type => type.value === watch('movement_type'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-right">
            إضافة حركة مخزون
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* اختيار الصنف */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="inventory_item_id">الصنف *</Label>
              <Select
                value={watch('inventory_item_id')}
                onValueChange={(value) => {
                  setValue('inventory_item_id', value);
                  const item = inventoryItems?.find(i => i.id === value);
                  if (item) {
                    setValue('unit_cost', item.unit_cost);
                  }
                }}
                disabled={!!itemId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصنف" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.item_code} - {item.item_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.inventory_item_id && (
                <p className="text-sm text-destructive">الصنف مطلوب</p>
              )}
            </div>

            {/* نوع الحركة */}
            <div className="space-y-2">
              <Label htmlFor="movement_type">نوع الحركة *</Label>
              <Select
                value={watch('movement_type')}
                onValueChange={(value) => setValue('movement_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الحركة" />
                </SelectTrigger>
                <SelectContent>
                  {movementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الكمية */}
            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                placeholder="0"
                {...register('quantity', { 
                  required: 'الكمية مطلوبة',
                  min: { value: 0.001, message: 'الكمية يجب أن تكون أكبر من صفر' }
                })}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            {/* تكلفة الوحدة */}
            {selectedMovementType?.requiresCost && (
              <div className="space-y-2">
                <Label htmlFor="unit_cost">تكلفة الوحدة (د.ك)</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  {...register('unit_cost', { 
                    min: { value: 0, message: 'التكلفة يجب أن تكون صفر أو أكبر' }
                  })}
                />
                {errors.unit_cost && (
                  <p className="text-sm text-destructive">{errors.unit_cost.message}</p>
                )}
              </div>
            )}

            {/* تاريخ الحركة */}
            <div className="space-y-2">
              <Label htmlFor="movement_date">تاريخ الحركة *</Label>
              <Input
                id="movement_date"
                type="date"
                {...register('movement_date', { required: 'التاريخ مطلوب' })}
              />
              {errors.movement_date && (
                <p className="text-sm text-destructive">{errors.movement_date.message}</p>
              )}
            </div>

            {/* المرجع */}
            {!selectedMovementType?.requiresCost && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reference_type">نوع المرجع</Label>
                  <Select
                    value={watch('reference_type') || ''}
                    onValueChange={(value) => setValue('reference_type', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المرجع (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون مرجع</SelectItem>
                      <SelectItem value="invoice">فاتورة</SelectItem>
                      <SelectItem value="contract">عقد</SelectItem>
                      <SelectItem value="maintenance">صيانة</SelectItem>
                      <SelectItem value="transfer">تحويل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference_id">رقم المرجع</Label>
                  <Input
                    id="reference_id"
                    placeholder="رقم المرجع (اختياري)"
                    {...register('reference_id')}
                  />
                </div>
              </>
            )}
          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <Label htmlFor="description">الوصف *</Label>
            <Textarea
              id="description"
              placeholder="وصف الحركة..."
              rows={3}
              {...register('description', { required: 'الوصف مطلوب' })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* عرض إجمالي القيمة */}
          {selectedMovementType?.requiresCost && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">إجمالي القيمة:</span>
                <span className="font-bold">
                  {((watch('quantity') || 0) * (watch('unit_cost') || 0)).toFixed(3)} د.ك
                </span>
              </div>
            </div>
          )}

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
              disabled={createMovementMutation.isPending}
            >
              {createMovementMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};