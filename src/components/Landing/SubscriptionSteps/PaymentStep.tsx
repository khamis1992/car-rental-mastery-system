
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  name: string;
  price: string;
  period: string;
}

interface PaymentStepProps {
  selectedPlan: Plan | null;
  tenantId: string | null;
  onSuccess: () => void;
}

export function PaymentStep({ selectedPlan, tenantId, onSuccess }: PaymentStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'sadad' | 'knet'>('sadad');
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!selectedPlan || !tenantId) return;

    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "تم الدفع بنجاح!",
        description: "تم تفعيل اشتراكك وإنشاء حسابك بنجاح",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "خطأ في عملية الدفع",
        description: "حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedPlan) return null;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CreditCard className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">إتمام عملية الدفع</h3>
        <p className="text-muted-foreground">
          اختر طريقة الدفع المناسبة لإتمام اشتراكك
        </p>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ملخص الطلب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>الباقة المختارة:</span>
            <span className="font-semibold">{selectedPlan.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>المبلغ:</span>
            <span className="font-semibold">
              {selectedPlan.price} {selectedPlan.price !== "مخصص" && "د.ك"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>الفترة:</span>
            <span className="text-muted-foreground">{selectedPlan.period}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>الإجمالي:</span>
              <span>
                {selectedPlan.price} {selectedPlan.price !== "مخصص" && "د.ك"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">طريقة الدفع</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                paymentMethod === 'sadad' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-primary/50'
              }`}
              onClick={() => setPaymentMethod('sadad')}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">SADAD</span>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  paymentMethod === 'sadad' ? 'border-primary bg-primary' : 'border-muted'
                }`} />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                الدفع الإلكتروني الآمن عبر SADAD
              </p>
            </div>

            <div
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                paymentMethod === 'knet' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-primary/50'
              }`}
              onClick={() => setPaymentMethod('knet')}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">K-Net</span>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  paymentMethod === 'knet' ? 'border-primary bg-primary' : 'border-muted'
                }`} />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                الدفع بالبطاقة البنكية الكويتية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trial Notice */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h4 className="font-medium text-green-800">فترة تجريبية مجانية</h4>
        </div>
        <p className="text-sm text-green-700">
          لن يتم خصم أي مبلغ خلال الـ 14 يوم الأولى. يمكنك إلغاء الاشتراك في أي وقت.
        </p>
      </div>

      {/* Payment Button */}
      <Button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full py-6 text-lg"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            جاري معالجة الدفع...
          </>
        ) : (
          `تأكيد الدفع - ${selectedPlan.price} ${selectedPlan.price !== "مخصص" ? "د.ك" : ""}`
        )}
      </Button>

      <div className="text-center text-xs text-muted-foreground">
        <p>عملية الدفع آمنة ومشفرة. بياناتك المالية محمية بأعلى معايير الأمان.</p>
      </div>
    </div>
  );
}
