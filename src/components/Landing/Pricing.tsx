import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Building } from "lucide-react";

const plans = [
  {
    name: "الباقة الأساسية",
    icon: Zap,
    price: "٢٩٩",
    period: "شهرياً",
    description: "مثالية للشركات الناشئة",
    features: [
      "إدارة حتى ٥٠ مركبة",
      "نظام العقود الأساسي",
      "تقارير شهرية",
      "دعم فني عبر البريد",
      "تطبيق الموبايل"
    ],
    popular: false,
    buttonText: "ابدأ الآن"
  },
  {
    name: "الباقة المتقدمة",
    icon: Crown,
    price: "٥٩٩",
    period: "شهرياً",
    description: "الأكثر شعبية للشركات المتوسطة",
    features: [
      "إدارة حتى ٢٠٠ مركبة",
      "نظام العقود المتقدم",
      "تقارير تفاعلية يومية",
      "دعم فني ٢٤/٧",
      "تطبيق موبايل متطور",
      "نظام GPS للتتبع",
      "إدارة الصيانة",
      "تكامل مع البنوك"
    ],
    popular: true,
    buttonText: "الأكثر شعبية"
  },
  {
    name: "الباقة المؤسسية",
    icon: Building,
    price: "مخصص",
    period: "حسب الاحتياج",
    description: "للمؤسسات الكبيرة والحكومية",
    features: [
      "مركبات غير محدودة",
      "تخصيص كامل للنظام",
      "تقارير متقدمة وذكية",
      "دعم فني مخصص",
      "تدريب شامل للفريق",
      "خوادم مخصصة",
      "أمان إضافي",
      "تكامل مع الأنظمة الحالية"
    ],
    popular: false,
    buttonText: "تواصل معنا"
  }
];

export function Pricing() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            خطط أسعار شفافة
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            اختر الباقة التي تناسب حجم عملك. جميع الباقات تشمل فترة تجريبية مجانية لمدة ١٤ يوم
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                {plan.features.map((feature, featureIndex) => (
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
    </section>
  );
}