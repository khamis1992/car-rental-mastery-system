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
import { Car, Calendar, CreditCard, Settings, Gauge, FileText, Shield, RotateCcw } from 'lucide-react';

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
            {/* القسم الأول: المعلومات الأساسية */}
            <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                المعلومات الأساسية
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* العمود الأيسر */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="vehicle_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">نوع المركبة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-background/60 border-border/60 text-right">
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-muted-foreground" />
                                <SelectValue placeholder="اختر نوع المركبة" />
                              </div>
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
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">الصانع</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Car className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="مثال: تويوتا" 
                              className="h-12 pr-10 bg-background/60 border-border/60" 
                              {...field} 
                            />
                          </div>
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
                        <FormLabel className="text-sm font-medium text-foreground">سنة الصنع</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="number" 
                              placeholder="2024" 
                              className="h-12 pr-10 bg-background/60 border-border/60"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="license_plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">رقم اللوحة</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="مثال: أ ب ج ١٢٣٤" 
                              className="h-12 pr-10 bg-background/60 border-border/60"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* العمود الأيمن */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">الموديل</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Car className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="مثال: كامري" 
                              className="h-12 pr-10 bg-background/60 border-border/60"
                              {...field} 
                            />
                          </div>
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
                        <FormLabel className="text-sm font-medium text-foreground">اللون</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="مثال: أبيض" 
                            className="h-12 bg-background/60 border-border/60"
                            {...field} 
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
                        <FormLabel className="text-sm font-medium text-foreground">عداد المسافة</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Gauge className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="h-12 pr-10 pl-12 bg-background/60 border-border/60"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                            <span className="absolute left-3 top-3 text-sm text-muted-foreground">كم</span>
                          </div>
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
                        <FormLabel className="text-sm font-medium text-foreground">نوع الناقل</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Settings className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="أوتوماتيك" 
                              className="h-12 pr-10 bg-background/60 border-border/60"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* القسم الثاني: الأسعار */}
            <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                الأسعار
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="daily_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">السعر اليومي</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CreditCard className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="200" 
                            className="h-12 pr-10 pl-16 bg-background/60 border-border/60"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                          <span className="absolute left-3 top-3 text-sm text-muted-foreground">ريال</span>
                        </div>
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
                      <FormLabel className="text-sm font-medium text-foreground">السعر الأسبوعي</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CreditCard className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="1200" 
                            className="h-12 pr-10 pl-16 bg-background/60 border-border/60"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                          <span className="absolute left-3 top-3 text-sm text-muted-foreground">ريال</span>
                        </div>
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
                      <FormLabel className="text-sm font-medium text-foreground">السعر الشهري</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CreditCard className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            placeholder="4800" 
                            className="h-12 pr-10 pl-16 bg-background/60 border-border/60"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                          <span className="absolute left-3 top-3 text-sm text-muted-foreground">ريال</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* القسم الثالث: التأمين والترخيص */}
            <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                التأمين والترخيص
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="insurance_company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">شركة التأمين</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Shield className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="مثال: التعاونية للتأمين" 
                              className="h-12 pr-10 bg-background/60 border-border/60"
                              {...field} 
                            />
                          </div>
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
                        <FormLabel className="text-sm font-medium text-foreground">رقم وثيقة التأمين</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="رقم الوثيقة" 
                              className="h-12 pr-10 bg-background/60 border-border/60"
                              {...field} 
                            />
                          </div>
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
                        <FormLabel className="text-sm font-medium text-foreground">نوع الوقود</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="بنزين" 
                            className="h-12 bg-background/60 border-border/60"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="insurance_expiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">تاريخ انتهاء التأمين</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="date" 
                              className="h-12 pr-10 bg-background/60 border-border/60"
                              {...field} 
                            />
                          </div>
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
                        <FormLabel className="text-sm font-medium text-foreground">تاريخ انتهاء الترخيص</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="date" 
                              className="h-12 pr-10 bg-background/60 border-border/60"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="engine_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">حجم المحرك</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Settings className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="مثال: 2.0L" 
                              className="h-12 pr-10 bg-background/60 border-border/60"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* القسم الرابع: ملاحظات */}
            <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                ملاحظات إضافية
              </h3>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="أي ملاحظات إضافية حول المركبة..." 
                        className="min-h-[120px] bg-background/60 border-border/60 resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* الأزرار */}
            <div className="flex justify-between gap-4 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex items-center gap-2 h-12 px-6"
              >
                <RotateCcw className="w-4 h-4" />
                تفريغ النموذج
              </Button>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-12 px-6"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Car className="w-4 h-4 mr-2" />
                  إضافة المركبة
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};