import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Car } from 'lucide-react';
import { BasicInfoSection } from './AddVehicleForm/BasicInfoSection';
import { PricingSection } from './AddVehicleForm/PricingSection';
import { InsuranceSection } from './AddVehicleForm/InsuranceSection';
import { AssetDepreciationSection } from './AddVehicleForm/AssetDepreciationSection';
import { NotesSection } from './AddVehicleForm/NotesSection';
import { FormActions } from './AddVehicleForm/FormActions';
import { vehicleSchema, type VehicleFormData } from './AddVehicleForm/types';
import { serviceContainer } from '@/services/Container/ServiceContainer';

interface AddVehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}


export const AddVehicleForm: React.FC<AddVehicleFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const vehicleService = serviceContainer.getVehicleBusinessService();
  
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      fuel_type: 'بنزين',
      transmission: 'أوتوماتيك',
      mileage: 0,
      insurance_type: 'comprehensive',
      owner_type: 'company',
      depreciation_method: 'straight_line',
      residual_value: 0,
      has_insurance_policy: true,
    },
  });

  const onSubmit = async (data: VehicleFormData) => {
    try {
      console.log('بدء إنشاء مركبة جديدة:', data);
      
      // Generate vehicle number
      const vehicleNumber = await vehicleService.generateVehicleNumber();
      console.log('تم توليد رقم المركبة:', vehicleNumber);

      // Prepare vehicle data
      const vehicleData = {
        vehicle_number: vehicleNumber,
        make: data.make,
        model: data.model,
        year: data.year,
        color: data.color,
        vehicle_type: data.vehicle_type,
        license_plate: data.license_plate,
        daily_rate: data.daily_rate,
        weekly_rate: data.weekly_rate || undefined,
        monthly_rate: data.monthly_rate || undefined,
        engine_size: data.engine_size || undefined,
        fuel_type: data.fuel_type || 'بنزين',
        transmission: data.transmission || 'أوتوماتيك',
        mileage: data.mileage || 0,
        // Insurance fields
        insurance_type: data.insurance_type || 'comprehensive',
        insurance_company: data.insurance_company || undefined,
        insurance_policy_number: data.insurance_policy_number || undefined,
        insurance_expiry: data.insurance_expiry || undefined,
        // Owner type and asset fields
        owner_type: data.owner_type || 'company',
        purchase_date: data.purchase_date || undefined,
        purchase_cost: data.purchase_cost || undefined,
        depreciation_rate: data.depreciation_rate || undefined,
        useful_life_years: data.useful_life_years || undefined,
        residual_value: data.residual_value || undefined,
        depreciation_method: data.depreciation_method || 'straight_line',
        // Other fields
        registration_expiry: data.registration_expiry || undefined,
        notes: data.notes || undefined,
        status: 'available' as const,
      };

      console.log('بيانات المركبة المعدة للإرسال:', vehicleData);
      
      await vehicleService.createVehicle(vehicleData);
      console.log('تم إنشاء المركبة بنجاح');

      toast({
        title: 'تم إضافة المركبة',
        description: `تم إضافة المركبة ${data.make} ${data.model} بنجاح إلى الأسطول`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('خطأ في إنشاء المركبة:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error('تفاصيل الخطأ:', errorMessage);
      
      toast({
        title: 'خطأ في إضافة المركبة',
        description: `فشل في إضافة المركبة: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    form.reset({
      fuel_type: 'بنزين',
      transmission: 'أوتوماتيك',
      mileage: 0,
      insurance_type: 'comprehensive',
      owner_type: 'company',
      depreciation_method: 'straight_line',
      residual_value: 0,
      has_insurance_policy: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-background to-muted/20">
        <DialogHeader className="text-center border-b border-border/50 pb-4">
          <DialogTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <Car className="w-6 h-6" />
            إضافة مركبة جديدة
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            قم بملء النموذج أدناه لإضافة مركبة جديدة إلى الأسطول
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <BasicInfoSection control={form.control} />
            <PricingSection control={form.control} />
            <InsuranceSection control={form.control} />
            <AssetDepreciationSection control={form.control} />
            <NotesSection control={form.control} />
            <FormActions 
              onReset={resetForm}
              onCancel={() => onOpenChange(false)}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};