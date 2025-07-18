
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";
import { TenantService } from "@/services/tenantService";
import { CompanyInfoStep } from "./SubscriptionSteps/CompanyInfoStep";
import { AdminInfoStep } from "./SubscriptionSteps/AdminInfoStep";
import { PlanSelectionStep } from "./SubscriptionSteps/PlanSelectionStep";
import { PaymentStep } from "./SubscriptionSteps/PaymentStep";

interface Plan {
  name: string;
  price: string;
  period: string;
  code?: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: Plan | null;
}

interface FormData {
  // Company Info
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  
  // Admin Info
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

type Step = 'company' | 'admin' | 'plan' | 'payment';

export function EnhancedSubscriptionModal({ isOpen, onClose, selectedPlan }: SubscriptionModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('company');
  const [isLoading, setIsLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: ""
  });
  
  const { toast } = useToast();
  const tenantService = new TenantService();

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 'company':
        if (!formData.companyName.trim()) {
          toast({ title: "خطأ", description: "يرجى إدخال اسم الشركة", variant: "destructive" });
          return false;
        }
        if (!formData.contactEmail.trim() || !formData.contactEmail.includes('@')) {
          toast({ title: "خطأ", description: "يرجى إدخال بريد إلكتروني صحيح للشركة", variant: "destructive" });
          return false;
        }
        return true;
        
      case 'admin':
        if (!formData.adminName.trim()) {
          toast({ title: "خطأ", description: "يرجى إدخال اسم المدير", variant: "destructive" });
          return false;
        }
        if (!formData.adminEmail.trim() || !formData.adminEmail.includes('@')) {
          toast({ title: "خطأ", description: "يرجى إدخال بريد إلكتروني صحيح للمدير", variant: "destructive" });
          return false;
        }
        if (!formData.adminPassword || formData.adminPassword.length < 8) {
          toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 8 أحرف على الأقل", variant: "destructive" });
          return false;
        }
        if (formData.adminPassword !== formData.confirmPassword) {
          toast({ title: "خطأ", description: "كلمة المرور وتأكيدها غير متطابقين", variant: "destructive" });
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      switch (currentStep) {
        case 'company':
          setCurrentStep('admin');
          break;
        case 'admin':
          setCurrentStep('plan');
          break;
        case 'plan':
          handleCreateTenant();
          break;
      }
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'admin':
        setCurrentStep('company');
        break;
      case 'plan':
        setCurrentStep('admin');
        break;
      case 'payment':
        setCurrentStep('plan');
        break;
    }
  };

  const handleCreateTenant = async () => {
    if (!selectedPlan) return;

    setIsLoading(true);
    
    try {
      const slug = formData.companyName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]/g, '')
        .substring(0, 50);

      const subscriptionPlan = (selectedPlan.code || 'basic') as 'basic' | 'standard' | 'premium' | 'enterprise';

      const tenantData = {
        name: formData.companyName,
        slug: slug,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        address: formData.address,
        city: formData.city,
        country: 'KW',
        timezone: 'Asia/Kuwait',
        currency: 'KWD',
        subscription_plan: subscriptionPlan,
        admin_user: {
          email: formData.adminEmail,
          password: formData.adminPassword,
          full_name: formData.adminName
        }
      };

      console.log('Creating tenant with data:', tenantData);
      const response = await tenantService.createTenant(tenantData);
      
      if (response.tenant_id) {
        setTenantId(response.tenant_id);
      }
      setCurrentStep('payment');
      
      toast({
        title: "تم إنشاء الشركة بنجاح!",
        description: "الآن يمكنك إتمام عملية الدفع",
      });
      
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      toast({
        title: "خطأ في إنشاء الشركة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "تم الاشتراك بنجاح!",
      description: "مرحباً بك في منصة إدارة النقل. سيتم توجيهك إلى لوحة التحكم.",
    });
    
    // Redirect to login or dashboard
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
    
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'company':
        return (
          <CompanyInfoStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 'admin':
        return (
          <AdminInfoStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 'plan':
        return (
          <PlanSelectionStep
            selectedPlan={selectedPlan}
          />
        );
      case 'payment':
        return (
          <PaymentStep
            selectedPlan={selectedPlan}
            tenantId={tenantId}
            onSuccess={handlePaymentSuccess}
          />
        );
      default:
        return null;
    }
  };

  const getStepNumber = (step: Step): number => {
    const steps = ['company', 'admin', 'plan', 'payment'];
    return steps.indexOf(step) + 1;
  };

  if (!selectedPlan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold">
            الاشتراك في {selectedPlan.name}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mb-6">
          {['company', 'admin', 'plan', 'payment'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  getStepNumber(currentStep) > index + 1
                    ? 'bg-green-500 text-white'
                    : getStepNumber(currentStep) === index + 1
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`w-8 h-0.5 ${
                    getStepNumber(currentStep) > index + 1
                      ? 'bg-green-500'
                      : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 'payment' && (
          <div className="flex justify-between gap-4 pt-6 border-t">
            <Button
              variant="outline"
              onClick={currentStep === 'company' ? onClose : handleBack}
              disabled={isLoading}
            >
              {currentStep === 'company' ? 'إلغاء' : 'السابق'}
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                currentStep === 'plan' ? 'إنشاء الشركة' : 'التالي'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
