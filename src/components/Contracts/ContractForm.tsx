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
  fuel_level_pickup: z.string().optional(),
  pickup_mileage: z.number().min(0).optional(),
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
  onGetQuotationDetails?: (id: string) => Promise<any>;
  onSuccess?: () => void;
}

export const ContractForm: React.FC<ContractFormProps> = ({
  open,
  onOpenChange,
  customers,
  vehicles,
  quotations = [],
  selectedQuotation,
  onGetQuotationDetails,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
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

  // Auto-populate form when quotation is selected
  React.useEffect(() => {
    const loadQuotationData = async () => {
      if (selectedQuotation && onGetQuotationDetails) {
        console.log('Loading quotation data for:', selectedQuotation);
        setIsLoadingQuotation(true);
        
        try {
          const quotationDetails = await onGetQuotationDetails(selectedQuotation);
          console.log('Quotation details loaded:', quotationDetails);
          
          // Determine contract type based on rental days
          const startDate = new Date(quotationDetails.start_date);
          const endDate = new Date(quotationDetails.end_date);
          const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          let contractType: 'daily' | 'weekly' | 'monthly' | 'custom' = 'daily';
          if (days >= 30) {
            contractType = 'monthly';
          } else if (days >= 7) {
            contractType = 'weekly';
          } else if (days === 1) {
            contractType = 'daily';
          } else {
            contractType = 'custom';
          }
          
          // Use form.reset() to populate all fields at once and trigger re-renders
          const formData: Partial<ContractFormData> = {
            customer_id: quotationDetails.customer_id,
            vehicle_id: quotationDetails.vehicle_id,
            quotation_id: quotationDetails.id,
            start_date: new Date(quotationDetails.start_date),
            end_date: new Date(quotationDetails.end_date),
            daily_rate: quotationDetails.daily_rate,
            discount_amount: quotationDetails.discount_amount || 0,
            tax_amount: quotationDetails.tax_amount || 0,
            security_deposit: 0,
            insurance_amount: 0,
            contract_type: contractType,
            special_conditions: quotationDetails.special_conditions || '',
            terms_and_conditions: quotationDetails.terms_and_conditions || '',
            notes: ''
          };
          
          console.log('Setting form data:', formData);
          form.reset(formData);
          
        } catch (error) {
          console.error('Error loading quotation details:', error);
        } finally {
          setIsLoadingQuotation(false);
        }
      }
    };

    loadQuotationData();
  }, [selectedQuotation, onGetQuotationDetails]); // Removed 'form' from dependencies

  // Update daily rate when vehicle changes
  React.useEffect(() => {
    if (selectedVehicle) {
      form.setValue('daily_rate', selectedVehicle.daily_rate);
    }
  }, [selectedVehicle, form]);

  const onSubmit = async (data: ContractFormData) => {
    setIsLoading(true);
    try {
      console.log('Starting contract creation with data:', data);
      
      // Validate dates
      if (data.start_date >= data.end_date) {
        throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      }

      // Validate vehicle availability
      if (!selectedVehicle || selectedVehicle.status !== 'available') {
        throw new Error('المركبة المختارة غير متاحة');
      }

      console.log('Generating contract number...');
      const contractNumber = await generateContractNumber();
      console.log('Generated contract number:', contractNumber);
      
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
        fuel_level_pickup: data.fuel_level_pickup,
        pickup_mileage: data.pickup_mileage,
        special_conditions: data.special_conditions,
        terms_and_conditions: data.terms_and_conditions,
        notes: data.notes,
        status: 'draft' as const,
        created_by: null, // Will be set by database trigger
      };

      console.log('Inserting contract data:', contractData);
      const { error, data: insertedData } = await supabase
        .from('contracts')
        .insert(contractData)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`خطأ في قاعدة البيانات: ${error.message}`);
      }

      console.log('Contract created successfully:', insertedData);

      // Update quotation status if one was selected
      if (data.quotation_id) {
        console.log('Updating quotation status...');
        const { error: quotationError } = await supabase
          .from('quotations')
          .update({ status: 'converted' })
          .eq('id', data.quotation_id);
        
        if (quotationError) {
          console.error('Error updating quotation:', quotationError);
          // Don't throw here as contract is already created
        }
      }

      toast({
        title: 'تم إنشاء العقد بنجاح',
        description: `رقم العقد: ${contractNumber}`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Contract creation error:', error);
      toast({
        title: 'خطأ في إنشاء العقد',
        description: error.message || 'حدث خطأ غير متوقع',
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary text-right">إنشاء عقد جديد</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* المعلومات الأساسية */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-700 border-b pb-2">المعلومات الأساسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quotations.length > 0 && (
                  <FormField
                    control={form.control}
                    name="quotation_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">عرض السعر (اختياري)</FormLabel>
                        <Select 
                          key={`quotation-${field.value || 'empty'}`}
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="اختر عرض سعر موجود" />
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
                      <FormLabel className="text-sm font-medium">العميل *</FormLabel>
                      <Select 
                        key={`customer-${field.value || 'empty'}`}
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
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
                      <FormLabel className="text-sm font-medium">المركبة *</FormLabel>
                      <Select 
                        key={`vehicle-${field.value || 'empty'}`}
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="اختر المركبة المتاحة" />
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
                      <FormLabel className="text-sm font-medium">نوع العقد *</FormLabel>
                      <Select 
                        key={`contract-type-${field.value || 'empty'}`}
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
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

            {/* التواريخ */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-700 border-b pb-2">التواريخ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-medium">تاريخ البداية *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-11 justify-start text-right font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="ml-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP", { locale: ar })
                              ) : (
                                <span>اختر تاريخ البداية</span>
                              )}
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
                      <FormLabel className="text-sm font-medium">تاريخ النهاية *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-11 justify-start text-right font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="ml-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP", { locale: ar })
                              ) : (
                                <span>اختر تاريخ النهاية</span>
                              )}
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
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* عرض تحذير للتواريخ المتعارضة */}
              {rentalDays > 0 && watchedValues.contract_type === 'daily' && rentalDays > 1 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    تنبيه: تم اختيار عقد يومي لكن المدة {rentalDays} أيام. يمكن تغيير نوع العقد إلى "مخصص" أو تعديل التواريخ.
                  </p>
                </div>
              )}
            </div>

            {/* التسعير */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-700 border-b pb-2">التسعير</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="daily_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">السعر اليومي *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="مثال: 25.000 د.ك"
                          className="h-11 text-right"
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
                      <FormLabel className="text-sm font-medium">قيمة الخصم</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="مثال: 5.000 د.ك"
                          className="h-11 text-right"
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
                      <FormLabel className="text-sm font-medium">قيمة الضريبة</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="مثال: 2.500 د.ك"
                          className="h-11 text-right"
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
                      <FormLabel className="text-sm font-medium">مبلغ التأمين</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="مثال: 100.000 د.ك"
                          className="h-11 text-right"
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
                      <FormLabel className="text-sm font-medium">التأمين الشامل</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="مثال: 10.000 د.ك"
                          className="h-11 text-right"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ملخص الحساب */}
              {rentalDays > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <h4 className="font-bold text-blue-900 mb-3">ملخص الحساب</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-blue-800">
                      <span className="font-medium">عدد الأيام:</span>
                      <span className="block text-lg font-bold">{rentalDays}</span>
                    </div>
                    <div className="text-blue-800">
                      <span className="font-medium">المجموع الفرعي:</span>
                      <span className="block text-lg font-bold">{totalAmount.toFixed(3)} د.ك</span>
                    </div>
                    <div className="text-blue-800">
                      <span className="font-medium">بعد الخصم والضريبة:</span>
                      <span className="block text-lg font-bold">{(totalAmount - (watchedValues.discount_amount || 0) + (watchedValues.tax_amount || 0)).toFixed(3)} د.ك</span>
                    </div>
                    <div className="text-blue-900 bg-blue-100 p-2 rounded">
                      <span className="font-medium">المجموع الإجمالي:</span>
                      <span className="block text-xl font-bold text-blue-600">{finalAmount.toFixed(3)} د.ك</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* المواقع وتفاصيل المركبة */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-700 border-b pb-2">المواقع وتفاصيل المركبة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="pickup_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">موقع الاستلام</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="مثال: المكتب الرئيسي - الكويت"
                          className="h-11 text-right"
                          {...field} 
                        />
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
                      <FormLabel className="text-sm font-medium">موقع الإرجاع</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="مثال: المكتب الرئيسي - الكويت"
                          className="h-11 text-right"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuel_level_pickup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">مستوى الوقود عند الاستلام</FormLabel>
                      <Select 
                        key={`fuel-level-${field.value || 'empty'}`}
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="اختر مستوى الوقود" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full">ممتلئ (100%)</SelectItem>
                          <SelectItem value="3/4">ثلاثة أرباع (75%)</SelectItem>
                          <SelectItem value="1/2">النصف (50%)</SelectItem>
                          <SelectItem value="1/4">ربع (25%)</SelectItem>
                          <SelectItem value="empty">فارغ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickup_mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">قراءة العداد عند الاستلام</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="مثال: 45000 كم"
                          className="h-11 text-right"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* شروط العقد والملاحظات */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-700 border-b pb-2">شروط العقد والملاحظات</h3>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="special_conditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">شروط خاصة</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أدخل أي شروط خاصة للعقد..."
                          className="min-h-[80px] text-right"
                          {...field} 
                        />
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
                      <FormLabel className="text-sm font-medium">الشروط والأحكام</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أدخل الشروط والأحكام العامة للعقد..."
                          className="min-h-[100px] text-right"
                          {...field} 
                        />
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
                      <FormLabel className="text-sm font-medium">ملاحظات إضافية</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أدخل أي ملاحظات أو تفاصيل إضافية..."
                          className="min-h-[80px] text-right"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                onClick={() => {
                  form.reset();
                }}
                className="px-8"
              >
                تفريغ النموذج
              </Button>
              
              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="lg"
                  onClick={() => onOpenChange(false)}
                  className="px-8"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={isLoading}
                  className="px-8 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'إنشاء العقد'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};