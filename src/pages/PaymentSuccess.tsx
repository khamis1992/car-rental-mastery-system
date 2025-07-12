import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Building, Mail, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(10);

  const tenantId = searchParams.get('tenant_id');
  const amount = searchParams.get('amount');
  const planName = searchParams.get('plan');

  useEffect(() => {
    // التحقق من تفعيل الحساب (محاكاة)
    const activateAccount = async () => {
      try {
        // في النظام الفعلي، هنا سيتم تحديث حالة المؤسسة في قاعدة البيانات
        console.log('Activating account for tenant:', tenantId);
        
        toast({
          title: "تم تفعيل حسابك بنجاح!",
          description: "يمكنك الآن الدخول إلى النظام",
        });
      } catch (error) {
        console.error('Error activating account:', error);
      }
    };

    if (tenantId) {
      activateAccount();
    }
  }, [tenantId, toast]);

  useEffect(() => {
    // العد التنازلي للتوجيه التلقائي
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/auth');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const displayAmount = amount ? (parseFloat(amount) / 100).toFixed(3) : '0.000';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
            تم الدفع بنجاح! 🎉
          </CardTitle>
          <p className="text-muted-foreground">
            مرحباً بك في منصة ساپتكو الخليج
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* تفاصيل الاشتراك */}
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
              <Building className="w-5 h-5" />
              تفاصيل الاشتراك
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الباقة:</span>
                <span className="font-semibold">{decodeURIComponent(planName || '')}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">المبلغ المدفوع:</span>
                <span className="font-bold text-green-600">{displayAmount} د.ك</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">رقم المرجع:</span>
                <span className="text-xs font-mono">{tenantId?.substring(0, 8)}...</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">تاريخ التفعيل:</span>
                <span className="font-semibold">{new Date().toLocaleDateString('ar-KW')}</span>
              </div>
            </div>
          </div>

          {/* الخطوات التالية */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              الخطوات التالية
            </h3>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>تم تفعيل حسابك وأصبح جاهزاً للاستخدام</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>ستصلك رسالة تأكيد عبر البريد الإلكتروني</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>يمكنك البدء في استخدام النظام فوراً</span>
              </div>
            </div>
          </div>

          {/* زر الدخول */}
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Mail className="w-5 h-5 mr-2" />
              الدخول إلى النظام
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              سيتم توجيهك تلقائياً خلال {countdown} ثانية
            </p>
          </div>

          {/* معلومات الدعم */}
          <div className="text-xs text-center text-muted-foreground border-t pt-4">
            <p>هل تحتاج مساعدة؟</p>
            <p>
              <a href="mailto:support@saptcogulf.com" className="text-primary hover:underline">
                تواصل مع فريق الدعم
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}