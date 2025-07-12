import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useLandingContent } from "@/hooks/useLandingContent";

export function Footer() {
  const { getContentValue } = useLandingContent('footer');
  return <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4">fleetify</h3>
            <p className="text-primary-foreground/80 mb-6 leading-relaxed">
              {getContentValue('footer', 'company_description') || 'شركة ساپتكو الخليج الرائدة في مجال تأجير السيارات وحلول إدارة الأساطيل'}
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary-foreground/20 transition-colors cursor-pointer">
                <Facebook className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary-foreground/20 transition-colors cursor-pointer">
                <Twitter className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary-foreground/20 transition-colors cursor-pointer">
                <Instagram className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-primary-foreground/20 transition-colors cursor-pointer">
                <Linkedin className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  الرئيسية
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  المميزات
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  الأسعار
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  من نحن
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  تواصل معنا
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-6">الدعم</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  مركز المساعدة
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  الأسئلة الشائعة
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  دليل الاستخدام
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  سياسة الخصوصية
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  شروط الاستخدام
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-6">اشترك في النشرة</h4>
            <p className="text-primary-foreground/80 mb-4">
              احصل على آخر التحديثات والمميزات الجديدة
            </p>
            <div className="flex gap-2">
              <Input placeholder="بريدك الإلكتروني" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
              <Button variant="secondary" size="sm">
                اشترك
              </Button>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5" />
            <span>+965 2XXX XXXX</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" />
            <span>info@bashair-gulf.com</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5" />
            <span>الكويت العاصمة، شارع الخليج العربي</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-primary-foreground/20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-foreground/80">
              © 2024 {getContentValue('footer', 'copyright') || 'جميع الحقوق محفوظة - شركة ساپتكو الخليج'}
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground">
                سياسة الخصوصية
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground">
                شروط الاستخدام
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground">
                الدعم الفني
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
}