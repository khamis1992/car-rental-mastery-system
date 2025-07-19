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

interface VehicleCost {
  id: string;
  vehicle_id: string;
  cost_type: string;
  amount: number;
  cost_date: string;
  description: string;
  invoice_number?: string;
  supplier_id?: string;
}

interface VehicleCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cost?: VehicleCost | null;
  onClose: () => void;
}

interface FormData {
  vehicle_id: string;
  cost_type: string;
  amount: number;
  cost_date: string;
  description: string;
  invoice_number?: string;
  supplier_id?: string;
}

export const VehicleCostDialog: React.FC<VehicleCostDialogProps> = ({
  open,
  onOpenChange,
  cost,
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
      cost_date: format(new Date(), 'yyyy-MM-dd'),
      cost_type: 'fuel'
    }
  });

  // جلب قائمة المركبات
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model')
        .neq('status', 'out_of_service')
        .order('license_plate');
      if (error) throw error;
      return data;
    }
  });

  // جلب قائمة الموردين
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-for-costs'],
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

  // جلب مراكز التكلفة
  const { data: costCenters } = useQuery({
    queryKey: ['cost-centers-for-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('id, cost_center_name, cost_center_code')
        .eq('is_active', true)
        .order('cost_center_name');
      if (error) throw error;
      return data;
    }
  });

  // إنشاء أو تحديث تكلفة
  const saveCostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        amount: Number(data.amount),
        tenant_id: 'default-tenant'
      };

      if (cost?.id) {
        const { error } = await supabase
          .from('vehicle_costs')
          .update(payload)
          .eq('id', cost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vehicle_costs')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-costs'] });
      toast.success(cost?.id ? 'تم تحديث التكلفة بنجاح' : 'تم إضافة التكلفة بنجاح');
      onClose();
      reset();
    },
    onError: (error) => {
      toast.error('خطأ في حفظ التكلفة: ' + error.message);
    }
  });

  React.useEffect(() => {
    if (cost) {
      setValue('vehicle_id', cost.vehicle_id);
      setValue('cost_type', cost.cost_type);
      setValue('amount', cost.amount);
      setValue('cost_date', cost.cost_date);
      setValue('description', cost.description);
      setValue('invoice_number', cost.invoice_number || '');
      setValue('supplier_id', cost.supplier_id || '');
    } else {
      reset({
        cost_date: format(new Date(), 'yyyy-MM-dd'),
        cost_type: 'fuel'
      });
    }
  }, [cost, setValue, reset]);

  const onSubmit = (data: FormData) => {
    saveCostMutation.mutate(data);
  };

  const costTypes = [
    { value: 'fuel', label: 'وقود' },
    { value: 'maintenance', label: 'صيانة' },
    { value: 'insurance', label: 'تأمين' },
    { value: 'registration', label: 'تسجيل' },
    { value: 'depreciation', label: 'إهلاك' },
    { value: 'other', label: 'أخرى' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-right">
            {cost?.id ? 'تعديل تكلفة المركبة' : 'إضافة تكلفة جديدة للمركبة'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* اختيار المركبة */}
            <div className="space-y-2">
              <Label htmlFor="vehicle_id">المركبة *</Label>
              <Select
                value={watch('vehicle_id')}
                onValueChange={(value) => setValue('vehicle_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المركبة" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle_id && (
                <p className="text-sm text-destructive">المركبة مطلوبة</p>
              )}
            </div>

            {/* نوع التكلفة */}
            <div className="space-y-2">
              <Label htmlFor="cost_type">نوع التكلفة *</Label>
              <Select
                value={watch('cost_type')}
                onValueChange={(value) => setValue('cost_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع التكلفة" />
                </SelectTrigger>
                <SelectContent>
                  {costTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* المبلغ */}
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ (د.ك) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                placeholder="0.000"
                {...register('amount', { 
                  required: 'المبلغ مطلوب',
                  min: { value: 0.001, message: 'المبلغ يجب أن يكون أكبر من صفر' }
                })}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* تاريخ التكلفة */}
            <div className="space-y-2">
              <Label htmlFor="cost_date">تاريخ التكلفة *</Label>
              <Input
                id="cost_date"
                type="date"
                {...register('cost_date', { required: 'التاريخ مطلوب' })}
              />
              {errors.cost_date && (
                <p className="text-sm text-destructive">{errors.cost_date.message}</p>
              )}
            </div>

            {/* رقم الفاتورة */}
            <div className="space-y-2">
              <Label htmlFor="invoice_number">رقم الفاتورة</Label>
              <Input
                id="invoice_number"
                placeholder="رقم الفاتورة (اختياري)"
                {...register('invoice_number')}
              />
            </div>

            {/* المورد */}
            <div className="space-y-2">
              <Label htmlFor="supplier_id">المورد</Label>
              <Select
                value={watch('supplier_id') || 'none'}
                onValueChange={(value) => setValue('supplier_id', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المورد (اختياري)" />
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
          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <Label htmlFor="description">الوصف *</Label>
            <Textarea
              id="description"
              placeholder="وصف التكلفة..."
              rows={3}
              {...register('description', { required: 'الوصف مطلوب' })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
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
              disabled={saveCostMutation.isPending}
            >
              {saveCostMutation.isPending ? 'جاري الحفظ...' : (cost?.id ? 'تحديث' : 'حفظ')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};