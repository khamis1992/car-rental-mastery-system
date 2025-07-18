import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SmartInput } from '@/components/ui/smart-input';
import { PlanRecommendation } from '@/components/ui/plan-recommendation';
import { 
  Building2, 
  User, 
  CreditCard, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Home,
  Eye,
  EyeOff,
  Star,
  Zap,
  Crown,
  Building,
  Loader2,
  Save,
  RotateCcw,
  Lightbulb,
  Target,
  Phone,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TenantService } from '@/services/tenantService';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/types/subscription-plans';
import type { SubscriptionPlanCode } from '@/types/subscription-plans';
import { analyzePasswordStrength } from '@/utils/smartSuggestions';
import { EnhancedLoading, useEnhancedLoading } from '@/components/ui/enhanced-loading';
import { HelpSystem } from '@/components/ui/help-system';

// تحويل خطط SaaS إلى تنسيق التسجيل
const plans = [
  {
    id: 'basic',
    name: SUBSCRIPTION_PLANS.basic.name,
    name_en: SUBSCRIPTION_PLANS.basic.name_en,
    icon: Zap,
    price: SUBSCRIPTION_PLANS.basic.price_monthly,
    period: "شهرياً",
    description: "مثالية للشركات الناشئة والصغيرة",
    features: SUBSCRIPTION_PLANS.basic.features,
    popular: false,
    limits: {
      users: SUBSCRIPTION_PLANS.basic.limits.max_users_per_tenant,
      vehicles: SUBSCRIPTION_PLANS.basic.limits.max_vehicles,
      contracts: SUBSCRIPTION_PLANS.basic.limits.max_contracts
    }
  },
  {
    id: 'standard',
    name: SUBSCRIPTION_PLANS.standard.name,
    name_en: SUBSCRIPTION_PLANS.standard.name_en,
    icon: Crown,
    price: SUBSCRIPTION_PLANS.standard.price_monthly,
    period: "شهرياً",
    description: "الأكثر شعبية للشركات المتوسطة",
    features: SUBSCRIPTION_PLANS.standard.features,
    popular: true,
    limits: {
      users: SUBSCRIPTION_PLANS.standard.limits.max_users_per_tenant,
      vehicles: SUBSCRIPTION_PLANS.standard.limits.max_vehicles,
      contracts: SUBSCRIPTION_PLANS.standard.limits.max_contracts
    }
  },
  {
    id: 'premium',
    name: SUBSCRIPTION_PLANS.premium.name,
    name_en: SUBSCRIPTION_PLANS.premium.name_en,
    icon: Star,
    price: SUBSCRIPTION_PLANS.premium.price_monthly,
    period: "شهرياً",
    description: "للشركات الكبيرة والمتقدمة",
    features: SUBSCRIPTION_PLANS.premium.features,
    popular: false,
    limits: {
      users: SUBSCRIPTION_PLANS.premium.limits.max_users_per_tenant,
      vehicles: SUBSCRIPTION_PLANS.premium.limits.max_vehicles,
      contracts: SUBSCRIPTION_PLANS.premium.limits.max_contracts
    }
  },
  {
    id: 'enterprise',
    name: SUBSCRIPTION_PLANS.enterprise.name,
    name_en: SUBSCRIPTION_PLANS.enterprise.name_en,
    icon: Building,
    price: SUBSCRIPTION_PLANS.enterprise.price_monthly,
    period: "شهرياً",
    description: "للمؤسسات الكبيرة والحكومية",
    features: SUBSCRIPTION_PLANS.enterprise.features,
    popular: false,
    limits: {
      users: SUBSCRIPTION_PLANS.enterprise.limits.max_users_per_tenant,
      vehicles: SUBSCRIPTION_PLANS.enterprise.limits.max_vehicles,
      contracts: SUBSCRIPTION_PLANS.enterprise.limits.max_contracts
    }
  }
];

interface FormData {
  // بيانات الشركة
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  // بيانات المدير
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  // الخطة
  selectedPlan: string;
}

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const tenantService = new TenantService();
  
  // نظام التحميل المحسن
  const {
    isLoading: isEnhancedLoading,
    showLoading,
    hideLoading,
    updateProgress,
    LoadingComponent
  } = useEnhancedLoading();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);
  const [hasUsedRecommendation, setHasUsedRecommendation] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    selectedPlan: searchParams.get('plan') || 'standard'
  });

  // مفتاح التخزين المحلي
  const STORAGE_KEY = 'register_progress';

  // تحميل البيانات المحفوظة عند بدء التشغيل
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.formData && parsed.step) {
          setFormData(prev => ({ ...prev, ...parsed.formData }));
          setCurrentStep(parsed.step);
          setLastSaved(new Date(parsed.timestamp));
          
          toast({
            title: "تم استرداد البيانات المحفوظة",
            description: "تم العثور على بيانات محفوظة مسبقاً وتم استردادها",
          });
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, [toast]);

  // حفظ التقدم تلقائياً
  useEffect(() => {
    // لا نحفظ إذا كانت البيانات فارغة تماماً
    const hasData = Object.values(formData).some(value => value.trim() !== '');
    
    if (hasData) {
      setIsAutoSaving(true);
      
      const saveTimeout = setTimeout(() => {
        const dataToSave = {
          formData: {
            ...formData,
            adminPassword: '', // لا نحفظ كلمة المرور لأسباب الأمان
            confirmPassword: ''
          },
          step: currentStep,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        setLastSaved(new Date());
        setIsAutoSaving(false);
      }, 2000); // حفظ بعد ثانيتين من آخر تغيير

      return () => {
        clearTimeout(saveTimeout);
        setIsAutoSaving(false);
      };
    }
  }, [formData, currentStep]);

  // مسح البيانات المحفوظة
  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setLastSaved(null);
    toast({
      title: "تم مسح البيانات المحفوظة",
      description: "تم حذف جميع البيانات المحفوظة مسبقاً",
    });
  };

  // الحصول على الخطة المختارة
  const selectedPlan = plans.find(p => p.id === formData.selectedPlan) || plans[1];

  // تحديث البيانات مع التحقق الفوري
  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // مسح رسالة الخطأ عند التحديث
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // التحقق من البيانات مع رسائل محسنة
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // التحقق من الخطة
      if (!formData.selectedPlan) {
        newErrors.selectedPlan = 'يرجى اختيار خطة الاشتراك المناسبة لحجم عملك';
      }
    }

    if (step === 2) {
      // التحقق من بيانات الشركة مع رسائل واضحة
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'اسم الشركة مطلوب - سيظهر في جميع الفواتير والعقود';
      } else if (formData.companyName.trim().length < 2) {
        newErrors.companyName = 'اسم الشركة يجب أن يكون حرفين على الأقل';
      }

      if (!formData.contactEmail.trim()) {
        newErrors.contactEmail = 'البريد الإلكتروني للشركة مطلوب للتواصل والإشعارات';
      } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
        newErrors.contactEmail = 'يرجى إدخال بريد إلكتروني صحيح (مثال: info@company.com)';
      }

      // تحقق اختياري من رقم الهاتف
      if (formData.contactPhone && !/^[\+]?[0-9\-\s\(\)]+$/.test(formData.contactPhone)) {
        newErrors.contactPhone = 'رقم الهاتف غير صحيح (مثال: +965 1234 5678)';
      }
    }

    if (step === 3) {
      // التحقق من بيانات المدير مع رسائل واضحة
      if (!formData.adminName.trim()) {
        newErrors.adminName = 'اسم المدير مطلوب - سيكون اسم الحساب الرئيسي';
      } else if (formData.adminName.trim().length < 2) {
        newErrors.adminName = 'اسم المدير يجب أن يكون حرفين على الأقل';
      }

      if (!formData.adminEmail.trim()) {
        newErrors.adminEmail = 'البريد الإلكتروني للمدير مطلوب للدخول للنظام';
      } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
        newErrors.adminEmail = 'يرجى إدخال بريد إلكتروني صحيح (سيستخدم لتسجيل الدخول)';
      } else if (formData.adminEmail === formData.contactEmail) {
        newErrors.adminEmail = 'يُفضل أن يكون بريد المدير مختلف عن بريد الشركة';
      }

      if (!formData.adminPassword) {
        newErrors.adminPassword = 'كلمة المرور مطلوبة لحماية حساب المدير';
      } else if (formData.adminPassword.length < 8) {
        newErrors.adminPassword = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل لضمان الأمان';
      } else if (!/(?=.*[a-z])/.test(formData.adminPassword)) {
        newErrors.adminPassword = 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل';
      } else if (!/(?=.*[A-Z])/.test(formData.adminPassword)) {
        newErrors.adminPassword = 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل';
      } else if (!/(?=.*\d)/.test(formData.adminPassword)) {
        newErrors.adminPassword = 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'يرجى تأكيد كلمة المرور';
      } else if (formData.adminPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'كلمة المرور وتأكيدها غير متطابقتين';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // تحقق فوري من البيانات أثناء الكتابة
  const validateField = (field: keyof FormData, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'companyName':
        if (!value.trim()) {
          newErrors.companyName = 'اسم الشركة مطلوب';
        } else if (value.trim().length < 2) {
          newErrors.companyName = 'اسم الشركة يجب أن يكون حرفين على الأقل';
        } else {
          delete newErrors.companyName;
        }
        break;

      case 'contactEmail':
        if (!value.trim()) {
          newErrors.contactEmail = 'البريد الإلكتروني مطلوب';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.contactEmail = 'البريد الإلكتروني غير صحيح';
        } else {
          delete newErrors.contactEmail;
        }
        break;

      case 'adminEmail':
        if (!value.trim()) {
          newErrors.adminEmail = 'البريد الإلكتروني مطلوب';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.adminEmail = 'البريد الإلكتروني غير صحيح';
        } else if (value === formData.contactEmail) {
          newErrors.adminEmail = 'يُفضل أن يكون بريد المدير مختلف عن بريد الشركة';
        } else {
          delete newErrors.adminEmail;
        }
        break;

      case 'adminPassword':
        if (!value) {
          newErrors.adminPassword = 'كلمة المرور مطلوبة';
        } else if (value.length < 8) {
          newErrors.adminPassword = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          newErrors.adminPassword = 'كلمة المرور يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام';
        } else {
          delete newErrors.adminPassword;
        }
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
        } else if (value !== formData.adminPassword) {
          newErrors.confirmPassword = 'كلمة المرور وتأكيدها غير متطابقتين';
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  // الانتقال للخطوة التالية
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  // العودة للخطوة السابقة
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // إرسال النموذج مع نظام تحميل محسن
  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast({
        title: "يرجى تصحيح الأخطاء",
        description: "تحقق من البيانات المطلوبة قبل المتابعة",
        variant: "destructive"
      });
      return;
    }

    // بدء التحميل المحسن
    showLoading({
      type: 'submit',
      title: 'جاري إنشاء حسابك...',
      description: 'يرجى الانتظار بينما نقوم بإعداد شركتك',
      progress: 0
    });

    try {
      const subscriptionPlan = formData.selectedPlan as SubscriptionPlanCode;

      // خطوة 1: التحقق من البيانات
      updateProgress(20);
      await new Promise(resolve => setTimeout(resolve, 800)); // محاكاة التحقق

      // إنشاء slug من اسم الشركة مع تنظيف أفضل
      const slug = formData.companyName
        .toLowerCase()
        .trim()
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '') // إزالة الرموز الخاصة
        .replace(/\s+/g, '-') // استبدال المسافات بشرطات
        .replace(/-+/g, '-') // إزالة الشرطات المتتالية
        .substring(0, 50);

      // التحقق من صحة الـ slug
      if (slug.length < 2) {
        hideLoading();
        toast({
          title: "خطأ في اسم الشركة",
          description: "اسم الشركة يجب أن يحتوي على أحرف صالحة للرابط",
          variant: "destructive"
        });
        return;
      }

      // خطوة 2: إعداد البيانات
      updateProgress(40);
      await new Promise(resolve => setTimeout(resolve, 500));

      // إنشاء المؤسسة
      const tenantData = {
        name: formData.companyName.trim(),
        slug: slug,
        contact_email: formData.contactEmail.trim().toLowerCase(),
        contact_phone: formData.contactPhone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: 'KW',
        timezone: 'Asia/Kuwait',
        currency: 'KWD',
        subscription_plan: subscriptionPlan,
        admin_user: {
          email: formData.adminEmail.trim().toLowerCase(),
          password: formData.adminPassword,
          full_name: formData.adminName.trim()
        }
      };

      // خطوة 3: إنشاء الحساب
      updateProgress(60);
      console.log('Creating tenant with data:', { ...tenantData, admin_user: { ...tenantData.admin_user, password: '[HIDDEN]' } });
      
      const newTenant = await tenantService.createTenant(tenantData);
      
      // خطوة 4: إعداد البيئة
      updateProgress(80);
      await new Promise(resolve => setTimeout(resolve, 800));

      // خطوة 5: الإنهاء
      updateProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      hideLoading();
      
      toast({
        title: "تم إنشاء الشركة بنجاح! 🎉",
        description: "سيتم توجيهك إلى بوابة SADAD لإتمام الدفع",
      });

      // مسح البيانات المحفوظة بعد النجاح
      localStorage.removeItem(STORAGE_KEY);

      // الانتقال لخطوة النجاح
      setCurrentStep(4);

      // توجيه لصفحة الدفع بعد ثانيتين
      setTimeout(() => {
        window.location.href = `/sadad-simulation?amount=${selectedPlan.price * 100}&tenant_id=${newTenant.id}&plan=${encodeURIComponent(selectedPlan.name)}`;
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      hideLoading();
      
      let errorMessage = "حدث خطأ غير متوقع";
      let errorDescription = "يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني";

      // معالجة أخطاء محددة
      if (error.message?.includes('slug')) {
        errorMessage = "رمز الشركة مستخدم بالفعل";
        errorDescription = "يرجى تجربة اسم شركة مختلف قليلاً";
      } else if (error.message?.includes('email')) {
        errorMessage = "البريد الإلكتروني مستخدم بالفعل";
        errorDescription = "يرجى استخدام بريد إلكتروني مختلف للمدير";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "خطأ في الاتصال";
        errorDescription = "يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى";
      } else if (error.message?.includes('validation')) {
        errorMessage = "خطأ في البيانات المدخلة";
        errorDescription = "يرجى التحقق من صحة جميع البيانات";
      }

      toast({
        title: errorMessage,
        description: errorDescription,
        variant: "destructive"
      });
    }
  };

  // معالجة نظام التوصية الذكي
  const handleRecommendation = (planId: string) => {
    setRecommendedPlan(planId);
    updateFormData('selectedPlan', planId);
    setShowRecommendation(false);
    setHasUsedRecommendation(true);
    
    toast({
      title: "تم العثور على الخطة المثالية! 🎯",
      description: `بناءً على احتياجاتك، ننصح بخطة ${plans.find(p => p.id === planId)?.name}`,
    });
  };

  const handleSkipRecommendation = () => {
    setShowRecommendation(false);
  };

  // خطوة اختيار الخطة مع النظام الذكي
  const PlanStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">اختر خطة الاشتراك</h2>
        <p className="text-muted-foreground">اختر الخطة التي تناسب حجم عملك</p>
      </div>

      {/* النظام الذكي للتوصية */}
      {!hasUsedRecommendation && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">احصل على توصية ذكية</h4>
                <p className="text-sm text-blue-700">أجب على 4 أسئلة سريعة وسنختار لك الخطة المثالية</p>
              </div>
            </div>
            <Button
              onClick={() => setShowRecommendation(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              ابدأ التوصية
            </Button>
          </div>
        </div>
      )}

      {/* عرض الخطة الموصى بها */}
      {recommendedPlan && hasUsedRecommendation && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900">الخطة الموصى بها لك</h4>
              <p className="text-sm text-green-700">
                بناءً على إجاباتك، ننصح بخطة <strong>{plans.find(p => p.id === recommendedPlan)?.name}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* تذكير بالتجربة المجانية */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 text-green-700">
          <span className="text-2xl">🎉</span>
          <span className="font-semibold">تجربة مجانية كاملة ١٤ يوم</span>
          <span className="text-2xl">🎉</span>
        </div>
        <p className="text-sm text-green-600 mt-1 text-center">
          بدون الحاجة لبطاقة ائتمان • إلغاء مجاني في أي وقت
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative p-4 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg min-h-[200px] sm:min-h-[180px] ${
              formData.selectedPlan === plan.id
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50'
            } ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}
            onClick={() => updateFormData('selectedPlan', plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                الأكثر اختياراً
              </div>
            )}

            <div className="text-center h-full flex flex-col justify-between">
              <div>
                <plan.icon className="w-8 h-8 sm:w-8 sm:h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-bold text-base sm:text-lg mb-1">{plan.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-xl sm:text-2xl font-bold">{formatPrice(plan.price)}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground mr-1">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs sm:text-xs">
                <div className="flex items-center justify-between py-1">
                  <span>المستخدمين:</span>
                  <span className="font-medium">{plan.limits.users}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>المركبات:</span>
                  <span className="font-medium">{plan.limits.vehicles}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>العقود:</span>
                  <span className="font-medium">{plan.limits.contracts}</span>
                </div>
              </div>
            </div>

            {/* مؤشر التحديد */}
            {formData.selectedPlan === plan.id && (
              <div className="absolute top-2 left-2">
                <CheckCircle className="w-6 h-6 text-primary bg-white rounded-full" />
              </div>
            )}
          </div>
        ))}
      </div>

      {errors.selectedPlan && (
        <Alert variant="destructive">
          <AlertDescription>{errors.selectedPlan}</AlertDescription>
        </Alert>
      )}

      {/* مقارنة سريعة محسنة للموبايل */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mt-8">
        <h3 className="text-base sm:text-lg font-semibold mb-4 text-center">مقارنة سريعة بين الخطط</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[600px] px-4 sm:px-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 font-semibold">المميزة</th>
                  <th className="text-center py-3 font-semibold">أساسي</th>
                  <th className="text-center py-3 bg-primary/10 font-bold">معياري ⭐</th>
                  <th className="text-center py-3 font-semibold">متقدم</th>
                  <th className="text-center py-3 font-semibold">مؤسسي</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 font-medium">السعر الشهري</td>
                  <td className="text-center py-3">{formatPrice(plans[0].price)}</td>
                  <td className="text-center py-3 bg-primary/5 font-bold">{formatPrice(plans[1].price)}</td>
                  <td className="text-center py-3">{formatPrice(plans[2].price)}</td>
                  <td className="text-center py-3">{formatPrice(plans[3].price)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium">عدد المستخدمين</td>
                  <td className="text-center py-3">{plans[0].limits.users}</td>
                  <td className="text-center py-3 bg-primary/5 font-bold">{plans[1].limits.users}</td>
                  <td className="text-center py-3">{plans[2].limits.users}</td>
                  <td className="text-center py-3">{plans[3].limits.users}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 font-medium">عدد المركبات</td>
                  <td className="text-center py-3">{plans[0].limits.vehicles}</td>
                  <td className="text-center py-3 bg-primary/5 font-bold">{plans[1].limits.vehicles}</td>
                  <td className="text-center py-3">{plans[2].limits.vehicles}</td>
                  <td className="text-center py-3">{plans[3].limits.vehicles}</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">عدد العقود</td>
                  <td className="text-center py-3">{plans[0].limits.contracts}</td>
                  <td className="text-center py-3 bg-primary/5 font-bold">{plans[1].limits.contracts}</td>
                  <td className="text-center py-3">{plans[2].limits.contracts}</td>
                  <td className="text-center py-3">{plans[3].limits.contracts}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          💡 يمكنك ترقية أو تقليل خطتك في أي وقت من لوحة التحكم
        </p>
        <p className="text-center text-xs text-muted-foreground mt-1 sm:hidden">
          👈 اسحب الجدول للمشاهدة الكاملة
        </p>
      </div>
    </div>
  );

  // خطوة بيانات الشركة مع الاقتراحات الذكية
  const CompanyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">معلومات الشركة</h2>
        <p className="text-muted-foreground">أدخل البيانات الأساسية لشركتك</p>
      </div>

      {/* معاينة الخطة */}
      <PlanPreview />

      <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          💡 <strong>نصيحة:</strong> تأكد من دقة بيانات الشركة حيث ستظهر في جميع الفواتير والعقود.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <SmartInput
          label="اسم الشركة"
          field="companyName"
          placeholder="مثال: شركة النقل المتقدمة"
          description="سيظهر في جميع الفواتير والعقود"
          value={formData.companyName}
          onChange={(value) => updateFormData('companyName', value)}
          formData={formData}
          error={errors.companyName}
          required={true}
          showSuggestions={true}
        />

        <SmartInput
          label="البريد الإلكتروني للشركة"
          field="contactEmail"
          type="email"
          placeholder="info@company.com"
          description="للتواصل الرسمي والإشعارات"
          value={formData.contactEmail}
          onChange={(value) => updateFormData('contactEmail', value)}
          formData={formData}
          error={errors.contactEmail}
          required={true}
          showSuggestions={true}
        />

        <SmartInput
          label="رقم الهاتف"
          field="contactPhone"
          placeholder="+965 XXXX XXXX"
          description="رقم التواصل الرسمي (اختياري)"
          value={formData.contactPhone}
          onChange={(value) => updateFormData('contactPhone', value)}
          formData={formData}
          error={errors.contactPhone}
          showSuggestions={true}
        />

        <SmartInput
          label="المدينة"
          field="city"
          placeholder="الكويت"
          description="المدينة الرئيسية للشركة (اختياري)"
          value={formData.city}
          onChange={(value) => updateFormData('city', value)}
          formData={formData}
          error={errors.city}
          showSuggestions={true}
        />

        <div className="md:col-span-2">
          <SmartInput
            label="العنوان"
            field="address"
            placeholder="الشارع، المنطقة، المحافظة"
            description="العنوان الكامل للشركة (اختياري)"
            value={formData.address}
            onChange={(value) => updateFormData('address', value)}
            formData={formData}
            error={errors.address}
            showSuggestions={false}
          />
        </div>
      </div>
    </div>
  );

  // خطوة بيانات المدير مع الاقتراحات الذكية
  const AdminStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">معلومات المدير</h2>
        <p className="text-muted-foreground">إنشاء حساب المدير الرئيسي</p>
      </div>

      {/* معاينة الخطة */}
      <PlanPreview />

      <div className="bg-amber-50 border-r-4 border-amber-500 p-4 rounded">
        <p className="text-sm text-amber-800">
          🔐 <strong>أمان:</strong> سيتم إنشاء حساب المدير الرئيسي بصلاحيات كاملة للنظام.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <SmartInput
          label="اسم المدير"
          field="adminName"
          placeholder="الاسم الكامل للمدير"
          description="اسم المدير الرئيسي للنظام"
          value={formData.adminName}
          onChange={(value) => updateFormData('adminName', value)}
          formData={formData}
          error={errors.adminName}
          required={true}
          showSuggestions={false}
        />

        <SmartInput
          label="البريد الإلكتروني للمدير"
          field="adminEmail"
          type="email"
          placeholder="admin@company.com"
          description="سيستخدم هذا للدخول للنظام"
          value={formData.adminEmail}
          onChange={(value) => updateFormData('adminEmail', value)}
          formData={formData}
          error={errors.adminEmail}
          required={true}
          showSuggestions={true}
        />

        <SmartInput
          label="كلمة المرور"
          field="adminPassword"
          placeholder="8 أحرف على الأقل"
          description="استخدم كلمة مرور قوية لحماية حسابك"
          value={formData.adminPassword}
          onChange={(value) => updateFormData('adminPassword', value)}
          formData={formData}
          error={errors.adminPassword}
          required={true}
          isPassword={true}
          showSuggestions={false}
        />

        <SmartInput
          label="تأكيد كلمة المرور"
          field="confirmPassword"
          placeholder="أعد كتابة كلمة المرور"
          description="تأكد من تطابق كلمة المرور"
          value={formData.confirmPassword}
          onChange={(value) => updateFormData('confirmPassword', value)}
          formData={formData}
          error={errors.confirmPassword}
          required={true}
          isPassword={true}
          showSuggestions={false}
        />
      </div>

      {/* نصائح كلمة المرور الذكية */}
      {formData.adminPassword && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            نصائح ذكية لكلمة مرور قوية
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-green-700">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              استخدم مزيج من الأحرف والأرقام
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              أضف رموز خاصة (!@#$)
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              تجنب المعلومات الشخصية
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              استخدم 12 حرف أو أكثر
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // خطوة التأكيد والإنهاء المحسنة
  const ConfirmationStep = () => (
    <div className="space-y-6 text-center">
      {isLoading ? (
        <div className="py-12">
          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
          <h2 className="text-2xl font-bold mb-2">جاري إنشاء حسابك...</h2>
          <p className="text-muted-foreground">يرجى الانتظار بينما نقوم بإعداد شركتك</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
            <div className="absolute -top-2 -right-2 animate-bounce">
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2 text-green-700">مبروك! تم إنشاء حسابك بنجاح! 🎉</h2>
          <p className="text-muted-foreground mb-6">
            تم إنشاء شركة "{formData.companyName}" بنجاح.<br />
            سيتم توجيهك إلى بوابة SADAD لإتمام عملية الدفع.
          </p>

          {/* ملخص الطلب */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 text-right mb-6">
            <h3 className="font-bold text-lg mb-4 text-green-800 flex items-center justify-center gap-2">
              <Building2 className="w-5 h-5" />
              ملخص طلبك
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">الشركة:</span>
                  <span>{formData.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">الخطة:</span>
                  <span className="flex items-center gap-1">
                    <selectedPlan.icon className="w-4 h-4" />
                    {selectedPlan.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">المدير:</span>
                  <span>{formData.adminName}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">البريد الإلكتروني:</span>
                  <span className="text-xs">{formData.adminEmail}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>التكلفة الشهرية:</span>
                  <span className="text-primary">{formatPrice(selectedPlan.price)}</span>
                </div>
                <div className="text-xs text-green-600 flex items-center justify-end gap-1">
                  <CheckCircle className="w-3 h-3" />
                  تجربة مجانية ١٤ يوماً
                </div>
              </div>
            </div>
          </div>

          {/* الخطوات التالية */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-right">
            <h3 className="font-bold text-lg mb-4 text-blue-800 flex items-center justify-center gap-2">
              <Target className="w-5 h-5" />
              ما هي الخطوات التالية؟
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <span className="font-medium">إتمام الدفع عبر SADAD</span>
                  <p className="text-blue-600 text-xs mt-1">ستنتقل تلقائياً لبوابة الدفع الآمنة</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <span className="font-medium">تلقي بيانات الدخول</span>
                  <p className="text-blue-600 text-xs mt-1">ستصلك رسالة تأكيد على {formData.adminEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <span className="font-medium">البدء في إعداد نظامك</span>
                  <p className="text-blue-600 text-xs mt-1">إضافة المركبات والموظفين وبدء العمل</p>
                </div>
              </div>
            </div>
          </div>

          {/* معلومات مفيدة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <Phone className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-semibold text-purple-800 mb-1">الدعم الفني</h4>
              <p className="text-xs text-purple-600">+965 1234 5678</p>
              <p className="text-xs text-purple-600">متاح 8ص - 6م</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <Mail className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <h4 className="font-semibold text-orange-800 mb-1">البريد الإلكتروني</h4>
              <p className="text-xs text-orange-600">support@fleetify.com</p>
              <p className="text-xs text-orange-600">رد خلال ساعة</p>
            </div>
          </div>

          {/* شريط العد التنازلي */}
          <div className="bg-gray-100 rounded-lg p-4 mt-6">
            <p className="text-sm text-gray-600">
              سيتم التوجه لصفحة الدفع خلال <span className="font-bold text-primary">3 ثوان</span>...
            </p>
            <Progress value={100} className="h-2 mt-2" />
          </div>
        </>
      )}
    </div>
  );

  // تقييم قوة كلمة المرور
  const passwordStrength = analyzePasswordStrength(formData.adminPassword);

  // مكون معاينة الخطة المختارة محسن للموبايل
  const PlanPreview = () => (
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-3 sm:p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <selectedPlan.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-primary text-sm sm:text-base truncate">الخطة المختارة: {selectedPlan.name}</h4>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{selectedPlan.description}</p>
        </div>
        {selectedPlan.popular && (
          <Badge className="bg-primary text-white text-xs flex-shrink-0">الأكثر اختياراً</Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-sm">
        <div className="text-center p-2 bg-white rounded-lg border">
          <div className="font-bold text-primary text-sm sm:text-lg">{formatPrice(selectedPlan.price)}</div>
          <div className="text-xs text-muted-foreground">شهرياً</div>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border">
          <div className="font-bold text-sm sm:text-lg">{selectedPlan.limits.users}</div>
          <div className="text-xs text-muted-foreground">مستخدم</div>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border">
          <div className="font-bold text-sm sm:text-lg">{selectedPlan.limits.vehicles}</div>
          <div className="text-xs text-muted-foreground">مركبة</div>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border">
          <div className="font-bold text-sm sm:text-lg">{selectedPlan.limits.contracts}</div>
          <div className="text-xs text-muted-foreground">عقد</div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3 pt-3 border-t border-primary/10">
        <span className="text-xs text-green-600 text-center">✅ تجربة مجانية ١٤ يوماً</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCurrentStep(1)}
          className="text-xs h-auto py-1 px-2 text-primary hover:bg-primary/10 w-full sm:w-auto"
        >
          تغيير الخطة
        </Button>
      </div>
    </div>
  );

  // مكون حقل الإدخال مع مؤشر الحالة
  const InputWithStatus = ({ 
    label, 
    field, 
    type = 'text', 
    placeholder, 
    description,
    isPassword = false 
  }: {
    label: string;
    field: keyof FormData;
    type?: string;
    placeholder: string;
    description?: string;
    isPassword?: boolean;
  }) => {
    const value = formData[field];
    const error = errors[field];
    const isValid = value && !error;
    const isInvalid = value && error;

    return (
      <div>
        <Label htmlFor={field} className="flex items-center gap-2">
          {label}
          {field.includes('admin') || field.includes('contact') ? <span className="text-red-500">*</span> : null}
          {isValid && <CheckCircle className="w-4 h-4 text-green-500" />}
          {isInvalid && <span className="w-4 h-4 text-red-500">✗</span>}
        </Label>
        
        <div className="relative">
          <Input
            id={field}
            type={isPassword ? (field === 'adminPassword' ? (showPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')) : type}
            value={value}
            onChange={(e) => updateFormData(field, e.target.value)}
            placeholder={placeholder}
            className={`${
              isValid ? 'border-green-500 bg-green-50/50' : 
              isInvalid ? 'border-destructive bg-red-50/50' : ''
            } transition-colors`}
          />
          
          {isPassword && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-auto p-1"
              onClick={() => field === 'adminPassword' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
            >
              {(field === 'adminPassword' ? showPassword : showConfirmPassword) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          )}
        </div>
        
        {description && !error && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        
        {error && (
          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
            <span className="text-red-500">⚠️</span>
            {error}
          </p>
        )}
        
        {isValid && (
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            ممتاز!
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl">
        {/* Header محسن للموبايل مع مؤشر الحفظ */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary text-sm sm:text-base">
              <Home className="w-4 h-4" />
              العودة للرئيسية
            </Link>
            
            {/* مؤشر الحفظ التلقائي */}
            <div className="flex items-center gap-2">
              {isAutoSaving && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Save className="w-3 h-3 animate-pulse" />
                  <span className="hidden sm:inline">حفظ...</span>
                </div>
              )}
              
              {lastSaved && !isAutoSaving && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">محفوظ</span>
                </div>
              )}
              
              {lastSaved && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSavedData}
                  className="text-xs h-auto py-1 px-2 text-muted-foreground hover:text-destructive"
                  title="مسح البيانات المحفوظة"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline mr-1">مسح</span>
                </Button>
              )}
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-bold text-primary mb-2">إنشاء حساب جديد</h1>
          <p className="text-sm sm:text-base text-muted-foreground">ابدأ تجربتك المجانية اليوم مع Fleetify</p>
          
          {lastSaved && (
            <p className="text-xs text-muted-foreground mt-2">
              آخر حفظ: {lastSaved.toLocaleTimeString('ar-KW')}
            </p>
          )}
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-4 sm:p-8">
            <StepProgress />

            {/* محتوى الخطوات مع تحسين الارتفاع للموبايل */}
            <div className="min-h-[400px] sm:min-h-[500px]">
              {currentStep === 1 && <PlanStep />}
              {currentStep === 2 && <CompanyStep />}
              {currentStep === 3 && <AdminStep />}
              {currentStep === 4 && <ConfirmationStep />}
            </div>

            {/* أزرار التحكم محسنة للموبايل */}
            {currentStep < 4 && !isLoading && (
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 sm:pt-8 border-t">
                <div className="order-2 sm:order-1">
                  {currentStep > 1 && (
                    <Button 
                      variant="outline" 
                      onClick={prevStep}
                      className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      السابق
                    </Button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2 sm:mr-auto">
                  <Link to="/auth" className="order-2 sm:order-1">
                    <Button 
                      variant="ghost" 
                      className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
                    >
                      لديك حساب؟ دخول
                    </Button>
                  </Link>

                  {currentStep < 3 ? (
                    <Button 
                      onClick={nextStep}
                      className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm order-1 sm:order-2"
                    >
                      التالي
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isLoading || isEnhancedLoading}
                      className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm order-1 sm:order-2"
                    >
                      {isLoading || isEnhancedLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري الإنشاء...
                        </>
                      ) : (
                        <>
                          إنشاء الحساب والمتابعة
                          <ArrowLeft className="w-4 h-4 mr-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* روابط المساعدة */}
            <div className="text-center text-xs text-muted-foreground border-t pt-4 mt-6">
              <p>
                🔒 جميع بياناتك محمية بتشفير SSL • 
                <a href="mailto:support@fleetify.com" className="text-primary hover:underline mr-1">
                  تحتاج مساعدة؟
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نظام التوصية الذكي */}
      <PlanRecommendation
        isOpen={showRecommendation}
        onRecommendation={handleRecommendation}
        onSkip={handleSkipRecommendation}
      />

      {/* نظام التحميل المحسن */}
      {isEnhancedLoading && <LoadingComponent />}

      {/* نظام المساعدة التفاعلي */}
      <HelpSystem currentStep={currentStep} context="registration" />
    </div>
  );
};

export default Register; 