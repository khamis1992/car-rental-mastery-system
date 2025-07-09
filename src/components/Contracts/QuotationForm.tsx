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
import { 
  CalendarIcon, 
  Calculator, 
  TrendingDown, 
  Info, 
  User, 
  Car, 
  RefreshCw,
  Save,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn, getStartOfToday, getStartOfDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { pricingService } from '@/services/pricingService';

const quotationSchema = z.object({
  customer_id: z.string().min(1, 'العميل مطلوب'),
  vehicle_id: z.string().min(1, 'المركبة مطلوبة'),
  start_date: z.date({ required_error: 'تاريخ البداية مطلوب' }),
  end_date: z.date({ required_error: 'تاريخ النهاية مطلوب' }),
  daily_rate: z.number().min(1, 'السعر اليومي مطلوب'),
  discount_amount: z.number().min(0).optional(),
  tax_amount: z.number().min(0).optional(),
  special_conditions: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

interface QuotationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Array<{ id: string; name: string; customer_number: string; rating?: number; total_contracts?: number }>;
  vehicles: Array<{ id: string; make: string; model: string; vehicle_number: string; daily_rate: number; weekly_rate?: number; monthly_rate?: number }>;
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
        status: 'draft',
        valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Valid for 30 days
      };

      const { error } = await supabase
        .from('quotations')
        .insert([{
          ...quotationData,
          tenant_id: null as any // Will be set by trigger
        }]);

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

  const handleClearForm = () => {
    form.reset();
  };


  // التحقق من صحة التواريخ
  const validateDates = () => {
    if (watchedValues.start_date && watchedValues.end_date) {
      if (watchedValues.end_date <= watchedValues.start_date) {
        return 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
      }
    }
    return null;
  };

  const dateError = validateDates();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto font-cairo">
        <DialogHeader className="text-right">
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            إنشاء عرض سعر جديد
          </DialogTitle>
        </DialogHeader>

        <div className="bg-[#f9f9f9] p-6 rounded-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* الشبكة الرئيسية: 2 عمود × 4 صفوف */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* الصف الأول - العميل والمركبة */}
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        العميل
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-border">
                            <SelectValue placeholder="اختر العميل من القائمة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{customer.name}</span>
                                <Badge variant="outline" className="mr-2">
                                  {customer.customer_number}
                                </Badge>
                              </div>
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
                      <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Car className="w-4 h-4 text-primary" />
                        المركبة
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-border">
                            <SelectValue placeholder="اختر المركبة المطلوبة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{vehicle.make} {vehicle.model}</span>
                                <div className="flex gap-2 mr-2">
                                  <Badge variant="outline">{vehicle.vehicle_number}</Badge>
                                  <Badge className="bg-success text-success-foreground">
                                    {vehicle.daily_rate.toFixed(3)} د.ك
                                  </Badge>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* الصف الثاني - التواريخ */}
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        تاريخ البداية
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full bg-white border-border text-right font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ar })
                              ) : (
                                <span>اختر تاريخ البداية</span>
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
                            disabled={(date) => date < getStartOfToday()}
                            initialFocus
                            className="pointer-events-auto"
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
                      <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        تاريخ النهاية
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full bg-white border-border text-right font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ar })
                              ) : (
                                <span>اختر تاريخ النهاية</span>
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
                            disabled={(date) => {
                              const startDate = form.getValues('start_date');
                              return date < (startDate ? getStartOfDate(startDate) : getStartOfToday());
                            }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                      {dateError && (
                        <Alert className="mt-2 border-warning">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-warning">
                            {dateError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </FormItem>
                  )}
                />

                {/* الصف الثالث - الأسعار */}
                <FormField
                  control={form.control}
                  name="daily_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        السعر اليومي
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="0.000"
                            className="bg-white border-border pr-12"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                            د.ك
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="discount_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-success" />
                          قيمة الخصم
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="0.000"
                              className="bg-white border-border pr-12"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                              د.ك
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* الصف الرابع - الضريبة وحقل إضافي */}
                <FormField
                  control={form.control}
                  name="tax_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        قيمة الضريبة
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.001"
                            placeholder="0.000"
                            className="bg-white border-border pr-12"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                            د.ك
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* حساب المبلغ النهائي التلقائي */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    المبلغ النهائي
                  </h4>
                  {rentalDays > 0 ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>عدد الأيام:</span>
                        <span className="font-medium">{rentalDays} يوم</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المجموع الفرعي:</span>
                        <span className="font-medium">{totalAmount.toFixed(3)} د.ك</span>
                      </div>
                      <div className="flex justify-between text-success">
                        <span>الخصم:</span>
                        <span className="font-medium">-{(watchedValues.discount_amount || 0).toFixed(3)} د.ك</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الضريبة:</span>
                        <span className="font-medium">+{(watchedValues.tax_amount || 0).toFixed(3)} د.ك</span>
                      </div>
                      <hr className="border-border" />
                      <div className="flex justify-between text-lg font-bold text-primary">
                        <span>المجموع الإجمالي:</span>
                        <span>{finalAmount.toFixed(3)} د.ك</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      اختر التواريخ والمركبة لعرض التفاصيل المالية
                    </p>
                  )}
                </div>
              </div>

              {/* الحقول العريضة - colSpan=2 */}
              <div className="space-y-6">
                {/* الشروط الخاصة */}
                <FormField
                  control={form.control}
                  name="special_conditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        الشروط الخاصة
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="اكتب أي شروط خاصة للعقد (اختياري)"
                          className="bg-white border-border min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* أزرار الإجراءات */}
              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleClearForm}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  تفريغ النموذج
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={isLoading || !!dateError}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'جاري إنشاء العرض...' : 'إنشاء عرض السعر'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};