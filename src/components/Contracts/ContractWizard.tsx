import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// تقسيم النموذج إلى خطوات
const contractSchema = z.object({
  // الخطوة 1: المعلومات الأساسية
  customer_id: z.string().min(1, 'العميل مطلوب'),
  vehicle_id: z.string().min(1, 'المركبة مطلوبة'),
  quotation_id: z.string().optional(),
  
  // الخطوة 2: التواريخ والفترة
  start_date: z.date({ required_error: 'تاريخ البداية مطلوب' }),
  end_date: z.date({ required_error: 'تاريخ النهاية مطلوب' }),
  contract_type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  
  // الخطوة 3: التسعير
  daily_rate: z.number().min(1, 'السعر اليومي مطلوب'),
  discount_amount: z.number().min(0).optional(),
  tax_amount: z.number().min(0).optional(),
  security_deposit: z.number().min(0).optional(),
  insurance_amount: z.number().min(0).optional(),
  
  // الخطوة 4: تفاصيل التسليم
  pickup_location: z.string().optional(),
  return_location: z.string().optional(),
  fuel_level_pickup: z.string().optional(),
  pickup_mileage: z.number().min(0).optional(),
  
  // الخطوة 5: الشروط والملاحظات
  special_conditions: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  notes: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

interface WizardStep {
  id: string;
  title: string;
  description: string;
  fields: (keyof ContractFormData)[];
  isValid: (data: Partial<ContractFormData>) => boolean;
}

interface ContractWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Array<{ id: string; name: string; customer_number: string }>;
  vehicles: Array<{ id: string; make: string; model: string; vehicle_number: string; daily_rate: number; status: string }>;
  quotations?: Array<{ id: string; quotation_number: string; customer_id: string; vehicle_id: string; final_amount: number }>;
  selectedQuotation?: string;
  onGetQuotationDetails?: (id: string) => Promise<any>;
  onSuccess?: () => void;
}

export const ContractWizard: React.FC<ContractWizardProps> = ({
  open,
  onOpenChange,
  customers,
  vehicles,
  quotations = [],
  selectedQuotation,
  onGetQuotationDetails,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const { toast } = useToast();

  const steps: WizardStep[] = [
    {
      id: 'basic',
      title: 'المعلومات الأساسية',
      description: 'اختر العميل والمركبة وعرض السعر (إن وجد)',
      fields: ['customer_id', 'vehicle_id', 'quotation_id'],
      isValid: (data) => !!(data.customer_id && data.vehicle_id),
    },
    {
      id: 'dates',
      title: 'التواريخ والفترة',
      description: 'حدد فترة الإيجار ونوع العقد',
      fields: ['start_date', 'end_date', 'contract_type'],
      isValid: (data) => !!(data.start_date && data.end_date && data.contract_type),
    },
    {
      id: 'pricing',
      title: 'التسعير والمبالغ',
      description: 'حدد الأسعار والخصومات والضرائب',
      fields: ['daily_rate', 'discount_amount', 'tax_amount', 'security_deposit', 'insurance_amount'],
      isValid: (data) => !!(data.daily_rate && data.daily_rate > 0),
    },
    {
      id: 'delivery',
      title: 'تفاصيل التسليم',
      description: 'معلومات التسليم والاستلام',
      fields: ['pickup_location', 'return_location', 'fuel_level_pickup', 'pickup_mileage'],
      isValid: () => true, // اختيارية
    },
    {
      id: 'terms',
      title: 'الشروط والملاحظات',
      description: 'أضف أي شروط خاصة أو ملاحظات',
      fields: ['special_conditions', 'terms_and_conditions', 'notes'],
      isValid: () => true, // اختيارية
    },
  ];

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
  const currentStepData = steps[currentStep];
  const isStepValid = currentStepData.isValid(watchedValues);
  const progress = ((currentStep + 1) / steps.length) * 100;

  // التنقل بين الخطوات
  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      // التحقق من صحة الخطوة الحالية
      const fieldsToValidate = currentStepData.fields;
      const isValid = await form.trigger(fieldsToValidate as any);
      
      if (isValid) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // إرسال النموذج
  const onSubmit = async (data: ContractFormData) => {
    setIsLoading(true);
    try {
      // إنشاء العقد
      // نفس منطق ContractForm
      const contractNumber = await generateContractNumber();
      
      // حساب المبالغ
      const diffTime = Math.abs(data.end_date.getTime() - data.start_date.getTime());
      const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      const totalAmount = rentalDays * data.daily_rate;
      const finalAmount = totalAmount - (data.discount_amount || 0) + (data.tax_amount || 0);

      const contractData = {
        contract_number: contractNumber,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        quotation_id: data.quotation_id || null,
        start_date: data.start_date.toISOString().split('T')[0],
        end_date: data.end_date.toISOString().split('T')[0],
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
      };

      const { error } = await supabase
        .from('contracts')
        .insert(contractData);

      if (error) throw error;

      toast({
        title: 'تم إنشاء العقد بنجاح',
        description: `رقم العقد: ${contractNumber}`,
      });

      form.reset();
      setCurrentStep(0);
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

  // محتوى المساعدة لكل خطوة
  const getHelpContent = (stepId: string) => {
    const helpContent = {
      basic: {
        title: 'المعلومات الأساسية',
        content: `
          • اختر العميل من القائمة المتاحة
          • حدد المركبة المتاحة للإيجار
          • يمكنك اختيار عرض سعر موجود لملء البيانات تلقائياً
        `
      },
      dates: {
        title: 'التواريخ والفترة',
        content: `
          • حدد تاريخ بداية الإيجار
          • حدد تاريخ نهاية الإيجار
          • اختر نوع العقد (يومي، أسبوعي، شهري، أو مخصص)
        `
      },
      pricing: {
        title: 'التسعير والمبالغ',
        content: `
          • السعر اليومي سيتم ملؤه تلقائياً من بيانات المركبة
          • يمكنك إضافة خصم أو تعديل المبلغ
          • حدد مبلغ الضريبة إن وجدت
          • أضف مبلغ التأمين والضمان حسب الحاجة
        `
      },
      delivery: {
        title: 'تفاصيل التسليم',
        content: `
          • حدد مكان التسليم والاستلام
          • سجل قراءة العداد الحالية
          • حدد مستوى الوقود عند التسليم
        `
      },
      terms: {
        title: 'الشروط والملاحظات',
        content: `
          • أضف أي شروط خاصة للعقد
          • راجع الشروط والأحكام العامة
          • أضف أي ملاحظات إضافية
        `
      }
    };

    return helpContent[stepId as keyof typeof helpContent];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-right">
            <span>إنشاء عقد جديد - {currentStepData.title}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(showHelp === currentStepData.id ? null : currentStepData.id)}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* مؤشر التقدم */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>الخطوة {currentStep + 1} من {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* خطوات التنقل */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-colors",
                    index < currentStep && "bg-green-500 border-green-500 text-white",
                    index === currentStep && "bg-primary border-primary text-white",
                    index > currentStep && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className="text-xs mt-1 text-center">{step.title}</span>
              </div>
            ))}
          </div>

          {/* وصف الخطوة الحالية */}
          <div className="bg-muted/20 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            {!isStepValid && (
              <div className="flex items-center gap-2 mt-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">يرجى ملء الحقول المطلوبة</span>
              </div>
            )}
          </div>

          {/* محتوى المساعدة */}
          {showHelp === currentStepData.id && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                {getHelpContent(currentStepData.id)?.title}
              </h4>
              <div className="text-sm text-blue-800 whitespace-pre-line">
                {getHelpContent(currentStepData.id)?.content}
              </div>
            </div>
          )}
        </div>

        {/* محتوى الخطوة */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="min-h-[400px]">
            {/* سيتم تعبئة محتوى كل خطوة هنا */}
            <div className="text-center text-muted-foreground py-20">
              محتوى الخطوة {currentStep + 1} سيتم إضافته هنا
            </div>
          </div>

          {/* أزرار التنقل */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronRight className="w-4 h-4 ml-2" />
              السابق
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  disabled={isLoading || !isStepValid}
                  className="min-w-[120px]"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'إنشاء العقد'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid}
                  className="min-w-[120px]"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  التالي
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};