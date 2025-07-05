import React, { useState, useRef } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, FileText, Printer, Languages, Car, User, MapPin, Shield, CreditCard, FileSignature } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrencyKWD } from '@/lib/currency';
import { ElectronicSignature } from './ElectronicSignature';
import SignatureCanvas from 'react-signature-canvas';

// Schema validation for both languages
const bilingualContractSchema = z.object({
  // Basic Information / المعلومات الأساسية
  customer_id: z.string().min(1, 'Customer is required / العميل مطلوب'),
  vehicle_id: z.string().min(1, 'Vehicle is required / المركبة مطلوبة'),
  quotation_id: z.string().optional(),
  contract_language: z.enum(['ar', 'en', 'both']),
  
  // Contract Period / فترة العقد
  start_date: z.date({ required_error: 'Start date is required / تاريخ البداية مطلوب' }),
  end_date: z.date({ required_error: 'End date is required / تاريخ النهاية مطلوب' }),
  contract_type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  rental_purpose: z.enum(['personal', 'business', 'tourism', 'other']),
  
  // Financial Details / التفاصيل المالية
  daily_rate: z.number().min(1, 'Daily rate is required / السعر اليومي مطلوب'),
  discount_amount: z.number().min(0).optional(),
  tax_amount: z.number().min(0).optional(),
  security_deposit: z.number().min(0).optional(),
  insurance_amount: z.number().min(0).optional(),
  additional_fees: z.number().min(0).optional(),
  
  // Vehicle Delivery / تسليم المركبة
  pickup_location: z.string().optional(),
  return_location: z.string().optional(),
  pickup_time: z.string().optional(),
  return_time: z.string().optional(),
  pickup_mileage: z.number().min(0).optional(),
  fuel_level_pickup: z.enum(['full', 'three_quarters', 'half', 'quarter', 'empty']).optional(),
  
  // Driver Information / معلومات السائق
  primary_driver_name: z.string().optional(),
  primary_driver_license: z.string().optional(),
  additional_drivers: z.array(z.object({
    name: z.string(),
    license_number: z.string(),
    phone: z.string().optional(),
  })).optional(),
  
  // Insurance & Coverage / التأمين والتغطية
  insurance_type: z.enum(['basic', 'comprehensive', 'third_party', 'none']).optional(),
  collision_damage_waiver: z.boolean().optional(),
  theft_protection: z.boolean().optional(),
  personal_accident_insurance: z.boolean().optional(),
  
  // Terms and Conditions / الشروط والأحكام
  special_conditions: z.string().optional(),
  mileage_limit: z.number().optional(),
  fuel_policy: z.enum(['full_to_full', 'same_to_same', 'prepaid']).optional(),
  late_return_policy: z.string().optional(),
  damage_policy: z.string().optional(),
  
  // Legal Acceptance / القبول القانوني
  terms_accepted: z.boolean().refine(val => val === true, {
    message: 'Terms must be accepted / يجب قبول الشروط',
  }),
  privacy_policy_accepted: z.boolean().refine(val => val === true, {
    message: 'Privacy policy must be accepted / يجب قبول سياسة الخصوصية',
  }),
  
  // Notes / الملاحظات
  notes: z.string().optional(),
});

type BilingualContractFormData = z.infer<typeof bilingualContractSchema>;

interface BilingualContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Array<{ id: string; name: string; customer_number: string; phone: string; national_id?: string }>;
  vehicles: Array<{ 
    id: string; 
    make: string; 
    model: string; 
    year: number;
    vehicle_number: string; 
    license_plate: string;
    daily_rate: number; 
    status: string;
    color?: string;
  }>;
  quotations?: Array<{ id: string; quotation_number: string; customer_id: string; vehicle_id: string; final_amount: number }>;
  selectedQuotation?: string;
  onGetQuotationDetails?: (id: string) => Promise<any>;
  onSuccess?: () => void;
}

export const BilingualContractForm: React.FC<BilingualContractFormProps> = ({
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
  const [currentTab, setCurrentTab] = useState('basic');
  const [showSignature, setShowSignature] = useState(false);
  const [signatureType, setSignatureType] = useState<'customer' | 'company'>('customer');
  const [customerSignature, setCustomerSignature] = useState<string>('');
  const [companySignature, setCompanySignature] = useState<string>('');
  const customerSigRef = useRef<SignatureCanvas>(null);
  const companySigRef = useRef<SignatureCanvas>(null);
  const { toast } = useToast();

  const form = useForm<BilingualContractFormData>({
    resolver: zodResolver(bilingualContractSchema),
    defaultValues: {
      contract_language: 'both',
      contract_type: 'daily',
      rental_purpose: 'personal',
      discount_amount: 0,
      tax_amount: 0,
      security_deposit: 0,
      insurance_amount: 0,
      additional_fees: 0,
      fuel_level_pickup: 'full',
      insurance_type: 'basic',
      collision_damage_waiver: false,
      theft_protection: false,
      personal_accident_insurance: false,
      fuel_policy: 'full_to_full',
      terms_accepted: false,
      privacy_policy_accepted: false,
      additional_drivers: [],
      quotation_id: selectedQuotation,
    },
  });

  const watchedValues = form.watch();
  const selectedVehicle = vehicles.find(v => v.id === watchedValues.vehicle_id);
  const selectedQuote = quotations.find(q => q.id === watchedValues.quotation_id);

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
          const formData: Partial<BilingualContractFormData> = {
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
            terms_accepted: false,
            privacy_policy_accepted: false,
          };
          
          console.log('Setting form data:', formData);
          form.reset({ ...form.getValues(), ...formData });
          
        } catch (error) {
          console.error('Error loading quotation details:', error);
        } finally {
          setIsLoadingQuotation(false);
        }
      }
    };

    loadQuotationData();
  }, [selectedQuotation, onGetQuotationDetails]);

  // Update daily rate when vehicle changes
  React.useEffect(() => {
    if (selectedVehicle) {
      form.setValue('daily_rate', selectedVehicle.daily_rate);
    }
  }, [selectedVehicle, form]);

  // Calculate amounts
  const calculateAmounts = () => {
    if (!watchedValues.start_date || !watchedValues.end_date || !selectedVehicle) {
      return { rentalDays: 0, subtotal: 0, totalAmount: 0 };
    }

    const diffTime = Math.abs(watchedValues.end_date.getTime() - watchedValues.start_date.getTime());
    const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    const dailyRate = watchedValues.daily_rate || selectedVehicle.daily_rate;
    const subtotal = rentalDays * dailyRate;
    const discount = watchedValues.discount_amount || 0;
    const tax = watchedValues.tax_amount || 0;
    const insurance = watchedValues.insurance_amount || 0;
    const additionalFees = watchedValues.additional_fees || 0;
    const totalAmount = subtotal - discount + tax + insurance + additionalFees;

    return { rentalDays, subtotal, totalAmount };
  };

  const { rentalDays, subtotal, totalAmount } = calculateAmounts();

  // Get available vehicles
  const availableVehicles = vehicles.filter(v => v.status === 'available');

  const handlePrint = () => {
    window.print();
  };

  const onSubmit = async (data: BilingualContractFormData) => {
    if (!customerSignature || !companySignature) {
      toast({
        title: 'Error / خطأ',
        description: 'Both signatures are required / التوقيعان مطلوبان',
        variant: 'destructive',
      });
      return;
    }

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
        total_amount: subtotal,
        discount_amount: data.discount_amount || 0,
        tax_amount: data.tax_amount || 0,
        security_deposit: data.security_deposit || 0,
        insurance_amount: data.insurance_amount || 0,
        final_amount: totalAmount,
        pickup_location: data.pickup_location,
        return_location: data.return_location,
        pickup_mileage: data.pickup_mileage,
        fuel_level_pickup: data.fuel_level_pickup,
        special_conditions: data.special_conditions,
        terms_and_conditions: generateTermsAndConditions(data.contract_language),
        notes: data.notes,
        status: 'draft' as const,
        customer_signature: customerSignature,
        company_signature: companySignature,
        created_by: null,
      };

      const { error } = await supabase
        .from('contracts')
        .insert(contractData);

      if (error) throw error;

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
        title: 'Success / نجح',
        description: `Contract created successfully / تم إنشاء العقد بنجاح - ${contractNumber}`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error / خطأ',
        description: error.message || 'An error occurred / حدث خطأ',
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

  const generateTermsAndConditions = (language: string) => {
    const termsAr = `
الشروط والأحكام - عقد إيجار السيارات

1. التعاريف والتفسير:
- "الشركة": شركة تأجير السيارات المرخصة في دولة الكويت
- "المستأجر": الشخص أو الجهة المتعاقدة على استئجار المركبة
- "المركبة": السيارة محل عقد الإيجار

2. مدة الإيجار:
- تبدأ مدة الإيجار من التاريخ والوقت المحددين في العقد
- يجب إعادة المركبة في الموعد المحدد تماماً
- التأخير في الإعادة يترتب عليه رسوم إضافية

3. الالتزامات المالية:
- دفع كامل المبلغ المتفق عليه قبل تسليم المركبة
- دفع مبلغ التأمين القابل للاسترداد
- تحمل أي رسوم إضافية أو غرامات مرورية

4. استخدام المركبة:
- استخدام المركبة للأغراض المشروعة فقط
- عدم تأجير المركبة من الباطن
- عدم استخدامها في أنشطة غير قانونية

5. التأمين والأضرار:
- المركبة مؤمنة ضد الحوادث والسرقة
- المستأجر مسؤول عن الأضرار الناتجة عن الإهمال
- يجب الإبلاغ عن أي حادث فوراً

6. إنهاء العقد:
- يحق للشركة إنهاء العقد في حالة مخالفة الشروط
- يجب إعادة المركبة في نفس حالة التسليم
- التسوية النهائية تتم عند الإعادة

7. القانون الحاكم:
- يخضع هذا العقد لقوانين دولة الكويت
- أي نزاع يحل عبر المحاكم الكويتية المختصة
`;

    const termsEn = `
TERMS AND CONDITIONS - CAR RENTAL AGREEMENT

1. Definitions and Interpretation:
- "Company": The licensed car rental company in Kuwait
- "Renter": The person or entity contracting for vehicle rental
- "Vehicle": The car subject to this rental agreement

2. Rental Period:
- Rental period starts from the specified date and time in the contract
- Vehicle must be returned at the exact specified time
- Late return incurs additional charges

3. Financial Obligations:
- Payment of full agreed amount before vehicle delivery
- Payment of refundable security deposit
- Responsibility for additional fees or traffic violations

4. Vehicle Usage:
- Use vehicle for lawful purposes only
- No subletting of the vehicle
- No use in illegal activities

5. Insurance and Damages:
- Vehicle is insured against accidents and theft
- Renter responsible for damages due to negligence
- Any accident must be reported immediately

6. Contract Termination:
- Company may terminate contract for violation of terms
- Vehicle must be returned in same condition as delivered
- Final settlement upon return

7. Governing Law:
- This contract is governed by Kuwait laws
- Any dispute resolved through Kuwait courts
`;

    switch (language) {
      case 'ar': return termsAr;
      case 'en': return termsEn;
      case 'both': return termsAr + '\n\n' + termsEn;
      default: return termsAr + '\n\n' + termsEn;
    }
  };

  const clearSignature = (type: 'customer' | 'company') => {
    if (type === 'customer' && customerSigRef.current) {
      customerSigRef.current.clear();
      setCustomerSignature('');
    } else if (type === 'company' && companySigRef.current) {
      companySigRef.current.clear();
      setCompanySignature('');
    }
  };

  const saveSignature = (type: 'customer' | 'company') => {
    const ref = type === 'customer' ? customerSigRef.current : companySigRef.current;
    if (ref && !ref.isEmpty()) {
      const signature = ref.toDataURL();
      if (type === 'customer') {
        setCustomerSignature(signature);
      } else {
        setCompanySignature(signature);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div className="text-right">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Languages className="w-6 h-6" />
              Bilingual Car Rental Contract / عقد إيجار السيارة ثنائي اللغة
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete rental agreement form / نموذج عقد الإيجار الكامل
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="print:hidden"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print / طباعة
          </Button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic" className="text-xs">
                  <User className="w-4 h-4 mr-1" />
                  Basic / أساسي
                </TabsTrigger>
                <TabsTrigger value="vehicle" className="text-xs">
                  <Car className="w-4 h-4 mr-1" />
                  Vehicle / مركبة
                </TabsTrigger>
                <TabsTrigger value="delivery" className="text-xs">
                  <MapPin className="w-4 h-4 mr-1" />
                  Delivery / تسليم
                </TabsTrigger>
                <TabsTrigger value="insurance" className="text-xs">
                  <Shield className="w-4 h-4 mr-1" />
                  Insurance / تأمين
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-xs">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Financial / مالي
                </TabsTrigger>
                <TabsTrigger value="signature" className="text-xs">
                  <FileSignature className="w-4 h-4 mr-1" />
                  Signature / توقيع
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Basic Information / المعلومات الأساسية
                    </CardTitle>
                  </CardHeader>
                   <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {quotations.length > 0 && (
                       <FormField
                         control={form.control}
                         name="quotation_id"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Quotation / عرض السعر (Optional / اختياري)</FormLabel>
                             <Select 
                               key={`quotation-${field.value || 'empty'}`}
                               onValueChange={field.onChange} 
                               value={field.value}
                             >
                               <FormControl>
                                 <SelectTrigger>
                                   <SelectValue placeholder="Select existing quotation / اختر عرض سعر موجود" />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                 {quotations.map((quotation) => (
                                   <SelectItem key={quotation.id} value={quotation.id}>
                                     {quotation.quotation_number} - {quotation.final_amount.toFixed(3)} KWD / د.ك
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
                          <FormLabel>Customer / العميل *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select customer / اختر العميل" />
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
                      name="contract_language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Language / لغة العقد *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ar">Arabic / العربية</SelectItem>
                              <SelectItem value="en">English / الإنجليزية</SelectItem>
                              <SelectItem value="both">Both / كلاهما</SelectItem>
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
                          <FormLabel>Start Date / تاريخ البداية *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ar })
                                  ) : (
                                    <span>Pick date / اختر التاريخ</span>
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
                          <FormLabel>End Date / تاريخ النهاية *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ar })
                                  ) : (
                                    <span>Pick date / اختر التاريخ</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < (watchedValues.start_date || new Date())}
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
                      name="contract_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Type / نوع العقد *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily / يومي</SelectItem>
                              <SelectItem value="weekly">Weekly / أسبوعي</SelectItem>
                              <SelectItem value="monthly">Monthly / شهري</SelectItem>
                              <SelectItem value="custom">Custom / مخصص</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rental_purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rental Purpose / غرض الإيجار</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="personal">Personal / شخصي</SelectItem>
                              <SelectItem value="business">Business / تجاري</SelectItem>
                              <SelectItem value="tourism">Tourism / سياحي</SelectItem>
                              <SelectItem value="other">Other / أخرى</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Rental Summary */}
                {rentalDays > 0 && (
                  <Card className="bg-muted/20">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Days / الأيام</p>
                          <p className="text-2xl font-bold text-primary">{rentalDays}</p>
                        </div>
                        {selectedVehicle && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">Daily Rate / السعر اليومي</p>
                              <p className="text-lg font-semibold">{formatCurrencyKWD(selectedVehicle.daily_rate)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Subtotal / المجموع الفرعي</p>
                              <p className="text-lg font-semibold">{formatCurrencyKWD(subtotal)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total / الإجمالي</p>
                              <p className="text-2xl font-bold text-primary">{formatCurrencyKWD(totalAmount)}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Vehicle Information Tab */}
              <TabsContent value="vehicle" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Vehicle Selection / اختيار المركبة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="vehicle_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Vehicles / المركبات المتاحة *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select vehicle / اختر المركبة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableVehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.license_plate}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedVehicle && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Vehicle Details / تفاصيل المركبة</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Make / الماركة:</span> {selectedVehicle.make}</p>
                                <p><span className="font-medium">Model / الموديل:</span> {selectedVehicle.model}</p>
                                <p><span className="font-medium">Year / السنة:</span> {selectedVehicle.year}</p>
                                <p><span className="font-medium">License Plate / رقم اللوحة:</span> {selectedVehicle.license_plate}</p>
                                <p><span className="font-medium">Vehicle Number / رقم المركبة:</span> {selectedVehicle.vehicle_number}</p>
                                {selectedVehicle.color && (
                                  <p><span className="font-medium">Color / اللون:</span> {selectedVehicle.color}</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Pricing / التسعير</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Daily Rate / السعر اليومي:</span> {formatCurrencyKWD(selectedVehicle.daily_rate)}</p>
                                <Badge variant="outline" className="mt-2">
                                  Available / متاحة
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <FormField
                      control={form.control}
                      name="daily_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Daily Rate / السعر اليومي المخصص (KWD)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              placeholder={selectedVehicle ? selectedVehicle.daily_rate.toString() : "0.000"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mileage_limit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mileage Limit (km) / حد المسافة (كم)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              placeholder="Unlimited / غير محدود"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Delivery & Pickup Tab */}
              <TabsContent value="delivery" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Delivery & Pickup Details / تفاصيل التسليم والاستلام
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="pickup_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Location / مكان التسليم</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter pickup location / أدخل مكان التسليم" />
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
                          <FormLabel>Return Location / مكان الإعادة</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter return location / أدخل مكان الإعادة" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pickup_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Time / وقت التسليم</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="return_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Return Time / وقت الإعادة</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pickup_mileage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Mileage (km) / قراءة العداد عند التسليم</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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
                          <FormLabel>Fuel Level at Pickup / مستوى الوقود عند التسليم</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full">Full / ممتلئ</SelectItem>
                              <SelectItem value="three_quarters">3/4 / ثلاثة أرباع</SelectItem>
                              <SelectItem value="half">1/2 / نصف</SelectItem>
                              <SelectItem value="quarter">1/4 / ربع</SelectItem>
                              <SelectItem value="empty">Empty / فارغ</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fuel_policy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuel Policy / سياسة الوقود</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full_to_full">Full to Full / ممتلئ لممتلئ</SelectItem>
                              <SelectItem value="same_to_same">Same to Same / نفس لنفس</SelectItem>
                              <SelectItem value="prepaid">Prepaid / مدفوع مسبقاً</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insurance Tab */}
              <TabsContent value="insurance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Insurance & Protection / التأمين والحماية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="insurance_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Type / نوع التأمين</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="basic">Basic / أساسي</SelectItem>
                              <SelectItem value="comprehensive">Comprehensive / شامل</SelectItem>
                              <SelectItem value="third_party">Third Party / طرف ثالث</SelectItem>
                              <SelectItem value="none">None / لا يوجد</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="collision_damage_waiver"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Collision Damage Waiver / إعفاء أضرار الاصطدام
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="theft_protection"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Theft Protection / حماية من السرقة
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal_accident_insurance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Personal Accident / تأمين الحوادث الشخصية
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="insurance_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Amount (KWD) / مبلغ التأمين</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Financial Tab */}
              <TabsContent value="financial" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Financial Details / التفاصيل المالية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="discount_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Amount (KWD) / مبلغ الخصم</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
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
                          <FormLabel>Tax Amount (KWD) / مبلغ الضريبة</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
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
                          <FormLabel>Security Deposit (KWD) / مبلغ التأمين</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
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
                      name="additional_fees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Fees (KWD) / رسوم إضافية</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {(subtotal > 0 || totalAmount > 0) && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle>Financial Summary / الملخص المالي</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Subtotal / المجموع الفرعي:</span>
                          <span className="font-semibold">{formatCurrencyKWD(subtotal)}</span>
                        </div>
                        {(watchedValues.discount_amount || 0) > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount / الخصم:</span>
                            <span>- {formatCurrencyKWD(watchedValues.discount_amount || 0)}</span>
                          </div>
                        )}
                        {(watchedValues.tax_amount || 0) > 0 && (
                          <div className="flex justify-between">
                            <span>Tax / الضريبة:</span>
                            <span>+ {formatCurrencyKWD(watchedValues.tax_amount || 0)}</span>
                          </div>
                        )}
                        {(watchedValues.insurance_amount || 0) > 0 && (
                          <div className="flex justify-between">
                            <span>Insurance / التأمين:</span>
                            <span>+ {formatCurrencyKWD(watchedValues.insurance_amount || 0)}</span>
                          </div>
                        )}
                        {(watchedValues.additional_fees || 0) > 0 && (
                          <div className="flex justify-between">
                            <span>Additional Fees / الرسوم الإضافية:</span>
                            <span>+ {formatCurrencyKWD(watchedValues.additional_fees || 0)}</span>
                          </div>
                        )}
                        <hr />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Amount / المبلغ الإجمالي:</span>
                          <span className="text-primary">{formatCurrencyKWD(totalAmount)}</span>
                        </div>
                        {(watchedValues.security_deposit || 0) > 0 && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Security Deposit (Refundable) / التأمين (قابل للاسترداد):</span>
                            <span>{formatCurrencyKWD(watchedValues.security_deposit || 0)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Signature Tab */}
              <TabsContent value="signature" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSignature className="w-5 h-5" />
                      Digital Signatures / التوقيعات الرقمية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Terms Acceptance */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="terms_accepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-base">
                                I accept the terms and conditions / أوافق على الشروط والأحكام *
                              </FormLabel>
                              <p className="text-sm text-muted-foreground">
                                By checking this box, you agree to all terms and conditions of this rental agreement.
                                من خلال تحديد هذا المربع، فإنك توافق على جميع الشروط والأحكام لعقد الإيجار هذا.
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="privacy_policy_accepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-base">
                                I accept the privacy policy / أوافق على سياسة الخصوصية *
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Customer Signature */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Customer Signature / توقيع العميل</h4>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 bg-background">
                        <SignatureCanvas
                          ref={customerSigRef}
                          canvasProps={{
                            width: 400,
                            height: 150,
                            className: 'signature-canvas w-full h-full bg-white rounded border',
                          }}
                          backgroundColor="white"
                          penColor="black"
                          minWidth={1}
                          maxWidth={2.5}
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => clearSignature('customer')}
                          >
                            Clear / مسح
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => saveSignature('customer')}
                          >
                            Save / حفظ
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Company Signature */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Company Signature / توقيع الشركة</h4>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 bg-background">
                        <SignatureCanvas
                          ref={companySigRef}
                          canvasProps={{
                            width: 400,
                            height: 150,
                            className: 'signature-canvas w-full h-full bg-white rounded border',
                          }}
                          backgroundColor="white"
                          penColor="black"
                          minWidth={1}
                          maxWidth={2.5}
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => clearSignature('company')}
                          >
                            Clear / مسح
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => saveSignature('company')}
                          >
                            Save / حفظ
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Special Conditions and Notes */}
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="special_conditions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Conditions / الشروط الخاصة</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={4}
                                placeholder="Enter any special conditions / أدخل أي شروط خاصة"
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
                            <FormLabel>Additional Notes / ملاحظات إضافية</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                placeholder="Enter additional notes / أدخل ملاحظات إضافية"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t print:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel / إلغاء
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Preview / معاينة
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading || !watchedValues.terms_accepted || !watchedValues.privacy_policy_accepted}
                  className="min-w-[200px]"
                >
                  {isLoading ? 'Creating Contract... / جاري إنشاء العقد...' : 'Create Contract / إنشاء العقد'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};