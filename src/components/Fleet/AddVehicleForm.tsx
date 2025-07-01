import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Car } from 'lucide-react';
import { BasicInfoSection } from './AddVehicleForm/BasicInfoSection';
import { PricingSection } from './AddVehicleForm/PricingSection';
import { InsuranceSection } from './AddVehicleForm/InsuranceSection';
import { NotesSection } from './AddVehicleForm/NotesSection';
import { FormActions } from './AddVehicleForm/FormActions';
import { vehicleSchema, type VehicleFormData } from './AddVehicleForm/types';

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
  
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      fuel_type: 'بنزين',
      transmission: 'أوتوماتيك',
      mileage: 0,
    },
  });

  const onSubmit = async (data: VehicleFormData) => {
    try {
      // Generate vehicle number
      const { data: vehicleNumber, error: numberError } = await supabase
        .rpc('generate_vehicle_number');

      if (numberError) throw numberError;

      // Insert vehicle
      const vehicleData = {
        vehicle_number: vehicleNumber,
        make: data.make,
        model: data.model,
        year: data.year,
        color: data.color,
        vehicle_type: data.vehicle_type,
        license_plate: data.license_plate,
        daily_rate: data.daily_rate,
        weekly_rate: data.weekly_rate || null,
        monthly_rate: data.monthly_rate || null,
        engine_size: data.engine_size || null,
        fuel_type: data.fuel_type || 'بنزين',
        transmission: data.transmission || 'أوتوماتيك',
        mileage: data.mileage || 0,
        insurance_company: data.insurance_company || null,
        insurance_policy_number: data.insurance_policy_number || null,
        insurance_expiry: data.insurance_expiry || null,
        registration_expiry: data.registration_expiry || null,
        notes: data.notes || null,
      };

      const { error } = await supabase
        .from('vehicles')
        .insert(vehicleData);

      if (error) throw error;

      toast({
        title: 'تم إضافة المركبة',
        description: 'تم إضافة المركبة بنجاح إلى الأسطول',
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إضافة المركبة',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    form.reset({
      fuel_type: 'بنزين',
      transmission: 'أوتوماتيك',
      mileage: 0,
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
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <BasicInfoSection control={form.control} />
            <PricingSection control={form.control} />
            <InsuranceSection control={form.control} />
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