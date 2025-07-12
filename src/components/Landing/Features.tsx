import { Car, Users, BarChart3, Shield, Clock } from "lucide-react";

const features = [
  {
    icon: Car,
    title: "إدارة الأسطول المتقدمة",
    description: "تتبع شامل للمركبات مع نظام صيانة ذكي ومراقبة الأداء في الوقت الفعلي",
    color: "text-blue-600 bg-blue-100"
  },
  {
    icon: Users,
    title: "إدارة العملاء المتكاملة",
    description: "قاعدة بيانات شاملة للعملاء مع تاريخ التعاملات وتقييم المخاطر",
    color: "text-green-600 bg-green-100"
  },
  {
    icon: BarChart3,
    title: "تقارير وتحليلات ذكية",
    description: "لوحات تحكم تفاعلية وتقارير مفصلة لاتخاذ قرارات مدروسة",
    color: "text-purple-600 bg-purple-100"
  },
  {
    icon: Shield,
    title: "أمان وحماية البيانات",
    description: "حماية متطورة للبيانات مع نسخ احتياطية آمنة وصلاحيات متدرجة",
    color: "text-red-600 bg-red-100"
  },
  {
    icon: Clock,
    title: "أتمتة العمليات",
    description: "أتمتة العقود والفواتير والتذكيرات لتوفير الوقت والجهد",
    color: "text-orange-600 bg-orange-100"
  }
];

export function Features() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            مميزات تجعلنا الأفضل
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            نظام متكامل يجمع بين التكنولوجيا المتطورة والفهم العميق لاحتياجات السوق الكويتي
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative p-8 bg-card rounded-2xl border border-border hover:shadow-elegant transition-all duration-300 hover:-translate-y-2"
            >
              <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold mb-4 text-card-foreground">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Decorative element */}
              <div className="absolute top-4 left-4 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Statistics Section */}
        <div className="mt-20 grid md:grid-cols-4 gap-8 text-center">
          <div className="p-6">
            <div className="text-4xl font-bold text-primary mb-2">٥٠٠+</div>
            <div className="text-muted-foreground">شركة عميلة</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-primary mb-2">١٠٠ك+</div>
            <div className="text-muted-foreground">عقد مُدار</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-primary mb-2">٩٩.٩%</div>
            <div className="text-muted-foreground">وقت التشغيل</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-primary mb-2">٢٤/٧</div>
            <div className="text-muted-foreground">دعم فني</div>
          </div>
        </div>
      </div>
    </section>
  );
}