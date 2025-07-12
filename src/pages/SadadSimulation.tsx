import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, CheckCircle, XCircle, ArrowRight } from "lucide-react";

export default function SadadSimulation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const amount = searchParams.get('amount');
  const tenantId = searchParams.get('tenant_id');
  const planName = searchParams.get('plan');

  useEffect(() => {
    if (!amount || !tenantId) {
      toast({
        title: "خطأ في البيانات",
        description: "بيانات الدفع غير مكتملة",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [amount, tenantId, navigate, toast]);

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    
    try {
      // محاكاة معالجة الدفع
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "تم الدفع بنجاح!",
        description: "سيتم تفعيل حسابك خلال دقائق قليلة",
      });

      // توجيه إلى صفحة النجاح
      navigate(`/payment-success?tenant_id=${tenantId}&amount=${amount}&plan=${encodeURIComponent(planName || '')}`);
      
    } catch (error) {
      toast({
        title: "خطأ في معالجة الدفع",
        description: "حدث خطأ أثناء معالجة الدفع",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentCancel = () => {
    navigate(`/payment-cancel?tenant_id=${tenantId}`);
  };

  const displayAmount = amount ? (parseFloat(amount) / 100).toFixed(3) : '0.000';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            بوابة SADAD للدفع
          </CardTitle>
          <p className="text-muted-foreground">
            محاكاة بوابة الدفع الكويتية
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* تفاصيل الدفع */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">الباقة:</span>
              <span className="font-semibold">{decodeURIComponent(planName || '')}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">المبلغ:</span>
              <div className="text-xl font-bold text-primary">
                {displayAmount} د.ك
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">رقم المرجع:</span>
              <span className="text-sm font-mono">{tenantId?.substring(0, 8)}...</span>
            </div>
          </div>

          {/* رسالة الأمان */}
          <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-green-800 dark:text-green-200">
                دفع آمن ومضمون
              </p>
              <p className="text-green-700 dark:text-green-300">
                هذه محاكاة لبوابة SADAD الفعلية. في الواقع، ستدخل تفاصيل بطاقتك هنا.
              </p>
            </div>
          </div>

          {/* أزرار الدفع */}
          <div className="space-y-3">
            <Button 
              onClick={handlePaymentSuccess}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري معالجة الدفع...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  تأكيد الدفع (محاكاة نجاح)
                  <ArrowRight className="w-4 h-4 mr-2" />
                </div>
              )}
            </Button>

            <Button 
              onClick={handlePaymentCancel}
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isProcessing}
            >
              <XCircle className="w-5 h-5 mr-2" />
              إلغاء الدفع (محاكاة فشل)
            </Button>
          </div>

          {/* معلومات إضافية */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>⚠️ هذه صفحة تجريبية لمحاكاة عملية الدفع</p>
            <p>في النظام الفعلي، ستتم معالجة الدفع عبر بوابة SADAD الحقيقية</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}