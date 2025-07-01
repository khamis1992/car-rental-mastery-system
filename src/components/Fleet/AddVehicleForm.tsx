import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const vehicleSchema = z.object({
  make: z.string().min(2, 'يجب إدخال الصانع'),
  model: z.string().min(2, 'يجب إدخال الموديل'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(2, 'يجب إدخال اللون'),
  vehicle_type: z.enum(['sedan', 'suv', 'hatchback', 'coupe', 'pickup', 'van', 'luxury']),
  license_plate: z.string().min(3, 'يجب إدخال رقم اللوحة'),
  daily_rate: z.number().min(1, 'يجب إدخال السعر اليومي'),
  weekly_rate: z.number().optional(),
  monthly_rate: z.number().optional(),
  engine_size: z.string().optional(),
  fuel_type: z.string().default('بنزين'),
  transmission: z.string().default('أوتوماتيك'),
  mileage: z.number().default(0),
  insurance_company: z.string().optional(),
  insurance_policy_number: z.string().optional(),
  insurance_expiry: z.string().optional(),
  registration_expiry: z.string().optional(),
  notes: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface AddVehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const vehicleTypes = [
  { value: 'sedan', label: 'سيدان' },
  { value: 'suv', label: 'دفع رباعي' },
  { value: 'hatchback', label: 'هاتشباك' },
  { value: 'coupe', label: 'كوبيه' },
  { value: 'pickup', label: 'بيك أب' },
  { value: 'van', label: 'فان' },
  { value: 'luxury', label: 'فاخرة' },
];

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة مركبة جديدة</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الصانع</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: تويوتا" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الموديل</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: كامري" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سنة الصنع</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2024" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اللون</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: أبيض" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicle_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المركبة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المركبة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="license_plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم اللوحة</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: ا ب ج 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daily_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر اليومي (ريال)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="200" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weekly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر الأسبوعي (ريال)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1200" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر الشهري (ريال)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="4800" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عداد المسافة (كم)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الوقود</FormLabel>
                    <FormControl>
                      <Input placeholder="بنزين" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الناقل</FormLabel>
                    <FormControl>
                      <Input placeholder="أوتوماتيك" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insurance_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شركة التأمين</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: التعاونية للتأمين" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insurance_policy_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم وثيقة التأمين</FormLabel>
                    <FormControl>
                      <Input placeholder="رقم الوثيقة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insurance_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ انتهاء التأمين</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registration_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ انتهاء الترخيص</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea placeholder="أي ملاحظات إضافية..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" className="btn-primary">
                إضافة المركبة
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};