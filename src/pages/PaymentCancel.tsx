import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowRight, RefreshCw, Home } from "lucide-react";

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(15);

  const tenantId = searchParams.get('tenant_id');

  useEffect(() => {
    // العد التنازلي للتوجيه التلقائي
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleRetryPayment = () => {
    // العودة لصفحة الأسعار لإعادة المحاولة
    navigate('/#pricing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-950/20 dark:to-orange-900/20 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-700 dark:text-red-400">
            تم إلغاء عملية الدفع
          </CardTitle>
          <p className="text-muted-foreground">
            لم يتم إتمام عملية الاشتراك
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* رسالة توضيحية */}
          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
              ماذا حدث؟
            </h3>
            <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
              <p>• تم إلغاء عملية الدفع من قبلك</p>
              <p>• لم يتم خصم أي مبلغ من حسابك</p>
              <p>• لم يتم تفعيل الاشتراك</p>
            </div>
          </div>

          {/* معلومات المرجع */}
          {tenantId && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">رقم المرجع:</span>
                <span className="font-mono text-xs">{tenantId.substring(0, 8)}...</span>
              </div>
            </div>
          )}

          {/* خيارات المتابعة */}
          <div className="space-y-3">
            <h3 className="font-semibold">ماذا تريد أن تفعل؟</h3>
            
            <Button 
              onClick={handleRetryPayment}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              إعادة المحاولة
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>

            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              العودة للصفحة الرئيسية
            </Button>
          </div>

          {/* نصائح */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              💡 نصائح للمحاولة التالية
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• تأكد من صحة بيانات البطاقة</p>
              <p>• تحقق من وجود رصيد كافي</p>
              <p>• جرب استخدام طريقة دفع أخرى</p>
            </div>
          </div>

          {/* معلومات الدعم */}
          <div className="text-xs text-center text-muted-foreground border-t pt-4 space-y-1">
            <p>تحتاج مساعدة؟</p>
            <p>
              <a href="mailto:support@saptcogulf.com" className="text-primary hover:underline">
                تواصل مع فريق الدعم
              </a>
              {' | '}
              <a href="tel:+96522222222" className="text-primary hover:underline">
                +965 2222 2222
              </a>
            </p>
            <p className="mt-2">
              سيتم توجيهك للصفحة الرئيسية خلال {countdown} ثانية
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}