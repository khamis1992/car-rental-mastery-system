import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "أحمد الكندري",
    position: "مدير عام - شركة الخليج للتأجير",
    content: "نظام البشائر الخليجية غيّر طريقة إدارتنا للأسطول بالكامل. الآن نستطيع تتبع كل مركبة والتحكم في العمليات من مكان واحد. النتائج فاقت توقعاتنا.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
  },
  {
    name: "فاطمة العتيبي",
    position: "مديرة التشغيل - مؤسسة الكويت للنقل",
    content: "الدعم الفني متميز والنظام سهل الاستخدام. موظفونا تعلموا استخدامه في أقل من أسبوع. التقارير المالية أصبحت أكثر دقة ووضوحاً.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b182?w=150&h=150&fit=crop&crop=face"
  },
  {
    name: "محمد الرشيد",
    position: "صاحب شركة - الرشيد للتأجير",
    content: "استطعنا توفير 40% من الوقت المخصص للعمليات الإدارية. النظام ساعدنا في تحسين خدمة العملاء وزيادة الأرباح بشكل ملحوظ.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  }
];

export function Testimonials() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            ماذا يقول عملاؤنا
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            آراء حقيقية من عملائنا الذين يثقون في نظام البشائر الخليجية لإدارة أعمالهم
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-card p-8 rounded-2xl border border-border shadow-lg hover:shadow-elegant transition-all duration-300 relative"
            >
              {/* Quote Icon */}
              <Quote className="w-12 h-12 text-primary/20 mb-6" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-card-foreground leading-relaxed mb-8 text-lg">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-card-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.position}
                  </div>
                </div>
              </div>

              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-8">يثق بنا أكثر من ٥٠٠ شركة في دولة الكويت</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted rounded-lg p-4 h-16 flex items-center justify-center">
                <span className="text-muted-foreground font-semibold">شركة {i}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}