
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, Shield, Zap } from "lucide-react";
import { useLandingContent } from "@/hooks/useLandingContent";
import { Link } from "react-router-dom";

export function Hero() {
  const { getContentValue } = useLandingContent('hero');
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-accent min-h-screen flex items-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-10 w-32 h-32 border-2 border-white/30 rounded-full"></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 border border-white/20 rotate-45"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 border border-white/20 rounded-full"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-right text-white">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              {getContentValue('hero', 'title') || 'نظام إدارة تأجير السيارات الأكثر تطوراً'}
              <br />
              <span className="text-accent-foreground">fleetify</span>
            </h1>
            
            <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-2xl">
              {getContentValue('hero', 'subtitle') || 'حلول متكاملة لإدارة أسطول السيارات مع تقنيات حديثة ونظام محاسبي متقدم'}
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Car className="w-5 h-5" />
                <span>إدارة الأسطول</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Shield className="w-5 h-5" />
                <span>أمان متطور</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Zap className="w-5 h-5" />
                <span>أداء سريع</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-4 bg-white text-primary hover:bg-white/90">
                  {getContentValue('hero', 'cta_text') || 'ابدأ الآن'}
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">لوحة التحكم الرئيسية</h3>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-l from-primary/20 to-transparent p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">إجمالي العقود النشطة</span>
                      <span className="text-2xl font-bold text-primary">٢٤٧</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-gray-800">١٨٥</div>
                      <div className="text-xs text-gray-600">مركبة متاحة</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-gray-800">٩٢%</div>
                      <div className="text-xs text-gray-600">معدل الاستخدام</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
