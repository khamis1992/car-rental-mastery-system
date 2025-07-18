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
    icon: Shield,
    title: "أمان وحماية البيانات",
    description: "حماية متطورة للبيانات مع نسخ احتياطية آمنة وصلاحيات متدرجة",
    color: "text-red-600 bg-red-100"
  },
  {
    icon: BarChart3,
    title: "تقارير وتحليلات ذكية",
    description: "لوحات تحكم تفاعلية وتقارير مفصلة لاتخاذ قرارات مدروسة",
    color: "text-purple-600 bg-purple-100"
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative p-8 bg-white rounded-3xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center w-full max-w-sm h-full flex flex-col"
            >
              {/* Icon container */}
              <div className="flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-2xl ${feature.color} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                  <feature.icon className="w-10 h-10" />
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 leading-relaxed text-sm flex-grow">
                {feature.description}
              </p>
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