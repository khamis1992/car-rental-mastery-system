import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const quotationSchema = z.object({
  customer_id: z.string().min(1, 'العميل مطلوب'),
  vehicle_id: z.string().min(1, 'المركبة مطلوبة'),
  start_date: z.date({ required_error: 'تاريخ البداية مطلوب' }),
  end_date: z.date({ required_error: 'تاريخ النهاية مطلوب' }),
  daily_rate: z.number().min(1, 'السعر اليومي مطلوب'),
  discount_amount: z.number().min(0).optional(),
  tax_amount: z.number().min(0).optional(),
  special_conditions: z.string().optional(),
  terms_and_conditions: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

interface QuotationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Array<{ id: string; name: string; customer_number: string }>;
  vehicles: Array<{ id: string; make: string; model: string; vehicle_number: string; daily_rate: number }>;
  onSuccess?: () => void;
}

export const QuotationForm: React.FC<QuotationFormProps> = ({
  open,
  onOpenChange,
  customers,
  vehicles,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      discount_amount: 0,
      tax_amount: 0,
    },
  });

  const watchedValues = form.watch();
  const selectedVehicle = vehicles.find(v => v.id === watchedValues.vehicle_id);
  
  // Calculate rental days and amounts
  const calculateAmounts = () => {
    if (!watchedValues.start_date || !watchedValues.end_date || !selectedVehicle) {
      return { rentalDays: 0, totalAmount: 0, finalAmount: 0 };
    }

    const diffTime = Math.abs(watchedValues.end_date.getTime() - watchedValues.start_date.getTime());
    const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    const dailyRate = watchedValues.daily_rate || selectedVehicle.daily_rate;
    const totalAmount = rentalDays * dailyRate;
    const discountAmount = watchedValues.discount_amount || 0;
    const taxAmount = watchedValues.tax_amount || 0;
    const finalAmount = totalAmount - discountAmount + taxAmount;

    return { rentalDays, totalAmount, finalAmount };
  };

  const { rentalDays, totalAmount, finalAmount } = calculateAmounts();

  // Update daily rate when vehicle changes
  React.useEffect(() => {
    if (selectedVehicle) {
      form.setValue('daily_rate', selectedVehicle.daily_rate);
    }
  }, [selectedVehicle, form]);

  const onSubmit = async (data: QuotationFormData) => {
    setIsLoading(true);
    try {
      const quotationNumber = await generateQuotationNumber();
      
      const quotationData = {
        quotation_number: quotationNumber,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: format(data.end_date, 'yyyy-MM-dd'),
        rental_days: rentalDays,
        daily_rate: data.daily_rate,
        total_amount: totalAmount,
        discount_amount: data.discount_amount || 0,
        tax_amount: data.tax_amount || 0,
        final_amount: finalAmount,
        special_conditions: data.special_conditions,
        terms_and_conditions: data.terms_and_conditions,
        status: 'draft',
        valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Valid for 30 days
      };

      const { error } = await supabase
        .from('quotations')
        .insert([quotationData]);

      if (error) throw error;

      toast({
        title: 'تم إنشاء العرض بنجاح',
        description: `رقم العرض: ${quotationNumber}`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'خطأ في إنشاء العرض',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuotationNumber = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_quotation_number');
    if (error) throw error;
    return data;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء عرض سعر جديد</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العميل</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر العميل" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.customer_number}
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
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المركبة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المركبة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} - {vehicle.vehicle_number}
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
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>تاريخ البداية</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ar })
                            ) : (
                              <span>اختر التاريخ</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>تاريخ النهاية</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ar })
                            ) : (
                              <span>اختر التاريخ</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < (form.getValues('start_date') || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daily_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر اليومي (د.ك)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قيمة الخصم (د.ك)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قيمة الضريبة (د.ك)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Calculation Summary */}
            {rentalDays > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">ملخص الحساب</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>عدد الأيام: {rentalDays}</div>
                  <div>المجموع الفرعي: {totalAmount.toFixed(3)} د.ك</div>
                  <div>الخصم: {(watchedValues.discount_amount || 0).toFixed(3)} د.ك</div>
                  <div>الضريبة: {(watchedValues.tax_amount || 0).toFixed(3)} د.ك</div>
                  <div className="font-bold">المجموع الإجمالي: {finalAmount.toFixed(3)} د.ك</div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="special_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شروط خاصة</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms_and_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الشروط والأحكام</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'جاري الإنشاء...' : 'إنشاء العرض'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};