import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export function Contact() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            تواصل معنا
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            فريقنا جاهز لمساعدتك في البدء. تواصل معنا للحصول على استشارة مجانية
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-card-foreground">
              أرسل لنا رسالة
            </h3>
            
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">
                    الاسم الكامل
                  </label>
                  <Input 
                    placeholder="أدخل اسمك الكامل"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-card-foreground">
                    رقم الهاتف
                  </label>
                  <Input 
                    placeholder="+965 XXXX XXXX"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">
                  البريد الإلكتروني
                </label>
                <Input 
                  type="email"
                  placeholder="example@company.com"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">
                  اسم الشركة
                </label>
                <Input 
                  placeholder="اسم شركتك أو مؤسستك"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">
                  الرسالة
                </label>
                <Textarea 
                  placeholder="أخبرنا عن احتياجاتك وكيف يمكننا مساعدتك"
                  rows={5}
                  className="w-full"
                />
              </div>

              <Button size="lg" className="w-full">
                إرسال الرسالة
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-foreground">
              معلومات التواصل
            </h3>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    هاتف
                  </h4>
                  <p className="text-muted-foreground">
                    +965 2XXX XXXX
                  </p>
                  <p className="text-muted-foreground">
                    +965 9XXX XXXX
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    البريد الإلكتروني
                  </h4>
                  <p className="text-muted-foreground">
                    info@bashair-gulf.com
                  </p>
                  <p className="text-muted-foreground">
                    support@bashair-gulf.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    العنوان
                  </h4>
                  <p className="text-muted-foreground">
                    الكويت العاصمة، شارع الخليج العربي
                    <br />
                    برج التجارة، الطابق الخامس
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    ساعات العمل
                  </h4>
                  <p className="text-muted-foreground">
                    الأحد - الخميس: ٨:٠٠ ص - ٦:٠٠ م
                    <br />
                    الجمعة - السبت: مغلق
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-primary/10 p-6 rounded-xl">
              <h4 className="font-bold text-foreground mb-2">
                هل تريد عرضاً توضيحياً مباشراً؟
              </h4>
              <p className="text-muted-foreground mb-4">
                احجز جلسة مجانية مع فريقنا لتتعرف على النظام
              </p>
              <Button variant="outline" className="w-full">
                احجز عرضاً توضيحياً
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}