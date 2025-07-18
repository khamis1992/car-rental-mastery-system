import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Building, Star } from "lucide-react";
import { useState } from "react";
import { SubscriptionModal } from "./SubscriptionModal";
import { useSubscriptionPlans } from "@/hooks/useSaasData";
import { formatPrice } from "@/types/subscription-plans";

// Map icons to plan codes
const planIcons = {
  basic: Zap,
  standard: Crown,
  premium: Star,
  enterprise: Building,
} as const;

export function Pricing() {
  const { data: subscriptionPlans, isLoading } = useSubscriptionPlans();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to get default descriptions
  function getDefaultDescription(code: string) {
    const descriptions = {
      basic: 'مثالية للشركات الناشئة',
      standard: 'الأكثر شعبية للشركات المتوسطة', 
      premium: 'للشركات الكبيرة مع ميزات متقدمة',
      enterprise: 'للمؤسسات الكبيرة والحكومية'
    };
    return descriptions[code as keyof typeof descriptions] || '';
  }

  // Helper function to get default features
  function getDefaultFeatures(code: string, plan: any) {
    const baseFeatures = [
      `إدارة حتى ${plan.max_vehicles || 'غير محدود'} مركبة`,
      `حتى ${plan.max_users_per_tenant || 'غير محدود'} مستخدم`,
      `حتى ${plan.max_contracts || 'غير محدود'} عقد`,
      'نظام إدارة العقود',
      'تقارير مفصلة',
      'دعم فني'
    ];

    const advancedFeatures = {
      basic: ['تطبيق الموبايل'],
      standard: ['تطبيق موبايل متطور', 'نظام GPS للتتبع', 'إدارة الصيانة'],
      premium: ['تحليلات متقدمة', 'API للتكامل', 'دعم أولوي', 'تخصيص التقارير'],
      enterprise: ['تخصيص كامل', 'دعم مخصص 24/7', 'تدريب شامل', 'خوادم مخصصة']
    };

    return [...baseFeatures, ...(advancedFeatures[code as keyof typeof advancedFeatures] || [])];
  }

  // Transform database plans to display format
  const plans = subscriptionPlans?.map(plan => {
    const IconComponent = planIcons[plan.plan_code as keyof typeof planIcons] || Building;
    
    return {
      name: plan.plan_name,
      code: plan.plan_code,
      icon: IconComponent,
      price: plan.plan_code === 'enterprise' ? 'مخصص' : formatPrice(plan.price_monthly).replace(' د.ك.', ''),
      period: plan.plan_code === 'enterprise' ? 'حسب الاحتياج' : 'شهرياً',
      description: plan.description || getDefaultDescription(plan.plan_code),
      features: plan.features || getDefaultFeatures(plan.plan_code, plan),
      popular: plan.is_popular,
      buttonText: plan.plan_code === 'enterprise' ? 'تواصل معنا' : 'اشترك',
      originalPlan: plan
    };
  }) || [];

  const handleSubscribe = (plan: any) => {
    if (plan.code === 'enterprise') {
      window.location.href = "mailto:sales@saptcogulf.com?subject=استفسار عن الباقة المؤسسية";
      return;
    }
    
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <section id="pricing" className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              خطط أسعار شفافة
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              جاري تحميل خطط الأسعار...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            خطط أسعار شفافة
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            اختر الباقة التي تناسب حجم عملك. جميع الباقات تشمل فترة تجريبية مجانية لمدة ١٤ يوم
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative p-8 rounded-2xl border transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 ${
                plan.popular 
                  ? 'border-primary bg-card shadow-lg scale-105' 
                  : 'border-border bg-card'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 right-8 bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold">
                  الأكثر اختياراً
                </div>
              )}

              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <plan.icon className="w-8 h-8" />
              </div>

              {/* Plan Details */}
              <h3 className="text-2xl font-bold mb-2 text-card-foreground">
                {plan.name}
              </h3>
              
              <p className="text-muted-foreground mb-6">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-card-foreground">
                    {plan.price}
                  </span>
                  {plan.price !== "مخصص" && (
                    <span className="text-muted-foreground">د.ك</span>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {plan.period}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature: string, featureIndex: number) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-card-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'bg-primary hover:bg-primary/90' 
                    : 'variant-outline'
                }`}
                size="lg"
                onClick={() => handleSubscribe(plan)}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            جميع الباقات تشمل:
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              تحديثات مجانية
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              نسخ احتياطية يومية
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              أمان SSL
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              دعم اللغة العربية
            </span>
          </div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedPlan={selectedPlan}
      />
    </section>
  );
}