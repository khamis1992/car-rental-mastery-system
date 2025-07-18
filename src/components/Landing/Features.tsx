
import { Car, Users, BarChart3, Shield, Clock } from "lucide-react";

const features = [
  {
    icon: Car,
    title: "إدارة الأسطول المتقدمة",
    description: "تتبع شامل للمركبات مع نظام صيانة ذكي ومراقبة الأداء في الوقت الفعلي",
    color: "text-blue-600",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600"
  },
  {
    icon: Users,
    title: "إدارة العملاء المتكاملة",
    description: "قاعدة بيانات شاملة للعملاء مع تاريخ التعاملات وتقييم المخاطر",
    color: "text-emerald-600",
    bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600"
  },
  {
    icon: Shield,
    title: "أمان وحماية البيانات",
    description: "حماية متطورة للبيانات مع نسخ احتياطية آمنة وصلاحيات متدرجة",
    color: "text-red-600",
    bgColor: "bg-gradient-to-br from-red-50 to-red-100",
    iconBg: "bg-gradient-to-br from-red-500 to-red-600"
  },
  {
    icon: BarChart3,
    title: "تقارير وتحليلات ذكية",
    description: "لوحات تحكم تفاعلية وتقارير مفصلة لاتخاذ قرارات مدروسة",
    color: "text-purple-600",
    bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-600"
  },
  {
    icon: Clock,
    title: "أتمتة العمليات",
    description: "أتمتة العقود والفواتير والتذكيرات لتوفير الوقت والجهد",
    color: "text-orange-600",
    bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
    iconBg: "bg-gradient-to-br from-orange-500 to-orange-600"
  }
];

export function Features() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
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
              className={`group relative p-8 ${feature.bgColor} rounded-2xl border border-white/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-center backdrop-blur-sm`}
            >
              {/* خلفية متدرجة مخفية */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl"></div>
              
              {/* حاوية الأيقونة */}
              <div className="relative flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-xl ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
              </div>
              
              {/* العنوان */}
              <h3 className={`text-xl font-bold mb-4 ${feature.color} group-hover:text-opacity-90 transition-all duration-300`}>
                {feature.title}
              </h3>
              
              {/* الوصف */}
              <p className="text-gray-700 leading-relaxed text-sm font-medium">
                {feature.description}
              </p>

              {/* تأثير الحواف المضيئة */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>

        {/* قسم الإحصائيات */}
        <div className="mt-24 grid md:grid-cols-4 gap-8 text-center">
          <div className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl font-bold text-primary mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">٥٠٠+</div>
            <div className="text-muted-foreground font-medium">شركة عميلة</div>
          </div>
          <div className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl font-bold text-primary mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">١٠٠ك+</div>
            <div className="text-muted-foreground font-medium">عقد مُدار</div>
          </div>
          <div className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl font-bold text-primary mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">٩٩.٩%</div>
            <div className="text-muted-foreground font-medium">وقت التشغيل</div>
          </div>
          <div className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-4xl font-bold text-primary mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">٢٤/٧</div>
            <div className="text-muted-foreground font-medium">دعم فني</div>
          </div>
        </div>
      </div>
    </section>
  );
}
