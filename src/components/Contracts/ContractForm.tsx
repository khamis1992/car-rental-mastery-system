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

const contractSchema = z.object({
  customer_id: z.string().min(1, 'العميل مطلوب'),
  vehicle_id: z.string().min(1, 'المركبة مطلوبة'),
  quotation_id: z.string().optional(),
  start_date: z.date({ required_error: 'تاريخ البداية مطلوب' }),
  end_date: z.date({ required_error: 'تاريخ النهاية مطلوب' }),
  contract_type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  daily_rate: z.number().min(1, 'السعر اليومي مطلوب'),
  discount_amount: z.number().min(0).optional(),
  tax_amount: z.number().min(0).optional(),
  security_deposit: z.number().min(0).optional(),
  insurance_amount: z.number().min(0).optional(),
  pickup_location: z.string().optional(),
  return_location: z.string().optional(),
  special_conditions: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  notes: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

interface ContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Array<{ id: string; name: string; customer_number: string }>;
  vehicles: Array<{ id: string; make: string; model: string; vehicle_number: string; daily_rate: number; status: string }>;
  quotations?: Array<{ id: string; quotation_number: string; customer_id: string; vehicle_id: string; final_amount: number }>;
  selectedQuotation?: string;
  onSuccess?: () => void;
}

export const ContractForm: React.FC<ContractFormProps> = ({
  open,
  onOpenChange,
  customers,
  vehicles,
  quotations = [],
  selectedQuotation,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contract_type: 'daily',
      discount_amount: 0,
      tax_amount: 0,
      security_deposit: 0,
      insurance_amount: 0,
      quotation_id: selectedQuotation,
    },
  });

  const watchedValues = form.watch();
  const selectedVehicle = vehicles.find(v => v.id === watchedValues.vehicle_id);
  const selectedQuote = quotations.find(q => q.id === watchedValues.quotation_id);
  
  // Filter available vehicles (not rented)
  const availableVehicles = vehicles.filter(v => v.status === 'available');

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

  // Update form when quotation is selected
  React.useEffect(() => {
    if (selectedQuote) {
      form.setValue('customer_id', selectedQuote.customer_id);
      form.setValue('vehicle_id', selectedQuote.vehicle_id);
    }
  }, [selectedQuote, form]);

  // Update daily rate when vehicle changes
  React.useEffect(() => {
    if (selectedVehicle) {
      form.setValue('daily_rate', selectedVehicle.daily_rate);
    }
  }, [selectedVehicle, form]);

  const onSubmit = async (data: ContractFormData) => {
    setIsLoading(true);
    try {
      const contractNumber = await generateContractNumber();
      
      const contractData = {
        contract_number: contractNumber,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        quotation_id: data.quotation_id || null,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: format(data.end_date, 'yyyy-MM-dd'),
        rental_days: rentalDays,
        contract_type: data.contract_type,
        daily_rate: data.daily_rate,
        total_amount: totalAmount,
        discount_amount: data.discount_amount || 0,
        tax_amount: data.tax_amount || 0,
        security_deposit: data.security_deposit || 0,
        insurance_amount: data.insurance_amount || 0,
        final_amount: finalAmount,
        pickup_location: data.pickup_location,
        return_location: data.return_location,
        special_conditions: data.special_conditions,
        terms_and_conditions: data.terms_and_conditions,
        notes: data.notes,
        status: 'draft',
      };

      const { error } = await supabase
        .from('contracts')
        .insert(contractData);

      if (error) throw error;

      // Update quotation status if one was selected
      if (data.quotation_id) {
        await supabase
          .from('quotations')
          .update({ status: 'converted' })
          .eq('id', data.quotation_id);
      }

      toast({
        title: 'تم إنشاء العقد بنجاح',
        description: `رقم العقد: ${contractNumber}`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'خطأ في إنشاء العقد',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateContractNumber = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_contract_number');
    if (error) throw error;
    return data;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء عقد جديد</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">المعلومات الأساسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quotations.length > 0 && (
                  <FormField
                    control={form.control}
                    name="quotation_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عرض السعر (اختياري)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر عرض سعر" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {quotations.map((quotation) => (
                              <SelectItem key={quotation.id} value={quotation.id}>
                                {quotation.quotation_number} - {quotation.final_amount.toFixed(3)} د.ك
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                          {availableVehicles.map((vehicle) => (
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
                  name="contract_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع العقد</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع العقد" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">يومي</SelectItem>
                          <SelectItem value="weekly">أسبوعي</SelectItem>
                          <SelectItem value="monthly">شهري</SelectItem>
                          <SelectItem value="custom">مخصص</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">التواريخ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">التسعير</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <FormField
                  control={form.control}
                  name="security_deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التأمين (د.ك)</FormLabel>
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
                  name="insurance_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>قيمة التأمين الشامل (د.ك)</FormLabel>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>عدد الأيام: {rentalDays}</div>
                    <div>المجموع الفرعي: {totalAmount.toFixed(3)} د.ك</div>
                    <div>الخصم: {(watchedValues.discount_amount || 0).toFixed(3)} د.ك</div>
                    <div>الضريبة: {(watchedValues.tax_amount || 0).toFixed(3)} د.ك</div>
                    <div className="font-bold col-span-2">المجموع الإجمالي: {finalAmount.toFixed(3)} د.ك</div>
                  </div>
                </div>
              )}
            </div>

            {/* Locations */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">المواقع</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pickup_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>موقع الاستلام</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="return_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>موقع الإرجاع</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">معلومات إضافية</h3>
              <div className="space-y-4">
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'جاري الإنشاء...' : 'إنشاء العقد'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};