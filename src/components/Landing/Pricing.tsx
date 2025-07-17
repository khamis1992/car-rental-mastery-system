import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Building, Star } from "lucide-react";
import { useState } from "react";
import { SubscriptionModal } from "./SubscriptionModal";
import { SUBSCRIPTION_PLANS, formatPrice } from "@/types/subscription-plans";

// تحويل خطط SaaS إلى تنسيق صفحة Landing
const plans = [
  {
    id: 'basic',
    name: SUBSCRIPTION_PLANS.basic.name,
    name_en: SUBSCRIPTION_PLANS.basic.name_en,
    icon: Zap,
    price: SUBSCRIPTION_PLANS.basic.monthly_price_kwd,
    period: "شهرياً",
    description: "مثالية للشركات الناشئة والصغيرة",
    features: SUBSCRIPTION_PLANS.basic.features,
    popular: false,
    buttonText: "اشترك الآن",
    limits: {
      users: SUBSCRIPTION_PLANS.basic.max_users,
      vehicles: SUBSCRIPTION_PLANS.basic.max_vehicles,
      contracts: SUBSCRIPTION_PLANS.basic.max_contracts
    }
  },
  {
    id: 'standard',
    name: SUBSCRIPTION_PLANS.standard.name,
    name_en: SUBSCRIPTION_PLANS.standard.name_en,
    icon: Crown,
    price: SUBSCRIPTION_PLANS.standard.monthly_price_kwd,
    period: "شهرياً",
    description: "الأكثر شعبية للشركات المتوسطة",
    features: SUBSCRIPTION_PLANS.standard.features,
    popular: true,
    buttonText: "اشترك الآن",
    limits: {
      users: SUBSCRIPTION_PLANS.standard.max_users,
      vehicles: SUBSCRIPTION_PLANS.standard.max_vehicles,
      contracts: SUBSCRIPTION_PLANS.standard.max_contracts
    }
  },
  {
    id: 'premium',
    name: SUBSCRIPTION_PLANS.premium.name,
    name_en: SUBSCRIPTION_PLANS.premium.name_en,
    icon: Star,
    price: SUBSCRIPTION_PLANS.premium.monthly_price_kwd,
    period: "شهرياً",
    description: "للشركات الكبيرة والمتقدمة",
    features: SUBSCRIPTION_PLANS.premium.features,
    popular: false,
    buttonText: "اشترك الآن",
    limits: {
      users: SUBSCRIPTION_PLANS.premium.max_users,
      vehicles: SUBSCRIPTION_PLANS.premium.max_vehicles,
      contracts: SUBSCRIPTION_PLANS.premium.max_contracts
    }
  },
  {
    id: 'enterprise',
    name: SUBSCRIPTION_PLANS.enterprise.name,
    name_en: SUBSCRIPTION_PLANS.enterprise.name_en,
    icon: Building,
    price: SUBSCRIPTION_PLANS.enterprise.monthly_price_kwd,
    period: "شهرياً",
    description: "للمؤسسات الكبيرة والحكومية",
    features: SUBSCRIPTION_PLANS.enterprise.features,
    popular: false,
    buttonText: "تواصل معنا",
    limits: {
      users: SUBSCRIPTION_PLANS.enterprise.max_users,
      vehicles: SUBSCRIPTION_PLANS.enterprise.max_vehicles,
      contracts: SUBSCRIPTION_PLANS.enterprise.max_contracts
    }
  }
];

export function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubscribe = (plan: typeof plans[0]) => {
    if (plan.id === 'enterprise') {
      // للباقة المؤسسية، نحتاج لتوجيه المستخدم للتواصل
      window.location.href = "mailto:sales@saptcogulf.com?subject=استفسار عن الباقة المؤسسية";
      return;
    }
    
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

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

        <div className="grid lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 ${
                plan.popular 
                  ? 'border-primary bg-card shadow-lg scale-105' 
                  : 'border-border bg-card'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 right-6 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  الأكثر اختياراً
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <plan.icon className="w-7 h-7" />
              </div>

              {/* Plan Details */}
              <h3 className="text-xl font-bold mb-1 text-card-foreground">
                {plan.name}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-card-foreground">
                    {formatPrice(plan.price)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>

              {/* Limits */}
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <div className="text-xs text-muted-foreground mb-2">الحدود المسموحة:</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-primary">{plan.limits.users}</div>
                    <div className="text-muted-foreground">مستخدم</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-primary">{plan.limits.vehicles}</div>
                    <div className="text-muted-foreground">مركبة</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-primary">{plan.limits.contracts}</div>
                    <div className="text-muted-foreground">عقد</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {plan.features.slice(0, 5).map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-card-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-xs text-muted-foreground">
                    و{plan.features.length - 5} مميزات أخرى...
                  </li>
                )}
              </ul>

              {/* CTA Button */}
              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'bg-primary hover:bg-primary/90' 
                    : 'variant-outline'
                }`}
                size="sm"
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